"use client"
import { useState } from "react";
import { Search, MapPin, Crosshair, Loader } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { LocationService } from "@/utils/location";
import { useRouter } from "next/navigation";
import type { Route } from "next";

interface SearchBarProps {
  className?: string;
  onSearch?: (location: string, service: string) => void;
}

export function SearchBar({ className = "", onSearch }: SearchBarProps) {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [service, setService] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const locationData = await LocationService.getCurrentLocation();
      setLocation(locationData.city || "Current Location");
    } catch (error) {
      console.error("Failed to get location:", error);
      setLocation("Mumbai, Delhi, Bangalore");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(location, service);
    } else {
      const params = new URLSearchParams();
      if (location) params.set("location", location);
      if (service) params.set("service", service);
      router.push((`/salons?${params.toString()}` as Route));
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-col sm:flex-row gap-0 bg-white/95 backdrop-blur-md rounded-full p-1 sophisticated-shadow border border-sage-200 shadow-xl">
        <div className="flex-1 flex items-center gap-3 px-6 py-4">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Your location"
            className="border-0 bg-transparent placeholder:text-muted-foreground text-foreground focus-visible:ring-0 p-0 font-body"
          />
          <button
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Use current location"
          >
            {isGettingLocation ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="hidden sm:block w-px bg-border my-2"></div>
        <div className="flex-1 flex items-center gap-3 px-6 py-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={service}
            onChange={(e) => setService(e.target.value)}
            placeholder="Service or treatment"
            className="border-0 bg-transparent placeholder:text-muted-foreground text-foreground focus-visible:ring-0 p-0 font-body"
          />
        </div>
        <div className="flex items-center justify-center p-1">
          <Button
            size="lg"
            onClick={handleSearch}
            className="bg-cta text-cta-foreground rounded-full px-8 py-3 hover:bg-cta/90 transition-all font-heading text-sm h-12 flex items-center justify-center"
          >
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}
