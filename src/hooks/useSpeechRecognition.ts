import { useState, useCallback, useEffect } from 'react'
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  AudioEncodingAndroid
} from 'expo-speech-recognition'

type Status = 'idle' | 'recording' | 'done' | 'error'

export function useSpeechRecognition() {
  const [status, setStatus] = useState<Status>('idle')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  useSpeechRecognitionEvent('result', (e) => {
    if (e.results[0]) {
      setTranscript(e.results[0].transcript)
    }
  })

  useSpeechRecognitionEvent('end', () => {
    setStatus(prev => prev === 'recording' ? 'done' : prev)
  })

  useSpeechRecognitionEvent('error', (e) => {
    setError(e.message ?? '음성 인식 오류가 발생했습니다.')
    setStatus('error')
  })

  const startRecording = useCallback(async () => {
    setTranscript('')
    setError(null)
    setStatus('recording')

    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
    if (!granted) {
      setError('마이크 권한이 필요합니다.')
      setStatus('error')
      return
    }

    ExpoSpeechRecognitionModule.start({
      lang: 'ko-KR',
      interimResults: true,
      maxAlternatives: 1,
      continuous: true,
      requiresOnDeviceRecognition: false
    })
  }, [])

  const stopRecording = useCallback(() => {
    ExpoSpeechRecognitionModule.stop()
    setStatus('done')
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setTranscript('')
    setError(null)
  }, [])

  return { status, transcript, error, startRecording, stopRecording, reset }
}
