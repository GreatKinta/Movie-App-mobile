import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/config';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getToken = useCallback(async () => {
    return await SecureStore.getItemAsync('accessToken');
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setUser(null);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        await SecureStore.deleteItemAsync('accessToken');
        setUser(null);
      }
    } catch (error) {
      // Backend chưa sẵn sàng — skip silently
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = useCallback(
    async (accessToken) => {
      await SecureStore.setItemAsync('accessToken', accessToken);
      await checkAuthStatus();
    },
    [checkAuthStatus]
  );

  const logout = useCallback(async () => {
    try {
      const token = await getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      await SecureStore.deleteItemAsync('accessToken');
      setUser(null);
    }
  }, [getToken]);

  const updateUser = useCallback(async (fullName, phoneNumber) => {
    try {
      const token = await getToken();
      if (!token) return { success: false, error: 'Chưa đăng nhập' };

      const response = await fetch(`${API_BASE_URL}/api/auth/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, phoneNumber }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setUser(updatedData);
        return { success: true };
      } else {
        const errData = await response.json();
        return { success: false, error: errData.message || 'Cập nhật thất bại' };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Lỗi kết nối mạng' };
    }
  }, [getToken]);

  const uploadAvatar = useCallback(async (imageInput) => {
    try {
      const token = await getToken();
      if (!token) return { success: false, error: 'Chưa đăng nhập' };

      const formData = new FormData();
      let uri = '';
      let fileName = 'avatar.jpg';
      let type = 'image/jpeg';

      if (imageInput && typeof imageInput === 'object') {
        uri = imageInput.uri;
        fileName = imageInput.fileName || uri.split('/').pop() || 'avatar.jpg';
        type = imageInput.mimeType || 'image/jpeg';
      } else {
        uri = imageInput;
        const uriParts = uri.split('/');
        fileName = uriParts[uriParts.length - 1];
        const ext = fileName.split('.').pop().toLowerCase();
        type = `image/${ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : 'jpeg'}`;
      }

      formData.append('file', {
        uri: uri,
        name: fileName,
        type: type,
      });

      const response = await fetch(`${API_BASE_URL}/api/auth/upload-avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        const updatedData = await response.json();
        setUser(updatedData);
        return { success: true };
      } else {
        const errText = await response.text();
        console.warn('Server upload error text:', errText);
        try {
          const errData = JSON.parse(errText);
          return { success: false, error: errData.message || 'Tải ảnh lên thất bại' };
        } catch (e) {
          return { success: false, error: `Lỗi Server (${response.status}): ${errText.substring(0, 100)}` };
        }
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      return { success: false, error: 'Lỗi kết nối mạng hoặc định dạng file' };
    }
  }, [getToken]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, getToken, checkAuthStatus, updateUser, uploadAvatar }}
    >
      {children}
    </AuthContext.Provider>
  );
};
