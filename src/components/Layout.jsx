import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { Button } from './ui/button'
import logoDefesaCivil from '../assets/logo-defesa-civil.jpg'

const Layout = ({ children, onNavigate }) => {
  const { user, signOut, isAdmin } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', key: 'dashboard' },
    { name: 'Novo Boletim', key: 'new-boletim' },
    { name: 'Consultar Boletins', key: 'boletins' },
    { name: 'Relatórios', key: 'relatorios' },
  ]

  const adminNavigation = [
    { name: 'Administração', key: 'admin' },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  const handleNavigation = (key) => {
    onNavigate(key)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <img className="h-8 w-auto" src={logoDefesaCivil} alt="Defesa Civil" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <span>✕</span>
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.key)}
                className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 w-full text-left"
              >
                <span>{item.name}</span>
              </button>
            ))}
            {isAdmin && (
              <>
                <div className="border-t border-gray-200 my-4" />
                <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Administração
                </div>
                {adminNavigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.key)}
                    className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 w-full text-left"
                  >
                    <span className="mr-3">👤</span>
                    {item.name}
                  </button>
                ))}
              </>
            )}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="mt-3 w-full justify-start"
            >
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar para desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <img className="h-8 w-auto" src={logoDefesaCivil} alt="Defesa Civil" />
            <span className="ml-2 text-lg font-semibold text-gray-900">Defesa Civil</span>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.key)}
                className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 w-full text-left"
              >
                <span>{item.name}</span>
              </button>
            ))}
            {isAdmin && (
              <>
                <div className="border-t border-gray-200 my-4" />
                <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Administração
                </div>
                {adminNavigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.key)}
                    className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 w-full text-left"
                  >
                    <span className="mr-3">👤</span>
                    {item.name}
                  </button>
                ))}
              </>
            )}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="mt-3 w-full justify-start"
            >
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Header para mobile */}
      <div className="lg:hidden">
        <div className="flex h-16 items-center justify-between bg-white border-b border-gray-200 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <span>Menu</span>
          </Button>
          <img className="h-8 w-auto" src={logoDefesaCivil} alt="Defesa Civil" />
          <div className="w-8" />
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="lg:pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout


