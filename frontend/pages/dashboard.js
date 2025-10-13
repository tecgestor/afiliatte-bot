import { useApiQuery } from '../hooks/useApi';
import { generalAPI } from '../services/api';
import Loading from '../components/UI/Loading';

export default function Dashboard() {
  const { data: stats, loading } = useApiQuery('general-stats', generalAPI.getStats);

  if (loading) {
    return <Loading text="Carregando dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do robô de afiliados</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <h3 className="text-lg font-medium text-gray-900">Produtos</h3>
          <p className="text-2xl font-semibold text-primary-600">
            {stats?.data?.products?.total || 0}
          </p>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <h3 className="text-lg font-medium text-gray-900">Grupos</h3>
          <p className="text-2xl font-semibold text-success-600">
            {stats?.data?.groups?.total || 0}
          </p>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <h3 className="text-lg font-medium text-gray-900">Mensagens Hoje</h3>
          <p className="text-2xl font-semibold text-warning-600">
            {stats?.data?.messages?.today || 0}
          </p>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <h3 className="text-lg font-medium text-gray-900">Taxa Sucesso</h3>
          <p className="text-2xl font-semibold text-purple-600">94.2%</p>
        </div>
      </div>
    </div>

    <div className="mb-4">
      <h3>Teste de Navegação:</h3>
      <button onClick={() => router.push('/products')} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
        Ir para Produtos
      </button>
      <button onClick={() => router.push('/robot')} className="bg-green-500 text-white px-4 py-2 rounded">
        Ir para Robô
      </button>
    </div>
  );
}
