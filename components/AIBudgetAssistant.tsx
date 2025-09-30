

import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { getAIBudgetSuggestions } from '../services/geminiService';
import { AISuggestion } from '../types';

interface AIBudgetAssistantProps {
  onSuggestionsReady: (suggestions: AISuggestion[]) => void;
}

const MagicIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);


const AIBudgetAssistant: React.FC<AIBudgetAssistantProps> = ({ onSuggestionsReady }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Por favor, descreva o projeto para obter sugestões.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const suggestions = await getAIBudgetSuggestions(prompt);
      onSuggestionsReady(suggestions);
      setIsModalOpen(false);
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setIsModalOpen(true)} leftIcon={<MagicIcon className="h-5 w-5"/>}>
        Assistente de Orçamento IA
      </Button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assistente de Orçamento IA">
        <div className="space-y-4">
          <p className="text-neutral-600 dark:text-neutral-300">
            Descreva a etapa ou o escopo do projeto para o qual você precisa de um orçamento. A IA irá sugerir itens e custos estimados.
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Exemplo: "Reforma de um banheiro de 10m², incluindo troca de piso, azulejos, louças sanitárias e pintura."
          </p>
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
              Descrição do Projeto
            </label>
            <textarea
              id="prompt"
              rows={4}
              className="block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Digite aqui..."
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? 'Gerando...' : 'Gerar Sugestões'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AIBudgetAssistant;