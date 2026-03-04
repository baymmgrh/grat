import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import { format, isToday, isYesterday } from 'date-fns';
import {
  HashtagIcon,
  LockClosedIcon,
  PlusIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  MagnifyingGlassIcon,
  BellIcon,
  PencilIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
  CheckIcon,
  UserPlusIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface Server {
  id: number;
  name: string;
  description: string;
  icon: string;
  owner_id: number;
  is_public: boolean;
  member_count: number;
  categories?: Category[];
  uncategorized_channels?: Channel[];
}

interface Category {
  id: number;
  name: string;
  order: number;
  is_collapsed: boolean;
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
  message_count: number;
}

interface Attachment {
  id: number;
  filename: string;
  file_path: string;
  file_size: number;
  content_type: string;
}

interface Message {
  id: number;
  channel_id: number;
  user_id: number;
  user: {
    id: number;
    username: string;
    full_name: string;
    avatar?: string;
  };
  content: string;
  message_type: string;
  reply_to_id?: number;
  reply_to?: Message;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  created_at: string;
  reactions: { emoji: string; count: number; users: number[] }[];
  attachments?: Attachment[];
}

interface Member {
  id: number;
  username: string;
  full_name: string;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  custom_status?: string;
}

// Common emojis for quick picker
const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👀', '💯', '✅', '❌', '👏', '🙏', '💪', '🤔', '😊', '🥳', '💡', '⭐'];

interface UserInfo {
  id: number;
  username: string;
  full_name: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  custom_status: string;
}

const GroupChat: React.FC = () => {
  const authUser = useSelector((state: RootState) => state.auth.user);
  
  // State
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<Member[]>([]);
  const [idleMembers, setIdleMembers] = useState<Member[]>([]);
  const [offlineMembers, setOfflineMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showMembersSidebar, setShowMembersSidebar] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<number[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Member[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showChannelSettingsModal, setShowChannelSettingsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingChannel, setPendingChannel] = useState<Channel | null>(null);
  const [channelPassword, setChannelPassword] = useState('');
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedChannelRef = useRef<Channel | null>(null);
  const selectedServerRef = useRef<Server | null>(null);
  const currentUserId = parseInt(localStorage.getItem('userId') || '0');
  
  // Keep refs in sync with state
  useEffect(() => {
    selectedChannelRef.current = selectedChannel;
  }, [selectedChannel]);
  
  useEffect(() => {
    selectedServerRef.current = selectedServer;
  }, [selectedServer]);

  // Fetch servers (single company server)
  const fetchServers = async () => {
    try {
      const response = await axiosInstance.get('/api/chat/servers');
      const joinedServers = response.data.joined_servers || [];
      setServers(joinedServers);
      
      // Auto-select the company server
      if (joinedServers.length > 0) {
        selectServer(joinedServers[0]);
      }
    } catch (error: any) {
      // Handle access denied for excluded roles
      if (error.response?.status === 403) {
        setServers([]);
      }
      console.error('Error fetching servers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch server details
  const selectServer = async (server: Server) => {
    try {
      const response = await axiosInstance.get(`/api/chat/servers/${server.id}`);
      const serverData = response.data.server;
      setSelectedServer(serverData);
      
      // Get real-time online status
      fetchOnlineMembers(server.id);
      
      // Select first channel
      const firstChannel = serverData.categories?.[0]?.channels?.[0] || 
                          serverData.uncategorized_channels?.[0];
      if (firstChannel) {
        selectChannel(firstChannel);
      }
    } catch (error) {
      console.error('Error fetching server:', error);
    }
  };

  // Fetch real-time online members
  const fetchOnlineMembers = async (serverId: number) => {
    try {
      const response = await axiosInstance.get(`/api/chat/servers/${serverId}/online`);
      setOnlineMembers(response.data.online || []);
      setIdleMembers(response.data.idle || []);
      setOfflineMembers(response.data.offline || []);
    } catch (error) {
      console.error('Error fetching online members:', error);
    }
  };

  // Send heartbeat to update online status
  const sendHeartbeat = async () => {
    try {
      await axiosInstance.post('/api/chat/heartbeat');
    } catch (error) {
      // Silently fail
    }
  };

  // Fetch current user status
  const fetchCurrentUserStatus = async () => {
    // Use authUser from Redux first (most reliable source)
    const userName = authUser?.full_name || authUser?.username || 
                     localStorage.getItem('fullName') || 
                     localStorage.getItem('username') || 'User';
    const userId = authUser?.id || parseInt(localStorage.getItem('userId') || '0');
    const userUsername = authUser?.username || localStorage.getItem('username') || 'User';
    
    setCurrentUser({
      id: userId,
      username: userUsername,
      full_name: userName,
      status: 'online',
      custom_status: ''
    });
    
    // Then try to get updated status from API
    try {
      const response = await axiosInstance.get('/api/chat/status');
      const statusData = response.data.status;
      
      setCurrentUser(prev => prev ? {
        ...prev,
        status: statusData?.status || 'online',
        custom_status: statusData?.custom_status || ''
      } : prev);
    } catch (error) {
      console.error('Error fetching user status:', error);
    }
  };

  // Update user status
  const updateUserStatus = async (status: string, customStatus?: string) => {
    try {
      await axiosInstance.put('/api/chat/status', {
        status,
        custom_status: customStatus
      });
      
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          status: status as any,
          custom_status: customStatus || ''
        });
      }
      
      // Refresh online members list after status change
      if (selectedServerRef.current) {
        fetchOnlineMembers(selectedServerRef.current.id);
      }
      
      toast.success('Status berhasil diupdate');
    } catch (error) {
      toast.error('Gagal update status');
    }
  };

  // Fetch channel messages
  const selectChannel = async (channel: Channel) => {
    setSelectedChannel(channel);
    try {
      const response = await axiosInstance.get(`/api/chat/channels/${channel.id}`);
      setMessages(response.data.messages || []);
      
      // Mark as read
      await axiosInstance.post(`/api/chat/channels/${channel.id}/read`);
      setUnreadCounts(prev => ({ ...prev, [channel.id]: 0 }));
      
      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error fetching channel:', error);
    }
  };

  // Fetch unread counts
  const fetchUnreadCounts = async () => {
    try {
      const response = await axiosInstance.get('/api/chat/unread');
      const counts: Record<number, number> = {};
      response.data.unread?.forEach((u: any) => {
        counts[u.channel_id] = u.unread_count;
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  // Update current user when authUser changes
  useEffect(() => {
    if (authUser) {
      setCurrentUser(prev => ({
        id: authUser.id,
        username: authUser.username,
        full_name: authUser.full_name || authUser.username,
        status: prev?.status || 'online',
        custom_status: prev?.custom_status || ''
      }));
    }
  }, [authUser]);

  // Initial load - only run once
  useEffect(() => {
    fetchServers();
    fetchUnreadCounts();
    fetchCurrentUserStatus();
    sendHeartbeat();
  }, []);

  // Polling intervals - use refs to get current values
  useEffect(() => {
    // Poll for new messages every 5 seconds
    const messageInterval = setInterval(() => {
      if (selectedChannelRef.current) {
        refreshMessagesFromRef();
      }
      fetchUnreadCounts();
    }, 5000);
    
    // Send heartbeat every 15 seconds for online status
    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, 15000);
    
    // Refresh online members every 10 seconds
    const onlineInterval = setInterval(() => {
      if (selectedServerRef.current) {
        fetchOnlineMembers(selectedServerRef.current.id);
      }
    }, 10000);
    
    return () => {
      clearInterval(messageInterval);
      clearInterval(heartbeatInterval);
      clearInterval(onlineInterval);
    };
  }, []);

  const refreshMessages = async () => {
    if (!selectedChannel) return;
    try {
      const response = await axiosInstance.get(`/api/chat/channels/${selectedChannel.id}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  // Refresh messages using ref (for intervals)
  const refreshMessagesFromRef = async () => {
    const channel = selectedChannelRef.current;
    if (!channel) return;
    try {
      const response = await axiosInstance.get(`/api/chat/channels/${channel.id}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send message
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedChannel) return;
    
    try {
      if (editingMessage) {
        await axiosInstance.put(`/api/chat/messages/${editingMessage.id}`, {
          content: messageInput
        });
        setEditingMessage(null);
      } else {
        await axiosInstance.post(`/api/chat/channels/${selectedChannel.id}/messages`, {
          content: messageInput,
          reply_to_id: replyTo?.id
        });
        setReplyTo(null);
      }
      
      setMessageInput('');
      refreshMessages();
      setTimeout(() => scrollToBottom(), 100);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    }
  };

  // Delete message
  const deleteMessage = async (messageId: number) => {
    try {
      await axiosInstance.delete(`/api/chat/messages/${messageId}`);
      refreshMessages();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete message');
    }
  };

  // Add reaction
  const addReaction = async (messageId: number, emoji: string) => {
    try {
      await axiosInstance.post(`/api/chat/messages/${messageId}/reactions`, { emoji });
      refreshMessages();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Toggle category collapse
  const toggleCategory = (categoryId: number) => {
    setCollapsedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Format message time
  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return `Hari ini ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Kemarin ${format(date, 'HH:mm')}`;
    }
    return format(date, 'dd/MM/yyyy HH:mm');
  };

  // Group messages by date
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    
    msgs.forEach(msg => {
      const msgDate = format(new Date(msg.created_at), 'yyyy-MM-dd');
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    
    return groups;
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Search messages
  const searchMessages = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2 || !selectedChannel) return;
    
    setIsSearching(true);
    try {
      const response = await axiosInstance.get(
        `/api/chat/channels/${selectedChannel.id}/search?q=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Error searching messages:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search key press
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchMessages();
    }
  };

  // Add emoji to message input
  const addEmoji = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  // Fetch available users to invite
  const fetchAvailableUsers = async () => {
    if (!selectedServer) return;
    
    setInviteLoading(true);
    try {
      const response = await axiosInstance.get(`/api/chat/servers/${selectedServer.id}/available-users`);
      setAvailableUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching available users:', error);
      toast.error('Gagal memuat daftar user');
    } finally {
      setInviteLoading(false);
    }
  };

  // Invite user to server
  const inviteUser = async (userId: number) => {
    if (!selectedServer) return;
    
    try {
      await axiosInstance.post(`/api/chat/servers/${selectedServer.id}/invite`, {
        user_id: userId
      });
      toast.success('User berhasil diundang');
      // Remove from available list
      setAvailableUsers(prev => prev.filter(u => u.id !== userId));
      // Refresh online members
      fetchOnlineMembers(selectedServer.id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal mengundang user');
    }
  };

  // Open invite modal
  const openInviteModal = () => {
    setShowInviteModal(true);
    fetchAvailableUsers();
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload file and send message
  const sendFileMessage = async () => {
    if (!selectedFile || !selectedChannel) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('channel_id', selectedChannel.id.toString());
      if (messageInput.trim()) {
        formData.append('caption', messageInput.trim());
      }
      if (replyTo) {
        formData.append('reply_to_id', replyTo.id.toString());
      }

      await axiosInstance.post('/api/chat/messages/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      clearSelectedFile();
      setMessageInput('');
      setReplyTo(null);
      refreshMessages();
      setTimeout(() => scrollToBottom(), 100);
      toast.success('File berhasil dikirim');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal mengirim file');
    } finally {
      setUploadingFile(false);
    }
  };

  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Create new channel
  const createChannel = async (data: {
    name: string;
    description: string;
    is_private: boolean;
    password?: string;
    category_id?: number;
  }) => {
    if (!selectedServer) return;

    try {
      await axiosInstance.post(`/api/chat/servers/${selectedServer.id}/channels`, data);
      toast.success('Channel berhasil dibuat');
      setShowCreateChannelModal(false);
      // Refresh server to get updated channels
      selectServer(selectedServer);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal membuat channel');
    }
  };

  // Update channel
  const updateChannel = async (channelId: number, data: {
    name?: string;
    description?: string;
    is_private?: boolean;
    password?: string;
    is_locked?: boolean;
  }) => {
    try {
      await axiosInstance.put(`/api/chat/channels/${channelId}`, data);
      toast.success('Channel berhasil diupdate');
      setShowChannelSettingsModal(false);
      setEditingChannel(null);
      // Refresh server
      if (selectedServer) {
        selectServer(selectedServer);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal update channel');
    }
  };

  // Delete channel
  const deleteChannel = async (channelId: number) => {
    if (!confirm('Yakin ingin menghapus channel ini?')) return;

    try {
      await axiosInstance.delete(`/api/chat/channels/${channelId}`);
      toast.success('Channel berhasil dihapus');
      setShowChannelSettingsModal(false);
      setEditingChannel(null);
      setSelectedChannel(null);
      // Refresh server
      if (selectedServer) {
        selectServer(selectedServer);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus channel');
    }
  };

  // Handle channel click - check if password required
  const handleChannelClick = async (channel: Channel) => {
    if (channel.is_private) {
      // Check if user has access
      try {
        const response = await axiosInstance.get(`/api/chat/channels/${channel.id}/check-access`);
        if (response.data.has_access) {
          selectChannel(channel);
        } else {
          // Need password
          setPendingChannel(channel);
          setChannelPassword('');
          setShowPasswordModal(true);
        }
      } catch (error) {
        // Need password
        setPendingChannel(channel);
        setChannelPassword('');
        setShowPasswordModal(true);
      }
    } else {
      selectChannel(channel);
    }
  };

  // Submit password for private channel
  const submitChannelPassword = async () => {
    if (!pendingChannel) return;

    try {
      await axiosInstance.post(`/api/chat/channels/${pendingChannel.id}/unlock`, {
        password: channelPassword
      });
      selectChannel(pendingChannel);
      setShowPasswordModal(false);
      setPendingChannel(null);
      setChannelPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Password salah');
    }
  };

  // Open channel settings
  const openChannelSettings = (channel: Channel, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChannel(channel);
    setShowChannelSettingsModal(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 top-16 flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check if user has no access
  if (servers.length === 0) {
    return (
      <div className="fixed inset-0 top-16 flex items-center justify-center bg-gray-900 text-gray-100">
        <div className="text-center">
          <UserGroupIcon className="h-16 w-16 mx-auto text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-400">Akses Chat Tidak Tersedia</h2>
          <p className="text-gray-500 mt-2">Role Anda tidak memiliki akses ke fitur Group Chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-16 flex bg-gray-900 text-gray-100 overflow-hidden">

      {/* Channel List Sidebar */}
      {selectedServer && (
        <div className="w-60 bg-gray-800 flex flex-col">
          {/* Server Header */}
          <div className="h-12 px-4 flex items-center justify-between border-b border-gray-900 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl flex-shrink-0">{selectedServer.icon || '🏢'}</span>
              <h2 className="font-semibold text-white truncate">{selectedServer.name}</h2>
            </div>
            <button
              onClick={openInviteModal}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded flex-shrink-0"
              title="Undang Anggota"
            >
              <UserPlusIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Channels */}
          <div className="flex-1 overflow-y-auto py-2">
            {/* Add Channel Button */}
            <div className="px-2 mb-2">
              <button
                onClick={() => setShowCreateChannelModal(true)}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Tambah Channel</span>
              </button>
            </div>

            {/* Uncategorized Channels */}
            {selectedServer.uncategorized_channels?.map(channel => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isSelected={selectedChannel?.id === channel.id}
                unreadCount={unreadCounts[channel.id] || 0}
                onClick={() => handleChannelClick(channel)}
                onSettings={(e) => openChannelSettings(channel, e)}
              />
            ))}

            {/* Categories */}
            {selectedServer.categories?.map(category => (
              <div key={category.id} className="mt-2">
                <div className="flex items-center justify-between px-2 py-1">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center text-xs font-semibold text-gray-400 hover:text-gray-200 uppercase"
                  >
                    {collapsedCategories.includes(category.id) ? (
                      <ChevronRightIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <ChevronDownIcon className="h-3 w-3 mr-1" />
                    )}
                    {category.name}
                  </button>
                </div>
                
                {!collapsedCategories.includes(category.id) && (
                  <div className="space-y-0.5">
                    {category.channels.map(channel => (
                      <ChannelItem
                        key={channel.id}
                        channel={channel}
                        isSelected={selectedChannel?.id === channel.id}
                        unreadCount={unreadCounts[channel.id] || 0}
                        onClick={() => handleChannelClick(channel)}
                        onSettings={(e) => openChannelSettings(channel, e)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* User Panel */}
          <div className="h-14 px-2 flex items-center bg-gray-850 border-t border-gray-900 relative">
            <div className="flex items-center flex-1 min-w-0">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
                  {currentUser?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${
                  currentUser?.status === 'online' ? 'bg-green-500' :
                  currentUser?.status === 'idle' ? 'bg-yellow-500' :
                  currentUser?.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
              </div>
              <div className="ml-2 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {currentUser?.full_name || 'Loading...'}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {currentUser?.status === 'dnd' ? 'Do Not Disturb' : currentUser?.status || 'Online'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowUserSettings(!showUserSettings)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
            
            {/* User Settings Popup */}
            {showUserSettings && (
              <div className="absolute bottom-full left-2 right-2 mb-2 bg-gray-900 rounded-lg shadow-xl border border-gray-700 p-3 z-50">
                <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Set Status</p>
                <div className="space-y-1">
                  <button
                    onClick={() => { updateUserStatus('online'); setShowUserSettings(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-800 ${currentUser?.status === 'online' ? 'bg-gray-800' : ''}`}
                  >
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-200">Online</span>
                  </button>
                  <button
                    onClick={() => { updateUserStatus('idle'); setShowUserSettings(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-800 ${currentUser?.status === 'idle' ? 'bg-gray-800' : ''}`}
                  >
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm text-gray-200">Idle</span>
                  </button>
                  <button
                    onClick={() => { updateUserStatus('dnd'); setShowUserSettings(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-800 ${currentUser?.status === 'dnd' ? 'bg-gray-800' : ''}`}
                  >
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-200">Do Not Disturb</span>
                  </button>
                  <button
                    onClick={() => { updateUserStatus('offline'); setShowUserSettings(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-800 ${currentUser?.status === 'offline' ? 'bg-gray-800' : ''}`}
                  >
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span className="text-sm text-gray-200">Invisible</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-700">
        {selectedChannel ? (
          <>
            {/* Channel Header */}
            <div className="h-12 px-4 flex items-center justify-between border-b border-gray-900 shadow-sm">
              <div className="flex items-center">
                {selectedChannel.is_private ? (
                  <LockClosedIcon className="h-5 w-5 text-gray-400 mr-2" />
                ) : (
                  <HashtagIcon className="h-5 w-5 text-gray-400 mr-2" />
                )}
                <span className="font-semibold text-white">{selectedChannel.name}</span>
                {selectedChannel.topic && (
                  <>
                    <div className="w-px h-6 bg-gray-600 mx-3"></div>
                    <span className="text-sm text-gray-400 truncate max-w-md">
                      {selectedChannel.topic}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-white">
                  <BellIcon className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setShowSearch(!showSearch)}
                  className={`p-2 ${showSearch ? 'text-white' : 'text-gray-400'} hover:text-white`}
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowMembersSidebar(!showMembersSidebar)}
                  className={`p-2 ${showMembersSidebar ? 'text-white' : 'text-gray-400'} hover:text-white`}
                >
                  <UserGroupIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search Panel */}
            {showSearch && (
              <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyPress}
                      placeholder="Cari pesan..."
                      className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={searchMessages}
                    disabled={isSearching || searchQuery.length < 2}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSearching ? 'Mencari...' : 'Cari'}
                  </button>
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-3 max-h-60 overflow-y-auto space-y-2">
                    <p className="text-xs text-gray-400 mb-2">{searchResults.length} hasil ditemukan</p>
                    {searchResults.map(msg => (
                      <div key={msg.id} className="p-2 bg-gray-900 rounded-lg text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-blue-400">{msg.user?.full_name}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-gray-300">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {groupMessagesByDate(messages).map(group => (
                <div key={group.date}>
                  {/* Date Separator */}
                  <div className="flex items-center my-4">
                    <div className="flex-1 h-px bg-gray-600"></div>
                    <span className="px-4 text-xs text-gray-400 font-medium">
                      {isToday(new Date(group.date))
                        ? 'Hari Ini'
                        : isYesterday(new Date(group.date))
                        ? 'Kemarin'
                        : format(new Date(group.date), 'dd MMMM yyyy')}
                    </span>
                    <div className="flex-1 h-px bg-gray-600"></div>
                  </div>

                  {/* Messages */}
                  {group.messages.map((message, idx) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      isOwn={message.user_id === currentUserId}
                      showAvatar={idx === 0 || group.messages[idx - 1]?.user_id !== message.user_id}
                      onReply={() => setReplyTo(message)}
                      onEdit={() => {
                        setEditingMessage(message);
                        setMessageInput(message.content);
                      }}
                      onDelete={() => deleteMessage(message.id)}
                      onReact={(emoji) => addReaction(message.id, emoji)}
                    />
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyTo && (
              <div className="px-4 py-2 bg-gray-800 border-t border-gray-600 flex items-center">
                <ArrowUturnLeftIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-400">
                  Membalas <span className="text-blue-400">{replyTo.user?.full_name}</span>
                </span>
                <span className="text-sm text-gray-500 ml-2 truncate flex-1">
                  {replyTo.content}
                </span>
                <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-white">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Edit Preview */}
            {editingMessage && (
              <div className="px-4 py-2 bg-blue-900/30 border-t border-blue-600 flex items-center">
                <PencilIcon className="h-4 w-4 text-blue-400 mr-2" />
                <span className="text-sm text-blue-400">Mengedit pesan</span>
                <button
                  onClick={() => {
                    setEditingMessage(null);
                    setMessageInput('');
                  }}
                  className="ml-auto text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Message Input */}
            <div className="px-4 pb-6 relative">
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-20 right-4 bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-3 z-50">
                  <div className="grid grid-cols-5 gap-2">
                    {EMOJI_LIST.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => addEmoji(emoji)}
                        className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-700 rounded"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* File Preview */}
              {selectedFile && (
                <div className="bg-gray-700 rounded-lg p-3 mb-2">
                  <div className="flex items-start gap-3">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-20 h-20 object-cover rounded" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-600 rounded flex items-center justify-center">
                        <span className="text-2xl">📄</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{selectedFile.name}</p>
                      <p className="text-gray-400 text-sm">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={clearSelectedFile}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
              />
              
              <div className="bg-gray-600 rounded-lg flex items-end">
                <button 
                  onClick={openFilePicker}
                  className="p-3 text-gray-400 hover:text-white"
                  title="Attach file"
                >
                  <PlusIcon className="h-6 w-6" />
                </button>
                <textarea
                  ref={messageInputRef}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={selectedFile ? 'Tambahkan caption (opsional)' : `Kirim pesan ke #${selectedChannel.name}`}
                  className="flex-1 bg-transparent text-white placeholder-gray-400 py-3 px-2 resize-none max-h-40 focus:outline-none"
                  rows={1}
                />
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-3 ${showEmojiPicker ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-400`}
                >
                  <FaceSmileIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={selectedFile ? sendFileMessage : sendMessage}
                  disabled={uploadingFile || (!messageInput.trim() && !selectedFile)}
                  className={`p-3 ${(messageInput.trim() || selectedFile) && !uploadingFile ? 'text-blue-500 hover:text-blue-400' : 'text-gray-500'}`}
                >
                  {uploadingFile ? (
                    <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <HashtagIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400">Pilih Channel</h3>
              <p className="text-gray-500 mt-2">Pilih channel untuk mulai mengobrol</p>
            </div>
          </div>
        )}
      </div>

      {/* Members Sidebar */}
      {showMembersSidebar && selectedServer && (
        <div className="w-60 bg-gray-800 border-l border-gray-900 overflow-y-auto">
          <div className="p-4">
            {/* Online Members */}
            {onlineMembers.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                  Online — {onlineMembers.length}
                </h3>
                {onlineMembers.map(member => (
                  <MemberItem key={member.id} member={member} />
                ))}
              </>
            )}

            {/* Idle Members */}
            {idleMembers.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mt-4 mb-2">
                  Idle — {idleMembers.length}
                </h3>
                {idleMembers.map(member => (
                  <MemberItem key={member.id} member={member} status="idle" />
                ))}
              </>
            )}

            {/* Offline Members */}
            {offlineMembers.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mt-4 mb-2">
                  Offline — {offlineMembers.length}
                </h3>
                {offlineMembers.map(member => (
                  <MemberItem key={member.id} member={member} status="offline" />
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlusIcon className="h-6 w-6" />
                Undang Anggota
              </h2>
              <button 
                onClick={() => setShowInviteModal(false)} 
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-gray-400 text-sm mb-4">
              Pilih user yang ingin diundang ke {selectedServer?.name}
            </p>

            {inviteLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : availableUsers.length === 0 ? (
              <div className="text-center py-8">
                <UserGroupIcon className="h-12 w-12 mx-auto text-gray-600 mb-2" />
                <p className="text-gray-400">Semua user yang eligible sudah bergabung</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availableUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-650"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.full_name}</p>
                        <p className="text-sm text-gray-400">@{user.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => inviteUser(user.id)}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Undang
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-full py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateChannelModal && (
        <CreateChannelModal
          onClose={() => setShowCreateChannelModal(false)}
          onCreate={createChannel}
          categories={selectedServer?.categories || []}
        />
      )}

      {/* Channel Settings Modal */}
      {showChannelSettingsModal && editingChannel && (
        <ChannelSettingsModal
          channel={editingChannel}
          onClose={() => {
            setShowChannelSettingsModal(false);
            setEditingChannel(null);
          }}
          onUpdate={updateChannel}
          onDelete={deleteChannel}
        />
      )}

      {/* Password Modal */}
      {showPasswordModal && pendingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-lg w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <LockClosedIcon className="h-6 w-6" />
                Channel Private
              </h2>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPendingChannel(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-gray-400 text-sm mb-4">
              Channel <span className="text-white font-medium">#{pendingChannel.name}</span> memerlukan password untuk masuk.
            </p>

            <input
              type="password"
              value={channelPassword}
              onChange={(e) => setChannelPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitChannelPassword()}
              placeholder="Masukkan password"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPendingChannel(null);
                }}
                className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                Batal
              </button>
              <button
                onClick={submitChannelPassword}
                disabled={!channelPassword}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Masuk
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Create Channel Modal Component
const CreateChannelModal: React.FC<{
  onClose: () => void;
  onCreate: (data: { name: string; description: string; is_private: boolean; password?: string; category_id?: number }) => void;
  categories: Category[];
}> = ({ onClose, onCreate, categories }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Nama channel harus diisi');
      return;
    }
    if (isPrivate && !password.trim()) {
      toast.error('Password harus diisi untuk channel private');
      return;
    }
    onCreate({
      name: name.trim().toLowerCase().replace(/\s+/g, '-'),
      description: description.trim(),
      is_private: isPrivate,
      password: isPrivate ? password : undefined,
      category_id: categoryId
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Buat Channel Baru</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nama Channel</label>
            <div className="flex items-center bg-gray-700 rounded-lg">
              <span className="pl-3 text-gray-400">#</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="nama-channel"
                className="flex-1 px-2 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Deskripsi (opsional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tentang channel ini..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Kategori (opsional)</label>
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Tanpa Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">Channel Private</p>
              <p className="text-gray-400 text-sm">Hanya bisa diakses dengan password</p>
            </div>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-12 h-6 rounded-full transition-colors ${isPrivate ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {isPrivate && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password Channel</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Buat Channel
          </button>
        </div>
      </div>
    </div>
  );
};

// Channel Settings Modal Component
const ChannelSettingsModal: React.FC<{
  channel: Channel;
  onClose: () => void;
  onUpdate: (channelId: number, data: any) => void;
  onDelete: (channelId: number) => void;
}> = ({ channel, onClose, onUpdate, onDelete }) => {
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description || '');
  const [isPrivate, setIsPrivate] = useState(channel.is_private);
  const [password, setPassword] = useState('');
  const [isLocked, setIsLocked] = useState(channel.is_locked);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Nama channel harus diisi');
      return;
    }
    onUpdate(channel.id, {
      name: name.trim().toLowerCase().replace(/\s+/g, '-'),
      description: description.trim(),
      is_private: isPrivate,
      password: password || undefined,
      is_locked: isLocked
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Pengaturan Channel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nama Channel</label>
            <div className="flex items-center bg-gray-700 rounded-lg">
              <span className="pl-3 text-gray-400">#</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="flex-1 px-2 py-2 bg-transparent text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Deskripsi</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tentang channel ini..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">Channel Private</p>
              <p className="text-gray-400 text-sm">Memerlukan password untuk akses</p>
            </div>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-12 h-6 rounded-full transition-colors ${isPrivate ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {isPrivate && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password Baru (kosongkan jika tidak ingin mengubah)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password baru"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">Kunci Channel</p>
              <p className="text-gray-400 text-sm">Hanya admin yang bisa mengirim pesan</p>
            </div>
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`w-12 h-6 rounded-full transition-colors ${isLocked ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isLocked ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => onDelete(channel.id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Hapus
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

// Channel Item Component
const ChannelItem: React.FC<{
  channel: Channel;
  isSelected: boolean;
  unreadCount: number;
  onClick: () => void;
  onSettings?: (e: React.MouseEvent) => void;
}> = ({ channel, isSelected, unreadCount, onClick, onSettings }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`relative flex items-center px-2 py-1.5 mx-2 rounded group cursor-pointer ${
        isSelected
          ? 'bg-gray-600 text-white'
          : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
      }`}
      style={{ width: 'calc(100% - 16px)' }}
      onClick={onClick}
    >
      {channel.is_private ? (
        <LockClosedIcon className="h-5 w-5 mr-1.5 flex-shrink-0" />
      ) : (
        <HashtagIcon className="h-5 w-5 mr-1.5 flex-shrink-0" />
      )}
      <span className={`truncate flex-1 ${unreadCount > 0 ? 'font-semibold text-white' : ''}`}>
        {channel.name}
      </span>
      {unreadCount > 0 && (
        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full mr-1">
          {unreadCount}
        </span>
      )}
      {onSettings && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSettings(e);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded"
          title="Pengaturan Channel"
        >
          <Cog6ToothIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// Message Item Component
const MessageItem: React.FC<{
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
}> = ({ message, isOwn, showAvatar, onReply, onEdit, onDelete, onReact }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`group relative flex py-0.5 px-2 hover:bg-gray-800/30 rounded ${
        showAvatar ? 'mt-4' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="w-10 flex-shrink-0">
        {showAvatar && (
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
            {message.user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 ml-4">
        {showAvatar && (
          <div className="flex items-baseline">
            <span className="font-medium text-white hover:underline cursor-pointer">
              {message.user?.full_name || 'Unknown'}
            </span>
            <span className="ml-2 text-xs text-gray-500">
              {format(new Date(message.created_at), 'HH:mm')}
            </span>
          </div>
        )}

        {/* Reply Reference */}
        {message.reply_to && (
          <div className="flex items-center text-sm text-gray-400 mb-1">
            <ArrowUturnLeftIcon className="h-3 w-3 mr-1" />
            <span className="text-blue-400">{message.reply_to.user?.full_name}</span>
            <span className="ml-1 truncate">{message.reply_to.content}</span>
          </div>
        )}

        {/* Message Content */}
        <p className={`text-gray-200 break-words ${message.is_deleted ? 'italic text-gray-500' : ''}`}>
          {message.content}
          {message.is_edited && !message.is_deleted && (
            <span className="text-xs text-gray-500 ml-1">(diedit)</span>
          )}
        </p>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => {
              const isImage = attachment.content_type?.startsWith('image/');
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
              const fileUrl = `${apiUrl}${attachment.file_path}`;
              
              if (isImage) {
                return (
                  <a 
                    key={attachment.id} 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img 
                      src={fileUrl} 
                      alt={attachment.filename}
                      className="max-w-md max-h-80 rounded-lg cursor-pointer hover:opacity-90"
                    />
                  </a>
                );
              } else {
                return (
                  <a
                    key={attachment.id}
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 max-w-md"
                  >
                    <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center text-xl">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{attachment.filename}</p>
                      <p className="text-gray-400 text-sm">
                        {(attachment.file_size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </a>
                );
              }
            })}
          </div>
        )}

        {/* Reactions */}
        {message.reactions?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction, idx) => (
              <button
                key={idx}
                onClick={() => onReact(reaction.emoji)}
                className="flex items-center gap-1 px-2 py-0.5 bg-gray-600 hover:bg-gray-500 rounded-full text-sm"
              >
                <span>{reaction.emoji}</span>
                <span className="text-gray-300">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && !message.is_deleted && (
        <div className="absolute right-2 -top-3 flex items-center bg-gray-800 rounded border border-gray-700 shadow-lg">
          <button
            onClick={() => onReact('👍')}
            className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-white"
            title="Reaction"
          >
            <FaceSmileIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onReply}
            className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-white"
            title="Reply"
          >
            <ArrowUturnLeftIcon className="h-5 w-5" />
          </button>
          {isOwn && (
            <>
              <button
                onClick={onEdit}
                className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-white"
                title="Edit"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-red-400"
                title="Delete"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Member Item Component
const MemberItem: React.FC<{ member: Member; status?: 'online' | 'idle' | 'dnd' | 'offline' }> = ({ member, status }) => {
  // Use member's actual status if available, otherwise use prop
  const actualStatus = member.status || status || 'online';
  
  const getStatusColor = () => {
    switch (actualStatus) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const isOffline = actualStatus === 'offline';

  return (
    <div className={`flex items-center py-1.5 px-2 rounded hover:bg-gray-700 cursor-pointer ${isOffline ? 'opacity-50' : ''}`}>
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
          {member.full_name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor()}`}></div>
      </div>
      <div className="ml-2 min-w-0">
        <p className="text-sm text-gray-200 truncate">{member.full_name}</p>
        {member.custom_status && (
          <p className="text-xs text-gray-400 truncate">{member.custom_status}</p>
        )}
      </div>
    </div>
  );
};

export default GroupChat;
