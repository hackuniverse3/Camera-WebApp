import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { useCameraFeatures } from '../context/CameraFeaturesContext';

const PhotoCaptureContainer = styled.div`
  position: absolute;
  bottom: 70px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ShutterButton = styled.button`
  width: 70px;
  height: 70px;
  border: 4px solid white;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  margin: 0 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  
  &:active {
    background-color: white;
    transform: scale(0.95);
  }
`;

const ZoomControl = styled.div`
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 30px;
  padding: 5px;
`;

const ZoomButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 20px;
  margin: 5px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:active {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const ZoomIndicator = styled.div`
  font-size: 12px;
  color: white;
  text-align: center;
  margin: 5px 0;
`;

const PreviewOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const PhotoPreview = styled.img`
  max-width: 90%;
  max-height: 80%;
  object-fit: contain;
`;

const PreviewControls = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-top: 20px;
`;

const PreviewButton = styled.button`
  background-color: transparent;
  border: none;
  color: white;
  font-size: 16px;
  padding: 10px 20px;
  
  &:active {
    color: #ccc;
  }
`;

function PhotoCapture() {
  const {
    videoRef,
    isTimerActive,
    startTimer,
    zoomLevel,
    setZoomLevel,
    flashMode
  } = useCameraFeatures();
  
  const canvasRef = useRef(null);
  const [photoData, setPhotoData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const handleZoom = (direction) => {
    const ZOOM_STEP = 0.5;
    const MAX_ZOOM = 5;
    const MIN_ZOOM = 1;
    
    let newZoom = zoomLevel;
    if (direction === 'in') {
      newZoom = Math.min(newZoom + ZOOM_STEP, MAX_ZOOM);
    } else {
      newZoom = Math.max(newZoom - ZOOM_STEP, MIN_ZOOM);
    }
    
    setZoomLevel(newZoom);
  };
  
  const capturePhoto = () => {
    if (isTimerActive) return;
    
    if (!videoRef.current) {
      console.error('Video element not available');
      return;
    }
    
    // If timer is requested, start timer and capture when it completes
    if (flashMode === 'auto' || flashMode === 'on') {
      startTimer();
      const captureTimeout = setTimeout(() => {
        takePhoto();
        clearTimeout(captureTimeout);
      }, 3000);
      return;
    }
    
    takePhoto();
  };
  
  const takePhoto = () => {
    if (!videoRef.current) return;
    
    // Create canvas if it doesn't exist
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get photo data as URL
    const photoDataUrl = canvas.toDataURL('image/jpeg');
    setPhotoData(photoDataUrl);
    setShowPreview(true);
  };
  
  const savePhoto = () => {
    if (!photoData) return;
    
    // Create download link
    const link = document.createElement('a');
    link.href = photoData;
    link.download = `photo_${new Date().toISOString()}.jpg`;
    link.click();
    
    setShowPreview(false);
  };
  
  const discardPhoto = () => {
    setPhotoData(null);
    setShowPreview(false);
  };
  
  return (
    <>
      <PhotoCaptureContainer>
        <ShutterButton onClick={capturePhoto} />
      </PhotoCaptureContainer>
      
      <ZoomControl>
        <ZoomButton onClick={() => handleZoom('in')}>+</ZoomButton>
        <ZoomIndicator>{zoomLevel.toFixed(1)}x</ZoomIndicator>
        <ZoomButton onClick={() => handleZoom('out')}>−</ZoomButton>
      </ZoomControl>
      
      {showPreview && (
        <PreviewOverlay>
          <PhotoPreview src={photoData} alt="Captured" />
          <PreviewControls>
            <PreviewButton onClick={discardPhoto}>Discard</PreviewButton>
            <PreviewButton onClick={savePhoto}>Save</PreviewButton>
          </PreviewControls>
        </PreviewOverlay>
      )}
    </>
  );
}

export default PhotoCapture; 