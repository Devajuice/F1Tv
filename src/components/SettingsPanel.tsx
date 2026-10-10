import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTheme, type ThemePreference } from '../context/ThemeContext';
import {
  COMMON_TIME_ZONES,
  TIME_ZONE_MODE_HINT,
  TIME_ZONE_MODE_LABEL,
  useTimeZone,
  type TimeZoneMode,
} from '../context/TimeZoneContext';
import { useNotifications } from '../context/NotificationsContext';
import { formatZoneName } from '../lib/format';
import { MorphingDialog } from './ui/MorphingDialog';
import { Panel } from './ui/Panel';
import { SpringSelect } from './ui/SpringSelect';
import { Button } from './ui/Button';
import { cn } from '../lib/cn';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

const ZONE_OPTIONS: TimeZoneMode[] = ['local', 'circuit', 'custom'];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-3">{title}</p>
      {children}
    </div>
  );
}

/**
 * Display preferences and session alerts.
 *
 * Everything that changes what the site shows or how it behaves lives here:
 * theme, time zone and the notification opt-in. Consolidating the alert control
 * means the header stays a thin navigation bar, and the whole thing stays
 * reachable on a phone where the header collapses.
 */
export default function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { preference, setPreference, theme } = useTheme();
  const { mode, setMode, customTimeZone, setCustomTimeZone, deviceTimeZone } = useTimeZone();
  const notifications = useNotifications();

  // The zone picker lists the device zone first so the common case of "just
  // like my device, but said explicitly" is one tap away.
  const [customDraft, setCustomDraft] = useState(customTimeZone);

  useEffect(() => {
    if (open) setCustomDraft(customTimeZone);
  }, [open, customTimeZone]);

  return (
    <MorphingDialog open={open} onClose={onClose} title="Display settings">
      <div className="flex flex-col gap-6">
        <Section title="Appearance">
          <div
            role="radiogroup"
            aria-label="Theme"
            className="grid grid-cols-3 gap-1.5 rounded-md bg-veil/[0.04] p-1"
          >
            {THEME_OPTIONS.map(({ value, label }) => {
              const active = preference === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPreference(value)}
                  className={cn(
                    'rounded-sm px-3 py-2.5 text-[11px] font-semibold transition-colors duration-200',
                    active
                      ? 'bg-ink-800 text-mist-50'
                      : 'text-mist-400 hover:bg-veil/6 hover:text-mist-200',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-mist-500">
            {preference === 'system'
              ? `Following your device — currently ${theme}.`
              : `Always ${theme}, regardless of your device setting.`}
          </p>
        </Section>

        <Section title="Session times">
          <div className="grid grid-cols-3 gap-1.5 rounded-md bg-veil/[0.04] p-1">
            {ZONE_OPTIONS.map((value) => {
              const active = mode === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMode(value)}
                  className={cn(
                    'rounded-sm px-2 py-2.5 text-[11px] font-semibold transition-colors duration-200',
                    active
                      ? 'bg-ink-800 text-mist-50'
                      : 'text-mist-400 hover:bg-veil/6 hover:text-mist-200',
                  )}
                >
                  {TIME_ZONE_MODE_LABEL[value]}
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-mist-500">
            {TIME_ZONE_MODE_HINT[mode]}
            {mode === 'local' && deviceTimeZone ? ` Now ${deviceTimeZone}.` : ''}
          </p>

          {mode === 'circuit' && (
            <Panel className="mt-3 px-4 py-3">
              <p className="text-[12px] leading-relaxed text-mist-400">
                A race at Marina Bay shows in Singapore time whether you are in Singapore or
                Seattle. Good for reading a schedule; bad if you want to know when you can
                actually sit down and watch.
              </p>
            </Panel>
          )}

          {mode === 'custom' && (
            <div className="mt-3">
              <SpringSelect
                label="Zone"
                value={customDraft}
                onChange={(zone) => {
                  setCustomDraft(zone);
                  setCustomTimeZone(zone);
                }}
                options={COMMON_TIME_ZONES.map((z) => ({
                  value: z.zone,
                  label: z.label,
                  meta: formatZoneName(z.zone),
                }))}
              />
              <p className="mt-2 text-[11px] text-mist-500">
                Currently {formatZoneName(customTimeZone)}.
              </p>
            </div>
          )}
        </Section>

        <Section title="Session alerts">
          <p className="text-[12px] leading-relaxed text-mist-400">
            {notifications.enabled
              ? "We'll notify you 5 minutes before each session and again when it goes live."
              : notifications.state === 'denied'
                ? 'Alerts are blocked for this site. Re-allow them in your browser settings, then reload.'
                : notifications.state === 'unsupported'
                  ? 'This browser does not support session alerts.'
                  : 'Get a browser alert 5 minutes before each session, and one when it goes live.'}
          </p>
          {notifications.state !== 'denied' && notifications.state !== 'unsupported' && (
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() =>
                notifications.enabled
                  ? notifications.disable()
                  : void notifications.enable()
              }
            >
              {notifications.enabled ? 'Turn off alerts' : 'Enable alerts'}
            </Button>
          )}
        </Section>

        <p className="text-[11px] leading-relaxed text-mist-500">
          Saved on this device. Nothing is sent anywhere.
        </p>
      </div>
    </MorphingDialog>
  );
}
