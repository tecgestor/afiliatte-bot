import { useState } from 'react';
import { useApiQuery, useApiMutation } from '../hooks/useApi';
import { productsAPI } from '../services/api';
import Button from '../components/UI/Button';
import Loading from '../components/UI/Loading';
import Modal from '../components/UI/Modal';
import { toast } from 'react-hot-toast';

export default function Products() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    platform: '',
    approved: ''
  });
  
  const { data: products, loading, refetch, isRefetching } = useApiQuery(
    ['products', filters],
    () => productsAPI.getAll(filters)
  );

  const approveMutation = useApiMutation(
    (id) => productsAPI.approve(id),
    {
      successMessage: 'Produto aprovado com sucesso!',
      invalidateQueries: [['products']],
      onSuccess: () => {
        refetch();
      }
    }
  );

  const handleRefresh = () => {
    console.log('🔄 Atualizando lista de produtos');
    refetch();
    toast.success('Lista de produtos atualizada!');
  };

  const handleApprove = async (id) => {
    try {
      await approveMutation.mutateAsync(id);
      console.log('✅ Produto aprovado:', id);
    } catch (error) {
      console.error('❌ Erro ao aprovar produto:', error);
    }
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  if (loading) {
    return <Loading text="Carregando produtos..." />;
  }

  const productList = products?.data?.docs || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerencie os produtos encontrados pelo scraping</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={handleRefresh}
            loading={isRefetching}
            variant="outline"
          >
            🔄 Atualizar
          </Button>
          <Button variant="primary">
            ➕ Adicionar Produto
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Categoria</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todas</option>
              <option value="electronics">Eletrônicos</option>
              <option value="beauty">Beleza</option>
              <option value="home">Casa</option>
              <option value="fashion">Moda</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Plataforma</label>
            <select
              value={filters.platform}
              onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todas</option>
              <option value="mercadolivre">Mercado Livre</option>
              <option value="shopee">Shopee</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.approved}
              onChange={(e) => setFilters(prev => ({ ...prev, approved: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todos</option>
              <option value="true">Aprovados</option>
              <option value="false">Pendentes</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => setFilters({ category: '', platform: '', approved: '' })}
              variant="outline"
              className="w-full"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {productList.map((product) => (
            <li key={product._id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <img
                      className="h-12 w-12 rounded-lg object-cover"
                      src={product.imageUrl || 'https://via.placeholder.com/48'}
                      alt={product.title}
                      onError={(e) => e.target.src = 'https://via.placeholder.com/48'}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.title}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className="capitalize">{product.platform}</span>
                        <span>•</span>
                        <span>R$ {product.price?.toFixed(2)}</span>
                        <span>•</span>
                        <span>Comissão: R$ {product.estimatedCommission?.toFixed(2)}</span>
                        <span>•</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          product.commissionQuality === 'excelente' ? 'bg-green-100 text-green-800' :
                          product.commissionQuality === 'boa' ? 'bg-yellow-100 text-yellow-800' :
                          product.commissionQuality === 'regular' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.commissionQuality}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {product.isApproved ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅ Aprovado
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleApprove(product._id)}
                      loading={approveMutation.isLoading}
                    >
                      ✅ Aprovar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(product)}
                  >
                    👁️ Detalhes
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {productList.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900">Nenhum produto encontrado</h3>
            <p className="text-gray-500 mt-2">Execute o robô para encontrar novos produtos</p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Detalhes do Produto"
        size="lg"
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <img
                className="h-24 w-24 rounded-lg object-cover"
                src={selectedProduct.imageUrl || 'https://via.placeholder.com/96'}
                alt={selectedProduct.title}
              />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedProduct.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedProduct.description || 'Sem descrição disponível'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Plataforma:</span>
                <span className="ml-2 capitalize">{selectedProduct.platform}</span>
              </div>
              <div>
                <span className="font-medium">Categoria:</span>
                <span className="ml-2">{selectedProduct.category}</span>
              </div>
              <div>
                <span className="font-medium">Preço:</span>
                <span className="ml-2">R$ {selectedProduct.price?.toFixed(2)}</span>
              </div>
              <div>
                <span className="font-medium">Comissão:</span>
                <span className="ml-2">R$ {selectedProduct.estimatedCommission?.toFixed(2)}</span>
              </div>
              <div>
                <span className="font-medium">Avaliação:</span>
                <span className="ml-2">{selectedProduct.rating}/5 ⭐</span>
              </div>
              <div>
                <span className="font-medium">Vendas:</span>
                <span className="ml-2">{selectedProduct.salesCount} vendidos</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <a
                href={selectedProduct.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                🔗 Ver Produto Original
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
