/**
 * SIGINT FEED — intel.tsx
 * Geopolitical signal intelligence feed with risk scoring.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { COLORS, FONT_MONO } from '../../constants';
import { Panel, SegBar, StatusLight } from '../../components/hud';
import { fetchNews, type NewsItem } from '../../lib/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function riskColor(risk: number): string {
  if (risk >= 70) return COLORS.red;
  if (risk >= 40) return COLORS.amber;
  return COLORS.green;
}

function sentimentColor(s: string): string {
  const lower = (s ?? '').toLowerCase();
  if (lower === 'negative') return COLORS.red;
  if (lower === 'neutral') return COLORS.amber;
  return COLORS.green;
}

// ---------------------------------------------------------------------------
// Blinking monitoring dot
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
  return <Animated.View style={[styles.blinkDot, { backgroundColor: color, opacity: anim }]} />;
}

// ---------------------------------------------------------------------------
// Intel card
// ---------------------------------------------------------------------------

function IntelCard({ item }: { item: NewsItem }) {
  const rc = riskColor(item.risk);
  const sc = sentimentColor(item.sentiment);
  return (
    <View style={[styles.card, { borderLeftColor: rc }]}>
      {/* risk score badge + headline */}
      <View style={styles.cardTop}>
        <View style={[styles.riskBadge, { borderColor: rc }]}>
          <Text style={[styles.riskScore, { color: rc }]}>
            {String(item.risk).padStart(2, '0')}
          </Text>
        </View>
        <Text style={styles.headline} numberOfLines={3}>
          {item.headline}
        </Text>
      </View>

      {/* source · time row */}
      <View style={styles.metaRow}>
        <Text style={[styles.sourceText, { color: COLORS.cyan }]}>{item.source}</Text>
        <Text style={styles.metaSep}> · </Text>
        <Text style={styles.timeText}>{item.time}</Text>
        <View style={styles.metaSpacer} />
        {item.corridor ? (
          <View style={styles.corridorTag}>
            <Text style={styles.corridorTagText}>{item.corridor.toUpperCase()}</Text>
          </View>
        ) : null}
        <View style={[styles.sentimentTag, { borderColor: sc }]}>
          <Text style={[styles.sentimentText, { color: sc }]}>
            {(item.sentiment ?? 'N/A').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* risk seg bar */}
      <SegBar value={item.risk} color={rc} height={5} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function IntelScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const data = await fetchNews();
      setNews(data);
      setLastRefresh(new Date());
      setError(null);
    } catch {
      setError('SIGINT FEED UNAVAILABLE');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Auto-refresh every 60s
  useEffect(() => {
    const iv = setInterval(load, 60_000);
    return () => clearInterval(iv);
  }, [load]);

  const avgRisk =
    news.length > 0
      ? Math.round(news.reduce((acc, n) => acc + n.risk, 0) / news.length)
      : 0;

  const formattedTime = lastRefresh.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>SIGINT FEED</Text>
          <Text style={styles.headerSub}>GEOPOLITICAL SIGNAL INTELLIGENCE</Text>
        </View>
        <View style={styles.headerRight}>
          <BlinkDot color={COLORS.red} />
          <View>
            <Text style={styles.countText}>
              {String(news.length).padStart(2, '0')} SIGNALS
            </Text>
            <Text style={styles.updateText}>{'UPD ' + formattedTime}</Text>
          </View>
        </View>
      </View>

      {/* ── Average risk panel ── */}
      {avgRisk > 0 ? (
        <View style={styles.avgPanel}>
          <Panel title="AVG RISK INDEX">
            <View style={styles.avgRow}>
              <Text style={[styles.avgValue, { color: riskColor(avgRisk) }]}>
                {avgRisk}
              </Text>
              <View style={styles.avgBarWrap}>
                <SegBar value={avgRisk} color={riskColor(avgRisk)} height={8} />
                <View style={styles.avgStatusRow}>
                  <StatusLight
                    color={riskColor(avgRisk)}
                    label={avgRisk >= 70 ? 'CRITICAL' : avgRisk >= 40 ? 'ELEVATED' : 'NOMINAL'}
                    blink={avgRisk >= 70}
                  />
                </View>
              </View>
            </View>
          </Panel>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* ── Feed ── */}
      <FlatList
        data={news}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <IntelCard item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{'~~~'}</Text>
              <Text style={styles.emptyText}>SCANNING INTELLIGENCE CHANNELS...</Text>
            </View>
          ) : null
        }
      />
    </View>
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 54,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDim,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FONT_MONO,
    fontSize: 18,
    color: COLORS.cyan,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  headerSub: {
    fontFamily: FONT_MONO,
    fontSize: 8,
    color: COLORS.textMid,
    letterSpacing: 2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countText: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.textHigh,
    letterSpacing: 1.5,
    textAlign: 'right',
  },
  updateText: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    color: COLORS.textMid,
    letterSpacing: 1,
    marginTop: 2,
    textAlign: 'right',
  },

  // Avg panel
  avgPanel: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avgValue: {
    fontFamily: FONT_MONO,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: 2,
  },
  avgBarWrap: {
    flex: 1,
    gap: 8,
  },
  avgStatusRow: {
    marginTop: 2,
  },

  // Error
  errorBanner: {
    marginHorizontal: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.red,
    backgroundColor: '#1a0000',
    borderRadius: 0,
    padding: 10,
  },
  errorText: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.red,
    letterSpacing: 1.5,
  },

  // List
  list: {
    padding: 10,
    gap: 8,
    paddingBottom: 32,
  },

  // Intel card
  card: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.borderDim,
    borderRadius: 0,
    borderLeftWidth: 3,
    padding: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  riskBadge: {
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 38,
  },
  riskScore: {
    fontFamily: FONT_MONO,
    fontSize: 14,
    letterSpacing: 1,
  },
  headline: {
    flex: 1,
    fontFamily: FONT_MONO,
    fontSize: 11,
    color: COLORS.textHigh,
    lineHeight: 17,
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 4,
  },
  sourceText: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  metaSep: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    color: COLORS.textLow,
  },
  timeText: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    color: COLORS.textMid,
    letterSpacing: 0.5,
  },
  metaSpacer: {
    flex: 1,
  },
  corridorTag: {
    borderWidth: 1,
    borderColor: COLORS.borderDim,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  corridorTagText: {
    fontFamily: FONT_MONO,
    fontSize: 8,
    color: COLORS.textMid,
    letterSpacing: 1.5,
  },
  sentimentTag: {
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  sentimentText: {
    fontFamily: FONT_MONO,
    fontSize: 8,
    letterSpacing: 1.5,
  },

  // Blink dot
  blinkDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 14,
  },
  emptyIcon: {
    fontFamily: FONT_MONO,
    fontSize: 24,
    color: COLORS.textMid,
    letterSpacing: 6,
  },
  emptyText: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.textMid,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
