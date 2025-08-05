import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  BarChart3, 
  Download, 
  Calendar, 
  FileText, 
  TrendingUp,
  AlertCircle,
  Filter
} from 'lucide-react'
import { format, subDays, subMonths, subYears } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { relatoriosAPI } from '../lib/api'

const Reports = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reportType, setReportType] = useState('periodo')
  const [dateRange, setDateRange] = useState({
    inicio: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    fim: format(new Date(), 'yyyy-MM-dd')
  })
  const [reportData, setReportData] = useState(null)
  const [statistics, setStatistics] = useState(null)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      const stats = await relatoriosAPI.getEstatisticas()
      setStatistics(stats)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const generateReport = async () => {
    setLoading(true)
    setError('')

    try {
      let data
      
      switch (reportType) {
        case 'periodo':
          data = await relatoriosAPI.getBoletinsPorPeriodo(dateRange.inicio, dateRange.fim)
          break
        default:
          throw new Error('Tipo de relatório não suportado')
      }

      setReportData(data)
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      setError('Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = () => {
    // TODO: Implementar exportação para PDF
    alert('Funcionalidade de exportação será implementada')
  }

  const exportToExcel = () => {
    // TODO: Implementar exportação para Excel
    alert('Funcionalidade de exportação será implementada')
  }

  const setQuickDateRange = (type) => {
    const today = new Date()
    let inicio

    switch (type) {
      case 'week':
        inicio = subDays(today, 7)
        break
      case 'month':
        inicio = subMonths(today, 1)
        break
      case 'quarter':
        inicio = subMonths(today, 3)
        break
      case 'year':
        inicio = subYears(today, 1)
        break
      default:
        return
    }

    setDateRange({
      inicio: format(inicio, 'yyyy-MM-dd'),
      fim: format(today, 'yyyy-MM-dd')
    })
  }

  // Preparar dados para gráficos
  const prepareChartData = () => {
    if (!reportData) return { monthlyData: [], typeData: [] }

    // Dados mensais
    const monthlyCount = {}
    reportData.forEach(boletim => {
      const month = format(new Date(boletim.data_solicitacao), 'MM/yyyy')
      monthlyCount[month] = (monthlyCount[month] || 0) + 1
    })

    const monthlyData = Object.entries(monthlyCount).map(([month, count]) => ({
      month,
      count
    }))

    // Dados por tipo de construção
    const typeCount = {}
    reportData.forEach(boletim => {
      const tipo = boletim.tipos_construcao?.nome || 'Não informado'
      typeCount[tipo] = (typeCount[tipo] || 0) + 1
    })

    const typeData = Object.entries(typeCount).map(([tipo, count]) => ({
      tipo,
      count
    }))

    return { monthlyData, typeData }
  }

  const { monthlyData, typeData } = prepareChartData()

  // Cores para o gráfico de pizza
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios Gerenciais</h1>
        <p className="text-gray-600">Gere relatórios e visualize estatísticas do sistema</p>
      </div>

      {/* Estatísticas Gerais */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Boletins</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tipos Cadastrados</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.porTipo?.length || 0}</p>
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
                  <p className="text-sm font-medium text-gray-600">Média Mensal</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(statistics.total / 12)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configuração do Relatório */}
      <Card>
        <CardHeader>
          <CardTitle>Gerar Relatório</CardTitle>
          <CardDescription>
            Configure os parâmetros para gerar um relatório personalizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="report_type">Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="periodo">Boletins por Período</SelectItem>
                  <SelectItem value="tipo">Por Tipo de Construção</SelectItem>
                  <SelectItem value="responsavel">Por Responsável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={dateRange.inicio}
                onChange={(e) => setDateRange(prev => ({ ...prev, inicio: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="data_fim">Data Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={dateRange.fim}
                onChange={(e) => setDateRange(prev => ({ ...prev, fim: e.target.value }))}
              />
            </div>
          </div>

          {/* Filtros Rápidos */}
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => setQuickDateRange('week')}>
              Última Semana
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDateRange('month')}>
              Último Mês
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDateRange('quarter')}>
              Último Trimestre
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDateRange('year')}>
              Último Ano
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button onClick={generateReport} disabled={loading}>
              <Filter className="h-4 w-4 mr-2" />
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
            
            {reportData && (
              <>
                <Button variant="outline" onClick={exportToPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button variant="outline" onClick={exportToExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resultados do Relatório */}
      {reportData && (
        <div className="space-y-6">
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Relatório</CardTitle>
              <CardDescription>
                Período: {format(new Date(dateRange.inicio), 'dd/MM/yyyy', { locale: ptBR })} até{' '}
                {format(new Date(dateRange.fim), 'dd/MM/yyyy', { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{reportData.length}</p>
                  <p className="text-sm text-gray-600">Total de Boletins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(reportData.length / ((new Date(dateRange.fim) - new Date(dateRange.inicio)) / (1000 * 60 * 60 * 24)))}
                  </p>
                  <p className="text-sm text-gray-600">Média por Dia</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {new Set(reportData.map(b => b.nome_requerente)).size}
                  </p>
                  <p className="text-sm text-gray-600">Requerentes Únicos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {reportData.filter(b => b.feito_registro).length}
                  </p>
                  <p className="text-sm text-gray-600">Com Registro Fotográfico</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Barras - Boletins por Mês */}
            <Card>
              <CardHeader>
                <CardTitle>Boletins por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Pizza - Por Tipo de Construção */}
            <Card>
              <CardHeader>
                <CardTitle>Por Tipo de Construção</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ tipo, percent }) => `${tipo} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Dados */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Detalhados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Boletim</th>
                      <th className="text-left p-2">Requerente</th>
                      <th className="text-left p-2">Data Solicitação</th>
                      <th className="text-left p-2">Data Vistoria</th>
                      <th className="text-left p-2">Tipo Construção</th>
                      <th className="text-left p-2">Registro Foto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((boletim) => (
                      <tr key={boletim.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{boletim.numero}/{boletim.ano}</td>
                        <td className="p-2">{boletim.nome_requerente}</td>
                        <td className="p-2">
                          {format(new Date(boletim.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}
                        </td>
                        <td className="p-2">
                          {format(new Date(boletim.data_vistoria), 'dd/MM/yyyy', { locale: ptBR })}
                        </td>
                        <td className="p-2">{boletim.tipos_construcao?.nome || 'N/A'}</td>
                        <td className="p-2">
                          {boletim.feito_registro ? (
                            <span className="text-green-600">Sim</span>
                          ) : (
                            <span className="text-red-600">Não</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Reports

