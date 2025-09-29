import { connectDB } from "@/lib/mongodb";
import { serverLogger as logger } from "@/lib/logger";
import mongoose from "mongoose";

export interface UserPreference {
  serviceCategories: string[];
  priceRange: { min: number; max: number };
  preferredTimeSlots: string[];
  preferredDays: number[]; // 0-6, Sunday = 0
  maxTravelDistance: number; // in kilometers
  preferredVendorTypes: string[];
  averageSessionBudget: number;
}

export interface RecommendationContext {
  userId: string;
  currentLocation?: { latitude: number; longitude: number };
  sessionType?: "quick" | "comprehensive" | "luxury";
  occasion?: string;
  timeframe?: "now" | "today" | "this_week" | "flexible";
}

export interface SalonRecommendation {
  vendorId: string;
  businessName: string;
  description: string;
  address: any;
  services: any[];
  rating: number;
  reviewCount: number;
  distance?: number;
  matchScore: number;
  matchReasons: string[];
  recommendedServices: Array<{
    serviceId: string;
    name: string;
    price: number;
    category: string;
    confidence: number;
  }>;
  availableSlots?: Array<{
    datetime: Date;
    duration: number;
  }>;
  priceEstimate: {
    min: number;
    max: number;
    recommended: number;
  };
}

