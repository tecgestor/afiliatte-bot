import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../components/UI/Button';
import Loading from '../components/UI/Loading';
import Modal from '../components/UI/Modal';
import { toast } from 'react-hot-toast';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    platform: '',
    approved: ''
  });

  const addForm = useForm({
    defaultValues: {
      title: '',
      description: '',
      price: '',
      originalPrice: '',
      category: 'electronics',
      platform: 'mercadolivre',
      productUrl: '',
      affiliateLink: '',
      imageUrl: '',
      rating: 0,
      reviewsCount: 0,
      salesCount: 0,
      commissionRate: 5,
      isApproved: false
    }
  });

  const editForm = useForm();

  // Carregar produtos do localStorage
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    setLoading(true);
    try {
      const savedProducts = localStorage.getItem('affiliate_products');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      } else {
        // Produtos iniciais se não existir nada
        const initialProducts = [
          {
            id: '1',
            title: 'Smartphone Samsung Galaxy S24 Ultra 256GB',
            description: 'Smartphone premium com câmera profissional',
            price: 4299.99,
            originalPrice: 4999.99,
            category: 'electronics',
            platform: 'mercadolivre',
            productUrl: 'https://produto.mercadolivre.com.br/MLB-123456',
            affiliateLink: 'https://produto.mercadolivre.com.br/MLB-123456?ref=aff_123',
            imageUrl: 'https://via.placeholder.com/300x300',
            rating: 4.8,
            reviewsCount: 1250,
            salesCount: 850,
            commissionRate: 5,
            estimatedCommission: 215.00,
            commissionQuality: 'excelente',
            isApproved: true,
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            title: 'iPhone 15 Pro Max 512GB',
            description: 'iPhone mais avançado da Apple',
            price: 7999.99,
            originalPrice: 8999.99,
            category: 'electronics',
            platform: 'mercadolivre',
            productUrl: 'https://produto.mercadolivre.com.br/MLB-789012',
            affiliateLink: 'https://produto.mercadolivre.com.br/MLB-789012?ref=aff_123',
            imageUrl: 'https://via.placeholder.com/300x300',
            rating: 4.9,
            reviewsCount: 890,
            salesCount: 432,
            commissionRate: 5,
            estimatedCommission: 400.00,
            commissionQuality: 'excelente',
            isApproved: false,
            createdAt: new Date().toISOString()
          }
        ];
        setProducts(initialProducts);
        localStorage.setItem('affiliate_products', JSON.stringify(initialProducts));
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const saveProducts = (updatedProducts) => {
    localStorage.setItem('affiliate_products', JSON.stringify(updatedProducts));
    setProducts(updatedProducts);
  };

  const handleAddProduct = (data) => {
    try {
      const newProduct = {
        ...data,
        id: Date.now().toString(),
        price: parseFloat(data.price),
        originalPrice: parseFloat(data.originalPrice) || null,
        rating: parseFloat(data.rating) || 0,
        reviewsCount: parseInt(data.reviewsCount) || 0,
        salesCount: parseInt(data.salesCount) || 0,
        commissionRate: parseFloat(data.commissionRate) || 5,
        estimatedCommission: (parseFloat(data.price) * parseFloat(data.commissionRate)) / 100,
        commissionQuality: calculateCommissionQuality(parseFloat(data.commissionRate)),
        createdAt: new Date().toISOString()
      };

      const updatedProducts = [newProduct, ...products];
      saveProducts(updatedProducts);

      addForm.reset();
      setShowAddModal(false);
      toast.success('Produto adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast.error('Erro ao adicionar produto');
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    editForm.reset(product);
    setShowEditModal(true);
  };

  const handleUpdateProduct = (data) => {
    try {
      const updatedProduct = {
        ...data,
        id: selectedProduct.id,
        price: parseFloat(data.price),
        originalPrice: parseFloat(data.originalPrice) || null,
        rating: parseFloat(data.rating) || 0,
        reviewsCount: parseInt(data.reviewsCount) || 0,
        salesCount: parseInt(data.salesCount) || 0,
        commissionRate: parseFloat(data.commissionRate) || 5,
        estimatedCommission: (parseFloat(data.price) * parseFloat(data.commissionRate)) / 100,
        commissionQuality: calculateCommissionQuality(parseFloat(data.commissionRate)),
        updatedAt: new Date().toISOString()
      };

      const updatedProducts = products.map(p => 
        p.id === selectedProduct.id ? updatedProduct : p
      );

      saveProducts(updatedProducts);
      setShowEditModal(false);
      setSelectedProduct(null);
      toast.success('Produto atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto');
    }
  };

  const handleApproveProduct = (productId) => {
    try {
      const updatedProducts = products.map(p => 
        p.id === productId ? { ...p, isApproved: !p.isApproved } : p
      );
      saveProducts(updatedProducts);
      toast.success('Status do produto alterado!');
    } catch (error) {
      console.error('Erro ao aprovar produto:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        const updatedProducts = products.filter(p => p.id !== productId);
        saveProducts(updatedProducts);
        toast.success('Produto excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        toast.error('Erro ao excluir produto');
      }
    }
  };

  const calculateCommissionQuality = (rate) => {
    if (rate >= 15) return 'excelente';
    if (rate >= 10) return 'boa';
    if (rate >= 5) return 'regular';
    return 'baixa';
  };

  const filteredProducts = products.filter(product => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.platform && product.platform !== filters.platform) return false;
    if (filters.approved === 'true' && !product.isApproved) return false;
    if (filters.approved === 'false' && product.isApproved) return false;
    return true;
  });

  if (loading) {
    return <Loading text="Carregando produtos..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerencie os produtos para afiliação</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={loadProducts} variant="outline">
            🔄 Atualizar
          </Button>
          <Button onClick={() => setShowAddModal(true)} variant="primary">
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
              <option value="sports">Esportes</option>
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
              <option value="amazon">Amazon</option>
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
          {filteredProducts.map((product) => (
            <li key={product.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    className="h-16 w-16 rounded-lg object-cover"
                    src={product.imageUrl || 'https://via.placeholder.com/64'}
                    alt={product.title}
                    onError={(e) => e.target.src = 'https://via.placeholder.com/64'}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.title}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                      <span className="capitalize">{product.platform}</span>
                      <span>•</span>
                      <span>R$ {product.price?.toFixed(2)}</span>
                      {product.originalPrice && (
                        <>
                          <span>•</span>
                          <span className="line-through">R$ {product.originalPrice.toFixed(2)}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Comissão: R$ {product.estimatedCommission?.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                      <span>⭐ {product.rating}/5</span>
                      <span>•</span>
                      <span>{product.salesCount} vendidos</span>
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

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant={product.isApproved ? "success" : "outline"}
                    onClick={() => handleApproveProduct(product.id)}
                  >
                    {product.isApproved ? '✅ Aprovado' : '⏳ Aprovar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditProduct(product)}
                  >
                    ✏️ Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    🗑️ Excluir
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900">Nenhum produto encontrado</h3>
            <p className="text-gray-500 mt-2">Adicione produtos ou ajuste os filtros</p>
          </div>
        )}
      </div>

      {/* Modal Adicionar Produto */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="➕ Adicionar Novo Produto"
        size="xl"
      >
        <form onSubmit={addForm.handleSubmit(handleAddProduct)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Título do Produto</label>
              <input
                {...addForm.register('title', { required: 'Título é obrigatório' })}
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: Smartphone Samsung Galaxy S24"
              />
              {addForm.formState.errors.title && (
                <p className="mt-1 text-sm text-red-600">{addForm.formState.errors.title.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Descrição</label>
              <textarea
                {...addForm.register('description')}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Descrição detalhada do produto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Preço Atual (R$)</label>
              <input
                {...addForm.register('price', { required: 'Preço é obrigatório' })}
                type="number"
                step="0.01"
                min="0"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Preço Original (R$)</label>
              <input
                {...addForm.register('originalPrice')}
                type="number"
                step="0.01"
                min="0"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Categoria</label>
              <select
                {...addForm.register('category', { required: 'Categoria é obrigatória' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="electronics">Eletrônicos</option>
                <option value="beauty">Beleza</option>
                <option value="home">Casa e Jardim</option>
                <option value="fashion">Moda</option>
                <option value="sports">Esportes</option>
                <option value="books">Livros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Plataforma</label>
              <select
                {...addForm.register('platform', { required: 'Plataforma é obrigatória' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="mercadolivre">Mercado Livre</option>
                <option value="shopee">Shopee</option>
                <option value="amazon">Amazon</option>
                <option value="magazineluiza">Magazine Luiza</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">URL do Produto</label>
              <input
                {...addForm.register('productUrl', { required: 'URL do produto é obrigatória' })}
                type="url"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://produto.mercadolivre.com.br/MLB-123456"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">URL de Afiliado</label>
              <input
                {...addForm.register('affiliateLink', { required: 'URL de afiliado é obrigatória' })}
                type="url"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://produto.mercadolivre.com.br/MLB-123456?ref=seu_codigo_afiliado"
              />
              <p className="mt-1 text-xs text-gray-500">Este link será enviado para os grupos WhatsApp</p>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">URL da Imagem</label>
              <input
                {...addForm.register('imageUrl')}
                type="url"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Avaliação (0-5)</label>
              <input
                {...addForm.register('rating')}
                type="number"
                step="0.1"
                min="0"
                max="5"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="4.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Nº de Avaliações</label>
              <input
                {...addForm.register('reviewsCount')}
                type="number"
                min="0"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="1250"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Vendas</label>
              <input
                {...addForm.register('salesCount')}
                type="number"
                min="0"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="850"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Taxa de Comissão (%)</label>
              <input
                {...addForm.register('commissionRate')}
                type="number"
                step="0.1"
                min="0"
                max="50"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="5.0"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...addForm.register('isApproved')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Aprovar automaticamente</span>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              ➕ Adicionar Produto
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Produto */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`✏️ Editar Produto`}
        size="xl"
      >
        {selectedProduct && (
          <form onSubmit={editForm.handleSubmit(handleUpdateProduct)} className="space-y-6">
            {/* Similar ao modal de adicionar, mas com dados preenchidos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Título do Produto</label>
                <input
                  {...editForm.register('title', { required: 'Título é obrigatório' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Preço Atual (R$)</label>
                <input
                  {...editForm.register('price', { required: 'Preço é obrigatório' })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Taxa de Comissão (%)</label>
                <input
                  {...editForm.register('commissionRate')}
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">URL de Afiliado</label>
                <input
                  {...editForm.register('affiliateLink', { required: 'URL de afiliado é obrigatória' })}
                  type="url"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                💾 Salvar Alterações
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
