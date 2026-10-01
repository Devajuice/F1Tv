import { defineConfig, loadEnv, type Plugin, type PreviewServer, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { ServerResponse } from 'node:http'

/**
 * Shared by `server` and `preview`. `vite preview` ignores `server.proxy`, so
 * without this `npm run preview` 404s every /api request and each page renders
 * an empty table.
 */
const proxy = {
  '/api/openf1': {
    target: 'https://api.openf1.org/v1',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api\/openf1/, ''),
  },
  '/api/jolpica': {
    target: 'https://api.jolpi.ca/ergast/f1',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api\/jolpica/, ''),
  },
}

/**
 * Mounts a real Vercel serverless function (`api/<name>.js`) in the dev and
 * preview servers, which do not run functions themselves.
 *
 * Without this, anything served by a function either 404s locally (the News
 * page) or needs a stub that diverges from production (the Highlights page used
 * to carry one that always returned zero videos). Running the actual handler
 * behind a small Express-shaped shim means there is one code path, and a bug
 * in `api/` shows up on `npm run dev` instead of after a deploy.
 *
 * `YOUTUBE_API_KEY` is read from `.env` here. Note it has no `VITE_` prefix, so
 * it is never exposed to the browser bundle; only the middleware sees it.
 */
function localFunctions(): Plugin {
  const mount = (server: ViteDevServer | PreviewServer, apiKey: string | undefined) => {
    const send = (res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      for (const [key, value] of Object.entries(headers)) res.setHeader(key, value)
      res.end(JSON.stringify(body))
    }

    /**
     * The subset of the Vercel `VercelRequest`/`VercelResponse` surface the
     * handlers in `api/` actually use. Both call `status`, `json` and
     * `setHeader`, so the shim has to cover all three or the handler throws a
     * TypeError and takes the dev server down with it.
     *
     * `setHeader` collects into a plain object rather than writing straight to
     * the Node response: the handler runs before `send`, so the values are
     * replayed onto the real response once the status and body are known.
     */
    const createShim = () => {
      let status = 200
      let payload: unknown
      const headers: Record<string, string> = {}
      const vres = {
        status(code: number) {
          status = code
          return vres
        },
        json(body: unknown) {
          payload = body
          return vres
        },
        setHeader(key: string, value: string) {
          headers[key] = value
          return vres
        },
      }
      return { vres, headers, getStatus: () => status, getPayload: () => payload }
    }

    /**
     * Vite's connect middleware does not isolate an async handler: a rejected
     * promise becomes an unhandled rejection and kills the process, which is
     * why a single bad request to /api/youtube was taking the whole dev server
     * down. A failure here should cost one 500, not the session.
     */
    const guard =
      (fallback: unknown) =>
      async (run: () => Promise<void>, res: ServerResponse): Promise<void> => {
        try {
          await run()
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          console.error('[local-functions]', message)
          send(res, 500, { error: message, ...(fallback as object) })
        }
      }

    server.middlewares.use('/api/news', async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://localhost')

      await guard({ articles: [], cached: false })(async () => {
        const { default: handler } = await import('./api/news.js')
        const { vres, headers, getStatus, getPayload } = createShim()
        await handler({ method: req.method ?? 'GET', url: url.pathname, query: {} }, vres)
        send(res, getStatus(), getPayload() ?? { articles: [], cached: false }, headers)
      }, res)
    })

    server.middlewares.use('/api/youtube', async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://localhost')

      if (!apiKey) {
        send(res, 500, {
          error:
            'YOUTUBE_API_KEY is not set. Add it to .env, and to the project environment on Vercel.',
          videos: [],
          nextPageToken: null,
        })
        return
      }

      // The handler reads the key from process.env, exactly as it does on
      // Vercel.
      process.env.YOUTUBE_API_KEY = apiKey

      const query: Record<string, string> = {}
      for (const [key, value] of url.searchParams) query[key] = value

      await guard({ videos: [], nextPageToken: null })(async () => {
        const { default: handler } = await import('./api/youtube.js')
        const { vres, headers, getStatus, getPayload } = createShim()
        await handler({ query, method: 'GET', url: url.pathname }, vres)
        send(res, getStatus(), getPayload() ?? { videos: [], nextPageToken: null }, headers)
      }, res)
    })
  }

  return {
    name: 'local-serverless-functions',
    apply: 'serve' as const,
    configureServer(server: ViteDevServer) {
      const env = loadEnv('', process.cwd(), 'YOUTUBE_API_KEY')
      mount(server, env.YOUTUBE_API_KEY)
    },
    configurePreviewServer(server: PreviewServer) {
      const env = loadEnv('', process.cwd(), 'YOUTUBE_API_KEY')
      mount(server, env.YOUTUBE_API_KEY)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localFunctions()],
  server: { proxy },
  preview: { proxy },
  build: {
    rollupOptions: {
      output: {
        // Keep the long-lived vendor code out of the per-route chunks.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)/.test(id)) {
            return 'react'
          }
          if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)/.test(id)) {
            return 'motion'
          }
          return
        },
      },
    },
  },
})
