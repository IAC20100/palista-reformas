
import React from 'react';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    srLabel?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, srLabel = "Toggle" }) => {
    return (
        <button
            type="button"
            className={`${
                checked ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-600'
            } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 focus:ring-primary`}
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
        >
            <span className="sr-only">{srLabel}</span>
            <span
                className={`${
                    checked ? 'translate-x-6' : 'translate-x-1'
                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
            />
        </button>
    );
};

export default Switch;