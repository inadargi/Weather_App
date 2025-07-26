import { Card, CardContent } from '@/components/ui/card';
import { Sun, Cloud, CloudRain, CloudSnow, Zap, MapPin } from 'lucide-react';

interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  description: string;
  icon: string;
  date: string;
}

interface WeatherCardProps {
  weatherData: WeatherData;
}

const getWeatherIcon = (iconCode: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    '01d': <Sun className="h-16 w-16 text-yellow-400" />,
    '01n': <Sun className="h-16 w-16 text-yellow-300" />,
    '02d': <Cloud className="h-16 w-16 text-gray-300" />,
    '02n': <Cloud className="h-16 w-16 text-gray-400" />,
    '03d': <Cloud className="h-16 w-16 text-gray-400" />,
    '03n': <Cloud className="h-16 w-16 text-gray-500" />,
    '04d': <Cloud className="h-16 w-16 text-gray-500" />,
    '04n': <Cloud className="h-16 w-16 text-gray-600" />,
    '09d': <CloudRain className="h-16 w-16 text-blue-400" />,
    '09n': <CloudRain className="h-16 w-16 text-blue-500" />,
    '10d': <CloudRain className="h-16 w-16 text-blue-400" />,
    '10n': <CloudRain className="h-16 w-16 text-blue-500" />,
    '11d': <Zap className="h-16 w-16 text-yellow-400" />,
    '11n': <Zap className="h-16 w-16 text-yellow-500" />,
    '13d': <CloudSnow className="h-16 w-16 text-blue-200" />,
    '13n': <CloudSnow className="h-16 w-16 text-blue-300" />,
  };

  return iconMap[iconCode] || <Sun className="h-16 w-16 text-yellow-400" />;
};

export function WeatherCard({ weatherData }: WeatherCardProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg border-0">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Location and Date */}
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <h2 className="text-3xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2">
              <MapPin className="h-6 w-6" />
              {weatherData.city}, {weatherData.country}
            </h2>
            <p className="text-blue-100 text-lg">
              {weatherData.date}
            </p>
          </div>

          {/* Weather Icon and Temperature */}
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              {getWeatherIcon(weatherData.icon)}
            </div>
            <div className="text-5xl font-bold mb-2">
              {Math.round(weatherData.temperature)}°F
            </div>
            <p className="text-blue-100 text-xl capitalize">
              {weatherData.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
