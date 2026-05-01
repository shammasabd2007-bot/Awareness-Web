/**
 * WebCamera — opens the device camera in a full-screen modal on web.
 * Uses the browser's getUserMedia API for a live video preview.
 * Captures a frame as a base64 data URL when the user taps "Capture".
 *
 * On mobile web (Android/iOS) this opens the rear camera.
 * On desktop it opens the webcam.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme/colors';

interface WebCameraProps {
  visible: boolean;
  onCapture: (dataUri: string) => void;
  onClose: () => void;
}

export default function WebCamera({ visible, onCapture, onClose }: WebCameraProps) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);

  const [ready, setReady]     = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [facingMode, setFacing] = useState<'environment' | 'user'>('environment');

  // Start camera when modal opens
  useEffect(() => {
    if (!visible) return;
    setReady(false);
    setError(null);
    startCamera(facingMode);
    return () => stopCamera();
  }, [visible, facingMode]);

  const startCamera = async (mode: 'environment' | 'user') => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setReady(true);
        };
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied.\nPlease allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not open camera: ' + (err.message || err.name));
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setReady(false);
  };

  const capturePhoto = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg', 0.85);

    stopCamera();
    onCapture(dataUri);
  };

  const flipCamera = () => {
    setFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (Platform.OS !== 'web') return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
      <View style={s.overlay}>

        {/* Live video preview — rendered via dangerouslySetInnerHTML trick using a ref */}
        <View style={s.videoWrapper}>
          {/* @ts-ignore — video is a valid web element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: ready ? 'block' : 'none',
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
            }}
          />

          {/* Loading spinner */}
          {!ready && !error && (
            <View style={s.loadingBox}>
              <ActivityIndicator size="large" color={C.white} />
              <Text style={s.loadingText}>Opening camera…</Text>
            </View>
          )}

          {/* Error state */}
          {error && (
            <View style={s.errorBox}>
              <Ionicons name="camera-off-outline" size={52} color={C.white} />
              <Text style={s.errorText}>{error}</Text>
              <TouchableOpacity style={s.retryBtn} onPress={() => startCamera(facingMode)}>
                <Text style={s.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Top bar */}
          <View style={s.topBar}>
            <TouchableOpacity onPress={handleClose} style={s.topBtn}>
              <Ionicons name="close" size={26} color={C.white} />
            </TouchableOpacity>
            <Text style={s.topTitle}>Take Photo</Text>
            <TouchableOpacity onPress={flipCamera} style={s.topBtn}>
              <Ionicons name="camera-reverse-outline" size={26} color={C.white} />
            </TouchableOpacity>
          </View>

          {/* Bottom controls */}
          {ready && (
            <View style={s.bottomBar}>
              {/* Cancel */}
              <TouchableOpacity onPress={handleClose} style={s.sideBtn}>
                <Ionicons name="close-circle-outline" size={32} color={C.white} />
                <Text style={s.sideBtnText}>Cancel</Text>
              </TouchableOpacity>

              {/* Shutter */}
              <TouchableOpacity onPress={capturePhoto} style={s.shutterBtn} activeOpacity={0.8}>
                <View style={s.shutterInner} />
              </TouchableOpacity>

              {/* Flip */}
              <TouchableOpacity onPress={flipCamera} style={s.sideBtn}>
                <Ionicons name="camera-reverse-outline" size={32} color={C.white} />
                <Text style={s.sideBtnText}>Flip</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Hidden canvas for capture */}
        {/* @ts-ignore */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative' as any,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Loading */
  loadingBox: {
    position: 'absolute' as any,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  loadingText: { color: C.white, fontSize: 15, marginTop: 10 },

  /* Error */
  errorBox: {
    position: 'absolute' as any,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 14,
  },
  errorText: {
    color: C.white, fontSize: 15, textAlign: 'center', lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 20, marginTop: 8,
  },
  retryBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },

  /* Top bar */
  topBar: {
    position: 'absolute' as any,
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  topBtn:   { padding: 8 },
  topTitle: { color: C.white, fontSize: 17, fontWeight: '700' },

  /* Bottom bar */
  bottomBar: {
    position: 'absolute' as any,
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 28,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sideBtn:     { alignItems: 'center', gap: 4 },
  sideBtnText: { color: C.white, fontSize: 11, marginTop: 2 },

  /* Shutter button */
  shutterBtn: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 4, borderColor: C.white,
    justifyContent: 'center', alignItems: 'center',
  },
  shutterInner: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: C.white,
  },
});
