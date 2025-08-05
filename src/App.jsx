import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import Layout from './components/Layout'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import BoletimForm from './components/BoletimForm'
import BoletinsList from './components/BoletinsList'
import BoletimView from './components/BoletimView'
import AdminPanel from './components/AdminPanel'
import Reports from './components/Reports'
import './App.css'

// Componente principal da aplicação
const AppContent = () => {
  const { user, loading } = useAuth()
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedBoletimId, setSelectedBoletimId] = useState(null)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  const handleViewBoletim = (id) => {
    setSelectedBoletimId(id)
    setCurrentView('view-boletim')
  }

  const handleEditBoletim = (id) => {
    setSelectedBoletimId(id)
    setCurrentView('edit-boletim')
  }

  const handleNewBoletim = () => {
    setSelectedBoletimId(null)
    setCurrentView('new-boletim')
  }

  const handleBackToList = () => {
    setCurrentView('boletins')
    setSelectedBoletimId(null)
  }

  const handleSaveBoletim = (boletim) => {
    setCurrentView('boletins')
    setSelectedBoletimId(null)
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      
      case 'boletins':
        return (
          <BoletinsList 
            onView={handleViewBoletim}
            onEdit={handleEditBoletim}
            onNew={handleNewBoletim}
          />
        )
      
      case 'view-boletim':
        return (
          <BoletimView 
            boletimId={selectedBoletimId}
            onEdit={handleEditBoletim}
            onBack={handleBackToList}
          />
        )
      
      case 'edit-boletim':
        return (
          <BoletimForm 
            boletimId={selectedBoletimId}
            onSave={handleSaveBoletim}
            onCancel={handleBackToList}
          />
        )
      
      case 'new-boletim':
        return (
          <BoletimForm 
            onSave={handleSaveBoletim}
            onCancel={() => setCurrentView('dashboard')}
          />
        )
      
      case 'relatorios':
        return <Reports />
      
      case 'admin':
        return <AdminPanel />
      
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout onNavigate={setCurrentView}>
      {renderContent()}
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

