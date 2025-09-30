
import React from 'react';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO string format
  categoryId: string;
}

export interface BudgetItem {
  id: string;
  name: string;
  quantity: number;
  budgetedCost: number; // Unit cost
}

export interface BudgetCategory {
  id: string;
  name: string;
  items: BudgetItem[];
}

export type ProjectStatus = 'Planejamento' | 'Em Andamento' | 'Pausado' | 'Concluído' | 'Cancelado';

export interface Project {
  id: string;
  name: string;
  clientId: string; 
  location: string;
  budget: BudgetCategory[];
  expenses: Expense[];
  status: ProjectStatus;
}

export interface ChartData {
  name: string;
  Orçado: number;
  Gasto: number;
}

export interface AISuggestion {
  category: string;
  itemName: string;
  quantity: number;
  unitCost: number;
}

// Tipos para a nova funcionalidade de Consultoria IA
export type AgentType = 'BUDGET' | 'SUSTAINABILITY' | 'TIMELINE' | 'RISK';

export interface AgentProfile {
    id: AgentType;
    name: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}

export interface RecommendationItem {
    title: string;
    description: string;
    impact: string;
}

export interface ConsultancyReport {
    title: string;
    summary: string;
    recommendations: RecommendationItem[];
}

// Tipos para a funcionalidade de Configurações
export interface Client {
    id: string;
    name: string;
    documentId?: string; // CPF ou CNPJ
    contactPhone?: string; // Telefone do responsável
    address?: string; // Endereço do cliente
}

export interface Product {
    id: string;
    name: string;
    type: 'product' | 'service';
    costPrice?: number;  // Custo para produto
    salePrice?: number;  // Venda para produto
    serviceCost?: number; // Custo para serviço
}


export interface BudgetTemplate {
  id: string;
  name: string;
  items: {
    category: string;
    name: string;
    quantity: number;
    budgetedCost: number; // Unit cost
  }[];
}