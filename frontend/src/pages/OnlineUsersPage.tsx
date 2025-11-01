// src/components/OnlineUsersPage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}

const OnlineUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, onlineUsers, fetchOnlineUser } = useAuthStore();

  useEffect(() => {
    // Fetch online users
    const fetchOnlineUsers = async () => {
      await fetchOnlineUser()
    };

    if (user) {
      fetchOnlineUsers();
    }
  }, [user]);

  const handleUserSelect = (selectedUser: User) => {
    // Navigate to chat page with the selected user
    navigate(`/dashboard/chat/${selectedUser._id}`, { state: { user: selectedUser } });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Online Users</h2>
      {onlineUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {onlineUsers.map(onlineUser => (
            <div
              key={onlineUser._id}
              className="card card-compact bg-base-100 shadow-xl cursor-pointer hover:bg-base-200 transition-all"
              onClick={() => handleUserSelect(onlineUser)}
            >
              <div className="card-body">
                <div className="flex items-center">
                  <div className="avatar placeholder mr-4">
                    <div className="bg-neutral-focus text-neutral-content rounded-full w-12 h-12">
                      <span className="text-xl">{onlineUser.username.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="card-title text-lg">{onlineUser.username}</h3>
                    <p className="text-sm text-gray-500">Click to start chat</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-2xl font-semibold mb-2">No Online Users</h3>
          <p className="text-gray-500">There are currently no other users online. Check back later!</p>
        </div>
      )}
    </div>
  );
};

export default OnlineUsersPage;