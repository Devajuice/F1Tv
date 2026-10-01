import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from '../context/ThemeContext';
import {
  COMMON_TIME_ZONES,
  TIME_ZONE_MODE_HINT,
  TIME_ZONE_MODE_LABEL,
  useTimeZone,
  type TimeZoneMode,
} from '../context/TimeZoneContext';
import { formatZoneName } from '../lib/format';
import { Modal } from './ui/Modal';
import { Panel } from './ui/Panel';
import { Select } from './ui/Select';
import { cn } from '../lib/cn';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
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
 * Display preferences.
 *
 * Theme and time zone are the two settings that change what every timestamp on
 * the site means, so they live together in one dialog rather than as two
 * scattered toggles. Opened from the header on desktop and from the footer on
 * mobile, since the header's mobile layout has no room for a fourth action.
 */
export default function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { preference, setPreference, theme } = useTheme();
  const { mode, setMode, customTimeZone, setCustomTimeZone, deviceTimeZone } = useTimeZone();

  // The zone picker lists the device zone first so the common case of "just
  // like my device, but said explicitly" is one tap away.
  const [customDraft, setCustomDraft] = useState(customTimeZone);

  useEffect(() => {
    if (open) setCustomDraft(customTimeZone);
  }, [open, customTimeZone]);

  return (
    <Modal open={open} onClose={onClose} title="Display settings">
      <div className="flex flex-col gap-6">
        <Section title="Appearance">
          <div
            role="radiogroup"
            aria-label="Theme"
            className="grid grid-cols-3 gap-1.5 rounded-md bg-veil/[0.04] p-1"
          >
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = preference === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPreference(value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-sm px-3 py-2.5 text-[11px] font-semibold transition-all duration-250',
                    active
                      ? 'bg-ink-800 text-mist-50 shadow-[var(--shadow-card)]'
                      : 'text-mist-400 hover:bg-veil/6 hover:text-mist-200',
                  )}
                >
                  <Icon size={15} className={active ? 'text-f1-red' : undefined} />
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
                    'rounded-sm px-2 py-2.5 text-[11px] font-semibold transition-all duration-250',
                    active
                      ? 'bg-ink-800 text-mist-50 shadow-[var(--shadow-card)]'
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
              <Select
                label="Zone"
                searchable={false}
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

        <p className="text-[11px] leading-relaxed text-mist-500">
          Saved on this device. Nothing is sent anywhere.
        </p>
      </div>
    </Modal>
  );
}