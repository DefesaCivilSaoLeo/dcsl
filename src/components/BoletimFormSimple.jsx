import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'

const BoletimFormSimple = ({ onSave, onCancel }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [numeroBoletim, setNumeroBoletim] = useState('1')
  const [anoBoletim, setAnoBoletim] = useState(new Date().getFullYear())

  const [formData, setFormData] = useState({
    uf: 'RS',
    municipio: 'São Leopoldo',
    nome_requerente: '',
    data_solicitacao: format(new Date(), 'yyyy-MM-dd'),
    horario_solicitacao: format(new Date(), 'HH:mm'),
    solicitacao: '',
    relatorio: '',
    data_vistoria: format(new Date(), 'yyyy-MM-dd'),
    feito_registro: false
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('Tentando salvar boletim com dados:', {
        ...formData,
        numero: numeroBoletim,
        ano: anoBoletim,
        created_by: user.id
      })

      // Criar novo boletim diretamente no Supabase
      const { data: boletim, error: createError } = await supabase
        .from('boletins')
        .insert([{
          ...formData,
          numero: parseInt(numeroBoletim),
          ano: anoBoletim,
          created_by: user.id
        }])
        .select()
        .single()

      if (createError) {
        console.error('Erro do Supabase:', createError)
        throw createError
      }

      console.log('Boletim criado com sucesso:', boletim)
      setSuccess('Boletim criado com sucesso!')
      
      if (onSave) {
        onSave(boletim)
      }
    } catch (error) {
      console.error('Erro ao salvar boletim:', error)
      setError(`Erro ao salvar boletim: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Superintendência Municipal de Defesa Civil
        </h1>
        <h2 className="text-lg font-semibold text-gray-700 mt-2">
          Auto de Constatação (Versão Simplificada)
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Boletim de Atendimento nº: {numeroBoletim}/{anoBoletim}
        </p>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* 1. Identificação */}
        <Card>
          <CardHeader>
            <CardTitle>1. Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  value={formData.uf}
                  onChange={(e) => handleInputChange('uf', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="municipio">Município</Label>
                <Input
                  id="municipio"
                  value={formData.municipio}
                  onChange={(e) => handleInputChange('municipio', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="nome_requerente">Nome do Requerente *</Label>
              <Input
                id="nome_requerente"
                value={formData.nome_requerente}
                onChange={(e) => handleInputChange('nome_requerente', e.target.value)}
                placeholder="Nome completo do requerente"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Data da Solicitação */}
        <Card>
          <CardHeader>
            <CardTitle>2. Data da Solicitação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data_solicitacao">Data *</Label>
                <Input
                  id="data_solicitacao"
                  type="date"
                  value={formData.data_solicitacao}
                  onChange={(e) => handleInputChange('data_solicitacao', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="horario_solicitacao">Horário *</Label>
                <Input
                  id="horario_solicitacao"
                  type="time"
                  value={formData.horario_solicitacao}
                  onChange={(e) => handleInputChange('horario_solicitacao', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="solicitacao">Solicitação *</Label>
              <Textarea
                id="solicitacao"
                value={formData.solicitacao}
                onChange={(e) => handleInputChange('solicitacao', e.target.value)}
                placeholder="Descreva detalhadamente a solicitação"
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Descrição das Constatações */}
        <Card>
          <CardHeader>
            <CardTitle>3. Descrição das Constatações no Atendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="relatorio">Relatório *</Label>
              <Textarea
                id="relatorio"
                value={formData.relatorio}
                onChange={(e) => handleInputChange('relatorio', e.target.value)}
                placeholder="Descreva detalhadamente as constatações realizadas durante o atendimento"
                rows={6}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* 4. Data da Vistoria */}
        <Card>
          <CardHeader>
            <CardTitle>4. Data da Vistoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="data_vistoria">Data da Vistoria *</Label>
              <Input
                id="data_vistoria"
                type="date"
                value={formData.data_vistoria}
                onChange={(e) => handleInputChange('data_vistoria', e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Boletim'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default BoletimFormSimple

