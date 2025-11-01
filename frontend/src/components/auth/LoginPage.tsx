import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import GoogleAuthButton from './GoogleAuthButton';
import { useAuthStore } from '../../stores/authStore';


interface FormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);

  const { login,signupOrLoginByGoogle } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({
        email: formData.email,
        password: formData.password
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };




const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true); // Setting loading here is optional since it's a hard redirect

    // 🚀 Simpler logic: Just redirect the browser to the backend endpoint.
    // The backend will handle the rest of the flow (Google login -> redirect back to frontend).
    window.location.href = 'http://localhost:3000/auth/google';

    // IMPORTANT: Remove the placeholder error and the redundant signupOrLoginByGoogle call
    // The state update happens on the /auth/google/success page (Step 3).

    // setGoogleLoading(false); // This line will never execute because of the hard redirect
  };

  
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue"
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkTo="/signup"
    >
      {error && (
        <div className="alert alert-error shadow-lg mb-4">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text text-base-content font-medium">Email</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input input-bordered w-full focus:input-primary"
            required
            placeholder="Enter your email"
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text text-base-content font-medium">Password</span>
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="input input-bordered w-full focus:input-primary"
            required
            placeholder="Enter your password"
            minLength={6}
          />
          <label className="label">
            <a href="#" className="label-text-alt link link-primary">Forgot password?</a>
          </label>
        </div>

        <div className="form-control mt-6">
          <button
            type="submit"
            className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            Sign In
          </button>
        </div>
      </form>

      <GoogleAuthButton
        type="login"
        onClick={handleGoogleLogin}
        loading={googleLoading}
      />
    </AuthLayout>
  );
};

export default LoginPage;