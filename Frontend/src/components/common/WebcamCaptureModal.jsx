import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, X, RefreshCw, AlertCircle, CheckCircle2, SwitchCamera } from 'lucide-react';

/**
 * Reusable Web App Camera Modal
 * - Requests live browser camera permissions via getUserMedia
 * - Renders a live video viewfinder
 * - Allows snapping a photo via HTML5 Canvas
 * - Cleanly stops media tracks on unmount or close
 * - Uses createPortal to guarantee centering on the active screen viewport
 */
export default function WebcamCaptureModal({ isOpen, onClose, onPhotoCaptured, title = "Live Camera Capture" }) {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Lock background body scroll when camera modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      stopTracks();
      return;
    }

    startCamera(facingMode);

    return () => {
      stopTracks();
    };
  }, [isOpen, facingMode]);

  const stopTracks = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startCamera = async (mode) => {
    setLoading(true);
    setError(null);
    stopTracks();

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not supported by your browser. Please try uploading an image instead.");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("WebcamCaptureModal error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera permission was denied. Please allow camera access in your browser address bar settings to take live photos.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No camera device was detected on your laptop/device. Please check your camera connection or use 'Upload Photo'.");
      } else {
        setError(err.message || "Failed to access camera stream. Please check browser permissions.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    stopTracks();
    onPhotoCaptured(dataUrl);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          background: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '20px',
          maxWidth: '560px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'rgba(30, 41, 59, 0.8)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
            <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{title}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={toggleFacingMode}
              title="Switch Camera (Front/Back)"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#CBD5E1',
                padding: '6px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              <SwitchCamera size={14} />
              <span>Flip</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopTracks();
                onClose();
              }}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Viewfinder Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '320px',
              background: '#020617',
              borderRadius: '14px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#94A3B8' }}>
                <RefreshCw size={28} className="animate-spin text-blue-400" />
                <span style={{ fontSize: '0.84rem' }}>Starting live camera stream...</span>
              </div>
            )}

            {error && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#FECACA' }}>
                <AlertCircle size={32} color="#EF4444" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '6px', color: '#F87171' }}>
                  Camera Access Required
                </div>
                <div style={{ fontSize: '0.78rem', lineHeight: 1.4, color: '#E2E8F0' }}>
                  {error}
                </div>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  style={{
                    marginTop: '12px',
                    background: '#2563EB',
                    color: '#FFF',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Retry Permission
                </button>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: !loading && !error ? 'block' : 'none'
              }}
            />

            {/* Target Reticle Overlay */}
            {!loading && !error && (
              <div
                style={{
                  position: 'absolute',
                  inset: '24px',
                  border: '1.5px dashed rgba(255, 255, 255, 0.4)',
                  borderRadius: '10px',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.6)' }} />
              </div>
            )}
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <button
              type="button"
              onClick={() => {
                stopTracks();
                onClose();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#CBD5E1',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCapture}
              disabled={loading || Boolean(error)}
              style={{
                background: loading || Boolean(error) ? '#475569' : '#10B981',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '12px',
                fontSize: '0.92rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: loading || Boolean(error) ? 'not-allowed' : 'pointer',
                boxShadow: loading || Boolean(error) ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              <Camera size={18} />
              <span>Snap Photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
