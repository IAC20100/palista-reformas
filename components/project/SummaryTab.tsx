
import React, { useMemo } from 'react';
import { Project, ChartData } from '../../types';
import Card from '../ui/Card';
import CostChart from '../CostChart';

interface SummaryTabProps {
    project: Project;
}

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const SummaryTab: React.FC<SummaryTabProps> = ({ project }) => {

    const { totalBudgeted, totalActual, chartData } = useMemo(() => {
        const totalBudgeted = project.budget.reduce((sum, category) => 
            sum + category.items.reduce((itemSum, item) => itemSum + (item.budgetedCost * item.quantity), 0), 0);

        const totalActual = project.expenses.reduce((sum, expense) => sum + expense.amount, 0);

        const chartData: ChartData[] = project.budget.map(category => {
            const categoryBudgeted = category.items.reduce((sum, item) => sum + (item.budgetedCost * item.quantity), 0);
            const categoryActual = project.expenses
                .filter(exp => exp.categoryId === category.id)
                .reduce((sum, exp) => sum + exp.amount, 0);
            
            return {
                name: category.name,
                'Orçado': categoryBudgeted,
                'Gasto': categoryActual,
            };
        });
        return { totalBudgeted, totalActual, chartData };
    }, [project]);

    const difference = totalBudgeted - totalActual;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary-light dark:bg-primary-dark/20">
                    <h3 className="text-lg font-semibold text-primary-dark dark:text-blue-200">Orçamento Total</h3>
                    <p className="text-3xl font-bold text-primary-dark dark:text-blue-200">{formatCurrency(totalBudgeted)}</p>
                </Card>
                <Card className="bg-orange-100 dark:bg-orange-500/20">
                    <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">Gasto Total</h3>
                    <p className="text-3xl font-bold text-orange-800 dark:text-orange-200">{formatCurrency(totalActual)}</p>
                </Card>
                <Card className={difference >= 0 ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'}>
                    <h3 className={`text-lg font-semibold ${difference >= 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>Saldo</h3>
                    <p className={`text-3xl font-bold ${difference >= 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>{formatCurrency(difference)}</p>
                </Card>
            </div>

            <Card>
                <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">Análise de Custos por Categoria</h3>
                <CostChart data={chartData} />
            </Card>
        </div>
    );
};

export default SummaryTab;