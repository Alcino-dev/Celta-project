import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Image, Text, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        headerTitle: ({ children }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Text style={{color: '#00c732', fontSize: 25, fontWeight: 'bold'}}>{children}</Text>
            <Image source={require('../../assets/images/Logo2.png')} style={{ width: 60, height: 60 }} />
          </View>
        ),
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="HomeScreen"
        options={{
          title: 'Celta',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="StockScreen"
        options={{
          title: 'Estoque',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="inventory" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ReportScreen"
        options={{
          title: 'Relatório',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bar-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="SettingsScreen"
        options={{
          title: 'Definições',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
