import React, { useState, useRef, useEffect } from 'react';
import { Camera, UserPlus, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const FaceRegistration: React.FC = () => {
  const [name, setName] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [departemen, setDepartemen] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [companyName, setCompanyName] = useState('PT. Company Name');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get API base URL - match hostname dynamically
  const getApiBase = () => {
    const hostname = window.location.hostname;
    if (hostname === 'erp.graterp.my.id' || hostname.endsWith('.graterp.my.id')) {
      return 'https://api.graterp.my.id';
    }
    return `http://${hostname}:5000`;
  };
  const API_BASE_URL = getApiBase();

  useEffect(() => {
    fetchCompanyName();
    return () => {
      stopCamera();
    };
  }, []);

  const fetchCompanyName = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/company/public`);
      if (response.ok) {
        const data = await response.json();
        if (data.company_name) {
          setCompanyName(data.company_name);
        }
      }
    } catch (err) {
      console.error('Error fetching company name:', err);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      
      streamRef.current = stream;
      setCameraActive(true);
      
      // Wait for state update, then assign stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    setError(null);
    startCamera();
  };

  // Assign stream when cameraActive changes and video ref is ready
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [cameraActive]);

  const toProperCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Nama wajib diisi');
      return;
    }
    
    if (!photo) {
      setError('Foto wajib diambil');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/face/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          jabatan: jabatan.trim(),
          departemen: departemen.trim(),
          photo: photo
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mendaftarkan wajah');
      }
      
      setSuccess(data.message || 'Wajah berhasil didaftarkan!');
      setName('');
      setJabatan('');
      setDepartemen('');
      setPhoto(null);
      
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Registrasi Wajah</h1>
          <p className="text-gray-600 mt-1">{companyName}</p>
          <p className="text-sm text-gray-500 mt-2">
            Daftarkan wajah Anda untuk absensi otomatis
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium">{success}</p>
              <p className="text-green-600 text-sm mt-1">
                Anda sekarang dapat menggunakan fitur absensi dengan pengenalan wajah.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => setName(toProperCase(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          {/* Jabatan Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jabatan
            </label>
            <input
              type="text"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              onBlur={(e) => setJabatan(toProperCase(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: Staff Produksi"
            />
          </div>

          {/* Departemen Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departemen
            </label>
            <input
              type="text"
              value={departemen}
              onChange={(e) => setDepartemen(e.target.value)}
              onBlur={(e) => setDepartemen(toProperCase(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: Produksi"
            />
          </div>

          {/* Camera Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto Wajah <span className="text-red-500">*</span>
            </label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50">
              {!cameraActive && !photo && (
                <div className="p-8 text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-4">
                    Ambil foto wajah Anda dengan jelas
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Buka Kamera
                  </button>
                </div>
              )}

              {cameraActive && !photo && (
                <div className="relative bg-black aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Ambil Foto
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {photo && (
                <div className="relative">
                  <img src={photo} alt="Captured" className="w-full" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <button
                      type="button"
                      onClick={retakePhoto}
                      className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Ambil Ulang
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-medium text-blue-900 mb-2">Tips untuk foto yang baik:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Pastikan wajah terlihat jelas dan tidak terhalang</li>
              <li>• Hadap langsung ke kamera</li>
              <li>• Pastikan pencahayaan cukup</li>
              <li>• Lepas kacamata hitam atau masker jika ada</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !name || !photo}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Mendaftarkan...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Daftarkan Wajah
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Setelah registrasi, Anda dapat langsung menggunakan</p>
          <p>fitur absensi dengan pengenalan wajah otomatis.</p>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistration;
