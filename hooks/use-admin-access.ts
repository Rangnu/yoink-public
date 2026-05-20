import { useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { canAccessAdmin, invokeAdminStatus } from '@/utils/admin';

type AdminAccessState = {
  allowed: boolean;
  loading: boolean;
  source: 'backend' | 'client-fallback' | 'none';
};

export function useAdminAccess(): AdminAccessState {
  const { user, session, loading: authLoading } = useAuth();
  const [state, setState] = useState<AdminAccessState>({
    allowed: false,
    loading: true,
    source: 'none',
  });

  useEffect(() => {
    let active = true;

    if (authLoading) {
      setState((current) => ({ ...current, loading: true }));
      return () => {
        active = false;
      };
    }

    if (!user) {
      setState({ allowed: false, loading: false, source: 'none' });
      return () => {
        active = false;
      };
    }

    const check = async () => {
      try {
        const result = await invokeAdminStatus(session?.access_token);
        if (!active) return;

        if (result.ok && result.data) {
          setState({ allowed: true, loading: false, source: 'backend' });
          return;
        }

        const status = result.response?.status;
        if (status === 401 || status === 403) {
          setState({ allowed: false, loading: false, source: 'none' });
          return;
        }

        if (canAccessAdmin(user)) {
          setState({ allowed: true, loading: false, source: 'client-fallback' });
          return;
        }

        setState({ allowed: false, loading: false, source: 'none' });
      } catch {
        if (!active) return;
        if (canAccessAdmin(user)) {
          setState({ allowed: true, loading: false, source: 'client-fallback' });
          return;
        }
        setState({ allowed: false, loading: false, source: 'none' });
      }
    };

    setState((current) => ({ ...current, loading: true }));
    void check();

    return () => {
      active = false;
    };
  }, [authLoading, session?.access_token, user]);

  return state;
}
