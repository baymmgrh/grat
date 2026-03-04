import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/redux';
import { setCredentials } from '../../store/slices/authSlice';
import axiosInstance from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface Role {
  id: number;
  name: string;
  description?: string;
}

export default function CompleteProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    requested_role: ''
  });

  // Get data from URL params (from Google OAuth)
  useEffect(() => {
    const email = searchParams.get('email') || '';
    const fullName = searchParams.get('full_name') || '';
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    setFormData(prev => ({
      ...prev,
      email: email,
      full_name: fullName
    }));

    // Store tokens temporarily
    if (accessToken && refreshToken) {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }

    // Fetch available roles
    fetchRoles();
  }, [searchParams]);

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await axiosInstance.get('/api/roles');
      // Filter out admin roles for regular users
      const availableRoles = (response.data?.roles || response.data || []).filter(
        (role: Role) => !['Super Admin', 'Direktur Utama', 'IT Admin', 'admin'].includes(role.name)
      );
      setRoles(availableRoles);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      // Set default roles if API fails
      setRoles([
        { id: 1, name: 'Staff', description: 'Staff umum dengan akses terbatas' },
        { id: 2, name: 'Viewer', description: 'Hanya dapat melihat data' }
      ]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update user profile with role request
      const response = await axiosInstance.put('/api/auth/profile', {
        full_name: formData.full_name,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        requested_role: formData.requested_role
      });

      // Update Redux state
      const userId = searchParams.get('user_id');
      const username = searchParams.get('username');
      const accessToken = localStorage.getItem('access_token');

      dispatch(setCredentials({
        user: {
          id: parseInt(userId || '0'),
          username: username || '',
          email: formData.email,
          full_name: formData.full_name,
          is_admin: false,
          is_super_admin: false,
          roles: []
        },
        token: accessToken || ''
      }));

      // Reset session tracking for new login
      localStorage.setItem('session_start_time', Date.now().toString());
      localStorage.setItem('last_activity_time', Date.now().toString());
      
      toast.success('Profil berhasil dilengkapi! Permintaan role Anda akan ditinjau oleh Admin.');
      navigate('/app');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error || 'Gagal menyimpan profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipClick = () => {
    setShowSkipWarning(true);
  };

  const confirmSkip = () => {
    const userId = searchParams.get('user_id');
    const username = searchParams.get('username');
    const accessToken = localStorage.getItem('access_token');

    dispatch(setCredentials({
      user: {
        id: parseInt(userId || '0'),
        username: username || '',
        email: formData.email,
        full_name: formData.full_name,
        is_admin: false,
        is_super_admin: false,
        roles: []
      },
      token: accessToken || ''
    }));

    // Reset session tracking for new login
    localStorage.setItem('session_start_time', Date.now().toString());
    localStorage.setItem('last_activity_time', Date.now().toString());
    
    toast('Anda masuk dengan akses terbatas. Hubungi Admin untuk mendapatkan role.', {
      icon: '⚠️',
      duration: 5000
    });
    navigate('/app');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <CubeIcon className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Lengkapi Profil Anda</h1>
          <p className="text-blue-200">
            Selamat datang! Silakan lengkapi informasi profil Anda untuk melanjutkan.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                />
                <CheckCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Email terverifikasi dari Google</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Telepon
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departemen
                </label>
                <div className="relative">
                  <BuildingOfficeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  >
                    <option value="">Pilih</option>
                    <option value="Production">Produksi</option>
                    <option value="Quality">QC</option>
                    <option value="Warehouse">Gudang</option>
                    <option value="Sales">Sales</option>
                    <option value="Purchasing">Purchasing</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="IT">IT</option>
                    <option value="R&D">R&D</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jabatan
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contoh: Staff, Supervisor, Manager"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <ShieldCheckIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="requested_role"
                  value={formData.requested_role}
                  onChange={handleChange}
                  required
                  disabled={loadingRoles}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white disabled:bg-gray-100"
                >
                  <option value="">-- Pilih Role --</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              {loadingRoles && (
                <p className="text-xs text-gray-500 mt-1">Memuat daftar role...</p>
              )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Skip Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-yellow-800">Jika Lewati:</p>
                    <ul className="text-xs text-yellow-700 mt-1 space-y-0.5">
                      <li>• Akses sangat terbatas</li>
                      <li>• Hanya bisa lihat dashboard</li>
                      <li>• Perlu minta role ke Admin</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Continue Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-green-800">Jika Lanjutkan:</p>
                    <ul className="text-xs text-green-700 mt-1 space-y-0.5">
                      <li>• Profil tersimpan lengkap</li>
                      <li>• Role akan ditinjau Admin</li>
                      <li>• Akses sesuai role dipilih</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSkipClick}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Lewati
              </button>
              <button
                type="submit"
                disabled={loading || !formData.requested_role}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Menyimpan...
                  </>
                ) : (
                  'Simpan & Lanjutkan'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-200 text-xs mt-4">
          Informasi ini akan membantu kami menyesuaikan pengalaman ERP untuk Anda.
        </p>
      </div>

      {/* Skip Warning Modal */}
      {showSkipWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="mx-auto w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Yakin Ingin Melewati?
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Jika Anda melewati langkah ini, Anda akan masuk dengan <strong>akses sangat terbatas</strong>:
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left mb-4">
                <ul className="text-sm text-yellow-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span>Hanya bisa melihat dashboard dasar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span>Tidak bisa mengakses modul apapun</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span>Harus menghubungi Admin untuk mendapatkan role</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSkipWarning(false)}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
                >
                  Kembali & Lengkapi
                </button>
                <button
                  onClick={confirmSkip}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                >
                  Tetap Lewati
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
