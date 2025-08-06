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
      .insert(boletimData)
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
        bairros(nome),
        responsaveis_1:responsaveis!boletins_responsavel1_id_fkey(nome, cargo, assinatura),
        responsaveis_2:responsaveis!boletins_responsavel2_id_fkey(nome, cargo, assinatura),
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
    console.log("API addEncaminhamentos chamada com:", { boletimId, encaminhamentoIds });
    
    const inserts = encaminhamentoIds.map(encaminhamentoId => ({
      boletim_id: boletimId,
      encaminhamento_id: encaminhamentoId
    }))

    console.log("Dados a serem inseridos na tabela boletim_encaminhamentos:", inserts);

    const { data, error } = await supabase
      .from("boletim_encaminhamentos")
      .insert(inserts)
      .select()
    
    if (error) {
      console.error("Erro ao inserir encaminhamentos:", error);
      throw error;
    }
    
    console.log("Encaminhamentos inseridos com sucesso!");
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

    if (error) {
      throw error
    }
    return data.length > 0
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

// API de Assinaturas
export const assinaturasAPI = {
  // Salvar assinatura
  async save(boletimId, tipo, dataURL) {
    // Converter dataURL para blob
    const response = await fetch(dataURL)
    const blob = await response.blob()
    
    // Gerar nome único para o arquivo
    const timestamp = new Date().getTime()
    const fileName = `assinatura_${tipo}_${boletimId}_${timestamp}.png`
    
    // Upload para o storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assinaturas')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Salvar referência no banco (atualizar boletim)
    const updateData = {}
    updateData[`assinatura_${tipo}`] = uploadData.path

    const { data, error } = await supabase
      .from('boletins')
      .update(updateData)
      .eq('id', boletimId)
      .select()
      .single()

    if (error) throw error
    return uploadData.path
  },

  // Obter URL pública da assinatura
  async getPublicUrl(urlStorage) {
    if (!urlStorage) return null
    
    const { data } = supabase.storage
      .from('assinaturas')
      .getPublicUrl(urlStorage)

    return data.publicUrl
  },

  // Deletar assinatura
  async delete(boletimId, tipo) {
    // Buscar dados do boletim
    const { data: boletim, error: fetchError } = await supabase
      .from('boletins')
      .select(`assinatura_${tipo}`)
      .eq('id', boletimId)
      .single()

    if (fetchError) throw fetchError

    const urlStorage = boletim[`assinatura_${tipo}`]
    if (!urlStorage) return

    // Deletar do storage
    const { error: storageError } = await supabase.storage
      .from('assinaturas')
      .remove([urlStorage])

    if (storageError) throw storageError

    // Remover referência do banco
    const updateData = {}
    updateData[`assinatura_${tipo}`] = null

    const { error } = await supabase
      .from('boletins')
      .update(updateData)
      .eq('id', boletimId)

    if (error) throw error
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

  // Buscar bairros
  async getBairros() {
    const { data, error } = await supabase
      .from('bairros')
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

  // Assinaturas de responsáveis
  async saveAssinaturaResponsavel(responsavelId, dataURL) {
    // Converter dataURL para blob
    const response = await fetch(dataURL)
    const blob = await response.blob()
    
    // Gerar nome único para o arquivo
    const timestamp = new Date().getTime()
    const fileName = `responsavel_${responsavelId}_${timestamp}.png`
    
    // Upload para o storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assinaturas')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Salvar referência no banco (atualizar responsável)
    const { data, error } = await supabase
      .from('responsaveis')
      .update({ assinatura: uploadData.path })
      .eq('id', responsavelId)
      .select()
      .single()

    if (error) throw error
    return uploadData.path
  },

  async deleteAssinaturaResponsavel(responsavelId) {
    // Buscar dados do responsável
    const { data: responsavel, error: fetchError } = await supabase
      .from('responsaveis')
      .select('assinatura')
      .eq('id', responsavelId)
      .single()

    if (fetchError) throw fetchError

    const urlStorage = responsavel.assinatura
    if (!urlStorage) return

    // Deletar do storage
    const { error: storageError } = await supabase.storage
      .from('assinaturas')
      .remove([urlStorage])

    if (storageError) throw storageError

    // Remover referência do banco
    const { error } = await supabase
      .from('responsaveis')
      .update({ assinatura: null })
      .eq('id', responsavelId)

    if (error) throw error
  },

  // Campos obrigatórios
  async updateCampoObrigatorio(campo, obrigatorio) {
    try {
      // Primeiro, tentar buscar se já existe
      const { data: existing, error: selectError } = await supabase
        .from('campos_obrigatorios')
        .select('*')
        .eq('campo', campo)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError
      }

      if (existing) {
        // Se existe, fazer update
        const { data, error } = await supabase
          .from('campos_obrigatorios')
          .update({ obrigatorio })
          .eq('campo', campo)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Se não existe, fazer insert
        const { data, error } = await supabase
          .from('campos_obrigatorios')
          .insert([{ campo, obrigatorio }])
          .select()
          .single()

        if (error) throw error
        return data
      }
    } catch (error) {
      console.error('Erro em updateCampoObrigatorio:', error)
      throw error
    }
  },

  // Bairros
  async createBairro(nome) {
    const { data, error } = await supabase
      .from('bairros')
      .insert([{ nome, ativo: true }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateBairro(id, nome) {
    const { data, error } = await supabase
      .from('bairros')
      .update({ nome })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteBairro(id) {
    // Desativar bairro em vez de excluir para manter integridade referencial
    const { error } = await supabase
      .from('bairros')
      .update({ ativo: false })
      .eq('id', id)

    if (error) throw error
  },

  async toggleBairroAtivo(id, ativo) {
    const { data, error } = await supabase
      .from('bairros')
      .update({ ativo })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Buscar todos os bairros (ativos e inativos) para administração
  async getAllBairros() {
    const { data, error } = await supabase
      .from('bairros')
      .select('*')
      .order('nome')

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

  // Relatório por tipo de construção
  async getBoletinsPorTipo(dataInicio, dataFim) {
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
      .not('tipo_construcao_id', 'is', null)
      .order('tipos_construcao(nome)')

    if (error) throw error
    return data
  },

  // Relatório por responsável
  async getBoletinsPorResponsavel(dataInicio, dataFim) {
    const { data, error } = await supabase
      .from('boletins')
      .select(`
        id,
        numero,
        ano,
        nome_requerente,
        data_solicitacao,
        data_vistoria,
        responsavel1:responsaveis!boletins_responsavel1_id_fkey(nome),
        responsavel2:responsaveis!boletins_responsavel2_id_fkey(nome),
        created_at
      `)
      .gte('data_solicitacao', dataInicio)
      .lte('data_solicitacao', dataFim)
      .order('data_solicitacao')

    if (error) throw error
    return data
  },

  // Relatório por encaminhamento
  async getBoletinsPorEncaminhamento(dataInicio, dataFim) {
    const { data, error } = await supabase
      .from('boletins')
      .select(`
        id,
        numero,
        ano,
        nome_requerente,
        data_solicitacao,
        data_vistoria,
        boletim_encaminhamentos!inner(
          encaminhamentos(nome)
        ),
        created_at
      `)
      .gte('data_solicitacao', dataInicio)
      .lte('data_solicitacao', dataFim)
      .order('data_solicitacao')

    if (error) throw error
    return data
  },

  // Relatório por tipo específico
  async getBoletinsPorTipoEspecifico(dataInicio, dataFim, tipoId) {
    const { data, error } = await supabase
      .from('boletins')
      .select(`
        id,
        numero,
        ano,
        nome_requerente,
        data_solicitacao,
        data_vistoria,
        tipos_construcao!inner(nome),
        created_at
      `)
      .eq('tipo_construcao_id', tipoId)
      .gte('data_solicitacao', dataInicio)
      .lte('data_solicitacao', dataFim)
      .order('data_solicitacao')

    if (error) throw error
    return data
  },

  // Relatório por responsável específico
  async getBoletinsPorResponsavelEspecifico(dataInicio, dataFim, responsavelId) {
    const { data, error } = await supabase
      .from('boletins')
      .select(`
        id,
        numero,
        ano,
        nome_requerente,
        data_solicitacao,
        data_vistoria,
        responsavel1:responsaveis!boletins_responsavel1_id_fkey(nome),
        responsavel2:responsaveis!boletins_responsavel2_id_fkey(nome),
        created_at
      `)
      .or(`responsavel1_id.eq.${responsavelId},responsavel2_id.eq.${responsavelId}`)
      .gte('data_solicitacao', dataInicio)
      .lte('data_solicitacao', dataFim)
      .order('data_solicitacao')

    if (error) throw error
    return data
  },

  // Relatório por encaminhamento específico
  async getBoletinsPorEncaminhamentoEspecifico(dataInicio, dataFim, encaminhamentoId) {
    const { data, error } = await supabase
      .from('boletins')
      .select(`
        id,
        numero,
        ano,
        nome_requerente,
        data_solicitacao,
        data_vistoria,
        boletim_encaminhamentos!inner(
          encaminhamentos!inner(nome)
        ),
        created_at
      `)
      .eq('boletim_encaminhamentos.encaminhamento_id', encaminhamentoId)
      .gte('data_solicitacao', dataInicio)
      .lte('data_solicitacao', dataFim)
      .order('data_solicitacao')

    if (error) throw error
    return data
  },

  // Estatísticas gerais
  async getEstatisticas() {
    try {
      const { count: total, error: totalError } = await supabase
        .from('boletins')
        .select('*', { count: 'exact', head: true })

      if (totalError) throw totalError

      const { data: porTipo, error: tipoError } = await supabase
        .from('boletins')
        .select(`
          tipos_construcao(nome)
        `)
        .not('tipo_construcao_id', 'is', null)

      if (tipoError) throw tipoError

      // Contar tipos únicos
      const tiposUnicos = new Set()
      porTipo.forEach(item => {
        if (item.tipos_construcao?.nome) {
          tiposUnicos.add(item.tipos_construcao.nome)
        }
      })

      return {
        total: total || 0,
        porTipo: Array.from(tiposUnicos).map(nome => ({ nome }))
      }
    } catch (error) {
      console.error('Erro em getEstatisticas:', error)
      return {
        total: 0,
        porTipo: []
      }
    }
  },

  // Relatório por bairro
  async getBoletinsPorBairro(dataInicio, dataFim) {
    const { data, error } = await supabase
      .from('boletins')
      .select(`
        id,
        numero,
        ano,
        nome_requerente,
        data_solicitacao,
        data_vistoria,
        bairros(nome),
        created_at
      `)
      .gte('data_solicitacao', dataInicio)
      .lte('data_solicitacao', dataFim)
      .not('bairro_id', 'is', null)
      .order('bairros(nome)')

    if (error) throw error
    return data
  },

  // Relatório por bairro específico
  async getBoletinsPorBairroEspecifico(dataInicio, dataFim, bairroId) {
    const { data, error } = await supabase
      .from('boletins')
      .select(`
        id,
        numero,
        ano,
        nome_requerente,
        data_solicitacao,
        data_vistoria,
        bairros!inner(nome),
        created_at
      `)
      .eq('bairro_id', bairroId)
      .gte('data_solicitacao', dataInicio)
      .lte('data_solicitacao', dataFim)
      .order('data_solicitacao')

    if (error) throw error
    return data
  }
}

