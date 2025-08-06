import React, { useState, useEffect } from 'react'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Alert, AlertDescription } from './ui/alert'
import { FileText, TrendingUp, BarChart3, Download, AlertCircle, Filter } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { relatoriosAPI } from '../lib/api'
import { supabase } from '../lib/supabase'

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
  
  // Estados para filtros específicos
  const [specificFilter, setSpecificFilter] = useState('todos')
  const [tiposConstrucao, setTiposConstrucao] = useState([])
  const [responsaveis, setResponsaveis] = useState([])
  const [encaminhamentos, setEncaminhamentos] = useState([])

  useEffect(() => {
    loadStatistics()
    loadFilterOptions()
  }, [])

  useEffect(() => {
    // Reset do filtro específico quando muda o tipo de relatório
    setSpecificFilter('todos')
  }, [reportType])

  const loadStatistics = async () => {
    try {
      const stats = await relatoriosAPI.getEstatisticas()
      setStatistics(stats)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const loadFilterOptions = async () => {
    try {
      // Carregar tipos de construção
      const { data: tipos, error: tiposError } = await supabase
        .from('tipos_construcao')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome')
      
      if (!tiposError) setTiposConstrucao(tipos || [])

      // Carregar responsáveis
      const { data: resp, error: respError } = await supabase
        .from('responsaveis')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome')
      
      if (!respError) setResponsaveis(resp || [])

      // Carregar encaminhamentos
      const { data: enc, error: encError } = await supabase
        .from('encaminhamentos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome')
      
      if (!encError) setEncaminhamentos(enc || [])
    } catch (error) {
      console.error('Erro ao carregar opções de filtro:', error)
    }
  }

  const generateReport = async () => {
    setLoading(true)
    setError('')

    try {
      let data
      const { inicio, fim } = dateRange

      switch (reportType) {
        case 'periodo':
          data = await relatoriosAPI.getBoletinsPorPeriodo(inicio, fim)
          break
        case 'tipo':
          if (specificFilter === 'todos') {
            data = await relatoriosAPI.getBoletinsPorTipo(inicio, fim)
          } else {
            data = await relatoriosAPI.getBoletinsPorTipoEspecifico(inicio, fim, specificFilter)
          }
          break
        case 'responsavel':
          if (specificFilter === 'todos') {
            data = await relatoriosAPI.getBoletinsPorResponsavel(inicio, fim)
          } else {
            data = await relatoriosAPI.getBoletinsPorResponsavelEspecifico(inicio, fim, specificFilter)
          }
          break
        case 'encaminhamento':
          if (specificFilter === 'todos') {
            data = await relatoriosAPI.getBoletinsPorEncaminhamento(inicio, fim)
          } else {
            data = await relatoriosAPI.getBoletinsPorEncaminhamentoEspecifico(inicio, fim, specificFilter)
          }
          break
        default:
          throw new Error('Tipo de relatório não suportado')
      }

      setReportData(data)
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      setError('Erro ao gerar relatório: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = () => {
    if (!reportData || reportData.length === 0) {
      alert('Nenhum dado para exportar')
      return
    }

    // Criar conteúdo HTML para o PDF
    const htmlContent = `
      <html>
        <head>
          <title>Relatório - ${reportType}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            h2 { color: #666; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .summary { display: flex; justify-content: space-around; margin: 20px 0; }
            .summary-item { text-align: center; }
            .summary-number { font-size: 24px; font-weight: bold; color: #3B82F6; }
          </style>
        </head>
        <body>
          <h1>Relatório de Boletins - ${getReportTitle()}</h1>
          <p><strong>Período:</strong> ${format(new Date(dateRange.inicio), 'dd/MM/yyyy', { locale: ptBR })} até ${format(new Date(dateRange.fim), 'dd/MM/yyyy', { locale: ptBR })}</p>
          
          <h2>Resumo</h2>
          <div class="summary">
            <div class="summary-item">
              <div class="summary-number">${reportData.length}</div>
              <div>Total de Boletins</div>
            </div>
            <div class="summary-item">
              <div class="summary-number">${new Set(reportData.map(b => b.nome_requerente)).size}</div>
              <div>Requerentes Únicos</div>
            </div>
            <div class="summary-item">
              <div class="summary-number">${reportData.filter(b => b.data_vistoria).length}</div>
              <div>Com Vistoria Realizada</div>
            </div>
          </div>

          <h2>Dados Detalhados</h2>
          <table>
            <thead>
              <tr>
                <th>Boletim</th>
                <th>Requerente</th>
                <th>Data Solicitação</th>
                <th>Data Vistoria</th>
                ${getAdditionalColumns()}
              </tr>
            </thead>
            <tbody>
              ${reportData.map(boletim => `
                <tr>
                  <td>${boletim.numero}/${boletim.ano}</td>
                  <td>${boletim.nome_requerente}</td>
                  <td>${format(new Date(boletim.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}</td>
                  <td>${boletim.data_vistoria ? format(new Date(boletim.data_vistoria), 'dd/MM/yyyy', { locale: ptBR }) : 'Não realizada'}</td>
                  ${getAdditionalColumnData(boletim)}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    // Abrir nova janela e imprimir
    const printWindow = window.open('', '_blank')
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const exportToExcel = () => {
    if (!reportData || reportData.length === 0) {
      alert('Nenhum dado para exportar')
      return
    }

    // Preparar dados para CSV (compatível com Excel)
    const headers = ['Boletim', 'Requerente', 'Data Solicitação', 'Data Vistoria']
    
    // Adicionar colunas específicas do tipo de relatório
    if (reportType === 'tipo') {
      headers.push('Tipo de Construção')
    } else if (reportType === 'responsavel') {
      headers.push('Responsável 1', 'Responsável 2')
    } else if (reportType === 'encaminhamento') {
      headers.push('Encaminhamentos')
    }

    const csvContent = [
      headers.join(','),
      ...reportData.map(boletim => {
        const row = [
          `"${boletim.numero}/${boletim.ano}"`,
          `"${boletim.nome_requerente}"`,
          `"${format(new Date(boletim.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}"`,
          `"${boletim.data_vistoria ? format(new Date(boletim.data_vistoria), 'dd/MM/yyyy', { locale: ptBR }) : 'Não realizada'}"`
        ]

        // Adicionar dados específicos do tipo de relatório
        if (reportType === 'tipo') {
          row.push(`"${boletim.tipos_construcao?.nome || 'N/A'}"`)
        } else if (reportType === 'responsavel') {
          row.push(`"${boletim.responsavel1?.nome || 'N/A'}"`)
          row.push(`"${boletim.responsavel2?.nome || 'N/A'}"`)
        } else if (reportType === 'encaminhamento') {
          const encaminhamentos = boletim.boletim_encaminhamentos?.map(be => be.encaminhamentos?.nome).filter(Boolean).join('; ') || 'N/A'
          row.push(`"${encaminhamentos}"`)
        }

        return row.join(',')
      })
    ].join('\n')

    // Criar e baixar arquivo
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getReportTitle = () => {
    switch (reportType) {
      case 'periodo': return 'Por Período'
      case 'tipo': return 'Por Tipo de Construção'
      case 'responsavel': return 'Por Responsável'
      case 'encaminhamento': return 'Por Encaminhamento'
      default: return 'Relatório'
    }
  }

  const getAdditionalColumns = () => {
    switch (reportType) {
      case 'tipo': return '<th>Tipo de Construção</th>'
      case 'responsavel': return '<th>Responsável 1</th><th>Responsável 2</th>'
      case 'encaminhamento': return '<th>Encaminhamentos</th>'
      default: return '<th>Tipo de Construção</th>'
    }
  }

  const getAdditionalColumnData = (boletim) => {
    switch (reportType) {
      case 'tipo': return `<td>${boletim.tipos_construcao?.nome || 'N/A'}</td>`
      case 'responsavel': return `<td>${boletim.responsavel1?.nome || 'N/A'}</td><td>${boletim.responsavel2?.nome || 'N/A'}</td>`
      case 'encaminhamento': {
        const encaminhamentos = boletim.boletim_encaminhamentos?.map(be => be.encaminhamentos?.nome).filter(Boolean).join(', ') || 'N/A'
        return `<td>${encaminhamentos}</td>`
      }
      default: return `<td>${boletim.tipos_construcao?.nome || 'N/A'}</td>`
    }
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <SelectItem value="encaminhamento">Por Encaminhamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro específico - aparece apenas para tipos que precisam */}
            {(reportType === 'tipo' || reportType === 'responsavel' || reportType === 'encaminhamento') && (
              <div>
                <Label htmlFor="specific_filter">
                  {reportType === 'tipo' && 'Tipo de Construção'}
                  {reportType === 'responsavel' && 'Responsável'}
                  {reportType === 'encaminhamento' && 'Encaminhamento'}
                </Label>
                <Select value={specificFilter} onValueChange={setSpecificFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {reportType === 'tipo' && tiposConstrucao.map(tipo => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>{tipo.nome}</SelectItem>
                    ))}
                    {reportType === 'responsavel' && responsaveis.map(resp => (
                      <SelectItem key={resp.id} value={resp.id.toString()}>{resp.nome}</SelectItem>
                    ))}
                    {reportType === 'encaminhamento' && encaminhamentos.map(enc => (
                      <SelectItem key={enc.id} value={enc.id.toString()}>{enc.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                    {(() => {
                      const days = Math.max(1, Math.ceil((new Date(dateRange.fim) - new Date(dateRange.inicio)) / (1000 * 60 * 60 * 24)))
                      return Math.round(reportData.length / days)
                    })()}
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
                    {reportData.filter(b => b.data_vistoria).length}
                  </p>
                  <p className="text-sm text-gray-600">Com Vistoria Realizada</p>
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
                      {reportType === 'tipo' && <th className="text-left p-2">Tipo Construção</th>}
                      {reportType === 'responsavel' && (
                        <>
                          <th className="text-left p-2">Responsável 1</th>
                          <th className="text-left p-2">Responsável 2</th>
                        </>
                      )}
                      {reportType === 'encaminhamento' && <th className="text-left p-2">Encaminhamentos</th>}
                      {reportType === 'periodo' && <th className="text-left p-2">Tipo Construção</th>}
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
                          {boletim.data_vistoria ? 
                            format(new Date(boletim.data_vistoria), 'dd/MM/yyyy', { locale: ptBR }) : 
                            'Não realizada'
                          }
                        </td>
                        {reportType === 'tipo' && (
                          <td className="p-2">{boletim.tipos_construcao?.nome || 'N/A'}</td>
                        )}
                        {reportType === 'responsavel' && (
                          <>
                            <td className="p-2">{boletim.responsavel1?.nome || 'N/A'}</td>
                            <td className="p-2">{boletim.responsavel2?.nome || 'N/A'}</td>
                          </>
                        )}
                        {reportType === 'encaminhamento' && (
                          <td className="p-2">
                            {boletim.boletim_encaminhamentos?.map(be => be.encaminhamentos?.nome).filter(Boolean).join(', ') || 'N/A'}
                          </td>
                        )}
                        {reportType === 'periodo' && (
                          <td className="p-2">{boletim.tipos_construcao?.nome || 'N/A'}</td>
                        )}
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

