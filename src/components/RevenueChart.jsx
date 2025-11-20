// src/components/RevenueChart.jsx
import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { toDate } from '../firebase';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function RevenueChart({ payments, selectedPeriod }) {
  const chartData = useMemo(() => {
    if (!payments || payments.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const now = new Date();
    let labels = [];
    let dataPoints = [];

    if (selectedPeriod === 'month') {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }));
        
        const dayRevenue = payments
          .filter(p => {
            const paymentDate = toDate(p.paymentDate);
            return paymentDate.toDateString() === date.toDateString();
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        
        dataPoints.push(dayRevenue);
      }
    } else if (selectedPeriod === 'quarter') {
      // Last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        labels.push(`W${12 - i}`);
        
        const weekRevenue = payments
          .filter(p => {
            const paymentDate = toDate(p.paymentDate);
            return paymentDate >= weekStart && paymentDate <= weekEnd;
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        
        dataPoints.push(weekRevenue);
      }
    } else { // year
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(monthDate.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }));
        
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthRevenue = payments
          .filter(p => {
            const paymentDate = toDate(p.paymentDate);
            return paymentDate >= monthStart && paymentDate <= monthEnd;
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        
        dataPoints.push(monthRevenue);
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Revenue (€)',
          data: dataPoints,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(16, 185, 129)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }
      ]
    };
  }, [payments, selectedPeriod]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#cbd5e1',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#475569',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `€${context.parsed.y.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11
          },
          callback: function(value) {
            return '€' + value.toLocaleString('it-IT');
          }
        },
        beginAtZero: true
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">
        Trend Revenue nel Tempo
      </h3>
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
