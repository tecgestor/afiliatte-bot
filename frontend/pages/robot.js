import { useState, useEffect } from 'react';
import Button from '../components/UI/Button';
import Loading from '../components/UI/Loading';
import { toast } from 'react-hot-toast';

export default function Robot() {
  const [scrapingStatus, setScrapingStatus] = useState({
    isRunning: false,
    lastExecution: null,
    stats: {
      productsScraped: 0,
      productsApproved: 0,
      errors: 0
    }
  });

  const [sendingStatus, setSendingStatus] = useState({
    isRunning: false,
    lastExecution: null,
    stats: {
      messagesSent: 0,
      groupsProcessed: 0,
      errors: 0
    }
  });

  const [scrapingConfig, setScrapingConfig] = useState({
    platforms: ['mercadolivre', 'shopee'],
    categories: ['electronics', 'beauty'],
    maxProducts: 50,
    minRating: 4.0,
    minCommission: 5
  });

  const [sendingConfig, setSendingConfig] = useState({
    onlyApprovedProducts: true,
    respectHours: true,
    maxMessagesPerGroup: 5,
    intervalBetweenMessages: 30
  });

  useEffect(() => {
    loadRobotStatus();
  }, []);

  const loadRobotStatus = () => {
    try {
      const savedScrapingStatus = localStorage.getItem('scraping_status');
      const savedSendingStatus = localStorage.getItem('sending_status');

      if (savedScrapingStatus) {
        setScrapingStatus(JSON.parse(savedScrapingStatus));
      }

      if (savedSendingStatus) {
        setSendingStatus(JSON.parse(savedSendingStatus));
      }
    } catch (error) {
      console.error('Erro ao carregar status do robô:', error);
    }
  };

  const handleStartScraping = async () => {
    try {
      if (scrapingStatus.isRunning) {
        toast.error('Scraping já está em execução');
        return;
      }

      setScrapingStatus(prev => ({ ...prev, isRunning: true }));
      toast.loading('Iniciando captura de produtos...', { id: 'scraping' });

      // Simular scraping
      await new Promise(resolve => setTimeout(resolve, 3000));

      const results = {
        productsScraped: Math.floor(Math.random() * 30) + 20,
        productsApproved: Math.floor(Math.random() * 15) + 10,
        errors: Math.floor(Math.random() * 3)
      };

      const newStatus = {
        isRunning: false,
        lastExecution: new Date().toISOString(),
        stats: results
      };

      setScrapingStatus(newStatus);
      localStorage.setItem('scraping_status', JSON.stringify(newStatus));

      // Simular adição de produtos
      const products = JSON.parse(localStorage.getItem('affiliate_products') || '[]');
      const newProducts = Array.from({ length: results.productsScraped }, (_, i) => ({
        id: Date.now() + i,
        title: `Produto Capturado ${i + 1}`,
        price: Math.random() * 1000 + 100,
        platform: scrapingConfig.platforms[Math.floor(Math.random() * scrapingConfig.platforms.length)],
        category: scrapingConfig.categories[Math.floor(Math.random() * scrapingConfig.categories.length)],
        rating: 4 + Math.random(),
        isApproved: Math.random() > 0.5,
        affiliateLink: `https://example.com/product-${i + 1}?ref=aff_123`,
        createdAt: new Date().toISOString()
      }));

      localStorage.setItem('affiliate_products', JSON.stringify([...newProducts, ...products.slice(0, 50)]));

      toast.success(`Scraping concluído! ${results.productsScraped} produtos capturados`, { id: 'scraping' });
    } catch (error) {
      console.error('Erro no scraping:', error);
      setScrapingStatus(prev => ({ ...prev, isRunning: false }));
      toast.error('Erro durante o scraping', { id: 'scraping' });
    }
  };

  const handleStartSending = async () => {
    try {
      if (sendingStatus.isRunning) {
        toast.error('Envio automático já está em execução');
        return;
      }

      // Verificar se há grupos ativos
      const groups = JSON.parse(localStorage.getItem('affiliate_groups') || '[]');
      const activeGroups = groups.filter(g => g.isActive && g.sendingEnabled);

      if (activeGroups.length === 0) {
        toast.error('Nenhum grupo ativo para envio. Configure grupos primeiro.');
        return;
      }

      // Verificar se há produtos aprovados
      const products = JSON.parse(localStorage.getItem('affiliate_products') || '[]');
      const approvedProducts = products.filter(p => p.isApproved);

      if (approvedProducts.length === 0) {
        toast.error('Nenhum produto aprovado para envio. Aprove produtos primeiro.');
        return;
      }

      setSendingStatus(prev => ({ ...prev, isRunning: true }));
      toast.loading('Iniciando envio para grupos...', { id: 'sending' });

      // Simular envio
      await new Promise(resolve => setTimeout(resolve, 4000));

      const results = {
        messagesSent: Math.min(activeGroups.length * sendingConfig.maxMessagesPerGroup, approvedProducts.length),
        groupsProcessed: activeGroups.length,
        errors: Math.floor(Math.random() * 2)
      };

      const newStatus = {
        isRunning: false,
        lastExecution: new Date().toISOString(),
        stats: results
      };

      setSendingStatus(newStatus);
      localStorage.setItem('sending_status', JSON.stringify(newStatus));

      toast.success(`Envio concluído! ${results.messagesSent} mensagens enviadas para ${results.groupsProcessed} grupos`, { id: 'sending' });
    } catch (error) {
      console.error('Erro no envio:', error);
      setSendingStatus(prev => ({ ...prev, isRunning: false }));
      toast.error('Erro durante o envio', { id: 'sending' });
    }
  };

  const handleStopScraping = () => {
    setScrapingStatus(prev => ({ ...prev, isRunning: false }));
    toast.success('Scraping interrompido');
  };

  const handleStopSending = () => {
    setSendingStatus(prev => ({ ...prev, isRunning: false }));
    toast.success('Envio interrompido');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Automação do Robô</h1>
        <p className="text-gray-600">Controle as duas automações principais: captura de produtos e envio para grupos</p>
      </div>

      {/* AUTOMAÇÃO 1: SCRAPING DE PRODUTOS */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">🔍</span>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Captura de Produtos</h2>
              <p className="text-sm text-gray-600">Busca automática de produtos no Mercado Livre e Shopee</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Status do Scraping */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Status Atual</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    scrapingStatus.isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {scrapingStatus.isRunning ? '🟢 Executando' : '🔴 Parado'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Última execução:</span>
                  <span className="text-sm text-gray-900">
                    {scrapingStatus.lastExecution 
                      ? new Date(scrapingStatus.lastExecution).toLocaleString('pt-BR')
                      : 'Nunca executado'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Última Execução</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{scrapingStatus.stats.productsScraped}</div>
                  <div className="text-sm text-gray-500">Capturados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{scrapingStatus.stats.productsApproved}</div>
                  <div className="text-sm text-gray-500">Aprovados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{scrapingStatus.stats.errors}</div>
                  <div className="text-sm text-gray-500">Erros</div>
                </div>
              </div>
            </div>
          </div>

          {/* Configurações do Scraping */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Configurações</h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Plataformas</label>
                <div className="mt-1 space-y-2">
                  {['mercadolivre', 'shopee'].map(platform => (
                    <label key={platform} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={scrapingConfig.platforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setScrapingConfig(prev => ({
                              ...prev,
                              platforms: [...prev.platforms, platform]
                            }));
                          } else {
                            setScrapingConfig(prev => ({
                              ...prev,
                              platforms: prev.platforms.filter(p => p !== platform)
                            }));
                          }
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {platform === 'mercadolivre' ? 'Mercado Livre' : 'Shopee'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Categorias</label>
                <div className="mt-1 space-y-2">
                  {['electronics', 'beauty', 'home'].map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={scrapingConfig.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setScrapingConfig(prev => ({
                              ...prev,
                              categories: [...prev.categories, category]
                            }));
                          } else {
                            setScrapingConfig(prev => ({
                              ...prev,
                              categories: prev.categories.filter(c => c !== category)
                            }));
                          }
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {category === 'electronics' ? 'Eletrônicos' :
                         category === 'beauty' ? 'Beleza' : 'Casa'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max. Produtos</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={scrapingConfig.maxProducts}
                  onChange={(e) => setScrapingConfig(prev => ({ ...prev, maxProducts: parseInt(e.target.value) }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Min. Comissão (%)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={scrapingConfig.minCommission}
                  onChange={(e) => setScrapingConfig(prev => ({ ...prev, minCommission: parseFloat(e.target.value) }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Controles do Scraping */}
          <div className="flex space-x-3">
            <Button
              onClick={handleStartScraping}
              disabled={scrapingStatus.isRunning || scrapingConfig.platforms.length === 0}
              variant="primary"
              size="lg"
            >
              {scrapingStatus.isRunning ? '⏳ Capturando...' : '🔍 Iniciar Captura'}
            </Button>
            {scrapingStatus.isRunning && (
              <Button
                onClick={handleStopScraping}
                variant="danger"
                size="lg"
              >
                ⏹️ Parar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* AUTOMAÇÃO 2: ENVIO PARA GRUPOS */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-lg">📱</span>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Envio para Grupos</h2>
              <p className="text-sm text-gray-600">Envio automático de produtos aprovados para grupos WhatsApp</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Status do Envio */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Status Atual</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    sendingStatus.isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {sendingStatus.isRunning ? '🟢 Enviando' : '🔴 Parado'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Última execução:</span>
                  <span className="text-sm text-gray-900">
                    {sendingStatus.lastExecution 
                      ? new Date(sendingStatus.lastExecution).toLocaleString('pt-BR')
                      : 'Nunca executado'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Última Execução</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{sendingStatus.stats.messagesSent}</div>
                  <div className="text-sm text-gray-500">Mensagens</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{sendingStatus.stats.groupsProcessed}</div>
                  <div className="text-sm text-gray-500">Grupos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{sendingStatus.stats.errors}</div>
                  <div className="text-sm text-gray-500">Erros</div>
                </div>
              </div>
            </div>
          </div>

          {/* Configurações do Envio */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Configurações</h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sendingConfig.onlyApprovedProducts}
                    onChange={(e) => setSendingConfig(prev => ({ ...prev, onlyApprovedProducts: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Apenas produtos aprovados</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sendingConfig.respectHours}
                    onChange={(e) => setSendingConfig(prev => ({ ...prev, respectHours: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Respeitar horários dos grupos</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max. Msgs/Grupo</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={sendingConfig.maxMessagesPerGroup}
                  onChange={(e) => setSendingConfig(prev => ({ ...prev, maxMessagesPerGroup: parseInt(e.target.value) }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Intervalo (min)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={sendingConfig.intervalBetweenMessages}
                  onChange={(e) => setSendingConfig(prev => ({ ...prev, intervalBetweenMessages: parseInt(e.target.value) }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Pré-requisitos */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Pré-requisitos</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-green-500">✅</span>
                <span className="ml-2 text-sm text-gray-700">WhatsApp conectado</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500">✅</span>
                <span className="ml-2 text-sm text-gray-700">Grupos configurados</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500">✅</span>
                <span className="ml-2 text-sm text-gray-700">Produtos aprovados disponíveis</span>
              </div>
            </div>
          </div>

          {/* Controles do Envio */}
          <div className="flex space-x-3">
            <Button
              onClick={handleStartSending}
              disabled={sendingStatus.isRunning}
              variant="success"
              size="lg"
            >
              {sendingStatus.isRunning ? '⏳ Enviando...' : '📱 Iniciar Envio'}
            </Button>
            {sendingStatus.isRunning && (
              <Button
                onClick={handleStopSending}
                variant="danger"
                size="lg"
              >
                ⏹️ Parar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">💡 Como Funciona</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">1. Captura de Produtos</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Busca produtos no Mercado Livre e Shopee</li>
              <li>• Filtra por categoria e comissão mínima</li>
              <li>• Adiciona à lista de produtos para aprovação</li>
              <li>• Executa independentemente do envio</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">2. Envio para Grupos</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Envia apenas produtos aprovados</li>
              <li>• Respeita horários configurados nos grupos</li>
              <li>• Controla limite diário de mensagens</li>
              <li>• Usa templates personalizados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
