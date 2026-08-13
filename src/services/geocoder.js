import axios from 'axios';

export const geocodeAddress = async (address, apiKey) => {
  try {
    const response = await axios.get(
      `https://geocode-maps.yandex.ru/1.x/`,
      {
        params: {
          apikey: apiKey,
          geocode: address,
          format: 'json',
          results: 1
        }
      }
    );

    const featureMember = response.data?.response?.GeoObjectCollection?.featureMember;
    
    if (!featureMember || featureMember.length === 0) {
      console.warn(`⚠️ Адрес не найден: "${address}"`);
      return null;
    }

    const geoObject = featureMember[0].GeoObject;
    const [lon, lat] = geoObject.Point.pos.split(' ').map(Number);
    const fullAddress = geoObject.name || address;

    return {
      address: fullAddress,
      coords: [lon, lat]
    };
  } catch (error) {
    console.error(`❌ Ошибка геокодинга для "${address}":`, error.message);
    return null;
  }
};

export const geocodeAddresses = async (addresses, apiKey, onProgress = null) => {
  const results = [];
  const total = addresses.length;

  for (let i = 0; i < total; i++) {
    const address = addresses[i];
    const result = await geocodeAddress(address, apiKey);
    
    if (result) {
      results.push({
        ...result,
        originalAddress: address
      });
    }

    if (onProgress) {
      onProgress(i + 1, total);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
};