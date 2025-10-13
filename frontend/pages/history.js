import { useState, useEffect } from 'react';
import { useApiQuery } from '../hooks/useApi';
import { historyAPI, robotAPI } from '../services/api';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Button from '../components/UI/Button';
import Loading from '../components/UI/Loading';
import Modal from '../components/UI/Modal';
import { toast } from 'react-hot-toast';

export default function History() {
  const [activeTab, setActiveTab] = useState('messages');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  // Filtros para mensagens
  const [messageFilters, setMessageFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    group: '',
    platform: '',
    page: 1,
    limit: 20
  });

  // Filtros para produtos
  const [productFilters, setProductFilters] = useState({
    action: '',
    quality: '',
    startDate: '',
    endDate: '',
    category: '',
    platform: '',
    page: 1,
    limit: 20
  });

  // Dados de mensagens
  const { data: messageHistory, loading: messagesLoading, refetch: refetchMessages } = useApiQuery(
    ['message-history', messageFilters],
    () => historyAPI.getFiltered({ type: 'message', ...messageFilters })
  );

  // Dados de produtos 
  const { data: productHistory, loading: productsLoading, refetch: refetchProducts } = useApiQuery(
    ['product-history', productFilters],
    () => historyAPI.getFiltered({ type: 'product', ...productFilters })
  );

  // Estatísticas
  const { data: messageStats } = useApiQuery(
    'message-stats',
    () => historyAPI.getStats({ type: 'message' })
  );

  const { data: productStats } = useApiQuery(
    'product-stats', 
    () => historyAPI.getStats({ type: 'product' })
  );

  // Logs do robô
  const { data: robotLogs, loading: robotLoading, refetch: refetchRobotLogs } = useApiQuery(
    'robot-logs',
    () => robotAPI.getHistory({ limit: 50 })
  );

  // Handlers
  const handleRefresh = () => {
    if (activeTab === 'messages') {
      refetchMessages();
      toast.success('Histórico de mensagens atualizado!');
    } else if (activeTab === 'products') {
      refetchProducts();
      toast.success('Histórico de produtos atualizado!');
    } else {
      refetchRobotLogs();
      toast.success('Logs do robô atualizados!');
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleExport = () => {
    const data = activeTab === 'messages' ? messageHistory?.data?.docs : productHistory?.data?.docs;
    if (!data || data.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const csv = convertToCSV(data);
    downloadCSV(csv, `${activeTab}-history-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Dados exportados com sucesso!');
  };

  const convertToCSV = (data) => {
    if (activeTab === 'messages') {
      const headers = ['Data', 'Grupo', 'Produto', 'Status', 'Cliques', 'Reações'];
      const rows = data.map(item => [
        new Date(item.sentAt).toLocaleString('pt-BR'),
        item.group?.name || 'N/A',
        item.product?.title || 'N/A',
        item.status,
        item.engagement?.clicks || 0,
        item.engagement?.reactions || 0
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else {
      const headers = ['Data', 'Ação', 'Produto', 'Categoria', 'Plataforma', 'Preço', 'Comissão', 'Qualidade'];
      const rows = data.map(item => [
        new Date(item.createdAt).toLocaleString('pt-BR'),
        item.action,
        item.product?.title || 'N/A',
        item.product?.category || 'N/A',
        item.product?.platform || 'N/A',
        `R$ ${item.product?.price?.toFixed(2) || '0,00'}`,
        `R$ ${item.product?.estimatedCommission?.toFixed(2) || '0,00'}`,
        item.product?.commissionQuality || 'N/A'
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
      case 'delivered':
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'failed':
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
      case 'delivered':
      case 'success':
        return CheckCircleIcon;
      case 'failed':
      case 'error':
        return XCircleIcon;
      default:
        return ClockIcon;
    }
  };

  const tabs = [
    { id: 'messages', name: '💬 Mensagens', count: messageHistory?.data?.totalDocs || 0 },
    { id: 'products', name: '📦 Produtos', count: productHistory?.data?.totalDocs || 0 },
    { id: 'robot', name: '🤖 Logs Robô', count: robotLogs?.data?.length || 0 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico e Logs</h1>
          <p className="text-gray-600">Acompanhe todos os envios, capturas e atividades do robô</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setShowStatsModal(true)} variant="outline">
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Estatísticas
          </Button>
          <Button onClick={handleExport} variant="outline">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleRefresh}>
            🔄 Atualizar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Mensagens */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              {/* Filtros de Mensagens */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-md font-medium text-gray-900">Filtrar Mensagens</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={messageFilters.status}
                      onChange={(e) => setMessageFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Todos</option>
                      <option value="sent">Enviado</option>
                      <option value="delivered">Entregue</option>
                      <option value="failed">Falhou</option>
                      <option value="pending">Pendente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plataforma</label>
                    <select
                      value={messageFilters.platform}
                      onChange={(e) => setMessageFilters(prev => ({ ...prev, platform: e.target.value, page: 1 }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Todas</option>
                      <option value="mercadolivre">Mercado Livre</option>
                      <option value="shopee">Shopee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Inicial</label>
                    <input
                      type="date"
                      value={messageFilters.startDate}
                      onChange={(e) => setMessageFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Final</label>
                    <input
                      type="date"
                      value={messageFilters.endDate}
                      onChange={(e) => setMessageFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={() => setMessageFilters({
                        status: '',
                        startDate: '',
                        endDate: '',
                        group: '',
                        platform: '',
                        page: 1,
                        limit: 20
                      })}
                      variant="outline"
                      className="w-full"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lista de Mensagens */}
              {messagesLoading ? (
                <Loading text="Carregando histórico de mensagens..." />
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {messageHistory?.data?.docs?.map((item) => {
                      const StatusIcon = getStatusIcon(item.status);
                      return (
                        <li key={item._id}>
                          <div className="px-4 py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className={`p-2 rounded-full ${getStatusColor(item.status)}`}>
                                  <StatusIcon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {item.product?.title || 'Produto removido'}
                                  </p>
                                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <span>Para: {item.group?.name || 'Grupo removido'}</span>
                                    <span>•</span>
                                    <span>{new Date(item.sentAt).toLocaleString('pt-BR')}</span>
                                    <span>•</span>
                                    <span className="capitalize">{item.product?.platform}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                {/* Engagement */}
                                {item.engagement && (
                                  <div className="text-right text-sm text-gray-500">
                                    <div className="flex items-center space-x-3">
                                      <span>👆 {item.engagement.clicks || 0}</span>
                                      <span>❤️ {item.engagement.reactions || 0}</span>
                                      <span>💬 {item.engagement.replies || 0}</span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Taxa: {((item.engagement.engagementRate || 0) * 100).toFixed(1)}%
                                    </div>
                                  </div>
                                )}
                                
                                {/* Status */}
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                  {item.status === 'sent' ? 'Enviado' :
                                   item.status === 'delivered' ? 'Entregue' :
                                   item.status === 'failed' ? 'Falhou' :
                                   'Pendente'}
                                </span>
                                
                                {/* Ações */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(item)}
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Preview da mensagem */}
                            {item.messageContent && (
                              <div className="mt-3 ml-12">
                                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 max-w-2xl">
                                  <p className="line-clamp-2">{item.messageContent}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {messageHistory?.data?.docs?.length === 0 && (
                    <div className="text-center py-12">
                      <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma mensagem encontrada</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Execute o robô para começar a ver o histórico de envios aqui.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab: Produtos */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Filtros de Produtos */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-md font-medium text-gray-900">Filtrar Capturas de Produtos</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ação</label>
                    <select
                      value={productFilters.action}
                      onChange={(e) => setProductFilters(prev => ({ ...prev, action: e.target.value, page: 1 }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Todas</option>
                      <option value="found">Encontrado</option>
                      <option value="approved">Aprovado</option>
                      <option value="rejected">Rejeitado</option>
                      <option value="sent">Enviado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Qualidade</label>
                    <select
                      value={productFilters.quality}
                      onChange={(e) => setProductFilters(prev => ({ ...prev, quality: e.target.value, page: 1 }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Todas</option>
                      <option value="excelente">Excelente</option>
                      <option value="boa">Boa</option>
                      <option value="regular">Regular</option>
                      <option value="baixa">Baixa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoria</label>
                    <select
                      value={productFilters.category}
                      onChange={(e) => setProductFilters(prev => ({ ...prev, category: e.target.value, page: 1 }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Todas</option>
                      <option value="electronics">Eletrônicos</option>
                      <option value="beauty">Beleza</option>
                      <option value="home">Casa</option>
                      <option value="fashion">Moda</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plataforma</label>
                    <select
                      value={productFilters.platform}
                      onChange={(e) => setProductFilters(prev => ({ ...prev, platform: e.target.value, page: 1 }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Todas</option>
                      <option value="mercadolivre">Mercado Livre</option>
                      <option value="shopee">Shopee</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={() => setProductFilters({
                        action: '',
                        quality: '',
                        startDate: '',
                        endDate: '',
                        category: '',
                        platform: '',
                        page: 1,
                        limit: 20
                      })}
                      variant="outline"
                      className="w-full"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lista de Produtos */}
              {productsLoading ? (
                <Loading text="Carregando histórico de produtos..." />
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {productHistory?.data?.docs?.map((item) => (
                      <li key={item._id}>
                        <div className="px-4 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={item.product?.imageUrl || 'https://via.placeholder.com/48'}
                                alt={item.product?.title}
                                onError={(e) => e.target.src = 'https://via.placeholder.com/48'}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {item.product?.title || 'Produto sem título'}
                                </p>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <span>{new Date(item.createdAt).toLocaleString('pt-BR')}</span>
                                  <span>•</span>
                                  <span className="capitalize">{item.product?.platform}</span>
                                  <span>•</span>
                                  <span>R$ {item.product?.price?.toFixed(2)}</span>
                                  <span>•</span>
                                  <span>Comissão: R$ {item.product?.estimatedCommission?.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              {/* Qualidade */}
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                item.product?.commissionQuality === 'excelente' ? 'bg-green-100 text-green-800' :
                                item.product?.commissionQuality === 'boa' ? 'bg-yellow-100 text-yellow-800' :
                                item.product?.commissionQuality === 'regular' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.product?.commissionQuality || 'N/A'}
                              </span>
                              
                              {/* Ação */}
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                item.action === 'found' ? 'bg-blue-100 text-blue-800' :
                                item.action === 'approved' ? 'bg-green-100 text-green-800' :
                                item.action === 'rejected' ? 'bg-red-100 text-red-800' :
                                item.action === 'sent' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.action === 'found' ? '🔍 Encontrado' :
                                 item.action === 'approved' ? '✅ Aprovado' :
                                 item.action === 'rejected' ? '❌ Rejeitado' :
                                 item.action === 'sent' ? '📤 Enviado' :
                                 item.action}
                              </span>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(item)}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {productHistory?.data?.docs?.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">📦</div>
                      <h3 className="text-lg font-medium text-gray-900">Nenhum produto encontrado</h3>
                      <p className="text-gray-500 mt-2">Execute o robô para começar a capturar produtos</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab: Logs do Robô */}
          {activeTab === 'robot' && (
            <div className="space-y-6">
              {robotLoading ? (
                <Loading text="Carregando logs do robô..." />
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {robotLogs?.data?.map((log, index) => (
                      <li key={index}>
                        <div className="px-4 py-4">
                          <div className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                              log.level === 'error' ? 'bg-red-500' :
                              log.level === 'warning' ? 'bg-yellow-500' :
                              log.level === 'success' ? 'bg-green-500' :
                              'bg-blue-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {log.action || 'Ação do Sistema'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(log.timestamp).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {log.message}
                              </p>
                              {log.details && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
                                  {JSON.stringify(log.details, null, 2)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {robotLogs?.data?.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">🤖</div>
                      <h3 className="text-lg font-medium text-gray-900">Nenhum log encontrado</h3>
                      <p className="text-gray-500 mt-2">Os logs de execução do robô aparecerão aqui</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Detalhes */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={activeTab === 'messages' ? '💬 Detalhes da Mensagem' : '📦 Detalhes do Produto'}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            {activeTab === 'messages' ? (
              <>
                {/* Detalhes da Mensagem */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedItem.status)}`}>
                      {selectedItem.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Enviado em</label>
                    <p className="text-sm text-gray-900">{new Date(selectedItem.sentAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Grupo</label>
                    <p className="text-sm text-gray-900">{selectedItem.group?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Produto</label>
                    <p className="text-sm text-gray-900 truncate">{selectedItem.product?.title || 'N/A'}</p>
                  </div>
                </div>

                {selectedItem.messageContent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo da Mensagem</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                      {selectedItem.messageContent}
                    </div>
                  </div>
                )}

                {selectedItem.engagement && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Engajamento</label>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{selectedItem.engagement.clicks || 0}</div>
                        <div className="text-sm text-blue-700">Cliques</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{selectedItem.engagement.reactions || 0}</div>
                        <div className="text-sm text-red-700">Reações</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{selectedItem.engagement.replies || 0}</div>
                        <div className="text-sm text-green-700">Respostas</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Detalhes do Produto */}
                <div className="flex items-start space-x-4 mb-4">
                  <img
                    className="h-20 w-20 rounded-lg object-cover"
                    src={selectedItem.product?.imageUrl || 'https://via.placeholder.com/80'}
                    alt={selectedItem.product?.title}
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {selectedItem.product?.title || 'Produto sem título'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedItem.product?.description || 'Sem descrição'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ação</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedItem.action}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data</label>
                    <p className="text-sm text-gray-900">{new Date(selectedItem.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plataforma</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedItem.product?.platform}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoria</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedItem.product?.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preço</label>
                    <p className="text-sm text-gray-900">R$ {selectedItem.product?.price?.toFixed(2) || '0,00'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Comissão</label>
                    <p className="text-sm text-gray-900">R$ {selectedItem.product?.estimatedCommission?.toFixed(2) || '0,00'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Qualidade</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedItem.product?.commissionQuality === 'excelente' ? 'bg-green-100 text-green-800' :
                      selectedItem.product?.commissionQuality === 'boa' ? 'bg-yellow-100 text-yellow-800' :
                      selectedItem.product?.commissionQuality === 'regular' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedItem.product?.commissionQuality || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Avaliação</label>
                    <p className="text-sm text-gray-900">{selectedItem.product?.rating || 0}/5 ⭐</p>
                  </div>
                </div>

                {selectedItem.product?.affiliateLink && (
                  <div className="pt-4 border-t">
                    <a
                      href={selectedItem.product.affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                    >
                      🔗 Ver Produto Original
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Estatísticas */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="📊 Estatísticas Detalhadas"
        size="xl"
      >
        <div className="space-y-6">
          {/* Stats de Mensagens */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">💬 Mensagens</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{messageStats?.data?.totalMessages || 0}</div>
                <div className="text-sm text-blue-700">Total Enviadas</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{messageStats?.data?.successRate || 0}%</div>
                <div className="text-sm text-green-700">Taxa Sucesso</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{messageStats?.data?.totalClicks || 0}</div>
                <div className="text-sm text-purple-700">Total Cliques</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{messageStats?.data?.avgEngagement || 0}%</div>
                <div className="text-sm text-yellow-700">Engajamento Médio</div>
              </div>
            </div>
          </div>

          {/* Stats de Produtos */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">📦 Produtos</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="bg-indigo-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-indigo-600">{productStats?.data?.totalFound || 0}</div>
                <div className="text-sm text-indigo-700">Encontrados</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{productStats?.data?.totalApproved || 0}</div>
                <div className="text-sm text-green-700">Aprovados</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{productStats?.data?.totalRejected || 0}</div>
                <div className="text-sm text-red-700">Rejeitados</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{productStats?.data?.avgCommission || 0}%</div>
                <div className="text-sm text-orange-700">Comissão Média</div>
              </div>
            </div>
          </div>

          {/* Estatísticas por Período */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">📈 Últimos 7 Dias</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-center text-gray-600">
                Gráfico de performance seria exibido aqui
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
