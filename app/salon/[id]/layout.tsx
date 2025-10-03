import { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

interface VendorMetadata {
  businessName: string;
  description?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
  };
  services?: Array<{
    name: string;
    description?: string;
  }>;
  averageRating?: number;
  totalReviews?: number;
}

async function getVendorMetadata(
  vendorId: string,
): Promise<VendorMetadata | null> {
  try {
    // Validate vendorId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      console.error(
        `Invalid vendor ID format: ${vendorId}. Expected a valid MongoDB ObjectId.`,
      );
      return null;
    }

    // Connect to database
    await connectDB();
    const User = (await import("../../../models/User")).default;

    // Find vendor by ID
    const vendor = await User.findById(vendorId)
      .select(
        "businessName description businessAddress location rating totalBookings userType",
      )
      .lean();

    if (!vendor || (vendor as any).userType !== "vendor") {
      return null;
    }

    // Get vendor services
    const Service = (await import("../../../models/Service")).default;
    const services = await Service.find({ vendorId })
      .select("name description")
      .limit(5)
      .lean();

    const vendorData = vendor as any;
    const servicesData = services as any[];

    return {
      businessName: vendorData.businessName || "Salon & Spa",
      description:
        vendorData.description || "Professional beauty and wellness services",
      location: {
        address: vendorData.businessAddress?.street,
        city: vendorData.businessAddress?.city,
        state: vendorData.businessAddress?.state,
      },
      services: servicesData.map((s) => ({
        name: s.name,
        description: s.description,
      })),
      averageRating: vendorData.rating,
      totalReviews: vendorData.totalBookings || 0,
    };
  } catch (error) {
    console.error("Error fetching vendor metadata:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  // Get vendor data for metadata
  const vendorData = await getVendorMetadata(id);

  if (!vendorData) {
    return {
      title: "Salon Not Found | BeautyBook",
      description: "The salon you are looking for could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const {
    businessName,
    description,
    location,
    services,
    averageRating,
    totalReviews,
  } = vendorData;

  // Generate dynamic title and description
  const locationText = location?.city ? `in ${location.city}` : "";
  const ratingText = averageRating
    ? ` | ${averageRating}★ (${totalReviews} reviews)`
    : "";

  const title = `${businessName} ${locationText} | BeautyBook${ratingText}`;

  const servicesText =
    services && services.length > 0
      ? ` Specializing in ${services
          .slice(0, 3)
          .map((s) => s.name)
          .join(", ")}.`
      : "";

  const fullDescription = `${description}${servicesText} Book appointments online with BeautyBook.`;

  // Generate keywords from services
  const keywords = [
    businessName,
    "salon",
    "spa",
    "beauty services",
    "appointments",
    "booking",
    ...(services?.map((s) => s.name) || []),
    ...(location?.city ? [location.city] : []),
    ...(location?.state ? [location.state] : []),
  ].filter(Boolean);

  return {
    title,
    description: fullDescription,
    keywords: keywords.join(", "),

    // Open Graph tags for social media sharing
    openGraph: {
      title,
      description: fullDescription,
      type: "website",
      url: `${
        process.env.NEXT_PUBLIC_APP_URL || "https://beautybook.com"
      }/salon/${id}`,
      siteName: "BeautyBook",
      locale: "en_US",
      images: [
        {
          url: "/og-salon-default.jpg", // You can add a default salon image
          width: 1200,
          height: 630,
          alt: `${businessName} - Professional Beauty Services`,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: "summary_large_image",
      title,
      description: fullDescription,
      images: ["/og-salon-default.jpg"],
    },

    // Structured data for better SEO
    other: {
      "business:contact_data:street_address": location?.address || "",
      "business:contact_data:locality": location?.city || "",
      "business:contact_data:region": location?.state || "",
      "business:contact_data:country_name": "India",
    },

    // Additional meta tags
    alternates: {
      canonical: `${
        process.env.NEXT_PUBLIC_APP_URL || "https://beautybook.com"
      }/salon/${id}`,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default function SalonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
