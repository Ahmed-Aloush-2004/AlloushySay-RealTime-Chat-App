// MessageItem.tsx
import React from 'react';
import { Check, Download, Paperclip } from 'lucide-react';

import { CustomAudioPlayer } from './CustomAudioPlayer';
import type { User } from '../common/interfaces/user';
import type { Message } from '../common/interfaces/message';

interface MessageItemProps {
  msg: Message;
  currentUserId: string | undefined;
  openImageModal: (src: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ msg, currentUserId, openImageModal }) => {
  const senderId = (msg.sender as User)?._id || (msg.sender as string);
  const senderUsername = (msg.sender as User)?.username || 'Unknown User';
  const isCurrentUser = senderId === currentUserId;

  return (
    <div className={`chat ${isCurrentUser ? 'chat-end' : 'chat-start'} animate-fade-in`}>
      <div className="chat-image avatar">
        <div className="w-10 rounded-full bg-base-300 flex items-center justify-center text-lg font-bold">
          {senderUsername.charAt(0).toUpperCase()}
        </div>
      </div>
      <div className="chat-header text-xs text-base-content/50 mb-1">
        {isCurrentUser ? 'You' : senderUsername}
        <time className="ml-1">
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </time>
      </div>

      <div className={`chat-bubble ${isCurrentUser ? 'chat-bubble-primary' : 'bg-base-100 text-base-content'} max-w-xs md:max-w-md lg:max-w-lg shadow-md`}>
        {msg.messageType === 'image' && (
          <div className="relative group cursor-pointer" onClick={() => openImageModal(msg.content)}>
            <img
              src={msg.content}
              alt="Chat Image"
              className="rounded-lg max-w-full h-auto max-h-64 object-cover transition-transform hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {msg.messageType === 'video' && (
          <video
            src={msg.content}
            controls
            className="rounded-lg max-w-full max-h-64"
          />
        )}

        {msg.messageType === 'audio' && (
          <CustomAudioPlayer src={msg.content} isCurrentUser={isCurrentUser} />
        )}

        {msg.messageType === 'raw' && (
          <div className="flex items-center gap-2 p-2">
            <div className="bg-base-300 rounded-lg p-2">
              <Paperclip className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{'File Attachment'}</p>
              <p className="text-xs opacity-70">Click to download</p>
            </div>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = msg.content;
                link.download = 'file';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}

        {msg.messageType === 'text' && (
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        )}
      </div>

      {isCurrentUser && (
        <div className="chat-footer text-xs text-base-content/50 mt-1">
          <Check className="w-3 h-3 inline-block mr-1" /> Delivered
        </div>
      )}
    </div>
  );
};

export default MessageItem;