
import React from 'react';

// Replaced with a more intuitive Floppy Disk icon for "Save"
export const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3l-4 4-4-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7v4a1 1 0 01-1 1H9a1 1 0 01-1-1V7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7h-1" />
    </svg>
);