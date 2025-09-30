
import React, { useState, useMemo, useContext } from 'react';
import { Project, Expense } from '../../types';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { TrashIcon } from '../icons/TrashIcon';
import { ToastContext } from '../../contexts/ToastContext';

interface ExpensesTabProps {
    project: Project;
    onUpdateProject: (updater: (project: Project) => Project) => void;
}

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (isoString: string) => {
    return new Date(isoString + 'T00:00:00-03:00').toLocaleDateString('pt-BR');
};


const ExpensesTab: React.FC<ExpensesTabProps> = ({ project, onUpdateProject }) => {
    const { addToast } = useContext(ToastContext);
    
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        categoryId: project.budget[0]?.id || ''
    });

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewExpense(prev => ({ ...prev, [name]: value }));
    };

    const handleAddExpense = () => {
        if (!newExpense.description.trim() || !newExpense.amount || !newExpense.date || !newExpense.categoryId) {
            addToast({ message: 'Todos os campos são obrigatórios.', type: 'error' });
            return;
        }

        const expenseToAdd: Expense = {
            id: `exp-${Date.now()}`,
            description: newExpense.description.trim(),
            amount: parseFloat(newExpense.amount),
            date: newExpense.date,
            categoryId: newExpense.categoryId
        };

        onUpdateProject(currentProject => ({
            ...currentProject,
            expenses: [...currentProject.expenses, expenseToAdd].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        }));

        addToast({ message: 'Gasto adicionado com sucesso!', type: 'success' });
        
        setNewExpense({
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            categoryId: project.budget[0]?.id || ''
        });
    };

    const handleDeleteExpense = (expenseId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este gasto?')) {
            onUpdateProject(currentProject => ({
                ...currentProject,
                expenses: currentProject.expenses.filter(exp => exp.id !== expenseId)
            }));
            addToast({ message: 'Gasto excluído.', type: 'success' });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <Card>
                <h3 className="text-xl font-bold mb-4">Adicionar Novo Gasto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium mb-1">Descrição</label>
                        <Input name="description" value={newExpense.description} onChange={handleFormChange} placeholder="Ex: Compra de cimento" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Valor (R$)</label>
                        <Input name="amount" type="number" value={newExpense.amount} onChange={handleFormChange} placeholder="0,00" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Data</label>
                        <Input name="date" type="date" value={newExpense.date} onChange={handleFormChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Categoria</label>
                        <select
                            name="categoryId"
                            value={newExpense.categoryId}
                            onChange={handleFormChange}
                            className="w-full block px-3 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        >
                            {project.budget.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <Button onClick={handleAddExpense}>Adicionar Gasto</Button>
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold mb-4">Histórico de Gastos</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-neutral-500 dark:text-neutral-400">
                        <thead className="text-xs text-neutral-700 dark:text-neutral-300 uppercase bg-neutral-50 dark:bg-neutral-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">Data</th>
                                <th scope="col" className="px-6 py-3">Descrição</th>
                                <th scope="col" className="px-6 py-3">Categoria</th>
                                <th scope="col" className="px-6 py-3 text-right">Valor</th>
                                <th scope="col" className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {project.expenses.length > 0 ? (
                                project.expenses.map(expense => {
                                    const categoryName = project.budget.find(c => c.id === expense.categoryId)?.name || 'N/A';
                                    return (
                                    <tr key={expense.id} className="bg-white dark:bg-neutral-800 border-b dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                        <td className="px-6 py-4">{formatDate(expense.date)}</td>
                                        <th scope="row" className="px-6 py-4 font-medium text-neutral-900 dark:text-white whitespace-nowrap">{expense.description}</th>
                                        <td className="px-6 py-4">{categoryName}</td>
                                        <td className="px-6 py-4 text-right font-mono text-secondary">{formatCurrency(expense.amount)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => handleDeleteExpense(expense.id)} className="text-red-500 hover:text-red-700" title="Excluir"><TrashIcon className="h-5 w-5"/></button>
                                        </td>
                                    </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-neutral-500">Nenhum gasto registrado para este projeto.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ExpensesTab;