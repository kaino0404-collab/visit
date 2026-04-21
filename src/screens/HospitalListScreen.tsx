import React, { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TextInput, Pressable,
  StyleSheet, RefreshControl, SectionList
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { getAllHospitals, getUpcomingHospitals } from '../db/hospitals'
import { HospitalCard } from '../components/HospitalCard'
import type { Hospital } from '../types'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { formatDate, formatRelativeDate, visitTypeLabel } from '../utils/dateUtils'
import { getUpcomingVisits } from '../db/visits'

type Nav = NativeStackNavigationProp<RootStackParamList>

export function HospitalListScreen() {
  const nav = useNavigation<Nav>()
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [upcoming, setUpcoming] = useState<Array<any>>([])
  const [query, setQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    setHospitals(getAllHospitals())
    setUpcoming(getUpcomingVisits(7))
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = async () => {
    setRefreshing(true)
    load()
    setRefreshing(false)
  }

  const filtered = query.trim()
    ? hospitals.filter(h =>
        h.name.includes(query) ||
        (h.doctor_name?.includes(query) ?? false) ||
        (h.phone?.includes(query) ?? false)
      )
    : hospitals

  return (
    <View style={styles.container}>
      {/* 검색창 */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.search}
          placeholder="병원명, 원장명, 전화번호 검색..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={h => String(h.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          upcoming.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📅 이번 주 일정</Text>
              {upcoming.map(v => (
                <Pressable
                  key={v.id}
                  style={styles.upcomingItem}
                  onPress={() => {
                    const h = hospitals.find(h => h.id === v.hospital_id)
                    if (h) nav.navigate('HospitalDetail', { hospitalId: h.id })
                  }}
                >
                  <Text style={styles.upcomingDate}>{formatRelativeDate(v.visit_date)}</Text>
                  <Text style={styles.upcomingHospital}>{v.hospital_name}</Text>
                  <Text style={styles.upcomingType}>{visitTypeLabel(v.visit_type)}{v.time ? ` ${v.time}` : ''}</Text>
                </Pressable>
              ))}
            </View>
          ) : null
        }
        ListHeaderComponentStyle={{ marginBottom: 4 }}
        renderItem={({ item }) => (
          <HospitalCard
            hospital={item}
            onPress={() => nav.navigate('HospitalDetail', { hospitalId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏥</Text>
            <Text style={styles.emptyText}>
              {query ? '검색 결과가 없습니다' : '등록된 병원이 없습니다\n마이크 버튼으로 첫 병원을 등록하세요'}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* 녹음 FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => nav.navigate('Record')}
      >
        <Text style={styles.fabIcon}>🎤</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  searchWrapper: { backgroundColor: '#fff', padding: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  search: { backgroundColor: '#f9fafb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, borderWidth: 1, borderColor: '#e5e7eb' },
  section: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1e40af', marginBottom: 10 },
  upcomingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 8 },
  upcomingDate: { fontSize: 13, fontWeight: '700', color: '#ef4444', width: 52 },
  upcomingHospital: { fontSize: 13, color: '#111827', flex: 1, fontWeight: '500' },
  upcomingType: { fontSize: 12, color: '#6b7280' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: '#9ca3af', textAlign: 'center', lineHeight: 24 },
  fab: {
    position: 'absolute', right: 20, bottom: 28,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#1e40af',
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6
  },
  fabIcon: { fontSize: 26 }
})
