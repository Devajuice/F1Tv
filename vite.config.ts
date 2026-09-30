import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

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
 * `/api/youtube` is a Vercel serverless function (`api/youtube.js`), which the
 * dev and preview servers do not run. Rather than keep a stub that always
 * returns zero videos — which made the Highlights page look broken locally
 * while working in production — this mounts the *real* handler behind a tiny
 * Express-shaped shim, so local and production share one code path.
 *
 * `YOUTUBE_API_KEY` is read from `.env` here. Note it has no `VITE_` prefix, so
 * it is never exposed to the browser bundle; only the middleware sees it.
 */
function youtubeLocalApi(): Plugin {
  const middleware = (apiKey: string | undefined) =>
    async (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? '/', 'http://localhost')
      const send = (status: number, body: unknown) => {
        res.statusCode = status
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(body))
      }

      if (!apiKey) {
        send(500, {
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

      const { default: handler } = await import('./api/youtube.js')
      const query: Record<string, string> = {}
      for (const [key, value] of url.searchParams) query[key] = value

      let status = 200
      let payload: unknown
      const vres = {
        status(code: number) {
          status = code
          return vres
        },
        json(body: unknown) {
          payload = body
          return vres
        },
      }

      await handler({ query, method: 'GET', url: url.pathname }, vres)
      send(status, payload ?? { videos: [], nextPageToken: null })
    }

  return {
    name: 'youtube-local-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv('', process.cwd(), 'YOUTUBE_API_KEY')
      server.middlewares.use('/api/youtube', middleware(env.YOUTUBE_API_KEY))
    },
    configurePreviewServer(server) {
      const env = loadEnv('', process.cwd(), 'YOUTUBE_API_KEY')
      server.middlewares.use('/api/youtube', middleware(env.YOUTUBE_API_KEY))
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), youtubeLocalApi()],
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
