import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useChatStore } from '../../stores';
import type { Chat } from '../../common/interfaces/chat';
import type { User } from '../../common/interfaces/user';

const ChatList: React.FC = () => {
  const { user,getAccessToken } = useAuthStore();
  const { chats, getMyChats, isLoading } = useChatStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);

  useEffect(() => {
    const fetchMyChats = async () => {
      await getMyChats();
    };
    if (user) {      
      fetchMyChats();
    }
  }, [user, getMyChats]);

  // Fix the filtering logic
  useEffect(() => {

    if (chats && chats.length > 0) {
      const filtered = chats.filter(chat => {                
        // Get the other user in the chat (not the current user)
        const otherUser = typeof chat.sender === 'object' && chat.sender._id !== user?._id 
          ? chat.sender 
          : typeof chat.reciver === 'object' ? chat.reciver : null;
        
        return otherUser && 
          (otherUser as User).username.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredChats(filtered);
    } else {
      setFilteredChats([]);
    }
  }, [chats, user, searchTerm]);

  const handleChatClick = (chat: Chat) => {
    // Get the other user in the chat
    const otherUser = typeof chat.sender === 'object' && chat.sender._id !== user?._id 
      ? chat.sender 
      : typeof chat.reciver === 'object' ? chat.reciver : null;
    
    if (otherUser) {
      navigate(`/dashboard/chat/${(otherUser as User)._id}`, { state: { user: otherUser, chatId: chat._id } });
    }
  };

  const formatLastMessage = (chat: Chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    
    const message = chat.lastMessage;
    const isFromMe = message.sender === user?._id || 
      (typeof message.sender === 'object' && message.sender._id === user?._id);
    
    return isFromMe ? `You: ${message.content}` : message.content;
  };

  const formatTime = (date: Date | string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Helper function to get the other user in a chat
  const getOtherUser = (chat: Chat): User | null => {
    if (typeof chat.sender === 'object' && chat.sender._id !== user?._id) {
      return chat.sender as User;
    }
    if (typeof chat.reciver === 'object' && chat.reciver._id !== user?._id) {
      return chat.reciver as User;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-base-300">
        <div className="form-control">
          <input 
            type="text" 
            placeholder="Search chats..." 
            className="input input-bordered w-full" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : filteredChats && filteredChats.length > 0 ? (
          <div className="divide-y divide-base-300">
            {filteredChats.map((chat) => {
              // Get the other user in the chat
              const otherUser = getOtherUser(chat);
              
              if (!otherUser) return null;
              
              return (
                <div 
                  key={chat._id} 
                  className="p-4 hover:bg-base-200 cursor-pointer transition-colors duration-200"
                  onClick={() => handleChatClick(chat)}
                >
                  <div className="flex items-center">
                    <div className="avatar placeholder mr-4">
                      <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center relative">
                        <span className="text-xl">{otherUser.username.charAt(0).toUpperCase()}</span>
                        {otherUser.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-100"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-semibold text-lg truncate">{otherUser.username}</h3>
                        <span className="text-xs text-base-content/50">
                          {chat.messages[chat.messages.length - 1] && formatTime(chat.messages[chat.messages.length - 1] && chat.messages[chat.messages.length - 1]?.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-base-content/70 truncate">
                          {formatLastMessage(chat)}
                        </p>
                        {chat?.unreadCount && chat?.unreadCount > 0 && (
                          <div className="badge badge-primary badge-sm ml-2">
                            {chat?.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            {searchTerm ? (
              <>
                <h3 className="text-xl font-semibold mb-2">No chats found</h3>
                <p className="text-base-content/70">Try adjusting your search</p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-2">No chats yet</h3>
                <p className="text-base-content/70">Start a conversation with someone!</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;