import React, { useEffect, useRef } from 'react';

const YandexMap = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {

    const initMap = () => {
      if (window.ymaps3 && !mapInstance.current) {
        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = window.ymaps3;

        mapInstance.current = new YMap(mapRef.current, {
          location: {
            center: [27.6173, 25.7558],
            zoom: 10,
          },
        });

        mapInstance.current.addChild(new YMapDefaultSchemeLayer());
        mapInstance.current.addChild(new YMapDefaultFeaturesLayer());
      }
    };

    if (window.ymaps3) {
      initMap();
    } else {
      const checkAPI = setInterval(() => {
        if (window.ymaps3) {
          initMap();
          clearInterval(checkAPI);
        }
      }, 100);

      return () => clearInterval(checkAPI);
    }

    return () => {
      mapInstance.current?.destroy();
    };
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '200px' }} />;
};

export default YandexMap;