"use client";

import { AirbnbHeader } from "@/components/nav/airbnb-header";
import { BottomNav } from "@/components/nav/bottom-nav";
import { Heart } from "lucide-react";

export default function FavoritesPage() {
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
            As you search, tap the heart icon to save your favorite places to
            stay or things to do to a wishlist.
          </p>
        </div>
      </main>

      <BottomNav activeTab="profile" />
    </div>
  );
}
