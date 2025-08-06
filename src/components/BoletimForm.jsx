import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
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
import { CalendarIcon, Upload, X, AlertCircle, Edit3 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { boletinsAPI, configAPI, fotosAPI, assinaturasAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth.jsx'
import SignaturePadComponent from './SignaturePad'

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
  data_nascimento: z.string().nullable().optional(),
  endereco_rua: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_complemento: z.string().optional(),
  bairro_id: z.string().optional(),
  telefone: z.string().optional(),
  observacoes_identificacao: z.string().optional(),

  // Data da Solicitação
  data_solicitacao: z.string().min(1, 'Data da solicitação é obrigatória'),
  horario_solicitacao: z.string().min(1, 'Horário da solicitação é obrigatório'),
  solicitacao: z.string().min(1, 'Solicitação é obrigatória'),

  // Descrição das Constatações
  relatorio: z.string().min(1, 'Relatório é obrigatório'),

  // Tipo de Construção
  tipo_construcao_id: z.string().optional(),

  // Diagnóstico
  diagnostico: z.string().optional(),



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
  const [bairros, setBairros] = useState([])
  const [camposObrigatorios, setCamposObrigatorios] = useState({})

  // Fotos
  const [fotos, setFotos] = useState([])
  const [uploadingFoto, setUploadingFoto] = useState(false)

  // Assinaturas
  const [assinaturas, setAssinaturas] = useState({
    solicitante: null,
    responsavel1: null,
    responsavel2: null
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isValid }
  } = useForm({
    resolver: zodResolver(boletimSchema),
    defaultValues: {
      uf: 'RS',
      municipio: 'São Leopoldo',
      data_solicitacao: format(new Date(), 'yyyy-MM-dd'),
      horario_solicitacao: format(new Date(), 'HH:mm'),
      data_vistoria: format(new Date(), 'yyyy-MM-dd'),
      feito_registro: false,
      encaminhamentos: [],
      bairro_id: '',
      tipo_construcao_id: '',
      responsavel1_id: '',
      responsavel2_id: ''
    }
  })

  const watchedEncaminhamentos = watch('encaminhamentos') || []
  const watchedFeitoRegistro = watch('feito_registro')
  const watchedUf = watch('uf')
  const watchedBairroId = watch('bairro_id')
  const watchedTipoConstrucaoId = watch('tipo_construcao_id')
  const watchedResponsavel1Id = watch('responsavel1_id')
  const watchedResponsavel2Id = watch('responsavel2_id')

  useEffect(() => {
    const initializeForm = async () => {
      await loadConfigData()
      if (!boletimId) {
        loadNextNumber()
      } else {
        loadBoletim()
      }
    }
    initializeForm()
  }, [boletimId])

  // Carregar assinaturas dos responsáveis quando selecionados
  useEffect(() => {
    const loadAssinaturasResponsaveis = async () => {
      // Certifica que responsaveis está carregado antes de tentar buscar assinaturas
      if (!responsaveis || responsaveis.length === 0) {
        return;
      }

      let updated = false;
      const newAssinaturas = { ...assinaturas };
      
      // Carregar assinatura do responsável 1
      if (watchedResponsavel1Id) {
        const resp1 = responsaveis.find(r => r.id === watchedResponsavel1Id);
        if (resp1 && resp1.assinatura) {
          try {
            const url = await assinaturasAPI.getPublicUrl(resp1.assinatura);
            if (newAssinaturas.responsavel1 !== url) {
              newAssinaturas.responsavel1 = url;
              updated = true;
            }
          } catch (error) {
            console.error("Erro ao carregar assinatura do responsável 1:", error);
            if (newAssinaturas.responsavel1 !== null) {
              newAssinaturas.responsavel1 = null;
              updated = true;
            }
          }
        } else {
          if (newAssinaturas.responsavel1 !== null) {
            newAssinaturas.responsavel1 = null;
            updated = true;
          }
        }
      } else {
        if (newAssinaturas.responsavel1 !== null) {
          newAssinaturas.responsavel1 = null;
          updated = true;
        }
      }
      
      // Carregar assinatura do responsável 2
      if (watchedResponsavel2Id) {
        const resp2 = responsaveis.find(r => r.id === watchedResponsavel2Id);
        if (resp2 && resp2.assinatura) {
          try {
            const url = await assinaturasAPI.getPublicUrl(resp2.assinatura);
            if (newAssinaturas.responsavel2 !== url) {
              newAssinaturas.responsavel2 = url;
              updated = true;
            }
          } catch (error) {
            console.error("Erro ao carregar assinatura do responsável 2:", error);
            if (newAssinaturas.responsavel2 !== null) {
              newAssinaturas.responsavel2 = null;
              updated = true;
            }
          }
        } else {
          if (newAssinaturas.responsavel2 !== null) {
            newAssinaturas.responsavel2 = null;
            updated = true;
          }
        }
      } else {
        if (newAssinaturas.responsavel2 !== null) {
          newAssinaturas.responsavel2 = null;
          updated = true;
        }
      }
      
      if (updated) {
        setAssinaturas(newAssinaturas);
      }
    };

    // Executar sempre que os IDs dos responsáveis ou a lista de responsáveis mudar
    if (responsaveis.length > 0) {
      loadAssinaturasResponsaveis();
    }
  }, [watchedResponsavel1Id, watchedResponsavel2Id, responsaveis]);

  const loadConfigData = async () => {
    try {
      const [tipos, encam, resp, bairrosData, campos] = await Promise.all([
        configAPI.getTiposConstrucao(),
        configAPI.getEncaminhamentos(),
        configAPI.getResponsaveis(),
        configAPI.getBairros(),
        configAPI.getCamposObrigatorios()
      ]);

      setTiposConstrucao(tipos);
      setEncaminhamentos(encam);
      setResponsaveis(resp);
      setBairros(bairrosData);
      setCamposObrigatorios(campos);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      setError("Erro ao carregar configurações do sistema");
    }
  };

  const loadNextNumber = async () => {
    try {
      const numero = await boletinsAPI.getNextNumber(anoBoletim);
      setNumeroBoletim(numero);
    } catch (error) {
      console.error("Erro ao buscar próximo número:", error);
    }
  };

  const loadBoletim = async () => {
    try {
      const boletim = await boletinsAPI.getById(boletimId);
      
      console.log("🔍 DEBUG: Valor feito_registro do banco:", boletim.feito_registro, typeof boletim.feito_registro);
      
      // Preencher formulário com dados do boletim
      Object.keys(boletim).forEach(key => {
        if (key === 'data_solicitacao' || key === 'data_vistoria' || key === 'data_nascimento') {
          setValue(key, boletim[key] ? format(new Date(boletim[key]), 'yyyy-MM-dd') : '');
        } else if (key === 'horario_solicitacao') {
          setValue(key, boletim[key] || '');
        } else if (key === 'boletim_encaminhamentos') {
          const encIds = boletim[key].map(enc => enc.encaminhamento_id);
          setValue('encaminhamentos', encIds);
        } else if (key === 'bairro_id' || key === 'tipo_construcao_id' || key === 'responsavel1_id' || key === 'responsavel2_id') {
          // Converter IDs para string para os Selects
          setValue(key, boletim[key] ? boletim[key].toString() : '');
        } else if (key === 'feito_registro') {
          // Converter para boolean
          const boolValue = Boolean(boletim[key]);
          console.log("🔍 DEBUG: Convertendo feito_registro para:", boolValue, typeof boolValue);
          setValue(key, boolValue);
        } else {
          setValue(key, boletim[key] || '');
        }
      });

      setNumeroBoletim(boletim.numero);
      setAnoBoletim(boletim.ano);
      setFotos(boletim.fotos || []);

      // Carregar assinaturas do solicitante
      const assinaturasData = {};
      if (boletim.assinatura_solicitante) {
        assinaturasData.solicitante = await assinaturasAPI.getPublicUrl(boletim.assinatura_solicitante);
      }
      
      // As assinaturas dos responsáveis serão carregadas pelo useEffect que monitora os IDs
      setAssinaturas(assinaturasData);
    } catch (error) {
      console.error("Erro ao carregar boletim:", error);
      setError("Erro ao carregar dados do boletim");
    }
  };

  const handleEncaminhamentoChange = (encaminhamentoId, checked) => {
    const current = watchedEncaminhamentos
    if (checked) {
      const newValue = [...current, encaminhamentoId];
      setValue('encaminhamentos', newValue)
    } else {
      const newValue = current.filter(id => id !== encaminhamentoId);
      setValue('encaminhamentos', newValue)
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

  // Funções para manipular assinaturas
  const handleSaveAssinatura = async (tipo, dataURL) => {
    try {
      console.log("🔍 DEBUG: handleSaveAssinatura - boletimId:", boletimId, "tipo:", typeof boletimId);
      if (boletimId) {
        // Se já existe boletim, salvar assinatura
        await assinaturasAPI.save(boletimId, tipo, dataURL)
        setAssinaturas(prev => ({
          ...prev,
          [tipo]: dataURL
        }))
        setSuccess(`Assinatura ${tipo} salva com sucesso`)
      } else {
        // Se é novo boletim, armazenar temporariamente
        setAssinaturas(prev => ({
          ...prev,
          [tipo]: dataURL
        }))
        setSuccess(`Assinatura ${tipo} será salva ao criar o boletim`)
      }
    } catch (error) {
      setError(`Erro ao salvar assinatura ${tipo}`)
    }
  }

  const onSubmit = async (data) => {
    console.log("🚀 DEBUG: onSubmit INICIADO!");
    console.log("📝 DEBUG: Dados recebidos:", data);
    console.log("❌ DEBUG: Erros de validação:", errors);
    console.log("🔍 DEBUG: boletimId:", boletimId);
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { data_nascimento, ...boletimData } = data

      const finalBoletimData = {
        ...boletimData,
        data_nascimento: data_nascimento === '' ? null : data_nascimento,
        bairro_id: boletimData.bairro_id === '' ? null : parseInt(boletimData.bairro_id),
        tipo_construcao_id: boletimData.tipo_construcao_id === '' ? null : parseInt(boletimData.tipo_construcao_id),
        responsavel1_id: boletimData.responsavel1_id === '' ? null : boletimData.responsavel1_id,
        responsavel2_id: boletimData.responsavel2_id === '' ? null : boletimData.responsavel2_id,
      }

      console.log("🔍 DEBUG: finalBoletimData.responsavel1_id:", finalBoletimData.responsavel1_id, "tipo:", typeof finalBoletimData.responsavel1_id);
      console.log("🔍 DEBUG: finalBoletimData.responsavel2_id:", finalBoletimData.responsavel2_id, "tipo:", typeof finalBoletimData.responsavel2_id);

      let boletim;
      if (boletimId) {
        // Atualizar boletim existente
        console.log("🔍 DEBUG: Chamando boletinsAPI.update com boletimId:", boletimId, "e tipo:", typeof boletimId);
        boletim = await boletinsAPI.update(boletimId, {
          ...finalBoletimData,
          created_by: user.id
        })
      } else {
        // Verificar se o boletim com o mesmo número e ano já existe
        const exists = await boletinsAPI.checkIfExists(parseInt(numeroBoletim), anoBoletim)
        if (exists) {
          setError("Já existe um boletim com este número e ano. Por favor, escolha outro número ou ano.")
          setLoading(false)
          return
        }

        // Criar novo boletim
        boletim = await boletinsAPI.create({
          ...finalBoletimData,
          numero: parseInt(numeroBoletim),
          ano: anoBoletim,
          created_by: user.id
        })

        // Upload das fotos temporárias
        for (const foto of fotos.filter(f => f.isTemp)) {
          await fotosAPI.upload(boletim.id, foto.file, user.id)
        }

        // Salvar assinaturas temporárias
        for (const [tipo, dataURL] of Object.entries(assinaturas)) {
          if (dataURL && typeof dataURL === 'string' && dataURL.startsWith('data:')) {
            await assinaturasAPI.save(boletim.id, tipo, dataURL)
          }
        }
      }

      console.log("🔍 DEBUG ENCAMINHAMENTOS:");
      console.log("  - boletim.id:", boletim.id, "tipo:", typeof boletim.id);
      console.log("  - watchedEncaminhamentos:", watchedEncaminhamentos, "tipo:", typeof watchedEncaminhamentos);
      console.log("  - watchedEncaminhamentos.length:", watchedEncaminhamentos?.length);
      
      if (watchedEncaminhamentos && watchedEncaminhamentos.length > 0) {
        console.log("🔍 DEBUG: Chamando removeEncaminhamentos com boletim.id:", boletim.id);
        await boletinsAPI.removeEncaminhamentos(boletim.id)
        console.log("🔍 DEBUG: Chamando addEncaminhamentos com:", { boletimId: boletim.id, encaminhamentos: watchedEncaminhamentos });
        await boletinsAPI.addEncaminhamentos(boletim.id, watchedEncaminhamentos)
      } else {
        console.log("🔍 DEBUG: Chamando apenas removeEncaminhamentos com boletim.id:", boletim.id);
        await boletinsAPI.removeEncaminhamentos(boletim.id)
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



      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 1. Identificação */}
        <Card>
          <CardHeader>
            <CardTitle>1. Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero">Número do Boletim</Label>
                <Input
                  id="numero"
                  type="number"
                  value={numeroBoletim}
                  onChange={(e) => setNumeroBoletim(e.target.value)}
                  disabled={boletimId ? true : false}
                />
              </div>
              <div>
                <Label htmlFor="ano">Ano do Boletim</Label>
                <Input
                  id="ano"
                  type="number"
                  value={anoBoletim}
                  onChange={(e) => setAnoBoletim(e.target.value)}
                  disabled={boletimId ? true : false}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="uf">UF</Label>
                <Select onValueChange={(value) => setValue('uf', value)} value={watchedUf}>
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
              <Label htmlFor="endereco_rua">Endereço</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="endereco_rua" className="text-sm text-gray-600">Rua/Avenida</Label>
                  <Input
                    id="endereco_rua"
                    {...register('endereco_rua')}
                    placeholder="Nome da rua/avenida"
                  />
                </div>
                <div>
                  <Label htmlFor="endereco_numero" className="text-sm text-gray-600">Número</Label>
                  <Input
                    id="endereco_numero"
                    {...register('endereco_numero')}
                    placeholder="Número"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="endereco_complemento" className="text-sm text-gray-600">Complemento</Label>
                  <Input
                    id="endereco_complemento"
                    {...register('endereco_complemento')}
                    placeholder="Apto, casa, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="bairro_id" className="text-sm text-gray-600">Bairro</Label>
                  <Controller
                    name="bairro_id"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o bairro" />
                        </SelectTrigger>
                        <SelectContent>
                          {bairros.map((bairro) => (
                            <SelectItem key={bairro.id} value={bairro.id.toString()}>
                              {bairro.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
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
              <Controller
                name="tipo_construcao_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de construção" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposConstrucao.map(tipo => (
                        <SelectItem key={tipo.id} value={tipo.id}>{tipo.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
                placeholder="Diagnóstico da situação"
                rows={3}
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
            <div className="space-y-2">
              {encaminhamentos.map(encaminhamento => (
                <div key={encaminhamento.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`enc_${encaminhamento.id}`}
                    checked={watchedEncaminhamentos.includes(encaminhamento.id)}
                    onCheckedChange={(checked) => handleEncaminhamentoChange(encaminhamento.id, checked)}
                  />
                  <Label htmlFor={`enc_${encaminhamento.id}`}>{encaminhamento.nome}</Label>
                </div>
              ))}
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
              <Label htmlFor="data_vistoria">Data *</Label>
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
            <div>
              <Label>Feito registro?</Label>
              <Controller
                name="feito_registro"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value ? 'sim' : 'nao'}
                    onValueChange={(value) => field.onChange(value === 'sim')}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sim" id="registro_sim" />
                      <Label htmlFor="registro_sim">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="registro_nao" />
                      <Label htmlFor="registro_nao">Não</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            {watchedFeitoRegistro && (
              <div className="space-y-4">
                <Separator />
                <h4 className="font-medium">10. Registro Fotográfico</h4>
                
                <div>
                  <Label htmlFor="foto_upload">Adicionar Fotos</Label>
                  <Input
                    id="foto_upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFotoUpload}
                    disabled={uploadingFoto}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo 2MB por foto. Formatos: JPG, PNG, WebP
                  </p>
                </div>

                {fotos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {fotos.map((foto) => (
                      <div key={foto.id} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          {foto.isTemp ? (
                            <img
                              src={URL.createObjectURL(foto.file)}
                              alt={foto.nome_arquivo}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-xs text-gray-500 text-center p-2">
                                {foto.nome_arquivo}
                              </span>
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveFoto(foto)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 9. Responsável pela Vistoria */}
        <Card>
          <CardHeader>
            <CardTitle>9. Responsável pela Vistoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="responsavel1_id">Responsável 1</Label>
                <Controller
                  name="responsavel1_id"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {responsaveis.map(responsavel => (
                          <SelectItem key={responsavel.id} value={responsavel.id}>
                            {responsavel.nome} - {responsavel.cargo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="responsavel2_id">Responsável 2</Label>
                <Controller
                  name="responsavel2_id"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {responsaveis.map(responsavel => (
                          <SelectItem key={responsavel.id} value={responsavel.id}>
                            {responsavel.nome} - {responsavel.cargo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Assinaturas */}
            <div className="space-y-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900">Assinaturas</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Assinatura do Solicitante - sempre editável */}
                <SignaturePadComponent
                  title="Assinatura do Solicitante"
                  onSave={(dataURL) => handleSaveAssinatura("solicitante", dataURL)}
                  initialSignature={assinaturas.solicitante}
                  disabled={loading}
                />
                
                {/* Assinatura do Responsável 1 - apenas exibição */}
                {watchedResponsavel1Id && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Assinatura do Responsável 1</Label>
                    <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px] flex items-center justify-center">
                      {assinaturas.responsavel1 ? (
                        <img 
                          src={assinaturas.responsavel1} 
                          alt="Assinatura do Responsável 1" 
                          className="max-w-full max-h-[180px] object-contain"
                        />
                      ) : (
                        <p className="text-gray-500 text-sm">Assinatura não encontrada</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Assinatura do Responsável 2 - apenas exibição */}
                {watchedResponsavel2Id && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Assinatura do Responsável 2</Label>
                    <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px] flex items-center justify-center">
                      {assinaturas.responsavel2 ? (
                        <img 
                          src={assinaturas.responsavel2} 
                          alt="Assinatura do Responsável 2" 
                          className="max-w-full max-h-[180px] object-contain"
                        />
                      ) : (
                        <p className="text-gray-500 text-sm">Assinatura não encontrada</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={loading}
            onClick={() => {
              console.log("🔥 BOTÃO CLICADO!");
              console.log("✅ Formulário válido?", isValid);
              console.log("❌ Erros atuais:", errors);
              console.log("🔍 Erro feito_registro:", errors.feito_registro);
              console.log("📋 Dados atuais do formulário:", watch());
            }}
          >
            {loading ? 'Salvando...' : (boletimId ? 'Atualizar Boletim' : 'Criar Boletim')}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default BoletimForm




