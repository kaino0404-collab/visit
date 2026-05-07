import 'react-native-gesture-handler'
import React, { useEffect, useState } from 'react'
import { Platform, View, ActivityIndicator } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { initDatabase } from './src/db/db'
import { AppNavigator } from './src/navigation/AppNavigator'

export default function App() {
  const [ready, setReady] = useState(Platform.OS !== 'web')

  useEffect(() => {
    async function init() {
      if (Platform.OS === 'web') {
        const { initDbAsync } = require('./src/db/expo-sqlite-web')
        await initDbAsync()
      }
      initDatabase()
      setReady(true)
    }
    init()
  }, [])

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
