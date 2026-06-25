/**
 * WAR ROOM — index.tsx
 * NASA/mission-control dashboard for energy security telemetry.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import {
  COLORS,
  CORRIDOR_RISKS,
  FONT_MONO,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from '../../constants';
import { Panel, SegBar, StatusLight, DataRow, BigReadout } from '../../components/hud';
import { fetchSPR, fetchVessels, type SPRData } from '../../lib/api';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { width } = Dimensions.get('window');
const HALF = (width - 44) / 2;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatElapsed(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function riskLabel(score: number): string {
  if (score >= 70) return 'CRITICAL';
  if (score >= 40) return 'ELEVATED';
  return 'NOMINAL';
}

function riskColor(score: number): string {
  if (score >= 70) return COLORS.red;
  if (score >= 40) return COLORS.amber;
  return COLORS.green;
}

// ---------------------------------------------------------------------------
// Amber blink dot for warning states
// ---------------------------------------------------------------------------

function BlinkDot({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.step0,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.step0,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return (
    <Animated.View style={[styles.blinkDot, { backgroundColor: color, opacity: anim }]} />
  );
}

// ---------------------------------------------------------------------------
// Small metric data panel (2-column grid)
// ---------------------------------------------------------------------------

interface DataPanelProps {
  prefix: string;
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  sub?: string;
  color: string;
}

function DataPanel({ prefix, label, value, delta, deltaPositive, sub, color }: DataPanelProps) {
  return (
    <View style={[styles.dataPanel, { width: HALF }]}>
      {/* thin top color strip */}
      <View style={[styles.dataPanelStrip, { backgroundColor: color }]} />
      <Text style={styles.dataPanelPrefix}>{prefix}</Text>
      <Text style={[styles.dataPanelValue, { color }]}>{value}</Text>
      <Text style={styles.dataPanelLabel}>{label}</Text>
      {delta ? (
        <Text
          style={[
            styles.dataPanelDelta,
            { color: deltaPositive ? COLORS.green : COLORS.red },
          ]}
        >
          {delta}
        </Text>
      ) : null}
      {sub ? <Text style={styles.dataPanelSub}>{sub}</Text> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Corridor row with SegBar + StatusLight
// ---------------------------------------------------------------------------

interface CorridorRowProps {
  name: string;
  value: number;
  color: string;
}

function CorridorRow({ name, value, color }: CorridorRowProps) {
  const statusLabel =
    value >= 70 ? 'CRITICAL' : value >= 40 ? 'ELEVATED' : 'NOMINAL';
  return (
    <View style={styles.corridorRowWrap}>
      <View style={styles.corridorRowTop}>
        <Text style={styles.corridorName}>{name}</Text>
        <Text style={[styles.corridorVal, { color }]}>{value}</Text>
      </View>
      <SegBar value={value} color={color} height={7} />
      <View style={styles.corridorRowBottom}>
        <StatusLight color={color} label={statusLabel} blink={value >= 70} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function WarRoomScreen() {
  const [brentPrice, setBrentPrice] = useState(87.4);
  const [crisisActive, setCrisisActive] = useState(false);
  const [sprData, setSprData] = useState<SPRData | null>(null);
  const [vesselCount, setVesselCount] = useState(12);
  const [elapsed, setElapsed] = useState(0);
  const basePrice = useRef(87.4);

  const riskScore = crisisActive ? 84 : 47;
  const sprDays = sprData?.daysRemaining ?? 64;
  const hormuzRisk = crisisActive ? 94 : 78;
  const rc = riskColor(riskScore);
  const rl = riskLabel(riskScore);

  // Mission elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchSPR().then(setSprData).catch(() => null);
    fetchVessels()
      .then((v) => setVesselCount(v.length))
      .catch(() => null);
  }, []);

  // Brent price oscillation
  useEffect(() => {
    const iv = setInterval(() => {
      const spike = crisisActive ? 18 : 0;
      const jitter = (Math.random() - 0.5) * 1.2;
      setBrentPrice(+(basePrice.current + spike + jitter).toFixed(2));
    }, 1500);
    return () => clearInterval(iv);
  }, [crisisActive]);

  // Supabase realtime
  useEffect(() => {
    const ch = supabase
      .channel('mobile_war_room')
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'simulation_results' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setCrisisActive(!!(payload.new as any)?.active);
          }
          if (payload.eventType === 'DELETE') {
            setCrisisActive(false);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const corridorData = CORRIDOR_RISKS.map((c) => ({
    ...c,
    value: crisisActive ? Math.min(100, c.value + 15) : c.value,
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={styles.headerMeta}>
          <Text style={styles.headerMission}>
            {'MET: '}{formatElapsed(elapsed)}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <StatusLight color={COLORS.green} label="SYS: ONLINE" />
        </View>
      </View>

      {/* ── Crisis banner ── */}
      {crisisActive ? (
        <View style={styles.crisisBanner}>
          <BlinkDot color={COLORS.amber} />
          <Text style={styles.crisisBannerText}>
            {'⚠ THREAT CONDITION ELEVATED — SIMULATION ACTIVE'}
          </Text>
        </View>
      ) : null}

      {/* ── Composite Threat Index ── */}
      <Panel title="COMPOSITE THREAT INDEX">
        <BigReadout value={String(riskScore)} unit="THREAT INDEX" color={rc} />
        <SegBar value={riskScore} color={rc} height={10} />
        <View style={styles.threatStatusRow}>
          <StatusLight color={rc} label={rl} blink={riskScore >= 70} />
        </View>
      </Panel>

      {/* ── 2×2 data panels ── */}
      <View style={styles.gridRow}>
        <DataPanel
          prefix="DATA:"
          label="BRENT CRUDE"
          value={`$${brentPrice.toFixed(2)}`}
          delta={crisisActive ? '▲ +18.4%' : '▲ +2.1%'}
          deltaPositive={false}
          color={crisisActive ? COLORS.red : COLORS.amber}
        />
        <DataPanel
          prefix="SYS:"
          label="SPR BUFFER"
          value={`${sprDays}D`}
          sub={`${sprData?.currentLevel ?? 346}M BBL`}
          color={sprDays < 50 ? COLORS.red : COLORS.green}
        />
      </View>
      <View style={styles.gridRow}>
        <DataPanel
          prefix="ASSET:"
          label="ACTIVE ASSETS"
          value={String(vesselCount)}
          sub="VESSELS TRACKED"
          color={COLORS.cyan}
        />
        <DataPanel
          prefix="SIGINT:"
          label="HORMUZ INDEX"
          value={String(hormuzRisk)}
          sub={hormuzRisk >= 80 ? 'CRITICAL' : 'HIGH'}
          color={hormuzRisk >= 80 ? COLORS.red : COLORS.amber}
        />
      </View>

      {/* ── Corridor Risk Telemetry ── */}
      <Panel title="CORRIDOR RISK TELEMETRY">
        {corridorData.map((c) => (
          <CorridorRow key={c.name} name={c.name} value={c.value} color={c.color} />
        ))}
      </Panel>

      {/* ── Footer status ── */}
      <View style={styles.footerRow}>
        <StatusLight color={COLORS.green} label="API ONLINE" />
        <StatusLight color={COLORS.cyan} label="RT SYNC" blink />
        <StatusLight color={COLORS.green} label="ASSETS LOCKED" />
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 10,
    paddingBottom: 32,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDim,
    marginBottom: 10,
    gap: 8,
  },
  headerLogo: {
    width: 110,
    height: 55,
  },
  headerMeta: {
    flex: 1,
  },
  headerMission: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    color: COLORS.textMid,
    letterSpacing: 1.5,
  },
  headerRight: {
    alignItems: 'flex-end',
  },

  // Crisis banner
  crisisBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.amber,
    backgroundColor: '#1a0d00',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 0,
  },
  crisisBannerText: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.amber,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    flexShrink: 1,
  },

  // Threat status
  threatStatusRow: {
    marginTop: 8,
    alignItems: 'center',
  },

  // 2×2 grid
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  dataPanel: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.borderDim,
    borderRadius: 0,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 0,
  },
  dataPanelStrip: {
    height: 2,
    marginHorizontal: -10,
    marginBottom: 8,
  },
  dataPanelPrefix: {
    fontFamily: FONT_MONO,
    fontSize: 8,
    color: COLORS.textLow,
    letterSpacing: 2,
    marginBottom: 2,
  },
  dataPanelValue: {
    fontFamily: FONT_MONO,
    fontSize: 22,
    letterSpacing: 1,
    marginBottom: 2,
  },
  dataPanelLabel: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    color: COLORS.textMid,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  dataPanelDelta: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 3,
  },
  dataPanelSub: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    color: COLORS.textMid,
    letterSpacing: 1,
    marginTop: 2,
  },

  // Corridor rows
  corridorRowWrap: {
    marginBottom: 12,
  },
  corridorRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  corridorName: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.textHigh,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  corridorVal: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    letterSpacing: 1,
  },
  corridorRowBottom: {
    marginTop: 5,
  },

  // Blink dot
  blinkDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDim,
    marginTop: 4,
  },
});
