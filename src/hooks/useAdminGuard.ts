import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function useAdminGuard() {
  const { user, rawUser, isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/')
      } else if (!isAdmin) {
        navigate('/dashboard')
      }
    }
  }, [user, isAdmin, loading, navigate])

  return { isAdmin, user: rawUser, loading }
}
