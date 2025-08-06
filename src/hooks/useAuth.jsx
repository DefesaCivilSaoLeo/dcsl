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
  console.log("useAuth: current loading state", loading)
  useEffect(() => {
    const getSession = async () => {
      console.log("useAuth: Getting session...")
      try {
        // Adicionar timeout para evitar travamento
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na chamada getSession')), 5000)
        )
        
        const sessionPromise = supabase.auth.getSession()
        
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])
        console.log("useAuth: getSession result - session:", session, "error:", error)
        
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
        console.error("useAuth: Error in getSession call:", err)
        
        // Se houver timeout, limpar completamente a sessão
        if (err.message === 'Timeout na chamada getSession') {
          console.log("useAuth: Timeout detectado, limpando sessão...")
          try {
            // Limpar localStorage do Supabase
            const keys = Object.keys(localStorage)
            keys.forEach(key => {
              if (key.includes('supabase') || key.includes('sb-')) {
                localStorage.removeItem(key)
                console.log("useAuth: Removido do localStorage:", key)
              }
            })
            
            // Tentar fazer signOut para limpar qualquer estado no Supabase
            await supabase.auth.signOut()
            console.log("useAuth: SignOut executado após timeout")
          } catch (cleanupErr) {
            console.error("useAuth: Erro na limpeza:", cleanupErr)
          }
        }
        
        setUser(null)
      } finally {
        setLoading(false)
        console.log("useAuth: setLoading(false) called in getSession finally")
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
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

