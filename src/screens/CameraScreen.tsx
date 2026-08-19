import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { useExerciseCounter } from '@/hooks/useExerciseCounter';
import { SkeletonOverlay } from '@/components/SkeletonOverlay';
import { ExerciseType, EXERCISES } from '@/types/exercise';
import { useKeepAwake } from 'expo-keep-awake';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CameraScreenProps {
  exerciseType: ExerciseType;
  onExerciseChange: (type: ExerciseType) => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
  exerciseType,
  onExerciseChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<Camera>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [videoSize, setVideoSize] = useState<{ width: number; height: number } | null>(null);

  useKeepAwake();

  const { pose, isModelReady: poseModelReady } = usePoseDetection(videoRef, isActive);
  const { count, stage, formScore, feedback, angle, reset } = useExerciseCounter(pose, exerciseType);

  useEffect(() => {
    setIsModelReady(poseModelReady);
  }, [poseModelReady]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const startCountdown = useCallback(() => {
    reset();
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setCountdown(null);
        setIsActive(true);
      }
    }, 1000);
  }, [reset]);

  const stopSession = useCallback(() => {
    setIsActive(false);
  }, []);

  const switchExercise = useCallback((type: ExerciseType) => {
    stopSession();
    onExerciseChange(type);
  }, [onExerciseChange, stopSession]);

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Camera permission denied</Text>
        <TouchableOpacity style={styles.button} onClick={() => Camera.requestCameraPermissionsAsync()}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!isModelReady) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading AI model...</Text>
      </SafeAreaView>
    );
  }

  const config = EXERCISES[exerciseType];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.exerciseTitle}>{config.name}</Text>
        <View style={styles.countContainer}>
          <Text style={styles.countLabel}>REPS</Text>
          <Text style={styles.countValue}>{count}</Text>
        </View>
      </View>

      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={CameraType.back}
          onCameraReady={() => {
            if (cameraRef.current) {
              const { width, height } = cameraRef.current.getMetrics();
              setVideoSize({ width, height });
            }
          }}
        >
          {videoRef.current && videoSize && (
            <SkeletonOverlay
              pose={pose}
              videoWidth={videoSize.width}
              videoHeight={videoSize.height}
              containerWidth={SCREEN_WIDTH}
              containerHeight={SCREEN_HEIGHT - 200}
              formScore={formScore}
            />
          )}
        </Camera>

        <View style={styles.overlay}>
          <View style={[
            styles.formBarContainer,
            { backgroundColor: formScore > 70 ? '#2ECC71' : formScore > 40 ? '#F39C12' : '#E74C3C' }
          ]}>
            <View
              style={[
                styles.formBarFill,
                { width: `${formScore}%` }
              ]}
            />
          </View>
          <Text style={styles.formLabel}>Form: {formScore}%</Text>
        </View>

        {countdown !== null && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.countdownLabel}>Get Ready!</Text>
          </View>
        )}

        <View style={styles.feedbackContainer}>
          <Text style={[
            styles.feedbackText,
            { color: formScore > 70 ? '#2ECC71' : formScore > 40 ? '#F39C12' : '#E74C3C' }
          ]}>
            {feedback}
          </Text>
          <Text style={styles.stageText}>Stage: {stage.toUpperCase()}</Text>
          <Text style={styles.angleText}>Angle: {Math.round(angle)}°</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.primaryButton, !isActive && !countdown && styles.startButton]}
          onPress={isActive ? stopSession : startCountdown}
          disabled={!!countdown}
        >
          <Text style={styles.buttonText}>
            {isActive ? 'STOP' : countdown ? '...' : 'START'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.secondaryButton]}
          onPress={() => switchExercise('pushup')}
          disabled={isActive}
        >
          <Text style={styles.buttonText}>
            {exerciseType === 'pushup' ? '●' : '○'} Push-ups
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.secondaryButton]}
          onPress={() => switchExercise('situp')}
          disabled={isActive}
        >
          <Text style={styles.buttonText}>
            {exerciseType === 'situp' ? '●' : '○'} Sit-ups
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.secondaryButton]}
          onPress={() => switchExercise('squat')}
          disabled={isActive}
        >
          <Text style={styles.buttonText}>
            {exerciseType === 'squat' ? '●' : '○'} Squats
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  exerciseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  countContainer: {
    alignItems: 'flex-end',
  },
  countLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
  },
  countValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2ECC71',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    padding: 10,
  },
  formBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  formBarFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
  },
  formLabel: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  countdownText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#fff',
  },
  countdownLabel: {
    fontSize: 24,
    color: '#fff',
    marginTop: 10,
  },
  feedbackContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  stageText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 4,
  },
  angleText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 15,
    gap: 10,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  controlButton: {
    flex: 1,
    minWidth: 140,
    maxWidth: 160,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#2ECC71',
    flex: 2,
    minWidth: 200,
  },
  startButton: {
    backgroundColor: '#2ECC71',
  },
  secondaryButton: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2ECC71',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
});

declare global {
  interface HTMLVideoElement {
    srcObject: MediaStream | null;
  }
}