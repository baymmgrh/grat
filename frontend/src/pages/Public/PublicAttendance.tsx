import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, Clock, CheckCircle, XCircle, AlertTriangle, 
  Calendar, User, Loader2, RefreshCw
} from 'lucide-react';
import * as faceapi from 'face-api.js';
import { useNavigate } from 'react-router-dom';

// Get API base URL
const API_BASE = `http://${window.location.hostname}:5000`;

interface AttendanceRecord {
  id: number;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  attendee_name?: string;
}

// Convert to proper case (capitalize first letter of each word)
const toProperCase = (name: string): string => {
  return name.trim().split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

const PublicAttendance: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [faceDetectionResult, setFaceDetectionResult] = useState<{
    detected: boolean;
    confidence: number;
    count: number;
  } | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Name input state
  const [name, setName] = useState('');
  const [formattedName, setFormattedName] = useState('');
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      setLoadingModels(true);
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Error loading face detection models:', err);
        setModelsLoaded(false);
      } finally {
        setLoadingModels(false);
      }
    };
    loadModels();
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    setError(null);
    
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Browser tidak mendukung akses kamera. Gunakan HTTPS atau localhost.');
      return;
    }
    
    try {
      // Try with basic constraints first for better compatibility
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.log('Video play error:', e));
          setIsCameraReady(true);
        };
        setStream(mediaStream);
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      if (err.name === 'NotAllowedError') {
        setError('Izin kamera ditolak. Silakan izinkan akses kamera di browser Anda.');
      } else if (err.name === 'NotFoundError') {
        setError('Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.');
      } else if (err.name === 'NotReadableError') {
        setError('Kamera sedang digunakan aplikasi lain.');
      } else if (err.name === 'OverconstrainedError') {
        // Try with simpler constraints
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              setIsCameraReady(true);
            };
            setStream(simpleStream);
          }
        } catch {
          setError('Tidak dapat mengakses kamera.');
        }
      } else {
        setError(`Gagal mengakses kamera: ${err.message || err.name}`);
      }
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraReady(false);
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle name input and check attendance
  const handleContinue = async () => {
    if (!name.trim()) {
      setError('Masukkan nama lengkap Anda');
      return;
    }
    
    // Format name to proper case
    const properName = toProperCase(name);
    setFormattedName(properName);
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/attendance/public/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: properName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memproses');
      setTodayAttendance(data.today_attendance);
      setIsLoggedIn(true);
    } catch (err: any) {
      setError(err.message || 'Gagal memproses');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Capture photo and detect face
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    setError(null);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const photoBase64 = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoBase64);
    
    // Detect face
    if (modelsLoaded) {
      try {
        const detections = await faceapi.detectAllFaces(
          canvas,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 })
        );
        
        if (detections.length > 0) {
          const bestDetection = detections.reduce((prev, curr) => 
            curr.score > prev.score ? curr : prev
          );
          
          setFaceDetectionResult({
            detected: true,
            confidence: Math.round(bestDetection.score * 100),
            count: detections.length
          });
        } else {
          setFaceDetectionResult({ detected: false, confidence: 0, count: 0 });
        }
      } catch (err) {
        setFaceDetectionResult({ detected: false, confidence: 0, count: 0 });
      }
    } else {
      setFaceDetectionResult({ detected: true, confidence: 100, count: 1 });
    }
    
    setIsCapturing(false);
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedPhoto(null);
    setFaceDetectionResult(null);
    setError(null);
    setSuccess(null);
  };

  // Submit clock in
  const handleClockIn = async () => {
    if (!capturedPhoto || !faceDetectionResult || !formattedName) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/attendance/public/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formattedName,
          photo_base64: capturedPhoto,
          face_detected: faceDetectionResult.detected,
          face_confidence: faceDetectionResult.confidence,
          face_count: faceDetectionResult.count
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Clock in gagal');
      
      setSuccess('Clock in berhasil!');
      setTodayAttendance(data.attendance);
      setCapturedPhoto(null);
      setFaceDetectionResult(null);
      stopCamera();
    } catch (err: any) {
      setError(err.message || 'Clock in gagal');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit clock out (no photo needed)
  const handleClockOut = async () => {
    if (!formattedName) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/attendance/public/clock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formattedName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Clock out gagal');
      setSuccess('Clock out berhasil!');
      setTodayAttendance(data.attendance);
    } catch (err: any) {
      setError(err.message || 'Clock out gagal');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change name / logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setName('');
    setFormattedName('');
    setTodayAttendance(null);
    setCapturedPhoto(null);
    setFaceDetectionResult(null);
    setError(null);
    setSuccess(null);
    stopCamera();
  };

  const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const currentDate = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });

  const hasClockIn = todayAttendance?.clock_in;
  const hasClockOut = todayAttendance?.clock_out;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center text-white mb-6">
          <h1 className="text-3xl font-bold mb-2">Sistem Absensi</h1>
          <p className="text-blue-100">PT. Gratia Makmur Sentosa</p>
          <div className="mt-4 flex items-center justify-center gap-4 text-blue-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{currentDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-xl">{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {!isLoggedIn ? (
            // Name Input Form
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Masukkan Nama Lengkap</h2>
                <p className="text-slate-500 text-sm mt-1">Nama akan otomatis diformat dengan benar</p>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                placeholder="Contoh: Budi Santoso"
                className="w-full px-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-center"
                autoFocus
              />
              
              {name.trim() && (
                <p className="mt-2 text-center text-sm text-slate-500">
                  Akan disimpan sebagai: <span className="font-semibold text-blue-600">{toProperCase(name)}</span>
                </p>
              )}
              
              <button
                onClick={handleContinue}
                disabled={isSubmitting || !name.trim()}
                className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Lanjutkan'
                )}
              </button>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/login')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Login ke Aplikasi ERP →
                </button>
              </div>
            </div>
          ) : (
            // Attendance Form
            <div>
              {/* Name Header */}
              <div className="bg-slate-50 p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-lg">{formattedName}</p>
                    <p className="text-sm text-slate-500">Absensi Hari Ini</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1 rounded-lg hover:bg-slate-100"
                >
                  Ganti Nama
                </button>
              </div>

              <div className="p-6">
                {/* Success/Error Messages */}
                {success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {success}
                  </div>
                )}
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                {/* Today's Status */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`p-4 rounded-xl ${hasClockIn ? 'bg-green-50 border-2 border-green-200' : 'bg-slate-50 border-2 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-600">Clock In</span>
                      {hasClockIn && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                    <p className={`text-2xl font-bold ${hasClockIn ? 'text-green-700' : 'text-slate-300'}`}>
                      {hasClockIn 
                        ? new Date(todayAttendance.clock_in!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : '--:--'
                      }
                    </p>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${hasClockOut ? 'bg-orange-50 border-2 border-orange-200' : 'bg-slate-50 border-2 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-600">Clock Out</span>
                      {hasClockOut && <CheckCircle className="w-5 h-5 text-orange-500" />}
                    </div>
                    <p className={`text-2xl font-bold ${hasClockOut ? 'text-orange-700' : 'text-slate-300'}`}>
                      {hasClockOut 
                        ? new Date(todayAttendance.clock_out!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : '--:--'
                      }
                    </p>
                  </div>
                </div>

                {/* Clock In with Camera */}
                {!hasClockIn && (
                  <>
                    {loadingModels && (
                      <div className="flex items-center justify-center gap-2 mb-4 text-blue-600 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Memuat face detection...
                      </div>
                    )}

                    <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video mb-4 relative">
                      {/* Video element always mounted for ref access */}
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover ${isCameraReady && !capturedPhoto ? 'block' : 'hidden'}`}
                      />
                      
                      {!isCameraReady && !capturedPhoto && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                          <Camera className="w-12 h-12 mb-3 opacity-50" />
                          <p className="text-slate-400 text-sm mb-4">Ambil foto untuk Clock In</p>
                          <button
                            onClick={startCamera}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
                          >
                            Aktifkan Kamera
                          </button>
                        </div>
                      )}
                      
                      {capturedPhoto && (
                        <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                      )}
                      
                      {capturedPhoto && faceDetectionResult && (
                        <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-medium ${
                          faceDetectionResult.detected && faceDetectionResult.count === 1 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {faceDetectionResult.detected 
                            ? `Wajah OK (${faceDetectionResult.confidence}%)`
                            : 'Wajah tidak terdeteksi'
                          }
                        </div>
                      )}
                    </div>
                    
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className="flex gap-3">
                      {isCameraReady && !capturedPhoto && (
                        <button
                          onClick={capturePhoto}
                          disabled={isCapturing}
                          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                        >
                          {isCapturing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                          Ambil Foto
                        </button>
                      )}
                      
                      {capturedPhoto && (
                        <>
                          <button
                            onClick={retakePhoto}
                            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium flex items-center gap-2"
                          >
                            <RefreshCw className="w-5 h-5" />
                            Ulangi
                          </button>
                          <button
                            onClick={handleClockIn}
                            disabled={isSubmitting || !faceDetectionResult?.detected}
                            className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                          >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                            Clock In
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}

                {/* Clock Out Button (no photo needed) */}
                {hasClockIn && !hasClockOut && (
                  <button
                    onClick={handleClockOut}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-xl font-medium text-lg flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-6 h-6" />
                        Clock Out
                      </>
                    )}
                  </button>
                )}

                {/* All done message */}
                {hasClockIn && hasClockOut && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-lg font-medium text-slate-900">Absensi hari ini sudah lengkap!</p>
                    <p className="text-slate-500 text-sm mt-1">Terima kasih, selamat bekerja.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-blue-100 text-sm">
          © 2026 PT. Gratia Makmur Sentosa - ERP System
        </div>
      </div>
    </div>
  );
};

export default PublicAttendance;
