// src/components/Dashboard.tsx
import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.ts';
import { useSocketStore } from '../stores/socketStore.ts';
// import { initializeSocket } from '../services/socket.ts';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuthStore();
  const { socket, initializeSocket } = useSocketStore();
  console.log('this is the user : ', user);


  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [navigate, isAuthenticated])

  useEffect(() => {

    if (!loading && isAuthenticated && user?._id && !socket) {

      // ONLY initialize the socket when a user is logged in
      const chatSocket = initializeSocket(user._id.toString());
      // You can now listen for events or join a room
      if (chatSocket) {
        chatSocket.on('connect', () => {
          console.log('Socket Connected:', chatSocket.id);
        });
        // ... setup other listeners
      }
    }


  }, [user, isAuthenticated, loading, initializeSocket]); // Dependencies ensure this runs when state changes


  // Redirect to the chat list page by default
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard/chat-list');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="loading loading-spinner loading-lg"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Outlet />;
};

export default Dashboard;