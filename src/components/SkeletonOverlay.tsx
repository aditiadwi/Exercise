import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Pose, KEYPOINT_CONNECTIONS, Keypoint } from '@/types/exercise';

const { width, height } = Dimensions.get('window');

interface SkeletonOverlayProps {
  pose: Pose | null;
  videoWidth: number;
  videoHeight: number;
  containerWidth: number;
  containerHeight: number;
  formScore: number;
}

const KEYPOINT_COLORS: Record<string, string> = {
  nose: '#FF6B6B',
  left_eye: '#4ECDC4',
  right_eye: '#4ECDC4',
  left_ear: '#45B7D1',
  right_ear: '#45B7D1',
  left_shoulder: '#96CEB4',
  right_shoulder: '#96CEB4',
  left_elbow: '#FFEAA7',
  right_elbow: '#FFEAA7',
  left_wrist: '#DDA0DD',
  right_wrist: '#DDA0DD',
  left_hip: '#98D8C8',
  right_hip: '#98D8C8',
  left_knee: '#F7DC6F',
  right_knee: '#F7DC6F',
  left_ankle: '#BB8FCE',
  right_ankle: '#BB8FCE',
};

const getConnectionColor = (score: number) => {
  if (score > 80) return '#2ECC71';
  if (score > 50) return '#F39C12';
  return '#E74C3C';
};

export const SkeletonOverlay: React.FC<SkeletonOverlayProps> = ({
  pose,
  videoWidth,
  videoHeight,
  containerWidth,
  containerHeight,
  formScore,
}) => {
  if (!pose) return null;

  const scaleX = containerWidth / videoWidth;
  const scaleY = containerHeight / videoHeight;
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (containerWidth - videoWidth * scale) / 2;
  const offsetY = (containerHeight - videoHeight * scale) / 2;

  const transformPoint = (x: number, y: number) => ({
    x: x * scale + offsetX,
    y: y * scale + offsetY,
  });

  const validKeypoints = pose.keypoints.filter(kp => kp.score > 0.3);

  return (
    <View style={styles.container} pointerEvents="none">
      {KEYPOINT_CONNECTIONS.map(([from, to], index) => {
        const kpFrom = pose.keypoints.find(k => k.name === from);
        const kpTo = pose.keypoints.find(k => k.name === to);
        
        if (!kpFrom || !kpTo || kpFrom.score < 0.3 || kpTo.score < 0.3) {
          return null;
        }

        const p1 = transformPoint(kpFrom.x, kpFrom.y);
        const p2 = transformPoint(kpTo.x, kpTo.y);
        const length = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        return (
          <View
            key={index}
            style={[
              styles.bone,
              {
                width: length,
                height: 4,
                transform: [
                  { translateX: midX - length / 2 },
                  { translateY: midY - 2 },
                  { rotate: `${angle}deg` },
                ],
                backgroundColor: getConnectionColor(formScore),
              },
            ]}
          />
        );
      })}

      {validKeypoints.map((kp) => {
        const point = transformPoint(kp.x, kp.y);
        const size = Math.max(8, Math.min(16, kp.score * 20));
        
        return (
          <View
            key={kp.name}
            style={[
              styles.keypoint,
              {
                width: size,
                height: size,
                left: point.x - size / 2,
                top: point.y - size / 2,
                backgroundColor: KEYPOINT_COLORS[kp.name] || '#FFFFFF',
                borderColor: getConnectionColor(formScore),
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bone: {
    position: 'absolute',
    borderRadius: 2,
    opacity: 0.8,
  },
  keypoint: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});