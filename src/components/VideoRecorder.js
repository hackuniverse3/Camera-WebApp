import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useCameraFeatures } from '../context/CameraFeaturesContext';

const RecorderContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const RecordButton = styled.button`
  position: absolute;
  bottom: 70px;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: ${props => props.$isRecording ? 'rgba(255, 0, 0, 0.7)' : '#ff0000'};
  border: 4px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '';
    display: block;
    width: ${props => props.$isRecording ? '20px' : '30px'};
    height: ${props => props.$isRecording ? '20px' : '30px'};
    background-color: ${props => props.$isRecording ? 'white' : '#ff0000'};
    border-radius: ${props => props.$isRecording ? '0' : '0'};
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const RecordingInfo = styled.div`
  position: absolute;
  top: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  padding: 5px 10px;
  display: flex;
  align-items: center;
`;

const RecordingTime = styled.span`
  color: white;
  font-size: 16px;
  margin-left: 5px;
`;

const RecordingDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ff0000;
  margin-right: 5px;
  animation: blink 1s infinite;
  
  @keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0.3; }
    100% { opacity: 1; }
  }
`;

const ProgressBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
`;

const Progress = styled.div`
  height: 100%;
  width: ${props => props.$progress}%;
  background-color: #ff0000;
  transition: width 0.1s linear;
`;

const ControlsOverlay = styled.div`
  position: absolute;
  bottom: 140px;
  display: flex;
  justify-content: space-around;
  width: 80%;
`;

const ControlButton = styled.button`
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 20px;
  color: white;
  padding: 8px 15px;
  font-size: 14px;
  
  &:active {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const ResolutionSelector = styled.div`
  position: absolute;
  right: 20px;
  top: 100px;
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  overflow: hidden;
`;

const ResolutionOption = styled.button`
  background-color: ${props => props.$isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  border: none;
  color: white;
  padding: 8px 15px;
  font-size: 14px;
  text-align: left;
  
  &:active {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

function VideoRecorder() {
  const {
    videoRef,
    mediaStreamRef,
    recordingDuration,
    zoomLevel,
    setZoomLevel
  } = useCameraFeatures();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showResolutionSelector, setShowResolutionSelector] = useState(false);
  const [videoResolution, setVideoResolution] = useState('1080p');
  
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);
  
  useEffect(() => {
    // Clean up on unmount
    return () => {
      clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);
  
  const startRecording = () => {
    if (!videoRef.current || !mediaStreamRef.current || isRecording) return;
    
    try {
      // Add audio track to stream if not present
      if (!mediaStreamRef.current.getAudioTracks().length) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(audioStream => {
            const audioTrack = audioStream.getAudioTracks()[0];
            mediaStreamRef.current.addTrack(audioTrack);
            setupRecorder();
          })
          .catch(err => {
            console.error('Error getting audio: ', err);
            // Continue with video only if audio fails
            setupRecorder();
          });
      } else {
        setupRecorder();
      }
    } catch (err) {
      console.error('Error starting recording: ', err);
    }
  };
  
  const setupRecorder = () => {
    const options = {
      mimeType: 'video/webm;codecs=h264',
      videoBitsPerSecond: videoResolution === '1080p' ? 2500000 : 1500000
    };
    
    try {
      const mediaRecorder = new MediaRecorder(mediaStreamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = finishRecording;
      
      // Start recording
      mediaRecorder.start(1000); // Capture in 1-second chunks
      setIsRecording(true);
      setElapsedTime(0);
      
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      
      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000));
      }, 100);
      
      // Set timeout to stop recording based on duration
      if (recordingDuration < 60) { // Only apply for non-unlimited recordings
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            stopRecording();
          }
        }, recordingDuration * 1000);
      }
    } catch (err) {
      console.error('Error setting up media recorder: ', err);
      
      // Try fallback to VP8 if H.264 is not supported
      try {
        const fallbackOptions = {
          mimeType: 'video/webm;codecs=vp8',
        };
        const mediaRecorder = new MediaRecorder(mediaStreamRef.current, fallbackOptions);
        mediaRecorderRef.current = mediaRecorder;
        // Continue with setup as before
        mediaRecorder.ondataavailable = event => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = finishRecording;
        mediaRecorder.start(1000);
        setIsRecording(true);
        setElapsedTime(0);
        
        startTimeRef.current = Date.now();
        pausedTimeRef.current = 0;
        
        timerRef.current = setInterval(() => {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000));
        }, 100);
      } catch (fallbackErr) {
        console.error('Error with fallback recorder: ', fallbackErr);
      }
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
      setIsPaused(false);
    }
  };
  
  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      pausedTimeRef.current -= Date.now();
      clearInterval(timerRef.current);
      setIsPaused(true);
    }
  };
  
  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      pausedTimeRef.current += Date.now();
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000));
      }, 100);
      
      setIsPaused(false);
    }
  };
  
  const toggleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };
  
  const togglePause = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };
  
  const toggleResolutionSelector = () => {
    setShowResolutionSelector(prev => !prev);
  };
  
  const selectResolution = (resolution) => {
    setVideoResolution(resolution);
    setShowResolutionSelector(false);
  };
  
  const finishRecording = () => {
    try {
      const blob = new Blob(recordedChunksRef.current, {
        type: 'video/webm'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `video_${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Error saving recording: ', err);
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const calculateProgress = () => {
    if (recordingDuration >= 60) {
      // For "unlimited" recording, cap at 60 seconds
      return (elapsedTime / 60) * 100;
    }
    return (elapsedTime / recordingDuration) * 100;
  };
  
  return (
    <RecorderContainer>
      <ProgressBar>
        <Progress $progress={calculateProgress()} />
      </ProgressBar>
      
      {isRecording && (
        <RecordingInfo>
          <RecordingDot />
          <RecordingTime>{formatTime(elapsedTime)}</RecordingTime>
        </RecordingInfo>
      )}
      
      <RecordButton 
        onClick={toggleRecording}
        $isRecording={isRecording}
      />
      
      {isRecording && (
        <ControlsOverlay>
          <ControlButton onClick={togglePause}>
            {isPaused ? 'Resume' : 'Pause'}
          </ControlButton>
        </ControlsOverlay>
      )}
      
      {!isRecording && (
        <>
          <ControlButton 
            style={{ position: 'absolute', right: 20, top: 70 }}
            onClick={toggleResolutionSelector}
          >
            {videoResolution}
          </ControlButton>
          
          {showResolutionSelector && (
            <ResolutionSelector>
              <ResolutionOption 
                onClick={() => selectResolution('720p')}
                $isActive={videoResolution === '720p'}
              >
                720p
              </ResolutionOption>
              <ResolutionOption 
                onClick={() => selectResolution('1080p')}
                $isActive={videoResolution === '1080p'}
              >
                1080p
              </ResolutionOption>
            </ResolutionSelector>
          )}
        </>
      )}
    </RecorderContainer>
  );
}

export default VideoRecorder; 