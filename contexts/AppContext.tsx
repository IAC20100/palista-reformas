import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Project, Client, Product, BudgetTemplate, Expense, ProjectStatus } from '../types';

const MOCK_PROJECTS: Project[] = [
    {
        id: 'proj-1', name: 'Residência Alphaville', clientId: 'client-1', location: 'Alphaville, SP',
        status: 'Em Andamento',
        budget: [
            { id: 'cat-1', name: 'Materiais', items: [
                { id: 'item-1', name: 'Cimento Votoran (50kg)', quantity: 100, budgetedCost: 35 },
                { id: 'item-2', name: 'Tijolos (milheiro)', quantity: 10, budgetedCost: 800 },
                { id: 'item-3', name: 'Aço CA-50', quantity: 500, budgetedCost: 24 },
            ]},
            { id: 'cat-2', name: 'Mão de Obra', items: [
                { id: 'item-4', name: 'Pedreiros (diária)', quantity: 75, budgetedCost: 200 },
                { id: 'item-5', name: 'Eletricista (ponto)', quantity: 50, budgetedCost: 80 },
            ]}
        ],
        expenses: [
            { id: 'exp-1', description: 'Compra de cimento - Loja do Zé', amount: 3650, date: '2024-07-15', categoryId: 'cat-1' },
            { id: 'exp-2', description: 'Compra de tijolos - Olaria Central', amount: 7800, date: '2024-07-16', categoryId: 'cat-1' },
            { id: 'exp-3', description: 'Pagamento Eletricista - 1a parcela', amount: 2000, date: '2024-07-20', categoryId: 'cat-2' },
            { id: 'exp-5', description: 'Pagamento Eletricista - 2a parcela', amount: 2250, date: '2024-07-28', categoryId: 'cat-2' },
        ]
    },
    {
        id: 'proj-2', name: 'Edifício Comercial Itaim', clientId: 'client-2', location: 'Itaim Bibi, SP',
        status: 'Concluído',
        budget: [
            { id: 'cat-3', name: 'Fundações', items: [{ id: 'item-6', name: 'Concreto Usinado', quantity: 20, budgetedCost: 2500 }] },
            { id: 'cat-4', name: 'Equipamentos', items: [{ id: 'item-7', name: 'Aluguel de Betoneira (mês)', quantity: 1, budgetedCost: 1200 }] }
        ],
        expenses: [
             { id: 'exp-4', description: 'Concreto - ConcreMAX', amount: 52000, date: '2024-07-18', categoryId: 'cat-3' }
        ]
    }
];

const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, state]);

    return [state, setState];
};


interface AppContextType {
    projects: Project[];
    clients: Client[];
    products: Product[];
    budgetTemplates: BudgetTemplate[];
    companyLogo: string | null;
    activeProject: Project | null;
    addProject: (data: { name: string; clientId: string; location: string; }) => void;
    updateProject: (projectId: string, updater: (project: Project) => Project) => void;
    updateClients: React.Dispatch<React.SetStateAction<Client[]>>;
    updateProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    updateBudgetTemplates: React.Dispatch<React.SetStateAction<BudgetTemplate[]>>;
    updateLogo: React.Dispatch<React.SetStateAction<string | null>>;
    setActiveProject: React.Dispatch<React.SetStateAction<Project | null>>;
}

export const AppContext = createContext<AppContextType>(null!);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [projects, setProjects] = usePersistentState<Project[]>('construtoiCertoProjects', MOCK_PROJECTS);
    const [clients, setClients] = usePersistentState<Client[]>('construtoiCertoClients', [
        {id: 'client-1', name: 'Família Silva', documentId: '123.456.789-00', contactPhone: '11999998888', address: 'Rua das Flores, 123, São Paulo, SP'},
        {id: 'client-2', name: 'InvestCo', documentId: '12.345.678/0001-99', contactPhone: '11999997777', address: 'Av. Faria Lima, 4500, São Paulo, SP'}
    ]);
    const [products, setProducts] = usePersistentState<Product[]>('construtoiCertoProducts', [
        { id: 'prod-1', name: 'Cimento Votoran (saco 50kg)', type: 'product', costPrice: 28, salePrice: 35 },
        { id: 'prod-2', name: 'Tijolo Baiano (milheiro)', type: 'product', costPrice: 750, salePrice: 950 },
        { id: 'serv-1', name: 'Diária de Pedreiro', type: 'service', serviceCost: 200 },
        { id: 'serv-2', name: 'Instalação Elétrica (ponto)', type: 'service', serviceCost: 80 },
    ]);
    const [budgetTemplates, setBudgetTemplates] = usePersistentState<BudgetTemplate[]>('construtoiCertoTemplates', []);
    const [companyLogo, setCompanyLogo] = usePersistentState<string | null>('construtoiCertoLogo', null);
    
    const [activeProject, setActiveProject] = useState<Project | null>(null);

    const addProject = useCallback((projectData: { name: string; clientId: string; location:string; }) => {
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            ...projectData,
            status: 'Planejamento',
            budget: [
                {id: 'cat-mat-init', name: 'Materiais', items: []},
                {id: 'cat-mo-init', name: 'Mão de Obra', items: []},
            ],
            expenses: [],
        };
        setProjects(prev => [...prev, newProject]);
    }, [setProjects]);

    const updateProject = useCallback((projectId: string, updater: (project: Project) => Project) => {
        setProjects(prevProjects =>
            prevProjects.map(p => (p.id === projectId ? updater(p) : p))
        );
        setActiveProject(prevActive =>
            prevActive?.id === projectId ? updater(prevActive) : prevActive
        );
    }, [setProjects, setActiveProject]);

    const value = {
        projects,
        clients,
        products,
        budgetTemplates,
        companyLogo,
        activeProject,
        addProject,
        updateProject,
        updateClients: setClients,
        updateProducts: setProducts,
        updateBudgetTemplates: setBudgetTemplates,
        updateLogo: setCompanyLogo,
        setActiveProject,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};