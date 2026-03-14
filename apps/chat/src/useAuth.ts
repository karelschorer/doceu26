import { useState, useEffect } from 'react';

interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  org_id?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  return { user };
}
