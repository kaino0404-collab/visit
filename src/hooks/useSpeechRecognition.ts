import { useState, useCallback, useRef } from 'react'
import { Platform } from 'react-native'

type Status = 'idle' | 'recording' | 'done' | 'error'

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function useSpeechRecognition() {
  const [status, setStatus] = useState<Status>('idle')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const webRecognitionRef = useRef<any>(null)
  const nativeModuleRef = useRef<any>(null)

  const startRecording = useCallback(async () => {
    setTranscript('')
    setError(null)
    setStatus('recording')

    if (Platform.OS === 'web') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        setError('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해주세요.')
        setStatus('error')
        return
      }

      const recognition = new SpeechRecognition()
      recognition.lang = 'ko-KR'
      recognition.interimResults = true
      recognition.continuous = true
      webRecognitionRef.current = recognition

      recognition.onresult = (e: any) => {
        const result = Array.from(e.results as any[])
          .map((r: any) => r[0].transcript)
          .join('')
        setTranscript(result)
      }
      recognition.onerror = (e: any) => {
        setError(e.error ?? '음성 인식 오류가 발생했습니다.')
        setStatus('error')
      }
      recognition.onend = () => {
        setStatus(prev => prev === 'recording' ? 'done' : prev)
      }
      recognition.start()
    } else {
      try {
        const { ExpoSpeechRecognitionModule } = require('expo-speech-recognition')

        if (!ExpoSpeechRecognitionModule?.requestPermissionsAsync) {
          setError('음성 인식을 사용할 수 없습니다. (개발 빌드 필요)')
          setStatus('error')
          return
        }

        nativeModuleRef.current = ExpoSpeechRecognitionModule

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
      } catch {
        setError('음성 인식을 사용할 수 없습니다. (개발 빌드 필요)')
        setStatus('error')
      }
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (Platform.OS === 'web') {
      webRecognitionRef.current?.stop()
    } else {
      nativeModuleRef.current?.stop()
    }
    setStatus('done')
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setTranscript('')
    setError(null)
  }, [])

  return { status, transcript, error, startRecording, stopRecording, reset }
}
