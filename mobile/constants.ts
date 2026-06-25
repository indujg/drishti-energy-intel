import { Platform } from 'react-native';

export const API_BASE = 'https://drishti-intel.vercel.app';

export const SUPABASE_URL = 'https://bkzbcolbucbvnvyqveoe.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJremJjb2xidWNidm52eXF2ZW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMTkwOTEsImV4cCI6MjA5NzY5NTA5MX0.BtfV46CsCH32Vzw3aEGxazLMi059U_YQ3-mychZhgHA';

export const COLORS = {
  // --- NASA/mission-control palette ---
  bg: '#020c0c',
  panel: '#031818',
  borderDim: '#0a3535',
  borderAccent: '#00d4ff',
  cyan: '#00d4ff',
  green: '#00ff87',
  amber: '#ffb800',
  red: '#ff3232',
  purple: '#b06cff',
  textHigh: '#c0e8e8',
  textMid: '#2e6666',
  textLow: '#153030',
  segEmpty: '#0a2020',

  // --- backward-compat aliases used by lib/api and screens ---
  bgCard: '#031818',
  bgCardAlt: '#041f1f',
  border: '#0a3535',
  orange: '#ffb800',
  orangeDim: '#1a0d00',
  red2: '#ff3232',
  redDim: '#1a0000',
  green2: '#00ff87',
  greenDim: '#001a0d',
  blue: '#00d4ff',
  blueDim: '#001a22',
  yellow: '#ffb800',
  yellowDim: '#1a1000',
  purple2: '#b06cff',
  purpleDim: '#0d0022',
  textPrimary: '#c0e8e8',
  textSecondary: '#2e6666',
  textMuted: '#153030',
  tabBar: '#010c0c',
};

export const FONT_MONO: string = Platform.select<string>({
  ios: 'Courier New',
  android: 'monospace',
  default: 'monospace',
}) as string;

export const SCENARIOS = [
  {
    id: 'hormuz_closure',
    name: 'HORMUZ CLOSURE',
    icon: '⬡',
    color: '#ff3232',
    dimColor: '#1a0000',
    shortDesc: 'Strait blockade — 21% global oil transit at risk',
  },
  {
    id: 'redsea_shutdown',
    name: 'RED SEA ESCALATION',
    icon: '△',
    color: '#ffb800',
    dimColor: '#1a1000',
    shortDesc: 'Suez rerouting adds 14 days transit',
  },
  {
    id: 'opec_cut',
    name: 'OPEC+ CUT',
    icon: '◈',
    color: '#ffb800',
    dimColor: '#1a1000',
    shortDesc: '3 mb/d supply shock — price spike imminent',
  },
  {
    id: 'combined_crisis',
    name: 'COMBINED CRISIS',
    icon: '✦',
    color: '#b06cff',
    dimColor: '#0d0022',
    shortDesc: 'Multi-vector energy crisis scenario',
  },
];

export const CORRIDOR_RISKS = [
  { name: 'STRAIT OF HORMUZ', value: 78, color: '#ff3232' },
  { name: 'RED SEA / BAB-EL-MANDEB', value: 65, color: '#ffb800' },
  { name: 'CAPE OF GOOD HOPE', value: 12, color: '#00ff87' },
];
