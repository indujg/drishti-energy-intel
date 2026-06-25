import { API_BASE } from '../constants';

export interface Vessel {
  id: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  type: string;
  cargo: string;
  origin: string;
  destination: string;
  eta: string;
  riskZone: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  time: string;
  risk: number;
  corridor: string;
  sentiment: string;
}

export interface SimulationImpacts {
  priceChange: number;
  transitDelayDays: number;
  affectedVolume: number;
  sprDaysRemaining: number;
  gdpImpact: number;
  powerSectorStress: number;
}

export interface ProcurementRecommendation {
  supplier: string;
  volume: string;
  route: string;
  cost: string;
  timeline: string;
  confidence: number;
}

export interface SimulationResult {
  scenario: {
    name: string;
    icon: string;
    impacts: SimulationImpacts;
  };
  procurement: {
    summary: string;
    recommendations: ProcurementRecommendation[];
  };
}

export interface SPRData {
  currentLevel: number;
  maxCapacity: number;
  daysRemaining: number;
  fillRate: number;
  lastUpdated: string;
  strategicBuffer: number;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchVessels(): Promise<Vessel[]> {
  const data = await apiFetch<{ vessels: Vessel[] }>('/api/vessels');
  return data.vessels;
}

export async function fetchNews(): Promise<NewsItem[]> {
  const data = await apiFetch<{ news: NewsItem[] }>('/api/news');
  return data.news;
}

export async function triggerSimulation(scenarioId: string): Promise<SimulationResult> {
  return apiFetch<SimulationResult>('/api/simulate', {
    method: 'POST',
    body: JSON.stringify({ scenarioId }),
  });
}

export async function resetSimulation(): Promise<void> {
  await apiFetch<unknown>('/api/simulate', { method: 'DELETE' });
}

export async function fetchSPR(): Promise<SPRData> {
  return apiFetch<SPRData>('/api/spr');
}
