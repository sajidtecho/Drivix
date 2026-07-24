import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import LoginBottomSheet from './LoginBottomSheet';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleCancel = () => {
    // Redirect back to home screen
    router.replace('/');
  };

  if (!isAuthenticated) {
    return (
      <LoginBottomSheet
        visible={true}
        onCancel={handleCancel}
      />
    );
  }

  return <>{children}</>;
}
