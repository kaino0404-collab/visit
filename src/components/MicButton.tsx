import React, { useRef, useEffect } from 'react'
import { Pressable, Animated, StyleSheet, Text, View } from 'react-native'

interface Props {
  status: 'idle' | 'recording' | 'processing' | 'done' | 'error'
  onPressIn: () => void
  onPressOut: () => void
}

export function MicButton({ status, onPressIn, onPressOut }: Props) {
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (status === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true })
        ])
      ).start()
    } else {
      pulse.stopAnimation()
      Animated.timing(pulse, { toValue: 1, duration: 200, useNativeDriver: true }).start()
    }
  }, [status])

  const isRecording = status === 'recording'
  const isProcessing = status === 'processing'

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.ripple, { transform: [{ scale: pulse }], opacity: isRecording ? 0.3 : 0 }]} />
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isProcessing}
        style={[styles.button, isRecording && styles.recording, isProcessing && styles.processing]}
      >
        <Text style={styles.icon}>{isProcessing ? '⏳' : '🎤'}</Text>
      </Pressable>
      <Text style={styles.hint}>
        {isRecording ? '말하세요... (손 떼면 완료)' : isProcessing ? 'AI 분석 중...' : '누르고 말하기'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 12 },
  ripple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ef4444',
    zIndex: 0
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1
  },
  recording: { backgroundColor: '#ef4444' },
  processing: { backgroundColor: '#6b7280' },
  icon: { fontSize: 32 },
  hint: { fontSize: 13, color: '#6b7280', marginTop: 4 }
})
