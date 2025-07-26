import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MapPin, Clock } from 'lucide-react';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface SearchSectionProps {
  onSearch: (city: string) => void;
  onLocationSearch: (lat: number, lon: number) => void;
  isLoading: boolean;
}

export function SearchSection({ onSearch, onLocationSearch, isLoading }: SearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('recentSearches', []);
  const { latitude, longitude, getCurrentPosition, loading: locationLoading, error: locationError } = useGeolocation();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      addToRecentSearches(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const addToRecentSearches = (city: string) => {
    setRecentSearches(prev => {
      const updated = [city, ...prev.filter(item => item.toLowerCase() !== city.toLowerCase())];
      return updated.slice(0, 5); // Keep only last 5 searches
    });
  };

  const handleLocationSearch = async () => {
    getCurrentPosition();
  };

  // Handle geolocation result
  useEffect(() => {
    if (latitude && longitude) {
      onLocationSearch(latitude, longitude);
    }
  }, [latitude, longitude]);

  const handleRecentSearch = (city: string) => {
    onSearch(city);
    addToRecentSearches(city);
  };

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Search className="h-5 w-5 text-blue-600" />
            Search City
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter city name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 border-2 focus:border-blue-500 rounded-xl"
              disabled={isLoading}
            />
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Current Location Button */}
          <Button
            onClick={handleLocationSearch}
            disabled={locationLoading || isLoading}
            variant="outline"
            className="w-full rounded-xl py-3"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {locationLoading ? 'Getting Location...' : 'Use Current Location'}
          </Button>

          {locationError && (
            <p className="text-sm text-red-500 text-center">{locationError}</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-gray-500" />
              Recent Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSearches.map((city, index) => (
                <Button
                  key={index}
                  onClick={() => handleRecentSearch(city)}
                  variant="ghost"
                  className="w-full justify-start p-3 h-auto rounded-lg border border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  disabled={isLoading}
                >
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  {city}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
