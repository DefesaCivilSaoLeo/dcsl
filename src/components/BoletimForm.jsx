import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { CalendarIcon, Upload, X, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { boletinsAPI, configAPI, fotosAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth.jsx'

// Estados do Brasil
const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

// Schema de validação
const boletimSchema = z.object({
  // Identificação
  uf: z.string().min(2, 'UF é obrigatório'),
  municipio: z.string().min(1, 'Município é obrigatório'),
  nome_requerente: z.string().min(1, 'Nome do requerente é obrigatório'),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  data_nascimento: z.string().optional(),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  observacoes_identificacao: z.string().optional(),

  // Data da Solicitação
  data_solicitacao: z.string().min(1, 'Data da solicitação é obrigatória'),
  horario_solicitacao: z.string().min(1, 'Horário da solicitação é obrigatório'),
  solicitacao: z.string().min(1, 'Descrição da solicitação é obrigatória'),

  // Descrição das Constatações
  relatorio: z.string().min(1, 'Relatório é obrigatório'),

  // Tipo de Construção
  tipo_construcao_id: z.string().optional(),

  // Diagnóstico
  diagnostico: z.string().optional(),

  // Encaminhamento
  encaminhamentos: z.array(z.string()).optional(),
  outros_encaminhamento: z.string().optional(),

  // Data da Vistoria
  data_vistoria: z.string().min(1, 'Data da vistoria é obrigatória'),

  // Registro Fotográfico
  feito_registro: z.boolean().default(false),

  // Responsáveis
  responsavel1_id: z.string().optional(),
  responsavel2_id: z.string().optional()
})

const BoletimForm = ({ boletimId, onSave, onCancel }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [numeroBoletim, setNumeroBoletim] = useState('')
  const [anoBoletim, setAnoBoletim] = useState(new Date().getFullYear())

  // Dados de configuração
  const [tiposConstrucao, setTiposConstrucao] = useState([])
  const [encaminhamentos, setEncaminhamentos] = useState([])
  const [responsaveis, setResponsaveis] = useState([])
  const [camposObrigatorios, setCamposObrigatorios] = useState({})

  // Fotos
  const [fotos, setFotos] = useState([])
  const [uploadingFoto, setUploadingFoto] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(boletimSchema),
    defaultValues: {
      uf: 'RS',
      municipio: 'São Leopoldo',
      data_solicitacao: format(new Date(), 'yyyy-MM-dd'),
      horario_solicitacao: format(new Date(), 'HH:mm'),
      data_vistoria: format(new Date(), 'yyyy-MM-dd'),
      feito_registro: false,
      encaminhamentos: []
    }
  })

  const watchedEncaminhamentos = watch('encaminhamentos') || []
  const watchedFeitoRegistro = watch('feito_registro')

  useEffect(() => {
    loadConfigData()
    if (!boletimId) {
      loadNextNumber()
    } else {
      loadBoletim()
    }
  }, [boletimId])

  const loadConfigData = async () => {
    try {
      const [tipos, encam, resp, campos] = await Promise.all([
        configAPI.getTiposConstrucao(),
        configAPI.getEncaminhamentos(),
        configAPI.getResponsaveis(),
        configAPI.getCamposObrigatorios()
      ])

      setTiposConstrucao(tipos)
      setEncaminhamentos(encam)
      setResponsaveis(resp)
      setCamposObrigatorios(campos)
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      setError('Erro ao carregar configurações do sistema')
    }
  }

  const loadNextNumber = async () => {
    try {
      const numero = await boletinsAPI.getNextNumber(anoBoletim)
      setNumeroBoletim(numero)
    } catch (error) {
      console.error('Erro ao buscar próximo número:', error)
    }
  }

  const loadBoletim = async () => {
    try {
      const boletim = await boletinsAPI.getById(boletimId)
      
      // Preencher formulário com dados do boletim
      Object.keys(boletim).forEach(key => {
        if (key === 'data_solicitacao' || key === 'data_vistoria' || key === 'data_nascimento') {
          setValue(key, boletim[key] ? format(new Date(boletim[key]), 'yyyy-MM-dd') : '')
        } else if (key === 'horario_solicitacao') {
          setValue(key, boletim[key] || '')
        } else if (key === 'boletim_encaminhamentos') {
          const encIds = boletim[key].map(enc => enc.encaminhamentos.id)
          setValue('encaminhamentos', encIds)
        } else {
          setValue(key, boletim[key] || '')
        }
      })

      setNumeroBoletim(boletim.numero)
      setAnoBoletim(boletim.ano)
      setFotos(boletim.fotos || [])
    } catch (error) {
      console.error('Erro ao carregar boletim:', error)
      setError('Erro ao carregar dados do boletim')
    }
  }

  const handleEncaminhamentoChange = (encaminhamentoId, checked) => {
    const current = watchedEncaminhamentos
    if (checked) {
      setValue('encaminhamentos', [...current, encaminhamentoId])
    } else {
      setValue('encaminhamentos', current.filter(id => id !== encaminhamentoId))
    }
  }

  const handleFotoUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    setUploadingFoto(true)
    try {
      for (const file of files) {
        // Validar tamanho (2MB)
        if (file.size > 2 * 1024 * 1024) {
          throw new Error(`Arquivo ${file.name} é muito grande. Máximo 2MB.`)
        }

        // Validar tipo
        if (!file.type.startsWith('image/')) {
          throw new Error(`Arquivo ${file.name} não é uma imagem válida.`)
        }

        // Se estamos editando um boletim existente, fazer upload
        if (boletimId) {
          const foto = await fotosAPI.upload(boletimId, file, user.id)
          setFotos(prev => [...prev, foto])
        } else {
          // Se é um novo boletim, apenas adicionar à lista temporária
          const fotoTemp = {
            id: Date.now() + Math.random(),
            nome_arquivo: file.name,
            file: file,
            isTemp: true
          }
          setFotos(prev => [...prev, fotoTemp])
        }
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setUploadingFoto(false)
      event.target.value = ''
    }
  }

  const handleRemoveFoto = async (foto) => {
    try {
      if (foto.isTemp) {
        // Remover foto temporária
        setFotos(prev => prev.filter(f => f.id !== foto.id))
      } else {
        // Remover foto do servidor
        await fotosAPI.delete(foto.id)
        setFotos(prev => prev.filter(f => f.id !== foto.id))
      }
    } catch (error) {
      setError('Erro ao remover foto')
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Limpar campos UUID vazios ou inválidos
      const cleanedData = { ...data }
      
      // Campos UUID que devem ser null se estiverem vazios
      const uuidFields = ['tipo_construcao_id', 'responsavel1_id', 'responsavel2_id']
      uuidFields.forEach(field => {
        if (!cleanedData[field] || cleanedData[field] === '') {
          cleanedData[field] = null
        }
      })

      // Remover campos que não devem ser enviados para o banco
      delete cleanedData.encaminhamentos

      let boletim

      if (boletimId) {
        // Atualizar boletim existente
        boletim = await boletinsAPI.update(boletimId, {
          ...cleanedData,
          created_by: user.id
        })
      } else {
        // Criar novo boletim
        boletim = await boletinsAPI.create({
          ...cleanedData,
          numero: numeroBoletim,
          ano: anoBoletim,
          created_by: user.id
        })

        // Upload das fotos temporárias
        for (const foto of fotos.filter(f => f.isTemp)) {
          await fotosAPI.upload(boletim.id, foto.file, user.id)
        }
      }

      // Gerenciar encaminhamentos
      if (data.encaminhamentos && data.encaminhamentos.length > 0) {
        await boletinsAPI.removeEncaminhamentos(boletim.id)
        await boletinsAPI.addEncaminhamentos(boletim.id, data.encaminhamentos)
      }

      setSuccess(boletimId ? 'Boletim atualizado com sucesso!' : 'Boletim criado com sucesso!')
      
      if (onSave) {
        onSave(boletim)
      }
    } catch (error) {
      console.error('Erro ao salvar boletim:', error)
      setError('Erro ao salvar boletim. Tente novamente.')
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
          Auto de Constatação
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 1. Identificação */}
        <Card>
          <CardHeader>
            <CardTitle>1. Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="uf">UF</Label>
                <Select onValueChange={(value) => setValue('uf', value)} defaultValue="RS">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BRASIL.map(estado => (
                      <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.uf && <p className="text-sm text-red-500">{errors.uf.message}</p>}
              </div>

              <div>
                <Label htmlFor="municipio">Município</Label>
                <Input
                  id="municipio"
                  {...register('municipio')}
                  placeholder="São Leopoldo"
                />
                {errors.municipio && <p className="text-sm text-red-500">{errors.municipio.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="nome_requerente">Nome do Requerente *</Label>
              <Input
                id="nome_requerente"
                {...register('nome_requerente')}
                placeholder="Nome completo do requerente"
              />
              {errors.nome_requerente && <p className="text-sm text-red-500">{errors.nome_requerente.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  {...register('cpf')}
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  {...register('rg')}
                  placeholder="0000000000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                {...register('data_nascimento')}
              />
            </div>

            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                {...register('endereco')}
                placeholder="Endereço completo"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone para Contato</Label>
              <Input
                id="telefone"
                {...register('telefone')}
                placeholder="(51) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="observacoes_identificacao">Observações</Label>
              <Textarea
                id="observacoes_identificacao"
                {...register('observacoes_identificacao')}
                placeholder="Observações adicionais sobre a identificação"
                rows={2}
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
                  {...register('data_solicitacao')}
                />
                {errors.data_solicitacao && <p className="text-sm text-red-500">{errors.data_solicitacao.message}</p>}
              </div>

              <div>
                <Label htmlFor="horario_solicitacao">Horário *</Label>
                <Input
                  id="horario_solicitacao"
                  type="time"
                  {...register('horario_solicitacao')}
                />
                {errors.horario_solicitacao && <p className="text-sm text-red-500">{errors.horario_solicitacao.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="solicitacao">Solicitação *</Label>
              <Textarea
                id="solicitacao"
                {...register('solicitacao')}
                placeholder="Descreva detalhadamente a solicitação"
                rows={4}
              />
              {errors.solicitacao && <p className="text-sm text-red-500">{errors.solicitacao.message}</p>}
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
                {...register('relatorio')}
                placeholder="Descreva detalhadamente as constatações realizadas durante o atendimento"
                rows={6}
              />
              {errors.relatorio && <p className="text-sm text-red-500">{errors.relatorio.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* 4. Tipo de Construção */}
        <Card>
          <CardHeader>
            <CardTitle>4. Tipo de Construção</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="tipo_construcao_id">Tipo</Label>
              <Select
                onValueChange={(value) => setValue('tipo_construcao_id', value)}
                value={watch('tipo_construcao_id') || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de construção" />
                </SelectTrigger>
                <SelectContent>
                  {tiposConstrucao.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id}>{tipo.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tipo_construcao_id && <p className="text-sm text-red-500">{errors.tipo_construcao_id.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* 5. Diagnóstico */}
        <Card>
          <CardHeader>
            <CardTitle>5. Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="diagnostico">Diagnóstico</Label>
              <Textarea
                id="diagnostico"
                {...register('diagnostico')}
                placeholder="Descreva o diagnóstico da situação"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* 6. Encaminhamento */}
        <Card>
          <CardHeader>
            <CardTitle>6. Encaminhamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>Encaminhamentos</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {encaminhamentos.map(enc => (
                <div key={enc.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`encaminhamento-${enc.id}`}
                    checked={watchedEncaminhamentos.includes(enc.id)}
                    onCheckedChange={(checked) => handleEncaminhamentoChange(enc.id, checked)}
                  />
                  <Label htmlFor={`encaminhamento-${enc.id}`}>{enc.nome}</Label>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Label htmlFor="outros_encaminhamento">Outros</Label>
              <Input
                id="outros_encaminhamento"
                {...register('outros_encaminhamento')}
                placeholder="Especifique outros encaminhamentos"
              />
            </div>
          </CardContent>
        </Card>

        {/* 7. Data da Vistoria */}
        <Card>
          <CardHeader>
            <CardTitle>7. Data da Vistoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="data_vistoria">Data da Vistoria *</Label>
              <Input
                id="data_vistoria"
                type="date"
                {...register('data_vistoria')}
              />
              {errors.data_vistoria && <p className="text-sm text-red-500">{errors.data_vistoria.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* 8. Registro Fotográfico */}
        <Card>
          <CardHeader>
            <CardTitle>8. Registro Fotográfico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="feito_registro"
                checked={watchedFeitoRegistro}
                onCheckedChange={(checked) => setValue('feito_registro', checked)}
              />
              <Label htmlFor="feito_registro">Foi feito registro fotográfico?</Label>
            </div>

            {watchedFeitoRegistro && (
              <div className="space-y-4">
                <Label htmlFor="fotos">Upload de Fotos</Label>
                <Input
                  id="fotos"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFotoUpload}
                  disabled={uploadingFoto}
                />
                {uploadingFoto && <p className="text-sm text-gray-500">Enviando fotos...</p>}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {fotos.map((foto, index) => (
                    <div key={foto.id || index} className="relative group">
                      <img
                        src={foto.url_storage ? fotosAPI.getPublicUrl(foto.url_storage) : URL.createObjectURL(foto.file)}
                        alt={foto.nome_arquivo}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveFoto(foto)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 9. Responsáveis */}
        <Card>
          <CardHeader>
            <CardTitle>9. Responsáveis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="responsavel1_id">Responsável 1</Label>
              <Select
                onValueChange={(value) => setValue('responsavel1_id', value)}
                value={watch('responsavel1_id') || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {responsaveis.map(resp => (
                    <SelectItem key={resp.id} value={resp.id}>{resp.nome} ({resp.cargo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="responsavel2_id">Responsável 2</Label>
              <Select
                onValueChange={(value) => setValue('responsavel2_id', value)}
                value={watch('responsavel2_id') || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {responsaveis.map(resp => (
                    <SelectItem key={resp.id} value={resp.id}>{resp.nome} ({resp.cargo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : (boletimId ? 'Atualizar Boletim' : 'Criar Boletim')}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default BoletimForm


