import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { Hospital } from '../types'
import { formatRelativeDate } from '../utils/dateUtils'

interface Props {
  hospital: Hospital
  onPress: () => void
}

export function HospitalCard({ hospital: h, onPress }: Props) {
  const hasUpcoming = h.next_visit != null
  const today = new Date().toISOString().split('T')[0]
  const isUrgent = hasUpcoming && h.next_visit! <= today

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name}>{h.name}</Text>
          {h.doctor_name && (
            <Text style={styles.doctor}>원장 {h.doctor_name}</Text>
          )}
          {h.personality && (
            <Text style={styles.personality} numberOfLines={1}>{h.personality}</Text>
          )}
        </View>
        <View style={styles.right}>
          {hasUpcoming && (
            <View style={[styles.badge, isUrgent && styles.badgeUrgent]}>
              <Text style={[styles.badgeText, isUrgent && styles.badgeTextUrgent]}>
                {formatRelativeDate(h.next_visit!)}
              </Text>
            </View>
          )}
          {h.last_visit && (
            <Text style={styles.lastVisit}>마지막 {formatRelativeDate(h.last_visit)}</Text>
          )}
        </View>
      </View>
      {h.phone && <Text style={styles.phone}>📞 {h.phone}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3
  },
  pressed: { opacity: 0.85 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  info: { flex: 1, marginRight: 8 },
  right: { alignItems: 'flex-end', gap: 4 },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  doctor: { fontSize: 13, color: '#374151', marginTop: 2 },
  personality: { fontSize: 12, color: '#6b7280', marginTop: 3 },
  phone: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  badge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  badgeUrgent: { backgroundColor: '#fef2f2' },
  badgeText: { fontSize: 12, color: '#1d4ed8', fontWeight: '600' },
  badgeTextUrgent: { color: '#dc2626' },
  lastVisit: { fontSize: 11, color: '#9ca3af' }
})
