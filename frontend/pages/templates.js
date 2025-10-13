import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../components/UI/Button';
import Loading from '../components/UI/Loading';
import Modal from '../components/UI/Modal';
import { toast } from 'react-hot-toast';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewData, setPreviewData] = useState('');

  const addForm = useForm({
    defaultValues: {
      name: '',
      description: '',
      category: 'electronics',
      template: '',
      isDefault: false
    }
  });

  const editForm = useForm();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    setLoading(true);
    try {
      const savedTemplates = localStorage.getItem('affiliate_templates');
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
      } else {
        // Templates iniciais
        const initialTemplates = [
          {
            id: '1',
            name: 'Template Eletrônicos Premium',
            description: 'Para produtos eletrônicos de alta qualidade',
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

#TechOfertas #MercadoLivre #Desconto #Tecnologia #Smartphone`,
            isDefault: true,
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Template Beleza & Cosméticos',
            description: 'Para produtos de beleza e cuidados pessoais',
            category: 'beauty',
            template: `💄 BELEZA EM PROMOÇÃO!

✨ {{title}}
💅 Por apenas {{price}}
🔥 Era {{originalPrice}} - ECONOMIZE {{discountPercentage}}!
⭐ {{rating}} estrelas | {{reviewsCount}} pessoas adoraram
💎 Resultado garantido
🎁 Frete grátis

Sua beleza merece o melhor! ✨

💄 COMPRAR AGORA: {{affiliateLink}}

#Beleza #Skincare #Cuidados #Promoção`,
            isDefault: false,
            createdAt: new Date().toISOString()
          }
        ];
        setTemplates(initialTemplates);
        localStorage.setItem('affiliate_templates', JSON.stringify(initialTemplates));
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const saveTemplates = (updatedTemplates) => {
    localStorage.setItem('affiliate_templates', JSON.stringify(updatedTemplates));
    setTemplates(updatedTemplates);
  };

  const handleAddTemplate = (data) => {
    try {
      const newTemplate = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      const updatedTemplates = [newTemplate, ...templates];
      saveTemplates(updatedTemplates);

      addForm.reset();
      setShowAddModal(false);
      toast.success('Template criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast.error('Erro ao criar template');
    }
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    editForm.reset(template);
    setShowEditModal(true);
  };

  const handleUpdateTemplate = (data) => {
    try {
      const updatedTemplate = {
        ...selectedTemplate,
        ...data,
        updatedAt: new Date().toISOString()
      };

      const updatedTemplates = templates.map(t => 
        t.id === selectedTemplate.id ? updatedTemplate : t
      );

      saveTemplates(updatedTemplates);
      setShowEditModal(false);
      setSelectedTemplate(null);
      toast.success('Template atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      toast.error('Erro ao atualizar template');
    }
  };

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      try {
        const updatedTemplates = templates.filter(t => t.id !== templateId);
        saveTemplates(updatedTemplates);
        toast.success('Template excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir template:', error);
        toast.error('Erro ao excluir template');
      }
    }
  };

  const handlePreview = (template) => {
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
      affiliateLink: 'https://produto.mercadolivre.com.br/MLB-123456789?ref=aff_123',
      commission: 'R$ 256,79'
    };

    // Processar template com dados de exemplo
    let processed = template.template;
    Object.keys(sampleData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, sampleData[key]);
    });

    setPreviewData(processed);
    setShowPreviewModal(true);
  };

  const handleDuplicate = (template) => {
    try {
      const duplicatedTemplate = {
        ...template,
        id: Date.now().toString(),
        name: `${template.name} (Cópia)`,
        isDefault: false,
        createdAt: new Date().toISOString()
      };

      const updatedTemplates = [duplicatedTemplate, ...templates];
      saveTemplates(updatedTemplates);
      toast.success('Template duplicado com sucesso!');
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
      toast.error('Erro ao duplicar template');
    }
  };

  if (loading) {
    return <Loading text="Carregando templates..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates de Mensagem</h1>
          <p className="text-gray-600">Crie e gerencie templates personalizados para diferentes categorias</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={loadTemplates} variant="outline">
            🔄 Atualizar
          </Button>
          <Button onClick={() => setShowAddModal(true)} variant="primary">
            ➕ Novo Template
          </Button>
        </div>
      </div>

      {/* Lista de Templates */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {templates.map((template) => (
          <div key={template.id} className="bg-white overflow-hidden shadow rounded-lg">
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
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600 font-medium mb-2">Preview do Template:</p>
                <p className="text-sm text-gray-800 line-clamp-4 whitespace-pre-wrap">
                  {template.template.substring(0, 200)}
                  {template.template.length > 200 && '...'}
                </p>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreview(template)}
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
                    onClick={() => handleEditTemplate(template)}
                  >
                    ✏️ Editar
                  </Button>
                  {!template.isDefault && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteTemplate(template.id)}
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
      {templates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900">Nenhum template encontrado</h3>
          <p className="text-gray-500 mt-2">Crie seu primeiro template para começar a personalizar mensagens</p>
          <Button 
            onClick={() => setShowAddModal(true)}
            variant="primary"
            className="mt-4"
          >
            ➕ Criar Primeiro Template
          </Button>
        </div>
      )}

      {/* Modal Criar Template */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="➕ Criar Novo Template"
        size="xl"
      >
        <form onSubmit={addForm.handleSubmit(handleAddTemplate)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome do Template</label>
              <input
                {...addForm.register('name', { required: 'Nome é obrigatório' })}
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: Template Eletrônicos Black Friday"
              />
              {addForm.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{addForm.formState.errors.name.message}</p>
              )}
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
                <option value="general">Geral</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <input
              {...addForm.register('description')}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Descreva quando usar este template"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo do Template</label>
            <textarea
              {...addForm.register('template', { required: 'Template é obrigatório' })}
              rows={12}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              placeholder={`Exemplo:
🔥 SUPER OFERTA!

📱 {{title}}
💰 Por apenas {{price}}
⚡ Era {{originalPrice}} - Economia de {{discount}}!
⭐ {{rating}}/5 estrelas

👆 COMPRAR: {{affiliateLink}}

#Oferta #Desconto`}
            />
            {addForm.formState.errors.template && (
              <p className="mt-1 text-sm text-red-600">{addForm.formState.errors.template.message}</p>
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

          <div className="flex items-center">
            <input
              type="checkbox"
              {...addForm.register('isDefault')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Template padrão para a categoria</span>
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
          <form onSubmit={editForm.handleSubmit(handleUpdateTemplate)} className="space-y-6">
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
              <Button type="submit">
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
                          {previewData}
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
