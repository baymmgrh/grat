import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import { format, isToday, isYesterday } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  HashtagIcon,
  LockClosedIcon,
  PlusIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  PencilIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import { HashtagIcon as HashtagSolid } from '@heroicons/react/24/solid';

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
}

interface Message {
  id: number;
  channel_id: number;
  user_id: number;
  user: {
    id: number;
    username: string;
    full_name: string;
  };
  content: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  reply_to?: Message;
  reactions: { emoji: string; count: number; users: number[] }[];
}

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullPage?: () => void;
}

const ChatPopup: React.FC<ChatPopupProps> = ({ isOpen, onClose, onOpenFullPage }) => {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<number[]>([]);
  const [showServerList, setShowServerList] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = parseInt(localStorage.getItem('userId') || '0');

  // Fetch servers
  const fetchServers = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/chat/servers');
      setServers(response.data.joined_servers || []);
      
      if (!selectedServer && response.data.joined_servers?.length > 0) {
        selectServer(response.data.joined_servers[0]);
      }
    } catch (error) {
      console.error('Error fetching servers:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedServer]);

  const selectServer = async (server: Server) => {
    try {
      const response = await axiosInstance.get(`/api/chat/servers/${server.id}`);
      const serverData = response.data.server;
      setSelectedServer(serverData);
      setShowServerList(false);
      
      const firstChannel = serverData.categories?.[0]?.channels?.[0] || 
                          serverData.uncategorized_channels?.[0];
      if (firstChannel) {
        selectChannel(firstChannel);
      }
    } catch (error) {
      console.error('Error fetching server:', error);
    }
  };

  const selectChannel = async (channel: Channel) => {
    setSelectedChannel(channel);
    try {
      const response = await axiosInstance.get(`/api/chat/channels/${channel.id}`);
      setMessages(response.data.messages || []);
      await axiosInstance.post(`/api/chat/channels/${channel.id}/read`);
      setUnreadCounts(prev => ({ ...prev, [channel.id]: 0 }));
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error fetching channel:', error);
    }
  };

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

  useEffect(() => {
    if (isOpen) {
      fetchServers();
      fetchUnreadCounts();
      
      const interval = setInterval(() => {
        if (selectedChannel) {
          refreshMessages();
        }
        fetchUnreadCounts();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const refreshMessages = async () => {
    if (!selectedChannel) return;
    try {
      const response = await axiosInstance.get(`/api/chat/channels/${selectedChannel.id}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedChannel) return;
    
    try {
      await axiosInstance.post(`/api/chat/channels/${selectedChannel.id}/messages`, {
        content: messageInput,
        reply_to_id: replyTo?.id
      });
      setReplyTo(null);
      setMessageInput('');
      refreshMessages();
      setTimeout(() => scrollToBottom(), 100);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleCategory = (categoryId: number) => {
    setCollapsedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  if (!isOpen) return null;

  const popupContent = (
    <div 
      className={`fixed z-[9999] bg-gray-900 text-gray-100 shadow-2xl flex flex-col transition-all duration-300 ${
        isMaximized 
          ? 'inset-4 rounded-xl' 
          : isMinimized
          ? 'bottom-4 right-4 w-80 h-14 rounded-xl'
          : 'bottom-4 right-4 w-[800px] h-[600px] rounded-xl'
      }`}
      style={{ fontFamily: 'inherit' }}
    >
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between bg-gray-800 rounded-t-xl border-b border-gray-700">
        <div className="flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-400" />
          <span className="font-semibold">
            {selectedChannel ? `#${selectedChannel.name}` : 'Group Chat'}
          </span>
          {totalUnread > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {totalUnread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onOpenFullPage && (
            <button
              onClick={onOpenFullPage}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              title="Buka halaman penuh"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <ArrowsPointingInIcon className="h-4 w-4" />
            ) : (
              <ArrowsPointingOutIcon className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title="Tutup"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 flex overflow-hidden">
          {/* Server/Channel Sidebar */}
          <div className="w-56 bg-gray-800 flex flex-col border-r border-gray-700">
            {/* Server Selector */}
            <div className="p-2 border-b border-gray-700">
              <button
                onClick={() => setShowServerList(!showServerList)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                <div className="flex items-center gap-2">
                  {selectedServer?.icon && <span>{selectedServer.icon}</span>}
                  <span className="font-medium truncate">
                    {selectedServer?.name || 'Pilih Server'}
                  </span>
                </div>
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${showServerList ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Server List Dropdown */}
              {showServerList && (
                <div className="mt-2 space-y-1">
                  {servers.map(server => (
                    <button
                      key={server.id}
                      onClick={() => selectServer(server)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${
                        selectedServer?.id === server.id
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      <span>{server.icon || server.name.charAt(0)}</span>
                      <span className="truncate">{server.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Channels */}
            {selectedServer && !showServerList && (
              <div className="flex-1 overflow-y-auto py-2">
                {selectedServer.uncategorized_channels?.map(channel => (
                  <ChannelButton
                    key={channel.id}
                    channel={channel}
                    isSelected={selectedChannel?.id === channel.id}
                    unreadCount={unreadCounts[channel.id] || 0}
                    onClick={() => selectChannel(channel)}
                  />
                ))}

                {selectedServer.categories?.map(category => (
                  <div key={category.id} className="mt-2">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="flex items-center w-full px-2 py-1 text-xs font-semibold text-gray-400 hover:text-gray-200 uppercase"
                    >
                      {collapsedCategories.includes(category.id) ? (
                        <ChevronRightIcon className="h-3 w-3 mr-1" />
                      ) : (
                        <ChevronDownIcon className="h-3 w-3 mr-1" />
                      )}
                      {category.name}
                    </button>
                    
                    {!collapsedCategories.includes(category.id) && (
                      <div className="space-y-0.5">
                        {category.channels.map(channel => (
                          <ChannelButton
                            key={channel.id}
                            channel={channel}
                            isSelected={selectedChannel?.id === channel.id}
                            unreadCount={unreadCounts[channel.id] || 0}
                            onClick={() => selectChannel(channel)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-gray-700">
            {selectedChannel ? (
              <>
                {/* Channel Header */}
                <div className="h-10 px-4 flex items-center border-b border-gray-600">
                  <HashtagIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium text-sm">{selectedChannel.name}</span>
                  {selectedChannel.topic && (
                    <span className="text-xs text-gray-400 ml-3 truncate">
                      {selectedChannel.topic}
                    </span>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                  {messages.map((message, idx) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.user_id === currentUserId}
                      showAvatar={idx === 0 || messages[idx - 1]?.user_id !== message.user_id}
                      onReply={() => setReplyTo(message)}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Preview */}
                {replyTo && (
                  <div className="px-3 py-1.5 bg-gray-800 border-t border-gray-600 flex items-center text-sm">
                    <ArrowUturnLeftIcon className="h-3 w-3 text-gray-400 mr-2" />
                    <span className="text-gray-400">Membalas </span>
                    <span className="text-blue-400 ml-1">{replyTo.user?.full_name}</span>
                    <button onClick={() => setReplyTo(null)} className="ml-auto text-gray-400 hover:text-white">
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Input */}
                <div className="p-3">
                  <div className="bg-gray-600 rounded-lg flex items-center">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={`Kirim pesan ke #${selectedChannel.name}`}
                      className="flex-1 bg-transparent text-white placeholder-gray-400 py-2 px-3 text-sm focus:outline-none"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim()}
                      className={`p-2 ${messageInput.trim() ? 'text-blue-500 hover:text-blue-400' : 'text-gray-500'}`}
                    >
                      <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <HashtagSolid className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Pilih channel untuk mulai chat</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(popupContent, document.body);
};

// Channel Button Component
const ChannelButton: React.FC<{
  channel: Channel;
  isSelected: boolean;
  unreadCount: number;
  onClick: () => void;
}> = ({ channel, isSelected, unreadCount, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-2 py-1 mx-2 rounded text-sm ${
      isSelected
        ? 'bg-gray-600 text-white'
        : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
    }`}
    style={{ width: 'calc(100% - 16px)' }}
  >
    {channel.is_private ? (
      <LockClosedIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
    ) : (
      <HashtagIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
    )}
    <span className={`truncate ${unreadCount > 0 ? 'font-semibold text-white' : ''}`}>
      {channel.name}
    </span>
    {unreadCount > 0 && (
      <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
        {unreadCount}
      </span>
    )}
  </button>
);

// Message Bubble Component
const MessageBubble: React.FC<{
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onReply: () => void;
}> = ({ message, isOwn, showAvatar, onReply }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`group flex gap-2 hover:bg-gray-800/30 rounded px-2 py-1 ${showAvatar ? 'mt-2' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="w-8 flex-shrink-0">
        {showAvatar && (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-medium">
            {message.user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {showAvatar && (
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-sm text-white">{message.user?.full_name}</span>
            <span className="text-xs text-gray-500">
              {format(new Date(message.created_at), 'HH:mm')}
            </span>
          </div>
        )}
        {message.reply_to && (
          <div className="flex items-center text-xs text-gray-400 mb-0.5">
            <ArrowUturnLeftIcon className="h-3 w-3 mr-1" />
            <span className="text-blue-400">{message.reply_to.user?.full_name}:</span>
            <span className="ml-1 truncate">{message.reply_to.content}</span>
          </div>
        )}
        <p className={`text-sm text-gray-200 break-words ${message.is_deleted ? 'italic text-gray-500' : ''}`}>
          {message.content}
          {message.is_edited && <span className="text-xs text-gray-500 ml-1">(diedit)</span>}
        </p>
      </div>
      {showActions && !message.is_deleted && (
        <button
          onClick={onReply}
          className="p-1 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100"
          title="Reply"
        >
          <ArrowUturnLeftIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default ChatPopup;
