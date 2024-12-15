import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../types';
import { verifyToken } from '../utils/token';

interface AuthState {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  suspendUser: (userId: string) => void;
  activateUserAccount: (userId: string) => void;
  resetUserPassword: (userId: string, newPassword: string) => Promise<void>;
  activateUser: (token: string, password: string) => Promise<void>;
  getAllowedVendorNumbers: (user: User | null) => string[];
  initializeTestAccounts: () => Promise<void>;
  isEmailUnique: (email: string, excludeId?: string) => boolean;
}

export const hasRole = (user: User | null, roles: UserRole[]): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      users: [],
      isAuthenticated: false,

      isEmailUnique: (email: string, excludeId?: string): boolean => {
        const { users } = get();
        return !users.some(u => 
          u.email.toLowerCase() === email.toLowerCase() && 
          (!excludeId || u.id !== excludeId)
        );
      },

      login: async (email: string, password: string) => {
        const { users } = get();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        if (user.isSuspended) {
          throw new Error('Account suspended. Please contact administrator.');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        set({ 
          user: { ...user, lastLogin: new Date() }, 
          isAuthenticated: true 
        });
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      addUser: (user: User) => {
        const { isEmailUnique } = get();
        if (!isEmailUnique(user.email)) {
          throw new Error('Email already exists');
        }
        set(state => ({
          users: [...state.users, user]
        }));
      },

      updateUser: (updatedUser: User) => {
        const { isEmailUnique } = get();
        // Check email uniqueness only if email is being changed
        if (updatedUser.email !== get().users.find(u => u.id === updatedUser.id)?.email &&
            !isEmailUnique(updatedUser.email, updatedUser.id)) {
          throw new Error('Email already exists');
        }
        set(state => ({
          users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u),
          user: state.user?.id === updatedUser.id ? updatedUser : state.user
        }));
      },

      deleteUser: (userId: string) => set(state => {
        // Don't allow deleting the last admin
        const remainingAdmins = state.users.filter(u => 
          u.role === 'admin' && u.id !== userId
        ).length;
        
        if (remainingAdmins === 0) {
          throw new Error('Cannot delete the last admin account');
        }

        return {
          users: state.users.filter(u => u.id !== userId),
          // If the deleted user is the current user, log them out
          user: state.user?.id === userId ? null : state.user,
          isAuthenticated: state.user?.id === userId ? false : state.isAuthenticated
        };
      }),

      suspendUser: (userId: string) => set(state => ({
        users: state.users.map(u => 
          u.id === userId 
            ? { ...u, isSuspended: true }
            : u
        )
      })),

      activateUserAccount: (userId: string) => set(state => ({
        users: state.users.map(u => 
          u.id === userId 
            ? { ...u, isSuspended: false }
            : u
        )
      })),

      resetUserPassword: async (userId: string, newPassword: string) => {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        set(state => ({
          users: state.users.map(u => 
            u.id === userId 
              ? { ...u, password: hashedPassword }
              : u
          )
        }));
      },

      activateUser: async (token: string, password: string) => {
        const decoded = verifyToken(token);
        if (!decoded) {
          throw new Error('Invalid or expired token');
        }

        const { users } = get();
        const user = users.find(u => u.email === decoded.email);
        
        if (!user) {
          throw new Error('User not found');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const updatedUser = {
          ...user,
          password: hashedPassword,
          isActive: true,
          invitationToken: null
        };

        set(state => ({
          users: state.users.map(u => u.id === user.id ? updatedUser : u)
        }));
      },

      getAllowedVendorNumbers: (user: User | null) => {
        if (!user) return [];
        if (user.role === 'admin' || user.role === 'staff') return ['ALL'];
        if (user.role === 'vendor') {
          if (user.vendorNumber === 'ALL') return ['ALL'];
          return user.vendorNumber ? [user.vendorNumber] : [];
        }
        return [];
      },

      initializeTestAccounts: async () => {
        const { users } = get();
        if (users.length > 0) return;

        const hashedPassword = await bcrypt.hash('7seacorp.com', 10);
        const testAccounts: User[] = [
          {
            id: crypto.randomUUID(),
            email: 'Admin@7seacorp.com',
            name: 'Admin User',
            role: 'admin',
            vendorNumber: 'ALL',
            isActive: true,
            isSuspended: false,
            password: hashedPassword,
            createdAt: new Date(),
            lastLogin: null
          },
          {
            id: crypto.randomUUID(),
            email: 'Staff@7seacorp.com',
            name: 'Staff User',
            role: 'staff',
            vendorNumber: 'ALL',
            isActive: true,
            isSuspended: false,
            password: hashedPassword,
            createdAt: new Date(),
            lastLogin: null
          },
          {
            id: crypto.randomUUID(),
            email: 'Vendor@7seacorp.com',
            name: 'Vendor User',
            role: 'vendor',
            vendorNumber: 'V001',
            isActive: true,
            isSuspended: false,
            password: hashedPassword,
            createdAt: new Date(),
            lastLogin: null
          }
        ];

        set({ users: testAccounts });
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);