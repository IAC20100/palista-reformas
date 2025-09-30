import React, { useContext, useState } from 'react';
import { Project, Client } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { DownloadIcon } from '../icons/DownloadIcon';
import { AppContext } from '../../contexts/AppContext';
import { ToastContext } from '../../contexts/ToastContext';
import { generatePdfFromElement } from '../../utils/pdfGenerator';

interface WorkOrderTabProps {
    project: Project;
    clientDetails: Client | null;
}

const WorkOrderPdfLayout: React.FC<WorkOrderTabProps & { companyLogo: string | null }> = ({ project, clientDetails, companyLogo }) => (
    <div id="work-order-pdf-content" className="pdf-document" style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div className="pdf-header">
            <div>
                <h1 className="mb-4">Ordem de Serviço</h1>
                <p>Documento de Acordo de Serviços e Materiais</p>
            </div>
            {companyLogo && <img src={companyLogo} alt="Logo da Empresa" />}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem', marginBottom: '2rem', fontSize: '0.875rem' }}>
            <div><strong style={{ display: 'block' }}>PROJETO:</strong>{project.name}</div>
            <div><strong style={{ display: 'block' }}>LOCALIZAÇÃO:</strong>{project.location}</div>
            <div><strong style={{ display: 'block' }}>CLIENTE:</strong>{clientDetails?.name || 'Não informado'}</div>
            <div><strong style={{ display: 'block' }}>DATA DE EMISSÃO:</strong>{new Date().toLocaleDateString('pt-BR')}</div>
            {clientDetails?.documentId && <div><strong style={{ display: 'block' }}>CPF/CNPJ:</strong>{clientDetails.documentId}</div>}
            {clientDetails?.contactPhone && <div><strong style={{ display: 'block' }}>TELEFONE:</strong>{clientDetails.contactPhone}</div>}
            {clientDetails?.address && <div style={{gridColumn: '1 / -1', marginTop: '0.5rem'}}><strong style={{ display: 'block' }}>ENDEREÇO DA OBRA:</strong>{clientDetails.address}</div>}
        </div>
        
        <h2>Escopo de Serviços e Materiais</h2>
        {project.budget.map(category => (
            <div key={category.id} className="break-inside-avoid" style={{marginBottom: '1rem'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827'}}>{category.name}</h3>
                <table>
                     <thead>
                        <tr>
                            <th>Item / Serviço</th>
                            <th className="text-right">Quantidade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {category.items.map(item => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td className="text-right">{item.quantity}</td>
                            </tr>
                        ))}
                         {category.items.length === 0 && <tr><td colSpan={2}>Nenhum item nesta categoria.</td></tr>}
                    </tbody>
                </table>
            </div>
        ))}

        <div className="pdf-signature">
            <div className="line"></div>
            <p>Assinatura do Cliente ({clientDetails?.name || 'Cliente desconhecido'})</p>
            <p style={{marginTop: '1rem', fontSize: '0.75rem', color: '#6B7280'}}>Declaro que estou ciente e de acordo com o escopo de serviços e materiais descritos nesta Ordem de Serviço.</p>
        </div>
    </div>
);


const WorkOrderTab: React.FC<WorkOrderTabProps> = ({ project, clientDetails }) => {
    const { companyLogo } = useContext(AppContext);
    const { addToast } = useContext(ToastContext);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const handleDownloadPdf = async () => {
        setIsGeneratingPdf(true);
        try {
            await generatePdfFromElement(
                'work-order-pdf-content',
                `OS-${project.name.replace(/\s+/g, '_')}.pdf`
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
            <WorkOrderPdfLayout project={project} clientDetails={clientDetails} companyLogo={companyLogo} />
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-end no-print">
                    <Button onClick={handleDownloadPdf} leftIcon={<DownloadIcon className="h-5 w-5"/>} disabled={isGeneratingPdf}>
                        {isGeneratingPdf ? 'Gerando PDF...' : 'Baixar O.S. (PDF)'}
                    </Button>
                </div>
                <Card id="work-order-preview" className="p-8 bg-white dark:bg-neutral-800">
                    <div className="flex justify-between items-start border-b-2 border-neutral-200 dark:border-neutral-700 pb-4 mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-primary">Ordem de Serviço</h2>
                            <p className="text-neutral-500 dark:text-neutral-400">Documento de Acordo de Serviços e Materiais</p>
                        </div>
                            {companyLogo ? (
                            <img src={companyLogo} alt="Logo da Empresa" className="h-14 max-w-xs object-contain" />
                        ) : (
                            <div className="text-right">
                                <h3 className="text-xl font-bold">PAULISTA REFORMAS</h3>
                                <p className="text-sm text-neutral-500">Reformas e Construções</p>
                            </div>
                        )}
                    </div>
                    {/* Simplified preview. The full PDF is generated from the hidden layout */}
                    <div className="pdf-document !p-0">
                         <h2>Escopo de Serviços e Materiais</h2>
                        {project.budget.map(category => (
                            <div key={category.id} className="break-inside-avoid" style={{marginBottom: '1rem'}}>
                                <h3>{category.name}</h3>
                                <table>
                                     <thead>
                                        <tr>
                                            <th>Item / Serviço</th>
                                            <th className="text-right">Quantidade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {category.items.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.name}</td>
                                                <td className="text-right">{item.quantity}</td>
                                            </tr>
                                        ))}
                                        {category.items.length === 0 && <tr><td colSpan={2} className="text-center py-4">Nenhum item nesta categoria.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                        <div className="pdf-signature">
                            <div className="line"></div>
                            <p>Assinatura do Cliente ({clientDetails?.name || 'Cliente desconhecido'})</p>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
};

export default WorkOrderTab;