"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ui/service-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AirbnbHeader } from "@/components/nav/airbnb-header";
import { BottomNav } from "@/components/nav/bottom-nav";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  X,
  ChevronDown,
  Star,
  Calendar,
  Users,
  Filter,
  Map,
  List,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const venues = [
  {
    id: "1",
    name: "Serenity Wellness Spa",
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop&crop=center",
    rating: 4.9,
    reviewCount: 186,
    location: "Connaught Place, Delhi",
    services: [
      "Deep Tissue Massage",
      "Hot Stone",
      "Aromatherapy",
      "Reflexology",
    ],
    priceRange: "₹₹₹",
    isOpen: true,
  },
  {
    id: "2",
    name: "Zen Beauty Lounge",
    image:
      "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400&h=400&fit=crop&crop=center",
    rating: 4.8,
    reviewCount: 234,
    location: "Bandra West, Mumbai",
    services: ["Facial Treatment", "Hair Spa", "Manicure", "Pedicure"],
    priceRange: "₹₹₹₹",
    isOpen: true,
  },
  {
    id: "3",
    name: "Natural Glow Studio",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center",
    rating: 4.7,
    reviewCount: 156,
    location: "Koramangala, Bangalore",
    services: ["Organic Facial", "Natural Hair Care", "Wellness Therapy"],
    priceRange: "₹₹",
    isOpen: true,
  },
  {
    id: "4",
    name: "Tranquil Mind & Body",
    image:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=400&fit=crop&crop=center",
    rating: 4.8,
    reviewCount: 198,
    location: "Cyber City, Gurgaon",
    services: ["Swedish Massage", "Couples Therapy", "Meditation"],
    priceRange: "₹₹₹",
    isOpen: false,
  },
  {
    id: "5",
    name: "Pure Essence Spa",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center",
    rating: 4.9,
    reviewCount: 267,
    location: "Jubilee Hills, Hyderabad",
    services: ["Ayurvedic Treatment", "Herbal Therapy", "Detox"],
    priceRange: "₹₹₹₹",
    isOpen: true,
  },
  {
    id: "6",
    name: "Harmony Beauty Center",
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop&crop=center",
    rating: 4.6,
    reviewCount: 142,
    location: "Park Street, Kolkata",
    services: ["Hair Care", "Skin Treatment", "Nail Care"],
    priceRange: "₹₹",
    isOpen: true,
  },
  {
    id: "7",
    name: "Bliss Wellness Retreat",
    image:
      "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=400&fit=crop&crop=center",
    rating: 4.9,
    reviewCount: 321,
    location: "Vasant Kunj, Delhi",
    services: ["Hot Stone Massage", "Couples Spa", "Reflexology"],
    priceRange: "₹₹₹₹",
    isOpen: true,
  },
  {
    id: "8",
    name: "Urban Oasis Spa",
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=400&fit=crop&crop=center",
    rating: 4.7,
    reviewCount: 189,
    location: "Whitefield, Bangalore",
    services: ["Aromatherapy", "Thai Massage", "Facial"],
    priceRange: "₹₹₹",
    isOpen: true,
  },
];

const quickFilters = [
  { id: "instant", label: "Instant Book", icon: "⚡" },
  { id: "superhost", label: "Superhost", icon: "⭐" },
  { id: "wheelchair", label: "Accessible", icon: "♿" },
];

const priceFilters = [
  { id: "budget", label: "₹ Budget", range: "Under ₹2,000" },
  { id: "mid", label: "₹₹ Moderate", range: "₹2,000 - ₹5,000" },
  { id: "luxury", label: "₹₹₹ Luxury", range: "₹5,000 - ₹10,000" },
  { id: "premium", label: "₹₹₹₹ Premium", range: "Over ₹10,000" },
];

export default function SalonsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const toggleFilter = (filterId: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId],
    );
  };

  const clearAllFilters = () => {
    setSelectedFilters([]);
    setSelectedPriceFilter("");
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedFilters.length > 0 || selectedPriceFilter || searchQuery;

  const filteredVenues = venues.filter((venue) => {
    if (
      searchQuery &&
      !venue.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !venue.services.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase()),
      ) &&
      !venue.location.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <AirbnbHeader />

      {/* Mobile Filters Bottom Sheet */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[80vh] overflow-y-auto animate-slide-in-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-700">Filters</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Filter content */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Quick filters
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {quickFilters.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => toggleFilter(filter.id)}
                        className={cn(
                          "px-4 py-2 rounded-full border transition-all text-sm font-medium",
                          selectedFilters.includes(filter.id)
                            ? "bg-gray-700 text-white border-gray-700"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50",
                        )}
                      >
                        {filter.icon} {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Price range
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {priceFilters.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() =>
                          setSelectedPriceFilter(
                            filter.id === selectedPriceFilter ? "" : filter.id,
                          )
                        }
                        className={cn(
                          "p-4 rounded-lg border text-left transition-all",
                          selectedPriceFilter === filter.id
                            ? "bg-gray-700 text-white border-gray-700"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50",
                        )}
                      >
                        <div className="font-semibold">{filter.label}</div>
                        <div className="text-sm opacity-70">{filter.range}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="flex-1 rounded-lg"
                >
                  Clear all
                </Button>
                <Button
                  variant="coral"
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 rounded-lg"
                >
                  Show {filteredVenues.length} places
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        {/* Search and Filters Bar */}
        <div className="flex items-center gap-4 mb-6">
          {/* Desktop Filters */}
          <div className="hidden lg:flex items-center gap-3 flex-1">
            {quickFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={cn(
                  "px-4 py-2 rounded-full border transition-colors whitespace-nowrap",
                  selectedFilters.includes(filter.id)
                    ? "bg-gray-700 text-white border-gray-700"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400",
                )}
              >
                {filter.icon} {filter.label}
              </button>
            ))}

            {priceFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() =>
                  setSelectedPriceFilter(
                    filter.id === selectedPriceFilter ? "" : filter.id,
                  )
                }
                className={cn(
                  "px-4 py-2 rounded-full border transition-colors whitespace-nowrap",
                  selectedPriceFilter === filter.id
                    ? "bg-gray-700 text-white border-gray-700"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Mobile Filters Button */}
          <Button
            variant="outline"
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden rounded-full"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          {/* View Toggle */}
          <div className="hidden lg:flex border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-3 py-1 rounded text-sm transition-colors",
                viewMode === "list"
                  ? "bg-gray-700 text-white"
                  : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={cn(
                "px-3 py-1 rounded text-sm transition-colors",
                viewMode === "map"
                  ? "bg-gray-700 text-white"
                  : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <Map className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-600">Active filters:</span>
            {selectedFilters.map((filterId) => {
              const filter = quickFilters.find((f) => f.id === filterId);
              return filter ? (
                <Badge
                  key={filterId}
                  variant="secondary"
                  className="bg-gray-100"
                >
                  {filter.label}
                  <button
                    onClick={() => toggleFilter(filterId)}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}
            {selectedPriceFilter && (
              <Badge variant="secondary" className="bg-gray-100">
                {priceFilters.find((f) => f.id === selectedPriceFilter)?.label}
                <button
                  onClick={() => setSelectedPriceFilter("")}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-sm text-gray-600">
            {filteredVenues.length} stays in selected area
          </h1>
        </div>

        {/* Venue Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {filteredVenues.map((venue) => (
            <ServiceCard key={venue.id} {...venue} />
          ))}
        </div>

        {/* Load More */}
        {filteredVenues.length >= 8 && (
          <div className="text-center">
            <Button variant="outline" size="lg" className="rounded-lg">
              Show more
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab="explore" />
    </div>
  );
}
