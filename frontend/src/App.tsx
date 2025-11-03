import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Layout from "./components/Layout.tsx";
import OnlineUsersPage from "./pages/OnlineUsersPage.tsx";
import ChatPage from "./components/chat/ChatPage.tsx";
import React, { type ReactNode, useEffect, useState } from "react";
import { useAuthStore } from "./stores/authStore.ts";
import ChatListPage from "./components/chat/ChatListPage.tsx";
import LoginPage from "./components/auth/LoginPage.tsx";
import GroupListPage from "./components/group/GroupListPage.tsx";
import SignupPage from "./components/auth/SignupPage.tsx";
import { Toaster } from "react-hot-toast";
import GroupChat from "./components/group/GroupChat.tsx";
import GoogleAuthCallbackPage from "./components/auth/GoogleAuthCallbackPage.tsx";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="loading loading-spinner loading-lg"></div>
    </div>;
  }

  return (isAuthenticated && accessToken && refreshToken) ? children : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/google/success" element={<GoogleAuthCallbackPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<ChatListPage />} />
        <Route path="chat-list" element={<ChatListPage />} />
        <Route path="groups" element={<GroupListPage />} />
        <Route path="online-users" element={<OnlineUsersPage />} />
        <Route path="chat/:id" element={<ChatPage />} />
        <Route path="group/:id" element={<GroupChat />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

function App() {
  const {checkAuthStatus} = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuthStatus();
      setIsInitialized(true);
    };

    initializeAuth();
  }, [checkAuthStatus]);

  if (!isInitialized) {
    return <div className="flex justify-center items-center h-screen">
      <div className="loading loading-spinner loading-lg"></div>
    </div>;
  }

  return (
    <>
      <Router>
        <AppRoutes />
      </Router>
      <Toaster
        position="top-right"
      />
    </>
  );
}

export default App;




// // src/App.tsx
// import React from 'react';
// import VideoCall from './pages/VideoCall';

// function App() {
//   return (
//     <div className="App">
//       <VideoCall />
//     </div>
//   );
// }

// export default App;