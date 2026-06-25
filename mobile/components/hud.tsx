/**
 * HUD component library — NASA/mission-control aesthetic
 * All components use monospace font, zero border radius, and #00d4ff corner brackets.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { COLORS, FONT_MONO } from '../constants';

// ---------------------------------------------------------------------------
// Corner bracket decoration — thin cyan L-shapes at all 4 corners
// ---------------------------------------------------------------------------

const BRACKET_SIZE = 10;
const BRACKET_THICK = 2;

function CornerBrackets() {
  return (
    <>
      {/* top-left */}
      <View style={[styles.corner, styles.cornerTL]}>
        <View style={[styles.cornerH, { backgroundColor: COLORS.borderAccent }]} />
        <View style={[styles.cornerV, { backgroundColor: COLORS.borderAccent }]} />
      </View>
      {/* top-right */}
      <View style={[styles.corner, styles.cornerTR]}>
        <View style={[styles.cornerH, { backgroundColor: COLORS.borderAccent }]} />
        <View style={[styles.cornerV, { backgroundColor: COLORS.borderAccent }]} />
      </View>
      {/* bottom-left */}
      <View style={[styles.corner, styles.cornerBL]}>
        <View style={[styles.cornerV, { backgroundColor: COLORS.borderAccent }]} />
        <View style={[styles.cornerH, { backgroundColor: COLORS.borderAccent }]} />
      </View>
      {/* bottom-right */}
      <View style={[styles.corner, styles.cornerBR]}>
        <View style={[styles.cornerV, { backgroundColor: COLORS.borderAccent }]} />
        <View style={[styles.cornerH, { backgroundColor: COLORS.borderAccent }]} />
      </View>
    </>
  );
}

// ---------------------------------------------------------------------------
// Panel — bordered panel with optional title and corner brackets
// ---------------------------------------------------------------------------

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  style?: object;
  titleColor?: string;
}

export function Panel({ title, children, style, titleColor }: PanelProps) {
  return (
    <View style={[styles.panel, style]}>
      <CornerBrackets />
      {title ? (
        <View style={styles.panelTitleRow}>
          <Text style={[styles.panelTitle, titleColor ? { color: titleColor } : undefined]}>
            {'[ '}
            {title}
            {' ]'}
          </Text>
        </View>
      ) : null}
      <View style={styles.panelContent}>{children}</View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SegBar — 20-block segmented progress bar
// ---------------------------------------------------------------------------

const SEG_COUNT = 20;

interface SegBarProps {
  value: number; // 0–100
  color: string;
  height?: number;
}

export function SegBar({ value, color, height = 8 }: SegBarProps) {
  const filled = Math.round((value / 100) * SEG_COUNT);
  return (
    <View style={[styles.segBarRow, { height }]}>
      {Array.from({ length: SEG_COUNT }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.segBlock,
            {
              height,
              backgroundColor: i < filled ? color : COLORS.segEmpty,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// StatusLight — blinking colored dot + status text
// ---------------------------------------------------------------------------

interface StatusLightProps {
  color: string;
  label: string;
  blink?: boolean;
}

export function StatusLight({ color, label, blink = false }: StatusLightProps) {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!blink) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.15,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [blink, anim]);

  return (
    <View style={styles.statusLightRow}>
      <Animated.View style={[styles.statusDot, { backgroundColor: color, opacity: blink ? anim : 1 }]} />
      <Text style={[styles.statusLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// DataRow — left muted label + right bright value
// ---------------------------------------------------------------------------

interface DataRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

export function DataRow({ label, value, valueColor }: DataRowProps) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={[styles.dataValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// BigReadout — giant monospace number with unit label
// ---------------------------------------------------------------------------

interface BigReadoutProps {
  value: string;
  unit: string;
  color?: string;
}

export function BigReadout({ value, unit, color }: BigReadoutProps) {
  const c = color ?? COLORS.cyan;
  return (
    <View style={styles.bigReadoutWrap}>
      <Text style={[styles.bigReadoutValue, { color: c }]}>{value}</Text>
      <Text style={[styles.bigReadoutUnit, { color: COLORS.textMid }]}>{unit}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Panel
  panel: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.borderDim,
    borderRadius: 0,
    marginBottom: 12,
    position: 'relative',
  },
  panelTitleRow: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  panelTitle: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.cyan,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  panelContent: {
    padding: 12,
    paddingTop: 4,
  },

  // Corner brackets
  corner: {
    position: 'absolute',
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
    zIndex: 2,
  },
  cornerTL: { top: -1, left: -1 },
  cornerTR: { top: -1, right: -1 },
  cornerBL: { bottom: -1, left: -1 },
  cornerBR: { bottom: -1, right: -1 },
  cornerH: {
    position: 'absolute',
    width: BRACKET_SIZE,
    height: BRACKET_THICK,
    top: 0,
    left: 0,
  },
  cornerV: {
    position: 'absolute',
    width: BRACKET_THICK,
    height: BRACKET_SIZE,
    top: 0,
    left: 0,
  },

  // SegBar
  segBarRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  segBlock: {
    flex: 1,
    borderRadius: 0,
  },

  // StatusLight
  statusLightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // DataRow
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dataLabel: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: COLORS.textMid,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  dataValue: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    color: COLORS.textHigh,
    letterSpacing: 1,
    textAlign: 'right',
  },

  // BigReadout
  bigReadoutWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  bigReadoutValue: {
    fontFamily: FONT_MONO,
    fontSize: 64,
    lineHeight: 70,
    letterSpacing: 2,
  },
  bigReadoutUnit: {
    fontFamily: FONT_MONO,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});

// Re-export FONT_MONO for convenience in screens
export { FONT_MONO };
export const HUD_FONT = Platform.select<string>({
  ios: 'Courier New',
  android: 'monospace',
  default: 'monospace',
}) as string;
