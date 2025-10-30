// src/components/GroupList.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupStore } from '../../stores/groupStore';
import { useAuthStore } from '../../stores/authStore';
import { Plus, Users, Settings } from 'lucide-react';

const GroupList: React.FC = () => {
  const { user } = useAuthStore();
  const { groups, fetchGroups, isLoading, createGroup } = useGroupStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGroups, setFilteredGroups] = useState(groups);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  useEffect(() => {
    const getAllGroups = async () => {
      await fetchGroups();
    };
      getAllGroups();
  }, [ fetchGroups]);

  useEffect(() => {
    if (groups) {
      const filtered = groups.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [groups, searchTerm]);

  const handleGroupClick = (groupId: string) => {
    console.log('this is the groupId : ',groupId);
    
    navigate(`/dashboard/group/${groupId}`);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    
    try {
      const newGroup = await createGroup({
        name: groupName,
        description: groupDescription,
        adminId: user?._id || ''
      });
      
      // Reset form and close modal
      setGroupName('');
      setGroupDescription('');
      setShowCreateModal(false);
      
      // Navigate to the new group
      navigate(`/dashboard/group/${newGroup._id}`);
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const formatLastMessage = (group: any) => {
    if (!group.lastMessage) return 'No messages yet';
    
    const message = group.lastMessage;
    const sender = message.sender as any;
    
    return `${sender?.username || 'Someone'}: ${message.content}`;
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

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Groups</h2>
          <button 
            className="btn btn-primary btn-sm btn-circle"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="form-control">
          <input 
            type="text" 
            placeholder="Search groups..." 
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
        ) : filteredGroups && filteredGroups.length > 0 ? (
          <div className="divide-y divide-base-300">
            {filteredGroups.map((group) => (
              <div 
                key={group._id} 
                className="p-4 hover:bg-base-200 cursor-pointer transition-colors duration-200"
                onClick={() => handleGroupClick(group._id)}
              >
                <div className="flex items-center">
                  <div className="avatar placeholder mr-4">
                    <div className="bg-secondary text-secondary-content rounded-full w-12 h-12 flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-lg truncate">{group.name}</h3>
                      <span className="text-xs text-base-content/50">
                        {group.messages[group.messages.length - 1] && formatTime(group.messages[group.messages.length - 1].createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-base-content/70 truncate">
                        {formatLastMessage(group)}
                      </p>
                      {group.unreadCount > 0 && (
                        <div className="badge badge-primary badge-sm ml-2">
                          {group.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            {searchTerm ? (
              <>
                <h3 className="text-xl font-semibold mb-2">No groups found</h3>
                <p className="text-base-content/70">Try adjusting your search</p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-2">No groups yet</h3>
                <p className="text-base-content/70 mb-4">Create your first group to start chatting!</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Group
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New Group</h3>
            <form onSubmit={handleCreateGroup}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Group Name</span>
                </label>
                <input 
                  type="text" 
                  placeholder="Enter group name" 
                  className="input input-bordered w-full" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Description (Optional)</span>
                </label>
                <textarea 
                  className="textarea textarea-bordered w-full" 
                  placeholder="Enter group description"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                ></textarea>
              </div>
              <div className="modal-action">
                <button 
                  type="button" 
                  className="btn btn-ghost"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupList;