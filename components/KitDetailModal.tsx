
import React, { useState, useEffect, useMemo } from 'react';
import { Product, BudgetTemplate } from '../types';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';
import { TrashIcon } from './icons/TrashIcon';

interface KitDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: BudgetTemplate | null;
    catalog: Product[];
    onUpdateTemplate: (template: BudgetTemplate) => void;
}

type TemplateItem = BudgetTemplate['items'][0];

const formatCurrency = (value: number) => `R$${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const KitDetailModal: React.FC<KitDetailModalProps> = ({ isOpen, onClose, template, catalog, onUpdateTemplate }) => {
    
    const [currentItems, setCurrentItems] = useState<TemplateItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (template) {
            setCurrentItems(template.items);
        }
    }, [template]);

    const filteredCatalog = useMemo(() => {
        if (!searchTerm) return catalog;
        return catalog.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [catalog, searchTerm]);

    if (!template) return null;

    const handleAddItem = (product: Product) => {
        const newItem: TemplateItem = {
            name: product.name,
            quantity: 1,
            budgetedCost: product.type === 'product' ? (product.salePrice || 0) : (product.serviceCost || 0),
            category: product.type === 'product' ? 'Materiais' : 'Mão de Obra',
        };
        setCurrentItems(prevItems => [...prevItems, newItem]);
    };
    
    const handleRemoveItem = (itemIndex: number) => {
        setCurrentItems(prevItems => prevItems.filter((_, index) => index !== itemIndex));
    };

    const handleQuantityChange = (itemIndex: number, newQuantity: string) => {
        const quantity = parseInt(newQuantity, 10);
        setCurrentItems(prevItems => 
            prevItems.map((item, index) => 
                index === itemIndex ? { ...item, quantity: isNaN(quantity) ? 1 : quantity } : item
            )
        );
    };
    
    const handleSave = () => {
        onUpdateTemplate({ ...template, items: currentItems });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gerenciar Itens do Kit: ${template.name}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[450px]">
                {/* Left Column: Items in Kit */}
                <div className="flex flex-col">
                    <h4 className="font-semibold mb-2">Itens no Kit</h4>
                    <div className="flex-grow space-y-2 p-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg max-h-[400px] overflow-y-auto">
                        {currentItems.length > 0 ? currentItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-white dark:bg-neutral-800 rounded shadow-sm">
                                <div className="flex-grow">
                                    <p className="font-medium text-sm">{item.name}</p>
                                    <p className="text-xs text-neutral-500">{formatCurrency(item.budgetedCost)}/un.</p>
                                </div>
                                <Input 
                                    type="number" 
                                    value={item.quantity} 
                                    onChange={e => handleQuantityChange(index, e.target.value)}
                                    className="w-20 text-center"
                                />
                                <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5"/></button>
                            </div>
                        )) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-neutral-500">Adicione itens do catálogo.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Catalog */}
                <div className="flex flex-col">
                    <h4 className="font-semibold mb-2">Catálogo de Produtos e Serviços</h4>
                    <Input 
                        placeholder="Buscar no catálogo..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="mb-2"
                    />
                    <div className="flex-grow space-y-2 p-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg max-h-[350px] overflow-y-auto">
                       {filteredCatalog.map(product => (
                            <div key={product.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded shadow-sm">
                                <div>
                                    <p className="font-medium text-sm">{product.name}</p>
                                    <p className="text-xs text-neutral-500">
                                        {product.type === 'product' ? `Produto - ${formatCurrency(product.salePrice || 0)}` : `Serviço - ${formatCurrency(product.serviceCost || 0)}`}
                                    </p>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => handleAddItem(product)}>Adicionar</Button>
                            </div>
                       ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t dark:border-neutral-700">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar Kit</Button>
            </div>
        </Modal>
    );
};

export default KitDetailModal;
