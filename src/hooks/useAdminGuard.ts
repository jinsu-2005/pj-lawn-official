import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function useAdminGuard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const docRef = doc(db, 'admins', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            navigate('/dashboard'); // Redirect non-admins
          }
        } catch (e) {
          console.error("Error checking admin status:", e);
          setIsAdmin(false);
          navigate('/dashboard');
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
