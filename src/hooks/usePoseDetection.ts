import { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { Pose, Keypoint } from '@/types/exercise';

export function usePoseDetection(
  videoRef: React.RefObject<HTMLVideoElement>,
  isActive: boolean
) {
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const [pose, setPose] = useState<Pose | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const animationFrameRef = useRef<number>();

  const initModel = useCallback(async () => {
    try {
      await tf.ready();
      await tf.setBackend('webgl');
      
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
        }
      );
      
      detectorRef.current = detector;
      setIsModelReady(true);
    } catch (error) {
      console.error('Failed to load pose detection model:', error);
    }
  }, []);

  const detectPose = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current || !isActive) return;

    const video = videoRef.current;
    if (video.readyState < 2) return;

    try {
      const poses = await detectorRef.current.estimatePoses(video, {
        flipHorizontal: false,
      });

      if (poses.length > 0) {
        const detectedPose = poses[0];
        const keypoints: Keypoint[] = detectedPose.keypoints.map((kp) => ({
          x: kp.x,
          y: kp.y,
          score: kp.score || 0,
          name: kp.name,
        }));

        setPose({
          keypoints,
          score: detectedPose.score || 0,
        });
      }
    } catch (error) {
      console.error('Pose detection error:', error);
    }
  }, [videoRef, isActive]);

  const startDetection = useCallback(() => {
    const loop = async () => {
      await detectPose();
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, [detectPose]);

  const stopDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  useEffect(() => {
    initModel();
    return () => {
      stopDetection();
      detectorRef.current?.dispose();
    };
  }, [initModel, stopDetection]);

  useEffect(() => {
    if (isActive && isModelReady) {
      startDetection();
    } else {
      stopDetection();
    }
    return () => stopDetection();
  }, [isActive, isModelReady, startDetection, stopDetection]);

  return { pose, isModelReady };
}