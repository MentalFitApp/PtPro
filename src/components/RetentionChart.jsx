// src/components/RetentionChart.jsx
import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { toDate } from '../firebase';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function RetentionChart({ clients }) {
  const chartData = useMemo(() => {
    if (!clients || clients.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const now = new Date();
    const labels = [];
    const activeData = [];
    const expiredData = [];

    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(monthDate.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }));
      
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      // Count clients active at end of that month
      const activeAtEndOfMonth = clients.filter(c => {
        const expiry = toDate(c.scadenza);
        return expiry && expiry > monthEnd;
      }).length;
      
      // Count clients that expired during that month
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const expiredDuringMonth = clients.filter(c => {
        const expiry = toDate(c.scadenza);
        return expiry && expiry >= monthStart && expiry <= monthEnd;
      }).length;
      
      activeData.push(activeAtEndOfMonth);
      expiredData.push(expiredDuringMonth);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Clienti Attivi',
          data: activeData,
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2,
          borderRadius: 4,
        },
        {
          label: 'Clienti Scaduti',
          data: expiredData,
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 2,
          borderRadius: 4,
        }
      ]
    };
  }, [clients]);

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
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'rectRounded'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#475569',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} clienti`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: false,
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
        stacked: false,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11
          },
          stepSize: 1,
          callback: function(value) {
            return value;
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
        Retention Trend (Ultimi 6 Mesi)
      </h3>
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
