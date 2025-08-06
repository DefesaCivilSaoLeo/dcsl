import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqaqwoawbixvvovkgirc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxYXF3b2F3Yml4dnZvdmtnaXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzk2MjcsImV4cCI6MjA2OTk1NTYyN30.YNZz_ZnMVI1aVSmDp4mVkfZ-vOYjjvsZEbkRXe-5C24'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Teste simples de conectividade
export const testSupabaseConnection = async () => {
  console.log('Testando conectividade com Supabase...')
  
  try {
    // Teste 1: Verificar se o cliente foi criado
    console.log('Cliente Supabase criado:', !!supabase)
    
    // Teste 2: Tentar uma operação simples
    const { data, error } = await supabase.from('users').select('count').limit(1)
    console.log('Teste de query:', { data, error })
    
    // Teste 3: Verificar sessão atual
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('Teste de sessão:', { sessionData, sessionError })
    
    return { success: true, message: 'Conectividade OK' }
  } catch (err) {
    console.error('Erro no teste de conectividade:', err)
    return { success: false, error: err.message }
  }
}

// Executar teste automaticamente
testSupabaseConnection()

