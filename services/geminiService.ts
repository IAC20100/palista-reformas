
import { GoogleGenAI, Type } from "@google/genai";
import { AISuggestion, ConsultancyReport, Project, AgentType, Client, BudgetItem } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const budgetSuggestionSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            category: {
                type: Type.STRING,
                description: 'A categoria do item de orçamento (ex: Materiais, Mão de Obra, Equipamentos).'
            },
            itemName: {
                type: Type.STRING,
                description: 'O nome específico do item de orçamento (ex: Cimento, Pedreiro, Betoneira).'
            },
            quantity: {
                type: Type.NUMBER,
                description: 'A quantidade estimada para este item (ex: 10, 5, 1).'
            },
            unitCost: {
                type: Type.NUMBER,
                description: 'O custo unitário estimado para este item em Reais (BRL).'
            }
        },
        required: ["category", "itemName", "quantity", "unitCost"]
    }
};

const consultancyReportSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'O título principal do relatório de consultoria.' },
        summary: { type: Type.STRING, description: 'Um resumo conciso das principais descobertas e da análise geral.' },
        recommendations: {
            type: Type.ARRAY,
            description: 'Uma lista de recomendações específicas, descobertas ou pontos de atenção.',
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: 'O título da recomendação ou do ponto de análise.' },
                    description: { type: Type.STRING, description: 'Uma descrição detalhada da recomendação, explicando o porquê e como aplicá-la.' },
                    impact: { type: Type.STRING, description: 'O impacto potencial da recomendação (ex: Alta Economia, Melhoria de Prazo, Sustentabilidade, Risco Alto).' }
                },
                required: ['title', 'description', 'impact']
            }
        }
    },
    required: ['title', 'summary', 'recommendations']
};

const getAgentConfig = (agentType: AgentType) => {
    switch (agentType) {
        case 'BUDGET':
            return {
                systemInstruction: "Você é um Engenheiro Orçamentista sênior, especialista em otimização de custos na construção civil. Sua análise deve ser crítica e focada em encontrar economias, validar quantidades e prever custos ocultos. Forneça insights práticos e acionáveis.",
                promptContinuation: "Analise este projeto e gere um relatório de otimização de custos. Identifique itens superdimensionados, sugira materiais alternativos com melhor custo-benefício e alerte sobre possíveis custos não previstos."
            };
        case 'SUSTAINABILITY':
            return {
                systemInstruction: "Você é um Arquiteto especialista em construção sustentável e práticas de ESG. Seu objetivo é identificar oportunidades para tornar o projeto mais ecológico, eficiente e socialmente responsável, agregando valor ao imóvel.",
                promptContinuation: "Analise este projeto e gere um relatório de sustentabilidade. Sugira o uso de materiais ecológicos, sistemas de economia de energia e água (como captação pluvial e painéis solares) e outras práticas de construção verde."
            };
        case 'TIMELINE':
            return {
                systemInstruction: "Você é um Mestre de Obras experiente, especialista em planejamento e execução de cronogramas. Sua visão é prática e focada na logística do canteiro de obras para garantir que o projeto flua sem atrasos.",
                promptContinuation: "Analise este projeto e gere um relatório de planejamento. Esboce um cronograma de alto nível com as principais etapas, identifique o caminho crítico e aponte dependências entre as tarefas para evitar gargalos."
            };
        case 'RISK':
            return {
                systemInstruction: "Você é um Gestor de Riscos especialista no setor da construção civil. Sua função é antecipar problemas antes que eles aconteçam, protegendo o orçamento e o prazo do projeto.",
                promptContinuation: "Analise este projeto e gere um relatório de gestão de riscos. Identifique os principais riscos (mercadológicos, técnicos, regulatórios, climáticos, de segurança) e sugira estratégias de mitigação claras para cada um."
            };
        default:
            throw new Error("Agente desconhecido");
    }
};


export const getAIBudgetSuggestions = async (prompt: string): Promise<AISuggestion[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Com base na seguinte descrição de um projeto de construção, gere uma lista detalhada de itens de orçamento com quantidade e custo unitário estimados em Reais (BRL). Descrição: "${prompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: budgetSuggestionSchema,
      },
    });
    
    const responseText = response.text;
    if (responseText) {
        const suggestions = JSON.parse(responseText);
        return suggestions as AISuggestion[];
    }
    return [];

  } catch (error) {
    console.error("Error fetching AI budget suggestions:", error);
    throw new Error("Não foi possível gerar sugestões. Verifique o prompt e tente novamente.");
  }
};


export const getAIConsultancyReport = async (project: Project, clients: Client[], agentType: AgentType): Promise<ConsultancyReport> => {
    const { systemInstruction, promptContinuation } = getAgentConfig(agentType);
    
    const clientName = clients.find(c => c.id === project.clientId)?.name || 'Cliente não encontrado';

    const projectDescription = `
        Nome do Projeto: ${project.name}
        Cliente: ${clientName}
        Localização: ${project.location}
        Orçamento atual: ${project.budget.map(c => `${c.name} (${c.items.length} itens)`).join(', ')}.
        ---
        ${promptContinuation}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: projectDescription,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: consultancyReportSchema,
            },
        });

        const responseText = response.text;
        if (responseText) {
            return JSON.parse(responseText) as ConsultancyReport;
        }
        throw new Error("A resposta da IA estava vazia.");

    } catch (error) {
        console.error(`Error fetching AI consultancy for ${agentType}:`, error);
        throw new Error("Não foi possível gerar o relatório de consultoria. Tente novamente.");
    }
};