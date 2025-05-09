import React from 'react';
import styled from 'styled-components';
import { useCameraFeatures } from '../context/CameraFeaturesContext';

const ControlsContainer = styled.div`
  position: absolute;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TopControls = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 16px;
  top: 0;
`;

const BottomControls = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20px;
  bottom: 0;
`;

const ControlButton = styled.button`
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  
  &:active {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const FlashButton = styled(ControlButton)`
  position: relative;

  &::after {
    content: '${props => props.$flashMode}';
    position: absolute;
    bottom: -20px;
    font-size: 12px;
    white-space: nowrap;
  }
`;

const CaptureButton = styled.button`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 3px solid white;
  background-color: ${props => props.$isVideoMode ? (props.$isRecording ? '#ff0000' : 'white') : 'white'};
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  
  &::before {
    content: '';
    display: ${props => props.$isVideoMode ? 'block' : 'none'};
    width: ${props => props.$isRecording ? '20px' : '40px'};
    height: ${props => props.$isRecording ? '20px' : '40px'};
    background-color: ${props => props.$isRecording ? 'white' : '#ff0000'};
    border-radius: ${props => props.$isRecording ? '0' : '5px'};
  }
`;

const ModeSelector = styled.div`
  display: flex;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 20px;
`;

const ModeOption = styled.button`
  background-color: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  color: white;
  border: none;
  padding: 8px 16px;
  font-size: 14px;
  
  &:active {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

const DurationSelector = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  bottom: 100px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  padding: 10px;
`;

const DurationOption = styled.button`
  background-color: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  color: white;
  border: none;
  padding: 8px 16px;
  margin: 2px 0;
  border-radius: 5px;
  font-size: 14px;
  
  &:active {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

function CameraControls() {
  const {
    switchCamera,
    flashMode,
    setFlashMode,
    startTimer,
    isVideoMode,
    setIsVideoMode,
    recordingDuration,
    setRecordingDuration
  } = useCameraFeatures();
  
  const [showDurationSelector, setShowDurationSelector] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  
  const toggleFlash = () => {
    const modes = ['off', 'on', 'auto'];
    const currentIndex = modes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFlashMode(modes[nextIndex]);
  };
  
  const toggleMode = () => {
    setIsVideoMode(prev => !prev);
    setIsRecording(false);
  };
  
  const toggleDurationSelector = () => {
    setShowDurationSelector(prev => !prev);
  };
  
  const selectDuration = (duration) => {
    setRecordingDuration(duration);
    setShowDurationSelector(false);
  };
  
  return (
    <>
      <ControlsContainer>
        <TopControls>
          <FlashButton 
            onClick={toggleFlash}
            $flashMode={flashMode}
            style={{ visibility: isVideoMode ? 'hidden' : 'visible' }}
          >
            ⚡
          </FlashButton>
          
          <ControlButton onClick={startTimer} style={{ visibility: isVideoMode ? 'hidden' : 'visible' }}>
            ⏱️
          </ControlButton>
          
          <ControlButton onClick={switchCamera}>
            🔄
          </ControlButton>
        </TopControls>
        
        <BottomControls>
          <ModeSelector>
            <ModeOption 
              onClick={() => setIsVideoMode(false)}
              $active={!isVideoMode}
            >
              PHOTO
            </ModeOption>
            <ModeOption 
              onClick={() => setIsVideoMode(true)}
              $active={isVideoMode}
            >
              VIDEO
            </ModeOption>
          </ModeSelector>
          
          {isVideoMode && (
            <ControlButton onClick={toggleDurationSelector}>
              {recordingDuration}s
            </ControlButton>
          )}
          
          <CaptureButton 
            $isVideoMode={isVideoMode}
            $isRecording={isRecording}
          />
        </BottomControls>
        
        {showDurationSelector && (
          <DurationSelector>
            <DurationOption 
              onClick={() => selectDuration(10)}
              $active={recordingDuration === 10}
            >
              10s
            </DurationOption>
            <DurationOption 
              onClick={() => selectDuration(15)}
              $active={recordingDuration === 15}
            >
              15s
            </DurationOption>
            <DurationOption 
              onClick={() => selectDuration(30)}
              $active={recordingDuration === 30}
            >
              30s
            </DurationOption>
            <DurationOption 
              onClick={() => selectDuration(60)}
              $active={recordingDuration === 60}
            >
              60s
            </DurationOption>
          </DurationSelector>
        )}
      </ControlsContainer>
    </>
  );
}

export default CameraControls; 