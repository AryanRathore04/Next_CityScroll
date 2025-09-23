"use client";
import { Star, MapPin, Clock, Heart } from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useState } from "react";

interface ServiceCardProps {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  location: string;
  services: string[];
  priceRange: string;
  isOpen?: boolean;
  className?: string;
  onClick?: () => void;
}

export function ServiceCard({
  id,
  name,
  image,
  rating,
  reviewCount,
  location,
  services,
  priceRange,
  isOpen = true,
  className,
  onClick,
}: ServiceCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-lg bg-white rounded-lg border border-gray-200 overflow-hidden",
        className,
      )}
      onClick={onClick || (() => router.push(`/salon/${id}` as Route))}
    >
      {/* Image Container - OYO style rectangular */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          priority={false}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Heart icon */}
        <button
          className={cn(
            "absolute top-3 right-3 p-1.5 rounded-md transition-all duration-200 bg-white/80 backdrop-blur-sm",
            isLiked ? "text-coral-500" : "text-gray-600 hover:text-coral-500",
          )}
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
        >
          <Heart
            className={cn("h-4 w-4", isLiked ? "fill-coral-500" : "fill-none")}
          />
        </button>

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-md",
              isOpen
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-red-100 text-red-700 border-red-200",
            )}
          >
            <Clock className="h-3 w-3 mr-1" />
            {isOpen ? "Open" : "Closed"}
          </Badge>
        </div>

        {/* Price badge */}
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-coral-500 text-white border-0 text-xs font-semibold px-2 py-1 rounded-md">
            {priceRange}
          </Badge>
        </div>
      </div>

      {/* Content - OYO style compact layout */}
      <div className="p-4 space-y-3">
        {/* Business Name - Prominent */}
        <h3 className="font-bold text-gray-800 line-clamp-1 text-lg leading-tight">
          {name}
        </h3>

        {/* Location & Rating - Inline OYO style */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="h-3 w-3 mr-1 text-gray-500" />
            <span className="line-clamp-1">{location}</span>
          </div>

          <div className="flex items-center gap-1 bg-coral-500 text-white px-2 py-1 rounded-md">
            <Star className="h-3 w-3 fill-white text-white" />
            <span className="text-xs font-bold">{rating}</span>
          </div>
        </div>

        {/* Services - Compact tags */}
        <div className="flex flex-wrap gap-1">
          {services.slice(0, 2).map((service, index) => (
            <span
              key={index}
              className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md font-medium"
            >
              {service}
            </span>
          ))}
          {services.length > 2 && (
            <span className="text-xs text-gray-500 font-medium">
              +{services.length - 2} more
            </span>
          )}
        </div>

        {/* Review count - OYO style */}
        <div className="text-xs text-gray-500">{reviewCount} reviews</div>

        {/* Book Button - Prominent OYO style */}
        <Button
          className="w-full mt-3 bg-coral-500 hover:bg-coral-600 text-white rounded-lg text-sm font-bold py-2.5 border-0 shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push("/booking" as Route);
          }}
        >
          Book Now
        </Button>
      </div>
    </div>
  );
}
