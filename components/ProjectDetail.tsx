import React, { useState, useMemo, useCallback, useContext } from 'react';
import { AISuggestion, Project } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import AIBudgetAssistant from './AIBudgetAssistant';
import AIConsultancyModal from './AIConsultancyModal';
import { SparklesIcon } from './icons/SparklesIcon';
import { ReceiptIcon } from './icons/ReceiptIcon';
import { AppContext } from '../contexts/AppContext';
import { ToastContext } from '../contexts/ToastContext';
import SummaryTab from './project/SummaryTab';
import BudgetTab from './project/BudgetTab';
import WorkOrderTab from './project/WorkOrderTab';
import ExpensesTab from './project/ExpensesTab';
import { ProjectStatus } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';


interface ProjectDetailProps {
  project: Project;
  updateProject: (projectId: string, updater: (project: Project) => Project) => void;
  onGoBack: () => void;
}

type ActiveTab = 'summary' | 'budget' | 'expenses' | 'work-order';

const STATUS_CONFIG: { [key in ProjectStatus]: { text: string; bg: string; text_color: string; } } = {
  Planejamento: { text: "Planejamento", bg: 'bg-neutral-200 dark:bg-neutral-700', text_color: 'text-neutral-800 dark:text-neutral-200' },
  'Em Andamento': { text: "Em Andamento", bg: 'bg-blue-100 dark:bg-blue-900', text_color: 'text-blue-800 dark:text-blue-200' },
  Pausado: { text: "Pausado", bg: 'bg-yellow-100 dark:bg-yellow-800/20', text_color: 'text-yellow-800 dark:text-yellow-200' },
  Concluído: { text: "Concluído", bg: 'bg-green-100 dark:bg-green-800/20', text_color: 'text-green-800 dark:text-green-200' },
  Cancelado: { text: "Cancelado", bg: 'bg-red-100 dark:bg-red-800/20', text_color: 'text-red-800 dark:text-red-200' },
};

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, updateProject, onGoBack }) => {
    const { clients } = useContext(AppContext);
    const { addToast } = useContext(ToastContext);

    const [isConsultancyModalOpen, setIsConsultancyModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
    
    const handleUpdate = useCallback((updater: (project: Project) => Project) => {
        updateProject(project.id, updater);
    }, [project.id, updateProject]);

    const handleAISuggestions = useCallback((suggestions: AISuggestion[]) => {
        handleUpdate(currentProject => {
            const updatedProject = { ...currentProject };

            suggestions.forEach(suggestion => {
                const categoryNameNormalized = suggestion.category.trim();
                const itemNameNormalized = suggestion.itemName.trim();

                let category = updatedProject.budget.find(c => c.name.toLowerCase() === categoryNameNormalized.toLowerCase());
                
                if (!category) {
                    category = {
                        id: `cat-${categoryNameNormalized.toLowerCase().replace(/\s/g, '')}-${Date.now()}`,
                        name: categoryNameNormalized,
                        items: []
                    };
                    updatedProject.budget.push(category);
                }

                const newItem = {
                    id: `item-${itemNameNormalized.replace(/\s/g, '')}-${Date.now()}`,
                    name: itemNameNormalized,
                    quantity: suggestion.quantity,
                    budgetedCost: suggestion.unitCost,
                };

                const existingItemIndex = category.items.findIndex(i => i.name.toLowerCase() === newItem.name.toLowerCase());
                if (existingItemIndex > -1) {
                    category.items[existingItemIndex].quantity += newItem.quantity;
                } else {
                     category.items.push(newItem);
                }
            });
            return updatedProject;
        });

        addToast({ message: 'Sugestões de orçamento adicionadas!', type: 'success' });
        setActiveTab('budget');
    }, [handleUpdate, addToast]);

    const clientDetails = useMemo(() => {
        return clients.find(c => c.id === project.clientId) || null;
    }, [project.clientId, clients]);

    const statusConfig = STATUS_CONFIG[project.status];

    const TabButton: React.FC<{tabId: ActiveTab, children: React.ReactNode}> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`whitespace-nowrap flex items-center gap-2 py-3 px-3 border-b-2 font-medium text-base focus:outline-none transition-colors duration-150 ${
                activeTab === tabId
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-500'
            }`}
        >
            {children}
        </button>
    );

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'summary':
                return <SummaryTab project={project} />;
            case 'budget':
                return <BudgetTab project={project} onUpdateProject={handleUpdate} />;
            case 'expenses':
                return <ExpensesTab project={project} onUpdateProject={handleUpdate} />;
            case 'work-order':
                return <WorkOrderTab project={project} clientDetails={clientDetails} />;
            default:
                return null;
        }
    }


    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 no-print">
                <div>
                    <Button variant="ghost" onClick={onGoBack} leftIcon={<ArrowLeftIcon className="h-5 w-5" />}>
                        Voltar para Projetos
                    </Button>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h2 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100">{project.name}</h2>
                        <div className={`text-sm font-semibold px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text_color}`}>{statusConfig.text}</div>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">{clientDetails?.name || 'Cliente desconhecido'} - {project.location}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    <AIBudgetAssistant onSuggestionsReady={handleAISuggestions} />
                    <Button variant="primary" onClick={() => setIsConsultancyModalOpen(true)} leftIcon={<SparklesIcon className="h-5 w-5" />}>
                        Consultoria IA
                    </Button>
                </div>
            </div>

            <AIConsultancyModal 
                isOpen={isConsultancyModalOpen}
                onClose={() => setIsConsultancyModalOpen(false)}
                project={project}
            />

            <div className="border-b border-neutral-200 dark:border-neutral-700 no-print">
                <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
                    <TabButton tabId="summary"><ChartBarIcon className="h-5 w-5"/> Resumo</TabButton>
                    <TabButton tabId="budget"><CalculatorIcon className="h-5 w-5"/> Orçamento</TabButton>
                    <TabButton tabId="expenses"><ReceiptIcon className="h-5 w-5" /> Gastos</TabButton>
                    <TabButton tabId="work-order"><ClipboardIcon className="h-5 w-5"/> Ordem de Serviço</TabButton>
                </nav>
            </div>
            
            <div className="mt-4">
                {renderActiveTab()}
            </div>
            
        </div>
    );
};

export default ProjectDetail;