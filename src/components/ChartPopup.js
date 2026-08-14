import React, { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const ChartPopup = ({ data, onClose }) => {
  const popupRef = useRef(null);
  const chartRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Анимация появления
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  // Принудительное обновление диаграммы после открытия
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.update();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Закрытие по клику вне попапа
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

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const values = data?.values || [30, 25, 20, 25];
  const total = values.reduce((a, b) => a + b, 0);

  const chartData = {
    labels: ['Категория 1', 'Категория 2', 'Категория 3', 'Категория 4'],
    datasets: [
      {
        data: values,
        backgroundColor: [
          'rgba(33, 150, 243, 0.85)',
          'rgba(255, 152, 0, 0.85)',
          'rgba(76, 175, 80, 0.85)',
          'rgba(244, 67, 54, 0.85)',
        ],
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 11, weight: '500' },
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 10,
          color: 'rgba(255,255,255,0.85)',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
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
          size: 11,
        },
        formatter: (value) => {
          const pct = ((value / total) * 100);
          return pct > 8 ? Math.round(pct) + '%' : '';
        },
        anchor: 'center',
        align: 'center',
        offset: 0,
      },
    },
  };

  // Кастомный плагин для текста в центре
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
      const { width, height, ctx } = chart;
      ctx.save();

      const centerX = width / 2;
      const centerY = height / 2 - 16;

      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 20;

      ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 15;
      ctx.fillText(total, centerX, centerY - 6);

      ctx.shadowBlur = 0;
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('всего', centerX, centerY + 28);

      ctx.restore();
    },
  };

  const popupStyles = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${isVisible ? 1 : 0.7})`,
    zIndex: 1000,
    background: 'rgba(248, 243, 243, 0.02)',
    backdropFilter: 'blur(16px) saturate(180%)',
    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
    borderRadius: '24px',
    padding: '28px 32px 24px',
    minWidth: '300px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    opacity: isVisible ? 1 : 0,
    transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
    pointerEvents: 'auto',
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          zIndex: 999,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
        }}
        onClick={onClose}
      />

      <div style={popupStyles} ref={popupRef}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
          color: 'rgba(255,255,255,0.9)',
        }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: '600',
              letterSpacing: '0.3px',
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              {data?.title || 'Диаграмма'}
            </h3>
            {data?.address && (
              <p style={{
                margin: '4px 0 0',
                fontSize: '12px',
                opacity: 0.6,
                fontWeight: '400',
              }}>
                {data.address.length > 40 ? data.address.slice(0, 40) + '…' : data.address}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              fontSize: '18px',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              flexShrink: 0,
              backdropFilter: 'blur(4px)',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.color = 'rgba(255,255,255,0.7)';
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ height: '220px', margin: '4px 0 8px' }}>
          <Doughnut
            ref={chartRef}
            data={chartData}
            options={options}
            plugins={[centerTextPlugin]}
          />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginTop: '4px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {values.map((val, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.6)',
            }}>
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: [
                  'rgba(33, 150, 243, 0.85)',
                  'rgba(255, 152, 0, 0.85)',
                  'rgba(76, 175, 80, 0.85)',
                  'rgba(244, 67, 54, 0.85)',
                ][idx],
              }} />
              {val}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ChartPopup;