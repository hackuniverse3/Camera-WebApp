// 📸 Real-Time Mobile Camera with Enhanced AI Filters (Web Version)

import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as bodyPix from '@tensorflow-models/body-pix';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

export default function Camera() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const mediaRecorderRef = useRef();
  const chunksRef = useRef([]);
  const netRef = useRef(null);
  const faceNetRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const setup = async () => {
      await tf.setBackend('webgl');
      const net = await bodyPix.load();
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const faceNet = await faceLandmarksDetection.load(model, {
        runtime: 'tfjs',
      });
      netRef.current = net;
      faceNetRef.current = faceNet;
      setLoading(false);
    };
    setup();
  }, []);

  const startCamera = async () => {
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devs.filter(d => d.kind === 'videoinput');
      setDevices(videoInputs);
      const selectedId = deviceId || videoInputs[0]?.deviceId;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedId ? { exact: selectedId } : undefined,
          width: { ideal: 720 },
          height: { ideal: 1280 },
          facingMode: 'environment'
        },
        audio: false
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      requestAnimationFrame(processFrame);
    } catch (err) {
      alert("Camera permission denied or unsupported: " + err.message);
    }
  };

  const processFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !netRef.current || !faceNetRef.current) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const segmentation = await netRef.current.segmentPerson(video);
    const faces = await faceNetRef.current.estimateFaces({ input: video });

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < segmentation.data.length; i++) {
      if (!segmentation.data[i]) {
        data[i * 4 + 0] *= 0.25;
        data[i * 4 + 1] *= 0.25;
        data[i * 4 + 2] *= 0.25;
      }
    }

    faces.forEach(face => {
      face.keypoints.forEach(kp => {
        const x = Math.floor(kp.x);
        const y = Math.floor(kp.y);
        const i = (y * canvas.width + x) * 4;
        if (i >= 0 && i < data.length - 4) {
          data[i + 0] = Math.min(255, data[i + 0] * 1.2);
          data[i + 1] = Math.min(255, data[i + 1] * 1.2);
          data[i + 2] = Math.min(255, data[i + 2] * 1.2);
        }
      });
    });

    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(processFrame);
  };

  const startRecording = () => {
    const stream = canvasRef.current.captureStream();
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];
    mediaRecorder.ondataavailable = e => chunksRef.current.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recording.webm';
      a.click();
    };
    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div>
      <h2>🎥 Live AI Camera with Effects</h2>
      {loading ? (
        <p>⏳ Loading AI models...</p>
      ) : (
        <>
          <select onChange={e => setDeviceId(e.target.value)}>
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
            ))}
          </select>
          <button onClick={startCamera}>Start Camera</button>
          <button onClick={recording ? stopRecording : startRecording}>
            {recording ? 'Stop Recording' : 'Start Recording'}
          </button>
          <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
          <canvas ref={canvasRef} style={{ width: '100%' }} />
        </>
      )}
    </div>
  );
}
