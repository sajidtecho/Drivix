import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Video, Volume2, VolumeX, ShieldAlert, AlertTriangle, Info, Play, Square } from 'lucide-react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

// Euclidean distance helper
const distance = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

// Eye Aspect Ratio calculation
const calculateEar = (landmarks, eyeIndices) => {
  const p1 = landmarks[eyeIndices[0]];
  const p2 = landmarks[eyeIndices[1]];
  const p3 = landmarks[eyeIndices[2]];
  const p4 = landmarks[eyeIndices[3]];
  const p5 = landmarks[eyeIndices[4]];
  const p6 = landmarks[eyeIndices[5]];

  const vertical1 = distance(p2, p6);
  const vertical2 = distance(p3, p5);
  const horizontal = distance(p1, p4);

  if (horizontal === 0) return 0;
  return (vertical1 + vertical2) / (2.0 * horizontal);
};

// MediaPipe landmarks for eyes
const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];

export default function ActiveCopilot() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Loading Drivix AI Core...');
  const [isActive, setIsActive] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [usePythonLink, setUsePythonLink] = useState(false);
  const socketRef = useRef(null);

  // AI & Detection States
  const [avgEyeOpenness, setAvgEyeOpenness] = useState(100);
  const [phoneDetected, setPhoneDetected] = useState(false);
  const [phoneConf, setPhoneConf] = useState(0);
  const [drowsyAlert, setDrowsyAlert] = useState(false);
  const [systemLogs, setSystemLogs] = useState([]);

  // DOM / Audio Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const logsContainerRef = useRef(null);

  // MediaPipe / TFJS Instances
  const faceMeshRef = useRef(null);
  const cocoSsdRef = useRef(null);
  const animationFrameRef = useRef(null);
  const faceMeshActiveRef = useRef(false);

  // Alert tracking timers
  const eyesClosedStartRef = useRef(null);

  // Helper to append logs
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  // Load CDN scripts sequentially
  useEffect(() => {
    let active = true;

    const loadScripts = async () => {
      try {
        setLoadingProgress(10);
        setLoadingText('Initializing TensorFlow.js...');
        if (!window.tf) {
          await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs');
        }
        if (!active) return;

        setLoadingProgress(35);
        setLoadingText('Loading COCO-SSD Object Detector...');
        if (!window.cocoSsd) {
          await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd');
        }
        if (!active) return;

        setLoadingProgress(60);
        setLoadingText('Loading MediaPipe Face Utilities...');
        if (!window.Camera) {
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        }
        if (!window.FaceMesh) {
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
        }
        if (!active) return;

        setLoadingProgress(80);
        setLoadingText('Compiling AI Weights...');
        
        // Initialize COCO-SSD
        cocoSsdRef.current = await window.cocoSsd.load();
        
        // Initialize MediaPipe FaceMesh
        const faceMesh = new window.FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults(onFaceMeshResults);
        faceMeshRef.current = faceMesh;

        setLoadingProgress(100);
        setLoading(false);
        addLog('AI Safety Core online. Standby.');
      } catch (err) {
        console.error('Failed to load AI Models:', err);
        setLoadingText('Failed to load models. Refresh to retry.');
      }
    };

    loadScripts();

    return () => {
      active = false;
      stopScanner();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  // Synthesize Alarm using Web Audio API
  const playAlertSound = (type) => {
    if (!soundEnabled) return;
    
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'drowsy') {
        // High pitch siren alert
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else {
        // Distraction alarm pulse
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  };

  // Start the alarm interval when alerts are active
  useEffect(() => {
    if (soundEnabled && (drowsyAlert || phoneDetected)) {
      if (!alarmIntervalRef.current) {
        alarmIntervalRef.current = setInterval(() => {
          if (drowsyAlert) {
            playAlertSound('drowsy');
          } else if (phoneDetected) {
            playAlertSound('phone');
          }
        }, 300);
      }
    } else {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    }

    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    };
  }, [drowsyAlert, phoneDetected, soundEnabled]);

  // Handle MediaPipe results
  const onFaceMeshResults = (results) => {
    if (!faceMeshActiveRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      // Calculate EAR
      const leftEar = calculateEar(landmarks, LEFT_EYE_INDICES);
      const rightEar = calculateEar(landmarks, RIGHT_EYE_INDICES);
      const avgEar = (leftEar + rightEar) / 2;

      // Normalize EAR percentage (typically between 0.12 and 0.32)
      const minEar = 0.14;
      const maxEar = 0.30;
      let openness = ((avgEar - minEar) / (maxEar - minEar)) * 100;
      openness = Math.max(0, Math.min(100, openness));
      setAvgEyeOpenness(Math.round(openness));

      // Drowsiness tracking logic
      if (openness < 25) {
        if (!eyesClosedStartRef.current) {
          eyesClosedStartRef.current = Date.now();
        } else {
          const duration = (Date.now() - eyesClosedStartRef.current) / 1000;
          if (duration >= 1.5) {
            if (!drowsyAlert) {
              setDrowsyAlert(true);
              addLog('DROWSINESS WARNING: WAKE UP!');
            }
          }
        }
      } else {
        eyesClosedStartRef.current = null;
        if (drowsyAlert) {
          setDrowsyAlert(false);
          addLog('Drowsiness warning cleared.');
        }
      }

      // Draw Face Wireframe overlay
      ctx.fillStyle = '#00f2ff';
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)';
      ctx.lineWidth = 1;

      // Draw eye outline paths
      const drawEyeOutline = (indices) => {
        ctx.beginPath();
        indices.forEach((idx, i) => {
          const pt = landmarks[idx];
          if (i === 0) ctx.moveTo(pt.x * canvas.width, pt.y * canvas.height);
          else ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
        });
        ctx.closePath();
        ctx.strokeStyle = '#ffce00';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      };

      drawEyeOutline(LEFT_EYE_INDICES);
      drawEyeOutline(RIGHT_EYE_INDICES);

      // Render facial landmarks keypoints
      landmarks.forEach((pt, index) => {
        // Draw every 5th landmark to prevent overcrowding
        if (index % 5 === 0) {
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 1, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

    } else {
      // No face detected
      setAvgEyeOpenness(100);
      eyesClosedStartRef.current = null;
      if (drowsyAlert) {
        setDrowsyAlert(false);
      }
    }
  };

  // Start Scanner webcam & processing loops
  const startScanner = async () => {
    if (demoMode) {
      stopDemo();
    }

    try {
      addLog('Accessing camera permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsActive(true);
      faceMeshActiveRef.current = true;
      addLog('Camera streaming started.');

      // Setup COCO-SSD phone loop
      let processing = false;
      const detectPhone = async () => {
        if (!faceMeshActiveRef.current) return;
        const video = videoRef.current;
        if (video && video.readyState === 4 && cocoSsdRef.current && !processing) {
          processing = true;
          try {
            const predictions = await cocoSsdRef.current.detect(video);
            
            // Check for cell phone
            const phone = predictions.find(
              (p) => p.class === 'cell phone' && p.score > 0.45
            );

            if (phone) {
              setPhoneDetected(true);
              setPhoneConf(Math.round(phone.score * 100));
              
              // Draw bounding box
              const canvas = canvasRef.current;
              if (canvas) {
                const ctx = canvas.getContext('2d');
                const [x, y, w, h] = phone.bbox;
                
                // Draw alert box on canvas
                ctx.strokeStyle = '#ff4b4b';
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, w, h);

                ctx.fillStyle = '#ff4b4b';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText(`CELL PHONE DETECTED (${Math.round(phone.score * 100)}%)`, x, y > 15 ? y - 6 : y + 15);
              }
            } else {
              setPhoneDetected(false);
              setPhoneConf(0);
            }
          } catch (e) {
            console.error('COCO-SSD inference failed:', e);
          }
          processing = false;
        }

        if (faceMeshActiveRef.current) {
          setTimeout(detectPhone, 250); // Inference 4 times a second
        }
      };

      // Setup MediaPipe FaceMesh loop
      const detectFaceMesh = async () => {
        if (!faceMeshActiveRef.current) return;
        const video = videoRef.current;
        if (video && video.readyState === 4 && faceMeshRef.current) {
          try {
            await faceMeshRef.current.send({ image: video });
          } catch (e) {
            console.error('FaceMesh failed:', e);
          }
        }
        if (faceMeshActiveRef.current) {
          animationFrameRef.current = requestAnimationFrame(detectFaceMesh);
        }
      };

      // Launch loops
      detectPhone();
      detectFaceMesh();
      addLog('Active Co-Pilot active.');
    } catch (e) {
      console.error('Camera access denied:', e);
      addLog('Error: Camera permissions denied.');
      setIsActive(false);
    }
  };

  const stopScanner = () => {
    faceMeshActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Clean canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    setIsActive(false);
    setDrowsyAlert(false);
    setPhoneDetected(false);
    setAvgEyeOpenness(100);
    addLog('Scanner disabled. Standby.');
  };

  const startPythonLink = () => {
    setDemoMode(false);
    setIsActive(true);
    
    const socketUrl = API_BASE_URL.replace('/api/v1', '');
    addLog(`Connecting to Drivix telemetry stream at ${socketUrl}...`);
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      addLog('🔌 Connected to Drivix telemetry stream. Awaiting alerts...');
    });
    
    socket.on('connect_error', (err) => {
      addLog(`❌ Connection error: ${err.message}`);
    });
    
    socket.on('safetyAlertReceived', (data) => {
      addLog(`📥 Safety Alert Event: ${data.alertType}`);
      
      if (data.alertType === 'PHONE') {
        setPhoneDetected(true);
        setPhoneConf(100);
        setDrowsyAlert(false);
        setAvgEyeOpenness(100);
        addLog('⚠️ DISTRACTION WARNING: Phone usage detected by onboard system.');
      } else if (data.alertType === 'EYE') {
        setDrowsyAlert(true);
        setPhoneDetected(false);
        setPhoneConf(0);
        setAvgEyeOpenness(15);
        addLog('😴 DROWSINESS WARNING: Drowsy driving detected by onboard system.');
      } else {
        setPhoneDetected(false);
        setPhoneConf(0);
        setDrowsyAlert(false);
        setAvgEyeOpenness(100);
        addLog('Onboard telemetry status: SAFE.');
      }
    });
    
    socket.on('disconnect', () => {
      addLog('🔌 Telemetry stream disconnected.');
    });
  };

  const stopPythonLink = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsActive(false);
    setDrowsyAlert(false);
    setPhoneDetected(false);
    setAvgEyeOpenness(100);
    addLog('Telemetry stream stopped. Standby.');
  };

  // Demo simulator helper
  const startDemo = () => {
    stopScanner();
    setDemoMode(true);
    setIsActive(true);
    addLog('Demo simulation mode activated.');
  };

  const stopDemo = () => {
    setDemoMode(false);
    setIsActive(false);
    setDrowsyAlert(false);
    setPhoneDetected(false);
    setAvgEyeOpenness(100);
    addLog('Demo mode deactivated.');
  };

  return (
    <div style={styles.container}>
      {/* Styles Injection */}
      <style>{customCss}</style>

      {/* Loading Overlay */}
      {loading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingCard}>
            <div style={styles.loaderSpinner} />
            <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, margin: '15px 0 5px' }}>
              Initializing Drivix AI
            </h3>
            <p style={{ color: '#00f2ff', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {loadingText}
            </p>
            <div style={styles.loadingBarBg}>
              <div style={{ ...styles.loadingBarFg, width: `${loadingProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => { stopScanner(); navigate('/'); }}>
          <ChevronLeft size={20} color="#ffce00" />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Active Co-Pilot</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '2px 0 0' }}>
            Real-time Driver Drowsiness & Distraction Alert System
          </p>
        </div>
        <button style={{ ...styles.volBtn, borderColor: soundEnabled ? 'rgba(255, 206, 0, 0.2)' : 'rgba(255,75,75,0.2)' }} onClick={() => setSoundEnabled(!soundEnabled)}>
          {soundEnabled ? <Volume2 size={18} color="#ffce00" /> : <VolumeX size={18} color="#ff4b4b" />}
        </button>
      </header>

      {/* Grid Dashboard */}
      <div style={styles.gridContainer}>
        {/* Left Side: Camera Preview HUD */}
        <div style={styles.previewCard}>
          <div style={styles.camContainer}>
            {isActive && !demoMode ? (
              usePythonLink ? (
                <div style={styles.pythonLinkWrapper}>
                  <div style={styles.hudOverlayGrid} />
                  <div style={{ 
                    ...styles.demoRadarPulse, 
                    border: drowsyAlert || phoneDetected ? '2px solid #ff4b4b' : '2px solid #00cc6a',
                  }} />
                  <ShieldAlert size={48} color={drowsyAlert ? '#ff4b4b' : phoneDetected ? '#ffce00' : '#00cc6a'} />
                  <h4 style={{ color: '#fff', margin: '15px 0 5px' }}>
                    {drowsyAlert ? '⚠️ DROWSINESS ALERT (ONBOARD) ⚠️' : phoneDetected ? '📱 PHONE DETECTED (ONBOARD) 📱' : 'ONBOARD AI TELEMETRY CONNECTED'}
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', padding: '0 40px', textAlign: 'center' }}>
                    Listening to real-time driver alert streams from the Python AI onboard camera.
                  </p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    width="640"
                    height="480"
                    style={styles.camFeed}
                  />
                  <canvas
                    ref={canvasRef}
                    width="640"
                    height="480"
                    style={styles.camCanvas}
                  />
                  <div className="hud-overlay" />
                </>
              )
            ) : demoMode ? (
              <div style={styles.demoWrapper}>
                <div style={styles.hudOverlayGrid} />
                <div style={{ ...styles.demoRadarPulse, border: drowsyAlert || phoneDetected ? '2px solid #ff4b4b' : '2px solid #00f2ff' }} />
                <ShieldAlert size={48} color={drowsyAlert || phoneDetected ? '#ff4b4b' : '#00f2ff'} />
                <h4 style={{ color: '#fff', margin: '15px 0 5px' }}>
                  {drowsyAlert ? '⚠️ DROWSINESS ALERT ⚠️' : phoneDetected ? '📱 PHONE DETECTED 📱' : 'DEMO MODE RUNNING'}
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', padding: '0 40px' }}>
                  Use the control dashboard on the right to simulate driver alerts manually.
                </p>
              </div>
            ) : (
              <div style={styles.standbyWrapper}>
                <Video size={48} color="rgba(255,255,255,0.3)" />
                <h3 style={{ color: '#fff', margin: '15px 0 5px', fontSize: '1.1rem' }}>Co-Pilot In Standby</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '0 40px' }}>
                  Mount your laptop or webcam pointing at your face, then click Start Scanner.
                </p>
              </div>
            )}

            {/* Alert Banner HUD */}
            {isActive && (drowsyAlert || phoneDetected) && (
              <div style={{ ...styles.alertBanner, backgroundColor: drowsyAlert ? 'rgba(255, 75, 75, 0.95)' : 'rgba(255, 206, 0, 0.95)', color: drowsyAlert ? '#fff' : '#000' }}>
                <ShieldAlert size={20} />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                  {drowsyAlert ? 'DROWSINESS WARNING: WAKE UP!' : 'DISTRACTION WARNING: EYES ON ROAD!'}
                </span>
              </div>
            )}
          </div>

          {/* Scanner Control buttons */}
          <div style={styles.controlBar}>
            {!isActive ? (
              <>
                <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '10px', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button 
                      style={{ 
                        flex: 1, 
                        padding: '8px 12px', 
                        borderRadius: '8px', 
                        border: '1px solid',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        backgroundColor: !usePythonLink ? 'rgba(0, 242, 255, 0.15)' : 'rgba(255,255,255,0.02)',
                        borderColor: !usePythonLink ? '#00f2ff' : 'rgba(255,255,255,0.1)',
                        color: !usePythonLink ? '#00f2ff' : 'rgba(255,255,255,0.6)',
                        fontWeight: 600
                      }} 
                      onClick={() => setUsePythonLink(false)}
                    >
                      📷 Browser WebCam
                    </button>
                    <button 
                      style={{ 
                        flex: 1, 
                        padding: '8px 12px', 
                        borderRadius: '8px', 
                        border: '1px solid',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        backgroundColor: usePythonLink ? 'rgba(0, 204, 106, 0.15)' : 'rgba(255,255,255,0.02)',
                        borderColor: usePythonLink ? '#00cc6a' : 'rgba(255,255,255,0.1)',
                        color: usePythonLink ? '#00cc6a' : 'rgba(255,255,255,0.6)',
                        fontWeight: 600
                      }} 
                      onClick={() => setUsePythonLink(true)}
                    >
                      🔗 Onboard Python AI
                    </button>
                  </div>
                </div>
                
                <button style={styles.startBtn} onClick={usePythonLink ? startPythonLink : startScanner}>
                  <Play size={16} /> {usePythonLink ? 'Start Telemetry Link' : 'Start Scanner'}
                </button>
                <button style={styles.demoBtn} onClick={startDemo}>
                  <Info size={16} /> Test Demo Mode
                </button>
              </>
            ) : (
              <button style={styles.stopBtn} onClick={demoMode ? stopDemo : usePythonLink ? stopPythonLink : stopScanner}>
                <Square size={16} /> Disable {usePythonLink ? 'Telemetry Link' : 'Scanner'}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Indicators Panel */}
        <div style={styles.statsCard}>
          <h3 style={styles.cardHeading}>Co-Pilot Diagnostics</h3>

          {/* Eye Openness indicator */}
          <div style={styles.statRow}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Driver Alertness (Eye Openness)</span>
              <span style={{ color: avgEyeOpenness < 25 ? '#ff4b4b' : '#00f2ff', fontWeight: 800, fontSize: '0.85rem' }}>
                {avgEyeOpenness}%
              </span>
            </div>
            <div style={styles.barBg}>
              <div
                style={{
                  ...styles.barFg,
                  width: `${avgEyeOpenness}%`,
                  backgroundColor: avgEyeOpenness < 25 ? '#ff4b4b' : '#00f2ff',
                  boxShadow: avgEyeOpenness < 25 ? '0 0 10px #ff4b4b' : '0 0 10px #00f2ff',
                }}
              />
            </div>
          </div>

          {/* Distraction indicator */}
          <div style={styles.statRow}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Distraction Level (Phone)</span>
              <span style={{ color: phoneDetected ? '#ff4b4b' : 'var(--text-secondary)', fontWeight: 800, fontSize: '0.85rem' }}>
                {phoneDetected ? `DETECTED (${phoneConf}%)` : 'NONE'}
              </span>
            </div>
            <div style={styles.barBg}>
              <div
                style={{
                  ...styles.barFg,
                  width: phoneDetected ? `${phoneConf}%` : '0%',
                  backgroundColor: '#ff4b4b',
                  boxShadow: '0 0 10px #ff4b4b',
                }}
              />
            </div>
          </div>

          {/* Demo Controllers Card */}
          {demoMode && (
            <div style={styles.demoControlsBox}>
              <h4 style={{ color: '#ffce00', margin: '0 0 10px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Manual Simulator Toggles
              </h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={{ ...styles.simToggleBtn, backgroundColor: drowsyAlert ? 'rgba(255,75,75,0.2)' : 'rgba(255,255,255,0.03)', borderColor: drowsyAlert ? '#ff4b4b' : 'rgba(255,255,255,0.1)' }}
                  onClick={() => {
                    setDrowsyAlert(!drowsyAlert);
                    if (!drowsyAlert) {
                      setAvgEyeOpenness(10);
                      addLog('[SIMULATOR] Eyes Closed triggered.');
                    } else {
                      setAvgEyeOpenness(100);
                      addLog('[SIMULATOR] Eyes Open restored.');
                    }
                  }}
                >
                  💤 Simulate Sleep
                </button>
                <button
                  style={{ ...styles.simToggleBtn, backgroundColor: phoneDetected ? 'rgba(255,75,75,0.2)' : 'rgba(255,255,255,0.03)', borderColor: phoneDetected ? '#ff4b4b' : 'rgba(255,255,255,0.1)' }}
                  onClick={() => {
                    setPhoneDetected(!phoneDetected);
                    if (!phoneDetected) {
                      setPhoneConf(88);
                      addLog('[SIMULATOR] Cell Phone detection triggered.');
                    } else {
                      setPhoneConf(0);
                      addLog('[SIMULATOR] Cell Phone cleared.');
                    }
                  }}
                >
                  📱 Simulate Phone
                </button>
              </div>
            </div>
          )}

          {/* Logs Terminal */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginTop: '20px' }}>
            <h4 style={{ color: '#fff', fontSize: '0.85rem', margin: '0 0 10px', fontWeight: 700 }}>AI Security Stream</h4>
            <div style={styles.terminalBox} ref={logsContainerRef}>
              {systemLogs.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                  No diagnostic events logged. Start scanner.
                </div>
              ) : (
                systemLogs.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      color: log.includes('WARNING') || log.includes('detected') ? '#ff4b4b' : log.includes('SIMULATOR') ? '#ffce00' : 'rgba(255,255,255,0.7)',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      marginBottom: '4px',
                      lineHeight: '1.25',
                    }}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Scoped inline CSS
const customCss = `
.hud-overlay {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(0, 242, 255, 0.15);
  background: 
    radial-gradient(circle, transparent 40%, rgba(0,0,0,0.4) 100%),
    linear-gradient(rgba(0, 242, 255, 0.03) 50%, transparent 50%);
  background-size: 100% 100%, 100% 4px;
  pointer-events: none;
  animation: scanning 10s linear infinite;
}
@keyframes scanning {
  0% { background-position: 0 0; }
  100% { background-position: 0 100%; }
}
`;

// Responsive Styles
const styles = {
  container: {
    minHeight: 'calc(100vh - 112px)',
    padding: '30px 5%',
    background: '#0d0d0f',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxSizing: 'border-box',
    marginTop: '112px',
  },
  loadingOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10, 10, 12, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    backdropFilter: 'blur(10px)',
  },
  loadingCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    width: '320px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  loaderSpinner: {
    width: '36px',
    height: '36px',
    border: '3px solid rgba(0, 242, 255, 0.1)',
    borderTopColor: '#00f2ff',
    borderRadius: '50%',
    margin: '0 auto',
    animation: 'spin 1s linear infinite',
  },
  loadingBarBg: {
    width: '100%',
    height: '4px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '20px',
  },
  loadingBarFg: {
    height: '100%',
    background: 'linear-gradient(90deg, #00f2ff 0%, #ffce00 100%)',
    borderRadius: '2px',
    transition: 'width 0.4s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '15px',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  volBtn: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: '30px',
    flex: 1,
  },
  previewCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  camContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4/3',
    background: '#070708',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1.5px solid rgba(255, 255, 255, 0.05)',
  },
  camFeed: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)', // Mirror image
  },
  camCanvas: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    transform: 'scaleX(-1)', // Mirror canvas drawing
  },
  standbyWrapper: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  demoWrapper: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    background: 'radial-gradient(circle, rgba(0, 242, 255, 0.03) 0%, rgba(13, 13, 15, 0.98) 100%)',
  },
  pythonLinkWrapper: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    background: 'radial-gradient(circle, rgba(0, 204, 106, 0.03) 0%, rgba(13, 13, 15, 0.98) 100%)',
  },
  hudOverlayGrid: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)',
    backgroundSize: '30px 30px',
    pointerEvents: 'none',
  },
  demoRadarPulse: {
    position: 'absolute',
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    opacity: 0.15,
  },
  alertBanner: {
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
    borderRadius: '30px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
    zIndex: 10,
    animation: 'pulse 1s infinite alternate',
  },
  controlBar: {
    display: 'flex',
    gap: '12px',
  },
  startBtn: {
    flex: 1,
    background: 'linear-gradient(135deg, #00f2ff 0%, #0072ff 100%)',
    border: 'none',
    color: '#fff',
    padding: '14px',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    boxShadow: '0 4px 15px rgba(0, 242, 255, 0.2)',
  },
  demoBtn: {
    flex: 1,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#ffce00',
    padding: '14px',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
  },
  stopBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #ff4b4b 0%, #a80000 100%)',
    border: 'none',
    color: '#fff',
    padding: '14px',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    boxShadow: '0 4px 15px rgba(255, 75, 75, 0.2)',
  },
  statsCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  cardHeading: {
    color: '#fff',
    fontSize: '1.1rem',
    fontWeight: 800,
    margin: 0,
  },
  statRow: {
    display: 'flex',
    flexDirection: 'column',
  },
  barBg: {
    width: '100%',
    height: '8px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  barFg: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.15s ease-out, background-color 0.3s',
  },
  demoControlsBox: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1.5px dashed rgba(255, 206, 0, 0.15)',
    borderRadius: '10px',
    padding: '15px',
  },
  simToggleBtn: {
    flex: 1,
    border: '1px solid',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  terminalBox: {
    background: '#060607',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '8px',
    padding: '12px',
    flex: 1,
    overflowY: 'auto',
    maxHeight: '240px',
  },
};
