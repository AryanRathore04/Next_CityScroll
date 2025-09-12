"use client"
// Original: client/pages/VendorListing.tsx
// Changes: Next Link/useRouter, Next Image where needed, typed routes, shadcn Select.
import { useEffect, useState } from "react"
import Link from "next/link"
import type { Route } from "next"
import { Button } from "@/components/ui/button"
import { ServiceCard } from "@/components/ui/service-card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, SlidersHorizontal, Leaf, ChevronDown, Star, Home, Calendar, Compass, User } from "lucide-react"
import { useRouter } from "next/navigation"

const venues = [
  { id: "1", name: "Serenity Wellness Spa", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop&crop=center", rating: 4.9, reviewCount: 186, location: "Connaught Place, Delhi", services: ["Deep Tissue Massage", "Hot Stone", "Aromatherapy", "Reflexology"], priceRange: "₹₹₹", isOpen: true },
  { id: "2", name: "Zen Beauty Lounge", image: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400&h=300&fit=crop&crop=center", rating: 4.8, reviewCount: 234, location: "Bandra West, Mumbai", services: ["Facial Treatment", "Hair Spa", "Manicure", "Pedicure"], priceRange: "₹₹₹₹", isOpen: true },
  { id: "3", name: "Natural Glow Studio", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center", rating: 4.7, reviewCount: 156, location: "Koramangala, Bangalore", services: ["Organic Facial", "Natural Hair Care", "Wellness Therapy"], priceRange: "₹₹", isOpen: true },
  { id: "4", name: "Tranquil Mind & Body", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=300&fit=crop&crop=center", rating: 4.8, reviewCount: 198, location: "Cyber City, Gurgaon", services: ["Swedish Massage", "Couples Therapy", "Meditation"], priceRange: "₹₹₹", isOpen: false },
  { id: "5", name: "Pure Essence Spa", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center", rating: 4.9, reviewCount: 267, location: "Jubilee Hills, Hyderabad", services: ["Ayurvedic Treatment", "Herbal Therapy", "Detox"], priceRange: "₹₹₹₹", isOpen: true },
  { id: "6", name: "Harmony Beauty Center", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop&crop=center", rating: 4.6, reviewCount: 142, location: "Park Street, Kolkata", services: ["Hair Care", "Skin Treatment", "Nail Care"], priceRange: "₹₹", isOpen: true },
]

const filters = {
  location: ["All Locations", "Delhi", "Mumbai", "Bangalore", "Gurgaon", "Hyderabad", "Kolkata"],
  serviceType: ["All Services", "Spa & Wellness", "Hair Care", "Facial & Skincare", "Massage Therapy", "Beauty Treatments"],
  priceRange: ["All Prices", "₹", "₹₹", "₹₹₹", "₹₹₹₹"],
  rating: ["All Ratings", "4.5+ Stars", "4.0+ Stars", "3.5+ Stars"],
}

const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Highest Rated" },
  { value: "priceLow", label: "Price: Low to High" },
  { value: "priceHigh", label: "Price: High to Low" },
  { value: "distance", label: "Nearest First" },
]

export default function VendorListingPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("All Locations")
  const [selectedService, setSelectedService] = useState("All Services")
  const [selectedPrice, setSelectedPrice] = useState("All Prices")
  const [selectedRating, setSelectedRating] = useState("All Ratings")
  const [sortBy, setSortBy] = useState("recommended")
  const [showFilters, setShowFilters] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const filteredVenues = venues
    .filter((venue) => {
      if (
        searchQuery &&
        !venue.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !venue.services.some((service) => service.toLowerCase().includes(searchQuery.toLowerCase())) &&
        !venue.location.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }
      if (selectedLocation !== "All Locations" && !venue.location.includes(selectedLocation)) {
        return false
      }
      if (selectedService !== "All Services") {
        const serviceMap: Record<string, string[]> = {
          "Hair Care": ["Hair", "Cut", "Color", "Styling"],
          "Spa & Wellness": ["Spa", "Wellness", "Massage", "Therapy"],
          "Facial & Skincare": ["Facial", "Skin", "Care", "Treatment"],
          "Makeup & Beauty": ["Makeup", "Beauty", "Nail"],
          "Nail Care": ["Nail", "Manicure", "Pedicure"],
        }
        const keywords = serviceMap[selectedService] || []
        if (!venue.services.some((service) => keywords.some((k) => service.toLowerCase().includes(k.toLowerCase())))) {
          return false
        }
      }
      if (selectedPrice !== "All Prices" && venue.priceRange !== selectedPrice) {
        return false
      }
      if (selectedRating !== "All Ratings") {
        const minRating = parseFloat(selectedRating.replace("+", "").replace(" Stars", ""))
        if (venue.rating < minRating) return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating
        case "priceLow":
          return a.priceRange.length - b.priceRange.length
        case "priceHigh":
          return b.priceRange.length - a.priceRange.length
        case "distance":
        case "recommended":
        default:
          return b.rating - a.rating
      }
    })

  return (
    <div className="min-h-screen bg-gradient-hero">
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? "glass-navbar shadow-lg" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={"/" as Route} className="flex items-center gap-3 group">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-heading text-foreground tracking-wide">BeautyBook</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href={"/" as Route} className="text-sm font-body text-muted-foreground hover:text-primary transition-colors">Home</Link>
              <Link href={"/salons" as Route} className="text-sm font-body text-primary font-medium">Find Venues</Link>
              <Link href={"/membership" as Route} className="text-sm font-body text-muted-foreground hover:text-primary transition-colors">Membership</Link>
              <Link href={"/about" as Route} className="text-sm font-body text-muted-foreground hover:text-primary transition-colors">About</Link>
              <Button variant="ghost" size="sm" className="text-sm font-body" onClick={() => router.push("/signin" as Route)}>Sign In</Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-secondary text-sm px-6 rounded-full font-heading" onClick={() => router.push("/signup?type=vendor" as Route)}>Become a Partner</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Compass className="h-4 w-4 text-primary" />
            <span className="text-sm font-body text-primary">Discover Premium Wellness</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-heading text-foreground mb-4">Find Your Perfect<br /><span className="text-primary italic">Wellness Destination</span></h1>
          <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto leading-relaxed">Explore curated premium salons and spas near you. Book instantly and experience luxury wellness treatments.</p>
        </div>

        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-spa-charcoal/40" />
              <Input placeholder="Search venues, treatments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 h-12 rounded-full bg-white/95 backdrop-blur-sm border-spa-stone/20 font-light placeholder:text-spa-charcoal/40" />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="h-12 px-6 rounded-full border-spa-stone/30 bg-white/95 backdrop-blur-sm font-light">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </Button>
          </div>

          {showFilters && (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 mb-6 sophisticated-shadow border border-spa-stone/10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-spa-charcoal mb-3">Location</label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="border-spa-stone/20 rounded-lg font-light"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {filters.location.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-spa-charcoal mb-3">Service Type</label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger className="border-spa-stone/20 rounded-lg font-light"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {filters.serviceType.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-spa-charcoal mb-3">Price Range</label>
                  <Select value={selectedPrice} onValueChange={setSelectedPrice}>
                    <SelectTrigger className="border-spa-stone/20 rounded-lg font-light"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {filters.priceRange.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-spa-charcoal mb-3">Rating</label>
                  <Select value={selectedRating} onValueChange={setSelectedRating}>
                    <SelectTrigger className="border-spa-stone/20 rounded-lg font-light"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {filters.rating.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <p className="text-spa-charcoal/60 font-light"><span className="font-medium text-spa-charcoal">{filteredVenues.length}</span> venues found</p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-spa-charcoal/60 font-light">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 border-spa-stone/20 rounded-lg font-light"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sortOptions.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {(selectedLocation !== "All Locations" || selectedService !== "All Services" || selectedPrice !== "All Prices" || selectedRating !== "All Ratings") && (
          <div className="flex flex-wrap gap-2 mb-8">
            {selectedLocation !== "All Locations" && (<Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-0 font-light"><MapPin className="h-3 w-3 mr-1" />{selectedLocation}</Badge>)}
            {selectedService !== "All Services" && (<Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-0 font-light">{selectedService}</Badge>)}
            {selectedPrice !== "All Prices" && (<Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-0 font-light">{selectedPrice}</Badge>)}
            {selectedRating !== "All Ratings" && (<Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-0 font-light"><Star className="h-3 w-3 mr-1" />{selectedRating}</Badge>)}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredVenues.map((venue) => (<ServiceCard key={venue.id} {...venue} />))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="outline" className="px-8 rounded-full border-primary text-primary hover:bg-primary hover:text-white font-light" onClick={() => alert("Loading more venues...")}>Load More Venues</Button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-spa-stone/20 md:hidden">
        <div className="flex justify-around py-3">
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2 text-spa-charcoal/60" onClick={() => router.push("/" as Route)}> <Home className="h-5 w-5 mb-1" /><span className="text-xs font-light">Home</span></Button>
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2 text-primary" onClick={() => router.push("/salons" as Route)}> <Compass className="h-5 w-5 mb-1" /><span className="text-xs font-light">Explore</span></Button>
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2 text-spa-charcoal/60" onClick={() => router.push("/booking" as Route)}> <Calendar className="h-5 w-5 mb-1" /><span className="text-xs font-light">Bookings</span></Button>
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2 text-spa-charcoal/60" onClick={() => router.push("/signin" as Route)}> <User className="h-5 w-5 mb-1" /><span className="text-xs font-light">Profile</span></Button>
        </div>
      </div>
      <div className="h-20 md:hidden" />
    </div>
  )
}
