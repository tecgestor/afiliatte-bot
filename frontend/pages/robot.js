import { useState } from 'react';
import { useApiQuery, useApiMutation } from '../hooks/useApi';
import { robotAPI } from '../services/api';
import Button from '../components/UI/Button';
import Loading from '../components/UI/Loading';

export default function Robot() {
  const { data: status, loading } = useApiQuery('robot-status', robotAPI.getStatus);
  const runMutation = useApiMutation((options) => robotAPI.run(options));

  if (loading) {
    return <Loading text="Carregando status do robô..." />;
  }

  const robotData = status?.data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Robô de Afiliados</h1>
        <p className="text-gray-600">Controle as execuções automáticas</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${
              robotData.isRunning ? 'text-green-600' : 'text-gray-500'
            }`}>
              {robotData.isRunning ? 'Executando' : 'Parado'}
            </p>
          </div>
          <Button
            onClick={() => runMutation.mutate({ categories: ['electronics'], platforms: ['mercadolivre'] })}
            loading={runMutation.isLoading}
            disabled={robotData.isRunning}
          >
            {robotData.isRunning ? 'Executando...' : 'Executar Robô'}
          </Button>
        </div>
      </div>
    </div>
  );
}