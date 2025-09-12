"use client"
import { Star, MapPin, Clock } from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Route } from "next";

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
  return (
    <div
      className={cn(
        "bg-card rounded-lg overflow-hidden sophisticated-shadow hover:card-shadow-hover",
        "transition-all duration-500 cursor-pointer group hover:scale-[1.02] border border-border",
        className,
      )}
      onClick={
        onClick || (() => router.push(`/salon/${id}` as Route))
      }
    >
      <div className="relative overflow-hidden">
        <Image
          src={image}
          alt={name}
          width={800}
          height={400}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-3 left-3">
          <Badge
            variant={isOpen ? "default" : "secondary"}
            className={cn(
              "bg-card/90 backdrop-blur-sm text-xs font-body px-2 py-1",
              isOpen ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Clock className="h-3 w-3 mr-1" />
            {isOpen ? "Open" : "Closed"}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge className="bg-card/90 backdrop-blur-sm text-foreground text-xs font-body px-2 py-1">
            {priceRange}
          </Badge>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-heading text-lg text-foreground line-clamp-1">
            {name}
          </h3>
          <div className="flex items-center gap-1 bg-secondary/30 px-2 py-1 rounded-full">
            <Star className="h-3 w-3 fill-secondary text-secondary" />
            <span className="text-xs font-body text-foreground">{rating}</span>
            <span className="text-xs text-muted-foreground">
              ({reviewCount})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <MapPin className="h-3 w-3" />
          <span className="text-sm line-clamp-1 font-body">{location}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {services.slice(0, 2).map((service, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs font-body bg-muted text-muted-foreground border-0"
            >
              {service}
            </Badge>
          ))}
          {services.length > 2 && (
            <Badge
              variant="outline"
              className="text-xs font-body border-border text-muted-foreground"
            >
              +{services.length - 2} more
            </Badge>
          )}
        </div>

        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-heading text-sm py-2 transition-colors"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push("/booking" as Route);
          }}
        >
          Book Appointment
        </Button>
      </div>
    </div>
  );
}
