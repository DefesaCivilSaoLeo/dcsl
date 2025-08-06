import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Calendar,
  User,
  FileText,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { boletinsAPI, formatBoletimNumber } from '../lib/api'
import { useAuth } from '../hooks/useAuth.jsx'

const BoletinsList = ({ onView, onEdit, onNew }) => {
  const { user, isAdmin } = useAuth()
  const [boletins, setBoletins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    numero: '',
    ano: '',
    dataInicio: '',
    dataFim: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadBoletins()
  }, [])

  const loadBoletins = async (searchFilters = {}) => {
    setLoading(true)
    setError('')

    try {
      const data = await boletinsAPI.search({
        searchTerm: searchTerm,
        ...filters,
        ...searchFilters
      })
      setBoletins(data)
    } catch (error) {
      console.error('Erro ao carregar boletins:', error)
      setError('Erro ao carregar boletins')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadBoletins()
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleClearFilters = () => {
    setFilters({
      numero: '',
      ano: '',
      dataInicio: '',
      dataFim: ''
    })
    setSearchTerm('')
    loadBoletins({
      numero: '',
      ano: '',
      dataInicio: '',
      dataFim: '',
      searchTerm: ''
    })
  }

  const handleDelete = async (boletimId) => {
    if (!window.confirm('Tem certeza que deseja excluir este boletim?')) {
      return
    }

    try {
      await boletinsAPI.delete(boletimId)
      setBoletins(prev => prev.filter(b => b.id !== boletimId))
    } catch (error) {
      console.error('Erro ao excluir boletim:', error)
      setError('Erro ao excluir boletim')
    }
  }

  const canEdit = (boletim) => {
    return isAdmin || boletim.created_by === user?.id
  }

  const canDelete = (boletim) => {
    return isAdmin || boletim.created_by === user?.id
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Consultar Boletins</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultar Boletins</h1>
          <p className="text-gray-600">Busque e visualize boletins de atendimento</p>
        </div>
        <Button onClick={onNew}>
          <FileText className="h-4 w-4 mr-2" />
          Novo Boletim
        </Button>
      </div>

      {/* Busca e Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Buscar Boletins</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca Principal */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, CPF ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          {/* Filtros Avançados */}
          {showFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="filter_numero">Número do Boletim</Label>
                  <Input
                    id="filter_numero"
                    type="number"
                    placeholder="Ex: 123"
                    value={filters.numero}
                    onChange={(e) => handleFilterChange('numero', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="filter_ano">Ano</Label>
                  <Input
                    id="filter_ano"
                    type="number"
                    placeholder="Ex: 2025"
                    value={filters.ano}
                    onChange={(e) => handleFilterChange('ano', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="filter_data_inicio">Data Início</Label>
                  <Input
                    id="filter_data_inicio"
                    type="date"
                    value={filters.dataInicio}
                    onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="filter_data_fim">Data Fim</Label>
                  <Input
                    id="filter_data_fim"
                    type="date"
                    value={filters.dataFim}
                    onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSearch}>
                  Aplicar Filtros
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista de Boletins */}
      <div className="space-y-4">
        {boletins.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum boletim encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Não foram encontrados boletins com os critérios de busca especificados.
              </p>
              <Button onClick={onNew}>
                Criar Primeiro Boletim
              </Button>
            </CardContent>
          </Card>
        ) : (
          boletins.map((boletim) => (
            <Card key={boletim.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Boletim {formatBoletimNumber(boletim.numero, boletim.ano)}
                      </h3>
                      {boletim.tipos_construcao && (
                        <Badge variant="secondary">
                          {boletim.tipos_construcao.nome}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <span>{boletim.nome_requerente}</span>
                        {boletim.cpf && (
                          <span className="ml-2 text-gray-500">
                            CPF: {boletim.cpf}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          Solicitação: {format(new Date(boletim.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          Vistoria: {format(new Date(boletim.data_vistoria), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500">
                        Criado em {format(new Date(boletim.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(boletim.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {canEdit(boletim) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(boletim.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}

                    {canDelete(boletim) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(boletim.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Paginação */}
      {boletins.length > 0 && (
        <div className="flex justify-center">
          <p className="text-sm text-gray-600">
            Mostrando {boletins.length} boletins
          </p>
        </div>
      )}
    </div>
  )
}

export default BoletinsList

