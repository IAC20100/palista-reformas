
import React, { useContext } from 'react';
import { SettingsIcon } from './icons/SettingsIcon';
import { HomeIcon } from './icons/HomeIcon';
import Button from './ui/Button';
import { AppContext } from '../contexts/AppContext';


const BuildingIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

interface HeaderProps {
    onGoToSettings: () => void;
    onGoToDashboard: () => void;
}

const Header: React.FC<HeaderProps> = ({ onGoToSettings, onGoToDashboard }) => {
  const { companyLogo } = useContext(AppContext);

  return (
    <header className="bg-white dark:bg-neutral-800 shadow-md transition-colors duration-300 no-print">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
            <div 
                className="flex items-center space-x-3 cursor-pointer"
                onClick={onGoToDashboard}
                title="Ir para o Painel Principal"
            >
                {companyLogo ? (
                     <img src={companyLogo} alt="Logo da Empresa" className="h-10 object-contain" />
                ) : (
                    <>
                        <BuildingIcon className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 hidden sm:block">
                            PAULISTA REFORMAS
                        </h1>
                    </>
                )}
            </div>
            <div className="flex items-center gap-2">
                 <Button variant="ghost" onClick={onGoToDashboard} leftIcon={<HomeIcon className="h-5 w-5" />} className="hidden sm:inline-flex">
                    Painel Principal
                </Button>
                <button onClick={onGoToSettings} className="p-2 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 focus:ring-primary" title="Configurações">
                    <SettingsIcon className="h-6 w-6" />
                    <span className="sr-only">Configurações</span>
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;