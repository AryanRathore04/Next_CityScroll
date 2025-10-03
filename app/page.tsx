"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ServiceCard } from "@/components/ui/service-card";
import { BottomNav } from "@/components/nav/bottom-nav";
import { SimpleHeader } from "@/components/nav/simple-header";
import {
  Search,
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy load heavy components
const Calendar = lazy(() =>
  import("@/components/ui/calendar").then((module) => ({
    default: module.Calendar,
  })),
);

const categories = [
  { id: "hair", emoji: "✂️", label: "Hair Care", count: "12,000+ places" },
  { id: "spa", emoji: "🧘‍♀️", label: "Spa & Wellness", count: "8,500+ places" },
  { id: "massage", emoji: "💆‍♀️", label: "Massage", count: "15,000+ places" },
  { id: "beauty", emoji: "💄", label: "Beauty", count: "9,200+ places" },
  { id: "nails", emoji: "💅", label: "Nails", count: "6,800+ places" },
  { id: "wellness", emoji: "✨", label: "Wellness", count: "4,300+ places" },
];

interface FeaturedSalon {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  location: string;
  services: string[];
  priceRange: string;
  isOpen: boolean;
}

const experiences = [
  {
    id: "1",
    title: "Spa Day Experience",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop",
    description: "Full day wellness packages",
    price: "From ₹3,999",
  },
  {
    id: "2",
    title: "Bridal Beauty Package",
    image:
      "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&h=400&fit=crop",
    description: "Complete bridal makeover",
    price: "From ₹12,999",
  },
];

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedDuration, setSelectedDuration] = useState("");
  const [featuredSalons, setFeaturedSalons] = useState<FeaturedSalon[]>([]);
  const router = useRouter();

  useEffect(() => {
    const initializePage = async () => {
      try {
        // Fetch featured salons
        const response = await fetch("/api/search/salons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            limit: 12,
            sortBy: "rating",
            sortOrder: "desc",
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("API Response:", result);
          console.log("Salons array:", result.data?.salons);
          const salons: FeaturedSalon[] = (result.data?.salons || []).map(
            (vendor: any) => ({
              id: vendor._id,
              name: vendor.businessName,
              image:
                vendor.profileImage ||
                "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop",
              rating: vendor.rating || 4.5,
              reviewCount: vendor.totalBookings || 0,
              location: vendor.businessAddress?.city
                ? `${vendor.businessAddress.city}${
                    vendor.businessAddress.state
                      ? ", " + vendor.businessAddress.state
                      : ""
                  }`
                : "Location",
              services: [vendor.businessType || "Beauty & Wellness"],
              priceRange: "₹₹₹",
              isOpen: true,
            }),
          );
          console.log("Mapped salons:", salons);
          setFeaturedSalons(salons);
        }
      } catch (error) {
        console.error("Failed to fetch featured salons:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 bg-coral-500 rounded-xl mx-auto mb-4 animate-pulse">
            <span className="flex items-center justify-center h-full text-white font-bold text-lg">
              B
            </span>
          </div>
          <div className="text-gray-600">Loading your beauty experience...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header - Hidden on mobile */}
      <div className="hidden md:block">
        <SimpleHeader />
      </div>
      {/* Mobile-only Logo Header */}
      <div className="md:hidden bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-coral-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-xl font-bold text-gray-900">BeautyBook</span>
          </div>
        </div>
      </div>
      {/* OYO-style Hero Section */}
      <section className="bg-white py-4 md:py-8 md:bg-gradient-to-br md:from-coral-50 md:to-white">
        <div className="container mx-auto px-4">
          {/* Title - Larger on mobile to match OYO */}
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-2">
            Find salons & spas at best prices
          </h1>
          <p className="text-gray-600 mb-4 md:mb-6 hidden md:block">
            Book your perfect beauty experience today
          </p>

          {/* OYO-Style Search Card */}
          <div className="bg-white rounded-2xl md:rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Universal Search Field - Search by location OR salon name */}
            <div className="p-4 md:p-4 border-b border-gray-200">
              <label className="block text-xs md:text-sm font-medium text-gray-500 mb-2">
                Search Salons & Spas
              </label>
              <Input
                type="text"
                placeholder="Search by location, salon name, or area (e.g., 'Mumbai' or 'Lakme Salon')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const params = new URLSearchParams();
                    if (searchQuery.trim()) params.set("q", searchQuery.trim());
                    if (selectedService && selectedService !== "all")
                      params.set("service", selectedService);
                    if (preferredDate) params.set("date", preferredDate);
                    if (selectedDuration && selectedDuration !== "any")
                      params.set("duration", selectedDuration);
                    const queryString = params.toString();
                    const url = queryString
                      ? `/salons?${queryString}`
                      : "/salons";
                    router.push(url as Route);
                  }
                }}
                className="w-full h-10 md:h-12 px-0 text-lg md:text-base font-semibold border-0 bg-transparent focus:ring-0 placeholder:text-gray-600 placeholder:font-normal placeholder:opacity-60 focus:placeholder:opacity-0 placeholder:transition-opacity"
              />
              <p className="text-xs text-gray-400 mt-2 hidden md:block">
                💡 Tip: Just type and press Enter to search instantly
              </p>
            </div>

            {/* Date and Service Row - Optional Filters */}
            <div className="grid grid-cols-2 border-b border-gray-200">
              {/* Date Field */}
              <div className="p-4 md:p-4 border-r border-gray-200">
                <label className="block text-xs md:text-sm font-medium text-gray-500 mb-2">
                  Date <span className="text-gray-400">(Optional)</span>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full h-10 md:h-12 px-0 justify-start text-left text-base md:text-sm hover:bg-transparent border-0 transition-opacity"
                      style={{
                        fontWeight: selectedDate ? "600" : "400",
                        color: selectedDate ? "#111827" : "#6b7280",
                        opacity: selectedDate ? "1" : "0.7",
                      }}
                    >
                      {selectedDate
                        ? format(selectedDate, "dd MMM, yyyy")
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Suspense
                      fallback={<div className="p-4">Loading calendar...</div>}
                    >
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          if (date) {
                            setPreferredDate(format(date, "PPP"));
                          }
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </Suspense>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Service Field - Optional Filter */}
              <div className="p-4 md:p-4">
                <label className="block text-xs md:text-sm font-medium text-gray-500 mb-2">
                  Service <span className="text-gray-400">(Optional)</span>
                </label>
                <Select
                  value={selectedService}
                  onValueChange={setSelectedService}
                >
                  <SelectTrigger className="w-full h-10 md:h-12 px-0 border-0 hover:bg-transparent focus:ring-0 text-base md:text-sm [&>span]:text-gray-600 [&>span]:font-normal [&>span]:opacity-70 [&[data-state=open]>span]:opacity-100 [&>span[data-placeholder='false']]:text-gray-900 [&>span[data-placeholder='false']]:font-semibold [&>span[data-placeholder='false']]:opacity-100">
                    <SelectValue placeholder="Choose service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All services</SelectItem>
                    <SelectItem value="hair">Hair Care</SelectItem>
                    <SelectItem value="spa">Spa & Massage</SelectItem>
                    <SelectItem value="facial">Facial</SelectItem>
                    <SelectItem value="nails">Nails</SelectItem>
                    <SelectItem value="makeup">Makeup</SelectItem>
                    <SelectItem value="waxing">Waxing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration Field - Mobile only, optional filter */}
            <div className="p-4 md:p-4 border-b border-gray-200 md:hidden">
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Duration <span className="text-gray-400">(Optional)</span>
              </label>
              <Select
                value={selectedDuration}
                onValueChange={setSelectedDuration}
              >
                <SelectTrigger className="w-full h-10 px-0 border-0 hover:bg-transparent focus:ring-0 text-base [&>span]:text-gray-600 [&>span]:font-normal [&>span]:opacity-70 [&[data-state=open]>span]:opacity-100 [&>span[data-placeholder='false']]:text-gray-900 [&>span[data-placeholder='false']]:font-semibold [&>span[data-placeholder='false']]:opacity-100">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any duration</SelectItem>
                  <SelectItem value="30min">30 minutes</SelectItem>
                  <SelectItem value="1hour">1 hour</SelectItem>
                  <SelectItem value="1.5hours">1.5 hours</SelectItem>
                  <SelectItem value="2hours">2 hours</SelectItem>
                  <SelectItem value="3hours">3+ hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Button - Exactly like OYO */}
            <div className="p-3 md:p-4">
              <Button
                className="w-full h-14 md:h-14 bg-coral-500 hover:bg-coral-600 text-white text-base md:text-lg font-semibold rounded-lg md:rounded-xl shadow-md hover:shadow-lg transition-all"
                onClick={() => {
                  const params = new URLSearchParams();
                  // Primary search query (location or salon name)
                  if (searchQuery.trim()) params.set("q", searchQuery.trim());
                  // Optional filters
                  if (selectedService && selectedService !== "all")
                    params.set("service", selectedService);
                  if (preferredDate) params.set("date", preferredDate);
                  if (selectedDuration && selectedDuration !== "any")
                    params.set("duration", selectedDuration);

                  const queryString = params.toString();
                  const url = queryString
                    ? `/salons?${queryString}`
                    : "/salons";

                  router.push(url as Route);
                }}
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Explore Destinations - OYO Style */}
      <section className="py-4 md:py-6 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4\">
            Explore your next destination
          </h2>

          <div className="flex gap-4 md:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4\">
            {[
              {
                name: "Near me",
                icon: "📍",
                image:
                  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=120&h=120&fit=crop",
              },
              {
                name: "Bangalore",
                icon: "🏛️",
                image:
                  "https://images.unsplash.com/photo-1558431382-27e303142255?w=120&h=120&fit=crop",
              },
              {
                name: "Chennai",
                icon: "🕉️",
                image:
                  "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=120&h=120&fit=crop",
              },
              {
                name: "Delhi",
                icon: "🏛️",
                image:
                  "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=120&h=120&fit=crop",
              },
              {
                name: "Gurgaon",
                icon: "🏢",
                image:
                  "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=120&h=120&fit=crop",
              },
              {
                name: "Hyderabad",
                icon: "🏰",
                image:
                  "https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=120&h=120&fit=crop",
              },
            ].map((city) => (
              <button
                key={city.name}
                className="flex-shrink-0 flex flex-col items-center group"
                onClick={() => {
                  setSearchQuery(city.name);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden mb-2 shadow-sm border-2 border-white group-hover:border-coral-300 transition-all">
                  <Image
                    src={city.image}
                    alt={city.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-coral-600">
                  {city.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
      {/* Promotional Banners - OYO Style */}
      <section className="py-4">
        <div className="container mx-auto px-4 space-y-4">
          {/* First Banner - Premium Services */}
          <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-green-800 to-green-600">
            <div className="absolute inset-0 opacity-30">
              <Image
                src="https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&h=400&fit=crop"
                alt="Premium spa services"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            </div>
            <div className="relative p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 px-2 py-1 rounded text-sm font-medium">
                  🏆 Company-Serviced
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2">
                India's No. 1 Premium
                <br />
                Value Salons
              </h3>
              <ul className="text-sm space-y-1 mb-4">
                <li>• Assured Check-in</li>
                <li>• Spacious Clean Rooms</li>
                <li>• 1000+ New Properties</li>
              </ul>
              <div className="flex items-center justify-between">
                <Button className="bg-white text-green-800 hover:bg-gray-100 rounded-lg px-6 py-2 font-semibold">
                  Book now
                </Button>
                <div className="text-right">
                  <div className="text-sm opacity-90">Starting from</div>
                  <div className="text-2xl font-bold">₹999</div>
                </div>
              </div>
            </div>
          </div>

          {/* Second Banner - Monsoon Offer */}
          <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-blue-600 to-teal-500">
            <div className="absolute inset-0 opacity-40">
              <Image
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop"
                alt="Monsoon spa offer"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            </div>
            <div className="relative p-6 text-white">
              <h3 className="text-xl font-bold mb-2">
                Monsoon's here.
                <br />
                Where are you?
              </h3>
              <div className="flex items-center justify-between">
                <Button className="bg-white text-blue-600 hover:bg-gray-100 rounded-lg px-6 py-2 font-semibold">
                  Book now
                </Button>
                <div className="text-right">
                  <div className="text-sm opacity-90">Up to</div>
                  <div className="text-3xl font-bold">
                    75% <span className="text-lg">off</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Company-Serviced Section */}
      <section className="py-6 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Company-Serviced, It's different!
          </h2>

          <div className="flex gap-4 overflow-x-auto pb-4">
            {[
              {
                name: "Townhouse",
                subtitle: "Your friendly neighbourhood stay",
                price: "Starting ₹999",
                image:
                  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=200&fit=crop",
              },
              {
                name: "Sunday",
                subtitle: "Homegrown luxury hotel chain",
                price: "Starting ₹3999",
                image:
                  "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=300&h=200&fit=crop",
              },
              {
                name: "Palette",
                subtitle: "Hand-picked collection of premium hotels",
                price: "Starting ₹2499",
                image:
                  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop",
              },
              {
                name: "Clubhouse",
                subtitle: "Ultra-luxe hotels",
                price: "Starting ₹5999",
                image:
                  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=200&fit=crop",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="flex-shrink-0 w-48 bg-white rounded-lg overflow-hidden shadow-sm"
              >
                <div className="relative h-32">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 200px"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-xs text-gray-600 mb-2">{item.subtitle}</p>
                  <p className="text-sm font-semibold text-coral-600">
                    {item.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Categories Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Top categories for you
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  // Set the service in the search form
                  setSelectedService(category.label);
                  // Scroll back to search form
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="group p-3 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all text-left border border-gray-200 hover:border-coral-300"
              >
                <div className="text-3xl mb-2">{category.emoji}</div>
                <h3 className="font-bold text-gray-800 group-hover:text-coral-600 mb-1 text-sm">
                  {category.label}
                </h3>
                <p className="text-xs text-gray-500">{category.count}</p>
              </button>
            ))}
          </div>
        </div>
      </section>
      {/* Featured Places */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Featured in Delhi
            </h2>
            <button className="flex items-center gap-2 text-coral-500 hover:text-coral-600 transition-colors">
              <span className="text-sm font-semibold">See all</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {featuredSalons.slice(0, 4).map((salon) => (
              <ServiceCard key={salon.id} {...salon} />
            ))}
          </div>

          {/* Second Row */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Popular in Mumbai
            </h2>
            <button className="flex items-center gap-2 text-coral-500 hover:text-coral-600 transition-colors">
              <span className="text-sm font-semibold">See all</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredSalons.slice(4, 8).map((salon) => (
              <ServiceCard key={`second-${salon.id}`} {...salon} />
            ))}
          </div>

          {/* Third Row */}
          <div className="flex items-center justify-between mb-6 mt-8">
            <h2 className="text-xl font-bold text-gray-800">
              Trending around Bangalore
            </h2>
            <button className="flex items-center gap-2 text-coral-500 hover:text-coral-600 transition-colors">
              <span className="text-sm font-semibold">See all</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredSalons.slice(8, 12).map((salon) => (
              <ServiceCard key={`third-${salon.id}`} {...salon} />
            ))}
          </div>
        </div>
      </section>{" "}
      {/* Packages & Deals */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Packages & Deals
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {experiences.map((experience) => (
              <div
                key={experience.id}
                className="group cursor-pointer rounded-lg overflow-hidden hover:shadow-lg transition-shadow border border-gray-200"
                onClick={() => router.push("/salons" as Route)}
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={experience.image}
                    alt={experience.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold mb-2">
                      {experience.title}
                    </h3>
                    <p className="text-white/90 mb-2 text-sm">
                      {experience.description}
                    </p>
                    <p className="font-bold">{experience.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Partner CTA */}
      <section className="py-16 bg-coral-500 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Partner with BeautyBook
            </h2>
            <p className="text-lg mb-6 text-white/95">
              Grow your salon or spa with online bookings, reviews, and loyal
              customers.
            </p>
            <Button
              size="lg"
              className="bg-white text-coral-500 hover:bg-gray-100 rounded-lg px-8 py-3 font-bold border-0"
              onClick={() => router.push("/signup?type=vendor" as Route)}
            >
              Get started
            </Button>
          </div>
        </div>
      </section>
      {/* Stats */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-800 mb-2">25K+</div>
              <div className="text-gray-600 text-sm">Happy Clients</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800 mb-2">500+</div>
              <div className="text-gray-600 text-sm">Partner Venues</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800 mb-2">15+</div>
              <div className="text-gray-600 text-sm">Cities</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800 mb-2">5K+</div>
              <div className="text-gray-600 text-sm">Monthly Bookings</div>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-gray-100 py-10 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="font-bold text-gray-800 mb-3">Company</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>About us</li>
                <li>Careers</li>
                <li>Press</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-3">For customers</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>Help Center</li>
                <li>How it works</li>
                <li>Gift cards</li>
                <li>Wellness tips</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-3">For partners</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>Become a partner</li>
                <li>Partner resources</li>
                <li>Success stories</li>
                <li>Partner login</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-3">Legal</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>Privacy</li>
                <li>Terms</li>
                <li>Cookies</li>
                <li>Accessibility</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-300 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 text-sm">
              © 2025 BeautyBook, Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-4 mt-3 md:mt-0">
              <button className="text-gray-600 hover:text-gray-800 text-sm">
                Instagram
              </button>
              <button className="text-gray-600 hover:text-gray-800 text-sm">
                Twitter
              </button>
              <button className="text-gray-600 hover:text-gray-800 text-sm">
                LinkedIn
              </button>
            </div>
          </div>
        </div>
      </footer>
      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab="explore" />
    </div>
  );
}
