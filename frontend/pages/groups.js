import { useState } from 'react';
import { useApiQuery, useApiMutation } from '../hooks/useApi';
import { groupsAPI } from '../services/api';
import { UserGroupIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Button from '../components/UI/Button';
import Loading from '../components/UI/Loading';

export default function Groups() {
  const { data: groups, loading } = useApiQuery(
    'groups',
    () => groupsAPI.getAll()
  );

  if (loading) {
    return <Loading text="Carregando grupos..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Grupos WhatsApp</h1>
        <p className="text-gray-600">Gerencie os grupos para envio automático</p>
      </div>
      <div className="text-center py-12">
        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Em desenvolvimento</h3>
        <p className="mt-1 text-sm text-gray-500">
          Esta funcionalidade estará disponível em breve.
        </p>
      </div>
    </div>
  );
}