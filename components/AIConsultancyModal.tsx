
import React, { useState, useContext, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Card from './ui/Card';
import { getAIConsultancyReport } from '../services/geminiService';
import { Project, AgentType, AgentProfile, ConsultancyReport } from '../types';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { LeafIcon } from './icons/LeafIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import { AppContext } from '../contexts/AppContext';

interface AIConsultancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const AGENT_PROFILES: AgentProfile[] = [
    { id: 'BUDGET', name: 'Eng. Orçamentista', title: 'Análise de Custos', description: 'Otimize seu orçamento, encontre economias e preveja custos ocultos.', icon: CalculatorIcon },
    { id: 'SUSTAINABILITY', name: 'Arq. Sustentável', title: 'Práticas Ecológicas', description: 'Receba sugestões de materiais e práticas para uma obra mais verde e valorizada.', icon: LeafIcon },
    { id: 'TIMELINE', name: 'Mestre de Obras', title: 'Planejamento e Execução', description: 'Obtenha um cronograma com as etapas críticas e evite atrasos na sua obra.', icon: ClipboardIcon },
    { id: 'RISK', name: 'Gestor de Riscos', title: 'Análise de Riscos', description: 'Antecipe problemas de mercado, regulação e segurança antes que aconteçam.', icon: ShieldIcon },
];

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
);

const ImpactBadge: React.FC<{impact: string}> = ({ impact }) => {
    const impactColor = {
        'alta': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        'média': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        'baixa': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    const normalizedImpact = impact.toLowerCase().split(' ')[0];
    const colorClass = impactColor[normalizedImpact] || 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200';
    return <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>{impact}</span>;
}


const AIConsultancyModal: React.FC<AIConsultancyModalProps> = ({ isOpen, onClose, project }) => {
    const { clients } = useContext(AppContext);
    const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
    const [report, setReport] = useState<ConsultancyReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReset = () => {
        setSelectedAgent(null);
        setReport(null);
        setError(null);
        setIsLoading(false);
    };

    useEffect(() => {
        if (!isOpen) {
            // allow for exit animation before resetting
            const timer = setTimeout(() => handleReset(), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleSelectAgent = (agent: AgentProfile) => {
        setSelectedAgent(agent);
        handleGenerateReport(agent.id);
    };

    const handleGenerateReport = async (agentType: AgentType) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getAIConsultancyReport(project, clients, agentType);
            setReport(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const modalTitle = selectedAgent ? `Relatório de ${selectedAgent.title}` : "Selecione o Consultor IA";
    
    const handleCloseModal = () => {
        handleReset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleCloseModal} title={modalTitle}>
            {!selectedAgent && !isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {AGENT_PROFILES.map(agent => (
                        <Card 
                            key={agent.id}
                            className="text-center cursor-pointer flex flex-col items-center p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                            onClick={() => handleSelectAgent(agent)}
                        >
                            <agent.icon className="h-10 w-10 text-primary mb-2" />
                            <h4 className="font-bold text-neutral-800 dark:text-neutral-100">{agent.name}</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">{agent.description}</p>
                        </Card>
                    ))}
                </div>
            )}

            {isLoading && <LoadingSpinner />}
            
            {error && <p className="text-red-500 text-center py-4">{error}</p>}
            
            {report && !isLoading && (
                 <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                     <div className="bg-neutral-50 dark:bg-neutral-700/50 p-4 rounded-lg">
                         <h4 className="font-bold text-lg text-neutral-800 dark:text-neutral-100">{report.title}</h4>
                         <p className="text-neutral-600 dark:text-neutral-300 mt-2">{report.summary}</p>
                     </div>
                     <div>
                         <h4 className="font-bold text-lg text-neutral-800 dark:text-neutral-100 my-3">Recomendações</h4>
                         <div className="space-y-3">
                             {report.recommendations.map((rec, index) => (
                                 <Card key={index} className="!p-4">
                                     <div className="flex justify-between items-start gap-2">
                                         <h5 className="font-semibold text-neutral-800 dark:text-neutral-200 flex-1">{rec.title}</h5>
                                         <ImpactBadge impact={rec.impact} />
                                     </div>
                                     <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-sm">{rec.description}</p>
                                 </Card>
                             ))}
                         </div>
                     </div>
                 </div>
            )}

            {selectedAgent && (
                <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-neutral-700">
                    <Button variant="ghost" onClick={handleReset} disabled={isLoading}>Voltar</Button>
                    <Button onClick={handleCloseModal}>Fechar</Button>
                </div>
            )}
        </Modal>
    );
};

export default AIConsultancyModal;