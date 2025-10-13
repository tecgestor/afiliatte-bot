import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useApiQuery, useApiMutation } from '../hooks/useApi';
import Button from '../components/UI/Button';
import Loading from '../components/UI/Loading';
import Modal from '../components/UI/Modal';
import Alert from '../components/UI/Alert';
import { toast } from 'react-hot-toast';

// Mock APIs para funcionar sem backend completo
const mockGroupsAPI = {
  getAll: () => Promise.resolve({
    data: {
      docs: [
        {
          _id: '1',
          name: 'Grupo Eletrônicos Premium',
          description: 'Produtos eletrônicos de alta qualidade',
          whatsappId: '123456789@g.us',
          category: 'electronics',
          membersCount: 250,
          isActive: true,
          sendingEnabled: true,
          maxMessagesPerDay: 10,
          allowedHours: { start: 8, end: 22 },
          stats: {
            totalMessagesSent: 145,
            messagesSentToday: 3,
            totalClicks: 89,
            avgEngagementRate: 0.12
          }
        },
        {
          _id: '2',
          name: 'Beleza & Cosméticos',
          description: 'Produtos de beleza e cuidados pessoais',
          whatsappId: '987654321@g.us',
          category: 'beauty',
          membersCount: 180,
          isActive: true,
          sendingEnabled: false,
          maxMessagesPerDay: 8,
          allowedHours: { start: 9, end: 21 },
          stats: {
            totalMessagesSent: 67,
            messagesSentToday: 0,
            totalClicks: 34,
            avgEngagementRate: 0.08
          }
        },
        {
          _id: '3',
          name: 'Casa & Decoração',
          description: 'Itens para casa e decoração',
          whatsappId: '555666777@g.us',
          category: 'home',
          membersCount: 95,
          isActive: false,
          sendingEnabled: false,
          maxMessagesPerDay: 5,
          allowedHours: { start: 10, end: 20 },
          stats: {
            totalMessagesSent: 23,
            messagesSentToday: 0,
            totalClicks: 8,
            avgEngagementRate: 0.05
          }
        }
      ]
    }
  }),
  create: (data) => {
    console.log('Criando grupo:', data);
    return Promise.resolve({ data: { ...data, _id: Date.now().toString() } });
  },
  update: (id, data) => {
    console.log('Atualizando grupo:', id, data);
    return Promise.resolve({ data: { ...data, _id: id } });
  },
  delete: (id) => {
    console.log('Excluindo grupo:', id);
    return Promise.resolve({ data: { success: true } });
  },
  toggleSending: (id) => {
    console.log('Alternando envio:', id);
    return Promise.resolve({ data: { success: true } });
  },
  sendMessage: (id, messageData) => {
    console.log('Enviando mensagem:', id, messageData);
    return Promise.resolve({ data: { success: true, messageId: Date.now().toString() } });
  }
};

const mockTemplatesAPI = {
  getAll: () => Promise.resolve({
    data: {
      docs: [
        {
          _id: '1',
          name: 'Template Eletrônicos',
          category: 'electronics'
        },
        {
          _id: '2',
          name: 'Template Beleza',
          category: 'beauty'
        }
      ]
    }
  })
};

const mockProductsAPI = {
  getAll: (params) => Promise.resolve({
    data: {
      docs: [
        {
          _id: '1',
          title: 'Smartphone Samsung Galaxy S24',
          price: 2499.99,
          platform: 'mercadolivre'
        },
        {
          _id: '2',
          title: 'iPhone 15 Pro Max',
          price: 4999.99,
          platform: 'mercadolivre'
        }
      ]
    }
  })
};

