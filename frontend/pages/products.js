import { useApiQuery } from '../hooks/useApi';
import { productsAPI } from '../services/api';
import Loading from '../components/UI/Loading';
import Button from '../components/UI/Button';

export default function Products() {
  const { data: products, loading } = useApiQuery('products', () => productsAPI.getAll());

  if (loading) {
    return <Loading text="Carregando produtos..." />;
  }

  const productList = products?.data?.docs || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerencie os produtos encontrados</p>
        </div>
        <Button>Atualizar</Button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {productList.map((product) => (
            <li key={product._id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{product.title}</p>
                  <p className="text-sm text-gray-500">
                    {product.platform} • R$ {product.price?.toFixed(2)}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  product.isApproved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.isApproved ? 'Aprovado' : 'Pendente'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}