# React Camera App

A full-featured React web camera application with advanced photo and video capabilities.

## Features

### Photo Capture
- Full-screen live preview at device's highest supported resolution (up to 1080×1920 px)
- Tap-to-focus and pinch-to-zoom with smooth transitions
- Adjustable flash: auto/on/off
- 3-second timer option with on-screen countdown overlay

### Video Recording
- H.264-encoded video capture at 720p or 1080p (user-selectable)
- Recording durations: 10s, 15s, 30s, and "unlimited" (up to 60s) modes
- Smooth start/stop with on-screen progress bar showing elapsed vs. remaining time
- Pause/resume within a single recording session (multiple clips stitched automatically)

### Camera Switching
- Toggle between front and rear cameras
- Maintain current zoom and filter settings when switching cameras

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/react-camera-app.git
cd react-camera-app

# Install dependencies
npm install

# Start the development server
npm start
```

The application will be available at http://localhost:3000.

## Browser Compatibility

This application uses modern web APIs including:
- MediaStream Recording API
- MediaDevices API
- MediaStreamTrack Capabilities API

For best results, use:
- Chrome 74+ (desktop or mobile)
- Firefox 66+ (desktop or mobile)
- Safari 13+ (iOS 13+)

> Note: Some features like camera torch control may only work on mobile devices with physical flash hardware.

## Camera Permissions

The app requires camera and microphone permissions to function properly. When you first open the app, your browser will prompt you to grant these permissions.

## Project Structure

```
src/
├── components/
│   ├── CameraApp.js       # Main camera container component
│   ├── CameraControls.js  # Camera control buttons and UI
│   ├── PhotoCapture.js    # Photo mode UI and functionality
│   └── VideoRecorder.js   # Video mode UI and functionality
├── context/
│   └── CameraFeaturesContext.js  # Context for sharing camera state
├── App.js                 # Application root component
└── index.js               # Entry point
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 