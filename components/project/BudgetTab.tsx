import React, { useState, useContext, useMemo } from 'react';
import { Project, BudgetItem, BudgetTemplate, Product } from '../../types';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { PencilIcon } from '../icons/PencilIcon';
import { SaveIcon } from '../icons/SaveIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { AppContext } from '../../contexts/AppContext';
import { ToastContext } from '../../contexts/ToastContext';
import AddItemModal from './AddItemModal';
import { generatePdfFromElement } from '../../utils/pdfGenerator';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';

interface BudgetTabProps {
    project: Project;
    onUpdateProject: (updater: (project: Project) => Project) => void;
}

const PlusIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const BudgetPdfLayout: React.FC<{ project: Project; clientName: string; companyLogo: string | null }> = ({ project, clientName, companyLogo }) => {
    const totalBudgeted = project.budget.reduce((sum, cat) => sum + cat.items.reduce((s, i) => s + (i.budgetedCost * i.quantity), 0), 0);
    return (
        <div id="budget-pdf-content" className="pdf-document" style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            <div className="pdf-header">
                <div>
                    <h1 className="mb-4">Proposta de Orçamento</h1>
                    <p><strong>Projeto:</strong> {project.name}</p>
                    <p><strong>Cliente:</strong> {clientName}</p>
                    <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                {companyLogo && <img src={companyLogo} alt="Logo da Empresa" />}
            </div>

            {project.budget.map(category => (
                <div key={category.id} className="break-inside-avoid">
                    <h2>{category.name}</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th className="text-right">Qtd.</th>
                                <th className="text-right">V. Unitário</th>
                                <th className="text-right">V. Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {category.items.map(item => (
                                <tr key={item.id}>
                                    <td>{item.name}</td>
                                    <td className="text-right">{item.quantity}</td>
                                    <td className="text-right">{formatCurrency(item.budgetedCost)}</td>
                                    <td className="text-right font-bold">{formatCurrency(item.budgetedCost * item.quantity)}</td>
                                </tr>
                            ))}
                            {category.items.length === 0 && <tr><td colSpan={4}>Nenhum item nesta categoria.</td></tr>}
                        </tbody>
                    </table>
                </div>
            ))}

            <div className="pdf-totals-container">
                <div className="pdf-totals-box">
                    <div className="pdf-totals-row">
                        <span>Subtotal</span>
                        <span>{formatCurrency(totalBudgeted)}</span>
                    </div>
                    <div className="pdf-totals-row total">
                        <span className="font-bold">Total Geral</span>
                        <span className="font-bold">{formatCurrency(totalBudgeted)}</span>
                    </div>
                </div>
            </div>

            <div className="pdf-footer">
                <p>Proposta válida por 30 dias. Valores sujeitos a alteração após este período.</p>
                <p>Agradecemos a sua preferência!</p>
            </div>
        </div>
    );
};


