import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import CameraControls from './CameraControls';
import VideoRecorder from './VideoRecorder';
import PhotoCapture from './PhotoCapture';
import { CameraFeaturesProvider } from '../context/CameraFeaturesContext';

const CameraContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #000;
`;

const VideoPreview = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: ${props => props.$isFrontCamera ? 'scaleX(-1)' : 'none'};
`;

const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  
  > * {
    pointer-events: auto;
  }
`;

const TimerOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 120px;
  color: white;
  background-color: rgba(0, 0, 0, 0.3);
`;

function CameraApp() {
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  const [flashMode, setFlashMode] = useState('off'); // 'off', 'on', 'auto'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerValue, setTimerValue] = useState(0);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(30); // Default 30s
  
  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        // Enumerate devices to find cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameraDevices(videoDevices);
        
        // Default to back camera (if available)
        const backCamera = videoDevices.find(d => !(/front|user/i.test(d.label)));
        const defaultCamera = backCamera || videoDevices[0];
        
        if (defaultCamera) {
          setCurrentCameraId(defaultCamera.deviceId);
          await startCamera(defaultCamera.deviceId, false);
        }
      } catch (err) {
        console.error('Error initializing camera:', err);
      }
    };
    
    initCamera();
    
    return () => {
      // Cleanup
      if (mediaStreamRef.current) {
        const tracks = mediaStreamRef.current.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
  
  const startCamera = async (deviceId, isFront) => {
    try {
      // If there's an existing stream, stop its tracks
      if (mediaStreamRef.current) {
        const tracks = mediaStreamRef.current.getTracks();
        tracks.forEach(track => track.stop());
      }
      
      // Get the highest resolution available
      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: isFront ? 'user' : 'environment'
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsInitialized(true);
        setIsFrontCamera(isFront);
      }
      
      // Apply zoom if supported
      applyZoom(zoomLevel);
      
      // Apply flash if supported and on
      applyFlash(flashMode);
      
    } catch (err) {
      console.error('Error starting camera:', err);
    }
  };
  
  const switchCamera = async () => {
    const newIsFront = !isFrontCamera;
    
    // Find a camera of the opposite type
    const targetCamera = cameraDevices.find(device => {
      if (newIsFront) {
        return /front|user/i.test(device.label);
      } else {
        return !(/front|user/i.test(device.label));
      }
    }) || cameraDevices[0];
    
    if (targetCamera) {
      setCurrentCameraId(targetCamera.deviceId);
      await startCamera(targetCamera.deviceId, newIsFront);
    }
  };
  
  const applyZoom = (zoomValue) => {
    if (!mediaStreamRef.current) return;
    
    const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    
    try {
      const capabilities = videoTrack.getCapabilities();
      
      if (capabilities.zoom) {
        const constraints = {
          advanced: [{ zoom: zoomValue }]
        };
        videoTrack.applyConstraints(constraints);
        setZoomLevel(zoomValue);
      }
    } catch (err) {
      console.error('Error applying zoom:', err);
    }
  };
  
  const applyFlash = (mode) => {
    if (!mediaStreamRef.current) return;
    
    const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    
    try {
      const capabilities = videoTrack.getCapabilities();
      
      if (capabilities.torch) {
        const constraints = {
          advanced: [{ torch: mode === 'on' }]
        };
        videoTrack.applyConstraints(constraints);
      }
      
      setFlashMode(mode);
    } catch (err) {
      console.error('Error controlling flash:', err);
    }
  };
  
  const startTimer = () => {
    setIsTimerActive(true);
    setTimerValue(3);
    
    const interval = setInterval(() => {
      setTimerValue(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const handleTapToFocus = (event) => {
    if (!mediaStreamRef.current) return;
    
    const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    
    try {
      const capabilities = videoTrack.getCapabilities();
      
      if (!capabilities.focusDistance && !capabilities.focusMode) {
        return; // Focus not supported
      }
      
      const videoElement = videoRef.current;
      const { clientX, clientY } = event;
      
      // Convert to normalized coordinates (0-1)
      const x = clientX / videoElement.clientWidth;
      const y = clientY / videoElement.clientHeight;
      
      // Check if the track supports point of interest focusing
      if (capabilities.focusMode && capabilities.focusMode.includes('single-shot')) {
        const constraints = {
          advanced: [
            {
              focusMode: 'single-shot',
              focusDistance: 0, // Auto focus
              pointsOfInterest: [{ x, y }]
            }
          ]
        };
        
        videoTrack.applyConstraints(constraints);
      }
    } catch (err) {
      console.error('Error setting focus point:', err);
    }
  };
  
  const contextValue = {
    videoRef,
    mediaStreamRef,
    isInitialized,
    isFrontCamera,
    switchCamera,
    flashMode,
    setFlashMode: applyFlash,
    zoomLevel, 
    setZoomLevel: applyZoom,
    startTimer,
    isTimerActive,
    isVideoMode,
    setIsVideoMode,
    recordingDuration,
    setRecordingDuration
  };
  
  return (
    <CameraFeaturesProvider value={contextValue}>
      <CameraContainer>
        <VideoPreview 
          ref={videoRef} 
          $isFrontCamera={isFrontCamera}
          onClick={handleTapToFocus}
          playsInline
          muted
        />
        
        <OverlayContainer>
          {isVideoMode ? (
            <VideoRecorder />
          ) : (
            <PhotoCapture />
          )}
          
          <CameraControls />
          
          {isTimerActive && (
            <TimerOverlay>
              {timerValue}
            </TimerOverlay>
          )}
        </OverlayContainer>
      </CameraContainer>
    </CameraFeaturesProvider>
  );
}

export default CameraApp; 