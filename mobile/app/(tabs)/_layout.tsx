import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS, FONT_MONO } from '../../constants';

// ---------------------------------------------------------------------------
// Custom tab icon — ASCII glyph with active cyan underline bar
// ---------------------------------------------------------------------------

interface TabIconProps {
  glyph: string;
  label: string;
  focused: boolean;
}

function TabIcon({ glyph, label, focused }: TabIconProps) {
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.iconGlyph, { color: focused ? COLORS.cyan : COLORS.textMid }]}>
        {glyph}
      </Text>
      <Text
        style={[
          styles.iconLabel,
          { color: focused ? COLORS.cyan : COLORS.textMid },
        ]}
      >
        {label}
      </Text>
      {focused ? <View style={styles.activeBar} /> : <View style={styles.inactiveBar} />}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tab layout
// ---------------------------------------------------------------------------

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.cyan,
        tabBarInactiveTintColor: COLORS.textMid,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'WAR ROOM',
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph="[+]" label="WAR ROOM" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="simulate"
        options={{
          title: 'SIMULATE',
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph=">>>" label="SIMULATE" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="vessels"
        options={{
          title: 'ASSETS',
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph="-->" label="ASSETS" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="intel"
        options={{
          title: 'SIGINT',
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph="~~~" label="SIGINT" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#010c0c',
    borderTopColor: COLORS.borderDim,
    borderTopWidth: 1,
    height: 68,
    paddingBottom: 0,
    paddingTop: 0,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    width: 72,
    gap: 2,
  },
  iconGlyph: {
    fontFamily: FONT_MONO,
    fontSize: 13,
    letterSpacing: 1,
  },
  iconLabel: {
    fontFamily: FONT_MONO,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  activeBar: {
    marginTop: 4,
    width: 28,
    height: 2,
    backgroundColor: COLORS.cyan,
    borderRadius: 0,
  },
  inactiveBar: {
    marginTop: 4,
    width: 28,
    height: 2,
    backgroundColor: 'transparent',
  },
});
