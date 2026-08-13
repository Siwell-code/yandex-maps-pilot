import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import './App.css';
import { geocodeAddresses } from './services/geocoder';
import ChartPopup from './components/ChartPopup';

function App() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedPoint, setSelectedPoint] = useState(null); 
  const apiLoaded = useRef(false);

  
  const GEOCODER_API_KEY = process.env.REACT_APP_YANDEX_GEOCODER_API_KEY;
  const MAPS_API_KEY = process.env.REACT_APP_YANDEX_MAPS_API_KEY;

  
  if (!GEOCODER_API_KEY || !MAPS_API_KEY) {
    console.error('❌ Ошибка: API-ключи не найдены! Проверьте файл .env');
  }

  const addresses = useMemo(() => [
    { address: 'Москва, Кремль', values: [85, 45, 70, 30] },
    { address: 'Москва, Красная площадь, 1', values: [60, 80, 40, 55] },
    { address: 'Москва, ул. Тверская, 1', values: [90, 35, 65, 45] },
    { address: 'Москва, Ленинские горы, 1 (МГУ)', values: [75, 60, 85, 40] },
    { address: 'Москва, ул. Ильинка, 4 (ГУМ)', values: [50, 70, 90, 65] },
    { address: 'Москва, ул. Воздвиженка, 5/25 (РГБ)', values: [95, 40, 55, 70] },
    { address: 'Москва, ул. Новый Арбат, 21', values: [65, 85, 50, 60] },
    { address: 'Москва, Кутузовский проспект, 38', values: [80, 55, 75, 85] },
    { address: 'Москва, ул. Остоженка, 1', values: [45, 90, 60, 50] },
    { address: 'Москва, ул. Мясницкая, 20', values: [70, 65, 80, 90] },
    { address: 'Москва, ул. Покровка, 1/13/6', values: [55, 75, 45, 80] },
    { address: 'Москва, ул. Петровка, 2', values: [85, 50, 70, 55] },
    { address: 'Москва, ул. Неглинная, 14', values: [60, 85, 55, 75] },
    { address: 'Москва, ул. Кузнецкий Мост, 19', values: [90, 70, 85, 50] },
    { address: 'Москва, ул. Большая Дмитровка, 1', values: [75, 60, 65, 85] },
  ], []);

  const createMarkerElement = (point) => {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '30px';
    container.style.height = '30px';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.cursor = 'pointer';

    const dot = document.createElement('div');
    dot.style.width = '14px';
    dot.style.height = '14px';
    dot.style.background = '#174971';
    dot.style.borderRadius = '50%';
    dot.style.border = '2px solid white';
    dot.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.4)';
    dot.style.position = 'absolute';
    dot.style.zIndex = '2';
    dot.style.transition = 'transform 0.3s ease';

    const ring1 = document.createElement('div');
    ring1.style.position = 'absolute';
    ring1.style.width = '30px';
    ring1.style.height = '30px';
    ring1.style.borderRadius = '50%';
    ring1.style.border = '2px solid rgba(33, 150, 243, 0.6)';
    ring1.style.animation = 'pulse-ring 1.5s ease-out infinite';
    ring1.style.opacity = '0.8';

    const ring2 = document.createElement('div');
    ring2.style.position = 'absolute';
    ring2.style.width = '30px';
    ring2.style.height = '30px';
    ring2.style.borderRadius = '50%';
    ring2.style.border = '2px solid rgba(33, 150, 243, 0.4)';
    ring2.style.animation = 'pulse-ring 1.5s ease-out 0.75s infinite';
    ring2.style.opacity = '0.6';

    container.appendChild(ring1);
    container.appendChild(ring2);
    container.appendChild(dot);

    if (!document.getElementById('marker-animations')) {
      const style = document.createElement('style');
      style.id = 'marker-animations';
      style.textContent = `
        @keyframes pulse-ring {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    container.addEventListener('mouseenter', () => {
      dot.style.transform = 'scale(1.5)';
      ring1.style.animationDuration = '0.8s';
      ring2.style.animationDuration = '0.8s';
    });

    container.addEventListener('mouseleave', () => {
      dot.style.transform = 'scale(1)';
      ring1.style.animationDuration = '1.5s';
      ring2.style.animationDuration = '1.5s';
    });

    container.addEventListener('click', (e) => {
      e.stopPropagation();
      setSelectedPoint(point);
    });

    container.title = `${point.name}\n⭐ Рейтинг: ${point.rating}`;

    return container;
  };

  const loadPoints = useCallback(async () => {
    setLoading(true);
    setProgress({ current: 0, total: addresses.length });

    const addressStrings = addresses.map(item => item.address);
    const results = await geocodeAddresses(
      addressStrings,
      GEOCODER_API_KEY,
      (current, total) => {
        setProgress({ current, total });
      }
    );

    const formattedPoints = results.map((item, index) => {
      const original = addresses[index];
      return {
        id: index,
        coords: item.coords,
        name: item.originalAddress.split(',').slice(0, 2).join(', ') || item.originalAddress,
        address: item.address,
        rating: Math.round((Math.random() * 4 + 1) * 10) / 10,
        values: original?.values || [30, 25, 20, 25],
      };
    });

    setPoints(formattedPoints);
    setLoading(false);
    console.log(`✅ Загружено ${formattedPoints.length} точек`);
  }, [addresses, GEOCODER_API_KEY]);

  const createMap = useCallback(() => {
    if (!window.ymaps3 || mapInstance.current) return;

    const { 
      YMap, 
      YMapDefaultSchemeLayer,
      YMapDefaultFeaturesLayer,
      YMapMarker
    } = window.ymaps3;

    mapInstance.current = new YMap(mapRef.current, {
      location: {
        center: [37.6173, 55.7558],
        zoom: 12,
      },
    });

    mapInstance.current.addChild(new YMapDefaultSchemeLayer());
    mapInstance.current.addChild(new YMapDefaultFeaturesLayer({ 
      title: 'Markers Layer' 
    }));

    if (points.length > 0) {
      setTimeout(() => {
        points.forEach(point => {
          const markerElement = createMarkerElement(point);
          
          try {
            const marker = new YMapMarker(
              { coordinates: point.coords },
              markerElement
            );
            mapInstance.current.addChild(marker);
          } catch (error) {
            console.error('Ошибка добавления маркера:', error);
          }
        });
        console.log(`✅ Добавлено ${points.length} маркеров`);
      }, 100);
    }
  }, [points]);

  
  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  // Загрузка API
  useEffect(() => {
    if (apiLoaded.current || window.ymaps3) {
      if (window.ymaps3) {
        setIsMapReady(true);
      }
      return;
    }

    apiLoaded.current = true;

    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const scriptUrl = `https://api-maps.yandex.ru/3.0/?apikey=${MAPS_API_KEY}&lang=ru_RU`;

    loadScript(scriptUrl)
      .then(() => {
        setTimeout(() => {
          setIsMapReady(true);
        }, 300);
      })
      .catch((error) => {
        console.error('❌ Ошибка загрузки API:', error);
        apiLoaded.current = false;
      });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, [MAPS_API_KEY]);

  useEffect(() => {
    if (isMapReady && points.length > 0) {
      createMap();
    }
  }, [isMapReady, points, createMap]);

  return (
  <div className="App">
    {/* Шапка */}
    <header className="header">
      <h1>🗺️ Яндекс Карты <span>+ Степень защищенности объектов</span></h1>
      <div className="header-badge">
        <span className="dot"></span>
        {loading ? 'Загрузка...' : `${points.length} точек`}
      </div>
    </header>

    {/* Прогресс-бар */}
    {loading && (
      <div className="loading-bar">
        <div className="info">
          <div className="spinner"></div>
          <span>Загрузка адресов: {progress.current} из {progress.total}</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
      </div>
    )}

    {/* Карта */}
    <div className="map-wrapper">
      <div
        ref={mapRef}
        className="map-container"
      />
    </div>

    {/* Подсказка */}
    <div className="hint">
      <span className="hint-item">
        <span className="icon"></span> Наведите 
      </span>
      <span className="hint-item">
        <span className="icon"></span> Кликните 
      </span>
      <span className="hint-item">
        <span className="icon"></span> 
      </span>
    </div>

    {/* Попап */}
    {selectedPoint && (
      <ChartPopup
        data={{
          title: selectedPoint.name,
          values: selectedPoint.values,
          address: selectedPoint.address,
        }}
        onClose={() => setSelectedPoint(null)}
      />
    )}
  </div>
);
}

export default App;