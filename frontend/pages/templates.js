import { useState } from 'react';
import { useApiQuery } from '../hooks/useApi';
import { templatesAPI } from '../services/api';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Loading from '../components/UI/Loading';

export default function Templates() {
  const { data: templates, loading } = useApiQuery(
    'templates',
    () => templatesAPI.getAll()
  );

  if (loading) {
    return <Loading text="Carregando templates..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Templates de Mensagem</h1>
        <p className="text-gray-600">Crie e edite modelos personalizados</p>
      </div>
      <div className="text-center py-12">
        <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Em desenvolvimento</h3>
        <p className="mt-1 text-sm text-gray-500">
          Esta funcionalidade estará disponível em breve.
        </p>
      </div>
    </div>
  );
}