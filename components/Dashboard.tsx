import React, { useState, useMemo, useContext } from 'react';
import { motion } from 'framer-motion';
import { Project, Client, ChartData, ProjectStatus } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import { AppContext } from '../contexts/AppContext';
import CostChart from './CostChart';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';


interface DashboardProps {
  onSelectProject: (project: Project) => void;
}

const PlusIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const STATUS_CONFIG: { [key in ProjectStatus]: { text: string; bg: string; text_color: string; } } = {
  Planejamento: { text: "Planejamento", bg: 'bg-neutral-200 dark:bg-neutral-700', text_color: 'text-neutral-800 dark:text-neutral-200' },
  'Em Andamento': { text: "Em Andamento", bg: 'bg-blue-100 dark:bg-blue-900', text_color: 'text-blue-800 dark:text-blue-200' },
  Pausado: { text: "Pausado", bg: 'bg-yellow-100 dark:bg-yellow-800/20', text_color: 'text-yellow-800 dark:text-yellow-200' },
  Concluído: { text: "Concluído", bg: 'bg-green-100 dark:bg-green-800/20', text_color: 'text-green-800 dark:text-green-200' },
  Cancelado: { text: "Cancelado", bg: 'bg-red-100 dark:bg-red-800/20', text_color: 'text-red-800 dark:text-red-200' },
};

