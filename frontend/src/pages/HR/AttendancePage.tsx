import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Camera, Clock, CheckCircle, XCircle, AlertTriangle, 
  Calendar, User, Loader2, RefreshCw, History
} from 'lucide-react';
import * as faceapi from 'face-api.js';
import api from '../../utils/axiosConfig';

interface AttendanceRecord {
  id: number;
  user_id: number;
  user_name: string;
  attendance_date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  worked_hours: number;
  face_detected: boolean;
  face_confidence: number;
  verification_status: string;
}

const AttendancePage: React.FC = () => {
  const queryClient = useQueryClient();
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

  // Fetch today's attendance
  const { data: todayAttendance, isLoading: loadingToday } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => api.get('/api/attendance/today').then(res => res.data),
    refetchInterval: 30000
  });

  // Fetch attendance history
  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['attendance-history'],
    queryFn: () => api.get('/api/attendance/history', { params: { per_page: 7 } }).then(res => res.data)
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: (data: { photo_base64: string; face_detected: boolean; face_confidence: number; face_count: number }) =>
      api.post('/api/attendance/clock-in', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] });
      setCapturedPhoto(null);
      setFaceDetectionResult(null);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Gagal melakukan clock in');
    }
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: (data: { photo_base64: string; face_detected: boolean; face_confidence: number; face_count: number }) =>
      api.post('/api/attendance/clock-out', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] });
      setCapturedPhoto(null);
      setFaceDetectionResult(null);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Gagal melakukan clock out');
    }
  });

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      setLoadingModels(true);
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Error loading face detection models:', err);
        // Continue without face detection if models fail to load
        setModelsLoaded(false);
      } finally {
        setLoadingModels(false);
      }
    };
    loadModels();
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraReady(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
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

  // Capture photo and detect face
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    setError(null);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Get base64 image
    const photoBase64 = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoBase64);
    
    // Detect face if models are loaded
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
          setFaceDetectionResult({
            detected: false,
            confidence: 0,
            count: 0
          });
        }
      } catch (err) {
        console.error('Face detection error:', err);
        // If face detection fails, still allow submission but mark as not detected
        setFaceDetectionResult({
          detected: false,
          confidence: 0,
          count: 0
        });
      }
    } else {
      // No face detection available
      setFaceDetectionResult({
        detected: true, // Assume detected if no model
        confidence: 100,
        count: 1
      });
    }
    
    setIsCapturing(false);
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedPhoto(null);
    setFaceDetectionResult(null);
    setError(null);
  };

  // Submit clock in
  const handleClockIn = () => {
    if (!capturedPhoto || !faceDetectionResult) return;
    
    clockInMutation.mutate({
      photo_base64: capturedPhoto,
      face_detected: faceDetectionResult.detected,
      face_confidence: faceDetectionResult.confidence,
      face_count: faceDetectionResult.count
    });
  };

  // Submit clock out
  const handleClockOut = () => {
    if (!capturedPhoto || !faceDetectionResult) return;
    
    clockOutMutation.mutate({
      photo_base64: capturedPhoto,
      face_detected: faceDetectionResult.detected,
      face_confidence: faceDetectionResult.confidence,
      face_count: faceDetectionResult.count
    });
  };

  const attendance = todayAttendance?.attendance;
  const hasClockIn = attendance?.clock_in;
  const hasClockOut = attendance?.clock_out;
  const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 -m-6 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Clock className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Absensi</h1>
            <p className="text-sm text-slate-500">Sistem absensi dengan verifikasi foto</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{currentDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-lg">{currentTime}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Verifikasi Foto
              </h2>
            </div>
            
            <div className="p-6">
              {/* Loading models indicator */}
              {loadingModels && (
                <div className="flex items-center justify-center gap-2 mb-4 text-blue-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memuat model face detection...</span>
                </div>
              )}

              {/* Camera/Photo Display */}
              <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video mb-4">
                {!isCameraReady && !capturedPhoto && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <Camera className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-slate-400 mb-4">Kamera belum aktif</p>
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
                    >
                      Aktifkan Kamera
                    </button>
                  </div>
                )}
                
                {isCameraReady && !capturedPhoto && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}
                
                {capturedPhoto && (
                  <img
                    src={capturedPhoto}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Face detection overlay */}
                {capturedPhoto && faceDetectionResult && (
                  <div className={`absolute top-4 right-4 px-3 py-2 rounded-lg ${
                    faceDetectionResult.detected && faceDetectionResult.count === 1 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  } text-white text-sm font-medium`}>
                    {faceDetectionResult.detected 
                      ? `Wajah Terdeteksi (${faceDetectionResult.confidence}%)`
                      : 'Wajah Tidak Terdeteksi'
                    }
                    {faceDetectionResult.count > 1 && (
                      <span className="block text-xs">⚠️ {faceDetectionResult.count} wajah terdeteksi</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Error message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {isCameraReady && !capturedPhoto && (
                  <>
                    <button
                      onClick={capturePhoto}
                      disabled={isCapturing}
                      className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isCapturing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Mengambil Foto...
                        </>
                      ) : (
                        <>
                          <Camera className="w-5 h-5" />
                          Ambil Foto
                        </>
                      )}
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium transition-colors"
                    >
                      Matikan Kamera
                    </button>
                  </>
                )}
                
                {capturedPhoto && (
                  <>
                    <button
                      onClick={retakePhoto}
                      className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Ulangi
                    </button>
                    
                    {!hasClockIn && (
                      <button
                        onClick={handleClockIn}
                        disabled={clockInMutation.isPending || !faceDetectionResult?.detected}
                        className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {clockInMutation.isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Clock In
                          </>
                        )}
                      </button>
                    )}
                    
                    {hasClockIn && !hasClockOut && (
                      <button
                        onClick={handleClockOut}
                        disabled={clockOutMutation.isPending || !faceDetectionResult?.detected}
                        className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {clockOutMutation.isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5" />
                            Clock Out
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status & History Section */}
        <div className="space-y-6">
          {/* Today's Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Status Hari Ini
              </h2>
            </div>
            <div className="p-4">
              {loadingToday ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Clock In Status */}
                  <div className={`p-4 rounded-xl ${
                    hasClockIn ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Clock In</span>
                      {hasClockIn ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <p className={`text-2xl font-bold mt-1 ${hasClockIn ? 'text-green-700' : 'text-slate-400'}`}>
                      {hasClockIn 
                        ? new Date(attendance.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : '--:--'
                      }
                    </p>
                    {attendance?.status === 'late' && (
                      <span className="inline-block mt-2 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                        Terlambat
                      </span>
                    )}
                  </div>
                  
                  {/* Clock Out Status */}
                  <div className={`p-4 rounded-xl ${
                    hasClockOut ? 'bg-orange-50 border border-orange-200' : 'bg-slate-50 border border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Clock Out</span>
                      {hasClockOut ? (
                        <CheckCircle className="w-5 h-5 text-orange-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <p className={`text-2xl font-bold mt-1 ${hasClockOut ? 'text-orange-700' : 'text-slate-400'}`}>
                      {hasClockOut 
                        ? new Date(attendance.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : '--:--'
                      }
                    </p>
                  </div>
                  
                  {/* Worked Hours */}
                  {hasClockIn && hasClockOut && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <span className="text-sm font-medium text-slate-600">Jam Kerja</span>
                      <p className="text-2xl font-bold text-blue-700 mt-1">
                        {attendance.worked_hours?.toFixed(1)} jam
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent History */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5" />
                Riwayat Terakhir
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : history?.attendances?.length > 0 ? (
                history.attendances.map((record: AttendanceRecord) => (
                  <div key={record.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900">
                        {new Date(record.attendance_date).toLocaleDateString('id-ID', { 
                          weekday: 'short', day: 'numeric', month: 'short' 
                        })}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        record.status === 'present' ? 'bg-green-100 text-green-700' :
                        record.status === 'late' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {record.status === 'present' ? 'Hadir' : 
                         record.status === 'late' ? 'Terlambat' : record.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>
                        In: {record.clock_in 
                          ? new Date(record.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                          : '-'
                        }
                      </span>
                      <span>
                        Out: {record.clock_out 
                          ? new Date(record.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                          : '-'
                        }
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Belum ada riwayat absensi
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
