
import React, { useState, useContext, useMemo } from 'react';
import { Product, BudgetItem } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { AppContext } from '../../contexts/AppContext';

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onItemAdded: (data: { budgetItem: BudgetItem, newCatalogItem?: Product }) => void;
}

type AddItemTab = 'catalog' | 'new';

const formatCurrency = (value: number) => `R$${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onItemAdded }) => {
    const { products } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState<AddItemTab>('catalog');
    const [searchTerm, setSearchTerm] = useState('');
    
    // State for 'new' tab
    const [newItem, setNewItem] = useState({ name: '', quantity: '1', budgetedCost: '' });
    const [saveToCatalog, setSaveToCatalog] = useState(false);
    const [newCatalogItem, setNewCatalogItem] = useState<Partial<Product>>({ type: 'service' });

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm]);

    const handleAddItemFromCatalog = (product: Product) => {
        const cost = product.type === 'product' ? product.salePrice : product.serviceCost;
        // Pre-fill the "new" tab for quantity adjustment
        setActiveTab('new');
        setNewItem({
            name: product.name,
            quantity: '1',
            budgetedCost: String(cost || 0)
        });
        setSaveToCatalog(false); // Don't re-save an existing item by default
    };

    const handleAddCustomItem = () => {
        if (!newItem.name.trim() || !newItem.budgetedCost) return;
        
        const budgetItem: BudgetItem = {
            id: `item-${Date.now()}`,
            name: newItem.name,
            quantity: parseInt(newItem.quantity, 10) || 1,
            budgetedCost: parseFloat(newItem.budgetedCost) || 0
        };

        if (saveToCatalog) {
            const catalogItem: Product = {
                id: `${newCatalogItem.type === 'product' ? 'prod' : 'serv'}-${Date.now()}`,
                name: newItem.name,
                type: newCatalogItem.type!,
                costPrice: newCatalogItem.type === 'product' ? (newCatalogItem.costPrice || 0) : undefined,
                salePrice: newCatalogItem.type === 'product' ? (parseFloat(newItem.budgetedCost) || 0) : undefined,
                serviceCost: newCatalogItem.type === 'service' ? (parseFloat(newItem.budgetedCost) || 0) : undefined,
            };
            onItemAdded({ budgetItem, newCatalogItem: catalogItem });
        } else {
            onItemAdded({ budgetItem });
        }
        resetForm();
    };

    const resetForm = () => {
        setNewItem({ name: '', quantity: '1', budgetedCost: '' });
        setSaveToCatalog(false);
        setNewCatalogItem({ type: 'service' });
        setActiveTab('catalog');
        setSearchTerm('');
    };
    
    const handleClose = () => {
        resetForm();
        onClose();
    };

    const TabButton: React.FC<{ tabId: AddItemTab, children: React.ReactNode }> = ({ tabId, children }) => (
        <button onClick={() => setActiveTab(tabId)} className={`py-2 px-4 text-sm font-medium focus:outline-none ${activeTab === tabId ? 'text-primary border-b-2 border-primary' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>
            {children}
        </button>
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Adicionar Item ao Orçamento">
            <div className="border-b border-neutral-200 dark:border-neutral-700 mb-4">
                <nav className="-mb-px flex space-x-4">
                    <TabButton tabId="catalog">Buscar no Catálogo</TabButton>
                    <TabButton tabId="new">Digitar Novo Item</TabButton>
                </nav>
            </div>

            <div className="min-h-[350px]">
                {activeTab === 'catalog' && (
                    <div className="space-y-4">
                        <Input placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                            {filteredProducts.length > 0 ? filteredProducts.map(p => (
                                <div key={p.id} className="p-3 rounded-md bg-neutral-50 dark:bg-neutral-700/50 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{p.name}</p>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                            {p.type === 'product' ? `Produto - Venda: ${formatCurrency(p.salePrice || 0)}` : `Serviço - Valor: ${formatCurrency(p.serviceCost || 0)}`}
                                        </p>
                                    </div>
                                    <Button size="sm" onClick={() => handleAddItemFromCatalog(p)}>Selecionar</Button>
                                </div>
                            )) : <p className="text-center text-sm text-neutral-500 py-6">Nenhum item encontrado.</p>}
                        </div>
                    </div>
                )}
                
                {activeTab === 'new' && (
                    <div className="space-y-4">
                        <Input placeholder="Nome do Item ou Serviço" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                        <div className="flex gap-2">
                            <Input type="number" placeholder="Quantidade" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="w-1/3" />
                            <Input type="number" placeholder="Custo Unitário (R$)" value={newItem.budgetedCost} onChange={e => setNewItem({...newItem, budgetedCost: e.target.value})} className="w-2/3"/>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <input id="save-catalog" type="checkbox" checked={saveToCatalog} onChange={e => setSaveToCatalog(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            <label htmlFor="save-catalog" className="text-sm">Adicionar ao catálogo para uso futuro</label>
                        </div>
                        
                        {saveToCatalog && (
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg space-y-3">
                                <h4 className="font-semibold text-sm">Detalhes do Catálogo</h4>
                                <select value={newCatalogItem.type} onChange={e => setNewCatalogItem({ ...newCatalogItem, type: e.target.value as 'product' | 'service' })} className="w-full block px-3 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                    <option value="service">Serviço</option>
                                    <option value="product">Produto</option>
                                </select>
                                {newCatalogItem.type === 'product' && (
                                    <Input
                                        type="number"
                                        placeholder="Preço de Custo (opcional)"
                                        value={newCatalogItem.costPrice ?? ''}
                                        onChange={e => {
                                            const num = parseFloat(e.target.value);
                                            setNewCatalogItem({
                                                ...newCatalogItem,
                                                costPrice: isNaN(num) ? undefined : num,
                                            });
                                        }}
                                    />
                                )}
                                <p className="text-xs text-neutral-500">O Custo Unitário será usado como Preço de Venda/Valor do Serviço.</p>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleAddCustomItem} disabled={!newItem.name || !newItem.budgetedCost}>Adicionar ao Orçamento</Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AddItemModal;