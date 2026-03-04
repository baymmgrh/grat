import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, Clock, CheckCircle, XCircle, AlertTriangle, 
  Calendar, User, Loader2, RefreshCw
} from 'lucide-react';
import * as faceapi from 'face-api.js';
import { useNavigate } from 'react-router-dom';

// Get API base URL - match axiosConfig.ts logic
const getApiBase = () => {
  const hostname = window.location.hostname;
  // Production domain - use HTTPS API subdomain
  if (hostname === 'erp.graterp.my.id' || hostname.endsWith('.graterp.my.id')) {
    return 'https://api.graterp.my.id';
  }
  // Local development - use same hostname with port 5000
  return `http://${hostname}:5000`;
};
const API_BASE = getApiBase();

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
  
  // Company info state
  const [companyName, setCompanyName] = useState('');
  
  // Name input state
  const [name, setName] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [departemen, setDepartemen] = useState('');
  const [formattedName, setFormattedName] = useState('');
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Clock out reminder state
  const [showClockOutReminder, setShowClockOutReminder] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  
  // Face recognition state
  const [faceRecognizing, setFaceRecognizing] = useState(false);
  const [faceRecognized, setFaceRecognized] = useState<{
    name: string;
    jabatan: string | null;
    departemen: string | null;
    confidence: number;
  } | null>(null);
  const [faceScanMode, setFaceScanMode] = useState(false);  // Scan face first mode
  
  // GPS state
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [officeLocation, setOfficeLocation] = useState<{
    name: string;
    latitude: number;
    longitude: number;
    radius_meters: number;
  } | null>(null);

  // Fetch company info and office location on mount
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/settings/company/public`);
        const data = await response.json();
        if (data.name) {
          setCompanyName(data.name);
        }
      } catch (err) {
        console.error('Error fetching company info:', err);
      }
    };
    
    const fetchOfficeLocation = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/staff-leave/public/office-location`);
        const data = await response.json();
        if (data.location) {
          setOfficeLocation(data.location);
        }
      } catch (err) {
        console.error('Error fetching office location:', err);
      }
    };
    
    fetchCompanyInfo();
    fetchOfficeLocation();
    
    // Load saved attendance info from localStorage (same day only)
    const savedDate = localStorage.getItem('attendance_date');
    const today = new Date().toDateString();
    if (savedDate === today) {
      const savedName = localStorage.getItem('attendance_name');
      const savedJabatan = localStorage.getItem('attendance_jabatan');
      const savedDepartemen = localStorage.getItem('attendance_departemen');
      if (savedName) {
        setName(savedName);
        setFormattedName(savedName);
        setJabatan(savedJabatan || '');
        setDepartemen(savedDepartemen || '');
        // Auto-check attendance for this name
        checkAttendanceForName(savedName);
      }
    } else {
      // Clear old data
      localStorage.removeItem('attendance_name');
      localStorage.removeItem('attendance_jabatan');
      localStorage.removeItem('attendance_departemen');
      localStorage.removeItem('attendance_date');
    }
  }, []);
  
  // Check attendance for a given name
  const checkAttendanceForName = async (nameToCheck: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/attendance/public/check?name=${encodeURIComponent(nameToCheck)}`);
      const data = await response.json();
      if (data.attendance) {
        setTodayAttendance(data.attendance);
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.error('Error checking attendance:', err);
    }
  };

  // Try to recognize face from photo
  const tryRecognizeFace = async (photoBase64: string) => {
    setFaceRecognizing(true);
    setFaceRecognized(null);
    try {
      const response = await fetch(`${API_BASE}/api/face/recognize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: photoBase64 })
      });
      const data = await response.json();
      
      if (data.recognized) {
        setFaceRecognized({
          name: data.name,
          jabatan: data.jabatan,
          departemen: data.departemen,
          confidence: data.confidence
        });
        // Auto-fill form fields
        setName(data.name);
        setFormattedName(data.name);
        if (data.jabatan) setJabatan(data.jabatan);
        if (data.departemen) setDepartemen(data.departemen);
        // Check attendance for recognized name
        checkAttendanceForName(data.name);
      }
    } catch (err) {
      console.error('Face recognition error:', err);
    } finally {
      setFaceRecognizing(false);
    }
  };

  // Clock out reminder at 17:00
  useEffect(() => {
    const checkClockOutReminder = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Show reminder at 17:00 or later if user has clocked in but not clocked out
      const hasClockIn = todayAttendance?.clock_in;
      const hasClockOut = todayAttendance?.clock_out;
      
      if (hours >= 17 && hasClockIn && !hasClockOut && !reminderDismissed) {
        setShowClockOutReminder(true);
        
        // Play notification sound if available
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch (e) {}
        
        // Browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Reminder Clock Out', {
            body: 'Sudah jam 17:00, jangan lupa clock out!',
            icon: '/favicon.ico'
          });
        }
      }
    };
    
    // Check immediately and then every minute
    checkClockOutReminder();
    const interval = setInterval(checkClockOutReminder, 60000);
    
    return () => clearInterval(interval);
  }, [todayAttendance, reminderDismissed]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Get GPS location
  const getGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung GPS');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setGpsLoading(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('Akses lokasi ditolak. Izinkan akses lokasi untuk absensi.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('Lokasi tidak tersedia.');
            break;
          case error.TIMEOUT:
            setGpsError('Timeout mendapatkan lokasi.');
            break;
          default:
            setGpsError('Gagal mendapatkan lokasi.');
        }
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Calculate distance from office
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const distanceFromOffice = gpsLocation && officeLocation
    ? Math.round(calculateDistance(gpsLocation.latitude, gpsLocation.longitude, officeLocation.latitude, officeLocation.longitude))
    : null;

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
    
    // Try to recognize face (auto-fill name if recognized)
    tryRecognizeFace(photoBase64);
    
    setIsCapturing(false);
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedPhoto(null);
    setFaceDetectionResult(null);
    setFaceRecognized(null);
    setError(null);
    setSuccess(null);
  };

  // Submit clock in
  const handleClockIn = async () => {
    if (!capturedPhoto || !faceDetectionResult || !formattedName) return;
    
    // Check GPS if office location is configured
    if (officeLocation && !gpsLocation) {
      setError('Lokasi GPS diperlukan. Klik "Dapatkan Lokasi" terlebih dahulu.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/attendance/public/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formattedName,
          jabatan: jabatan,
          departemen: departemen,
          photo_base64: capturedPhoto,
          face_detected: faceDetectionResult.detected,
          face_confidence: faceDetectionResult.confidence,
          face_count: faceDetectionResult.count,
          latitude: gpsLocation?.latitude,
          longitude: gpsLocation?.longitude,
          gps_accuracy: gpsLocation?.accuracy
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Clock in gagal');
      
      setSuccess('🎉 Selamat datang, selamat bekerja!');
      setTodayAttendance(data.attendance);
      setCapturedPhoto(null);
      setFaceDetectionResult(null);
      setGpsLocation(null);
      stopCamera();
      
      // Save to localStorage for easy clock out later
      localStorage.setItem('attendance_name', formattedName);
      localStorage.setItem('attendance_jabatan', jabatan);
      localStorage.setItem('attendance_departemen', departemen);
      localStorage.setItem('attendance_date', new Date().toDateString());
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
      // Check if today is Friday (day 5)
      const isFriday = new Date().getDay() === 5;
      if (isFriday) {
        setSuccess('👋 Terimakasih sudah bekerja, sampai jumpa hari Senin!');
      } else {
        setSuccess('👋 Terimakasih, selamat beristirahat!');
      }
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
      {/* Clock Out Reminder Modal */}
      {showClockOutReminder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-bounce-once">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">⏰ Reminder Clock Out!</h3>
              <p className="text-gray-600 mb-4">
                Sudah jam 17:00, jangan lupa untuk melakukan <strong>Clock Out</strong> sebelum pulang.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowClockOutReminder(false);
                    setReminderDismissed(true);
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setShowClockOutReminder(false);
                    // Scroll to clock out section
                    document.getElementById('clock-out-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex-1 py-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                >
                  Clock Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center text-white mb-6">
          <h1 className="text-3xl font-bold mb-2">Sistem Absensi</h1>
          <p className="text-blue-100">{companyName || 'Loading...'}</p>
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
            // Face Scan or Name Input
            <div className="p-8">
              {!faceScanMode ? (
                // Choose: Scan Face or Manual Input
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Absensi</h2>
                    <p className="text-slate-500 text-sm mt-1">Pilih cara absensi Anda</p>
                  </div>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Face Recognized Success */}
                  {faceRecognized && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-800">Wajah Dikenali!</p>
                          <p className="text-green-700">{faceRecognized.name}</p>
                          <p className="text-green-600 text-sm">{faceRecognized.jabatan} - {faceRecognized.departemen}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Scan Face Button - Primary */}
                  <button
                    onClick={() => {
                      setFaceScanMode(true);
                      setError(null);
                      startCamera();
                    }}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-3 mb-3"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-lg">Scan Wajah</span>
                  </button>
                  
                  <div className="text-center text-slate-400 text-sm my-3">atau</div>
                  
                  {/* Manual Input Button */}
                  <button
                    onClick={() => {
                      setFaceScanMode(false);
                      // Show manual input fields
                      const manualSection = document.getElementById('manual-input-section');
                      if (manualSection) manualSection.classList.toggle('hidden');
                    }}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <User className="w-5 h-5" />
                    Input Manual
                  </button>

                  {/* Manual Input Section (hidden by default) */}
                  <div id="manual-input-section" className="hidden mt-4 space-y-3">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama Lengkap"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                    />
                    <input
                      type="text"
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      placeholder="Jabatan"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                    />
                    <input
                      type="text"
                      value={departemen}
                      onChange={(e) => setDepartemen(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                      placeholder="Departemen"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                    />
                    {name.trim() && (
                      <p className="text-center text-sm text-slate-500">
                        Akan disimpan sebagai: <span className="font-semibold text-blue-600">{toProperCase(name)}</span>
                      </p>
                    )}
                    <button
                      onClick={handleContinue}
                      disabled={isSubmitting || !name.trim() || !jabatan.trim() || !departemen.trim()}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lanjutkan'}
                    </button>
                  </div>
                  
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <button
                      onClick={() => navigate('/public/face-registration')}
                      className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                    >
                      📸 Daftar Wajah untuk Absensi Otomatis →
                    </button>
                    <button
                      onClick={() => navigate('/public/leave-request')}
                      className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1"
                    >
                      📝 Ajukan Izin/Cuti →
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Login ke Aplikasi ERP →
                    </button>
                  </div>
                </>
              ) : (
                // Face Scan Camera View
                <>
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Scan Wajah Anda</h2>
                    <p className="text-slate-500 text-sm mt-1">Posisikan wajah di tengah kamera</p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Camera Preview */}
                  <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video mb-4 relative">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className={`w-full h-full object-cover ${isCameraReady ? 'block' : 'hidden'}`}
                    />
                    
                    {!isCameraReady && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p className="text-slate-400 text-sm">Memuat kamera...</p>
                      </div>
                    )}

                    {/* Face Recognition Status */}
                    {faceRecognizing && (
                      <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 text-white flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Mengenali wajah...
                      </div>
                    )}
                  </div>
                  
                  <canvas ref={canvasRef} className="hidden" />

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setFaceScanMode(false);
                        stopCamera();
                        setError(null);
                      }}
                      className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium"
                    >
                      Batal
                    </button>
                    <button
                      onClick={async () => {
                        if (!videoRef.current || !canvasRef.current) return;
                        
                        const video = videoRef.current;
                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;
                        
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        ctx.drawImage(video, 0, 0);
                        
                        const photoBase64 = canvas.toDataURL('image/jpeg', 0.8);
                        setCapturedPhoto(photoBase64);
                        
                        // Try to recognize face
                        setFaceRecognizing(true);
                        try {
                          const response = await fetch(`${API_BASE}/api/face/recognize`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ photo: photoBase64 })
                          });
                          const data = await response.json();
                          
                          if (data.recognized) {
                            // Face recognized - auto-fill and proceed
                            setName(data.name);
                            setFormattedName(data.name);
                            setJabatan(data.jabatan || '');
                            setDepartemen(data.departemen || '');
                            setFaceRecognized({
                              name: data.name,
                              jabatan: data.jabatan,
                              departemen: data.departemen,
                              confidence: data.confidence
                            });
                            
                            // Set face detection result so clock-in button is enabled
                            setFaceDetectionResult({
                              detected: true,
                              confidence: data.confidence || 100,
                              count: 1
                            });
                            
                            // Check attendance and proceed
                            await checkAttendanceForName(data.name);
                            
                            // Save to localStorage
                            localStorage.setItem('attendance_name', data.name);
                            localStorage.setItem('attendance_jabatan', data.jabatan || '');
                            localStorage.setItem('attendance_departemen', data.departemen || '');
                            localStorage.setItem('attendance_date', new Date().toDateString());
                            
                            setIsLoggedIn(true);
                            stopCamera();
                            setFaceScanMode(false);
                          } else {
                            setError('Wajah tidak dikenali. Silakan daftar wajah terlebih dahulu atau gunakan input manual.');
                            setFaceScanMode(false);
                            stopCamera();
                          }
                        } catch (err) {
                          console.error('Face recognition error:', err);
                          setError('Gagal mengenali wajah. Coba lagi atau gunakan input manual.');
                          setFaceScanMode(false);
                          stopCamera();
                        } finally {
                          setFaceRecognizing(false);
                        }
                      }}
                      disabled={!isCameraReady || faceRecognizing}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                    >
                      {faceRecognizing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                      {faceRecognizing ? 'Mengenali...' : 'Ambil & Scan'}
                    </button>
                  </div>
                </>
              )}
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

                {/* GPS Location Section */}
                {!hasClockIn && officeLocation && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium text-slate-700">Verifikasi Lokasi</span>
                      </div>
                      {gpsLocation && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          distanceFromOffice !== null && distanceFromOffice <= officeLocation.radius_meters
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {distanceFromOffice !== null && distanceFromOffice <= officeLocation.radius_meters
                            ? '✓ Dalam jangkauan'
                            : `✗ Jarak: ${distanceFromOffice}m`
                          }
                        </span>
                      )}
                    </div>
                    
                    {gpsError && (
                      <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {gpsError}
                      </div>
                    )}
                    
                    {gpsLocation ? (
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>📍 Lokasi Anda: {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}</p>
                        <p>🎯 Akurasi: ±{Math.round(gpsLocation.accuracy)}m</p>
                        {distanceFromOffice !== null && (
                          <p>🏢 Jarak ke kantor: {distanceFromOffice}m (maks {officeLocation.radius_meters}m)</p>
                        )}
                        <button
                          onClick={getGpsLocation}
                          disabled={gpsLoading}
                          className="mt-2 text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                          Refresh Lokasi
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={getGpsLocation}
                        disabled={gpsLoading}
                        className="w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {gpsLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Mendapatkan lokasi...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            Dapatkan Lokasi
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

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
                      
                      {/* Face Recognition Status */}
                      {capturedPhoto && (faceRecognizing || faceRecognized) && (
                        <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-lg text-xs font-medium ${
                          faceRecognizing ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
                        }`}>
                          {faceRecognizing ? (
                            <span className="flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Mengenali wajah...
                            </span>
                          ) : faceRecognized ? (
                            `✓ ${faceRecognized.name} (${faceRecognized.confidence}%)`
                          ) : null}
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
                    id="clock-out-section"
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
                    <p className="text-slate-500 text-sm mt-1">
                      {new Date().getDay() === 5 
                        ? '👋 Sampai jumpa hari Senin!' 
                        : '👋 Selamat beristirahat!'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-blue-100 text-sm">
          © {new Date().getFullYear()} {companyName || 'ERP System'} - ERP System
        </div>
      </div>
    </div>
  );
};

export default PublicAttendance;
