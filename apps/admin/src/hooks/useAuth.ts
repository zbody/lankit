import { useNavigate } from 'react-router-dom';
import { trpc } from '../trpc/client';
import { useQueryClient } from '@tanstack/react-query';

export function useAuth() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const queryClient = useQueryClient();

  const { data: user, isLoading, refetch } = trpc.auth.me.useQuery(undefined, {
    enabled: !!token,
    retry: false,
    onError: () => {
      localStorage.removeItem('token');
      queryClient.clear();
      navigate('/login');
    },
  });

  return {
    user: user ?? null,
    isAuthenticated: !!user,
    loading: isLoading,
    refetch,
    logout: () => {
      localStorage.removeItem('token');
      queryClient.clear();
      navigate('/login');
    },
  };
}
