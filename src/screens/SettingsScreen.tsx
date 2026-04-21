import React, { useState, useEffect } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import * as SecureStore from 'expo-secure-store'

export function SettingsScreen() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [hasKey, setHasKey] = useState(false)

  useEffect(() => {
    SecureStore.getItemAsync('claude_api_key').then(k => {
      if (k) { setHasKey(true); setApiKey('•'.repeat(20)) }
    })
  }, [])

  const handleSave = async () => {
    const key = apiKey.trim()
    if (!key || key.startsWith('•')) {
      Alert.alert('알림', '새 API 키를 입력해주세요.')
      return
    }
    if (!key.startsWith('sk-ant-')) {
      Alert.alert('오류', 'Anthropic API 키는 sk-ant- 로 시작해야 합니다.')
      return
    }
    await SecureStore.setItemAsync('claude_api_key', key)
    setHasKey(true)
    setApiKey('•'.repeat(20))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDelete = async () => {
    Alert.alert('API 키 삭제', '저장된 API 키를 삭제합니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive', onPress: async () => {
          await SecureStore.deleteItemAsync('claude_api_key')
          setHasKey(false)
          setApiKey('')
        }
      }
    ])
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔑 Claude API 키</Text>
          <Text style={styles.desc}>
            AI 음성 분석을 위해 Anthropic API 키가 필요합니다.{'\n'}
            키는 기기에 안전하게 암호화되어 저장됩니다.
          </Text>

          <Text style={styles.howTo}>API 키 발급 방법:</Text>
          <Text style={styles.howToStep}>1. console.anthropic.com 접속</Text>
          <Text style={styles.howToStep}>2. API Keys 메뉴에서 키 생성</Text>
          <Text style={styles.howToStep}>3. sk-ant-... 로 시작하는 키를 아래에 입력</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="sk-ant-api..."
              placeholderTextColor="#9ca3af"
              value={apiKey}
              onChangeText={(t) => { setApiKey(t); setSaved(false) }}
              onFocus={() => { if (hasKey) setApiKey('') }}
              secureTextEntry={false}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{saved ? '✓ 저장됨' : 'API 키 저장'}</Text>
            </Pressable>
            {hasKey && (
              <Pressable style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>삭제</Text>
              </Pressable>
            )}
          </View>

          {hasKey && !saved && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>✅ API 키가 설정되어 있습니다</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 앱 정보</Text>
          <InfoRow label="버전" value="1.0.0" />
          <InfoRow label="AI 모델" value="Claude Haiku (빠른 처리)" />
          <InfoRow label="음성 인식" value="기기 내장 (한국어)" />
          <InfoRow label="데이터 저장" value="기기 로컬 저장" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 사용 방법</Text>
          <Text style={styles.guide}>
            {'1️⃣  홈 화면에서 🎤 버튼을 누릅니다\n\n'}
            {'2️⃣  버튼을 누른 채로 병원 정보를 말합니다\n    예) "강남성심병원, 원장 김철수, 골프 좋아함,\n    다음주 화요일 오전 방문"\n\n'}
            {'3️⃣  손을 떼면 AI가 자동으로 정리합니다\n\n'}
            {'4️⃣  내용을 확인하고 저장하기를 누릅니다\n\n'}
            {'5️⃣  같은 병원을 다시 말하면 기존 정보에\n    자동으로 추가/업데이트됩니다\n\n'}
            {'📊 엑셀 내보내기는 병원 상세 화면에서\n    할 수 있습니다'}
          </Text>
        </View>

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
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  desc: { fontSize: 13, color: '#6b7280', lineHeight: 20, marginBottom: 14 },
  howTo: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  howToStep: { fontSize: 13, color: '#6b7280', lineHeight: 22, paddingLeft: 8 },
  inputRow: { marginTop: 12 },
  input: { backgroundColor: '#f9fafb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: '#e5e7eb', color: '#111827' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  saveBtn: { flex: 1, backgroundColor: '#1e40af', borderRadius: 10, padding: 13, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  deleteBtn: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 13, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1, borderColor: '#fca5a5' },
  deleteBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
  statusBadge: { backgroundColor: '#d1fae5', borderRadius: 8, padding: 10, marginTop: 10 },
  statusText: { color: '#065f46', fontSize: 13, fontWeight: '500' },
  infoRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel: { width: 90, fontSize: 13, color: '#6b7280' },
  infoValue: { flex: 1, fontSize: 13, color: '#111827' },
  guide: { fontSize: 13, color: '#374151', lineHeight: 22 }
})
