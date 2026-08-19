export type ExerciseType = 'pushup' | 'situp' | 'squat';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  elo: number;
  rank: string;
  badge: string;
}

export interface Keypoint {
  x: number;
  y: number;
  score: number;
  name: string;
}

export interface Pose {
  keypoints: Keypoint[];
  score: number;
}

export interface ExerciseConfig {
  name: string;
  type: ExerciseType;
  keypoints: string[];
  angleThresholds: {
    down: number;
    up: number;
  };
  referencePoints: {
    joint: string;
    point1: string;
    point2: string;
  };
}

export const EXERCISES: Record<ExerciseType, ExerciseConfig> = {
  pushup: {
    name: 'Push-up',
    type: 'pushup',
    keypoints: ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
    angleThresholds: {
      down: 90,
      up: 160,
    },
    referencePoints: {
      joint: 'left_elbow',
      point1: 'left_shoulder',
      point2: 'left_wrist',
    },
  },
  situp: {
    name: 'Sit-up',
    type: 'situp',
    keypoints: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
    angleThresholds: {
      down: 160,
      up: 60,
    },
    referencePoints: {
      joint: 'left_hip',
      point1: 'left_shoulder',
      point2: 'left_knee',
    },
  },
  squat: {
    name: 'Squat',
    type: 'squat',
    keypoints: ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle', 'left_shoulder', 'right_shoulder'],
    angleThresholds: {
      down: 90,
      up: 160,
    },
    referencePoints: {
      joint: 'left_knee',
      point1: 'left_hip',
      point2: 'left_ankle',
    },
  },
};

export const KEYPOINT_CONNECTIONS: [string, string][] = [
  ['nose', 'left_eye'],
  ['nose', 'right_eye'],
  ['left_eye', 'left_ear'],
  ['right_eye', 'right_ear'],
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];