export default function Groups() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Dados usando mock APIs
  const { data: groups, loading, refetch } = useApiQuery('groups', mockGroupsAPI.getAll);
  const { data: templates } = useApiQuery('templates', mockTemplatesAPI.getAll);
  const { data: products } = useApiQuery('approved-products', () => mockProductsAPI.getAll({ isApproved: true, limit: 50 }));

  // Mutations usando mock APIs
  const createMutation = useApiMutation(
    (data) => mockGroupsAPI.create(data),
    {
      successMessage: 'Grupo criado com sucesso!',
      invalidateQueries: ['groups'],
      onSuccess: () => {
        setShowCreateModal(false);
        refetch();
      }
    }
  );

  const updateMutation = useApiMutation(
    ({ id, data }) => mockGroupsAPI.update(id, data),
    {
      successMessage: 'Grupo atualizado com sucesso!',
      invalidateQueries: ['groups'],
      onSuccess: () => {
        setShowEditModal(false);
        setSelectedGroup(null);
        refetch();
      }
    }
  );

  const deleteMutation = useApiMutation(
    (id) => mockGroupsAPI.delete(id),
    {
      successMessage: 'Grupo excluído com sucesso!',
      invalidateQueries: ['groups'],
      onSuccess: () => refetch()
    }
  );

  const toggleSendingMutation = useApiMutation(
    (id) => mockGroupsAPI.toggleSending(id),
    {
      successMessage: 'Status de envio alterado!',
      invalidateQueries: ['groups'],
      onSuccess: () => refetch()
    }
  );

  const sendMessageMutation = useApiMutation(
    ({ groupId, message, templateId, productId }) => mockGroupsAPI.sendMessage(groupId, { message, templateId, productId }),
    {
      successMessage: 'Mensagem enviada com sucesso!',
      onSuccess: () => {
        setShowSendModal(false);
        setSelectedGroup(null);
      }
    }
  );

  // Formulários
  const createForm = useForm({
    defaultValues: {
      name: '',
      description: '',
      whatsappId: '',
      category: 'general',
      maxMessagesPerDay: 5,
      allowedHours: { start: 8, end: 22 },
      sendingEnabled: false,
      autoSend: false,
      membersCount: 0
    }
  });

  const editForm = useForm();
  const sendForm = useForm({
    defaultValues: {
      message: '',
      messageType: 'custom',
      templateId: '',
      productId: '',
      sendImmediate: true,
      trackEngagement: true
    }
  });

  // Handlers
  const handleCreate = (data) => {
    console.log('🆕 Criando grupo:', data);
    createMutation.mutate({
      ...data,
      whatsappId: data.whatsappId.includes('@g.us') ? data.whatsappId : `${data.whatsappId}@g.us`
    });
  };

  const handleEdit = (group) => {
    setSelectedGroup(group);
    editForm.reset(group);
    setShowEditModal(true);
  };

  const handleUpdate = (data) => {
    console.log('✏️ Atualizando grupo:', selectedGroup._id, data);
    updateMutation.mutate({ id: selectedGroup._id, data });
  };

  const handleDelete = (group) => {
    if (window.confirm(`Tem certeza que deseja excluir o grupo "${group.name}"?`)) {
      console.log('🗑️ Excluindo grupo:', group._id);
      deleteMutation.mutate(group._id);
    }
  };

  const handleToggleSending = (group) => {
    console.log('🔄 Alternando envio do grupo:', group._id);
    toggleSendingMutation.mutate(group._id);
  };

  const handleSendMessage = (group) => {
    setSelectedGroup(group);
    sendForm.reset({
      message: `🔥 OFERTA ESPECIAL!

📱 [Nome do Produto]
💰 Por apenas R$ [Preço]
⚡ Desconto imperdível!

👆 COMPRAR AGORA: [Link]

#Oferta #${group.category}`,
      messageType: 'custom',
      templateId: '',
      productId: '',
      sendImmediate: true,
      trackEngagement: true
    });
    setShowSendModal(true);
  };

  const handleSendSubmit = (data) => {
    console.log('📤 Enviando mensagem:', data);
    sendMessageMutation.mutate({
      groupId: selectedGroup._id,
      ...data
    });
  };

  const handleTestConnection = async () => {
    try {
      toast.loading('Testando conexão WhatsApp...', { id: 'test-connection' });

      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));

      const isConnected = Math.random() > 0.3; // 70% chance de sucesso

      if (isConnected) {
        toast.success('✅ WhatsApp conectado com sucesso!', { id: 'test-connection' });
      } else {
        toast.error('❌ Falha na conexão. Verifique as configurações da Evolution API.', { id: 'test-connection' });
      }
    } catch (error) {
      toast.error('❌ Erro ao testar conexão', { id: 'test-connection' });
    }
  };

  if (loading) {
    return <Loading text="Carregando grupos..." />;
  }

  const groupList = groups?.data?.docs || [];
  const templateList = templates?.data?.docs || [];
  const productList = products?.data?.docs || [];

  const filteredGroups = groupList.filter(group => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return group.isActive && group.sendingEnabled;
    if (activeFilter === 'inactive') return !group.isActive || !group.sendingEnabled;
    return group.category === activeFilter;
  });

  const getStatusColor = (group) => {
    if (!group.isActive) return 'bg-gray-100 text-gray-800';
    if (group.sendingEnabled) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (group) => {
    if (!group.isActive) return 'Inativo';
    if (group.sendingEnabled) return 'Enviando';
    return 'Pausado';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grupos WhatsApp</h1>
          <p className="text-gray-600">Gerencie grupos e envie mensagens automaticamente</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={handleTestConnection} variant="outline">
            📡 Testar Conexão
          </Button>
          <Button onClick={() => refetch()} variant="outline">
            🔄 Atualizar
          </Button>
          <Button onClick={() => setShowCreateModal(true)} variant="primary">
            ➕ Novo Grupo
          </Button>
        </div>
      </div>

      {/* Status da Conexão WhatsApp */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Status do WhatsApp</h3>
              <p className="text-sm text-gray-600">Conectado via Evolution API</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Última verificação: há 2 minutos
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Todos', count: groupList.length },
            { key: 'active', label: 'Ativos', count: groupList.filter(g => g.isActive && g.sendingEnabled).length },
            { key: 'inactive', label: 'Inativos', count: groupList.filter(g => !g.isActive || !g.sendingEnabled).length },
            { key: 'electronics', label: 'Eletrônicos', count: groupList.filter(g => g.category === 'electronics').length },
            { key: 'beauty', label: 'Beleza', count: groupList.filter(g => g.category === 'beauty').length },
            { key: 'general', label: 'Geral', count: groupList.filter(g => g.category === 'general').length }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter.key
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Grupos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredGroups.map((group) => (
          <div key={group._id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">📱</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
                    <p className="text-sm text-gray-500">{group.description}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(group)}`}>
                  {getStatusText(group)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="font-medium">Membros:</span>
                  <span className="ml-2">{group.membersCount || 0}</span>
                </div>
                <div>
                  <span className="font-medium">Categoria:</span>
                  <span className="ml-2 capitalize">
                    {group.category === 'electronics' ? 'Eletrônicos' :
                     group.category === 'beauty' ? 'Beleza' :
                     group.category === 'home' ? 'Casa' :
                     group.category === 'general' ? 'Geral' : group.category}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Msgs/dia:</span>
                  <span className="ml-2">{group.maxMessagesPerDay || 5}</span>
                </div>
                <div>
                  <span className="font-medium">Horário:</span>
                  <span className="ml-2">
                    {group.allowedHours?.start || 8}h - {group.allowedHours?.end || 22}h
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600 font-medium mb-1">WhatsApp ID:</p>
                <p className="text-sm font-mono text-gray-800 break-all">
                  {group.whatsappId}
                </p>
              </div>

              {/* Estatísticas */}
              {group.stats && (
                <div className="grid grid-cols-3 gap-4 text-center text-sm mb-4">
                  <div>
                    <div className="font-semibold text-gray-900">{group.stats.totalMessagesSent || 0}</div>
                    <div className="text-gray-500">Enviadas</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{group.stats.totalClicks || 0}</div>
                    <div className="text-gray-500">Cliques</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {((group.stats.avgEngagementRate || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-gray-500">Engajamento</div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleSendMessage(group)}
                    disabled={!group.isActive}
                  >
                    📤 Enviar
                  </Button>
                  <Button
                    size="sm"
                    variant={group.sendingEnabled ? "danger" : "success"}
                    onClick={() => handleToggleSending(group)}
                  >
                    {group.sendingEnabled ? '⏸️ Pausar' : '▶️ Ativar'}
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(group)}
                  >
                    ✏️ Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(group)}
                    loading={deleteMutation.isLoading}
                  >
                    🗑️ Excluir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensagem quando não há grupos */}
      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📱</div>
          <h3 className="text-lg font-medium text-gray-900">
            {activeFilter === 'all' ? 'Nenhum grupo encontrado' : `Nenhum grupo ${activeFilter} encontrado`}
          </h3>
          <p className="text-gray-500 mt-2">
            {activeFilter === 'all' 
              ? 'Crie seu primeiro grupo para começar a enviar mensagens automáticas'
              : 'Tente alterar os filtros ou criar novos grupos'
            }
          </p>
          {activeFilter === 'all' && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              className="mt-4"
            >
              ➕ Criar Primeiro Grupo
            </Button>
          )}
        </div>
      )}

      {/* Modal Criar Grupo */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="➕ Criar Novo Grupo"
        size="xl"
      >
        <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome do Grupo</label>
              <input
                {...createForm.register('name', { required: 'Nome é obrigatório' })}
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: Grupo Eletrônicos Premium"
              />
              {createForm.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Categoria</label>
              <select
                {...createForm.register('category', { required: 'Categoria é obrigatória' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="general">Geral</option>
                <option value="electronics">Eletrônicos</option>
                <option value="beauty">Beleza</option>
                <option value="home">Casa e Jardim</option>
                <option value="fashion">Moda</option>
                <option value="sports">Esportes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              {...createForm.register('description')}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Descreva o grupo e seu público-alvo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">WhatsApp Group ID</label>
            <input
              {...createForm.register('whatsappId', { required: 'WhatsApp ID é obrigatório' })}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="123456789@g.us ou apenas 123456789"
            />
            <p className="mt-1 text-xs text-gray-500">
              Cole o ID do grupo do WhatsApp. Você pode obter isso usando um bot ou ferramenta de gerenciamento.
            </p>
            {createForm.formState.errors.whatsappId && (
              <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.whatsappId.message}</p>
            )}
          </div>

          {/* Configurações */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Máx. Mensagens/Dia</label>
              <input
                {...createForm.register('maxMessagesPerDay', { 
                  required: 'Campo obrigatório',
                  min: { value: 1, message: 'Mínimo 1 mensagem' },
                  max: { value: 50, message: 'Máximo 50 mensagens' }
                })}
                type="number"
                min="1"
                max="50"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Membros Estimados</label>
              <input
                {...createForm.register('membersCount')}
                type="number"
                min="0"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: 150"
              />
            </div>
          </div>

          {/* Horários Permitidos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Horários de Envio</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600">Início</label>
                <select
                  {...createForm.register('allowedHours.start')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Fim</label>
                <select
                  {...createForm.register('allowedHours.end')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Opções */}
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...createForm.register('sendingEnabled')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Ativar envio automático</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...createForm.register('autoSend')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Envio automático (sem aprovação manual)</span>
            </label>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createMutation.isLoading}
            >
              ➕ Criar Grupo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Grupo */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`✏️ Editar Grupo: ${selectedGroup?.name}`}
        size="xl"
      >
        {selectedGroup && (
          <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Grupo</label>
                <input
                  {...editForm.register('name', { required: 'Nome é obrigatório' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoria</label>
                <select
                  {...editForm.register('category')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="general">Geral</option>
                  <option value="electronics">Eletrônicos</option>
                  <option value="beauty">Beleza</option>
                  <option value="home">Casa e Jardim</option>
                  <option value="fashion">Moda</option>
                  <option value="sports">Esportes</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={updateMutation.isLoading}
              >
                💾 Salvar Alterações
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Enviar Mensagem */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title={`📤 Enviar Mensagem: ${selectedGroup?.name}`}
        size="lg"
      >
        {selectedGroup && (
          <form onSubmit={sendForm.handleSubmit(handleSendSubmit)} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-800 font-semibold mb-2">Informações do Grupo</h4>
              <div className="text-blue-700 text-sm space-y-1">
                <p><strong>Nome:</strong> {selectedGroup.name}</p>
                <p><strong>Membros:</strong> {selectedGroup.membersCount || 'N/A'}</p>
                <p><strong>Status:</strong> {getStatusText(selectedGroup)}</p>
                <p><strong>Mensagens hoje:</strong> {selectedGroup.stats?.messagesSentToday || 0}/{selectedGroup.maxMessagesPerDay}</p>
              </div>
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Mensagem</label>
              <textarea
                {...sendForm.register('message', { required: 'Mensagem é obrigatória' })}
                rows={8}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Digite sua mensagem aqui...&#10;&#10;🔥 SUPER OFERTA!&#10;&#10;📱 [Nome do Produto]&#10;💰 Por apenas R$ [Preço]&#10;⚡ Desconto de [%]!&#10;&#10;👆 COMPRAR: [Link]"
              />
              {sendForm.formState.errors.message && (
                <p className="mt-1 text-sm text-red-600">{sendForm.formState.errors.message.message}</p>
              )}
            </div>

            {/* Template Selection */}
            {templateList.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Template (Opcional)</label>
                <select
                  {...sendForm.register('templateId')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Selecione um template...</option>
                  {templateList.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Product Selection */}
            {productList.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Produto (Opcional)</label>
                <select
                  {...sendForm.register('productId')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Selecione um produto...</option>
                  {productList.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.title} - R$ {product.price?.toFixed(2)} ({product.platform})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Opções de Envio */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...sendForm.register('sendImmediate')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Enviar imediatamente</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...sendForm.register('trackEngagement')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Rastrear engajamento (cliques, reações)</span>
              </label>
            </div>

            {/* Preview da Mensagem */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Preview da Mensagem:</h4>
              <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                    🤖
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-2">
                      <p className="text-sm whitespace-pre-wrap">
                        {sendForm.watch('message') || 'Sua mensagem aparecerá aqui...'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">AfiliBot • agora</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSendModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={sendMessageMutation.isLoading}
                variant="success"
              >
                📤 Enviar Mensagem
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}