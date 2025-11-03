// components/MessageList.tsx
import React from 'react';
import GroupTypingIndicator from './GroupTypingIndicator';
import type { Message } from '../../common/interfaces/message';
import { MessageComponent } from '../MessageComponent';

interface MessageListProps {
  messages: Message[];
  // ADD THIS LINE
  isMember: boolean | null | undefined;
  isAdmin: boolean;
  userId: string | undefined;
  onImageClick: (src: string) => void;
  onReplyClick: (msg: Message) => void;
  onMarkAsRead: (messageId: string) => void;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  handleScroll: () => void;
  groupId: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isMember,
  isAdmin,
  userId,
  onImageClick,
  onReplyClick,
  onMarkAsRead,
  messagesContainerRef,
  messagesEndRef,
  handleScroll,
  groupId
}) => {
  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-2 bg-gradient-to-b from-base-200 to-base-300"
      onScroll={handleScroll}
    >
      {(isMember || isAdmin) && messages && messages.length > 0 ? (
        messages.map((msg, index) => (
          <MessageComponent
            key={`${msg._id}-${index}`}
            msg={msg}
            isCurrentUser={msg.sender === userId}
            onImageClick={onImageClick}
            onReplyClick={onReplyClick}
            onMarkAsRead={onMarkAsRead}
          />
        ))
      ) : isMember ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold">No messages yet</h3>
          <p className="text-gray-500">Be the first one to send a message!</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold">Join this group</h3>
          <p className="text-gray-500">Join this group to be able to see and receive messages!</p>
        </div>
      )}

      <GroupTypingIndicator groupId={groupId} />
      <div ref={messagesEndRef} />
    </div>
  );
};