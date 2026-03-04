import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  Cog6ToothIcon,
  HashtagIcon,
  LockClosedIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  XMarkIcon,
  FolderIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface Server {
  id: number;
  name: string;
  description: string;
  icon: string;
  owner_id: number;
  is_public: boolean;
  invite_code: string;
  categories: Category[];
  uncategorized_channels: Channel[];
  members: Member[];
}

interface Category {
  id: number;
  name: string;
  order: number;
  channels: Channel[];
}

interface Channel {
  id: number;
  name: string;
  description: string;
  channel_type: string;
  is_private: boolean;
  is_locked: boolean;
  topic: string;
  category_id: number | null;
  order: number;
}

interface Member {
  id: number;
  username: string;
  full_name: string;
}

interface Role {
  id: number;
  name: string;
  color: string;
  is_default: boolean;
  position: number;
  permissions: Record<string, boolean>;
  member_count: number;
}

const ServerSettings: React.FC = () => {
  const { serverId } = useParams<{ serverId: string }>();
  const navigate = useNavigate();
  const [server, setServer] = useState<Server | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'roles' | 'members'>('overview');
  
  // Modal states
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  // Form states
  const [serverForm, setServerForm] = useState({
    name: '',
    description: '',
    icon: '',
    is_public: true
  });
  
  const [channelForm, setChannelForm] = useState({
    name: '',
    description: '',
    topic: '',
    channel_type: 'text',
    is_private: false,
    is_locked: false,
    category_id: null as number | null
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: ''
  });
  
  const [roleForm, setRoleForm] = useState({
    name: '',
    color: '#99AAB5',
    can_manage_server: false,
    can_manage_channels: false,
    can_manage_roles: false,
    can_manage_messages: false,
    can_kick_members: false,
    can_ban_members: false,
    can_invite: true,
    can_send_messages: true,
    can_attach_files: true,
    can_add_reactions: true,
    can_mention_everyone: false,
    can_pin_messages: false
  });

  const currentUserId = parseInt(localStorage.getItem('userId') || '0');

  useEffect(() => {
    if (serverId) {
      fetchServer();
      fetchRoles();
    }
  }, [serverId]);

  const fetchServer = async () => {
    try {
      const response = await axiosInstance.get(`/api/chat/servers/${serverId}`);
      const serverData = response.data.server;
      setServer(serverData);
      setServerForm({
        name: serverData.name,
        description: serverData.description || '',
        icon: serverData.icon || '',
        is_public: serverData.is_public
      });
    } catch (error) {
      console.error('Error fetching server:', error);
      toast.error('Gagal memuat data server');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get(`/api/chat/servers/${serverId}/roles`);
      setRoles(response.data.roles || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleUpdateServer = async () => {
    try {
      await axiosInstance.put(`/api/chat/servers/${serverId}`, serverForm);
      toast.success('Server berhasil diupdate');
      fetchServer();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal update server');
    }
  };

  const handleDeleteServer = async () => {
    if (!confirm('Yakin ingin menghapus server ini? Semua data akan hilang.')) return;
    
    try {
      await axiosInstance.delete(`/api/chat/servers/${serverId}`);
      toast.success('Server berhasil dihapus');
      navigate('/app/chat');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus server');
    }
  };

  // Channel CRUD
  const handleSaveChannel = async () => {
    try {
      if (editingChannel) {
        await axiosInstance.put(`/api/chat/channels/${editingChannel.id}`, channelForm);
        toast.success('Channel berhasil diupdate');
      } else {
        await axiosInstance.post(`/api/chat/servers/${serverId}/channels`, channelForm);
        toast.success('Channel berhasil dibuat');
      }
      setShowChannelModal(false);
      setEditingChannel(null);
      resetChannelForm();
      fetchServer();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan channel');
    }
  };

  const handleDeleteChannel = async (channelId: number) => {
    if (!confirm('Yakin ingin menghapus channel ini?')) return;
    
    try {
      await axiosInstance.delete(`/api/chat/channels/${channelId}`);
      toast.success('Channel berhasil dihapus');
      fetchServer();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus channel');
    }
  };

  const openEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setChannelForm({
      name: channel.name,
      description: channel.description || '',
      topic: channel.topic || '',
      channel_type: channel.channel_type,
      is_private: channel.is_private,
      is_locked: channel.is_locked,
      category_id: channel.category_id
    });
    setShowChannelModal(true);
  };

  const resetChannelForm = () => {
    setChannelForm({
      name: '',
      description: '',
      topic: '',
      channel_type: 'text',
      is_private: false,
      is_locked: false,
      category_id: null
    });
  };

  // Category CRUD
  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await axiosInstance.put(`/api/chat/categories/${editingCategory.id}`, categoryForm);
        toast.success('Kategori berhasil diupdate');
      } else {
        await axiosInstance.post(`/api/chat/servers/${serverId}/categories`, categoryForm);
        toast.success('Kategori berhasil dibuat');
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '' });
      fetchServer();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan kategori');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Yakin ingin menghapus kategori ini? Channel di dalamnya akan dipindahkan ke uncategorized.')) return;
    
    try {
      await axiosInstance.delete(`/api/chat/categories/${categoryId}`);
      toast.success('Kategori berhasil dihapus');
      fetchServer();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus kategori');
    }
  };

  // Role CRUD
  const handleSaveRole = async () => {
    try {
      if (editingRole) {
        await axiosInstance.put(`/api/chat/roles/${editingRole.id}`, roleForm);
        toast.success('Role berhasil diupdate');
      } else {
        await axiosInstance.post(`/api/chat/servers/${serverId}/roles`, roleForm);
        toast.success('Role berhasil dibuat');
      }
      setShowRoleModal(false);
      setEditingRole(null);
      resetRoleForm();
      fetchRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan role');
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('Yakin ingin menghapus role ini?')) return;
    
    try {
      await axiosInstance.delete(`/api/chat/roles/${roleId}`);
      toast.success('Role berhasil dihapus');
      fetchRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus role');
    }
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      color: role.color,
      ...role.permissions
    });
    setShowRoleModal(true);
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      color: '#99AAB5',
      can_manage_server: false,
      can_manage_channels: false,
      can_manage_roles: false,
      can_manage_messages: false,
      can_kick_members: false,
      can_ban_members: false,
      can_invite: true,
      can_send_messages: true,
      can_attach_files: true,
      can_add_reactions: true,
      can_mention_everyone: false,
      can_pin_messages: false
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>Server tidak ditemukan</p>
      </div>
    );
  }

  const isOwner = server.owner_id === currentUserId;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-56 bg-gray-800 min-h-screen p-4">
          <button
            onClick={() => navigate('/app/chat')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Kembali
          </button>
          
          <h2 className="text-lg font-bold text-white mb-4">{server.name}</h2>
          
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Overview', icon: Cog6ToothIcon },
              { id: 'channels', label: 'Channels', icon: HashtagIcon },
              { id: 'roles', label: 'Roles', icon: ShieldCheckIcon },
              { id: 'members', label: 'Members', icon: UserGroupIcon }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded ${
                  activeTab === tab.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="max-w-2xl">
              <h1 className="text-2xl font-bold mb-6">Server Overview</h1>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nama Server
                  </label>
                  <input
                    type="text"
                    value={serverForm.name}
                    onChange={(e) => setServerForm({ ...serverForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    disabled={!isOwner}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={serverForm.description}
                    onChange={(e) => setServerForm({ ...serverForm, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    rows={3}
                    disabled={!isOwner}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Icon (Emoji)
                  </label>
                  <input
                    type="text"
                    value={serverForm.icon}
                    onChange={(e) => setServerForm({ ...serverForm, icon: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="🏢"
                    disabled={!isOwner}
                  />
                </div>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={serverForm.is_public}
                    onChange={(e) => setServerForm({ ...serverForm, is_public: e.target.checked })}
                    className="rounded border-gray-600 bg-gray-800 text-blue-600"
                    disabled={!isOwner}
                  />
                  <span className="text-gray-300">Server Publik</span>
                </label>
                
                {!serverForm.is_public && server.invite_code && (
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Invite Code:</p>
                    <code className="text-blue-400 font-mono">{server.invite_code}</code>
                  </div>
                )}
                
                {isOwner && (
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleUpdateServer}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Simpan Perubahan
                    </button>
                    <button
                      onClick={handleDeleteServer}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Hapus Server
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Channels</h1>
                {isOwner && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCategoryForm({ name: '' });
                        setEditingCategory(null);
                        setShowCategoryModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                    >
                      <FolderIcon className="h-5 w-5" />
                      Tambah Kategori
                    </button>
                    <button
                      onClick={() => {
                        resetChannelForm();
                        setEditingChannel(null);
                        setShowChannelModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Tambah Channel
                    </button>
                  </div>
                )}
              </div>

              {/* Uncategorized Channels */}
              {server.uncategorized_channels?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                    Uncategorized
                  </h3>
                  <div className="space-y-2">
                    {server.uncategorized_channels.map(channel => (
                      <ChannelRow
                        key={channel.id}
                        channel={channel}
                        isOwner={isOwner}
                        onEdit={() => openEditChannel(channel)}
                        onDelete={() => handleDeleteChannel(channel.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              {server.categories?.map(category => (
                <div key={category.id} className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase">
                      {category.name}
                    </h3>
                    {isOwner && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingCategory(category);
                            setCategoryForm({ name: category.name });
                            setShowCategoryModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1 text-gray-400 hover:text-red-400"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {category.channels.map(channel => (
                      <ChannelRow
                        key={channel.id}
                        channel={channel}
                        isOwner={isOwner}
                        onEdit={() => openEditChannel(channel)}
                        onDelete={() => handleDeleteChannel(channel.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Roles</h1>
                {isOwner && (
                  <button
                    onClick={() => {
                      resetRoleForm();
                      setEditingRole(null);
                      setShowRoleModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Tambah Role
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {roles.map(role => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="font-medium">{role.name}</span>
                      {role.is_default && (
                        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">Default</span>
                      )}
                      <span className="text-sm text-gray-400">
                        {role.member_count} members
                      </span>
                    </div>
                    {isOwner && !role.is_default && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditRole(role)}
                          className="p-2 text-gray-400 hover:text-white"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="p-2 text-gray-400 hover:text-red-400"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div>
              <h1 className="text-2xl font-bold mb-6">
                Members ({server.members?.length || 0})
              </h1>

              <div className="space-y-2">
                {server.members?.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-medium">
                        {member.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        <p className="text-sm text-gray-400">@{member.username}</p>
                      </div>
                      {member.id === server.owner_id && (
                        <span className="text-xs bg-yellow-600 px-2 py-0.5 rounded">Owner</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Channel Modal */}
      {showChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingChannel ? 'Edit Channel' : 'Buat Channel'}
              </h2>
              <button onClick={() => setShowChannelModal(false)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nama</label>
                <input
                  type="text"
                  value={channelForm.name}
                  onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  placeholder="general"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Kategori</label>
                <select
                  value={channelForm.category_id || ''}
                  onChange={(e) => setChannelForm({ ...channelForm, category_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                >
                  <option value="">Tanpa Kategori</option>
                  {server.categories?.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Topic</label>
                <input
                  type="text"
                  value={channelForm.topic}
                  onChange={(e) => setChannelForm({ ...channelForm, topic: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  placeholder="Topik channel..."
                />
              </div>
              
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={channelForm.is_private}
                    onChange={(e) => setChannelForm({ ...channelForm, is_private: e.target.checked })}
                    className="rounded border-gray-600 bg-gray-900 text-blue-600"
                  />
                  <span className="text-gray-300">Private</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={channelForm.is_locked}
                    onChange={(e) => setChannelForm({ ...channelForm, is_locked: e.target.checked })}
                    className="rounded border-gray-600 bg-gray-900 text-blue-600"
                  />
                  <span className="text-gray-300">Locked</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowChannelModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={handleSaveChannel}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingChannel ? 'Update' : 'Buat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingCategory ? 'Edit Kategori' : 'Buat Kategori'}
              </h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nama Kategori</label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                placeholder="Text Channels"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingCategory ? 'Update' : 'Buat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 overflow-y-auto py-8">
          <div className="bg-gray-800 rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingRole ? 'Edit Role' : 'Buat Role'}
              </h2>
              <button onClick={() => setShowRoleModal(false)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nama Role</label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  placeholder="Moderator"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Warna</label>
                <input
                  type="color"
                  value={roleForm.color}
                  onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                  className="w-full h-10 bg-gray-900 border border-gray-700 rounded-lg"
                />
              </div>
              
              <div className="border-t border-gray-700 pt-4">
                <h3 className="font-medium mb-3">Permissions</h3>
                <div className="space-y-2">
                  {[
                    { key: 'can_manage_server', label: 'Manage Server' },
                    { key: 'can_manage_channels', label: 'Manage Channels' },
                    { key: 'can_manage_roles', label: 'Manage Roles' },
                    { key: 'can_manage_messages', label: 'Manage Messages' },
                    { key: 'can_kick_members', label: 'Kick Members' },
                    { key: 'can_ban_members', label: 'Ban Members' },
                    { key: 'can_invite', label: 'Create Invite' },
                    { key: 'can_send_messages', label: 'Send Messages' },
                    { key: 'can_attach_files', label: 'Attach Files' },
                    { key: 'can_add_reactions', label: 'Add Reactions' },
                    { key: 'can_mention_everyone', label: 'Mention @everyone' },
                    { key: 'can_pin_messages', label: 'Pin Messages' }
                  ].map(perm => (
                    <label key={perm.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(roleForm as any)[perm.key]}
                        onChange={(e) => setRoleForm({ ...roleForm, [perm.key]: e.target.checked })}
                        className="rounded border-gray-600 bg-gray-900 text-blue-600"
                      />
                      <span className="text-gray-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={handleSaveRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingRole ? 'Update' : 'Buat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Channel Row Component
const ChannelRow: React.FC<{
  channel: Channel;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ channel, isOwner, onEdit, onDelete }) => (
  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
    <div className="flex items-center gap-2">
      {channel.is_private ? (
        <LockClosedIcon className="h-5 w-5 text-gray-400" />
      ) : (
        <HashtagIcon className="h-5 w-5 text-gray-400" />
      )}
      <span className="font-medium">{channel.name}</span>
      {channel.is_locked && (
        <span className="text-xs bg-yellow-600 px-2 py-0.5 rounded">Locked</span>
      )}
    </div>
    {isOwner && (
      <div className="flex gap-2">
        <button onClick={onEdit} className="p-2 text-gray-400 hover:text-white">
          <PencilIcon className="h-5 w-5" />
        </button>
        <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-400">
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    )}
  </div>
);

export default ServerSettings;
