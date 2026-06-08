import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TaskStatusChart = ({ data }) => {
  const defaultData = [
    { name: 'Pending', value: 0, color: '#64748b' },
    { name: 'In Progress', value: 0, color: '#3b82f6' },
    { name: 'Completed', value: 0, color: '#10b981' },
    { name: 'Blocked', value: 0, color: '#ef4444' },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
        <Legend wrapperStyle={{ color: 'white' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default TaskStatusChart;