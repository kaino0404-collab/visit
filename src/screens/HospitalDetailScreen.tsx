import React, { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Alert, SectionList
} from 'react-native'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack'
import { getHospitalById, deleteHospital } from '../db/hospitals'
import { getVisitsByHospital, markVisitComplete, deleteVisit } from '../db/visits'
import { exportToExcel } from '../services/excel'
import { getAllHospitals } from '../db/hospitals'
import type { Hospital, Visit } from '../types'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { formatDate, formatRelativeDate, visitTypeLabel, isUpcoming } from '../utils/dateUtils'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, 'HospitalDetail'>

export function HospitalDetailScreen() {
  const nav = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { hospitalId } = route.params

  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])

  const load = useCallback(() => {
    const h = getHospitalById(hospitalId)
    if (!h) { nav.goBack(); return }
    setHospital(h)
    setVisits(getVisitsByHospital(hospitalId))
  }, [hospitalId])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (!hospital) return null

  const upcoming = visits.filter(v => !v.is_completed && isUpcoming(v.visit_date))
  const past = visits.filter(v => v.is_completed || !isUpcoming(v.visit_date))

  const handleDelete = () => {
    Alert.alert('병원 삭제', `${hospital.name}의 모든 기록을 삭제합니다.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive', onPress: () => {
          deleteHospital(hospitalId)
          nav.goBack()
        }
      }
    ])
  }

  const handleExportThis = async () => {
    const visitMap: Record<number, Visit[]> = { [hospitalId]: visits }
    await exportToExcel([hospital], visitMap)
  }

  const handleExportAll = async () => {
    const all = getAllHospitals()
    const visitMap: Record<number, Visit[]> = {}
    for (const h of all) visitMap[h.id] = getVisitsByHospital(h.id)
    try { await exportToExcel(all, visitMap) } catch (e: any) { Alert.alert('오류', e.message) }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.hospitalName}>{hospital.name}</Text>
          {hospital.doctor_name && (
            <Text style={styles.doctorName}>원장 {hospital.doctor_name}</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.editBtn} onPress={() => nav.navigate('Record')}>
            <Text style={styles.editBtnText}>🎤 추가입력</Text>
          </Pressable>
        </View>
      </View>

      {/* 기본 정보 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>기본 정보</Text>
        {hospital.phone && <InfoRow label="📞 전화" value={hospital.phone} />}
        {hospital.address && <InfoRow label="📍 주소" value={hospital.address} />}
        {hospital.personality && <InfoRow label="💬 성향" value={hospital.personality} />}
        {hospital.notes && <InfoRow label="📝 메모" value={hospital.notes} />}
        {!hospital.phone && !hospital.address && !hospital.personality && !hospital.notes && (
          <Text style={styles.empty}>정보를 추가하려면 마이크 버튼을 누르세요</Text>
        )}
      </View>

      {/* 다가오는 일정 */}
      {upcoming.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 다가오는 일정</Text>
          {upcoming.map(v => (
            <VisitRow
              key={v.id}
              visit={v}
              onComplete={() => { markVisitComplete(v.id); load() }}
              onDelete={() => {
                Alert.alert('일정 삭제', '이 일정을 삭제합니다.', [
                  { text: '취소', style: 'cancel' },
                  { text: '삭제', style: 'destructive', onPress: () => { deleteVisit(v.id); load() } }
                ])
              }}
              isUpcoming
            />
          ))}
        </View>
      )}

      {/* 방문 기록 */}
      {past.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🗓 방문 기록</Text>
          {past.map(v => (
            <VisitRow
              key={v.id}
              visit={v}
              onComplete={() => { markVisitComplete(v.id); load() }}
              onDelete={() => {
                Alert.alert('기록 삭제', '이 기록을 삭제합니다.', [
                  { text: '취소', style: 'cancel' },
                  { text: '삭제', style: 'destructive', onPress: () => { deleteVisit(v.id); load() } }
                ])
              }}
            />
          ))}
        </View>
      )}

      {/* 내보내기 / 삭제 */}
      <View style={styles.bottomActions}>
        <Pressable style={styles.exportBtn} onPress={handleExportThis}>
          <Text style={styles.exportBtnText}>📊 이 병원만 엑셀 내보내기</Text>
        </Pressable>
        <Pressable style={styles.exportAllBtn} onPress={handleExportAll}>
          <Text style={styles.exportAllBtnText}>📊 전체 병원 엑셀 내보내기</Text>
        </Pressable>
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>🗑 병원 삭제</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

function VisitRow({ visit: v, onComplete, onDelete, isUpcoming: upcoming = false }: {
  visit: Visit; onComplete: () => void; onDelete: () => void; isUpcoming?: boolean
}) {
  return (
    <View style={[styles.visitRow, upcoming && styles.visitRowUpcoming]}>
      <View style={styles.visitLeft}>
        <Text style={styles.visitDate}>{formatDate(v.visit_date)}</Text>
        <View style={[styles.typeBadge, v.visit_type === 'meal' && styles.typeMeal, v.visit_type === 'call' && styles.typeCall]}>
          <Text style={styles.typeBadgeText}>{visitTypeLabel(v.visit_type)}</Text>
        </View>
        {v.time && <Text style={styles.visitTime}>{v.time}</Text>}
      </View>
      <Text style={styles.visitContent}>{v.content}</Text>
      <View style={styles.visitActions}>
        {!v.is_completed && upcoming && (
          <Pressable onPress={onComplete} style={styles.completeBtn}>
            <Text style={styles.completeBtnText}>✓</Text>
          </Pressable>
        )}
        <Pressable onPress={onDelete} style={styles.deleteVisitBtn}>
          <Text style={styles.deleteVisitBtnText}>✕</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  hospitalName: { fontSize: 22, fontWeight: '800', color: '#111827' },
  doctorName: { fontSize: 15, color: '#374151', marginTop: 3 },
  headerActions: { gap: 8 },
  editBtn: { backgroundColor: '#1e40af', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  editBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e40af', marginBottom: 12 },
  infoRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel: { width: 72, fontSize: 13, color: '#6b7280' },
  infoValue: { flex: 1, fontSize: 14, color: '#111827', lineHeight: 20 },
  empty: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 8 },
  visitRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  visitRowUpcoming: { backgroundColor: '#fffbeb', marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 8 },
  visitLeft: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 },
  visitDate: { fontSize: 13, fontWeight: '600', color: '#374151' },
  typeBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  typeMeal: { backgroundColor: '#fce7f3' },
  typeCall: { backgroundColor: '#dcfce7' },
  typeBadgeText: { fontSize: 12, color: '#374151' },
  visitTime: { fontSize: 12, color: '#6b7280' },
  visitContent: { fontSize: 14, color: '#111827', lineHeight: 20 },
  visitActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 6 },
  completeBtn: { backgroundColor: '#d1fae5', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  completeBtnText: { color: '#059669', fontWeight: '700', fontSize: 14 },
  deleteVisitBtn: { backgroundColor: '#fef2f2', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  deleteVisitBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },
  bottomActions: { gap: 10, marginTop: 8 },
  exportBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#1e40af' },
  exportBtnText: { color: '#1e40af', fontSize: 15, fontWeight: '600' },
  exportAllBtn: { backgroundColor: '#1e40af', borderRadius: 12, padding: 14, alignItems: 'center' },
  exportAllBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  deleteBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#fca5a5' },
  deleteBtnText: { color: '#ef4444', fontSize: 14 }
})
