"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useAuth } from "@/hooks/useAuth";
import { AirbnbHeader } from "@/components/nav/airbnb-header";
import { BottomNav } from "@/components/nav/bottom-nav";
import { ServiceCard } from "@/components/ui/service-card";
import { Heart, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface Favorite {
  _id: string;
  vendorId: {
    _id: string;
    businessName: string;
    businessAddress?: {
      city?: string;
    };
    rating?: number;
    totalBookings?: number;
    businessType?: string;
    profileImage?: string;
  };
  createdAt: string;
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/signin" as Route);
      return;
    }
    fetchFavorites();
  }, [user, router]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/favorites", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch favorites");
      }

      const result = await response.json();
      if (result.success) {
        setFavorites(result.data || []);
      } else {
        throw new Error(result.error || "Failed to load favorites");
      }
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setError(err instanceof Error ? err.message : "Failed to load favorites");
      toast({
        title: "Error",
        description: "Failed to load your favorites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const response = await fetch(`/api/favorites/${favoriteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to remove favorite");
      }

      setFavorites(favorites.filter((fav) => fav._id !== favoriteId));
      toast({
        title: "Removed",
        description: "Removed from favorites",
      });
    } catch (err) {
      console.error("Error removing favorite:", err);
      toast({
        title: "Error",
        description: "Failed to remove favorite",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <AirbnbHeader />
        <main className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-coral-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading your favorites...</p>
            </div>
          </div>
        </main>
        <BottomNav activeTab="profile" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <AirbnbHeader />
        <main className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Error Loading Favorites
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchFavorites}>Try Again</Button>
            </div>
          </div>
        </main>
        <BottomNav activeTab="profile" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <AirbnbHeader />
        <main className="container mx-auto px-6 py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-12 w-12 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-700 mb-4">
              Create your first wishlist
            </h1>
            <p className="text-gray-500 mb-8">
              As you search, tap the heart icon to save your favorite salons and
              spas.
            </p>
            <Button
              onClick={() => router.push("/salons" as Route)}
              className="bg-coral-500 hover:bg-coral-600"
            >
              Browse Salons
            </Button>
          </div>
        </main>
        <BottomNav activeTab="profile" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AirbnbHeader />

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Favorites</h1>
        <p className="text-gray-600 mb-8">
          {favorites.length} saved {favorites.length === 1 ? "place" : "places"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((favorite) => (
            <div key={favorite._id} className="relative">
              <ServiceCard
                id={favorite.vendorId._id}
                name={favorite.vendorId.businessName}
                image={
                  favorite.vendorId.profileImage ||
                  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop"
                }
                rating={favorite.vendorId.rating || 4.5}
                reviewCount={favorite.vendorId.totalBookings || 0}
                location={favorite.vendorId.businessAddress?.city || "Location"}
                services={[
                  favorite.vendorId.businessType || "Beauty & Wellness",
                ]}
                priceRange="₹₹₹"
                isOpen={true}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFavorite(favorite._id);
                }}
              >
                <Heart className="h-5 w-5 text-coral-500 fill-coral-500" />
              </Button>
            </div>
          ))}
        </div>
      </main>

      <BottomNav activeTab="profile" />
    </div>
  );
}
