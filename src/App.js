import React, { useEffect, useRef, useState, useCallback } from 'react';
import ChartPopup from './components/ChartPopup';
import { initialPoints } from './data/points';
import styles from './styles/App.module.css';

function App() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [points, setPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const apiLoaded = useRef(false);

  const MAPS_API_KEY = process.env.REACT_APP_YANDEX_MAPS_API_KEY;

  // Создание маркера
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
    dot.style.background = '#205581';
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
      setSelectedPoint({
        name: point.name,
        address: point.address,
        values: point.values,
      });
    });

    container.title = `${point.name}\n⭐ Рейтинг: ${point.rating}`;

    return container;
  };

  // Инициализация карты
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

    const featuresLayer = new YMapDefaultFeaturesLayer({ 
      title: 'Markers Layer' 
    });
    mapInstance.current.addChild(featuresLayer);

    console.log('✅ Карта создана');

    setPoints(initialPoints);

    initialPoints.forEach(point => {
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

    console.log(`✅ Добавлено ${initialPoints.length} точек`);
  }, []);

  // Загрузка API
  useEffect(() => {
    if (apiLoaded.current || window.ymaps3) {
      if (window.ymaps3 && !mapInstance.current) {
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

  // Создаём карту, когда API готово
  useEffect(() => {
    if (isMapReady && !mapInstance.current) {
      createMap();
    }
  }, [isMapReady, createMap]);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1> Яндекс Карты <span>& Показатели защищенности</span></h1>
        <div className={styles.headerBadge}>
          <span className={styles.dot}></span>
          {points.length} объектов
        </div>
      </header>

      <div className={styles.mapWrapper}>
        <div ref={mapRef} className={styles.mapContainer} />
      </div>

      <div className={styles.hint}>
        <span className={styles.hintItem}>
          <span className={styles.icon}></span> 
        </span>
        <span className={styles.hintItem}>
          <span className={styles.icon}></span>
        </span>
        <span className={styles.hintItem}>
          <span className={styles.icon}></span>
        </span>
      </div>

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