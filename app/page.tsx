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

const featuredServices = [
  {
    id: "1",
    name: "Serenity Wellness Spa",
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop&crop=center",
    rating: 4.9,
    reviewCount: 186,
    location: "Connaught Place, Delhi",
    services: ["Deep Tissue Massage", "Hot Stone Therapy", "Aromatherapy"],
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
    services: ["Facial Treatment", "Hair Spa", "Manicure & Pedicure"],
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
    name: "Elite Hair Studio",
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop&crop=center",
    rating: 4.9,
    reviewCount: 298,
    location: "Cyber City, Gurgaon",
    services: ["Hair Cut & Style", "Hair Color", "Keratin Treatment"],
    priceRange: "₹₹₹",
    isOpen: true,
  },
];

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
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedDuration, setSelectedDuration] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Optimize loading time
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Debug effect to log state changes
  useEffect(() => {
    console.log("Form State Updated:", {
      searchLocation,
      selectedService,
      preferredDate,
      selectedDate,
      selectedDuration,
    });
  }, [
    searchLocation,
    selectedService,
    preferredDate,
    selectedDate,
    selectedDuration,
  ]);

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
      {/* Navigation Header */}
      <SimpleHeader />
      {/* OYO-style Header with Search */}
      <header className="bg-white shadow-sm">
        {/* Search Section */}
        <div className="bg-white">
          <div className="container mx-auto px-4 py-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Find spa & salon services at best prices
              {(searchLocation ||
                selectedService ||
                preferredDate ||
                selectedDuration) && (
                <span className="ml-2 text-sm text-coral-600 font-normal">
                  •{" "}
                  {
                    [
                      searchLocation,
                      selectedService,
                      preferredDate,
                      selectedDuration,
                    ].filter(Boolean).length
                  }{" "}
                  field(s) filled
                </span>
              )}
            </h2>

            {/* Search Form */}
            <div className="space-y-4">
              {/* Location Input */}
              <div className="relative">
                <label className="block text-sm text-gray-600 mb-2">
                  Location
                </label>
                <Input
                  type="text"
                  placeholder="Search for city, area or salon name"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
                />
              </div>

              {/* Service, Date and Duration Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Service
                  </label>
                  <Input
                    type="text"
                    placeholder="Spa, Massage, Hair Care"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Preferred Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500 justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate
                          ? format(selectedDate, "PPP")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Suspense
                        fallback={
                          <div className="p-4">Loading calendar...</div>
                        }
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
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Duration
                  </label>
                  <Select
                    value={selectedDuration}
                    onValueChange={setSelectedDuration}
                  >
                    <SelectTrigger className="w-full h-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-gray-500" />
                        <SelectValue placeholder="Select duration" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30min">30 minutes</SelectItem>
                      <SelectItem value="45min">45 minutes</SelectItem>
                      <SelectItem value="1hour">1 hour</SelectItem>
                      <SelectItem value="1.5hours">1.5 hours</SelectItem>
                      <SelectItem value="2hours">2 hours</SelectItem>
                      <SelectItem value="2.5hours">2.5 hours</SelectItem>
                      <SelectItem value="3hours">3 hours</SelectItem>
                      <SelectItem value="halfday">
                        Half day (4-5 hours)
                      </SelectItem>
                      <SelectItem value="fullday">
                        Full day (6-8 hours)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Search Button */}
              <Button
                className="w-full h-12 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-lg"
                onClick={() => {
                  // Create search parameters
                  const params = new URLSearchParams();
                  if (searchLocation) params.set("location", searchLocation);
                  if (selectedService) params.set("service", selectedService);
                  if (preferredDate) params.set("date", preferredDate);
                  if (selectedDuration)
                    params.set("duration", selectedDuration);

                  // Log the search parameters for testing
                  console.log("Search Parameters:", {
                    location: searchLocation,
                    service: selectedService,
                    date: preferredDate,
                    duration: selectedDuration,
                    selectedDate: selectedDate,
                  });

                  // Build the URL with parameters
                  const queryString = params.toString();
                  const url = queryString
                    ? `/salons?${queryString}`
                    : "/salons";

                  console.log("Navigating to:", url);
                  router.push(url as Route);
                }}
              >
                <Search className="mr-2 h-4 w-4" />
                Search Services
              </Button>

              {/* Quick Test Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchLocation("Mumbai");
                    setSelectedService("Spa");
                    setPreferredDate("Today");
                    setSelectedDuration("2hours");
                  }}
                  className="text-xs"
                >
                  Quick Fill: Mumbai Spa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchLocation("");
                    setSelectedService("");
                    setPreferredDate("");
                    setSelectedDate(undefined);
                    setSelectedDuration("");
                  }}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Explore Cities */}
        <div className="bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Popular spa & salon destinations
            </h3>

            <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                {
                  name: "Near me",
                  image:
                    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=150&h=150&fit=crop",
                },
                {
                  name: "Bangalore",
                  image:
                    "https://images.unsplash.com/photo-1558431382-27e303142255?w=150&h=150&fit=crop",
                },
                {
                  name: "Chennai",
                  image:
                    "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=150&h=150&fit=crop",
                },
                {
                  name: "Delhi",
                  image:
                    "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=150&h=150&fit=crop",
                },
                {
                  name: "Gurgaon",
                  image:
                    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=150&h=150&fit=crop",
                },
                {
                  name: "Hyderabad",
                  image:
                    "https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=150&h=150&fit=crop",
                },
              ].map((city) => (
                <button
                  key={city.name}
                  className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  onClick={() => {
                    // Set the location in the search form
                    setSearchLocation(city.name);
                    // Scroll back to search form
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden mb-2">
                    <Image
                      src={city.image}
                      alt={city.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-coral-600">
                    {city.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
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
            {featuredServices.map((service) => (
              <ServiceCard key={service.id} {...service} />
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
            {featuredServices.map((service) => (
              <ServiceCard key={`second-${service.id}`} {...service} />
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
            {featuredServices.map((service) => (
              <ServiceCard key={`third-${service.id}`} {...service} />
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
