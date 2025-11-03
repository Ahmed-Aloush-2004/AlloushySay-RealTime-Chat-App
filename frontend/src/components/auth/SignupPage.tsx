// src/components/auth/SignupPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import AuthLayout from './AuthLayout';
import GoogleAuthButton from './GoogleAuthButton';
import toast from 'react-hot-toast';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);

  const { signup } = useAuthStore();
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

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await signup({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.error('Google authentication is not fully implemented yet. Please use email/password.');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during Google authentication');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Sign up to get started with our service"
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkTo="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text text-base-content font-medium">Username</span>
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="input input-bordered w-full focus:input-primary"
            required
            placeholder="Choose a username"
          />
        </div>

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
            placeholder="Create a password"
            minLength={6}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text text-base-content font-medium">Confirm Password</span>
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input input-bordered w-full focus:input-primary"
            required
            placeholder="Confirm your password"
            minLength={6}
          />
        </div>

        <div className="form-control mt-6">
          <button
            type="submit"
            className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            Sign Up
          </button>
        </div>
      </form>

      <GoogleAuthButton 
        type="signup" 
        onClick={handleGoogleSignup} 
        loading={googleLoading} 
      />
    </AuthLayout>
  );
};

export default SignupPage;