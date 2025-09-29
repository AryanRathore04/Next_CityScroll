"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  MapPin,
  Star,
  Clock,
  DollarSign,
  Heart,
  RefreshCw,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type {
  SalonRecommendation,
  RecommendationContext,
} from "@/lib/ai-recommendation-service";

interface AIRecommendationsProps {
  userId: string;
  currentLocation?: { latitude: number; longitude: number };
  onSalonSelect?: (salon: SalonRecommendation) => void;
  limit?: number;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({
  userId,
  currentLocation,
  onSalonSelect,
  limit = 6,
}) => {
  const [recommendations, setRecommendations] = useState<SalonRecommendation[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<Partial<RecommendationContext>>({
    sessionType: "comprehensive",
    timeframe: "flexible",
  });

  useEffect(() => {
    loadRecommendations();
  }, [userId, currentLocation]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);

      const requestContext: RecommendationContext = {
        userId,
        currentLocation,
        ...context,
      };

      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...requestContext, limit }),
      });

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data.recommendations);
        toast({
          title: "Recommendations updated",
          description: `Found ${data.data.recommendations.length} personalized recommendations`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to load recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const RecommendationCard = ({ salon }: { salon: SalonRecommendation }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{salon.businessName}</CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {salon.distance && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{salon.distance.toFixed(1)}km away</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>
                  {salon.rating.toFixed(1)} ({salon.reviewCount})
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700"
            >
              {Math.round(salon.matchScore * 100)}% Match
            </Badge>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Heart className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {salon.description}
        </p>

        {/* Match Reasons */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Why we recommend this
          </h4>
          <div className="space-y-1">
            {salon.matchReasons.slice(0, 2).map((reason, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-muted-foreground">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Services */}
        {salon.recommendedServices.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Recommended for you
            </h4>
            <div className="space-y-1">
              {salon.recommendedServices.slice(0, 2).map((service) => (
                <div
                  key={service.serviceId}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="font-medium">{service.name}</span>
                  <span className="text-muted-foreground">
                    ${service.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Estimate */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Estimated cost</span>
            <div className="text-right">
              <div className="font-semibold">
                ${salon.priceEstimate.recommended}
              </div>
              <div className="text-xs text-muted-foreground">
                ${salon.priceEstimate.min} - ${salon.priceEstimate.max}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button
            onClick={() => onSalonSelect?.(salon)}
            className="flex-1"
            size="sm"
          >
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Calendar className="h-3 w-3" />
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const ContextSelector = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Session type:
        </span>
        {["quick", "comprehensive", "luxury"].map((type) => (
          <Button
            key={type}
            variant={context.sessionType === type ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setContext((prev) => ({ ...prev, sessionType: type as any }))
            }
            className="capitalize"
          >
            {type}
          </Button>
        ))}
      </div>

      <Separator className="h-6" />

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Timeframe:
        </span>
        {["now", "today", "this_week", "flexible"].map((time) => (
          <Button
            key={time}
            variant={context.timeframe === time ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setContext((prev) => ({ ...prev, timeframe: time as any }))
            }
            className="capitalize"
          >
            {time.replace("_", " ")}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Recommendations</h2>
            <p className="text-muted-foreground">
              Personalized salon suggestions based on your preferences
            </p>
          </div>
        </div>

        <Button
          onClick={loadRecommendations}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Context Selector */}
      <ContextSelector />

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: limit }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recommendations Grid */}
      {!loading && recommendations.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((salon) => (
            <RecommendationCard key={salon.vendorId} salon={salon} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && recommendations.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No recommendations yet
            </h3>
            <p className="text-muted-foreground mb-4">
              We need a bit more data to provide personalized recommendations.
              Try booking a few services to help us understand your preferences!
            </p>
            <Button onClick={loadRecommendations} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Insights Footer */}
      {recommendations.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                Recommendations based on your booking history, preferences, and
                similar users' choices. Updated in real-time as you book more
                services.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
