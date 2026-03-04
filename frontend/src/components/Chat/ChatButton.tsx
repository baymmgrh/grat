import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import axiosInstance from '../../utils/axiosConfig';
import ChatPopup from './ChatPopup';

const ChatButton: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await axiosInstance.get('/api/chat/unread');
      const total = response.data.unread?.reduce((sum: number, u: any) => sum + u.unread_count, 0) || 0;
      setTotalUnread(total);
    } catch (error) {
      // Silently fail
    }
  };

  const handleOpenFullPage = () => {
    setIsOpen(false);
    navigate('/app/chat');
  };

  return (
    <>
      {/* Floating Button - positioned above AI Assistant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 right-6 z-[9998] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 ${
          isOpen ? 'bg-gray-700' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
        title="Group Chat"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
        {totalUnread > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Chat Popup */}
      <ChatPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onOpenFullPage={handleOpenFullPage}
      />
    </>
  );
};

export default ChatButton;
