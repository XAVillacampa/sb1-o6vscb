import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/auth';
import { useAlertStore } from '../store';
import bcrypt from 'bcryptjs';

interface ProfileFormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileSettingsProps {
  onClose: () => void;
}

function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const { user, updateUser } = useAuthStore();
  const { setAlert } = useAlertStore();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { register, handleSubmit, watch } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || ''
    }
  });

  const newPassword = watch('newPassword');

  const onSubmit = async (data: ProfileFormData) => {
    try {
      if (isChangingPassword) {
        if (data.newPassword !== data.confirmPassword) {
          setAlert('New passwords do not match', 'error');
          return;
        }

        if (!user?.password) {
          setAlert('Current password not found', 'error');
          return;
        }

        const isValid = await bcrypt.compare(data.currentPassword, user.password);
        if (!isValid) {
          setAlert('Current password is incorrect', 'error');
          return;
        }

        const hashedPassword = await bcrypt.hash(data.newPassword, 10);
        updateUser({
          ...user,
          password: hashedPassword
        });
      }

      // Update user name
      const updatedUser = {
        ...user!,
        name: data.name
      };

      updateUser(updatedUser);
      setAlert('Profile updated successfully', 'success');
      onClose();
    } catch (error) {
      setAlert('Failed to update profile', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
        <input
          type="text"
          {...register('name', { required: true })}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
        <input
          type="email"
          {...register('email')}
          disabled
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-gray-400 sm:text-sm"
        />
      </div>
      
      <div className="border-t pt-4">
        <button
          type="button"
          onClick={() => setIsChangingPassword(!isChangingPassword)}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 text-sm font-medium"
        >
          {isChangingPassword ? 'Cancel Password Change' : 'Change Password'}
        </button>

        {isChangingPassword && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
              <input
                type="password"
                {...register('currentPassword', { required: isChangingPassword })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
              <input
                type="password"
                {...register('newPassword', { required: isChangingPassword })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
              <input
                type="password"
                {...register('confirmPassword', {
                  required: isChangingPassword,
                  validate: value => !isChangingPassword || value === newPassword || "Passwords do not match"
                })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-md"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}

export default ProfileSettings;