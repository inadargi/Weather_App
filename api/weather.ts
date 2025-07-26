// api/weather.ts

export default async function handler(req: any, res: any) {
  const { city, lat, lon } = req.query;

  // Geocoding
  const getCityCoordinates = async (cityName: string) => {
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
    const response = await fetch(geocodeUrl);

    if (!response.ok) throw new Error(`Geocoding failed: ${response.statusText}`);
    const data = await response.json();

    if (!data.results?.length) throw new Error("City not found");

    const result = data.results[0];
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      city: result.name,
      country: result.country_code?.toUpperCase() || result.country || "N/A",
    };
  };

  const getWeatherDescription = (code: number): string => {
    const map: Record<number, string> = {
      0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
      45: "fog", 48: "depositing rime fog",
      51: "light drizzle", 53: "moderate drizzle", 55: "dense drizzle",
      61: "slight rain", 63: "moderate rain", 65: "heavy rain",
      71: "slight snow", 73: "moderate snow", 75: "heavy snow",
      95: "thunderstorm", 96: "thunderstorm with slight hail", 99: "thunderstorm with heavy hail"
    };
    return map[code] || "unknown";
  };

  const getWeatherIcon = (code: number, isDay: boolean): string => {
    const iconMap: Record<number, { day: string; night: string }> = {
      0: { day: "01d", night: "01n" },
      1: { day: "01d", night: "01n" },
      2: { day: "02d", night: "02n" },
      3: { day: "03d", night: "03n" },
      45: { day: "50d", night: "50n" },
      48: { day: "50d", night: "50n" },
      51: { day: "09d", night: "09n" },
      53: { day: "09d", night: "09n" },
      55: { day: "09d", night: "09n" },
      61: { day: "10d", night: "10n" },
      63: { day: "10d", night: "10n" },
      65: { day: "10d", night: "10n" },
      71: { day: "13d", night: "13n" },
      73: { day: "13d", night: "13n" },
      75: { day: "13d", night: "13n" },
      95: { day: "11d", night: "11n" },
      96: { day: "11d", night: "11n" },
      99: { day: "11d", night: "11n" },
    };
    return (iconMap[code] || { day: "01d", night: "01n" })[isDay ? "day" : "night"];
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const getVisibility = (code: number, humidity: number) => {
    if ([45, 48].includes(code)) return 2;
    if (code >= 51 && code <= 65) return 5;
    if (code >= 71 && code <= 75) return 3;
    if (humidity > 80) return 8;
    return 10;
  };

  const dewPoint = (temp: number, humidity: number) => {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
    return (b * alpha) / (a - alpha);
  };

  try {
    let latitude: number, longitude: number, cityName: string, country: string;

    if (city) {
      const loc = await getCityCoordinates(city);
      latitude = loc.latitude;
      longitude = loc.longitude;
      cityName = loc.city;
      country = loc.country;
    } else if (lat && lon) {
      latitude = parseFloat(lat);
      longitude = parseFloat(lon);
      cityName = "Your Location";
      country = "N/A";
    } else {
      return res.status(400).json({ message: "Missing city or coordinates" });
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&daily=sunrise,sunset,uv_index_max&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`;
    const weatherRes = await fetch(url);

    if (!weatherRes.ok) throw new Error("Weather fetch failed");

    const data = await weatherRes.json();
    const current = data.current;
    const daily = data.daily;

    const result = {
      city: cityName,
      country,
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
      dewPoint: Math.round(dewPoint(current.temperature_2m, current.relative_humidity_2m)),
    };

    res.status(200).json(result);
  } catch (error: any) {
    res.status(error.message.includes("City not found") ? 404 : 500).json({
      message: error.message || "Unknown error occurred",
    });
  }
}
