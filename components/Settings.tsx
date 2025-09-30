import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Client, Product, Project, BudgetTemplate } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Switch from './ui/Switch';
import { UploadIcon } from './icons/UploadIcon';
import { UsersIcon } from './icons/UsersIcon';
import { BoxIcon } from './icons/BoxIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ThemeContext } from '../contexts/ThemeContext';
import KitDetailModal from './KitDetailModal';

interface SettingsProps {
    clients: Client[];
    products: Product[];
    projects: Project[];
    budgetTemplates: BudgetTemplate[];
    companyLogo: string | null;
    onUpdateClients: React.Dispatch<React.SetStateAction<Client[]>>;
    onUpdateProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    onUpdateBudgetTemplates: React.Dispatch<React.SetStateAction<BudgetTemplate[]>>;
    onUpdateLogo: React.Dispatch<React.SetStateAction<string | null>>;
}

type SettingsTab = 'company' | 'clients' | 'products' | 'templates';

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const Settings: React.FC<SettingsProps> = ({ 
    clients, 
    products, 
    projects,
    budgetTemplates,
    companyLogo,
    onUpdateClients, 
    onUpdateProducts,
    onUpdateBudgetTemplates,
    onUpdateLogo 
}) => {
    // Context
    const { theme, toggleTheme } = React.useContext(ThemeContext);

    // Navigation state
    const [activeTab, setActiveTab] = useState<SettingsTab>('company');
    
    // Client state
    const [newClient, setNewClient] = useState({ name: '', documentId: '', contactPhone: '', address: '' });
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    // Product & Service state
    const [newProduct, setNewProduct] = useState({ name: '', costPrice: '', salePrice: '' });
    const [newService, setNewService] = useState({ name: '', serviceCost: '' });
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Budget Template state
    const [newTemplateName, setNewTemplateName] = useState('');
    const [editingTemplate, setEditingTemplate] = useState<BudgetTemplate | null>(null);

    const { productList, serviceList } = useMemo(() => {
        return {
            productList: products.filter(p => p.type === 'product'),
            serviceList: products.filter(p => p.type === 'service')
        }
    }, [products]);

    // Reset form when modal closes
    useEffect(() => {
        if (!editingClient) setNewClient({ name: '', documentId: '', contactPhone: '', address: '' });
        if (!editingProduct) {
            setNewProduct({ name: '', costPrice: '', salePrice: '' });
            setNewService({ name: '', serviceCost: '' });
        }
    }, [editingClient, editingProduct]);

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { onUpdateLogo(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };

    // --- Client Handlers ---
    const handleAddClient = () => {
        if (newClient.name.trim()) {
            onUpdateClients(prevClients => [...prevClients, { id: `client-${Date.now()}`, ...newClient }]);
            setNewClient({ name: '', documentId: '', contactPhone: '', address: '' });
        }
    };
    const handleUpdateClient = () => {
        if (!editingClient) return;
        onUpdateClients(prevClients => prevClients.map(c => c.id === editingClient.id ? editingClient : c));
        setEditingClient(null);
    };
    const handleDeleteClient = (clientId: string) => {
        const isClientInUse = projects.some(p => p.clientId === clientId);
        if (isClientInUse) {
            alert('Este cliente não pode ser excluído, pois está associado a um ou mais projetos existentes.');
            return;
        }
        if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            onUpdateClients(prevClients => prevClients.filter(c => c.id !== clientId));
        }
    };
    
    // --- Product & Service Handlers ---
    const handleAddItem = (type: 'product' | 'service') => {
        if (type === 'product' && newProduct.name.trim()) {
            const productToAdd: Product = {
                id: `prod-${Date.now()}`,
                name: newProduct.name.trim(),
                type: 'product',
                costPrice: parseFloat(newProduct.costPrice) || 0,
                salePrice: parseFloat(newProduct.salePrice) || 0
            };
            onUpdateProducts(prevProducts => [...prevProducts, productToAdd]);
            setNewProduct({ name: '', costPrice: '', salePrice: '' });
        } else if (type === 'service' && newService.name.trim()) {
             const serviceToAdd: Product = {
                id: `serv-${Date.now()}`,
                name: newService.name.trim(),
                type: 'service',
                serviceCost: parseFloat(newService.serviceCost) || 0
            };
            onUpdateProducts(prevProducts => [...prevProducts, serviceToAdd]);
            setNewService({ name: '', serviceCost: '' });
        }
    };

    const handleUpdateProduct = () => {
        if (!editingProduct) return;
        onUpdateProducts(prevProducts => prevProducts.map(p => p.id === editingProduct.id ? editingProduct : p));
        setEditingProduct(null);
    }
    
    const handleDeleteProduct = (productId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este item do catálogo?')) {
            onUpdateProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
        }
    }

    // --- Budget Template Handlers ---
    const handleAddTemplate = () => {
        if (newTemplateName.trim()) {
            onUpdateBudgetTemplates(prevTemplates => [...prevTemplates, { id: `template-${Date.now()}`, name: newTemplateName.trim(), items: [] }]);
            setNewTemplateName('');
        }
    };
    const handleDeleteTemplate = (templateId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este kit?')) {
            onUpdateBudgetTemplates(prevTemplates => prevTemplates.filter(t => t.id !== templateId));
        }
    };

    const handleUpdateTemplateDetails = (updatedTemplate: BudgetTemplate) => {
        onUpdateBudgetTemplates(prevTemplates => prevTemplates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
        setEditingTemplate(null);
    };
    
    const TabButton: React.FC<{
      tabName: SettingsTab;
      currentTab: SettingsTab;
      onClick: (tab: SettingsTab) => void;
      children: React.ReactNode;
    }> = ({ tabName, currentTab, onClick, children }) => (
        <button
            onClick={() => onClick(tabName)}
            className={`whitespace-nowrap pb-3 px-4 border-b-2 font-medium text-base focus:outline-none ${
                tabName === currentTab
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
        >
            {children}
        </button>
    );

    const renderProductsServices = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Products Section */}
            <div>
                <h4 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-3">Produtos</h4>
                <div className="space-y-2 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg">
                    <Input placeholder="Nome do Produto" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                    <div className="flex gap-2">
                        <Input type="number" placeholder="Preço de Custo" value={newProduct.costPrice} onChange={e => setNewProduct({...newProduct, costPrice: e.target.value})} />
                        <Input type="number" placeholder="Preço de Venda" value={newProduct.salePrice} onChange={e => setNewProduct({...newProduct, salePrice: e.target.value})} />
                    </div>
                    <div className="text-right">
                        <Button onClick={() => handleAddItem('product')} size="sm">Adicionar Produto</Button>
                    </div>
                </div>
                <div className="max-h-80 overflow-y-auto pr-2 space-y-2 mt-4">
                    {productList.map(p => (
                        <div key={p.id} className="bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-neutral-800 dark:text-neutral-200">{p.name}</p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    Custo: {formatCurrency(p.costPrice || 0)} | Venda: {formatCurrency(p.salePrice || 0)}
                                </p>
                            </div>
                             <div className="flex items-center gap-3">
                                <button onClick={() => setEditingProduct(p)} className="text-blue-600 hover:text-blue-800" title="Editar"><PencilIcon className="h-5 w-5"/></button>
                                <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:text-red-700" title="Excluir"><TrashIcon className="h-5 w-5"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Services Section */}
            <div>
                <h4 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-3">Serviços</h4>
                <div className="space-y-2 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg">
                    <Input placeholder="Nome do Serviço" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} />
                    <Input type="number" placeholder="Valor Cobrado" value={newService.serviceCost} onChange={e => setNewService({...newService, serviceCost: e.target.value})} />
                    <div className="text-right">
                        <Button onClick={() => handleAddItem('service')} size="sm">Adicionar Serviço</Button>
                    </div>
                </div>
                 <div className="max-h-80 overflow-y-auto pr-2 space-y-2 mt-4">
                    {serviceList.map(s => (
                        <div key={s.id} className="bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-neutral-800 dark:text-neutral-200">{s.name}</p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    Valor: {formatCurrency(s.serviceCost || 0)}
                                </p>
                            </div>
                             <div className="flex items-center gap-3">
                                <button onClick={() => setEditingProduct(s)} className="text-blue-600 hover:text-blue-800" title="Editar"><PencilIcon className="h-5 w-5"/></button>
                                <button onClick={() => handleDeleteProduct(s.id)} className="text-red-500 hover:text-red-700" title="Excluir"><TrashIcon className="h-5 w-5"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100">Configurações</h2>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Gerencie os dados e a personalização da sua empresa.</p>
            </div>

            <div className="border-b border-neutral-200 dark:border-neutral-700">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton tabName="company" currentTab={activeTab} onClick={setActiveTab}>Empresa e Tema</TabButton>
                    <TabButton tabName="clients" currentTab={activeTab} onClick={setActiveTab}>Clientes</TabButton>
                    <TabButton tabName="products" currentTab={activeTab} onClick={setActiveTab}>Produtos/Serviços</TabButton>
                    <TabButton tabName="templates" currentTab={activeTab} onClick={setActiveTab}>Kits de Orçamento</TabButton>
                </nav>
            </div>

            <div className="animate-fade-in">
              {activeTab === 'company' && (
                <Card>
                    <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 mb-4">Logo da Empresa</h3>
                    <div className="flex items-center gap-6 mb-8">
                        {companyLogo && <img src={companyLogo} alt="Logo" className="h-16 w-auto bg-neutral-100 dark:bg-neutral-700 p-2 rounded-md object-contain" />}
                         <label className="cursor-pointer">
                            <Button as="span" leftIcon={<UploadIcon className="h-5 w-5" />}>{companyLogo ? 'Alterar Logo' : 'Carregar Logo'}</Button>
                            <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleLogoUpload} />
                        </label>
                        {companyLogo && <Button variant="ghost" onClick={() => onUpdateLogo(null)}>Remover</Button>}
                    </div>
                     <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 mb-4 pt-4 border-t dark:border-neutral-700">Aparência</h3>
                     <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Modo Escuro</p>
                            <p className="text-sm text-neutral-500">Ative para uma experiência com cores escuras.</p>
                        </div>
                        <Switch checked={theme === 'dark'} onChange={toggleTheme} srLabel="Toggle Dark Mode" />
                     </div>
                </Card>
              )}

              {activeTab === 'clients' && (
                <Card>
                    <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 mb-4">
                        <UsersIcon className="h-6 w-6 text-primary" /> Cadastro de Clientes
                    </h3>
                    <div className="space-y-2 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input value={newClient.name} onChange={(e) => setNewClient({...newClient, name: e.target.value})} placeholder="Nome do cliente/empresa" />
                            <Input value={newClient.address || ''} onChange={(e) => setNewClient({...newClient, address: e.target.value})} placeholder="Endereço Completo" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <Input value={newClient.documentId} onChange={(e) => setNewClient({...newClient, documentId: e.target.value})} placeholder="CPF ou CNPJ" />
                            <Input value={newClient.contactPhone} onChange={(e) => setNewClient({...newClient, contactPhone: e.target.value})} placeholder="Telefone do responsável" />
                            <Button onClick={handleAddClient} className="w-full">Adicionar</Button>
                        </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto pr-2 space-y-2 mt-4">
                        {clients.map(client => (
                            <div key={client.id} className="bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">{client.name}</p>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {client.address || 'Endereço não informado'}
                                    </p>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                                        {client.documentId || 'Sem documento'} &bull; {client.contactPhone || 'Sem telefone'}
                                    </p>
                                </div>
                                 <div className="flex items-center gap-3">
                                    <button onClick={() => setEditingClient(client)} className="text-blue-600 hover:text-blue-800" title="Editar"><PencilIcon className="h-5 w-5"/></button>
                                    <button onClick={() => handleDeleteClient(client.id)} className="text-red-500 hover:text-red-700" title="Excluir"><TrashIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
              )}
              
              {activeTab === 'products' && (
                <Card>
                    <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 mb-4">
                        <BoxIcon className="h-6 w-6 text-primary" /> Catálogo de Produtos e Serviços
                    </h3>
                    {renderProductsServices()}
                </Card>
              )}

              {activeTab === 'templates' && (
                 <Card>
                    <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 mb-4">
                        <SparklesIcon className="h-6 w-6 text-primary" /> Kits de Orçamento
                    </h3>
                    <div className="space-y-2 mb-4">
                      <Input value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="Nome do novo Kit (ex: Banheiro Padrão)" />
                      <div className="flex justify-end"><Button onClick={handleAddTemplate} disabled={!newTemplateName.trim()}>Criar Novo Kit</Button></div>
                    </div>
                    <div className="max-h-96 overflow-y-auto pr-2 space-y-2 mt-4">
                        {budgetTemplates.map(template => (
                           <div key={template.id} className="bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">{template.name}</p>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{template.items.length} itens</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Button size="sm" variant="ghost" onClick={() => setEditingTemplate(template)}>
                                        Gerenciar Itens
                                    </Button>
                                    <button onClick={() => handleDeleteTemplate(template.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" title="Excluir"><TrashIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
              )}
            </div>

            <Modal isOpen={!!editingClient} onClose={() => setEditingClient(null)} title="Editar Cliente">
                {editingClient && (
                    <div className="space-y-4">
                        <div><label className="block text-sm font-medium">Nome</label><Input value={editingClient.name} onChange={e => setEditingClient({...editingClient, name: e.target.value})} /></div>
                        <div><label className="block text-sm font-medium">Endereço</label><Input value={editingClient.address || ''} onChange={e => setEditingClient({...editingClient, address: e.target.value})} /></div>
                        <div><label className="block text-sm font-medium">CPF/CNPJ</label><Input value={editingClient.documentId || ''} onChange={e => setEditingClient({...editingClient, documentId: e.target.value})} /></div>
                        <div><label className="block text-sm font-medium">Telefone</label><Input value={editingClient.contactPhone || ''} onChange={e => setEditingClient({...editingClient, contactPhone: e.target.value})} /></div>
                        <div className="flex justify-end gap-2 pt-4"><Button variant="ghost" onClick={() => setEditingClient(null)}>Cancelar</Button><Button onClick={handleUpdateClient}>Salvar</Button></div>
                    </div>
                )}
            </Modal>
            
             <Modal isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} title="Editar Item do Catálogo">
                {editingProduct && (
                    <div className="space-y-4">
                        <Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                        {editingProduct.type === 'product' && (
                            <div className="flex gap-2">
                                <Input type="number" value={editingProduct.costPrice || ''} onChange={e => setEditingProduct({...editingProduct, costPrice: parseFloat(e.target.value)})} placeholder="Custo"/>
                                <Input type="number" value={editingProduct.salePrice || ''} onChange={e => setEditingProduct({...editingProduct, salePrice: parseFloat(e.target.value)})} placeholder="Venda"/>
                            </div>
                        )}
                        {editingProduct.type === 'service' && (
                            <Input type="number" value={editingProduct.serviceCost || ''} onChange={e => setEditingProduct({...editingProduct, serviceCost: parseFloat(e.target.value)})} placeholder="Valor"/>
                        )}
                        <div className="flex justify-end gap-2 pt-4"><Button variant="ghost" onClick={() => setEditingProduct(null)}>Cancelar</Button><Button onClick={handleUpdateProduct}>Salvar</Button></div>
                    </div>
                )}
            </Modal>

            {editingTemplate && (
                 <KitDetailModal
                    isOpen={!!editingTemplate}
                    onClose={() => setEditingTemplate(null)}
                    template={editingTemplate}
                    catalog={products}
                    onUpdateTemplate={handleUpdateTemplateDetails}
                />
            )}
        </div>
    );
};

export default Settings;