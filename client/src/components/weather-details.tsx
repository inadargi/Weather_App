import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Gauge, 
  Eye, 
  Sun, 
  Sunrise,
  Sunset,
  Cloud,
  Waves
} from 'lucide-react';

interface WeatherDetails {
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

interface WeatherDetailsProps {
  details: WeatherDetails;
}

export function WeatherDetails({ details }: WeatherDetailsProps) {
  const detailCards = [
    {
      icon: <Thermometer className="h-8 w-8 text-green-500" />,
      label: 'FEELS LIKE',
      value: `${Math.round(details.feelsLike)}°F`,
    },
    {
      icon: <Droplets className="h-8 w-8 text-blue-500" />,
      label: 'HUMIDITY',
      value: `${details.humidity}%`,
    },
    {
      icon: <Wind className="h-8 w-8 text-gray-500" />,
      label: 'WIND SPEED',
      value: `${details.windSpeed} mph`,
    },
    {
      icon: <Gauge className="h-8 w-8 text-orange-500" />,
      label: 'PRESSURE',
      value: `${details.pressure} hPa`,
    },
    {
      icon: <Eye className="h-8 w-8 text-purple-500" />,
      label: 'VISIBILITY',
      value: `${details.visibility} km`,
    },
    {
      icon: <Sun className="h-8 w-8 text-yellow-500" />,
      label: 'UV INDEX',
      value: details.uvIndex.toString(),
    },
  ];

  const additionalInfo = [
    {
      label: 'Sunrise',
      value: details.sunrise,
    },
    {
      label: 'Sunset',
      value: details.sunset,
    },
    {
      label: 'Cloud Cover',
      value: `${details.cloudCover}%`,
    },
    {
      label: 'Dew Point',
      value: `${Math.round(details.dewPoint)}°F`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Weather Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {detailCards.map((card, index) => (
          <Card key={index} className="shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-3">
                {card.icon}
              </div>
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                {card.label}
              </h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Information */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-blue-600" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {additionalInfo.map((info, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span className="text-gray-600 dark:text-gray-400">{info.label}</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {info.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
