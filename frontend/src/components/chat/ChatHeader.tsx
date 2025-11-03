// ChatHeader.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';
import type { User } from '../../common/interfaces/user';

interface ChatHeaderProps {
  selectedUser: User;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ selectedUser }) => {
  return (
    <div className="navbar bg-base-100 border-b border-base-300 shadow-sm px-4 py-3">
      <div className="flex-1 flex items-center">
        <div className="avatar placeholder mr-3">
          <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl">
            {(selectedUser?.username || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold">{selectedUser?.username || 'Unknown User'}</h2>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-success rounded-full mr-1"></div>
            <p className="text-xs text-success">Online</p>
          </div>
        </div>
      </div>
      <div className="flex-none">
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
            <MoreVertical className="w-5 h-5" />
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><button>View Profile</button></li>
            <li><button>Search in Conversation</button></li>
            <li><button>Mute Notifications</button></li>
            <li><button>Clear History</button></li>
            <li><button className="text-error">Block User</button></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;