import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text } from 'react-native'
import { HospitalListScreen } from '../screens/HospitalListScreen'
import { RecordScreen } from '../screens/RecordScreen'
import { HospitalDetailScreen } from '../screens/HospitalDetailScreen'
import { SettingsScreen } from '../screens/SettingsScreen'

export type RootStackParamList = {
  Tabs: undefined
  Record: undefined
  HospitalDetail: { hospitalId: number }
}

type TabParamList = {
  HospitalList: undefined
  Settings: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1e40af',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { paddingBottom: 6, height: 58 },
        headerStyle: { backgroundColor: '#1e40af' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' }
      }}
    >
      <Tab.Screen
        name="HospitalList"
        component={HospitalListScreen}
        options={{
          title: '병원 목록',
          tabBarLabel: '병원',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏥</Text>
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '설정',
          tabBarLabel: '설정',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>⚙️</Text>
        }}
      />
    </Tab.Navigator>
  )
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1e40af' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' }
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Record" component={RecordScreen} options={{ title: '음성 입력', presentation: 'modal' }} />
      <Stack.Screen name="HospitalDetail" component={HospitalDetailScreen} options={({ route }) => ({ title: '병원 상세' })} />
    </Stack.Navigator>
  )
}
