import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Регистрируем плагин
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const ChartPopup = ({ data, onClose }) => {
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const values = data?.values || [30, 25, 20, 25];
  const total = values.reduce((a, b) => a + b, 0);

  const chartData = {
    labels: ['Категория 1', 'Категория 2', 'Категория 3', 'Категория 4'],
    datasets: [
      {
        data: values,
        backgroundColor: [
          '#2196F3',
          '#FF9800',
          '#4CAF50',
          '#F44336',
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%', // Делаем отверстие для текста
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 12 },
          padding: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
          size: 14,
        },
        formatter: (value) => {
          return value; // Показываем значение на каждом сегменте
        },
        anchor: 'center',
        align: 'center',
        offset: 0,
      },
    },
  };

  // Кастомный плагин для отображения общей суммы в центре
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
      const { width, height, ctx } = chart;
      ctx.save();

      const centerX = width / 2;
      const centerY = height / 2 - 10;

      // Общая сумма
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(total, centerX, centerY);

      // Подпись
      ctx.font = '12px Arial';
      ctx.fillStyle = '#999';
      ctx.fillText('Всего', centerX, centerY + 30);

      ctx.restore();
    },
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        padding: '24px',
        minWidth: '320px',
        maxWidth: '400px',
        width: '90%',
        animation: 'fadeIn 0.3s ease',
      }}
      ref={popupRef}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
          📊 {data?.title || 'Диаграмма'}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#999',
            padding: '0 8px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.color = '#333'}
          onMouseLeave={(e) => e.target.style.color = '#999'}
        >
          ×
        </button>
      </div>

      <div style={{ height: '250px', marginBottom: '12px' }}>
        <Doughnut
          data={chartData}
          options={options}
          plugins={[centerTextPlugin]}
        />
      </div>

      {data?.address && (
        <div style={{
          fontSize: '13px',
          color: '#666',
          borderTop: '1px solid #eee',
          paddingTop: '12px',
          marginTop: '4px',
        }}>
          <span>📍 {data.address}</span>
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default ChartPopup;