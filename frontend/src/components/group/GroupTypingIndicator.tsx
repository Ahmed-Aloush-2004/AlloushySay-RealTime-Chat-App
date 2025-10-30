// // src/components/GroupTypingIndicator.tsx
import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useGroupStore } from '../../stores/groupStore';

const GroupTypingIndicator: React.FC<{ groupId: string }> = ({ groupId }) => {
  const { typingUsers,currentGroup } = useGroupStore();
  const { user } = useAuthStore();
  
  // Get the typing users for this specific group
  const groupTypingUsers = typingUsers[groupId] || new Set();
  
  // Convert Set to array and filter out the current user
  const otherTypingUsers = Array.from(groupTypingUsers).filter(userId => userId !== user?._id);

  if (otherTypingUsers.length === 0) return null;

  const username = currentGroup?.members.find(member => member._id.toString() === otherTypingUsers[0])?.username;

  return (
    <div className="flex items-center px-4 py-2 text-sm text-gray-500">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="ml-2">
        {otherTypingUsers.length === 1 
          ? `${username} is typing...`
          : `${otherTypingUsers.length} people are typing...`
        }
      </span>
    </div>
  );  
};

export default GroupTypingIndicator;