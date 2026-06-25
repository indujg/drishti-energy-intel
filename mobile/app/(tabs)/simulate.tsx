/**
 * SCENARIO DEPLOY — simulate.tsx
 * Crisis simulation selector + AI procurement telemetry.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { COLORS, FONT_MONO, SCENARIOS } from '../../constants';
import { Panel, SegBar, DataRow, BigReadout } from '../../components/hud';
import { triggerSimulation, resetSimulation, type SimulationResult } from '../../lib/api';

const { width } = Dimensions.get('window');
const CARD_W = (width - 36) / 2;

// ---------------------------------------------------------------------------
// Animated loading dots  "INITIATING SIMULATION..."
// ---------------------------------------------------------------------------

function LoadingDots() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 3,
        duration: 900,
        useNativeDriver: false,
        easing: Easing.linear,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % 4), 300);
    return () => clearInterval(id);
  }, []);

  const dots = '.'.repeat(frame);
  const pad = ' '.repeat(3 - frame);

  return (
    <View style={styles.loadingRow}>
      <Text style={styles.loadingText}>
        {'INITIATING SIMULATION' + dots + pad}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Scenario card
// ---------------------------------------------------------------------------

interface ScenarioCardProps {
  id: string;
  name: string;
  icon: string;
  color: string;
  dimColor: string;
  shortDesc: string;
  isActive: boolean;
  disabled: boolean;
  onPress: () => void;
}

function ScenarioCard({
  name,
  icon,
  color,
  dimColor,
  shortDesc,
  isActive,
  disabled,
  onPress,
}: ScenarioCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.scenarioCard,
        { width: CARD_W },
        { borderColor: isActive ? color : COLORS.borderDim },
        isActive && { backgroundColor: dimColor },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={disabled}
    >
      {/* top color strip */}
      <View style={[styles.scenarioStrip, { backgroundColor: color }]} />
      <Text style={[styles.scenarioIcon, { color }]}>{icon}</Text>
      <Text style={[styles.scenarioName, { color: isActive ? color : COLORS.textHigh }]}>
        {name}
      </Text>
      <Text style={styles.scenarioDesc}>{shortDesc}</Text>
      {isActive ? (
        <View style={[styles.activeBadge, { borderColor: color }]}>
          <Text style={[styles.activeBadgeText, { color }]}>[ ACTIVE ]</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Full-screen crisis alert modal
// ---------------------------------------------------------------------------

interface CrisisModalProps {
  visible: boolean;
  result: SimulationResult | null;
  scenarioColor: string;
  onDismiss: () => void;
}

function CrisisModal({ visible, result, scenarioColor, onDismiss }: CrisisModalProps) {
  if (!result) return null;
  const { scenario } = result;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { borderColor: scenarioColor }]}>
          {/* corner bracket decorations */}
          <View style={[styles.mCornerTL, { borderColor: scenarioColor }]} />
          <View style={[styles.mCornerTR, { borderColor: scenarioColor }]} />
          <View style={[styles.mCornerBL, { borderColor: scenarioColor }]} />
          <View style={[styles.mCornerBR, { borderColor: scenarioColor }]} />

          <Text style={styles.modalAlertLabel}>{'[ CRISIS ALERT ]'}</Text>
          <Text style={[styles.modalIcon, { color: scenarioColor }]}>{scenario.icon}</Text>
          <Text style={[styles.modalTitle, { color: scenarioColor }]}>{scenario.name}</Text>

          <View style={styles.modalReadoutsRow}>
            <View style={styles.modalReadoutItem}>
              <BigReadout
                value={`+${scenario.impacts.priceChange}`}
                unit="PRICE %"
                color={COLORS.red}
              />
            </View>
            <View style={styles.modalReadoutItem}>
              <BigReadout
                value={String(scenario.impacts.transitDelayDays)}
                unit="DELAY DAYS"
                color={COLORS.amber}
              />
            </View>
            <View style={styles.modalReadoutItem}>
              <BigReadout
                value={String(scenario.impacts.gdpImpact)}
                unit="GDP HIT %"
                color={COLORS.amber}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.acknowledgeBtn, { borderColor: scenarioColor }]}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={[styles.acknowledgeBtnText, { color: scenarioColor }]}>
              {'[ ACKNOWLEDGE ]'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function SimulateScreen() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeScenario = SCENARIOS.find((s) => s.id === activeId) ?? null;

  async function handleScenario(scenarioId: string) {
    if (loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveId(scenarioId);
    try {
      const res = await triggerSimulation(scenarioId);
      setResult(res);
      setModalVisible(true);
      setTimeout(() => setModalVisible(false), 4000);
    } catch {
      setError('SIM FAILED — CHECK NETWORK CONNECTION');
      setActiveId(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (loading) return;
    setLoading(true);
    try {
      await resetSimulation();
      setResult(null);
      setActiveId(null);
      setError(null);
    } catch {
      setError('ABORT FAILED — RETRY');
    } finally {
      setLoading(false);
    }
  }

  const topRecs = result?.procurement.recommendations.slice(0, 3) ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <CrisisModal
        visible={modalVisible}
        result={result}
        scenarioColor={activeScenario?.color ?? COLORS.amber}
        onDismiss={() => setModalVisible(false)}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SCENARIO DEPLOY</Text>
        <Text style={styles.headerSub}>SELECT CRISIS SIMULATION VECTOR</Text>
      </View>

      {/* ── Error banner ── */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* ── Scenario 2×2 grid ── */}
      <View style={styles.scenarioGrid}>
        {SCENARIOS.map((s) => (
          <ScenarioCard
            key={s.id}
            id={s.id}
            name={s.name}
            icon={s.icon}
            color={s.color}
            dimColor={s.dimColor}
            shortDesc={s.shortDesc}
            isActive={activeId === s.id}
            disabled={loading}
            onPress={() => handleScenario(s.id)}
          />
        ))}
      </View>

      {/* ── Loading ── */}
      {loading ? <LoadingDots /> : null}

      {/* ── Impact telemetry ── */}
      {result && !loading ? (
        <>
          <Panel title="IMPACT TELEMETRY">
            <DataRow
              label="PRICE DELTA"
              value={`+${result.scenario.impacts.priceChange}%`}
              valueColor={COLORS.red}
            />
            <DataRow
              label="TRANSIT DELAY"
              value={`${result.scenario.impacts.transitDelayDays} DAYS`}
              valueColor={COLORS.amber}
            />
            <DataRow
              label="SPR REMAINING"
              value={`${result.scenario.impacts.sprDaysRemaining}D`}
              valueColor={COLORS.amber}
            />
            <DataRow
              label="GDP IMPACT"
              value={`${result.scenario.impacts.gdpImpact}%`}
              valueColor={COLORS.red}
            />
            <DataRow
              label="POWER STRESS"
              value={
                result.scenario.impacts.priceChange >= 20
                  ? 'CRITICAL'
                  : result.scenario.impacts.priceChange >= 10
                  ? 'ELEVATED'
                  : 'NOMINAL'
              }
              valueColor={
                result.scenario.impacts.priceChange >= 20
                  ? COLORS.red
                  : result.scenario.impacts.priceChange >= 10
                  ? COLORS.amber
                  : COLORS.green
              }
            />
          </Panel>

          {/* ── AI Procurement Directive ── */}
          <Panel title="AI PROCUREMENT DIRECTIVE" titleColor={COLORS.purple}>
            <Text style={styles.procSummary}>{result.procurement.summary}</Text>
          </Panel>

          {/* ── Mission Recommendations ── */}
          {topRecs.length > 0 ? (
            <Panel title="MISSION RECOMMENDATIONS">
              {topRecs.map((rec, i) => (
                <View key={i} style={styles.recCard}>
                  <Text style={styles.recSupplier}>{rec.supplier}</Text>
                  <View style={styles.recConfRow}>
                    <Text style={styles.recConfLabel}>CONFIDENCE</Text>
                    <Text
                      style={[
                        styles.recConfValue,
                        {
                          color:
                            rec.confidence >= 75
                              ? COLORS.green
                              : rec.confidence >= 50
                              ? COLORS.amber
                              : COLORS.red,
                        },
                      ]}
                    >
                      {rec.confidence}%
                    </Text>
                  </View>
                  <SegBar
                    value={rec.confidence}
                    color={
                      rec.confidence >= 75
                        ? COLORS.green
                        : rec.confidence >= 50
                        ? COLORS.amber
                        : COLORS.red
                    }
                    height={6}
                  />
                  <View style={styles.recDataRows}>
                    <DataRow label="SUPPLIER" value={rec.supplier} />
                    <DataRow label="ROUTE" value={rec.route} />
                    <DataRow label="VOLUME" value={rec.volume} />
                    <DataRow label="COST" value={rec.cost} />
                    <DataRow label="TIMELINE" value={rec.timeline} />
                  </View>
                  {i < topRecs.length - 1 ? <View style={styles.recDivider} /> : null}
                </View>
              ))}
            </Panel>
          ) : null}

          {/* ── Abort button ── */}
          <TouchableOpacity
            style={styles.abortBtn}
            onPress={handleReset}
            activeOpacity={0.8}
          >
            <Text style={styles.abortBtnText}>{'[ ABORT SIMULATION ]'}</Text>
          </TouchableOpacity>
        </>
      ) : null}
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
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDim,
    marginBottom: 14,
  },
  headerTitle: {
    fontFamily: FONT_MONO,
    fontSize: 22,
    color: COLORS.cyan,
    letterSpacing: 5,
    textTransform: 'uppercase',
  },
  headerSub: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    color: COLORS.textMid,
    letterSpacing: 2,
    marginTop: 5,
    textTransform: 'uppercase',
  },

  // Error
  errorBanner: {
    borderWidth: 1,
    borderColor: COLORS.red,
    backgroundColor: '#1a0000',
    borderRadius: 0,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.red,
    letterSpacing: 1.5,
  },

  // Scenario grid
  scenarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  scenarioCard: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingBottom: 12,
    paddingTop: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  scenarioStrip: {
    height: 2,
    marginHorizontal: -10,
    marginBottom: 10,
  },
  scenarioIcon: {
    fontFamily: FONT_MONO,
    fontSize: 22,
    marginBottom: 6,
    letterSpacing: 0,
  },
  scenarioName: {
    fontFamily: FONT_MONO,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  scenarioDesc: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    color: COLORS.textMid,
    lineHeight: 14,
    letterSpacing: 0.5,
  },
  activeBadge: {
    marginTop: 8,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  activeBadgeText: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    letterSpacing: 2,
  },

  // Loading
  loadingRow: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontFamily: FONT_MONO,
    fontSize: 11,
    color: COLORS.amber,
    letterSpacing: 2,
  },

  // Procurement summary
  procSummary: {
    fontFamily: FONT_MONO,
    fontSize: 11,
    color: COLORS.textHigh,
    lineHeight: 18,
    letterSpacing: 0.5,
  },

  // Rec cards
  recCard: {
    marginBottom: 4,
  },
  recSupplier: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    color: COLORS.cyan,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  recConfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recConfLabel: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    color: COLORS.textMid,
    letterSpacing: 2,
  },
  recConfValue: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    letterSpacing: 1,
  },
  recDataRows: {
    marginTop: 8,
  },
  recDivider: {
    height: 1,
    backgroundColor: COLORS.borderDim,
    marginVertical: 10,
  },

  // Abort button
  abortBtn: {
    borderWidth: 1,
    borderColor: COLORS.red,
    backgroundColor: '#1a0000',
    borderRadius: 0,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  abortBtnText: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    color: COLORS.red,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.panel,
    borderWidth: 2,
    borderRadius: 0,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  // Modal corner brackets
  mCornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 16,
    height: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRadius: 0,
  },
  mCornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderRadius: 0,
  },
  mCornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 16,
    height: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderRadius: 0,
  },
  mCornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderRadius: 0,
  },
  modalAlertLabel: {
    fontFamily: FONT_MONO,
    fontSize: 11,
    color: COLORS.red,
    letterSpacing: 3,
    marginBottom: 14,
  },
  modalIcon: {
    fontFamily: FONT_MONO,
    fontSize: 36,
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: FONT_MONO,
    fontSize: 16,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalReadoutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  modalReadoutItem: {
    flex: 1,
    alignItems: 'center',
  },
  acknowledgeBtn: {
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  acknowledgeBtnText: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