const BudgetTab: React.FC<BudgetTabProps> = ({ project, onUpdateProject }) => {
    const { clients, products, budgetTemplates, updateProducts, companyLogo } = useContext(AppContext);
    const { addToast } = useContext(ToastContext);

    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editedItemData, setEditedItemData] = useState<{name: string, quantity: string, budgetedCost: string} | null>(null);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isKitDropdownOpen, setIsKitDropdownOpen] = useState(false);

    const clientName = useMemo(() => {
        return clients.find(c => c.id === project.clientId)?.name || 'Cliente Desconhecido';
    }, [clients, project.clientId]);
    
    const expensesByCategory = useMemo(() => {
        const expenseMap: { [categoryId: string]: number } = {};
        for (const category of project.budget) {
            expenseMap[category.id] = 0;
        }
        for (const expense of project.expenses) {
            if (expenseMap[expense.categoryId] !== undefined) {
                expenseMap[expense.categoryId] += expense.amount;
            }
        }
        return expenseMap;
    }, [project.expenses, project.budget]);

    const handleStartEdit = (item: BudgetItem) => {
        setEditingItemId(item.id);
        setEditedItemData({ 
            name: item.name,
            quantity: String(item.quantity),
            budgetedCost: String(item.budgetedCost)
        });
    };

    const handleCancelEdit = () => {
        setEditingItemId(null);
        setEditedItemData(null);
    };
    
    const handleSaveEdit = (categoryId: string) => {
        if (!editedItemData || editingItemId === null) return;
        
        onUpdateProject(currentProject => ({
            ...currentProject,
            budget: currentProject.budget.map(cat => {
                if (cat.id === categoryId) {
                    return {
                        ...cat,
                        items: cat.items.map(item =>
                            item.id === editingItemId
                            ? { ...item, 
                                name: editedItemData.name, 
                                quantity: parseInt(editedItemData.quantity, 10) || 1,
                                budgetedCost: parseFloat(editedItemData.budgetedCost) || 0 
                              }
                            : item
                        )
                    };
                }
                return cat;
            })
        }));

        addToast({ message: 'Item atualizado com sucesso!', type: 'success' });
        handleCancelEdit();
    };

    const handleDeleteItem = (categoryId: string, itemId: string) => {
        if (!window.confirm("Tem certeza que deseja excluir este item do orçamento?")) return;

        onUpdateProject(currentProject => ({
            ...currentProject,
            budget: currentProject.budget.map(cat => {
                if (cat.id === categoryId) {
                    return { ...cat, items: cat.items.filter(item => item.id !== itemId) };
                }
                return cat;
            })
        }));
        
        addToast({ message: 'Item excluído.', type: 'success' });
    };
    
    const handleAddFromTemplate = (template: BudgetTemplate) => {
      onUpdateProject(currentProject => {
          let updatedProject = { ...currentProject };
          template.items.forEach(templateItem => {
            let category = updatedProject.budget.find(c => c.name.toLowerCase() === templateItem.category.toLowerCase());
            if (!category) {
                category = { id: `cat-${templateItem.category.toLowerCase().replace(/\s/g, '')}-${Date.now()}`, name: templateItem.category, items: [] };
                updatedProject.budget.push(category);
            }
            const newItem: BudgetItem = {
                id: `item-${templateItem.name.replace(/\s/g, '')}-${Date.now()}`, 
                name: templateItem.name,
                quantity: templateItem.quantity,
                budgetedCost: templateItem.budgetedCost,
            };
            category.items.push(newItem);
          });
          return updatedProject;
      });
      addToast({ message: `Itens do kit '${template.name}' adicionados.`, type: 'success' });
    };

    const openAddItemModal = (categoryId: string) => {
        setTargetCategoryId(categoryId);
        setIsAddItemModalOpen(true);
    };

    const handleItemAdded = ({ budgetItem, newCatalogItem }: {budgetItem: BudgetItem, newCatalogItem?: Product}) => {
        if (!targetCategoryId) return;

        onUpdateProject(currentProject => ({
            ...currentProject,
            budget: currentProject.budget.map(cat => 
                cat.id === targetCategoryId 
                ? { ...cat, items: [...cat.items, budgetItem] } 
                : cat
            )
        }));
        
        if (newCatalogItem) {
            updateProducts(prev => [...prev, newCatalogItem]);
            addToast({ message: 'Item adicionado ao orçamento e ao catálogo!', type: 'success' });
        } else {
            addToast({ message: 'Item adicionado ao orçamento!', type: 'success' });
        }

        setIsAddItemModalOpen(false);
        setTargetCategoryId(null);
    };
    
    const handleDownloadPdf = async () => {
        setIsGeneratingPdf(true);
        try {
            await generatePdfFromElement(
                'budget-pdf-content',
                `Orcamento-${project.name.replace(/\s+/g, '_')}.pdf`
            );
        } catch (error) {
            console.error("Error generating PDF:", error);
            addToast({ message: "Ocorreu um erro ao gerar o PDF.", type: "error" });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <>
            <BudgetPdfLayout project={project} clientName={clientName} companyLogo={companyLogo} />
            <div className="space-y-8 animate-fade-in">
                <div className="flex justify-end gap-2 no-print">
                    <div className="relative inline-block text-left">
                        <div>
                            <Button
                                onClick={() => setIsKitDropdownOpen(prev => !prev)}
                                disabled={budgetTemplates.length === 0}
                            >
                                Adicionar de um Kit
                                <ChevronDownIcon className="ml-2 -mr-1 h-5 w-5" />
                            </Button>
                        </div>

                        {isKitDropdownOpen && (
                            <div 
                                className="origin-top-right absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white dark:bg-neutral-800 ring-1 ring-black dark:ring-neutral-700 ring-opacity-5 focus:outline-none z-10"
                                role="menu"
                                aria-orientation="vertical"
                            >
                                <div className="py-1" role="none">
                                    {budgetTemplates.map(template => (
                                        <a
                                            href="#"
                                            key={template.id}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleAddFromTemplate(template);
                                                setIsKitDropdownOpen(false);
                                            }}
                                            className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 w-full text-left"
                                            role="menuitem"
                                        >
                                            {template.name}
                                            <span className="text-xs text-neutral-500 ml-2">({template.items.length} itens)</span>
                                        </a>
                                    ))}
                                    {budgetTemplates.length === 0 && (
                                        <p className="px-4 py-2 text-sm text-neutral-500">Nenhum kit disponível.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <Button onClick={handleDownloadPdf} variant="ghost" leftIcon={<DownloadIcon className="h-5 w-5" />} disabled={isGeneratingPdf}>
                        {isGeneratingPdf ? 'Gerando PDF...' : 'Baixar Orçamento (PDF)'}
                    </Button>
                </div>
                {project.budget.map(category => {
                    const categoryBudgeted = category.items.reduce((sum, item) => sum + (item.budgetedCost * item.quantity), 0);
                    const categoryActual = expensesByCategory[category.id] || 0;
                    return (
                    <Card key={category.id} className="card-print">
                        <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                            <div>
                                <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{category.name}</h3>
                                <div className="flex space-x-4 text-sm text-neutral-600 dark:text-neutral-400 no-print">
                                    <span>Orçado: <span className="font-semibold">{formatCurrency(categoryBudgeted)}</span></span>
                                    <span>Gasto: <span className="font-semibold">{formatCurrency(categoryActual)}</span></span>
                                </div>
                            </div>
                            <Button onClick={() => openAddItemModal(category.id)} size="sm" leftIcon={<PlusIcon className="h-4 w-4" />} className="no-print">
                                Adicionar Item
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-neutral-500 dark:text-neutral-400">
                                <thead className="text-xs text-neutral-700 dark:text-neutral-300 uppercase bg-neutral-50 dark:bg-neutral-700">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">Item</th>
                                        <th scope="col" className="px-4 py-3 text-center">Qtd.</th>
                                        <th scope="col" className="px-4 py-3 text-right">V. Unitário</th>
                                        <th scope="col" className="px-4 py-3 text-right">V. Total</th>
                                        <th scope="col" className="px-4 py-3 text-center no-print">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {category.items.map(item => (
                                    <tr key={item.id} className="bg-white dark:bg-neutral-800 border-b dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                        {editingItemId === item.id && editedItemData ? (
                                            <>
                                                <td className="px-4 py-2"><Input type="text" value={editedItemData.name} onChange={e => setEditedItemData({...editedItemData, name: e.target.value})} /></td>
                                                <td className="px-4 py-2"><Input type="number" className="w-20 mx-auto text-center" value={editedItemData.quantity} onChange={e => setEditedItemData({...editedItemData, quantity: e.target.value})} /></td>
                                                <td className="px-4 py-2"><Input type="number" className="w-32 ml-auto text-right" value={editedItemData.budgetedCost} onChange={e => setEditedItemData({...editedItemData, budgetedCost: e.target.value})} /></td>
                                                <td className="px-4 py-2 text-right font-medium">{formatCurrency((parseInt(editedItemData.quantity, 10) || 0) * (parseFloat(editedItemData.budgetedCost) || 0))}</td>
                                                <td className="px-4 py-2 text-center no-print"><div className="flex justify-center items-center gap-2">
                                                    <button onClick={() => handleSaveEdit(category.id)} className="text-green-600 hover:text-green-800" title="Salvar"><SaveIcon className="h-5 w-5"/></button>
                                                    <button onClick={handleCancelEdit} className="text-red-500 hover:text-red-700" title="Cancelar"><XCircleIcon className="h-6 w-6"/></button>
                                                </div></td>
                                            </>
                                        ) : (
                                            <>
                                                <th scope="row" className="px-4 py-3 font-medium text-neutral-900 dark:text-white whitespace-nowrap">{item.name}</th>
                                                <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right">{formatCurrency(item.budgetedCost)}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-200">{formatCurrency(item.budgetedCost * item.quantity)}</td>
                                                <td className="px-4 py-3 text-center no-print"><div className="flex justify-center items-center gap-3">
                                                    <button onClick={() => handleStartEdit(item)} className="text-blue-600 hover:text-blue-800" title="Editar"><PencilIcon className="h-5 w-5"/></button>
                                                    <button onClick={() => handleDeleteItem(category.id, item.id)} className="text-red-500 hover:text-red-700" title="Excluir"><TrashIcon className="h-5 w-5"/></button>
                                                </div></td>
                                            </>
                                        )}
                                    </tr>
                                    ))}
                                    {category.items.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-6 text-neutral-500 dark:text-neutral-400 no-print">
                                                Nenhum item nesta categoria. Adicione um item acima.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )})}
                {isAddItemModalOpen && (
                    <AddItemModal 
                        isOpen={isAddItemModalOpen}
                        onClose={() => setIsAddItemModalOpen(false)}
                        onItemAdded={handleItemAdded}
                    />
                )}
            </div>
        </>
    );
};

export default BudgetTab;