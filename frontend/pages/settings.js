import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { useApiQuery, useApiMutation } from '../hooks/useApi';
import { generalAPI } from '../services/api';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import Modal from '../components/UI/Modal';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('robot');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Configurações do Robô
  const [robotConfig, setRobotConfig] = useState({
    commissionRange: {
      min: 5,
      max: 25
    },
    sendingHours: {
      start: 8,
      end: 22
    },
    categories: ['electronics', 'beauty', 'home'],
    platforms: ['mercadolivre', 'shopee'],
    maxMessagesPerDay: 10,
    intervalBetweenMessages: 30,
    onlyApprovedProducts: true,
    minCommissionQuality: ['excelente', 'boa'],
    minRating: 4.0,
    minSales: 100,
    autoApproveExcellent: false
  });

  // Salvar configurações
  const saveConfigMutation = useApiMutation(
    (config) => generalAPI.saveRobotConfig ? generalAPI.saveRobotConfig(config) : Promise.resolve(config),
    {
      onSuccess: () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    }
  );

  const handleSaveRobotConfig = () => {
    console.log('💾 Salvando configurações do robô:', robotConfig);
    saveConfigMutation.mutate(robotConfig);
    // Salvar no localStorage como fallback
    localStorage.setItem('robotConfig', JSON.stringify(robotConfig));
    toast.success('Configurações salvas com sucesso!');
  };

  // Carregar configurações salvas
  useEffect(() => {
    const savedConfig = localStorage.getItem('robotConfig');
    if (savedConfig) {
      try {
        setRobotConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }, []);

  const tabs = [
    { id: 'robot', name: '🤖 Robô', icon: '⚙️' },
    { id: 'whatsapp', name: '📱 WhatsApp', icon: '💬' },
    { id: 'profile', name: '👤 Perfil', icon: '👤' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie configurações do robô e integrações</p>
      </div>

      {showSuccess && (
        <Alert
          type="success"
          title="Sucesso!"
          message="Configurações salvas com sucesso"
          show={showSuccess}
          onClose={() => setShowSuccess(false)}
        />
      )}

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
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'robot' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Parâmetros do Robô</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Configure os critérios para seleção automática de produtos
                </p>
              </div>

              {/* Faixa de Comissão */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-4">💰 Faixa de Comissão (%)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mínimo</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={robotConfig.commissionRange.min}
                      onChange={(e) => setRobotConfig(prev => ({
                        ...prev,
                        commissionRange: { ...prev.commissionRange, min: parseFloat(e.target.value) }
                      }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Máximo</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={robotConfig.commissionRange.max}
                      onChange={(e) => setRobotConfig(prev => ({
                        ...prev,
                        commissionRange: { ...prev.commissionRange, max: parseFloat(e.target.value) }
                      }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Produtos com comissão entre {robotConfig.commissionRange.min}% e {robotConfig.commissionRange.max}% serão selecionados
                </p>
              </div>

              {/* Horários de Envio */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-4">🕐 Horários de Envio</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Início</label>
                    <select
                      value={robotConfig.sendingHours.start}
                      onChange={(e) => setRobotConfig(prev => ({
                        ...prev,
                        sendingHours: { ...prev.sendingHours, start: parseInt(e.target.value) }
                      }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fim</label>
                    <select
                      value={robotConfig.sendingHours.end}
                      onChange={(e) => setRobotConfig(prev => ({
                        ...prev,
                        sendingHours: { ...prev.sendingHours, end: parseInt(e.target.value) }
                      }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Categorias */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-4">🏷️ Categorias de Produtos</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'electronics', label: 'Eletrônicos' },
                    { key: 'beauty', label: 'Beleza' },
                    { key: 'home', label: 'Casa e Jardim' },
                    { key: 'fashion', label: 'Moda' },
                    { key: 'sports', label: 'Esportes' },
                    { key: 'books', label: 'Livros' }
                  ].map((category) => (
                    <label key={category.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={robotConfig.categories.includes(category.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRobotConfig(prev => ({
                              ...prev,
                              categories: [...prev.categories, category.key]
                            }));
                          } else {
                            setRobotConfig(prev => ({
                              ...prev,
                              categories: prev.categories.filter(c => c !== category.key)
                            }));
                          }
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button
                  onClick={handleSaveRobotConfig}
                  loading={saveConfigMutation.isLoading}
                  className="w-full sm:w-auto"
                >
                  💾 Salvar Configurações do Robô
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Integração WhatsApp</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Configure a integração com Evolution API para envio automático
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-yellow-400 text-xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Configuração Necessária
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Para funcionar corretamente, você precisa configurar a Evolution API. Clique no botão abaixo para ver o tutorial completo.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button
                  onClick={() => setShowWhatsAppModal(true)}
                  variant="primary"
                  size="lg"
                >
                  📖 Ver Tutorial de Configuração WhatsApp
                </Button>
              </div>

              {/* Status da Conexão */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-4">Status da Conexão</h4>
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 bg-red-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Desconectado - Configure a Evolution API</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Informações da Conta</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Gerencie suas informações pessoais
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    <input
                      type="text"
                      value={user?.name || ''}
                      readOnly
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user?.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tutorial WhatsApp - Versão Simplificada */}
      <Modal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        title="📱 Tutorial: Configuração Evolution API + WhatsApp"
        size="xl"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-blue-800 font-semibold mb-2">🎯 Resumo da Configuração:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Instalar Evolution API no servidor</li>
              <li>• Conectar WhatsApp via QR Code</li>
              <li>• Configurar webhooks no backend</li>
              <li>• Testar envios automáticos</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">1. Instalar Evolution API</h3>
              <div className="bg-gray-50 rounded p-3 mt-2">
                <p className="text-sm">Execute em seu servidor VPS:</p>
                <code className="block mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs">
                  git clone https://github.com/EvolutionAPI/evolution-api.git<br/>
                  cd evolution-api<br/>
                  docker-compose up -d
                </code>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">2. Configurar Variáveis</h3>
              <div className="bg-gray-50 rounded p-3 mt-2">
                <p className="text-sm">No Render, adicione:</p>
                <code className="block mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs">
                  WHATSAPP_API_URL=http://SEU-SERVIDOR:8080<br/>
                  WHATSAPP_API_KEY=SUA-CHAVE-SECRETA<br/>
                  WHATSAPP_INSTANCE_NAME=affiliate_bot
                </code>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">3. Conectar WhatsApp</h3>
              <div className="bg-gray-50 rounded p-3 mt-2">
                <ol className="text-sm space-y-1">
                  <li>1. Acesse: http://SEU-SERVIDOR:8080/manager</li>
                  <li>2. Criar instância: affiliate_bot</li>
                  <li>3. Escanear QR Code com WhatsApp</li>
                  <li>4. Aguardar status Connected</li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">4. Configurar Grupos</h3>
              <div className="bg-gray-50 rounded p-3 mt-2">
                <p className="text-sm">
                  Adicione o bot aos grupos desejados e use o menu Grupos 
                  para cadastrar os IDs dos grupos WhatsApp.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-green-800 font-semibold mb-2">✅ Resultado Final:</h4>
            <p className="text-green-700 text-sm">
              Após a configuração, o robô enviará mensagens automáticas 
              para os grupos cadastrados seguindo os parâmetros definidos.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
