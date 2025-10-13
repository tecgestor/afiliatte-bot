import { useState } from 'react';
import { useApiQuery, useApiMutation } from '../hooks/useApi';
import { robotAPI } from '../services/api';
import Button from '../components/UI/Button';
import Loading from '../components/UI/Loading';
import Alert from '../components/UI/Alert';
import { toast } from 'react-hot-toast';

export default function Robot() {
  const [runOptions, setRunOptions] = useState({
    categories: ['electronics', 'beauty'],
    platforms: ['mercadolivre', 'shopee'],
    scrapingLimit: 30
  });

  const { data: status, loading, refetch } = useApiQuery(
    'robot-status',
    robotAPI.getStatus,
    { refetchInterval: 5000 }
  );

  const runMutation = useApiMutation(
    (options) => robotAPI.run(options),
    {
      successMessage: 'Robô iniciado com sucesso!',
      invalidateQueries: ['robot-status'],
      onSuccess: () => {
        console.log('✅ Robô executado com sucesso');
        refetch();
      },
      onError: (error) => {
        console.error('❌ Erro ao executar robô:', error);
        toast.error('Erro ao executar robô: ' + error.message);
      }
    }
  );

  const stopMutation = useApiMutation(
    () => robotAPI.stop(),
    {
      successMessage: 'Robô parado com sucesso!',
      invalidateQueries: ['robot-status'],
    }
  );

  const handleRun = () => {
    console.log('🤖 Executando robô com opções:', runOptions);
    runMutation.mutate(runOptions);
  };

  const handleStop = () => {
    console.log('🛑 Parando robô');
    stopMutation.mutate();
  };

  if (loading) {
    return <Loading text="Carregando status do robô..." />;
  }

  const robotData = status?.data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Robô de Afiliados</h1>
        <p className="text-gray-600">Controle e monitore as execuções automáticas</p>
      </div>

      {/* Status do Robô */}
      {robotData.isRunning && (
        <Alert
          type="info"
          title="Robô em Execução"
          message={`Fase: ${robotData.currentExecution?.phase || 'Processando'} - ${robotData.currentExecution?.progress || 0}% concluído`}
        />
      )}

      {/* Configurações */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de Execução</h3>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categorias
            </label>
            <div className="space-y-2">
              {['electronics', 'beauty', 'home', 'fashion', 'sports'].map((category) => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={runOptions.categories.includes(category)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRunOptions(prev => ({
                          ...prev,
                          categories: [...prev.categories, category]
                        }));
                      } else {
                        setRunOptions(prev => ({
                          ...prev,
                          categories: prev.categories.filter(c => c !== category)
                        }));
                      }
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {category === 'electronics' ? 'Eletrônicos' : 
                     category === 'beauty' ? 'Beleza' :
                     category === 'home' ? 'Casa' :
                     category === 'fashion' ? 'Moda' : 'Esportes'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Limite de Produtos
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={runOptions.scrapingLimit}
              onChange={(e) => setRunOptions(prev => ({
                ...prev,
                scrapingLimit: parseInt(e.target.value)
              }))}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Controles</h3>
        
        <div className="flex space-x-3">
          {robotData.isRunning ? (
            <Button
              onClick={handleStop}
              loading={stopMutation.isLoading}
              variant="danger"
            >
              🛑 Parar Robô
            </Button>
          ) : (
            <Button
              onClick={handleRun}
              loading={runMutation.isLoading}
              variant="success"
            >
              🚀 Executar Robô
            </Button>
          )}
          
          <Button
            onClick={() => refetch()}
            variant="outline"
          >
            🔄 Atualizar Status
          </Button>
        </div>
      </div>

      {/* Status Atual */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Status Atual</h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center">
            <div className={`text-2xl font-bold ${robotData.isRunning ? 'text-green-600' : 'text-gray-400'}`}>
              {robotData.isRunning ? '🟢' : '🔴'}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {robotData.isRunning ? 'Executando' : 'Parado'}
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {robotData.lastExecution?.stats?.productsScraped || 0}
            </div>
            <p className="text-sm text-gray-600 mt-1">Produtos Processados</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {robotData.lastExecution?.stats?.messagesSent || 0}
            </div>
            <p className="text-sm text-gray-600 mt-1">Mensagens Enviadas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
