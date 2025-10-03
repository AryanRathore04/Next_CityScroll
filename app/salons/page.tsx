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
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Vendor {
  _id: string;
  businessName: string;
  businessType?: string;
  businessAddress?: {
    city?: string;
    state?: string;
  };
  rating?: number;
  totalBookings?: number;
  profileImage?: string;
  description?: string;
}

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
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/search/salons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: 50,
          sortBy: "rating",
          sortOrder: "desc",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setVendors(result.data?.salons || []);
      }
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredVenues = vendors.filter((venue) => {
    if (
      searchQuery &&
      !venue.businessName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !venue.businessAddress?.city
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
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
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-coral-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading salons...</p>
            </div>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No salons found</p>
            <Button variant="coral" onClick={clearAllFilters} className="mt-4">
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {filteredVenues.map((venue) => (
              <ServiceCard
                key={venue._id}
                id={venue._id}
                name={venue.businessName}
                image={
                  venue.profileImage ||
                  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop"
                }
                rating={venue.rating || 0}
                reviewCount={venue.totalBookings || 0}
                location={
                  venue.businessAddress?.city ||
                  venue.businessAddress?.state ||
                  "Location"
                }
                services={[venue.businessType || "Beauty & Wellness"]}
                priceRange="₹₹₹"
                isOpen={true}
              />
            ))}
          </div>
        )}

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
