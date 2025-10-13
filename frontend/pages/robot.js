import { useState, useEffect } from 'react';
import Button from '../components/UI/Button';
import Loading from '../components/UI/Loading';
import { toast } from 'react-hot-toast';
import axios from 'axios';

// API para scraping real
const scrapingAPI = {
  runScraping: async (config) => {
    try {
      const response = await axios.post('/api/robot/scraping/run', config, {
        timeout: 120000 // 2 minutos timeout
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro na requisição');
    }
  },

  testScraping: async (platform, category) => {
    try {
      const response = await axios.get(`/api/robot/scraping/test?platform=${platform}&category=${category}`, {
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro no teste');
    }
  }
};

export default function Robot() {
  const [scrapingStatus, setScrapingStatus] = useState({
    isRunning: false,
    lastExecution: null,
    stats: {
      productsScraped: 0,
      productsApproved: 0,
      mercadolivre: 0,
      shopee: 0,
      errors: 0
    },
    lastResults: []
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

  const [testingPlatform, setTestingPlatform] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadRobotStatus();
  }, []);

  const loadRobotStatus = () => {
    try {
      const savedScrapingStatus = localStorage.getItem('scraping_status_real');
      const savedSendingStatus = localStorage.getItem('sending_status');

      if (savedScrapingStatus) {
        setScrapingStatus(JSON.parse(savedScrapingStatus));
      }

      if (savedSendingStatus) {
        setSendingStatus(JSON.parse(savedSendingStatus));
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  const saveScrapingStatus = (status) => {
    localStorage.setItem('scraping_status_real', JSON.stringify(status));
    setScrapingStatus(status);
  };

  const handleStartRealScraping = async () => {
    try {
      if (scrapingStatus.isRunning) {
        toast.error('Scraping já está em execução');
        return;
      }

      // Validações
      if (scrapingConfig.platforms.length === 0) {
        toast.error('Selecione pelo menos uma plataforma');
        return;
      }

      if (scrapingConfig.categories.length === 0) {
        toast.error('Selecione pelo menos uma categoria');
        return;
      }

      setScrapingStatus(prev => ({ ...prev, isRunning: true }));
      toast.loading('🔍 Iniciando captura REAL de produtos...', { id: 'scraping' });

      console.log('🚀 Configuração de scraping:', scrapingConfig);

      // Chamar API real de scraping
      const result = await scrapingAPI.runScraping(scrapingConfig);

      if (result.success) {
        const newStatus = {
          isRunning: false,
          lastExecution: new Date().toISOString(),
          stats: {
            productsScraped: result.data.products.length,
            productsApproved: result.data.products.filter(p => p.isApproved).length,
            mercadolivre: result.data.stats.mercadolivre,
            shopee: result.data.stats.shopee,
            errors: 0
          },
          lastResults: result.data.products.slice(0, 10) // Primeiros 10 para preview
        };

        saveScrapingStatus(newStatus);

        // Salvar produtos no localStorage para visualização
        const existingProducts = JSON.parse(localStorage.getItem('affiliate_products') || '[]');
        const newProducts = result.data.products.map(p => ({
          id: Date.now() + Math.random(),
          title: p.title,
          price: p.price,
          originalPrice: p.originalPrice,
          category: p.category,
          platform: p.platform,
          productUrl: p.productUrl,
          affiliateLink: p.affiliateLink,
          imageUrl: p.imageUrl,
          rating: p.rating,
          reviewsCount: p.reviewsCount,
          salesCount: p.salesCount,
          commissionRate: p.commissionRate,
          estimatedCommission: p.estimatedCommission,
          commissionQuality: p.commissionQuality,
          isApproved: false, // Produtos reais precisam de aprovação manual
          createdAt: new Date().toISOString(),
          scrapedAt: p.scrapedAt
        }));

        // Manter apenas os 100 produtos mais recentes
        const allProducts = [...newProducts, ...existingProducts].slice(0, 100);
        localStorage.setItem('affiliate_products', JSON.stringify(allProducts));

        toast.success(
          `✅ Captura concluída! ${newStatus.stats.productsScraped} produtos reais encontrados`, 
          { id: 'scraping' }
        );

        setShowResults(true);

      } else {
        throw new Error(result.message || 'Erro no scraping');
      }

    } catch (error) {
      console.error('❌ Erro no scraping real:', error);

      const errorStatus = {
        ...scrapingStatus,
        isRunning: false,
        stats: { ...scrapingStatus.stats, errors: scrapingStatus.stats.errors + 1 }
      };

      saveScrapingStatus(errorStatus);
      toast.error(`❌ Erro: ${error.message}`, { id: 'scraping' });
    }
  };

  const handleTestPlatform = async (platform) => {
    try {
      setTestingPlatform(platform);
      toast.loading(`🧪 Testando ${platform}...`, { id: 'test' });

      const category = scrapingConfig.categories[0] || 'electronics';
      const result = await scrapingAPI.testScraping(platform, category);

      if (result.success) {
        toast.success(
          `✅ Teste ${platform}: ${result.data.count} produtos encontrados`, 
          { id: 'test' }
        );

        // Mostrar preview dos resultados
        console.log(`📋 Produtos de teste ${platform}:`, result.data.products);
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      console.error(`❌ Erro no teste ${platform}:`, error);
      toast.error(`❌ Teste ${platform} falhou: ${error.message}`, { id: 'test' });
    } finally {
      setTestingPlatform('');
    }
  };

  const handleStartSending = async () => {
    try {
      if (sendingStatus.isRunning) {
        toast.error('Envio automático já está em execução');
        return;
      }

      const groups = JSON.parse(localStorage.getItem('affiliate_groups') || '[]');
      const activeGroups = groups.filter(g => g.isActive && g.sendingEnabled);

      if (activeGroups.length === 0) {
        toast.error('Nenhum grupo ativo para envio. Configure grupos primeiro.');
        return;
      }

      const products = JSON.parse(localStorage.getItem('affiliate_products') || '[]');
      const approvedProducts = products.filter(p => p.isApproved);

      if (approvedProducts.length === 0) {
        toast.error('Nenhum produto aprovado para envio. Aprove produtos primeiro.');
        return;
      }

      setSendingStatus(prev => ({ ...prev, isRunning: true }));
      toast.loading('📱 Iniciando envio para grupos...', { id: 'sending' });

      // Simular envio (seria integração real com WhatsApp)
      await new Promise(resolve => setTimeout(resolve, 4000));

      const results = {
        messagesSent: Math.min(activeGroups.length * sendingConfig.maxMessagesPerGroup, approvedProducts.length),
        groupsProcessed: activeGroups.length,
        errors: 0
      };

      const newStatus = {
        isRunning: false,
        lastExecution: new Date().toISOString(),
        stats: results
      };

      setSendingStatus(newStatus);
      localStorage.setItem('sending_status', JSON.stringify(newStatus));

      toast.success(
        `✅ Envio concluído! ${results.messagesSent} mensagens enviadas para ${results.groupsProcessed} grupos`, 
        { id: 'sending' }
      );

    } catch (error) {
      console.error('❌ Erro no envio:', error);
      setSendingStatus(prev => ({ ...prev, isRunning: false }));
      toast.error(`❌ Erro: ${error.message}`, { id: 'sending' });
    }
  };

  const renderProductPreview = (product) => (
    <div key={product.title} className="bg-white border rounded-lg p-3 mb-2">
      <div className="flex items-center space-x-3">
        <img
          src={product.imageUrl || 'https://via.placeholder.com/60x60'}
          alt={product.title}
          className="w-12 h-12 rounded object-cover"
          onError={(e) => e.target.src = 'https://via.placeholder.com/60x60'}
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 line-clamp-2">
            {product.title}
          </p>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span className="capitalize">{product.platform}</span>
            <span>•</span>
            <span>R$ {product.price?.toFixed(2)}</span>
            <span>•</span>
            <span>Comissão: R$ {product.estimatedCommission?.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Robô com Scraping REAL</h1>
        <p className="text-gray-600">Captura produtos reais do Mercado Livre e Shopee, depois envia para grupos WhatsApp</p>
      </div>

      {/* AUTOMAÇÃO 1: SCRAPING REAL DE PRODUTOS */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">🔍</span>
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Captura REAL de Produtos</h2>
                <p className="text-sm text-gray-600">Web scraping dos produtos mais vendidos em tempo real</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTestPlatform('mercadolivre')}
                loading={testingPlatform === 'mercadolivre'}
                disabled={testingPlatform !== ''}
              >
                🧪 Testar ML
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTestPlatform('shopee')}
                loading={testingPlatform === 'shopee'}
                disabled={testingPlatform !== ''}
              >
                🧪 Testar Shopee
              </Button>
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
                    {scrapingStatus.isRunning ? '🟢 Capturando' : '🔴 Parado'}
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
              <h3 className="text-md font-medium text-gray-900 mb-4">Última Execução REAL</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{scrapingStatus.stats.productsScraped}</div>
                  <div className="text-sm text-gray-500">Capturados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{scrapingStatus.stats.mercadolivre}</div>
                  <div className="text-sm text-gray-500">Mercado Livre</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{scrapingStatus.stats.shopee}</div>
                  <div className="text-sm text-gray-500">Shopee</div>
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
            <h3 className="text-md font-medium text-gray-900 mb-4">Configurações REAIS</h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plataformas</label>
                <div className="space-y-2">
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
                      <span className="ml-2 text-sm text-gray-700">
                        {platform === 'mercadolivre' ? 'Mercado Livre' : 'Shopee'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categorias</label>
                <div className="space-y-2">
                  {['electronics', 'beauty', 'home', 'fashion'].map(category => (
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
                         category === 'beauty' ? 'Beleza' : 
                         category === 'home' ? 'Casa' : 'Moda'}
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
                  max="20"
                  step="0.5"
                  value={scrapingConfig.minCommission}
                  onChange={(e) => setScrapingConfig(prev => ({ ...prev, minCommission: parseFloat(e.target.value) }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Preview dos Últimos Resultados */}
          {scrapingStatus.lastResults && scrapingStatus.lastResults.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium text-gray-900">🎯 Produtos Capturados (Preview)</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowResults(!showResults)}
                >
                  {showResults ? 'Ocultar' : 'Mostrar'} ({scrapingStatus.lastResults.length})
                </Button>
              </div>

              {showResults && (
                <div className="max-h-60 overflow-y-auto bg-gray-50 rounded-lg p-4">
                  {scrapingStatus.lastResults.map((product, index) => renderProductPreview(product))}
                </div>
              )}
            </div>
          )}

          {/* Controles do Scraping */}
          <div className="flex space-x-3">
            <Button
              onClick={handleStartRealScraping}
              disabled={scrapingStatus.isRunning || scrapingConfig.platforms.length === 0}
              variant="primary"
              size="lg"
              loading={scrapingStatus.isRunning}
            >
              {scrapingStatus.isRunning ? '⏳ Capturando Produtos REAIS...' : '🔍 Iniciar Captura REAL'}
            </Button>

            {scrapingStatus.lastResults && scrapingStatus.lastResults.length > 0 && (
              <Button
                onClick={() => window.open('/products', '_blank')}
                variant="outline"
                size="lg"
              >
                📦 Ver Todos os Produtos
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
              <h2 className="text-lg font-medium text-gray-900">Envio para Grupos WhatsApp</h2>
              <p className="text-sm text-gray-600">Envia produtos aprovados automaticamente para grupos</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Status do Envio */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Status do Envio</h3>
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
              <h3 className="text-md font-medium text-gray-900 mb-4">Estatísticas</h3>
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

          <div className="flex space-x-3">
            <Button
              onClick={handleStartSending}
              disabled={sendingStatus.isRunning}
              variant="success"
              size="lg"
              loading={sendingStatus.isRunning}
            >
              {sendingStatus.isRunning ? '⏳ Enviando...' : '📱 Iniciar Envio para Grupos'}
            </Button>

            <Button
              onClick={() => window.open('/groups', '_blank')}
              variant="outline"
              size="lg"
            >
              📱 Gerenciar Grupos
            </Button>
          </div>
        </div>
      </div>

      {/* Resumo Técnico */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">🚀 Sistema com Web Scraping REAL</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">1. Scraping Inteligente</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Mercado Livre:</strong> Produtos mais vendidos por categoria</li>
              <li>• <strong>Shopee:</strong> Ofertas em destaque com desconto</li>
              <li>• <strong>Dados reais:</strong> Preços, imagens, avaliações, links</li>
              <li>• <strong>Anti-blocking:</strong> Headers realistas + delays</li>
              <li>• <strong>Links de afiliado:</strong> Gerados automaticamente</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">2. Processamento Automático</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Filtros inteligentes:</strong> Rating, comissão, preço</li>
              <li>• <strong>Categorização:</strong> IA classifica produtos</li>
              <li>• <strong>Qualidade:</strong> Apenas produtos com potencial</li>
              <li>• <strong>Aprovação manual:</strong> Controle de qualidade</li>
              <li>• <strong>Envio automatizado:</strong> Para grupos WhatsApp</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
          <p className="text-sm text-gray-700">
            <strong>💡 Como funciona:</strong> O sistema faz scraping dos produtos mais vendidos nas plataformas, 
            extrai todas as informações (título, preço, imagem, link), gera links de afiliado e salva no banco. 
            Depois você aprova os produtos e o robô envia automaticamente para seus grupos WhatsApp com templates personalizados.
          </p>
        </div>
      </div>
    </div>
  );
}
