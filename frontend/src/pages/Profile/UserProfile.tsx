import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axiosInstance from '../../utils/axiosConfig';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ClockIcon,
  ArrowLeftIcon,
  PencilIcon,
  CheckBadgeIcon,
  XCircleIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

interface UserProfileData {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  department?: string;
  position?: string;
  bio?: string;
  is_active: boolean;
  is_admin: boolean;
  is_super_admin: boolean;
  last_login?: string;
  created_at: string;
  roles: Array<{
    id: number;
    name: string;
    description?: string;
  }>;
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canViewOthers, setCanViewOthers] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    department: '',
    position: '',
    bio: ''
  });

  // Check if current user can view other profiles
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await axiosInstance.get('/api/auth/me');
        const userData = response.data.user;
        
        // Roles that can view other profiles (Supervisor level and above, including Staff)
        const adminRoles = [
          // Admin level
          'Super Admin', 'Admin', 'IT Admin',
          // Direktur level
          'Direktur Utama', 'Direktur Operasional', 'Direktur Keuangan', 'Direktur HRD',
          // Manager level
          'General Manager',
          'Manager Produksi', 'Manager Sales', 'Manager Purchasing', 'Manager Warehouse',
          'Manager Finance', 'Manager HRD', 'Manager QC', 'Manager Maintenance', 'Manager R&D',
          'Manager PPIC',
          // Supervisor level
          'Supervisor Produksi', 'Supervisor Warehouse', 'Supervisor QC', 'Supervisor PPIC',
          'Production Supervisor', 'Team Lead Sales',
          // Staff level
          'Admin Staff', 'Sales Staff', 'Purchasing Staff', 'Warehouse Staff', 'Production Staff',
          'Finance Staff', 'HR Staff', 'QC Staff', 'Maintenance Staff', 'R&D Staff', 'Staff PPIC',
          'Quality Control', 'Auditor'
        ];
        const userRoles = userData.roles || [];
        
        const hasAdminRole = userRoles.some((role: string) => adminRoles.includes(role));
        const isAdmin = userData.is_admin || userData.is_super_admin || hasAdminRole;
        
        setCanViewOthers(isAdmin);
        
        // If viewing other's profile and not admin, redirect
        if (userId && parseInt(userId) !== userData.id && !isAdmin) {
          setError('Anda tidak memiliki izin untuk melihat profil pengguna lain');
          setLoading(false);
          return;
        }
        
        // Fetch profile
        fetchProfile();
      } catch (err) {
        console.error('Error checking permission:', err);
        fetchProfile(); // Try to fetch anyway
      }
    };
    
    checkPermission();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const endpoint = userId ? `/api/settings/users/${userId}/profile` : '/api/auth/profile';
      const response = await axiosInstance.get(endpoint);
      setProfile(response.data.user);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.error || 'Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOwnProfile = !userId || (currentUser && parseInt(userId) === currentUser.id);

  const startEditing = () => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        department: profile.department || '',
        position: profile.position || '',
        bio: profile.bio || ''
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      await axiosInstance.put('/api/auth/profile', editForm);
      
      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
      toast.success('Profil berhasil diperbarui!');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast.error(err.response?.data?.error || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Akses Ditolak</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Profil tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Kembali
        </button>

        {/* Profile Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
          
          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="absolute -top-16 left-6">
              <div className="w-32 h-32 bg-white dark:bg-gray-700 rounded-full border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center">
                <span className="text-5xl font-bold text-blue-600">
                  {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              {/* Status Badge */}
              <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-white ${
                profile.is_active ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
            </div>

            {/* Edit Button (only for own profile) */}
            {isOwnProfile && (
              <div className="flex justify-end pt-4 gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={cancelEditing}
                      className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Batal
                    </button>
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <CheckIcon className="h-4 w-4 mr-2" />
                      )}
                      Simpan
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEditing}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit Profil
                  </button>
                )}
              </div>
            )}

            {/* Name & Role */}
            <div className="mt-20">
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <input
                    type="text"
                    name="full_name"
                    value={editForm.full_name}
                    onChange={handleEditChange}
                    className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 focus:outline-none"
                    placeholder="Nama Lengkap"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.full_name}
                  </h1>
                )}
                {profile.is_super_admin && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full flex items-center">
                    <CheckBadgeIcon className="h-4 w-4 mr-1" />
                    Super Admin
                  </span>
                )}
                {profile.is_admin && !profile.is_super_admin && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex items-center">
                    <ShieldCheckIcon className="h-4 w-4 mr-1" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">@{profile.username}</p>
              
              {/* Roles */}
              {profile.roles && profile.roles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.roles.map((role) => (
                    <span
                      key={role.id}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                    >
                      {role.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
            Tentang Saya
          </h2>
          {isEditing ? (
            <textarea
              name="bio"
              value={editForm.bio}
              onChange={handleEditChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Ceritakan sedikit tentang diri Anda..."
            />
          ) : (
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {profile.bio || <span className="text-gray-400 italic">Belum ada bio</span>}
            </p>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <UserCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
              Informasi Kontak
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-gray-900 dark:text-white">{profile.email}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Telepon</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="08xxxxxxxxxx"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{profile.phone || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Work Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <BriefcaseIcon className="h-5 w-5 mr-2 text-blue-600" />
              Informasi Pekerjaan
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Departemen</p>
                  {isEditing ? (
                    <select
                      name="department"
                      value={editForm.department}
                      onChange={handleEditChange}
                      className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    >
                      <option value="">Pilih Departemen</option>
                      <option value="Production">Produksi</option>
                      <option value="Quality">Quality Control</option>
                      <option value="PPIC">PPIC</option>
                      <option value="Warehouse">Gudang</option>
                      <option value="Sales">Sales</option>
                      <option value="Purchasing">Purchasing</option>
                      <option value="Finance">Finance</option>
                      <option value="HR">HR</option>
                      <option value="IT">IT</option>
                      <option value="R&D">R&D</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Other">Lainnya</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-white">{profile.department || '-'}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start">
                <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Jabatan</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="position"
                      value={editForm.position}
                      onChange={handleEditChange}
                      className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Contoh: Staff, Supervisor, Manager"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{profile.position || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2 text-blue-600" />
              Informasi Akun
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className={`h-5 w-5 rounded-full mr-3 mt-0.5 ${profile.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className={`font-medium ${profile.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {profile.is_active ? 'Aktif' : 'Nonaktif'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Bergabung Sejak</p>
                  <p className="text-gray-900 dark:text-white">{formatDate(profile.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
              Aktivitas
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <ClockIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Login Terakhir</p>
                  <p className="text-gray-900 dark:text-white">
                    {profile.last_login ? formatDate(profile.last_login) : 'Belum pernah login'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
