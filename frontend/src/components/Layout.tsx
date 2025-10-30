// src/components/Layout.tsx
import React, { useEffect } from 'react';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Group, Users2 } from 'lucide-react';
import { BiChat } from 'react-icons/bi';

const Layout: React.FC = () => {

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-base-100">
      {/* Sidebar */}
      <div className="w-64 bg-base-200 text-base-content flex flex-col">
        <div className="p-4 border-b border-base-300">
          <h1 className="text-2xl font-bold">Real-Time Chat</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <ul className="menu menu-vertical gap-1">
            <li>
              <Link to="/dashboard/chat-list">
                <BiChat />
                Chats
              </Link>
            </li>
            <li>
              <Link to="/dashboard/online-users">
                <Users2 />
                Online Users
              </Link>
            </li>

            <li>
              <Link to="/dashboard/groups">
                <Group />
                Groups
              </Link>
            </li>
          </ul>
        </div>

        <div className="p-4 border-t border-base-300">
          <div className="flex items-center mb-4">
            <div className="avatar placeholder mr-3">
              <div className="bg-neutral-focus text-neutral-content rounded-full w-10 h-10">
                <span className="text-lg">{user?.username.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <div className="truncate">
              <p className="font-medium truncate">{user?.username}</p>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            className="btn btn-outline btn-error btn-sm w-full"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;