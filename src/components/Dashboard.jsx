import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { FileText, Search, BarChart3, Plus, Calendar, Users, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const Dashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalBoletins: 0,
    boletinsHoje: 0,
    boletinsMes: 0,
    boletinsAno: 0
  })
  const [recentBoletins, setRecentBoletins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const hoje = new Date()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const inicioAno = new Date(hoje.getFullYear(), 0, 1)

      // Buscar estatísticas
      const { data: totalData } = await supabase
        .from('boletins')
        .select('id', { count: 'exact' })

      const { data: hojeData } = await supabase
        .from('boletins')
        .select('id', { count: 'exact' })
        .gte('created_at', format(hoje, 'yyyy-MM-dd'))

      const { data: mesData } = await supabase
        .from('boletins')
        .select('id', { count: 'exact' })
        .gte('created_at', format(inicioMes, 'yyyy-MM-dd'))

      const { data: anoData } = await supabase
        .from('boletins')
        .select('id', { count: 'exact' })
        .gte('created_at', format(inicioAno, 'yyyy-MM-dd'))

      // Buscar boletins recentes
      const { data: recentData } = await supabase
        .from('boletins')
        .select(`
          id,
          numero,
          ano,
          nome_requerente,
          data_solicitacao,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        totalBoletins: totalData?.length || 0,
        boletinsHoje: hojeData?.length || 0,
        boletinsMes: mesData?.length || 0,
        boletinsAno: anoData?.length || 0
      })

      setRecentBoletins(recentData || [])
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Novo Boletim',
      description: 'Criar um novo boletim de atendimento',
      icon: Plus,
      href: '/boletim/novo',
      color: 'bg-blue-500'
    },
    {
      title: 'Consultar Boletins',
      description: 'Buscar e visualizar boletins existentes',
      icon: Search,
      href: '/boletins',
      color: 'bg-green-500'
    },
    {
      title: 'Relatórios',
      description: 'Gerar relatórios gerenciais',
      icon: BarChart3,
      href: '/relatorios',
      color: 'bg-purple-500'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do sistema de atendimentos</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Boletins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBoletins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hoje</p>
                <p className="text-2xl font-bold text-gray-900">{stats.boletinsHoje}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Este Mês</p>
                <p className="text-2xl font-bold text-gray-900">{stats.boletinsMes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Este Ano</p>
                <p className="text-2xl font-bold text-gray-900">{stats.boletinsAno}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Card key={action.title} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${action.color}`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline" onClick={() => onNavigate(action.key)}>
                  Acessar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Boletins Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Boletins Recentes</CardTitle>
          <CardDescription>
            Últimos 5 boletins criados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentBoletins.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhum boletim encontrado
            </p>
          ) : (
            <div className="space-y-4">
              {recentBoletins.map((boletim) => (
                <div key={boletim.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Boletim {boletim.numero}/{boletim.ano}
                    </h4>
                    <p className="text-sm text-gray-600">{boletim.nome_requerente}</p>
                    <p className="text-xs text-gray-500">
                      Solicitação: {format(new Date(boletim.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Criado em {format(new Date(boletim.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Visualizar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard

