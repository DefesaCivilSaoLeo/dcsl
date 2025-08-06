import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import logoDefesaCivil from '../assets/logo-defesa-civil.jpg'

const Login = () => {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Adicionar timeout para evitar travamento no login
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout no login')), 10000)
      )
      
      const loginPromise = signIn(email, password)
      
      const { error } = await Promise.race([loginPromise, timeoutPromise])
      
      if (error) {
        setError('Email ou senha incorretos')
      }
    } catch (err) {
      console.error('Erro no login:', err)
      
      // Se houver timeout, limpar completamente a sessão
      if (err.message === 'Timeout no login') {
        console.log("Login: Timeout detectado, limpando sessão...")
        try {
          // Limpar localStorage do Supabase
          const keys = Object.keys(localStorage)
          keys.forEach(key => {
            if (key.includes('supabase') || key.includes('sb-')) {
              localStorage.removeItem(key)
              console.log("Login: Removido do localStorage:", key)
            }
          })
        } catch (cleanupErr) {
          console.error("Login: Erro na limpeza:", cleanupErr)
        }
        setError('Timeout na conexão. Sessão limpa. Tente novamente.')
      } else {
        setError('Erro na conexão. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            className="mx-auto h-20 w-auto"
            src={logoDefesaCivil}
            alt="Defesa Civil São Leopoldo"
          />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sistema de Atendimentos
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Superintendência Municipal de Defesa Civil
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar no Sistema</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2025 Defesa Civil São Leopoldo. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login

