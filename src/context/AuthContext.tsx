import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/lib/firebase'

export interface CachedUserData {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

interface AuthContextType {
  user: (User | CachedUserData) | null
  rawUser: User | null
  isAdmin: boolean
  loading: boolean
  loginWithGoogle: () => Promise<User | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SUPER_ADMINS = [
  'jinsu.j2005@gmail.com',
  'jinsukapgreen@gmail.com'
]

// Synchronous fast local boot helpers (0ms initial frame render)
function getCachedUser(): CachedUserData | null {
  try {
    const raw = localStorage.getItem('pj_auth_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function getCachedIsAdmin(): boolean {
  try {
    return localStorage.getItem('pj_auth_is_admin') === 'true'
  } catch {
    return false
  }
}

async function verifyAdminStatus(user: User): Promise<boolean> {
  const emailLower = user.email?.toLowerCase().trim() || ''

  // 1. Instant check against super-admins (0ms)
  if (emailLower && SUPER_ADMINS.includes(emailLower)) {
    return true
  }

  // 2. Check session cache to avoid repeated Firestore queries
  const sessionCacheKey = `pj_admin_verified_${user.uid}`
  const cachedSession = sessionStorage.getItem(sessionCacheKey)
  if (cachedSession !== null) {
    return cachedSession === 'true'
  }

  // 3. Fallback to Firestore lookup
  try {
    const adminDocRef = doc(db, 'admins', user.uid)
    const adminDocSnap = await getDoc(adminDocRef)
    if (adminDocSnap.exists()) {
      sessionStorage.setItem(sessionCacheKey, 'true')
      return true
    }

    if (emailLower) {
      const inviteRef = doc(db, 'admin_invites', emailLower)
      const inviteSnap = await getDoc(inviteRef)
      if (inviteSnap.exists()) {
        sessionStorage.setItem(sessionCacheKey, 'true')
        return true
      }
    }

    sessionStorage.setItem(sessionCacheKey, 'false')
    return false
  } catch (err) {
    console.warn('Error checking admin status:', err)
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const cachedUser = getCachedUser()
  const cachedAdmin = getCachedIsAdmin()

  // Initialize with cached state immediately to avoid initial UI flickering
  const [user, setUser] = useState<(User | CachedUserData) | null>(cachedUser)
  const [rawUser, setRawUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(cachedAdmin)
  const [loading, setLoading] = useState<boolean>(!cachedUser)

  useEffect(() => {
    // Singleton Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setRawUser(currentUser)

      if (currentUser) {
        const lightSnapshot: CachedUserData = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL
        }
        setUser(currentUser)
        localStorage.setItem('pj_auth_user', JSON.stringify(lightSnapshot))

        const adminResolved = await verifyAdminStatus(currentUser)
        setIsAdmin(adminResolved)
        localStorage.setItem('pj_auth_is_admin', String(adminResolved))
      } else {
        setUser(null)
        setIsAdmin(false)
        localStorage.removeItem('pj_auth_user')
        localStorage.removeItem('pj_auth_is_admin')
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loginWithGoogle = async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      return result.user
    } catch (error) {
      console.error('Google Sign-In error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setIsAdmin(false)
      localStorage.removeItem('pj_auth_user')
      localStorage.removeItem('pj_auth_is_admin')
    } catch (error) {
      console.error('Sign-out error:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, rawUser, isAdmin, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
