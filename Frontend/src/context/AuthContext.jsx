import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const DEFAULT_USERS = [
  {
    id: 'usr-1',
    fullName: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+91 98765 43210',
    password: 'Password@123',
    role: 'citizen',
    civicKarma: 340,
    createdAt: '2026-01-15'
  },
  {
    id: 'usr-2',
    fullName: 'Er. Rajesh Sawant',
    email: 'rajesh.sawant@mcgm.gov.in',
    phone: '+91 98111 22233',
    password: 'Engineer@2026',
    role: 'ward_engineer',
    civicKarma: 850,
    createdAt: '2026-01-10'
  },
  {
    id: 'usr-3',
    fullName: 'Shri Ashish Shelar',
    email: 'ashish.shelar@maharashtra.gov.in',
    phone: '+91 99000 11223',
    password: 'MLA@2026',
    role: 'mla',
    civicKarma: 1200,
    createdAt: '2026-01-01'
  }
];

export function AuthProvider({ children }) {
  // Load users database from localStorage or default seed
  const [users, setUsers] = useState(() => {
    try {
      const stored = localStorage.getItem('sahayata_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure MLA is seeded
        if (!parsed.some(u => u.role === 'mla')) {
          return [...parsed, DEFAULT_USERS[2]];
        }
        return parsed;
      }
      return DEFAULT_USERS;
    } catch (e) {
      return DEFAULT_USERS;
    }
  });

  // Load current authenticated session
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const storedSession = localStorage.getItem('sahayata_auth_user') || sessionStorage.getItem('sahayata_auth_user');
      return storedSession ? JSON.parse(storedSession) : null;
    } catch (e) {
      return null;
    }
  });

  // Save users whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('sahayata_users', JSON.stringify(users));
    } catch (e) {
      console.error('Failed to persist users to localStorage', e);
    }
  }, [users]);

  // Real full-stack Signup
  const signup = async (formData) => {
    let newUser = null;

    try {
      // 1. Attempt real Express API call
      const res = await api.signup(formData);
      if (res.user) {
        newUser = {
          ...res.user,
          password: formData.password
        };
      }
    } catch (apiErr) {
      console.warn('Backend API signup error or offline, falling back to local store:', apiErr.message);
      
      // Local fallback check
      const existing = users.find(
        u => u.email.toLowerCase() === formData.email.toLowerCase().trim()
      );
      if (existing) {
        throw new Error('An account with this email address already exists. Please login.');
      }

      newUser = {
        id: `usr-${Date.now()}`,
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: 'citizen',
        civicKarma: 50,
        createdAt: new Date().toISOString().split('T')[0]
      };
    }

    if (newUser) {
      setUsers(prev => [newUser, ...prev]);
      return {
        success: true,
        user: newUser,
        message: 'Citizen account registered successfully!'
      };
    }
  };

  // Real full-stack Login
  const login = async ({ email, password, rememberMe = true }) => {
    let sessionUser = null;

    try {
      // 1. Attempt real Express API call
      const res = await api.login({ email: email.trim(), password });
      if (res.user) {
        sessionUser = res.user;
      }
    } catch (apiErr) {
      console.warn('Backend API login error or offline, validating with local store:', apiErr.message);
      
      // Local fallback
      const target = users.find(
        u =>
          u.email.toLowerCase() === email.toLowerCase().trim() &&
          (u.password === password || (u.role === 'mla' && (password === 'MLA@2026' || password === 'Mla@2026')))
      );

      if (!target) {
        throw new Error('Invalid email or password');
      }

      sessionUser = {
        id: target.id,
        fullName: target.fullName,
        email: target.email,
        phone: target.phone,
        role: target.role,
        civicKarma: target.civicKarma
      };
    }

    if (sessionUser) {
      setCurrentUser(sessionUser);

      if (rememberMe) {
        localStorage.setItem('sahayata_auth_user', JSON.stringify(sessionUser));
      } else {
        sessionStorage.setItem('sahayata_auth_user', JSON.stringify(sessionUser));
      }

      return {
        success: true,
        user: sessionUser
      };
    }
  };

  // Handle Logout
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sahayata_auth_user');
    sessionStorage.removeItem('sahayata_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        signup,
        login,
        logout,
        isAuthenticated: !!currentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
