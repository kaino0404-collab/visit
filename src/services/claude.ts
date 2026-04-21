import Anthropic from '@anthropic-ai/sdk'
import * as SecureStore from 'expo-secure-store'
import type { ExtractedData, MergedData, Hospital } from '../types'
import { todayISO } from '../utils/dateUtils'

const MODEL = 'claude-haiku-4-5-20251001'

async function getClient(): Promise<Anthropic> {
  const key = await SecureStore.getItemAsync('claude_api_key')
  if (!key) throw new Error('Claude API 키가 설정되지 않았습니다. 설정 화면에서 입력해주세요.')
  return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true })
}

export async function extractFromSpeech(transcript: string): Promise<ExtractedData> {
  const client = await getClient()
  const today = todayISO()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `당신은 의약품 영업사원의 병원 방문 기록을 정리하는 CRM 도우미입니다.
음성 전사 텍스트에서 구조화된 정보를 추출해서 반드시 올바른 JSON만 반환하세요. 설명 없이 JSON만.

오늘 날짜: ${today}

출력 스키마:
{
  "hospital_name": string | null,
  "doctor_name": string | null,
  "personality": string | null,
  "phone": string | null,
  "address": string | null,
  "notes": string | null,
  "events": [
    {
      "type": "visit" | "meal" | "call" | "other",
      "date": "YYYY-MM-DD",
      "time": "HH:MM" | null,
      "location": string | null,
      "content": string
    }
  ],
  "is_update_only": boolean
}

규칙:
- 상대적 날짜(다음주 화요일, 이번주 금요일 등)는 오늘 기준으로 절대 날짜(YYYY-MM-DD)로 변환
- 전화번호: 숫자만 추출 후 010-XXXX-XXXX 형식으로 정규화
- 성향/취미/스타일 정보는 personality 필드에
- 약속 변경/취소 언급이 있으면 is_update_only: true
- 언급되지 않은 필드는 null`,
    messages: [{ role: 'user', content: transcript }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI 응답을 파싱할 수 없습니다.')

  return JSON.parse(jsonMatch[0]) as ExtractedData
}

export async function mergeWithExisting(
  extracted: ExtractedData,
  existing: Hospital
): Promise<MergedData> {
  const client = await getClient()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `당신은 병원 영업 CRM 데이터 통합 도우미입니다.
기존 병원 기록과 새 정보를 병합해서 반드시 올바른 JSON만 반환하세요.

규칙:
1. 기존 정보를 절대 삭제하지 마세요
2. 단일값(doctor_name, phone, address): 새 값이 있으면 덮어쓰기, 없으면 null
3. personality: 기존에 없는 새 특성만 " / "로 이어붙이기 (중복 제거)
4. notes: 새 내용이 있으면 "[날짜] 내용" 형식으로 기존에 이어붙이기
5. new_events: 추가할 새 일정만 반환

출력 스키마:
{
  "doctor_name": string | null,
  "personality": string | null,
  "phone": string | null,
  "address": string | null,
  "notes": string | null,
  "new_events": [{ "type", "date", "time", "location", "content" }]
}`,
    messages: [{
      role: 'user',
      content: `기존 기록:\n${JSON.stringify(existing, null, 2)}\n\n새 정보:\n${JSON.stringify(extracted, null, 2)}`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI 병합 응답을 파싱할 수 없습니다.')

  return JSON.parse(jsonMatch[0]) as MergedData
}
