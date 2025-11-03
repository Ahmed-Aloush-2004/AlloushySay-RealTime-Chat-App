import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import GoogleAuthButton from './GoogleAuthButton';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

interface FormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);

  const { login } = useAuthStore();
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
    setLoading(true);

    try {
      await login({
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




const handleGoogleLogin = async () => {
    setGoogleLoading(true); 
    window.location.href = 'http://localhost:3000/auth/google';
  };

  
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue"
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkTo="/signup"
    >
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