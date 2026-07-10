import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

const API_URL = 'http://localhost:5000/api/v1/auth';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper to construct headers with JWT token
  const getAuthHeaders = (token) => {
    const activeToken = token || localStorage.getItem('drivix_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
    };
  };

  // Helper to map backend user object for frontend compatibility (mapping _id to uid)
  const mapUser = (data) => {
    if (!data) return null;
    return {
      uid: data._id,
      ...data
    };
  };

  // Load user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('drivix_auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/profile`, {
          method: 'GET',
          headers: getAuthHeaders(token)
        });

        if (response.ok) {
          const data = await response.json();
          setUser(mapUser(data));
          setIsAuthenticated(true);
        } else {
          // If token expired or invalid, clear session
          localStorage.removeItem('drivix_auth_token');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('drivix_auth_token', data.token);
    setUser(mapUser(data));
    setIsAuthenticated(true);
    return mapUser(data);
  };

  const register = async (name, email, password, mobile, city) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, mobile, city })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    localStorage.setItem('drivix_auth_token', data.token);
    setUser(mapUser(data));
    setIsAuthenticated(true);
    return mapUser(data);
  };

  const loginWithGoogle = async (name, email) => {
    const response = await fetch(`${API_URL}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Google Login failed');
    }

    localStorage.setItem('drivix_auth_token', data.token);
    setUser(mapUser(data));
    setIsAuthenticated(true);
    return mapUser(data);
  };

  const loginWithPhone = async (mobile) => {
    const response = await fetch(`${API_URL}/phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Phone Login failed');
    }

    localStorage.setItem('drivix_auth_token', data.token);
    setUser(mapUser(data));
    setIsAuthenticated(true);
    return mapUser(data);
  };

  const logout = async () => {
    localStorage.removeItem('drivix_auth_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = async (updatedData) => {
    const token = localStorage.getItem('drivix_auth_token');
    if (!token) return;

    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(updatedData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Update failed');
    }

    // Refresh user context with updated data
    setUser(mapUser(data));
    return mapUser(data);
  };

  return (
    <UserContext.Provider value={{ user, isAuthenticated, loading, login, register, loginWithGoogle, loginWithPhone, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};
