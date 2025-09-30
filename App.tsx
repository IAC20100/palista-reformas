
import React, { useState, useCallback, useContext } from 'react';
import { Project } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ProjectDetail from './components/ProjectDetail';
import Settings from './components/Settings';

import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppProvider, AppContext } from './contexts/AppContext';


type AppView = 'dashboard' | 'projectDetail' | 'settings';

const AppContent: React.FC = () => {
    const { 
        activeProject, 
        setActiveProject, 
        updateProject,
        clients,
        products,
        projects,
        budgetTemplates,
        companyLogo,
        updateClients,
        updateProducts,
        updateBudgetTemplates,
        updateLogo,
    } = useContext(AppContext);
    const [view, setView] = useState<AppView>('dashboard');

    // --- Navigation Handlers ---
    const handleSelectProject = (project: Project) => {
        setActiveProject(project);
        setView('projectDetail');
    };

    const handleGoToDashboard = () => {
        setActiveProject(null);
        setView('dashboard');
    };

    const handleGoToSettings = () => {
        setActiveProject(null);
        setView('settings');
    };
    
    // --- Render Logic ---
    const renderContent = () => {
        switch (view) {
            case 'settings':
                return <Settings 
                    clients={clients}
                    products={products}
                    projects={projects}
                    budgetTemplates={budgetTemplates}
                    companyLogo={companyLogo}
                    onUpdateClients={updateClients}
                    onUpdateProducts={updateProducts}
                    onUpdateBudgetTemplates={updateBudgetTemplates}
                    onUpdateLogo={updateLogo}
                />;
            case 'projectDetail':
                if (activeProject) {
                     return <ProjectDetail 
                        project={activeProject}
                        updateProject={updateProject}
                        onGoBack={handleGoToDashboard}
                    />;
                }
                // Fallback to dashboard if no active project
                setView('dashboard');
                return null;
            case 'dashboard':
            default:
                return <Dashboard 
                    onSelectProject={handleSelectProject}
                />;
        }
    };

    return (
        <div className="min-h-screen font-sans">
            <Header 
                onGoToSettings={handleGoToSettings}
                onGoToDashboard={handleGoToDashboard}
            />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 px-4">
                {renderContent()}
            </main>
        </div>
    );
};


const App: React.FC = () => {
    return (
        <ThemeProvider>
            <ToastProvider>
                <AppProvider>
                    <AppContent />
                </AppProvider>
            </ToastProvider>
        </ThemeProvider>
    )
}

export default App;