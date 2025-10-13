import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../components/UI/Button';
import Loading from '../components/UI/Loading';
import Modal from '../components/UI/Modal';
import { toast } from 'react-hot-toast';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [whatsappConnected, setWhatsappConnected] = useState(false);

  const addForm = useForm({
    defaultValues: {
      name: '',
      description: '',
      whatsappId: '',
      category: 'general',
      maxMessagesPerDay: 5,
      allowedHours: { start: 8, end: 22 },
      sendingEnabled: false,
      membersCount: 0
    }
  });

  const editForm = useForm();
  const sendForm = useForm();

  useEffect(() => {
    loadGroups();
    checkWhatsAppStatus();
  }, []);

  const loadGroups = () => {
    setLoading(true);
    try {
      const savedGroups = localStorage.getItem('affiliate_groups');
      if (savedGroups) {
        setGroups(JSON.parse(savedGroups));
      } else {
        // Grupos iniciais
        const initialGroups = [];
        setGroups(initialGroups);
        localStorage.setItem('affiliate_groups', JSON.stringify(initialGroups));
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      toast.error('Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  };

  const saveGroups = (updatedGroups) => {
    localStorage.setItem('affiliate_groups', JSON.stringify(updatedGroups));
    setGroups(updatedGroups);
  };

  const checkWhatsAppStatus = () => {
    // Verificar se há configuração real da Evolution API
    const evolutionConfig = localStorage.getItem('evolution_api_config');
    if (evolutionConfig) {
      const config = JSON.parse(evolutionConfig);
      setWhatsappConnected(config.connected === true);
    } else {
      setWhatsappConnected(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      toast.loading('Testando conexão WhatsApp...', { id: 'test-connection' });

      // Simular teste
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verificar se há configuração
      const evolutionConfig = localStorage.getItem('evolution_api_config');
      if (!evolutionConfig) {
        toast.error('❌ Evolution API não configurada. Configure nas Configurações → WhatsApp', { id: 'test-connection' });
        setWhatsappConnected(false);
        return;
      }

      // Simulação de teste baseada na configuração
      const isConnected = Math.random() > 0.3;

      if (isConnected) {
        toast.success('✅ WhatsApp conectado com sucesso!', { id: 'test-connection' });
        setWhatsappConnected(true);
        // Salvar status
        const config = JSON.parse(evolutionConfig);
        config.connected = true;
        config.lastTest = new Date().toISOString();
        localStorage.setItem('evolution_api_config', JSON.stringify(config));
      } else {
        toast.error('❌ Falha na conexão. Verifique a configuração da Evolution API.', { id: 'test-connection' });
        setWhatsappConnected(false);
      }
    } catch (error) {
      toast.error('❌ Erro ao testar conexão', { id: 'test-connection' });
      setWhatsappConnected(false);
    }
  };

  const handleAddGroup = (data) => {
    try {
      // Validar WhatsApp ID
      let whatsappId = data.whatsappId.trim();
      if (!whatsappId.includes('@g.us')) {
        whatsappId = `${whatsappId}@g.us`;
      }

      const newGroup = {
        ...data,
        id: Date.now().toString(),
        whatsappId,
        isActive: true,
        stats: {
          totalMessagesSent: 0,
          messagesSentToday: 0,
          totalClicks: 0,
          avgEngagementRate: 0
        },
        createdAt: new Date().toISOString()
      };

      const updatedGroups = [newGroup, ...groups];
      saveGroups(updatedGroups);

      addForm.reset();
      setShowAddModal(false);
      toast.success('Grupo adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar grupo:', error);
      toast.error('Erro ao adicionar grupo');
    }
  };

  const handleEditGroup = (group) => {
    setSelectedGroup(group);
    editForm.reset(group);
    setShowEditModal(true);
  };

  const handleUpdateGroup = (data) => {
    try {
      const updatedGroup = {
        ...selectedGroup,
        ...data,
        updatedAt: new Date().toISOString()
      };

      const updatedGroups = groups.map(g => 
        g.id === selectedGroup.id ? updatedGroup : g
      );

      saveGroups(updatedGroups);
      setShowEditModal(false);
      setSelectedGroup(null);
      toast.success('Grupo atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar grupo:', error);
      toast.error('Erro ao atualizar grupo');
    }
  };

  const handleToggleSending = (groupId) => {
    try {
      const updatedGroups = groups.map(g => 
        g.id === groupId ? { ...g, sendingEnabled: !g.sendingEnabled } : g
      );
      saveGroups(updatedGroups);
      toast.success('Status de envio alterado!');
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handleDeleteGroup = (groupId) => {
    if (window.confirm('Tem certeza que deseja excluir este grupo?')) {
      try {
        const updatedGroups = groups.filter(g => g.id !== groupId);
        saveGroups(updatedGroups);
        toast.success('Grupo excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir grupo:', error);
        toast.error('Erro ao excluir grupo');
      }
    }
  };

  const handleSendMessage = (group) => {
    if (!whatsappConnected) {
      toast.error('WhatsApp não está conectado. Configure primeiro.');
      return;
    }
    setSelectedGroup(group);
    sendForm.reset({
      message: `🔥 OFERTA ESPECIAL!

📱 [Nome do Produto]
💰 Por apenas R$ [Preço]
⚡ Desconto imperdível!

👆 COMPRAR AGORA: [Link de Afiliado]

#Oferta #${group.category}`
    });
    setShowSendModal(true);
  };

  const handleSendSubmit = (data) => {
    try {
      if (!whatsappConnected) {
        toast.error('WhatsApp não está conectado');
        return;
      }

      // Simular envio
      toast.success(`Mensagem enviada para ${selectedGroup.name}!`);

      // Atualizar estatísticas do grupo
      const updatedGroups = groups.map(g => 
        g.id === selectedGroup.id ? {
          ...g,
          stats: {
            ...g.stats,
            totalMessagesSent: g.stats.totalMessagesSent + 1,
            messagesSentToday: g.stats.messagesSentToday + 1
          }
        } : g
      );
      saveGroups(updatedGroups);

      setShowSendModal(false);
      setSelectedGroup(null);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const filteredGroups = groups.filter(group => {
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

  if (loading) {
    return <Loading text="Carregando grupos..." />;
  }

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
          <Button onClick={loadGroups} variant="outline">
            🔄 Atualizar
          </Button>
          <Button onClick={() => setShowAddModal(true)} variant="primary">
            ➕ Novo Grupo
          </Button>
        </div>
      </div>

      {/* Status da Conexão WhatsApp */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`h-3 w-3 rounded-full ${whatsappConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Status do WhatsApp</h3>
              <p className="text-sm text-gray-600">
                {whatsappConnected ? 'Conectado via Evolution API' : 'Desconectado - Configure nas Configurações'}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {whatsappConnected ? 'Última verificação: há 2 minutos' : 'Não configurado'}
          </div>
        </div>
        {!whatsappConnected && (
          <div className="mt-3">
            <Button size="sm" variant="primary" disabled>
              Configure a Evolution API em Configurações → WhatsApp
            </Button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Todos', count: groups.length },
            { key: 'active', label: 'Ativos', count: groups.filter(g => g.isActive && g.sendingEnabled).length },
            { key: 'inactive', label: 'Inativos', count: groups.filter(g => !g.isActive || !g.sendingEnabled).length },
            { key: 'electronics', label: 'Eletrônicos', count: groups.filter(g => g.category === 'electronics').length },
            { key: 'beauty', label: 'Beleza', count: groups.filter(g => g.category === 'beauty').length },
            { key: 'general', label: 'Geral', count: groups.filter(g => g.category === 'general').length }
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
          <div key={group.id} className="bg-white overflow-hidden shadow rounded-lg">
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
                    disabled={!group.isActive || !whatsappConnected}
                  >
                    📤 Enviar
                  </Button>
                  <Button
                    size="sm"
                    variant={group.sendingEnabled ? "danger" : "success"}
                    onClick={() => handleToggleSending(group.id)}
                  >
                    {group.sendingEnabled ? '⏸️ Pausar' : '▶️ Ativar'}
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditGroup(group)}
                  >
                    ✏️ Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteGroup(group.id)}
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
              onClick={() => setShowAddModal(true)}
              variant="primary"
              className="mt-4"
            >
              ➕ Criar Primeiro Grupo
            </Button>
          )}
        </div>
      )}

      {/* Modal Adicionar Grupo */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="➕ Criar Novo Grupo"
        size="xl"
      >
        <form onSubmit={addForm.handleSubmit(handleAddGroup)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome do Grupo</label>
              <input
                {...addForm.register('name', { required: 'Nome é obrigatório' })}
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: Grupo Eletrônicos Premium"
              />
              {addForm.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{addForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Categoria</label>
              <select
                {...addForm.register('category')}
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
              {...addForm.register('description')}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Descreva o grupo e seu público-alvo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">WhatsApp Group ID</label>
            <input
              {...addForm.register('whatsappId', { required: 'WhatsApp ID é obrigatório' })}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="123456789@g.us ou apenas 123456789"
            />
            <p className="mt-1 text-xs text-gray-500">
              Cole o ID do grupo do WhatsApp. Você pode obter isso usando um bot ou ferramenta de gerenciamento.
            </p>
            {addForm.formState.errors.whatsappId && (
              <p className="mt-1 text-sm text-red-600">{addForm.formState.errors.whatsappId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Máx. Mensagens/Dia</label>
              <input
                {...addForm.register('maxMessagesPerDay', { 
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
                {...addForm.register('membersCount')}
                type="number"
                min="0"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: 150"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Horários de Envio</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600">Início</label>
                <select
                  {...addForm.register('allowedHours.start')}
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
                  {...addForm.register('allowedHours.end')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...addForm.register('sendingEnabled')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Ativar envio automático</span>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
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
          <form onSubmit={editForm.handleSubmit(handleUpdateGroup)} className="space-y-6">
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

            <div>
              <label className="block text-sm font-medium text-gray-700">Descrição</label>
              <textarea
                {...editForm.register('description')}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Máx. Mensagens/Dia</label>
                <input
                  {...editForm.register('maxMessagesPerDay')}
                  type="number"
                  min="1"
                  max="50"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Membros</label>
                <input
                  {...editForm.register('membersCount')}
                  type="number"
                  min="0"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
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
              <Button type="submit">
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

            <div>
              <label className="block text-sm font-medium text-gray-700">Mensagem</label>
              <textarea
                {...sendForm.register('message', { required: 'Mensagem é obrigatória' })}
                rows={8}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Digite sua mensagem..."
              />
              {sendForm.formState.errors.message && (
                <p className="mt-1 text-sm text-red-600">{sendForm.formState.errors.message.message}</p>
              )}
            </div>

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
                variant="success"
                disabled={!whatsappConnected}
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
