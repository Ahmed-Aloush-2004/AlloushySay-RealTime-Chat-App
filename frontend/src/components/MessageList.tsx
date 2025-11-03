// MessageList.tsx
import React from 'react';
import type { Message } from '../common/interfaces/message';
import TypingIndicator from './TypeIndicator';
import MessageItem from './MessageItem';


interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  userId: string | undefined;
  isReceiverTyping: boolean;
  isMember?: boolean | null;
  selectedUser: { username: string };
  currentUserId: string | undefined;
  openImageModal: (src: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  isReceiverTyping,
  selectedUser,
  currentUserId,
  openImageModal,
  messagesEndRef
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-base-200 to-base-300">
      {isLoading && (
        <div className="flex justify-center items-center h-full">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}

      {!isLoading && messages?.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="text-6xl mb-4">👋</div>
          <h3 className="text-xl font-semibold mb-2">Start your conversation!</h3>
          <p className="text-base-content/70">Send a message to {selectedUser?.username}</p>
        </div>
      )}

      {messages?.map((msg) => (
        <MessageItem
          key={msg._id}
          msg={msg}
          currentUserId={currentUserId}
          openImageModal={openImageModal}
        />
      ))}

      {isReceiverTyping && <TypingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;