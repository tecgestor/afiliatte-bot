import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useApiQuery, useApiMutation } from '../hooks/useApi';
import { templatesAPI, groupsAPI } from '../services/api';
import Button from '../components/UI/Button';
import Loading from '../components/UI/Loading';
import Modal from '../components/UI/Modal';
import Alert from '../components/UI/Alert';
import { toast } from 'react-hot-toast';

export default function Templates() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewData, setPreviewData] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    isDefault: ''
  });

  // Dados
  const { data: templates, loading, refetch } = useApiQuery(
    ['templates', filters],
    () => templatesAPI.getAll(filters)
  );

  const { data: groups } = useApiQuery('groups', () => groupsAPI.getAll());

  // Mutations
  const createMutation = useApiMutation(
    (data) => templatesAPI.create(data),
    {
      successMessage: 'Template criado com sucesso!',
      invalidateQueries: [['templates']],
      onSuccess: () => {
        setShowCreateModal(false);
        refetch();
      }
    }
  );

  const updateMutation = useApiMutation(
    ({ id, data }) => templatesAPI.update(id, data),
    {
      successMessage: 'Template atualizado com sucesso!',
      invalidateQueries: [['templates']],
      onSuccess: () => {
        setShowEditModal(false);
        setSelectedTemplate(null);
        refetch();
      }
    }
  );

  const deleteMutation = useApiMutation(
    (id) => templatesAPI.delete(id),
    {
      successMessage: 'Template excluído com sucesso!',
      invalidateQueries: [['templates']],
      onSuccess: () => refetch()
    }
  );

  const processTemplateMutation = useApiMutation(
    ({ id, variables }) => templatesAPI.process(id, variables)
  );

  // Formulários
  const createForm = useForm({
    defaultValues: {
      name: '',
      description: '',
      category: 'electronics',
      template: '',
      availableVariables: [
        { name: 'title', description: 'Nome do produto', type: 'text', required: true },
        { name: 'price', description: 'Preço atual', type: 'currency', required: true },
        { name: 'originalPrice', description: 'Preço original', type: 'currency', required: false },
        { name: 'discount', description: 'Valor do desconto', type: 'currency', required: false },
        { name: 'discountPercentage', description: 'Percentual de desconto', type: 'percentage', required: false },
        { name: 'rating', description: 'Avaliação do produto', type: 'number', required: false },
        { name: 'reviewsCount', description: 'Número de avaliações', type: 'number', required: false },
        { name: 'salesCount', description: 'Número de vendas', type: 'number', required: false },
        { name: 'platform', description: 'Plataforma (ML, Shopee)', type: 'text', required: true },
        { name: 'affiliateLink', description: 'Link de afiliado', type: 'url', required: true },
        { name: 'commission', description: 'Valor da comissão', type: 'currency', required: false }
      ],
      assignedGroups: [],
      isDefault: false
    }
  });

  const editForm = useForm();

  // Handlers de Template
  const handleCreate = (data) => {
    console.log('🆕 Criando template:', data);
    createMutation.mutate(data);
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    editForm.reset({
      ...template,
      assignedGroups: template.assignedGroups || []
    });
    setShowEditModal(true);
  };

  const handleUpdate = (data) => {
    console.log('✏️ Atualizando template:', selectedTemplate._id, data);
    updateMutation.mutate({ id: selectedTemplate._id, data });
  };

  const handleDelete = (template) => {
    if (window.confirm(`Tem certeza que deseja excluir o template "${template.name}"?`)) {
      console.log('🗑️ Excluindo template:', template._id);
      deleteMutation.mutate(template._id);
    }
  };

  const handlePreview = async (template) => {
    setSelectedTemplate(template);
    
    // Dados de exemplo para preview
    const sampleData = {
      title: 'Smartphone Samsung Galaxy S24 Ultra 512GB',
      price: 'R$ 4.299,99',
      originalPrice: 'R$ 5.499,99',
      discount: 'R$ 1.200,00',
      discountPercentage: '22%',
      rating: '4.8',
      reviewsCount: '2.847',
      salesCount: '1.235',
      platform: 'MERCADO LIVRE',
      affiliateLink: 'https://produto.mercadolivre.com.br/MLB-123456789',
      commission: 'R$ 256,79'
    };

    try {
      const result = await processTemplateMutation.mutateAsync({
        id: template._id,
        variables: sampleData
      });
      setPreviewData(result.data.data.processedMessage);
    } catch (error) {
      // Se API não funcionar, fazer processamento local
      let processed = template.template;
      Object.keys(sampleData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processed = processed.replace(regex, sampleData[key]);
      });
      setPreviewData(processed);
    }
    
    setShowPreviewModal(true);
  };

  const handleDuplicate = (template) => {
    createForm.reset({
      ...template,
      name: `${template.name} (Cópia)`,
      isDefault: false,
      _id: undefined,
      createdAt: undefined,
      updatedAt: undefined
    });
    setShowCreateModal(true);
  };

  // Templates predefinidos
  const predefinedTemplates = [
    {
      name: 'Template Eletrônicos Premium',
      category: 'electronics',
      template: `🔥 MEGA OFERTA TECH!

📱 {{title}}
💰 Por apenas {{price}}
⚡ Era {{originalPrice}} - Economia de {{discount}} ({{discountPercentage}})!
⭐ {{rating}}/5 estrelas ({{reviewsCount}} avaliações)
🚚 Entrega rápida e segura
💳 Parcele sem juros

👆 COMPRAR AGORA: {{affiliateLink}}

Comissão estimada: {{commission}}

#TechOfertas #{{platform}} #Desconto #Tecnologia #Smartphone`
    },
    {
      name: 'Template Casa & Decoração',
      category: 'home',
      template: `🏠 OFERTA ESPECIAL CASA!

✨ {{title}}
💵 Apenas {{price}}
🏷️ {{discountPercentage}} de desconto!
⭐ Avaliação: {{rating}}/5 estrelas
🚚 Entrega rápida para sua casa

Transform your home! 🏡

🛒 GARANTIR O SEU: {{affiliateLink}}

#CasaEJardim #Decoração #{{platform}} #Oferta #Casa`
    },
    {
      name: 'Template Beleza & Cuidados',
      category: 'beauty',
      template: `💄 BELEZA EM PROMOÇÃO!

✨ {{title}}
💅 Por apenas {{price}}
🔥 Era {{originalPrice}} - SAVE {{discountPercentage}}!
⭐ {{rating}} estrelas | {{reviewsCount}} pessoas adoraram
💎 Resultado garantido
🎁 Frete grátis

Sua beleza merece o melhor! ✨

💄 COMPRAR AGORA: {{affiliateLink}}

#Beleza #Skincare #{{platform}} #Cuidados #Promoção`
    }
  ];

  if (loading) {
    return <Loading text="Carregando templates..." />;
  }

  const templateList = templates?.data?.docs || [];
  const groupList = groups?.data?.docs || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates de Mensagem</h1>
          <p className="text-gray-600">Crie e gerencie templates personalizados para diferentes grupos</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => refetch()} variant="outline">
            🔄 Atualizar
          </Button>
          <Button onClick={() => setShowCreateModal(true)} variant="primary">
            ➕ Novo Template
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <select
              value={filters.isDefault}
              onChange={(e) => setFilters(prev => ({ ...prev, isDefault: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todos</option>
              <option value="true">Padrão</option>
              <option value="false">Personalizados</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => setFilters({ category: '', isDefault: '' })}
              variant="outline"
              className="w-full"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Templates Predefinidos */}
      {templateList.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">🚀 Comece Rápido</h3>
          <p className="text-blue-700 mb-4">Crie seu primeiro template usando um dos modelos predefinidos:</p>
          <div className="flex flex-wrap gap-2">
            {predefinedTemplates.map((template, index) => (
              <Button
                key={index}
                size="sm"
                variant="outline"
                onClick={() => {
                  createForm.reset({
                    ...createForm.getValues(),
                    ...template
                  });
                  setShowCreateModal(true);
                }}
              >
                📝 {template.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Templates */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {templateList.map((template) => (
          <div key={template._id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-600 text-lg">💬</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500">{template.description}</p>
                  </div>
                </div>
                {template.isDefault && (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    Padrão
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500">
                    <span className="font-medium">Categoria:</span> 
                    <span className="capitalize ml-1">
                      {template.category === 'electronics' ? 'Eletrônicos' :
                       template.category === 'beauty' ? 'Beleza' :
                       template.category === 'home' ? 'Casa' :
                       template.category === 'fashion' ? 'Moda' : template.category}
                    </span>
                  </span>
                  <span className="text-gray-500">
                    <span className="font-medium">Variáveis:</span> {template.availableVariables?.length || 0}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600 font-medium mb-2">Preview do Template:</p>
                <p className="text-sm text-gray-800 line-clamp-4 whitespace-pre-wrap">
                  {template.template.substring(0, 200)}
                  {template.template.length > 200 && '...'}
                </p>
              </div>

              {/* Grupos Atribuídos */}
              {template.assignedGroups && template.assignedGroups.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-600 font-medium mb-2">Grupos Atribuídos:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.assignedGroups.map((groupId) => {
                      const group = groupList.find(g => g._id === groupId);
                      return (
                        <span key={groupId} className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          {group?.name || 'Grupo não encontrado'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Estatísticas */}
              {template.stats && (
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>Usado {template.stats.timesUsed || 0} vezes</span>
                  <span>Taxa engajamento: {((template.stats.avgEngagementRate || 0) * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>
            
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreview(template)}
                    loading={processTemplateMutation.isLoading}
                  >
                    👁️ Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicate(template)}
                  >
                    📋 Duplicar
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(template)}
                  >
                    ✏️ Editar
                  </Button>
                  {!template.isDefault && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(template)}
                      loading={deleteMutation.isLoading}
                    >
                      🗑️ Excluir
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensagem quando não há templates */}
      {templateList.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900">Nenhum template encontrado</h3>
          <p className="text-gray-500 mt-2">Crie seu primeiro template para começar a personalizar mensagens</p>
          <Button 
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            className="mt-4"
          >
            ➕ Criar Primeiro Template
          </Button>
        </div>
      )}

      {/* Modal Criar Template */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="➕ Criar Novo Template"
        size="xl"
      >
        <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome do Template</label>
              <input
                {...createForm.register('name', { required: 'Nome é obrigatório' })}
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: Template Eletrônicos Black Friday"
              />
              {createForm.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Categoria</label>
              <select
                {...createForm.register('category', { required: 'Categoria é obrigatória' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="electronics">Eletrônicos</option>
                <option value="beauty">Beleza</option>
                <option value="home">Casa e Jardim</option>
                <option value="fashion">Moda</option>
                <option value="sports">Esportes</option>
                <option value="books">Livros</option>
                <option value="general">Geral</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <input
              {...createForm.register('description')}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Descreva quando usar este template"
            />
          </div>

          {/* Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo do Template</label>
            <textarea
              {...createForm.register('template', { required: 'Template é obrigatório' })}
              rows={12}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              placeholder={`Exemplo:
🔥 SUPER OFERTA!

📱 {{title}}
💰 Por apenas {{price}}
⚡ Era {{originalPrice}} - Economia de {{discount}}!
⭐ {{rating}}/5 estrelas

👆 COMPRAR: {{affiliateLink}}

#Oferta #{{platform}}`}
            />
            {createForm.formState.errors.template && (
              <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.template.message}</p>
            )}
            
            <div className="mt-2 text-xs text-gray-500">
              <p><strong>Variáveis disponíveis:</strong></p>
              <div className="flex flex-wrap gap-1 mt-1">
                {['title', 'price', 'originalPrice', 'discount', 'discountPercentage', 'rating', 'reviewsCount', 'salesCount', 'platform', 'affiliateLink', 'commission'].map(variable => (
                  <code key={variable} className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {`{{${variable}}}`}
                  </code>
                ))}
              </div>
            </div>
          </div>

          {/* Grupos Atribuídos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grupos Atribuídos (Opcional)</label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {groupList.map((group) => (
                <label key={group._id} className="flex items-center">
                  <input
                    type="checkbox"
                    value={group._id}
                    {...createForm.register('assignedGroups')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 truncate">{group.name}</span>
                </label>
              ))}
            </div>
            {groupList.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">Nenhum grupo cadastrado. Crie grupos primeiro.</p>
            )}
          </div>

          {/* Opções */}
          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...createForm.register('isDefault')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Template padrão para a categoria</span>
            </label>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createMutation.isLoading}
            >
              ➕ Criar Template
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Template */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`✏️ Editar Template: ${selectedTemplate?.name}`}
        size="xl"
      >
        {selectedTemplate && (
          <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-6">
            {/* Similar ao modal de criar, mas com dados preenchidos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Template</label>
                <input
                  {...editForm.register('name', { required: 'Nome é obrigatório' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Categoria</label>
                <select
                  {...editForm.register('category', { required: 'Categoria é obrigatória' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="electronics">Eletrônicos</option>
                  <option value="beauty">Beleza</option>
                  <option value="home">Casa e Jardim</option>
                  <option value="fashion">Moda</option>
                  <option value="sports">Esportes</option>
                  <option value="books">Livros</option>
                  <option value="general">Geral</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Descrição</label>
              <input
                {...editForm.register('description')}
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Conteúdo do Template</label>
              <textarea
                {...editForm.register('template', { required: 'Template é obrigatório' })}
                rows={12}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={updateMutation.isLoading}
              >
                💾 Salvar Alterações
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Preview */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={`👁️ Preview: ${selectedTemplate?.name}`}
        size="lg"
      >
        {selectedTemplate && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Template Original:</h4>
              <div className="p-4 bg-gray-50 rounded-lg text-sm font-mono whitespace-pre-wrap">
                {selectedTemplate.template}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Com Dados de Exemplo:</h4>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      🤖
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                          {previewData || 'Gerando preview...'}
                        </pre>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">AfiliBot • agora</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setShowPreviewModal(false)}>
                Fechar Preview
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