const KpiCard: React.FC<{ title: string; value: string; subValue?: string; icon: React.ReactNode; colorClass?: string; }> = ({ title, value, subValue, icon, colorClass = 'text-primary' }) => (
    <Card className="flex items-start gap-4">
        <div className={`p-3 rounded-lg bg-primary-light dark:bg-primary-dark/30 ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{value}</p>
            {subValue && <p className="text-xs text-neutral-400 dark:text-neutral-500">{subValue}</p>}
        </div>
    </Card>
);

const ProjectCard: React.FC<{ project: Project; clientName: string; onSelect: () => void; }> = ({ project, clientName, onSelect }) => {
  const { totalBudgeted, totalActual } = useMemo(() => {
    const totalBudgeted = project.budget.reduce((sum, cat) => sum + cat.items.reduce((s, i) => s + (i.budgetedCost * i.quantity), 0), 0);
    const totalActual = project.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return { totalBudgeted, totalActual };
  }, [project.budget, project.expenses]);
  
  const progress = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;
  const statusConfig = STATUS_CONFIG[project.status];

  return (
    <Card className="flex flex-col justify-between" onClick={onSelect} >
      <div className="cursor-pointer">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 truncate pr-2">{project.name}</h3>
            <div className={`text-xs font-semibold px-2 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text_color}`}>{statusConfig.text}</div>
        </div>
        <p className="text-neutral-500 dark:text-neutral-400 mb-4 text-sm">{clientName}</p>
        
        <div className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-300">Orçado:</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-100">{formatCurrency(totalBudgeted)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-300">Gasto:</span>
                <span className={`font-semibold ${progress > 100 ? 'text-red-500' : 'text-neutral-700 dark:text-neutral-200'}`}>{formatCurrency(totalActual)}</span>
            </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
            <div className={`${progress > 100 ? 'bg-red-500' : 'bg-primary'} h-2 rounded-full`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
        </div>
        <p className="text-right text-xs text-neutral-500 dark:text-neutral-400 mt-1">{Math.round(progress)}% do orçamento utilizado</p>
      </div>
    </Card>
  );
};

type FilterStatus = 'all' | 'inProgress' | 'completed';

const Dashboard: React.FC<DashboardProps> = ({ onSelectProject }) => {
  const { projects, clients, addProject } = useContext(AppContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectClientId, setNewProjectClientId] = useState('');
  const [newProjectLocation, setNewProjectLocation] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const handleCreateProject = () => {
    if (newProjectName && newProjectClientId && newProjectLocation) {
      addProject({ name: newProjectName, clientId: newProjectClientId, location: newProjectLocation });
      setIsModalOpen(false);
    }
  };

  const openModal = () => {
    setNewProjectName('');
    setNewProjectClientId(clients.length > 0 ? clients[0].id : '');
    setNewProjectLocation('');
    setIsModalOpen(true);
  }

  const { filteredProjects, globalChartData, activeProjectsCount, financialHealth, overBudgetProjectsCount, totalValueCompleted } = useMemo(() => {
    let globalBudgeted = 0;
    let globalActual = 0;
    let overBudgetProjects = 0;
    let valueCompleted = 0;

    projects.forEach(p => {
        const projectBudget = p.budget.reduce((sum, cat) => sum + cat.items.reduce((s, i) => s + (i.budgetedCost * i.quantity), 0), 0);
        const projectActual = p.expenses.reduce((sum, exp) => sum + exp.amount, 0);

        globalBudgeted += projectBudget;
        globalActual += projectActual;

        if(projectActual > projectBudget) {
            overBudgetProjects++;
        }
        if (p.status === 'Concluído') {
            valueCompleted += projectBudget;
        }
    });

    const filtered = projects.filter(p => {
        const client = clients.find(c => c.id === p.clientId);
        const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            client?.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const statusMatch = filterStatus === 'all' ||
                           (filterStatus === 'completed' && p.status === 'Concluído') ||
                           (filterStatus === 'inProgress' && (p.status === 'Em Andamento' || p.status === 'Pausado' || p.status === 'Planejamento'));

        return searchMatch && statusMatch;
    });

    const chartData: ChartData[] = projects.map(p => ({
        name: p.name.substring(0, 15) + (p.name.length > 15 ? '...' : ''),
        'Orçado': p.budget.reduce((sum, cat) => sum + cat.items.reduce((s, i) => s + (i.budgetedCost * i.quantity), 0), 0),
        'Gasto': p.expenses.reduce((sum, exp) => sum + exp.amount, 0),
    }));
    
    const activeProjects = projects.filter(p => p.status === 'Em Andamento').length;
    const health = globalBudgeted > 0 ? ((globalBudgeted - globalActual) / globalBudgeted) * 100 : 0;

    return { 
        filteredProjects: filtered, 
        globalChartData: chartData, 
        activeProjectsCount: activeProjects,
        financialHealth: health,
        overBudgetProjectsCount: overBudgetProjects,
        totalValueCompleted: valueCompleted,
    };
  }, [projects, clients, searchTerm, filterStatus]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
            <h2 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100">Painel de Controle</h2>
            <p className="text-neutral-500 dark:text-neutral-400">Visão geral da sua empresa e projetos.</p>
        </div>
        <Button onClick={openModal} leftIcon={<PlusIcon className="h-5 w-5"/>}>
          Novo Projeto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title="Saúde Financeira" value={`${financialHealth.toFixed(1)}%`} subValue="Margem Orçado vs. Gasto" icon={<CurrencyDollarIcon className="h-6 w-6"/>} colorClass={financialHealth >= 0 ? 'text-green-500' : 'text-red-500'} />
          <KpiCard title="Projetos em Andamento" value={String(activeProjectsCount)} icon={<BriefcaseIcon className="h-6 w-6"/>} />
          <KpiCard title="Acima do Orçamento" value={String(overBudgetProjectsCount)} subValue="Projetos com gastos extras" icon={<ExclamationTriangleIcon className="h-6 w-6"/>} colorClass={overBudgetProjectsCount > 0 ? 'text-yellow-500' : 'text-primary'} />
          <KpiCard title="Total Concluído" value={formatCurrency(totalValueCompleted)} subValue="Valor orçado de projetos finalizados" icon={<CheckCircleIcon className="h-6 w-6"/>} colorClass="text-green-500" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
                <h3 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-100">Meus Projetos</h3>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <Input 
                        placeholder="Buscar por projeto ou cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-2/3 lg:w-1/2"
                    />
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <Button size="sm" variant={filterStatus === 'all' ? 'primary' : 'ghost'} onClick={() => setFilterStatus('all')}>Todos</Button>
                        <Button size="sm" variant={filterStatus === 'inProgress' ? 'primary' : 'ghost'} onClick={() => setFilterStatus('inProgress')}>Em progresso</Button>
                        <Button size="sm" variant={filterStatus === 'completed' ? 'primary' : 'ghost'} onClick={() => setFilterStatus('completed')}>Concluídos</Button>
                    </div>
                </div>
                {filteredProjects.length > 0 ? (
                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    {filteredProjects.map(project => {
                    const client = clients.find(c => c.id === project.clientId);
                    return (
                        <motion.div key={project.id} variants={itemVariants}>
                        <ProjectCard 
                            project={project} 
                            clientName={client?.name || 'Cliente desconhecido'} 
                            onSelect={() => onSelectProject(project)} 
                        />
                        </motion.div>
                    )
                    })}
                </motion.div>
                ) : (
                <div className="text-center py-12">
                    <h3 className="text-xl font-medium">Nenhum projeto encontrado.</h3>
                    <p className="text-neutral-500 mt-2">Ajuste os filtros ou crie seu primeiro projeto.</p>
                </div>
                )}
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
                <h3 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-100">Análise Financeira Global</h3>
                <CostChart data={globalChartData} />
            </Card>
          </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Criar Novo Projeto">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">Nome do Projeto</label>
            <Input id="name" type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label htmlFor="client" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">Cliente</label>
            {clients.length > 0 ? (
                <select
                    id="client"
                    value={newProjectClientId}
                    onChange={e => setNewProjectClientId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                >
                    {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                </select>
            ) : (
                <p className="text-sm text-neutral-500 mt-1">Nenhum cliente cadastrado. Vá para Configurações para adicionar.</p>
            )}
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">Localização</label>
            <Input id="location" type="text" value={newProjectLocation} onChange={e => setNewProjectLocation(e.target.value)} className="mt-1" />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateProject} disabled={clients.length === 0 || !newProjectName || !newProjectLocation}>Criar Projeto</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
