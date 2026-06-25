/**
 * ASSET TRACKING — vessels.tsx
 * Mission-control vessel telemetry feed.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { COLORS, FONT_MONO } from '../../constants';
import { DataRow } from '../../components/hud';
import { fetchVessels, type Vessel } from '../../lib/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function riskZoneColor(zone: string): string {
  const z = (zone ?? '').toLowerCase();
  if (z.includes('hormuz')) return COLORS.red;
  if (z.includes('red') || z.includes('redsea')) return COLORS.amber;
  if (z.includes('cape')) return COLORS.green;
  return COLORS.cyan;
}

function riskZoneLabel(zone: string): string {
  const z = (zone ?? '').toLowerCase();
  if (z.includes('hormuz')) return 'HORMUZ';
  if (z.includes('red') || z.includes('redsea')) return 'RED SEA';
  if (z.includes('cape')) return 'CAPE';
  return 'SAFE';
}

// ---------------------------------------------------------------------------
// Vessel card
// ---------------------------------------------------------------------------

function VesselCard({ item }: { item: Vessel }) {
  const zColor = riskZoneColor(item.riskZone);
  const zLabel = riskZoneLabel(item.riskZone);
  return (
    <View style={styles.card}>
      {/* left color bar = risk zone color */}
      <View style={[styles.cardLeftBar, { backgroundColor: zColor }]} />
      <View style={styles.cardBody}>
        {/* top row: name + risk zone badge */}
        <View style={styles.cardTop}>
          <Text style={[styles.vesselName, { color: COLORS.cyan }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={[styles.riskBadge, { borderColor: zColor }]}>
            <Text style={[styles.riskBadgeText, { color: zColor }]}>
              {'[ '}
              {zLabel}
              {' ]'}
            </Text>
          </View>
        </View>

        {/* type · cargo */}
        <Text style={styles.vesselMeta}>
          {item.type}
          {' · '}
          {item.cargo}
        </Text>

        {/* route */}
        <View style={styles.routeRow}>
          <Text style={styles.routeOrigin} numberOfLines={1}>
            {item.origin}
          </Text>
          <Text style={styles.routeArrow}> ──→ </Text>
          <Text style={styles.routeDest} numberOfLines={1}>
            {item.destination}
          </Text>
        </View>

        {/* bottom DataRows */}
        <View style={styles.dataRowsWrap}>
          <DataRow label="ETA" value={item.eta} />
          <DataRow label="SPEED" value={`${item.speed} KT`} />
          <DataRow
            label="COORDS"
            value={`${item.lat.toFixed(2)}° / ${item.lng.toFixed(2)}°`}
          />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function VesselsScreen() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchVessels();
      setVessels(data);
      setError(null);
    } catch {
      setError('TELEMETRY FEED UNAVAILABLE');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>ASSET TRACKING</Text>
          <Text style={styles.headerCount}>
            {String(vessels.length).padStart(2, '0')}
            {' UNITS MONITORED'}
          </Text>
        </View>
        <View style={styles.trackingBadge}>
          <View style={styles.trackingDot} />
          <Text style={styles.trackingText}>TRACKING ACTIVE</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={vessels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VesselCard item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.cyan}
            colors={[COLORS.cyan]}
          />
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{'[ - ]'}</Text>
              <Text style={styles.emptyText}>ACQUIRING VESSEL TELEMETRY...</Text>
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
    alignItems: 'center',
    paddingTop: 54,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDim,
  },
  headerTitle: {
    fontFamily: FONT_MONO,
    fontSize: 18,
    color: COLORS.cyan,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  headerCount: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    color: COLORS.textMid,
    letterSpacing: 2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.green,
    backgroundColor: '#001a0d',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  trackingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
  },
  trackingText: {
    fontFamily: FONT_MONO,
    fontSize: 8,
    color: COLORS.green,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Error
  errorBanner: {
    marginHorizontal: 12,
    marginTop: 10,
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
    gap: 10,
    paddingBottom: 32,
  },

  // Card
  card: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.borderDim,
    borderRadius: 0,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardLeftBar: {
    width: 3,
  },
  cardBody: {
    flex: 1,
    padding: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  vesselName: {
    fontFamily: FONT_MONO,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  riskBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 0,
  },
  riskBadgeText: {
    fontFamily: FONT_MONO,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  vesselMeta: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    color: COLORS.textMid,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  routeOrigin: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.textHigh,
    flex: 1,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  routeArrow: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.textMid,
  },
  routeDest: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.textHigh,
    flex: 1,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  dataRowsWrap: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDim,
    paddingTop: 6,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 14,
  },
  emptyIcon: {
    fontFamily: FONT_MONO,
    fontSize: 28,
    color: COLORS.textMid,
    letterSpacing: 4,
  },
  emptyText: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.textMid,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
