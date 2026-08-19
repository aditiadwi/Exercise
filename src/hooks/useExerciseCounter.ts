import { useEffect, useRef, useState, useCallback } from 'react';
import { Pose, ExerciseType, EXERCISES, Keypoint } from '@/types/exercise';

export interface ExerciseState {
  count: number;
  stage: 'up' | 'down' | 'ready';
  formScore: number;
  feedback: string;
}

function calculateAngle(p1: Keypoint, p2: Keypoint, p3: Keypoint): number {
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
}

function getKeypoint(pose: Pose, name: string): Keypoint | undefined {
  return pose.keypoints.find(kp => kp.name === name);
}

function calculateFormScore(pose: Pose, exerciseType: ExerciseType): number {
  const config = EXERCISES[exerciseType];
  let score = 100;
  const penalties: number[] = [];

  if (exerciseType === 'pushup') {
    const leftShoulder = getKeypoint(pose, 'left_shoulder');
    const rightShoulder = getKeypoint(pose, 'right_shoulder');
    const leftHip = getKeypoint(pose, 'left_hip');
    const rightHip = getKeypoint(pose, 'right_hip');
    const leftAnkle = getKeypoint(pose, 'left_ankle');
    const rightAnkle = getKeypoint(pose, 'right_ankle');

    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
      const hipMidX = (leftHip.x + rightHip.x) / 2;
      const alignmentDiff = Math.abs(shoulderMidX - hipMidX);
      if (alignmentDiff > 30) penalties.push(20);
    }

    if (leftHip && rightHip && leftAnkle && rightAnkle) {
      const hipMidY = (leftHip.y + rightHip.y) / 2;
      const ankleMidY = (leftAnkle.y + rightAnkle.y) / 2;
      const shoulderMidY = (leftShoulder?.y || 0 + rightShoulder?.y || 0) / 2;
      const bodyLength = Math.abs(shoulderMidY - ankleMidY);
      const hipDeviation = Math.abs(hipMidY - (shoulderMidY + ankleMidY) / 2);
      if (hipDeviation > bodyLength * 0.15) penalties.push(25);
    }
  }

  if (exerciseType === 'situp') {
    const leftKnee = getKeypoint(pose, 'left_knee');
    const rightKnee = getKeypoint(pose, 'right_knee');
    const leftAnkle = getKeypoint(pose, 'left_ankle');
    const rightAnkle = getKeypoint(pose, 'right_ankle');

    if (leftKnee && rightKnee && leftAnkle && rightAnkle) {
      const kneeMidX = (leftKnee.x + rightKnee.x) / 2;
      const ankleMidX = (leftAnkle.x + rightAnkle.x) / 2;
      if (Math.abs(kneeMidX - ankleMidX) > 50) penalties.push(15);
    }
  }

  if (exerciseType === 'squat') {
    const leftHip = getKeypoint(pose, 'left_hip');
    const rightHip = getKeypoint(pose, 'right_hip');
    const leftKnee = getKeypoint(pose, 'left_knee');
    const rightKnee = getKeypoint(pose, 'right_knee');
    const leftAnkle = getKeypoint(pose, 'left_ankle');
    const rightAnkle = getKeypoint(pose, 'right_ankle');

    if (leftKnee && rightKnee && leftAnkle && rightAnkle) {
      const kneeMidX = (leftKnee.x + rightKnee.x) / 2;
      const ankleMidX = (leftAnkle.x + rightAnkle.x) / 2;
      if (kneeMidX > ankleMidX + 30) penalties.push(20);
    }

    if (leftHip && rightHip && leftKnee && rightKnee) {
      const hipMidY = (leftHip.y + rightHip.y) / 2;
      const kneeMidY = (leftKnee.y + rightKnee.y) / 2;
      if (hipMidY > kneeMidY) penalties.push(15);
    }
  }

  penalties.forEach(p => score -= p);
  return Math.max(0, score);
}

export function useExerciseCounter(pose: Pose | null, exerciseType: ExerciseType) {
  const [state, setState] = useState<ExerciseState>({
    count: 0,
    stage: 'ready',
    formScore: 100,
    feedback: 'Get in position',
  });
  const angleRef = useRef<number>(0);
  const lastCountRef = useRef<number>(0);

  const config = EXERCISES[exerciseType];

  useEffect(() => {
    if (!pose) return;

    const joint = getKeypoint(pose, config.referencePoints.joint);
    const point1 = getKeypoint(pose, config.referencePoints.point1);
    const point2 = getKeypoint(pose, config.referencePoints.point2);

    if (!joint || !point1 || !point2) {
      setState(prev => ({ ...prev, feedback: 'Adjust camera - body not fully visible' }));
      return;
    }

    if (joint.score < 0.5 || point1.score < 0.5 || point2.score < 0.5) {
      setState(prev => ({ ...prev, feedback: 'Low confidence - improve lighting/position' }));
      return;
    }

    const angle = calculateAngle(point1, joint, point2);
    angleRef.current = angle;

    const formScore = calculateFormScore(pose, exerciseType);
    let newStage = state.stage;
    let feedback = '';
    let newCount = state.count;

    if (exerciseType === 'pushup' || exerciseType === 'squat') {
      if (angle < config.angleThresholds.down && state.stage !== 'down') {
        newStage = 'down';
        feedback = 'Good! Now push up';
      } else if (angle > config.angleThresholds.up && state.stage === 'down') {
        newStage = 'up';
        newCount = state.count + 1;
        lastCountRef.current = newCount;
        feedback = formScore > 70 ? `Rep ${newCount}! Great form!` : `Rep ${newCount} - Fix your form`;
      } else if (state.stage === 'up' && angle < config.angleThresholds.up - 20) {
        newStage = 'ready';
        feedback = 'Get ready for next rep';
      } else if (state.stage === 'ready' && angle > config.angleThresholds.up - 10) {
        feedback = 'Lower down slowly';
      } else if (state.stage === 'down') {
        feedback = 'Push up!';
      }
    } else if (exerciseType === 'situp') {
      if (angle < config.angleThresholds.up && state.stage !== 'up') {
        newStage = 'up';
        newCount = state.count + 1;
        lastCountRef.current = newCount;
        feedback = formScore > 70 ? `Rep ${newCount}! Good!` : `Rep ${newCount} - Engage core more`;
      } else if (angle > config.angleThresholds.down && state.stage === 'up') {
        newStage = 'down';
        feedback = 'Lower down with control';
      } else if (state.stage === 'down') {
        feedback = 'Sit up!';
      } else {
        feedback = 'Lie back to start';
      }
    }

    setState(prev => ({
      ...prev,
      count: newCount,
      stage: newStage,
      formScore,
      feedback,
    }));
  }, [pose, exerciseType, config, state.stage, state.count]);

  const reset = useCallback(() => {
    setState({
      count: 0,
      stage: 'ready',
      formScore: 100,
      feedback: 'Get in position',
    });
    lastCountRef.current = 0;
  }, []);

  return { ...state, angle: angleRef.current, reset };
}