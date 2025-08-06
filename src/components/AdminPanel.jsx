import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Switch } from './ui/switch'
import { 
  Users, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  AlertCircle,
  CheckCircle,
  Building,
  ArrowRight,
  UserCheck,
  MapPin
} from 'lucide-react'
import { adminAPI, configAPI, assinaturasAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth.jsx'
import SignaturePadComponent from './SignaturePad'

const AdminPanel = () => {
  const { user, isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Estados para usuários
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  // Estados para configurações
  const [tiposConstrucao, setTiposConstrucao] = useState([])
  const [encaminhamentos, setEncaminhamentos] = useState([])
  const [responsaveis, setResponsaveis] = useState([])
  const [bairros, setBairros] = useState([])
  const [camposObrigatorios, setCamposObrigatorios] = useState({})

  // Estados para formulários
  const [newTipoConstrucao, setNewTipoConstrucao] = useState('')
  const [newEncaminhamento, setNewEncaminhamento] = useState('')
  const [newResponsavel, setNewResponsavel] = useState({ nome: '', cargo: '' })

  // Estados para bairros
  const [newBairro, setNewBairro] = useState('')
  const [editingBairro, setEditingBairro] = useState(null)

  // Estados para assinaturas de responsáveis
  const [assinaturasResponsaveis, setAssinaturasResponsaveis] = useState({})

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin])

  const loadData = async () => {
    try {
      const [usersData, tiposData, encamData, respData, bairrosData, camposData] = await Promise.all([
        adminAPI.getUsers(),
        configAPI.getTiposConstrucao(),
        configAPI.getEncaminhamentos(),
        configAPI.getResponsaveis(),
        adminAPI.getAllBairros(),
        configAPI.getCamposObrigatorios()
      ])

      setUsers(usersData)
      setTiposConstrucao(tiposData)
      setEncaminhamentos(encamData)
      setResponsaveis(respData)
      setBairros(bairrosData)
      setCamposObrigatorios(camposData)

      // Carregar assinaturas dos responsáveis
      const assinaturasData = {}
      for (const responsavel of respData) {
        if (responsavel.assinatura) {
          assinaturasData[responsavel.id] = await assinaturasAPI.getPublicUrl(responsavel.assinatura)
        }
      }
      setAssinaturasResponsaveis(assinaturasData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro ao carregar dados administrativos')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      setSuccess('Função do usuário atualizada com sucesso')
    } catch (error) {
      setError('Erro ao atualizar função do usuário')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
      return
    }

    try {
      await adminAPI.deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setSuccess('Usuário excluído com sucesso')
    } catch (error) {
      setError('Erro ao excluir usuário')
    }
  }

  const handleCreateTipoConstrucao = async () => {
    if (!newTipoConstrucao.trim()) return

    try {
      const tipo = await adminAPI.createTipoConstrucao(newTipoConstrucao)
      setTiposConstrucao(prev => [...prev, tipo])
      setNewTipoConstrucao('')
      setSuccess('Tipo de construção criado com sucesso')
    } catch (error) {
      setError('Erro ao criar tipo de construção')
    }
  }

  const handleDeleteTipoConstrucao = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este tipo de construção?')) {
      return
    }

    try {
      await adminAPI.deleteTipoConstrucao(id)
      setTiposConstrucao(prev => prev.filter(t => t.id !== id))
      setSuccess('Tipo de construção excluído com sucesso')
    } catch (error) {
      setError('Erro ao excluir tipo de construção')
    }
  }

  const handleCreateEncaminhamento = async () => {
    if (!newEncaminhamento.trim()) return

    try {
      const enc = await adminAPI.createEncaminhamento(newEncaminhamento)
      setEncaminhamentos(prev => [...prev, enc])
      setNewEncaminhamento('')
      setSuccess('Encaminhamento criado com sucesso')
    } catch (error) {
      setError('Erro ao criar encaminhamento')
    }
  }

  const handleDeleteEncaminhamento = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este encaminhamento?')) {
      return
    }

    try {
      await adminAPI.deleteEncaminhamento(id)
      setEncaminhamentos(prev => prev.filter(e => e.id !== id))
      setSuccess('Encaminhamento excluído com sucesso')
    } catch (error) {
      setError('Erro ao excluir encaminhamento')
    }
  }

  const handleCreateResponsavel = async () => {
    if (!newResponsavel.nome.trim() || !newResponsavel.cargo.trim()) return

    try {
      const resp = await adminAPI.createResponsavel(newResponsavel.nome, newResponsavel.cargo)
      setResponsaveis(prev => [...prev, resp])
      setNewResponsavel({ nome: '', cargo: '' })
      setSuccess('Responsável criado com sucesso')
    } catch (error) {
      setError('Erro ao criar responsável')
    }
  }

  const handleDeleteResponsavel = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este responsável?')) {
      return
    }

    try {
      await adminAPI.deleteResponsavel(id)
      setResponsaveis(prev => prev.filter(r => r.id !== id))
      setSuccess('Responsável excluído com sucesso')
    } catch (error) {
      setError('Erro ao excluir responsável')
    }
  }

  const handleUpdateCampoObrigatorio = async (campo, obrigatorio) => {
    try {
      await adminAPI.updateCampoObrigatorio(campo, obrigatorio)
      setCamposObrigatorios(prev => ({ ...prev, [campo]: obrigatorio }))
      setSuccess('Configuração de campo atualizada')
    } catch (error) {
      setError('Erro ao atualizar configuração de campo')
    }
  }

  // Funções para gerenciar bairros
  const handleCreateBairro = async () => {
    if (!newBairro.trim()) return

    try {
      const bairro = await adminAPI.createBairro(newBairro)
      setBairros(prev => [...prev, bairro])
      setNewBairro('')
      setSuccess('Bairro criado com sucesso')
    } catch (error) {
      setError('Erro ao criar bairro')
    }
  }

  const handleUpdateBairro = async (id, nome) => {
    try {
      const bairro = await adminAPI.updateBairro(id, nome)
      setBairros(prev => prev.map(b => b.id === id ? bairro : b))
      setEditingBairro(null)
      setSuccess('Bairro atualizado com sucesso')
    } catch (error) {
      setError('Erro ao atualizar bairro')
    }
  }

  const handleDeleteBairro = async (id) => {
    if (!window.confirm('Tem certeza que deseja desativar este bairro?')) {
      return
    }

    try {
      await adminAPI.deleteBairro(id)
      setBairros(prev => prev.map(b => b.id === id ? { ...b, ativo: false } : b))
      setSuccess('Bairro desativado com sucesso')
    } catch (error) {
      setError('Erro ao desativar bairro')
    }
  }

  // Funções para gerenciar assinaturas de responsáveis
  const handleSaveAssinaturaResponsavel = async (responsavelId, dataURL) => {
    try {
      await adminAPI.saveAssinaturaResponsavel(responsavelId, dataURL)
      setAssinaturasResponsaveis(prev => ({
        ...prev,
        [responsavelId]: dataURL
      }))
      setSuccess('Assinatura do responsável salva com sucesso')
    } catch (error) {
      setError('Erro ao salvar assinatura do responsável')
    }
  }

  const handleDeleteAssinaturaResponsavel = async (responsavelId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta assinatura?')) {
      return
    }

    try {
      await adminAPI.deleteAssinaturaResponsavel(responsavelId)
      setAssinaturasResponsaveis(prev => {
        const newState = { ...prev }
        delete newState[responsavelId]
        return newState
      })
      setSuccess('Assinatura do responsável excluída com sucesso')
    } catch (error) {
      setError('Erro ao excluir assinatura do responsável')
    }
  }

  const handleToggleBairroAtivo = async (id, ativo) => {
    try {
      const bairro = await adminAPI.toggleBairroAtivo(id, ativo)
      setBairros(prev => prev.map(b => b.id === id ? bairro : b))
      setSuccess(`Bairro ${ativo ? 'ativado' : 'desativado'} com sucesso`)
    } catch (error) {
      setError('Erro ao alterar status do bairro')
    }
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas administradores podem acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-gray-600">Gerencie usuários e configurações do sistema</p>
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
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Aba de Usuários */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>
                Visualize e gerencie as permissões dos usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((userItem) => (
                    <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {userItem.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{userItem.name}</h4>
                          <p className="text-sm text-gray-600">{userItem.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <Badge variant={userItem.role === 'admin' ? 'default' : 'secondary'}>
                          {userItem.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </Badge>

                        {userItem.id !== user.id && (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateUserRole(
                                userItem.id, 
                                userItem.role === 'admin' ? 'user' : 'admin'
                              )}
                            >
                              {userItem.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(userItem.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Configurações */}
        <TabsContent value="config" className="space-y-6">
          {/* Tipos de Construção */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Construção</CardTitle>
              <CardDescription>
                Gerencie os tipos de construção disponíveis nos formulários
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Novo tipo de construção"
                  value={newTipoConstrucao}
                  onChange={(e) => setNewTipoConstrucao(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateTipoConstrucao()}
                />
                <Button onClick={handleCreateTipoConstrucao}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-2">
                {tiposConstrucao.map((tipo) => (
                  <div key={tipo.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span>{tipo.nome}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTipoConstrucao(tipo.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Encaminhamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Encaminhamentos</CardTitle>
              <CardDescription>
                Gerencie as opções de encaminhamento disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Novo encaminhamento"
                  value={newEncaminhamento}
                  onChange={(e) => setNewEncaminhamento(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateEncaminhamento()}
                />
                <Button onClick={handleCreateEncaminhamento}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-2">
                {encaminhamentos.map((enc) => (
                  <div key={enc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span>{enc.nome}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEncaminhamento(enc.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Responsáveis */}
          <Card>
            <CardHeader>
              <CardTitle>Responsáveis pela Vistoria</CardTitle>
              <CardDescription>
                Gerencie os responsáveis disponíveis para vistoria e suas assinaturas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  placeholder="Nome do responsável"
                  value={newResponsavel.nome}
                  onChange={(e) => setNewResponsavel(prev => ({ ...prev, nome: e.target.value }))}
                />
                <Input
                  placeholder="Cargo"
                  value={newResponsavel.cargo}
                  onChange={(e) => setNewResponsavel(prev => ({ ...prev, cargo: e.target.value }))}
                />
                <Button onClick={handleCreateResponsavel}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-4">
                {responsaveis.map((resp) => (
                  <div key={resp.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{resp.nome}</span>
                        <span className="text-gray-600 ml-2">- {resp.cargo}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteResponsavel(resp.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="border-t pt-4">
                      <SignaturePadComponent
                        title={`Assinatura de ${resp.nome}`}
                        onSave={(dataURL) => handleSaveAssinaturaResponsavel(resp.id, dataURL)}
                        initialSignature={assinaturasResponsaveis[resp.id]}
                        disabled={loading}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Campos Obrigatórios */}
          <Card>
            <CardHeader>
              <CardTitle>Campos Obrigatórios</CardTitle>
              <CardDescription>
                Configure quais campos são obrigatórios no formulário de boletim
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'nome_requerente', label: 'Nome do Requerente' },
                { key: 'cpf', label: 'CPF' },
                { key: 'rg', label: 'RG' },
                { key: 'data_nascimento', label: 'Data de Nascimento' },
                { key: 'endereco', label: 'Endereço' },
                { key: 'telefone', label: 'Telefone' },
                { key: 'data_solicitacao', label: 'Data da Solicitação' },
                { key: 'horario_solicitacao', label: 'Horário da Solicitação' },
                { key: 'solicitacao', label: 'Solicitação' },
                { key: 'relatorio', label: 'Relatório' },
                { key: 'tipo_construcao_id', label: 'Tipo de Construção' },
                { key: 'diagnostico', label: 'Diagnóstico' },
                { key: 'data_vistoria', label: 'Data da Vistoria' },
                { key: 'responsavel1_id', label: 'Responsável 1' },
                { key: 'responsavel2_id', label: 'Responsável 2' }
              ].map((campo) => (
                <div key={campo.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor={`campo_${campo.key}`} className="font-medium">
                    {campo.label}
                  </Label>
                  <Switch
                    id={`campo_${campo.key}`}
                    checked={camposObrigatorios[campo.key] || false}
                    onCheckedChange={(checked) => handleUpdateCampoObrigatorio(campo.key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Gerenciar Bairros */}
          <Card>
            <CardHeader>
              <CardTitle>
                <MapPin className="h-5 w-5 inline mr-2" />
                Gerenciar Bairros
              </CardTitle>
              <CardDescription>
                Adicione, edite e gerencie os bairros disponíveis no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Formulário para adicionar novo bairro */}
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="newBairro">Novo Bairro</Label>
                  <Input
                    id="newBairro"
                    value={newBairro}
                    onChange={(e) => setNewBairro(e.target.value)}
                    placeholder="Nome do bairro"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateBairro()}
                  />
                </div>
                <Button onClick={handleCreateBairro} disabled={!newBairro.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              {/* Lista de bairros */}
              <div className="space-y-2">
                {bairros.map((bairro) => (
                  <div key={bairro.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {editingBairro === bairro.id ? (
                        <Input
                          value={bairro.nome}
                          onChange={(e) => setBairros(prev => 
                            prev.map(b => b.id === bairro.id ? { ...b, nome: e.target.value } : b)
                          )}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateBairro(bairro.id, bairro.nome)
                            }
                          }}
                          onBlur={() => setEditingBairro(null)}
                          autoFocus
                        />
                      ) : (
                        <span 
                          className={`font-medium ${!bairro.ativo ? 'text-gray-400 line-through' : ''}`}
                        >
                          {bairro.nome}
                        </span>
                      )}
                      <Badge variant={bairro.ativo ? 'default' : 'secondary'}>
                        {bairro.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={bairro.ativo}
                        onCheckedChange={(checked) => handleToggleBairroAtivo(bairro.id, checked)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingBairro(bairro.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBairro(bairro.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {bairros.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum bairro cadastrado</p>
                  <p className="text-sm">Adicione o primeiro bairro usando o formulário acima</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}

export default AdminPanel

