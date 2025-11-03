// components/GroupHeader.tsx
import React from 'react';
import { Crown } from 'lucide-react';


interface GroupHeaderProps {
  currentGroup: any;
  isMember: boolean;
  isAdmin: boolean;
  onlineUsersCount: number;
  isLeaving: boolean;
  isJoining: boolean;
  onLeaveGroup: () => void;
  onJoinGroup: () => void;
}

export const GroupHeader: React.FC<GroupHeaderProps> = ({
  currentGroup,
  isMember,
  isAdmin,
  onlineUsersCount,
  isLeaving,
  isJoining,
  onLeaveGroup,
  onJoinGroup
}) => {
  return (
    <div className="bg-base-100 border-b border-base-300 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="avatar placeholder mr-3">
            <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl">
              {currentGroup.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              {currentGroup.name}
              {isAdmin && <Crown className="w-4 h-4 text-yellow-500" />}
            </h2>
            <p className="text-sm text-base-content/70">
              {currentGroup.members?.length || 0} members, {onlineUsersCount} online
            </p>
          </div>
        </div>

        {isMember ? (
          <button
            onClick={onLeaveGroup}
            className="btn text-white bg-red-500 hover:bg-red-600"
            disabled={isLeaving}
          >
            {isLeaving ? "Leaving..." : "Leave"}
          </button>
        ) : (
          <button
            onClick={onJoinGroup}
            className="btn text-white bg-green-500 hover:bg-green-600"
            disabled={isJoining}
          >
            {isJoining ? "Joining..." : "Join"}
          </button>
        )}
      </div>
    </div>
  );
};