import { supabase } from './supabase'

// Utilitários para formatação
export const formatBoletimNumber = (numero, ano) => `${numero}/${ano}`

// API de Boletins
export const boletinsAPI = {
  // Buscar próximo número de boletim
  async getNextNumber(ano = new Date().getFullYear()) {
    const { data, error } = await supabase
      .rpc('get_next_boletim_number', { p_ano: ano })
    
    if (error) throw error
    return data
  },

  // Criar novo boletim
  async create(boletimData) {
    const { data, error } = await supabase
      .from('boletins')
      .insert([boletimData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Buscar boletim por ID
  async getById(id) {
    const { data, error } = await supabase
      .from('boletins')
      .select(`
        *,
        tipos_construcao(nome),
        responsaveis!boletins_responsavel1_id_fkey(nome, cargo),
        responsaveis_2:responsaveis!boletins_responsavel2_id_fkey(nome, cargo),
        boletim_encaminhamentos(
          encaminhamentos(nome)
        ),
        fotos(*),
        assinaturas(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Buscar boletins com filtros
  async search(filters = {}) {
    let query = supabase
      .from('boletins')
      .select(`
        id,
        numero,
        ano,
        nome_requerente,
        cpf,
        data_solicitacao,
        data_vistoria,
        created_at,
        tipos_construcao(nome)
      `)

    if (filters.searchTerm) {
      query = query.or(`nome_requerente.ilike.%${filters.searchTerm}%,cpf.ilike.%${filters.searchTerm}%,endereco.ilike.%${filters.searchTerm}%`)
    }

    if (filters.numero) {
      query = query.eq('numero', filters.numero)
    }

    if (filters.ano) {
      query = query.eq('ano', filters.ano)
    }

    if (filters.dataInicio) {
      query = query.gte('data_solicitacao', filters.dataInicio)
    }

    if (filters.dataFim) {
      query = query.lte('data_solicitacao', filters.dataFim)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(filters.limit || 50)

    if (error) throw error
    return data
  },

  // Atualizar boletim
  async update(id, updates) {
    const { data, error } = await supabase
      .from('boletins')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Deletar boletim
  async delete(id) {
    const { error } = await supabase
      .from('boletins')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Adicionar encaminhamentos ao boletim
  async addEncaminhamentos(boletimId, encaminhamentoIds) {
    const inserts = encaminhamentoIds.map(encaminhamentoId => ({
      boletim_id: boletimId,
      encaminhamento_id: encaminhamentoId
    }))

    const { error } = await supabase
      .from('boletim_encaminhamentos')
      .insert(inserts)
    
    if (error) throw error
  },

  // Remover encaminhamentos do boletim
  async removeEncaminhamentos(boletimId) {
    const { error } = await supabase
      .from("boletim_encaminhamentos")
      .delete()
      .eq("boletim_id", boletimId)
    
    if (error) throw error
  },

  // Verificar se boletim existe
  async checkIfExists(numero, ano) {
    const { data, error } = await supabase
      .from("boletins")
      .select("id")
      .eq("numero", numero)
      .eq("ano", ano)
      .single()

    if (error && error.code !== "PGRST116") { // PGRST116 means no rows found
      throw error
    }
    return data !== null
  }
}

// API de Fotos
export const fotosAPI = {
  // Upload de foto
  async upload(boletimId, file, userId) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${userId}/${boletimId}/${fileName}`

    // Upload para storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('fotos-boletins')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Salvar referência no banco
    const { data, error } = await supabase
      .from('fotos')
      .insert([{
        boletim_id: boletimId,
        nome_arquivo: fileName,
        url_storage: uploadData.path
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Buscar fotos do boletim
  async getByBoletimId(boletimId) {
    const { data, error } = await supabase
      .from('fotos')
      .select('*')
      .eq('boletim_id', boletimId)
      .order('ordem')

    if (error) throw error
    return data
  },

  // Deletar foto
  async delete(fotoId) {
    // Buscar dados da foto
    const { data: foto, error: fetchError } = await supabase
      .from('fotos')
      .select('url_storage')
      .eq('id', fotoId)
      .single()

    if (fetchError) throw fetchError

    // Deletar do storage
    const { error: storageError } = await supabase.storage
      .from('fotos-boletins')
      .remove([foto.url_storage])

    if (storageError) throw storageError

    // Deletar do banco
    const { error } = await supabase
      .from('fotos')
      .delete()
      .eq('id', fotoId)

    if (error) throw error
  },

  // Obter URL pública da foto
  async getPublicUrl(urlStorage) {
    const { data } = supabase.storage
      .from('fotos-boletins')
      .getPublicUrl(urlStorage)

    return data.publicUrl
  }
}

// API de Configurações
export const configAPI = {
  // Buscar tipos de construção
  async getTiposConstrucao() {
    const { data, error } = await supabase
      .from('tipos_construcao')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (error) throw error
    return data
  },

  // Buscar encaminhamentos
  async getEncaminhamentos() {
    const { data, error } = await supabase
      .from('encaminhamentos')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (error) throw error
    return data
  },

  // Buscar responsáveis
  async getResponsaveis() {
    const { data, error } = await supabase
      .from('responsaveis')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (error) throw error
    return data
  },

  // Buscar campos obrigatórios
  async getCamposObrigatorios() {
    const { data, error } = await supabase
      .from('campos_obrigatorios')
      .select('*')

    if (error) throw error
    return data.reduce((acc, campo) => {
      acc[campo.campo] = campo.obrigatorio
      return acc
    }, {})
  },

  // Buscar configurações do sistema
  async getConfiguracoes() {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')

    if (error) throw error
    return data.reduce((acc, config) => {
      acc[config.chave] = config.valor
      return acc
    }, {})
  }
}

// API de Administração
export const adminAPI = {
  // Usuários
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  },

  async updateUserRole(userId, role) {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteUser(userId) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) throw error
  },

  // Tipos de construção
  async createTipoConstrucao(nome) {
    const { data, error } = await supabase
      .from('tipos_construcao')
      .insert([{ nome }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateTipoConstrucao(id, nome) {
    const { data, error } = await supabase
      .from('tipos_construcao')
      .update({ nome })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteTipoConstrucao(id) {
    const { error } = await supabase
      .from('tipos_construcao')
      .update({ ativo: false })
      .eq('id', id)

    if (error) throw error
  },

  // Encaminhamentos
  async createEncaminhamento(nome) {
    const { data, error } = await supabase
      .from('encaminhamentos')
      .insert([{ nome }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateEncaminhamento(id, nome) {
    const { data, error } = await supabase
      .from('encaminhamentos')
      .update({ nome })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteEncaminhamento(id) {
    const { error } = await supabase
      .from('encaminhamentos')
      .update({ ativo: false })
      .eq('id', id)

    if (error) throw error
  },

  // Responsáveis
  async createResponsavel(nome, cargo) {
    const { data, error } = await supabase
      .from('responsaveis')
      .insert([{ nome, cargo }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateResponsavel(id, nome, cargo) {
    const { data, error } = await supabase
      .from('responsaveis')
      .update({ nome, cargo })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteResponsavel(id) {
    const { error } = await supabase
      .from('responsaveis')
      .update({ ativo: false })
      .eq('id', id)

    if (error) throw error
  },

  // Campos obrigatórios
  async updateCampoObrigatorio(campo, obrigatorio) {
    const { data, error } = await supabase
      .from('campos_obrigatorios')
      .upsert([{ campo, obrigatorio }])
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// API de Relatórios
export const relatoriosAPI = {
  // Relatório de boletins por período
  async getBoletinsPorPeriodo(dataInicio, dataFim) {
    const { data, error } = await supabase
      .from('boletins')
      .select(`
        id,
        numero,
        ano,
        nome_requerente,
        data_solicitacao,
        data_vistoria,
        tipos_construcao(nome),
        created_at
      `)
      .gte('data_solicitacao', dataInicio)
      .lte('data_solicitacao', dataFim)
      .order('data_solicitacao')

    if (error) throw error
    return data
  },

  // Estatísticas gerais
  async getEstatisticas() {
    const { data: total, error: totalError } = await supabase
      .from('boletins')
      .select('id', { count: 'exact' })

    if (totalError) throw totalError

    const { data: porTipo, error: tipoError } = await supabase
      .from('boletins')
      .select(`
        tipos_construcao(nome),
        count:id
      `)
      .not('tipos_construcao', 'is', null)

    if (tipoError) throw error

    return {
      total: total.length,
      porTipo: porTipo
    }
  }
}


