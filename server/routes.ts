import type { Express } from "express";
import { createServer, type Server } from "http";

interface WeatherResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

interface UVResponse {
  lat: number;
  lon: number;
  date_iso: string;
  date: number;
  value: number;
}

// Geocoding function to get coordinates from city name
async function getCityCoordinates(cityName: string) {
  try {
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
    const response = await fetch(geocodeUrl);
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error('City not found');
    }
    
    const result = data.results[0];
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      city: result.name,
      country: result.country_code?.toUpperCase() || result.country || 'N/A'
    };
  } catch (error) {
    throw new Error(`Failed to get coordinates for ${cityName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Convert weather code to icon
function getWeatherIcon(weatherCode: number, isDay: boolean): string {
  const iconMap: { [key: number]: { day: string, night: string } } = {
    0: { day: '01d', night: '01n' }, // Clear sky
    1: { day: '01d', night: '01n' }, // Mainly clear
    2: { day: '02d', night: '02n' }, // Partly cloudy
    3: { day: '03d', night: '03n' }, // Overcast
    45: { day: '50d', night: '50n' }, // Fog
    48: { day: '50d', night: '50n' }, // Depositing rime fog
    51: { day: '09d', night: '09n' }, // Light drizzle
    53: { day: '09d', night: '09n' }, // Moderate drizzle
    55: { day: '09d', night: '09n' }, // Dense drizzle
    61: { day: '10d', night: '10n' }, // Slight rain
    63: { day: '10d', night: '10n' }, // Moderate rain
    65: { day: '10d', night: '10n' }, // Heavy rain
    71: { day: '13d', night: '13n' }, // Slight snow
    73: { day: '13d', night: '13n' }, // Moderate snow
    75: { day: '13d', night: '13n' }, // Heavy snow
    95: { day: '11d', night: '11n' }, // Thunderstorm
    96: { day: '11d', night: '11n' }, // Thunderstorm with slight hail
    99: { day: '11d', night: '11n' }, // Thunderstorm with heavy hail
  };
  
  const icons = iconMap[weatherCode] || { day: '01d', night: '01n' };
  return isDay ? icons.day : icons.night;
}

// Get weather description from code
function getWeatherDescription(weatherCode: number): string {
  const descriptions: { [key: number]: string } = {
    0: 'clear sky',
    1: 'mainly clear',
    2: 'partly cloudy',
    3: 'overcast',
    45: 'fog',
    48: 'depositing rime fog',
    51: 'light drizzle',
    53: 'moderate drizzle',
    55: 'dense drizzle',
    61: 'slight rain',
    63: 'moderate rain',
    65: 'heavy rain',
    71: 'slight snow fall',
    73: 'moderate snow fall',
    75: 'heavy snow fall',
    95: 'thunderstorm',
    96: 'thunderstorm with slight hail',
    99: 'thunderstorm with heavy hail',
  };
  
  return descriptions[weatherCode] || 'unknown';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Weather endpoint using Open-Meteo API (no API key required)
  app.get("/api/weather", async (req, res) => {
    try {
      const { city, lat, lon } = req.query;
      
      let latitude: number;
      let longitude: number;
      let cityName: string;
      let countryCode: string;
      
      if (city) {
        // Get coordinates from city name
        const geoData = await getCityCoordinates(city as string);
        latitude = geoData.latitude;
        longitude = geoData.longitude;
        cityName = geoData.city;
        countryCode = geoData.country;
      } else if (lat && lon) {
        // Use provided coordinates
        latitude = parseFloat(lat as string);
        longitude = parseFloat(lon as string);
        cityName = 'Current Location';
        countryCode = 'N/A';
      } else {
        return res.status(400).json({ message: "Either city name or coordinates (lat, lon) are required" });
      }

      // Fetch weather data from Open-Meteo
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&daily=sunrise,sunset,uv_index_max&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`;
      
      const weatherResponse = await fetch(weatherUrl);
      
      if (!weatherResponse.ok) {
        throw new Error(`Weather API error: ${weatherResponse.status} ${weatherResponse.statusText}`);
      }

      const weatherData = await weatherResponse.json();
      const current = weatherData.current;
      const daily = weatherData.daily;

      // Format time strings
      const formatTime = (timeString: string) => {
        const date = new Date(timeString);
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      };

      // Calculate visibility (Open-Meteo doesn't provide this directly, so we estimate based on weather conditions)
      const getVisibility = (weatherCode: number, humidity: number) => {
        if (weatherCode >= 45 && weatherCode <= 48) return 2; // Fog
        if (weatherCode >= 51 && weatherCode <= 65) return 5; // Rain/drizzle
        if (weatherCode >= 71 && weatherCode <= 75) return 3; // Snow
        if (humidity > 80) return 8;
        return 10; // Clear conditions
      };

      // Calculate dew point
      const calculateDewPoint = (temp: number, humidity: number) => {
        const a = 17.27;
        const b = 237.7;
        const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
        return (b * alpha) / (a - alpha);
      };

      const response = {
        city: cityName,
        country: countryCode,
        temperature: Math.round(current.temperature_2m),
        description: getWeatherDescription(current.weather_code),
        icon: getWeatherIcon(current.weather_code, current.is_day === 1),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        pressure: Math.round(current.pressure_msl),
        visibility: getVisibility(current.weather_code, current.relative_humidity_2m),
        uvIndex: Math.round(daily.uv_index_max[0] || 0),
        sunrise: formatTime(daily.sunrise[0]),
        sunset: formatTime(daily.sunset[0]),
        cloudCover: current.cloud_cover,
        dewPoint: Math.round(calculateDewPoint(current.temperature_2m, current.relative_humidity_2m)),
      };

      res.json(response);
    } catch (error) {
      console.error("Weather API error:", error);
      
      if (error instanceof Error && error.message.includes('City not found')) {
        res.status(404).json({ message: "City not found. Please check the spelling and try again." });
      } else {
        res.status(500).json({ 
          message: error instanceof Error ? error.message : "Failed to fetch weather data" 
        });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
