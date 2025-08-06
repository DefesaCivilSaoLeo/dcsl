import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  Calendar, 
  User, 
  MapPin, 
  Phone,
  FileText,
  Camera,
  AlertCircle,
  CheckCircle,
  X,
  Printer
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { boletinsAPI, fotosAPI, formatBoletimNumber } from '../lib/api'
import { useAuth } from '../hooks/useAuth.jsx'

const BoletimView = ({ boletimId, onEdit, onBack }) => {
  const { user, isAdmin } = useAuth()
  const [boletim, setBoletim] = useState(null)
  const [fotos, setFotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadingFotos, setLoadingFotos] = useState(false)

  useEffect(() => {
    if (boletimId) {
      loadBoletim()
    }
  }, [boletimId])

  const loadBoletim = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await boletinsAPI.getById(boletimId)
      setBoletim(data)

      // Carregar fotos se existirem
      if (data.feito_registro) {
        loadFotos()
      }
    } catch (error) {
      console.error('Erro ao carregar boletim:', error)
      setError('Erro ao carregar dados do boletim')
    } finally {
      setLoading(false)
    }
  }

  const loadFotos = async () => {
    setLoadingFotos(true)
    try {
      const fotosData = await fotosAPI.getByBoletimId(boletimId)
      
      // Obter URLs públicas das fotos
      const fotosComUrl = await Promise.all(
        fotosData.map(async (foto) => {
          const url = await fotosAPI.getPublicUrl(foto.url_storage)
          return { ...foto, publicUrl: url }
        })
      )
      
      setFotos(fotosComUrl)
    } catch (error) {
      console.error('Erro ao carregar fotos:', error)
    } finally {
      setLoadingFotos(false)
    }
  }

  const canEdit = () => {
    return isAdmin || boletim?.created_by === user?.id
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !boletim) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Boletim não encontrado'}
          </AlertDescription>
        </Alert>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:space-y-4">
      {/* Header - Oculto na impressão */}
      <div className="flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex space-x-2">
          {canEdit() && (
            <Button onClick={() => onEdit(boletim.id)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
        </div>
      </div>

      {/* Cabeçalho do Documento */}
      <div className="text-center print:mb-8">
        <h1 className="text-2xl font-bold text-gray-900 print:text-black">
          Superintendência Municipal de Defesa Civil
        </h1>
        <h2 className="text-lg font-semibold text-gray-700 mt-2 print:text-black">
          Auto de Constatação
        </h2>
        <p className="text-sm text-gray-600 mt-1 print:text-black">
          Boletim de Atendimento nº: {formatBoletimNumber(boletim.numero, boletim.ano)}
        </p>
      </div>

      {/* 1. Identificação */}
      <Card className="print:shadow-none print:border-gray-300">
        <CardHeader className="print:pb-2">
          <CardTitle className="print:text-black">1. Identificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 print:text-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
            <div>
              <span className="font-medium">UF:</span> {boletim.uf}
            </div>
            <div>
              <span className="font-medium">Município:</span> {boletim.municipio}
            </div>
          </div>
          
          <div>
            <span className="font-medium">Nome do Requerente:</span> {boletim.nome_requerente}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
            {boletim.cpf && (
              <div>
                <span className="font-medium">CPF:</span> {boletim.cpf}
              </div>
            )}
            {boletim.rg && (
              <div>
                <span className="font-medium">RG:</span> {boletim.rg}
              </div>
            )}
          </div>

          {boletim.data_nascimento && (
            <div>
              <span className="font-medium">Data de Nascimento:</span>{' '}
              {format(new Date(boletim.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })}
            </div>
          )}

          {boletim.endereco && (
            <div>
              <span className="font-medium">Endereço:</span> {boletim.endereco}
            </div>
          )}

          {boletim.telefone && (
            <div>
              <span className="font-medium">Telefone:</span> {boletim.telefone}
            </div>
          )}

          {boletim.observacoes_identificacao && (
            <div>
              <span className="font-medium">Observações:</span> {boletim.observacoes_identificacao}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Data da Solicitação */}
      <Card className="print:shadow-none print:border-gray-300">
        <CardHeader className="print:pb-2">
          <CardTitle className="print:text-black">2. Data da Solicitação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 print:text-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
            <div>
              <span className="font-medium">Data:</span>{' '}
              {format(new Date(boletim.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}
            </div>
            <div>
              <span className="font-medium">Horário:</span> {boletim.horario_solicitacao}
            </div>
          </div>

          <div>
            <span className="font-medium">Solicitação:</span>
            <p className="mt-1 whitespace-pre-wrap">{boletim.solicitacao}</p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Descrição das Constatações */}
      <Card className="print:shadow-none print:border-gray-300">
        <CardHeader className="print:pb-2">
          <CardTitle className="print:text-black">3. Descrição das Constatações no Atendimento</CardTitle>
        </CardHeader>
        <CardContent className="print:text-black">
          <div>
            <span className="font-medium">Relatório:</span>
            <p className="mt-1 whitespace-pre-wrap">{boletim.relatorio}</p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Tipo de Construção */}
      <Card className="print:shadow-none print:border-gray-300">
        <CardHeader className="print:pb-2">
          <CardTitle className="print:text-black">4. Tipo de Construção</CardTitle>
        </CardHeader>
        <CardContent className="print:text-black">
          <div>
            <span className="font-medium">Tipo:</span>{' '}
            {boletim.tipos_construcao?.nome || 'Não informado'}
          </div>
        </CardContent>
      </Card>

      {/* 5. Diagnóstico */}
      <Card className="print:shadow-none print:border-gray-300">
        <CardHeader className="print:pb-2">
          <CardTitle className="print:text-black">5. Diagnóstico</CardTitle>
        </CardHeader>
        <CardContent className="print:text-black">
          <div>
            <span className="font-medium">Diagnóstico:</span>
            <p className="mt-1 whitespace-pre-wrap">{boletim.diagnostico || 'Não informado'}</p>
          </div>
        </CardContent>
      </Card>

      {/* 6. Encaminhamento */}
      <Card className="print:shadow-none print:border-gray-300">
        <CardHeader className="print:pb-2">
          <CardTitle className="print:text-black">6. Encaminhamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 print:text-black">
          {boletim.boletim_encaminhamentos && boletim.boletim_encaminhamentos.length > 0 && (
            <div>
              <span className="font-medium">Encaminhamentos:</span>
              <ul className="mt-1 list-disc list-inside">
                {boletim.boletim_encaminhamentos.map((enc, index) => (
                  <li key={index}>{enc.encaminhamentos.nome}</li>
                ))}
              </ul>
            </div>
          )}

          {boletim.outros_encaminhamento && (
            <div>
              <span className="font-medium">Outros:</span>
              <p className="mt-1 whitespace-pre-wrap">{boletim.outros_encaminhamento}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7. Data da Vistoria */}
      <Card className="print:shadow-none print:border-gray-300">
        <CardHeader className="print:pb-2">
          <CardTitle className="print:text-black">7. Data da Vistoria</CardTitle>
        </CardHeader>
        <CardContent className="print:text-black">
          <div>
            <span className="font-medium">Data:</span>{' '}
            {format(new Date(boletim.data_vistoria), 'dd/MM/yyyy', { locale: ptBR })}
          </div>
        </CardContent>
      </Card>

      {/* 8. Registro Fotográfico */}
      <Card className="print:shadow-none print:border-gray-300">
        <CardHeader className="print:pb-2">
          <CardTitle className="print:text-black">8. Registro Fotográfico</CardTitle>
        </CardHeader>
        <CardContent className="print:text-black">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Feito registro:</span>
            {boletim.feito_registro ? (
              <Badge variant="default" className="print:bg-gray-200 print:text-black">
                <CheckCircle className="h-3 w-3 mr-1" />
                Sim
              </Badge>
            ) : (
              <Badge variant="secondary" className="print:bg-gray-100 print:text-black">
                <X className="h-3 w-3 mr-1" />
                Não
              </Badge>
            )}
          </div>

          {boletim.feito_registro && (
            <div className="mt-4">
              <Separator className="my-4" />
              <h4 className="font-medium mb-3 print:text-black">10. Registro Fotográfico</h4>
              
              {loadingFotos ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Carregando fotos...</p>
                </div>
              ) : fotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-2 print:gap-2">
                  {fotos.map((foto) => (
                    <div key={foto.id} className="space-y-2">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden print:border print:border-gray-300">
                        <img
                          src={foto.publicUrl}
                          alt={foto.nome_arquivo}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                        <div className="w-full h-full hidden items-center justify-center bg-gray-100">
                          <Camera className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 text-center print:text-black">
                        {foto.nome_arquivo}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 print:text-black">
                  Nenhuma foto encontrada
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 9. Responsável pela Vistoria */}
      <Card className="print:shadow-none print:border-gray-300">
        <CardHeader className="print:pb-2">
          <CardTitle className="print:text-black">9. Responsável pela Vistoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 print:text-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
            <div>
              <span className="font-medium">Responsável 1:</span>{' '}
              {boletim.responsaveis?.nome ? 
                `${boletim.responsaveis.nome} - ${boletim.responsaveis.cargo}` : 
                'Não informado'
              }
            </div>
            <div>
              <span className="font-medium">Responsável 2:</span>{' '}
              {boletim.responsaveis_2?.nome ? 
                `${boletim.responsaveis_2.nome} - ${boletim.responsaveis_2.cargo}` : 
                'Não informado'
              }
            </div>
          </div>

          {/* Espaço para assinaturas */}
          <div className="mt-8 print:mt-12">
            <p className="text-center text-sm text-gray-500 mb-6 print:text-black">
              Espaço para assinatura dos responsáveis
            </p>
            <div className="flex justify-between">
              <div className="text-center">
                <div className="border-t border-gray-300 w-48 mx-auto print:border-black"></div>
                <p className="mt-2 text-sm print:text-black">Responsável 1</p>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-300 w-48 mx-auto print:border-black"></div>
                <p className="mt-2 text-sm print:text-black">Responsável 2</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Criação - Oculto na impressão */}
      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="text-xs text-gray-500 text-center">
            <p>
              Boletim criado em {format(new Date(boletim.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </p>
            {boletim.updated_at !== boletim.created_at && (
              <p>
                Última atualização em {format(new Date(boletim.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BoletimView

