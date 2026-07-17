export interface Team {
  name: string;
  color: string;
  logo?: string;
}

export const teamColors: Record<string, string> = {
  mercedes: '#27f4d2',
  red_bull: '#3671c6',
  ferrari: '#e8002d',
  mclaren: '#ff8000',
  aston_martin: '#229971',
  alpine: '#ff87bc',
  williams: '#64c4ff',
  haas: '#b6babd',
  'rb': '#6692ff',
  'kick_sauber': '#52e252',
};

export const teamNames: Record<string, string> = {
  mercedes: 'Mercedes',
  red_bull: 'Red Bull Racing',
  ferrari: 'Ferrari',
  mclaren: 'McLaren',
  aston_martin: 'Aston Martin',
  alpine: 'Alpine',
  williams: 'Williams',
  haas: 'Haas',
  rb: 'RB',
  kick_sauber: 'Kick Sauber',
};

export function getTeamColor(teamId: string): string {
  return teamColors[teamId] ?? '#6b7280';
}

export function getTeamName(teamId: string): string {
  return teamNames[teamId] ?? teamId;
}
