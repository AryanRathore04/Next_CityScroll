import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import { serverLogger as logger } from "@/lib/logger";

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface SearchFilters {
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  city?: string;
  state?: string;
  zipCode?: string;
  serviceCategory?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  rating?: number; // minimum rating
  availability?: {
    date?: string;
    timeSlots?: string[];
  };
  sortBy?: "distance" | "rating" | "price" | "popularity";
  sortOrder?: "asc" | "desc";
}

export interface SalonWithDistance {
  _id: string;
  businessName: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  services: any[];
  rating: number;
  reviewCount: number;
  priceRange: string;
  distance: number; // in kilometers
  isVerified: boolean;
  isOpen: boolean;
  nextAvailableSlot?: Date;
}

export class GeolocationService {
  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get user's current location using browser geolocation API
   */
  static async getCurrentLocation(): Promise<GeoLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        },
      );
    });
  }

  /**
   * Geocode address to coordinates
   */
  static async geocodeAddress(address: string): Promise<GeoLocation> {
    try {
      // In a real implementation, you would use Google Maps Geocoding API or similar
      // For demo purposes, we'll use a mock implementation

      const mockCoordinates = {
        "New York": { latitude: 40.7128, longitude: -74.006 },
        "Los Angeles": { latitude: 34.0522, longitude: -118.2437 },
        Chicago: { latitude: 41.8781, longitude: -87.6298 },
        Houston: { latitude: 29.7604, longitude: -95.3698 },
        Phoenix: { latitude: 33.4484, longitude: -112.074 },
      };

      // Simple mock - in production, use actual geocoding service
      const city = Object.keys(mockCoordinates).find((city) =>
        address.toLowerCase().includes(city.toLowerCase()),
      );

      if (city) {
        return mockCoordinates[city as keyof typeof mockCoordinates];
      }

      // Default to center of US if no match
      return { latitude: 39.8283, longitude: -98.5795 };
    } catch (error) {
      logger.error("Error geocoding address", { error, address });
      throw new Error("Failed to geocode address");
    }
  }

  /**
   * Search salons with geolocation and filters
   */
  static async searchSalons(filters: SearchFilters): Promise<{
    salons: SalonWithDistance[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      await connectDB();

      // Dynamic import to avoid compilation issues
      const User = (await import("../models/User")).default;

      const {
        latitude,
        longitude,
        radius = 50, // default 50km radius
        city,
        state,
        zipCode,
        serviceCategory,
        priceRange,
        rating = 0,
        sortBy = "distance",
        sortOrder = "asc",
      } = filters;

      // Build aggregation pipeline
      const pipeline: any[] = [];

      // Match vendors only
      pipeline.push({
        $match: {
          userType: "vendor",
          status: "active",
        },
      });

      // Add location-based filtering if coordinates provided
      if (latitude && longitude) {
        pipeline.push({
          $addFields: {
            distance: {
              $let: {
                vars: {
                  lat1: { $degreesToRadians: latitude },
                  lon1: { $degreesToRadians: longitude },
                  lat2: {
                    $degreesToRadians: "$businessAddress.coordinates.latitude",
                  },
                  lon2: {
                    $degreesToRadians: "$businessAddress.coordinates.longitude",
                  },
                },
                in: {
                  $multiply: [
                    6371, // Earth's radius in km
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

        // Filter by radius
        pipeline.push({
          $match: {
            distance: { $lte: radius },
          },
        });
      }

      // Add city/state/zip filters
      const locationMatch: any = {};
      if (city) locationMatch["businessAddress.city"] = new RegExp(city, "i");
      if (state) locationMatch["businessAddress.state"] = state;
      if (zipCode) locationMatch["businessAddress.zipCode"] = zipCode;

      if (Object.keys(locationMatch).length > 0) {
        pipeline.push({ $match: locationMatch });
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

      // Filter by service category if specified
      if (serviceCategory) {
        pipeline.push({
          $match: {
            "services.category": serviceCategory,
          },
        });
      }

      // Filter by price range
      if (priceRange?.min !== undefined || priceRange?.max !== undefined) {
        const priceMatch: any = {};
        if (priceRange.min !== undefined) {
          priceMatch["services.price"] = { $gte: priceRange.min };
        }
        if (priceRange.max !== undefined) {
          priceMatch["services.price"] = {
            ...priceMatch["services.price"],
            $lte: priceRange.max,
          };
        }
        pipeline.push({ $match: priceMatch });
      }

      // Calculate average rating (mock calculation)
      pipeline.push({
        $addFields: {
          rating: { $ifNull: ["$averageRating", 0] },
          reviewCount: { $ifNull: ["$totalReviews", 0] },
          priceRange: {
            $cond: {
              if: { $gt: [{ $size: "$services" }, 0] },
              then: {
                $switch: {
                  branches: [
                    {
                      case: { $lte: [{ $avg: "$services.price" }, 50] },
                      then: "$",
                    },
                    {
                      case: { $lte: [{ $avg: "$services.price" }, 100] },
                      then: "$$",
                    },
                    {
                      case: { $lte: [{ $avg: "$services.price" }, 200] },
                      then: "$$$",
                    },
                  ],
                  default: "$$$$",
                },
              },
              else: "$$",
            },
          },
        },
      });

      // Filter by minimum rating
      if (rating > 0) {
        pipeline.push({
          $match: {
            rating: { $gte: rating },
          },
        });
      }

      // Add verification status
      pipeline.push({
        $lookup: {
          from: "vendorverifications",
          localField: "_id",
          foreignField: "vendorId",
          as: "verification",
        },
      });

      pipeline.push({
        $addFields: {
          isVerified: {
            $cond: {
              if: { $gt: [{ $size: "$verification" }, 0] },
              then: {
                $eq: [
                  { $arrayElemAt: ["$verification.status", 0] },
                  "approved",
                ],
              },
              else: false,
            },
          },
        },
      });

      // Project final fields
      pipeline.push({
        $project: {
          businessName: 1,
          description: 1,
          businessAddress: 1,
          services: 1,
          rating: 1,
          reviewCount: 1,
          priceRange: 1,
          distance: { $ifNull: ["$distance", 0] },
          isVerified: 1,
          isOpen: { $literal: true }, // Mock - would calculate based on business hours
          nextAvailableSlot: { $literal: null }, // Mock - would calculate from bookings
        },
      });

      // Sort results
      const sortOptions: any = {};
      switch (sortBy) {
        case "distance":
          sortOptions.distance = sortOrder === "desc" ? -1 : 1;
          break;
        case "rating":
          sortOptions.rating = sortOrder === "desc" ? -1 : 1;
          break;
        case "price":
          sortOptions["services.price"] = sortOrder === "desc" ? -1 : 1;
          break;
        case "popularity":
          sortOptions.reviewCount = -1;
          break;
        default:
          sortOptions.distance = 1;
      }

      pipeline.push({ $sort: sortOptions });

      // Execute aggregation
      const salons = await User.aggregate(pipeline);

      return {
        salons: salons.map((salon: any) => ({
          ...salon,
          _id: salon._id.toString(),
        })),
        total: salons.length,
        page: 1,
        limit: salons.length,
      };
    } catch (error) {
      logger.error("Error searching salons", { error, filters });
      throw error;
    }
  }

  /**
   * Get nearby salons based on user location
   */
  static async getNearbyCustomers(
    vendorId: string,
    radius: number = 10,
  ): Promise<{
    customers: any[];
    totalInArea: number;
  }> {
    try {
      await connectDB();

      const User = (await import("../models/User")).default;
      const Booking = (await import("../models/Booking")).default;

      // Get vendor's location
      const vendor = await User.findById(vendorId);
      if (!vendor || !vendor.businessAddress?.coordinates) {
        throw new Error("Vendor location not found");
      }

      const { latitude, longitude } = vendor.businessAddress.coordinates;

      // Find customers who have made bookings and are within radius
      const customers = await Booking.aggregate([
        {
          $match: {
            vendorId: new mongoose.Types.ObjectId(vendorId),
            status: "completed",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "customerId",
            foreignField: "_id",
            as: "customer",
          },
        },
        { $unwind: "$customer" },
        {
          $match: {
            "customer.location.coordinates": { $exists: true },
          },
        },
        {
          $addFields: {
            distance: {
              $let: {
                vars: {
                  lat1: { $degreesToRadians: latitude },
                  lon1: { $degreesToRadians: longitude },
                  lat2: {
                    $degreesToRadians:
                      "$customer.location.coordinates.latitude",
                  },
                  lon2: {
                    $degreesToRadians:
                      "$customer.location.coordinates.longitude",
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
        },
        {
          $match: {
            distance: { $lte: radius },
          },
        },
        {
          $group: {
            _id: "$customerId",
            customer: { $first: "$customer" },
            distance: { $first: "$distance" },
            bookingCount: { $sum: 1 },
            lastBooking: { $max: "$scheduledDate" },
          },
        },
        { $sort: { distance: 1 } },
      ]);

      return {
        customers: customers.map((c: any) => ({
          ...c.customer,
          distance: c.distance,
          bookingCount: c.bookingCount,
          lastBooking: c.lastBooking,
        })),
        totalInArea: customers.length,
      };
    } catch (error) {
      logger.error("Error getting nearby customers", {
        error,
        vendorId,
        radius,
      });
      throw error;
    }
  }

  /**
   * Get popular areas for business expansion analysis
   */
  static async getPopularAreas(serviceCategory?: string): Promise<{
    cities: Array<{
      city: string;
      state: string;
      bookingCount: number;
      revenue: number;
      vendorCount: number;
      averageRating: number;
      coordinates?: GeoLocation;
    }>;
  }> {
    try {
      await connectDB();

      const Booking = (await import("../models/Booking")).default;

      const matchFilter: any = {
        status: "completed",
      };

      if (serviceCategory) {
        // Would need to join with services to filter by category
        matchFilter["service.category"] = serviceCategory;
      }

      const areas = await Booking.aggregate([
        { $match: matchFilter },
        {
          $lookup: {
            from: "users",
            localField: "vendorId",
            foreignField: "_id",
            as: "vendor",
          },
        },
        { $unwind: "$vendor" },
        {
          $group: {
            _id: {
              city: "$vendor.businessAddress.city",
              state: "$vendor.businessAddress.state",
            },
            bookingCount: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
            vendors: { $addToSet: "$vendorId" },
            ratings: { $push: "$rating" },
          },
        },
        {
          $addFields: {
            vendorCount: { $size: "$vendors" },
            averageRating: { $avg: "$ratings" },
          },
        },
        {
          $project: {
            city: "$_id.city",
            state: "$_id.state",
            bookingCount: 1,
            revenue: 1,
            vendorCount: 1,
            averageRating: { $round: ["$averageRating", 1] },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 20 },
      ]);

      return {
        cities: areas.map((area: any) => ({
          city: area.city,
          state: area.state,
          bookingCount: area.bookingCount,
          revenue: area.revenue,
          vendorCount: area.vendorCount,
          averageRating: area.averageRating || 0,
        })),
      };
    } catch (error) {
      logger.error("Error getting popular areas", { error, serviceCategory });
      throw error;
    }
  }
}
