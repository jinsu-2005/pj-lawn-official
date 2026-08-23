import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function useAdminGuard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Force token refresh to get latest custom claims if changed recently
        const tokenResult = await currentUser.getIdTokenResult(true);
        if (tokenResult.claims.admin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          navigate('/dashboard'); // Redirect non-admins
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        navigate('/'); // Redirect unauthenticated
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return { isAdmin, user, loading: isAdmin === null };
}
