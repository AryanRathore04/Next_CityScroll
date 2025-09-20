"use client";
import { useState } from "react";
import { Search, MapPin, Crosshair, Loader } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { LocationService } from "@/utils/location";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { cn } from "@/lib/utils";

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
      router.push(`/salons?${params.toString()}` as Route);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex flex-col sm:flex-row gap-0 bg-white/95 backdrop-blur-md rounded-full p-1 airbnb-shadow border border-gray-200 shadow-xl">
        <div className="flex-1 flex items-center gap-3 px-6 py-4">
          <MapPin className="h-4 w-4 text-gray-500" />
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Your location"
            className="border-0 bg-transparent placeholder:text-gray-400 text-gray-700 focus-visible:ring-0 p-0"
          />
          <button
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Use current location"
          >
            {isGettingLocation ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="hidden sm:block w-px bg-gray-300 my-2"></div>
        <div className="flex-1 flex items-center gap-3 px-6 py-4">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            value={service}
            onChange={(e) => setService(e.target.value)}
            placeholder="Service or treatment"
            className="border-0 bg-transparent placeholder:text-gray-400 text-gray-700 focus-visible:ring-0 p-0"
          />
        </div>
        <div className="flex items-center justify-center p-1">
          <Button
            size="lg"
            onClick={handleSearch}
            variant="coral"
            className="rounded-full px-8 py-3 transition-all font-semibold text-sm h-12 flex items-center justify-center"
          >
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}
