import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useAlertStore } from '../store';

interface RegisterFormData {
  password: string;
  confirmPassword: string;
}

function Register() {
  const { register, handleSubmit, watch } = useForm<RegisterFormData>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activateUser } = useAuthStore();
  const { setAlert } = useAlertStore();
  const [isLoading, setIsLoading] = useState(false);

  const token = searchParams.get('token');
  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    if (!token) {
      setAlert('Invalid invitation link', 'error');
      return;
    }

    if (data.password !== data.confirmPassword) {
      setAlert('Passwords do not match', 'error');
      return;
    }

    try {
      setIsLoading(true);
      await activateUser(token, data.password);
      setAlert('Account activated successfully', 'success');
      navigate('/login');
    } catch (error) {
      setAlert('Failed to activate account', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Package className="h-12 w-12 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set up your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                {...register('password', { required: true, minLength: 6 })}
                id="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword', {
                  required: true,
                  validate: value => value === password || "Passwords do not match"
                })}
                id="confirm-password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Setting up...' : 'Set up account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;