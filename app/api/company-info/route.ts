import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import CompanyInfo from "@/models/CompanyInfo";

/**
 * GET /api/company-info
 * Fetch company information for the About page
 */
export async function GET() {
  try {
    await connectDB();

    // Fetch the active company info
    let companyInfo = await CompanyInfo.findOne({ isActive: true });

    // If no company info exists, create default one
    if (!companyInfo) {
      companyInfo = await CompanyInfo.create({
        story: {
          title: "Our Story",
          paragraphs: [
            "BeautyBook was born from a simple belief: everyone deserves access to exceptional wellness experiences. Founded in 2020, we started with a mission to bridge the gap between wellness seekers and premium service providers.",
            "What began as a small platform has grown into a trusted community of over 25,000 customers and 500+ partner venues across 15 cities. We've facilitated countless moments of self-care, relaxation, and transformation.",
            "Today, we continue to innovate and expand, always keeping our core values at heart: quality, trust, and the belief that wellness should be accessible to all.",
          ],
          image:
            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center",
        },
        values: [
          {
            icon: "Heart",
            title: "Wellness First",
            description:
              "Your health and well-being are at the center of everything we do.",
          },
          {
            icon: "Shield",
            title: "Trust & Safety",
            description:
              "All our partners are verified and maintain the highest standards.",
          },
          {
            icon: "Sparkles",
            title: "Premium Quality",
            description:
              "We curate only the best wellness experiences for our community.",
          },
        ],
        team: [
          {
            name: "Sarah Johnson",
            role: "Founder & CEO",
            image:
              "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face",
            description: "10+ years in wellness industry",
            order: 1,
          },
          {
            name: "Michael Chen",
            role: "Head of Partnerships",
            image:
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
            description: "Expert in business development",
            order: 2,
          },
          {
            name: "Emily Rodriguez",
            role: "Customer Success",
            image:
              "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
            description: "Passionate about customer care",
            order: 3,
          },
        ],
        cta: {
          title: "Ready to Start Your Wellness Journey?",
          description:
            "Join thousands who trust BeautyBook for their wellness needs",
          primaryButtonText: "Explore Services",
          primaryButtonLink: "/salons",
          secondaryButtonText: "Become a Partner",
          secondaryButtonLink: "/signup?type=vendor",
        },
        seo: {
          title: "About BeautyBook - Your Wellness Partner",
          description:
            "Learn about BeautyBook, our mission, values, and the team dedicated to making wellness accessible to everyone.",
          keywords: ["wellness", "beauty", "spa", "salon", "about us", "team"],
        },
        isActive: true,
      });
    }

    return NextResponse.json(companyInfo, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200", // Cache for 1 hour
      },
    });
  } catch (error: any) {
    console.error("❌ [COMPANY INFO API] Error fetching company info:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch company information",
        message: error.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/company-info
 * Update company information (Admin only)
 * TODO: Add authentication middleware to ensure only admins can update
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Find existing active company info or create new one
    let companyInfo = await CompanyInfo.findOne({ isActive: true });

    if (companyInfo) {
      // Update existing
      Object.assign(companyInfo, body);
      await companyInfo.save();
    } else {
      // Create new
      companyInfo = await CompanyInfo.create({ ...body, isActive: true });
    }

    return NextResponse.json(
      {
        message: "Company information updated successfully",
        data: companyInfo,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ [COMPANY INFO API] Error updating company info:", error);
    return NextResponse.json(
      {
        error: "Failed to update company information",
        message: error.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
