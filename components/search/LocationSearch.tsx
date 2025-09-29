"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Search, Star, Clock, Navigation, Filter } from "lucide-react";
import {
  GeolocationService,
  type SearchFilters,
  type SalonWithDistance,
} from "@/lib/geolocation-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface LocationSearchProps {
  onSalonsFound?: (salons: SalonWithDistance[]) => void;
  initialFilters?: Partial<SearchFilters>;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onSalonsFound,
  initialFilters = {},
}) => {
  const [loading, setLoading] = useState(false);
  const [salons, setSalons] = useState<SalonWithDistance[]>([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    radius: 10,
    sortBy: "distance",
    sortOrder: "asc",
    ...initialFilters,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get user's current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await GeolocationService.getCurrentLocation();
      setUserLocation({ lat: location.latitude, lng: location.longitude });
      setFilters((prev) => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
      toast({
        title: "Location found",
        description: "Using your current location for search",
      });
    } catch (error) {
      console.error("Error getting location:", error);
      toast({
        title: "Location access denied",
        description: "Please enter an address to search",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSearch = async (address: string) => {
    if (!address.trim()) return;

    try {
      setLoading(true);
      const response = await fetch("/api/geocoding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (data.success) {
        const { latitude, longitude } = data.data.coordinates;
        setUserLocation({ lat: latitude, lng: longitude });
        setFilters((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));
        toast({
          title: "Address found",
          description: `Searching near ${address}`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      toast({
        title: "Address not found",
        description: "Please try a different address",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchSalons = async () => {
    if (!filters.latitude || !filters.longitude) {
      toast({
        title: "Location required",
        description: "Please allow location access or enter an address",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/search/salons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });

      const data = await response.json();

      if (data.success) {
        setSalons(data.data.salons);
        onSalonsFound?.(data.data.salons);
        toast({
          title: "Search complete",
          description: `Found ${data.data.salons.length} salons nearby`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error searching salons:", error);
      toast({
        title: "Search failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const FilterDialog = () => (
    <Dialog open={showFilters} onOpenChange={setShowFilters}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search Filters
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Radius */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Search Radius: {filters.radius}km
            </label>
            <Slider
              value={[filters.radius || 10]}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, radius: value[0] }))
              }
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          {/* Service Category */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Service Category
            </label>
            <Select
              value={filters.serviceCategory || ""}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  serviceCategory: value || undefined,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                <SelectItem value="haircut">Haircut</SelectItem>
                <SelectItem value="coloring">Hair Coloring</SelectItem>
                <SelectItem value="styling">Hair Styling</SelectItem>
                <SelectItem value="nails">Nails</SelectItem>
                <SelectItem value="facial">Facial</SelectItem>
                <SelectItem value="massage">Massage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Price Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min ($)"
                value={filters.priceRange?.min || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceRange: {
                      ...prev.priceRange,
                      min: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    },
                  }))
                }
              />
              <Input
                type="number"
                placeholder="Max ($)"
                value={filters.priceRange?.max || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceRange: {
                      ...prev.priceRange,
                      max: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    },
                  }))
                }
              />
            </div>
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Minimum Rating: {filters.rating || 0} stars
            </label>
            <Slider
              value={[filters.rating || 0]}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, rating: value[0] }))
              }
              max={5}
              min={0}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Sort Options */}
          <div>
            <label className="text-sm font-medium mb-2 block">Sort By</label>
            <Select
              value={filters.sortBy || "distance"}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, sortBy: value as any }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="popularity">Popularity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Verified Only */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verified"
              checked={filters.rating === 4.5} // Mock verified filter
              onCheckedChange={(checked) =>
                setFilters((prev) => ({
                  ...prev,
                  rating: checked ? 4.5 : undefined,
                }))
              }
            />
            <label htmlFor="verified" className="text-sm font-medium">
              Verified salons only
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowFilters(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                searchSalons();
                setShowFilters(false);
              }}
              className="flex-1"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const SalonCard = ({ salon }: { salon: SalonWithDistance }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{salon.businessName}</CardTitle>
          {salon.isVerified && (
            <Badge variant="secondary" className="text-xs">
              Verified
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{salon.distance.toFixed(1)}km away</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>
              {salon.rating.toFixed(1)} ({salon.reviewCount})
            </span>
          </div>
          <Badge variant="outline">{salon.priceRange}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {salon.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="text-sm">
            <span className="font-medium">Address: </span>
            {salon.address.street}, {salon.address.city}, {salon.address.state}
          </div>

          {salon.services.length > 0 && (
            <div className="text-sm">
              <span className="font-medium">Services: </span>
              <span className="text-muted-foreground">
                {salon.services
                  .slice(0, 3)
                  .map((s) => s.name)
                  .join(", ")}
                {salon.services.length > 3 &&
                  ` +${salon.services.length - 3} more`}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span className={salon.isOpen ? "text-green-600" : "text-red-600"}>
              {salon.isOpen ? "Open Now" : "Closed"}
            </span>
          </div>

          <Button size="sm">View Details</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Find Nearby Salons
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Address Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={searchInputRef}
                placeholder="Enter address or city..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddressSearch(e.currentTarget.value);
                  }
                }}
              />
            </div>
            <Button
              onClick={() =>
                handleAddressSearch(searchInputRef.current?.value || "")
              }
              disabled={loading}
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={getCurrentLocation}
              disabled={loading}
            >
              <Navigation className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              onClick={searchSalons}
              disabled={loading || !userLocation}
              className="flex-1"
            >
              {loading ? "Searching..." : "Search Salons"}
            </Button>
            <Button variant="outline" onClick={() => setShowFilters(true)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Current Location Display */}
          {userLocation && (
            <div className="text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 inline mr-1" />
              Searching within {filters.radius}km of your location
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {salons.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Found {salons.length} salon{salons.length !== 1 ? "s" : ""}
            </h3>
            <div className="text-sm text-muted-foreground">
              Sorted by {filters.sortBy}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {salons.map((salon) => (
              <SalonCard key={salon._id} salon={salon} />
            ))}
          </div>
        </div>
      )}

      <FilterDialog />
    </div>
  );
};
