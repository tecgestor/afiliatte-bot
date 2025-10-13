import { useState } from 'react';
import { useApiQuery } from '../hooks/useApi';
import { historyAPI } from '../services/api';
import { ClockIcon } from '@heroicons/react/24/outline';
import Loading from '../components/UI/Loading';

export default function History() {
  const { data: history, loading } = useApiQuery(
    'history',
    () => historyAPI.getAll()
  );

  if (loading) {
    return <Loading text="Carregando histórico..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Envios</h1>
        <p className="text-gray-600">Acompanhe os envios e métricas</p>
      </div>
      <div className="text-center py-12">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Em desenvolvimento</h3>
        <p className="mt-1 text-sm text-gray-500">
          Esta funcionalidade estará disponível em breve.
        </p>
      </div>
    </div>
  );
}