export class AIRecommendationService {
  /**
   * Generate personalized salon recommendations for a user
   */
  static async getPersonalizedRecommendations(
    context: RecommendationContext,
    limit: number = 10,
  ): Promise<SalonRecommendation[]> {
    try {
      await connectDB();

      const User = (await import("../models/User")).default;
      const Booking = (await import("../models/Booking")).default;
      const Service = (await import("../models/Service")).default;

      // Get user profile and preferences
      const user = await User.findById(context.userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Analyze user's booking history and preferences
      const userPreferences = await this.analyzeUserPreferences(context.userId);

      // Get candidate salons based on location and basic filters
      const candidateSalons = await this.getCandidateSalons(
        context.currentLocation,
        userPreferences.maxTravelDistance,
      );

      // Score and rank salons using AI-like scoring algorithm
      const scoredRecommendations = await Promise.all(
        candidateSalons.map(async (salon) => {
          const recommendation = await this.scoreSalonForUser(
            salon,
            userPreferences,
            context,
          );
          return recommendation;
        }),
      );

      // Sort by match score and return top recommendations
      return scoredRecommendations
        .filter((rec) => rec.matchScore > 0.3) // Minimum confidence threshold
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
    } catch (error) {
      logger.error("Error generating personalized recommendations", {
        error,
        context,
      });
      return [];
    }
  }

  /**
   * Analyze user's historical preferences and patterns
   */
  private static async analyzeUserPreferences(
    userId: string,
  ): Promise<UserPreference> {
    try {
      const Booking = (await import("../models/Booking")).default;
      const Service = (await import("../models/Service")).default;

      // Get user's completed bookings
      const bookings = await Booking.find({
        customerId: new mongoose.Types.ObjectId(userId),
        status: "completed",
      })
        .populate("serviceId")
        .sort({ createdAt: -1 })
        .limit(50); // Last 50 bookings for analysis

      if (bookings.length === 0) {
        // Default preferences for new users
        return {
          serviceCategories: ["haircut", "styling"],
          priceRange: { min: 30, max: 150 },
          preferredTimeSlots: ["10:00", "11:00", "14:00", "15:00"],
          preferredDays: [1, 2, 3, 4, 5], // Weekdays
          maxTravelDistance: 25,
          preferredVendorTypes: ["salon"],
          averageSessionBudget: 80,
        };
      }

      // Analyze booking patterns
      const serviceCategories = [
        ...new Set(bookings.map((b) => b.serviceId?.category).filter(Boolean)),
      ];

      const prices = bookings.map((b) => b.totalPrice).filter((p) => p > 0);
      const avgPrice =
        prices.length > 0
          ? prices.reduce((a, b) => a + b, 0) / prices.length
          : 80;

      const timeSlots = bookings.map((b) => {
        const hour = new Date(b.datetime).getHours();
        return `${hour.toString().padStart(2, "0")}:00`;
      });

      const days = bookings.map((b) => new Date(b.datetime).getDay());

      // Calculate preferences based on frequency
      const preferredTimeSlots = this.getMostFrequent(timeSlots, 4);
      const preferredDays = this.getMostFrequent(days, 5);

      return {
        serviceCategories,
        priceRange: {
          min: Math.max(10, Math.round(avgPrice * 0.5)),
          max: Math.round(avgPrice * 1.8),
        },
        preferredTimeSlots,
        preferredDays,
        maxTravelDistance: 25, // Default
        preferredVendorTypes: ["salon"],
        averageSessionBudget: Math.round(avgPrice),
      };
    } catch (error) {
      logger.error("Error analyzing user preferences", { error, userId });
      // Return safe defaults
      return {
        serviceCategories: ["haircut"],
        priceRange: { min: 30, max: 150 },
        preferredTimeSlots: ["10:00", "14:00"],
        preferredDays: [1, 2, 3, 4, 5],
        maxTravelDistance: 25,
        preferredVendorTypes: ["salon"],
        averageSessionBudget: 80,
      };
    }
  }

  /**
   * Get candidate salons based on location and basic filters
   */
  private static async getCandidateSalons(
    location?: { latitude: number; longitude: number },
    maxDistance: number = 25,
  ): Promise<any[]> {
    try {
      const User = (await import("../models/User")).default;

      const pipeline: any[] = [
        {
          $match: {
            userType: "vendor",
            status: "active",
          },
        },
      ];

      // Add location filtering if provided
      if (location) {
        pipeline.push({
          $addFields: {
            distance: {
              $let: {
                vars: {
                  lat1: { $degreesToRadians: location.latitude },
                  lon1: { $degreesToRadians: location.longitude },
                  lat2: {
                    $degreesToRadians: "$businessAddress.coordinates.latitude",
                  },
                  lon2: {
                    $degreesToRadians: "$businessAddress.coordinates.longitude",
                  },
                },
                in: {
                  $multiply: [
                    6371,
                    {
                      $acos: {
                        $add: [
                          {
                            $multiply: [{ $sin: "$$lat1" }, { $sin: "$$lat2" }],
                          },
                          {
                            $multiply: [
                              { $cos: "$$lat1" },
                              { $cos: "$$lat2" },
                              { $cos: { $subtract: ["$$lon2", "$$lon1"] } },
                            ],
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        });

        pipeline.push({
          $match: {
            distance: { $lte: maxDistance },
          },
        });
      }

      // Lookup services
      pipeline.push({
        $lookup: {
          from: "services",
          localField: "_id",
          foreignField: "vendorId",
          as: "services",
        },
      });

      // Only include salons with services
      pipeline.push({
        $match: {
          "services.0": { $exists: true },
        },
      });

      // Add calculated fields
      pipeline.push({
        $addFields: {
          rating: { $ifNull: ["$averageRating", 0] },
          reviewCount: { $ifNull: ["$totalReviews", 0] },
          serviceCount: { $size: "$services" },
        },
      });

      // Sort by quality indicators
      pipeline.push({
        $sort: {
          rating: -1,
          reviewCount: -1,
          serviceCount: -1,
        },
      });

      pipeline.push({ $limit: 50 }); // Limit candidates for performance

      return await User.aggregate(pipeline);
    } catch (error) {
      logger.error("Error getting candidate salons", {
        error,
        location,
        maxDistance,
      });
      return [];
    }
  }

  /**
   * Score a salon for a specific user using AI-like algorithm
   */
  private static async scoreSalonForUser(
    salon: any,
    preferences: UserPreference,
    context: RecommendationContext,
  ): Promise<SalonRecommendation> {
    let totalScore = 0;
    const matchReasons: string[] = [];
    const maxScore = 100;

    // Service Category Match (25 points)
    const serviceCategories = salon.services.map((s: any) => s.category);
    const categoryMatches = preferences.serviceCategories.filter((cat) =>
      serviceCategories.includes(cat),
    );
    const categoryScore =
      (categoryMatches.length / preferences.serviceCategories.length) * 25;
    totalScore += categoryScore;

    if (categoryScore > 15) {
      matchReasons.push(
        `Offers your preferred services: ${categoryMatches.join(", ")}`,
      );
    }

    // Price Range Match (20 points)
    const salonPrices = salon.services.map((s: any) => s.price).filter(Boolean);
    if (salonPrices.length > 0) {
      const avgPrice =
        salonPrices.reduce((a: number, b: number) => a + b, 0) /
        salonPrices.length;
      const priceScore = this.calculatePriceScore(
        avgPrice,
        preferences.priceRange,
        preferences.averageSessionBudget,
      );
      totalScore += priceScore;

      if (priceScore > 10) {
        matchReasons.push(
          `Prices match your budget ($${preferences.priceRange.min}-$${preferences.priceRange.max})`,
        );
      }
    }

    // Rating and Reviews (20 points)
    const qualityScore = this.calculateQualityScore(
      salon.rating,
      salon.reviewCount,
    );
    totalScore += qualityScore;

    if (salon.rating >= 4.0) {
      matchReasons.push(
        `Highly rated (${salon.rating.toFixed(1)} stars, ${
          salon.reviewCount
        } reviews)`,
      );
    }

    // Location/Distance (15 points)
    if (salon.distance !== undefined) {
      const distanceScore = this.calculateDistanceScore(
        salon.distance,
        preferences.maxTravelDistance,
      );
      totalScore += distanceScore;

      if (distanceScore > 8) {
        matchReasons.push(
          `Conveniently located (${salon.distance.toFixed(1)}km away)`,
        );
      }
    }

    // Variety of Services (10 points)
    const varietyScore = Math.min((salon.services.length / 10) * 10, 10);
    totalScore += varietyScore;

    if (varietyScore > 6) {
      matchReasons.push(
        `Wide variety of services (${salon.services.length} services)`,
      );
    }

    // Availability Bonus (10 points)
    // This would require real availability checking
    const availabilityScore = 5; // Mock score
    totalScore += availabilityScore;

    // Normalize score to 0-1 range
    const matchScore = Math.min(totalScore / maxScore, 1);

    // Get recommended services for this user
    const recommendedServices = this.getRecommendedServices(
      salon.services,
      preferences,
    );

    // Calculate price estimate
    const priceEstimate = this.calculatePriceEstimate(recommendedServices);

    return {
      vendorId: salon._id.toString(),
      businessName: salon.businessName,
      description: salon.description || "",
      address: salon.businessAddress,
      services: salon.services,
      rating: salon.rating,
      reviewCount: salon.reviewCount,
      distance: salon.distance,
      matchScore,
      matchReasons,
      recommendedServices,
      priceEstimate,
    };
  }

  /**
   * Calculate price compatibility score
   */
  private static calculatePriceScore(
    avgPrice: number,
    priceRange: { min: number; max: number },
    preferredBudget: number,
  ): number {
    if (avgPrice >= priceRange.min && avgPrice <= priceRange.max) {
      // Within range - calculate how close to preferred budget
      const distanceFromPreferred = Math.abs(avgPrice - preferredBudget);
      const rangeSize = priceRange.max - priceRange.min;
      const proximityScore = Math.max(0, 1 - distanceFromPreferred / rangeSize);
      return proximityScore * 20;
    } else if (avgPrice < priceRange.min) {
      // Below range - cheaper is generally good
      return 15;
    } else {
      // Above range - penalize heavily
      return 2;
    }
  }

  /**
   * Calculate quality score based on rating and review count
   */
  private static calculateQualityScore(
    rating: number,
    reviewCount: number,
  ): number {
    const ratingScore = (rating / 5) * 15; // Max 15 points for rating
    const reviewScore = Math.min(reviewCount / 20, 1) * 5; // Max 5 points for review count
    return ratingScore + reviewScore;
  }

  /**
   * Calculate distance score (closer is better)
   */
  private static calculateDistanceScore(
    distance: number,
    maxDistance: number,
  ): number {
    if (distance > maxDistance) return 0;
    return (1 - distance / maxDistance) * 15;
  }

  /**
   * Get most frequent items from array
   */
  private static getMostFrequent<T>(items: T[], count: number): T[] {
    const frequency = items.reduce((acc, item) => {
      acc[item as any] = (acc[item as any] || 0) + 1;
      return acc;
    }, {} as Record<any, number>);

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([item]) => item as any);
  }

  /**
   * Get recommended services based on user preferences
   */
  private static getRecommendedServices(
    services: any[],
    preferences: UserPreference,
  ): SalonRecommendation["recommendedServices"] {
    return services
      .filter(
        (service) =>
          preferences.serviceCategories.includes(service.category) &&
          service.price >= preferences.priceRange.min &&
          service.price <= preferences.priceRange.max,
      )
      .map((service) => ({
        serviceId: service._id.toString(),
        name: service.name,
        price: service.price,
        category: service.category,
        confidence: this.calculateServiceConfidence(service, preferences),
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  /**
   * Calculate confidence score for a specific service
   */
  private static calculateServiceConfidence(
    service: any,
    preferences: UserPreference,
  ): number {
    let confidence = 0.5; // Base confidence

    // Category preference boost
    if (preferences.serviceCategories.includes(service.category)) {
      confidence += 0.3;
    }

    // Price preference boost
    const avgBudget = preferences.averageSessionBudget;
    const priceDiff = Math.abs(service.price - avgBudget) / avgBudget;
    if (priceDiff < 0.2) {
      confidence += 0.2;
    } else if (priceDiff < 0.5) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1);
  }

  /**
   * Calculate price estimate for recommended services
   */
  private static calculatePriceEstimate(
    services: SalonRecommendation["recommendedServices"],
  ): SalonRecommendation["priceEstimate"] {
    if (services.length === 0) {
      return { min: 0, max: 0, recommended: 0 };
    }

    const prices = services.map((s) => s.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const recommended = services[0]?.price || min;

    return { min, max, recommended };
  }

  /**
   * Get similar users for collaborative filtering
   */
  static async getSimilarUsers(
    userId: string,
    limit: number = 10,
  ): Promise<string[]> {
    try {
      const Booking = (await import("../models/Booking")).default;

      // Get user's service preferences
      const userBookings = await Booking.find({
        customerId: new mongoose.Types.ObjectId(userId),
        status: "completed",
      }).populate("serviceId");

      const userServiceCategories = [
        ...new Set(
          userBookings.map((b) => b.serviceId?.category).filter(Boolean),
        ),
      ];

      if (userServiceCategories.length === 0) {
        return [];
      }

      // Find users with similar service preferences
      const similarUsers = await Booking.aggregate([
        {
          $match: {
            customerId: { $ne: new mongoose.Types.ObjectId(userId) },
            status: "completed",
          },
        },
        {
          $lookup: {
            from: "services",
            localField: "serviceId",
            foreignField: "_id",
            as: "service",
          },
        },
        { $unwind: "$service" },
        {
          $match: {
            "service.category": { $in: userServiceCategories },
          },
        },
        {
          $group: {
            _id: "$customerId",
            commonServices: { $addToSet: "$service.category" },
            bookingCount: { $sum: 1 },
          },
        },
        {
          $addFields: {
            similarity: {
              $size: {
                $setIntersection: ["$commonServices", userServiceCategories],
              },
            },
          },
        },
        { $sort: { similarity: -1, bookingCount: -1 } },
        { $limit: limit },
      ]);

      return similarUsers.map((u) => u._id.toString());
    } catch (error) {
      logger.error("Error finding similar users", { error, userId });
      return [];
    }
  }
}
