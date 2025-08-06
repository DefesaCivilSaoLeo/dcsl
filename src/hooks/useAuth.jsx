import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
      const getSession = async () => {
        console.log("useAuth: Getting session...")
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error) {
            console.error("Error getting session:", error)
            setUser(null)
          } else if (session?.user) {
            console.log("useAuth: Session found, user:", session.user.email)
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("*, role")
              .eq("id", session.user.id)
              .single()

            if (userError) {
              console.error("Error fetching user data:", userError)
              setUser(session.user)
            } else if (userData) {
              setUser({ ...session.user, role: userData.role })
            } else {
              setUser(session.user)
            }
          } else {
            console.log("useAuth: No session found")
            setUser(null)
          }
        } catch (err) {
          console.error("Unexpected error in getSession:", err)
          setUser(null)
        } finally {
          // Ensure loading is set to false after a short delay, even if session fails
          setTimeout(() => {
            setLoading(false)
          }, 1000) // 1 second delay
        }
      }


    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          // Fetch user metadata including role from the 'users' table
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*, role")
            .eq("id", session.user.id)
            .single()

          if (userError) {
            console.error("Error fetching user data on auth state change:", userError)
            setUser(null)
          } else if (userData) {
            setUser({ ...session.user, role: userData.role })
          } else {
            setUser(session.user)
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) {
      console.error("useAuth: SignIn error:", error)
    } else if (data.user) {
    } else {
    }
    return { data, error }
  }

  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (data.user && !error) {
      const { error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            name: name,
            role: 'user'
          }
        ])
      
      if (userError) {
        console.error('Erro ao criar usuário:', userError)
      }
    }

    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    setUser(null)
    return { error }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: user?.role === 'admin' // A role será verificada em componentes que a utilizam
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

