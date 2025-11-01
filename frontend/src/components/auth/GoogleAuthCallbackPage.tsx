// GoogleAuthCallbackPage.tsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const GoogleAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signupOrLoginByGoogle } = useAuthStore();

  useEffect(() => {
    // 1. Get query parameters from the URL
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const userJson = params.get('user');    

    if (accessToken && refreshToken && userJson) {
      try {
        // 2. Decode and parse the user object
        const user = JSON.parse(decodeURIComponent(userJson));
        // console.log('this is the user from the url : ', user);

        // 3. Update the global auth store
        signupOrLoginByGoogle(user, refreshToken, accessToken)
          .then(() => {
            // 4. Redirect to dashboard on success
            navigate('/dashboard');
          })
          .catch((error) => {
            console.error('Failed to update auth store:', error);
            navigate('/login?error=GoogleAuthFailed', { replace: true });
          });

      } catch (e) {
        console.error('Error parsing user data:', e);
        navigate('/login?error=InvalidUserData', { replace: true });
      }
    } else {
      // 5. Handle missing data error
      console.error('Missing access token or user data in callback URL');
      navigate('/login?error=AuthDataMissing', { replace: true });
    }
  }, [location, navigate, signupOrLoginByGoogle]);

  // Display a loading indicator while processing the tokens
  return (
    <div className="flex justify-center items-center h-screen">
      <span className="loading loading-spinner loading-lg"></span>
      <p className="ml-4">Logging you in...</p>
    </div>
  );
};

export default GoogleAuthCallbackPage;