

import React, { useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartData } from '../types';
import { ThemeContext } from '../contexts/ThemeContext';

interface CostChartProps {
  data: ChartData[];
}

const CostChart: React.FC<CostChartProps> = ({ data }) => {
  const { theme } = useContext(ThemeContext);
  const formatCurrency = (value: number) => `R$${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  
  const tickColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';
  const gridColor = theme === 'dark' ? '#374151' : '#E5E7EB';


  return (
    <div className="h-96 w-full">
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 50,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" tick={{ fill: tickColor }} />
          <YAxis tickFormatter={formatCurrency} tick={{ fill: tickColor }} />
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ 
                backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB'
            }}
            labelStyle={{ color: theme === 'dark' ? '#F3F4F6' : '#374151' }}
          />
          <Legend wrapperStyle={{ color: tickColor }}/>
          <Bar dataKey="Orçado" fill="#1E40AF" />
          <Bar dataKey="Gasto" fill="#F97316" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CostChart;