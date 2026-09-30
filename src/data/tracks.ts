/**
 * Circuit artwork from the official formula1.com CDN.
 *
 * F1's CDN keys artwork by a display name ("Emilia Romagna", "Las Vegas")
 * that matches neither OpenF1's `circuit_short_name` ("Imola", "Las%20Vegas")
 * nor Jolpica's `locality` ("Imola", "Las Vegas"). This table maps every
 * spelling onto the CDN slug, normalised so casing and spacing don't matter.
 */

const CDN_BASE =
  'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/Track icons 4x3';

/** Normalised input -> CDN slug (already URL-safe). */
const SLUGS: Record<string, string> = {
  // --- OpenF1 circuit_short_name ---
  sakhir: 'Bahrain',
  melbourne: 'Australia',
  shanghai: 'China',
  shanghai_china: 'China',
  suzuka: 'Japan',
  miami: 'Miami',
  miami_gardens: 'Miami',
  imola: 'Emilia%20Romagna',
  monaco: 'Monaco',
  monte_carlo: 'Monaco',
  catalunya: 'Spain',
  barcelona: 'Spain',
  madra: 'Spain',
  montreal: 'Canada',
  spielberg: 'Austria',
  silverstone: 'Great%20Britain',
  silverstone_circuit: 'Great%20Britain',
  spa_francorchamps: 'Belgium',
  hungaroring: 'Hungary',
  zandvoort: 'Netherlands',
  monza: 'Italy',
  baku: 'Azerbaijan',
  marina_bay: 'Singapore',
  singapore: 'Singapore',
  austin: 'USA',
  mexico_city: 'Mexico',
  mexico: 'Mexico',
  interlagos: 'Brazil',
  sao_paulo: 'Brazil',
  sao_paulo_brazil: 'Brazil',
  las_vegas: 'Las%20Vegas',
  lusail: 'Qatar',
  yas_marina_circuit: 'Abu%20Dhabi',
  yas_island: 'Abu%20Dhabi',
  jeddah: 'Saudi%20Arabia',
  jeddah_circuit: 'Saudi%20Arabia',
  yeongam: 'Korea',
  buddh: 'India',
  buddh_international_circuit: 'India',
  sochi: 'Russia',
  portimau: 'Portugal',
  algarve: 'Portugal',
  buddh_airfield: 'India',
  // --- Jolpica locality forms ---
  great_britain: 'Great%20Britain',
  usa: 'USA',
  abudhabi: 'Abu%20Dhabi',
  abu_dhabi: 'Abu%20Dhabi',
  spa: 'Belgium',
  soa_paulo: 'Brazil',
  madras: 'India',
  // --- Display names that are already valid CDN slugs ---
  bahrain: 'Bahrain',
  australia: 'Australia',
  china: 'China',
  japan: 'Japan',
  miami_gardens_fl: 'Miami',
  emilia_romagna: 'Emilia%20Romagna',
  spain: 'Spain',
  canada: 'Canada',
  austria: 'Austria',
  belgium: 'Belgium',
  hungary: 'Hungary',
  netherlands: 'Netherlands',
  italy: 'Italy',
  azerbaijan: 'Azerbaijan',
  qatar: 'Qatar',
  saudi_arabia: 'Saudi%20Arabia',
  korea: 'Korea',
  india: 'India',
  brazil: 'Brazil',
  mexico_city_mexico: 'Mexico',
  vegas: 'Las%20Vegas',
};

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/%20/g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Circuit thumbnail URL, or null when we have no mapping for it. */
export function getTrackImageUrl(circuit: string | null | undefined): string | null {
  if (!circuit) return null;
  const slug = SLUGS[normalise(circuit)];
  if (!slug) return null;
  return `${CDN_BASE}/${slug}%20carbon.png`;
}
