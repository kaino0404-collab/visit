import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Alert, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { extractFromSpeech, mergeWithExisting } from '../services/claude'
import { findBestMatch } from '../utils/matchHospital'
import { getAllHospitals, insertHospital, updateHospital } from '../db/hospitals'
import { insertVisits } from '../db/visits'
import { MicButton } from '../components/MicButton'
import type { ExtractedData, Hospital } from '../types'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { formatDate, visitTypeLabel } from '../utils/dateUtils'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Stage = 'idle' | 'recording' | 'processing' | 'review' | 'saving'

export function RecordScreen() {
  const nav = useNavigation<Nav>()
  const speech = useSpeechRecognition()

  const [stage, setStage] = useState<Stage>('idle')
  const [extracted, setExtracted] = useState<ExtractedData | null>(null)
  const [matchedHospital, setMatchedHospital] = useState<Hospital | null>(null)
  const [editedTranscript, setEditedTranscript] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // STT 완료되면 자동으로 Claude 호출
  useEffect(() => {
    if (speech.status === 'done' && speech.transcript && stage === 'recording') {
      setEditedTranscript(speech.transcript)
      handleProcess(speech.transcript)
    }
  }, [speech.status])

  const handleProcess = async (text: string) => {
    setStage('processing')
    setErrorMsg(null)
    try {
      const data = await extractFromSpeech(text)
      const allHospitals = getAllHospitals()
      const matched = findBestMatch(data.hospital_name, allHospitals)
      setExtracted(data)
      setMatchedHospital(matched)
      setStage('review')
    } catch (e: any) {
      setErrorMsg(e.message ?? 'AI 처리 중 오류가 발생했습니다.')
      setStage('idle')
    }
  }

  const handleSave = async () => {
    if (!extracted) return
    setStage('saving')
    try {
      let hospitalId: number

      if (matchedHospital) {
        const merged = await mergeWithExisting(extracted, matchedHospital)
        updateHospital(matchedHospital.id, merged)
        insertVisits(matchedHospital.id, merged.new_events)
        hospitalId = matchedHospital.id
      } else {
        hospitalId = insertHospital({
          name: extracted.hospital_name ?? '이름 없음',
          doctor_name: extracted.doctor_name,
          personality: extracted.personality,
          phone: extracted.phone,
          address: extracted.address,
          notes: extracted.notes
        })
        insertVisits(hospitalId, extracted.events)
      }

      speech.reset()
      setExtracted(null)
      setMatchedHospital(null)
      setStage('idle')
      nav.navigate('HospitalDetail', { hospitalId })
    } catch (e: any) {
      setErrorMsg(e.message)
      setStage('review')
    }
  }

  const handleDiscard = () => {
    speech.reset()
    setExtracted(null)
    setMatchedHospital(null)
    setStage('idle')
    setErrorMsg(null)
  }

  const micStatus = stage === 'recording' ? 'recording'
    : stage === 'processing' || stage === 'saving' ? 'processing'
    : 'idle'

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* 에러 표시 */}
        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        )}

        {/* 음성 입력 단계 */}
        {(stage === 'idle' || stage === 'recording') && (
          <View style={styles.recordSection}>
            <Text style={styles.guide}>
              병원 정보를 말씀해 주세요{'\n'}
              <Text style={styles.guideSub}>예) "강남성심병원, 원장 김철수, 골프 좋아함, 다음주 화요일 방문"</Text>
            </Text>

            {speech.transcript ? (
              <View style={styles.liveBox}>
                <Text style={styles.liveText}>{speech.transcript}</Text>
              </View>
            ) : null}

            <MicButton
              status={micStatus}
              onPressIn={() => {
                setStage('recording')
                speech.startRecording()
              }}
              onPressOut={() => {
                speech.stopRecording()
              }}
            />
          </View>
        )}

        {/* AI 처리 중 */}
        {stage === 'processing' && (
          <View style={styles.processingSection}>
            <ActivityIndicator size="large" color="#1e40af" />
            <Text style={styles.processingText}>AI가 내용을 분석하고 있습니다...</Text>
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptLabel}>인식된 내용</Text>
              <Text style={styles.transcriptText}>{editedTranscript}</Text>
            </View>
          </View>
        )}

        {/* 결과 확인 */}
        {stage === 'review' && extracted && (
          <View style={styles.reviewSection}>
            {/* 병원 매칭 상태 */}
            <View style={[styles.matchBadge, matchedHospital ? styles.matchExisting : styles.matchNew]}>
              <Text style={styles.matchText}>
                {matchedHospital
                  ? `✏️ 기존 병원 업데이트: ${matchedHospital.name}`
                  : `🆕 새 병원 등록: ${extracted.hospital_name ?? '이름 없음'}`}
              </Text>
            </View>

            {/* 추출된 정보 */}
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>📋 추출된 정보</Text>
              {extracted.doctor_name && <InfoRow label="원장명" value={extracted.doctor_name} />}
              {extracted.phone && <InfoRow label="전화번호" value={extracted.phone} />}
              {extracted.address && <InfoRow label="주소" value={extracted.address} />}
              {extracted.personality && <InfoRow label="성향/스타일" value={extracted.personality} />}
              {extracted.notes && <InfoRow label="메모" value={extracted.notes} />}
            </View>

            {/* 일정 */}
            {extracted.events.length > 0 && (
              <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>📅 추가될 일정</Text>
                {extracted.events.map((e, i) => (
                  <View key={i} style={styles.eventRow}>
                    <Text style={styles.eventDate}>{formatDate(e.date)}</Text>
                    <Text style={styles.eventType}>{visitTypeLabel(e.type)}</Text>
                    {e.time && <Text style={styles.eventTime}>{e.time}</Text>}
                    <Text style={styles.eventContent}>{e.content}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 원본 음성 */}
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptLabel}>인식된 원문</Text>
              <Text style={styles.transcriptText}>{editedTranscript}</Text>
            </View>

            {/* 저장 / 취소 버튼 */}
            <View style={styles.actions}>
              <Pressable style={styles.btnDiscard} onPress={handleDiscard}>
                <Text style={styles.btnDiscardText}>취소</Text>
              </Pressable>
              <Pressable style={styles.btnSave} onPress={handleSave} disabled={stage === 'saving'}>
                {stage === 'saving'
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnSaveText}>저장하기</Text>}
              </Pressable>
            </View>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scroll: { flexGrow: 1, padding: 16, gap: 16 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  errorText: { color: '#dc2626', fontSize: 14 },
  recordSection: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingTop: 40 },
  guide: { fontSize: 17, fontWeight: '600', color: '#111827', textAlign: 'center', lineHeight: 26 },
  guideSub: { fontSize: 13, color: '#6b7280', fontWeight: '400' },
  liveBox: { backgroundColor: '#eff6ff', borderRadius: 10, padding: 14, width: '100%', borderWidth: 1, borderColor: '#bfdbfe' },
  liveText: { fontSize: 15, color: '#1e40af', lineHeight: 22 },
  processingSection: { alignItems: 'center', gap: 16, paddingTop: 40 },
  processingText: { fontSize: 15, color: '#374151' },
  transcriptBox: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, width: '100%', borderWidth: 1, borderColor: '#e5e7eb' },
  transcriptLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  transcriptText: { fontSize: 14, color: '#374151', lineHeight: 21 },
  reviewSection: { gap: 12 },
  matchBadge: { borderRadius: 10, padding: 12 },
  matchExisting: { backgroundColor: '#fef3c7' },
  matchNew: { backgroundColor: '#d1fae5' },
  matchText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1e40af', marginBottom: 10 },
  infoRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel: { width: 80, fontSize: 13, color: '#6b7280', fontWeight: '500' },
  infoValue: { flex: 1, fontSize: 13, color: '#111827' },
  eventRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' },
  eventDate: { fontSize: 13, fontWeight: '600', color: '#374151' },
  eventType: { fontSize: 12, backgroundColor: '#dbeafe', color: '#1d4ed8', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  eventTime: { fontSize: 12, color: '#6b7280' },
  eventContent: { fontSize: 13, color: '#111827', flex: 1 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnDiscard: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  btnDiscardText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  btnSave: { flex: 2, backgroundColor: '#1e40af', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnSaveText: { fontSize: 16, fontWeight: '700', color: '#fff' }
})
