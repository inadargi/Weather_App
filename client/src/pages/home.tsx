import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchSection } from '@/components/search-section';
import { WeatherCard } from '@/components/weather-card';
import { WeatherDetails } from '@/components/weather-details';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle, CloudSun } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WeatherResponse {
  city: string;
  country: string;
  temperature: number;
  description: string;
  icon: string;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  cloudCover: number;
  dewPoint: number;
}

export default function Home() {
  const [searchParams, setSearchParams] = useState<{
    city?: string;
    lat?: number;
    lon?: number;
  } | null>(null);
  
  const { toast } = useToast();

  const { data: weatherData, isLoading, error } = useQuery<WeatherResponse>({
    queryKey: ['weather', searchParams],
    queryFn: async () => {
      if (!searchParams) throw new Error('No search parameters');
      
      const params = new URLSearchParams();
      if (searchParams.city) {
        params.append('city', searchParams.city);
      } else if (searchParams.lat && searchParams.lon) {
        params.append('lat', searchParams.lat.toString());
        params.append('lon', searchParams.lon.toString());
      }
      
      const response = await fetch(`/api/weather?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch weather data: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!searchParams,
  });

  const handleCitySearch = (city: string) => {
    setSearchParams({ city });
  };

  const handleLocationSearch = (lat: number, lon: number) => {
    setSearchParams({ lat, lon });
  };

  // Show error toast when there's an error
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch weather data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center justify-center gap-3">
            <CloudSun className="h-12 w-12 text-orange-500" />
            Weather App
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Get real-time weather information for any city worldwide
          </p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Search Section */}
          <div className="lg:col-span-1">
            <SearchSection 
              onSearch={handleCitySearch}
              onLocationSearch={handleLocationSearch}
              isLoading={isLoading}
            />
          </div>

          {/* Weather Display Section */}
          <div className="lg:col-span-2">
            
            {/* Loading State */}
            {isLoading && (
              <Card className="shadow-lg mb-6">
                <CardContent className="p-8">
                  <div className="text-center">
                    <Loader2 className="h-16 w-16 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      Fetching weather data...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <Card className="shadow-lg mb-6 border-red-200 dark:border-red-800">
                <CardContent className="p-8">
                  <div className="text-center">
                    <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">
                      Unable to fetch weather data
                    </h3>
                    <p className="text-red-600 dark:text-red-500">
                      Please check the city name and try again, or check your internet connection.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weather Data Display */}
            {weatherData && !isLoading && (
              <div className="space-y-6">
                {/* Main Weather Card */}
                <WeatherCard 
                  weatherData={{
                    ...weatherData,
                    date: getCurrentDate(),
                  }}
                />

                {/* Weather Details */}
                <WeatherDetails 
                  details={{
                    feelsLike: weatherData.feelsLike,
                    humidity: weatherData.humidity,
                    windSpeed: weatherData.windSpeed,
                    pressure: weatherData.pressure,
                    visibility: weatherData.visibility,
                    uvIndex: weatherData.uvIndex,
                    sunrise: weatherData.sunrise,
                    sunset: weatherData.sunset,
                    cloudCover: weatherData.cloudCover,
                    dewPoint: weatherData.dewPoint,
                  }}
                />
              </div>
            )}

            {/* Default State */}
            {!searchParams && !isLoading && (
              <Card className="shadow-lg">
                <CardContent className="p-8">
                  <div className="text-center">
                    <CloudSun className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      Welcome to Weather App
                    </h3>
                    <p className="text-gray-500 dark:text-gray-500">
                      Search for a city or use your current location to get started.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            Weather data provided by OpenWeatherMap API
            <span className="mx-2">❤️</span>
            Built with React
          </p>
        </footer>
      </div>

      {/* Theme Toggle */}
      <ThemeToggle />
    </div>
  );
}
