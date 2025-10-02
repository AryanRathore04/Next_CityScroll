/**
 * Seed script to populate CompanyInfo collection with default data
 * Run: node scripts/seed-company-info.js
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envPath = path.join(__dirname, "..", ".env.local");
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, "utf8");
      envFile.split("\n").forEach((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith("#")) {
          const [key, ...valueParts] = trimmedLine.split("=");
          const value = valueParts.join("=").trim();
          if (key && value) {
            process.env[key.trim()] = value.replace(/^["']|["']$/g, "");
          }
        }
      });
    }
  } catch (error) {
    console.warn("⚠️  Could not load .env.local file:", error.message);
  }
}

loadEnv();

const CompanyInfoSchema = new mongoose.Schema({
  story: {
    title: String,
    paragraphs: [String],
    image: String,
  },
  values: [
    {
      icon: String,
      title: String,
      description: String,
    },
  ],
  team: [
    {
      name: String,
      role: String,
      image: String,
      description: String,
      order: Number,
    },
  ],
  cta: {
    title: String,
    description: String,
    primaryButtonText: String,
    primaryButtonLink: String,
    secondaryButtonText: String,
    secondaryButtonLink: String,
  },
  seo: {
    title: String,
    description: String,
    keywords: [String],
  },
  isActive: Boolean,
});

const CompanyInfo =
  mongoose.models.CompanyInfo ||
  mongoose.model("CompanyInfo", CompanyInfoSchema);

async function seedCompanyInfo() {
  try {
    console.log("🔵 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if data already exists
    const existingInfo = await CompanyInfo.findOne({ isActive: true });

    if (existingInfo) {
      console.log("ℹ️  Company info already exists. Skipping seed.");
      console.log("📝 Existing data:", JSON.stringify(existingInfo, null, 2));
      return;
    }

    // Create default company info
    const defaultCompanyInfo = {
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
        keywords: [
          "wellness",
          "beauty",
          "spa",
          "salon",
          "about us",
          "team",
          "values",
          "mission",
        ],
      },
      isActive: true,
    };

    console.log("🔵 Creating company info...");
    const result = await CompanyInfo.create(defaultCompanyInfo);
    console.log("✅ Company info seeded successfully!");
    console.log("📝 Created document ID:", result._id);
  } catch (error) {
    console.error("❌ Error seeding company info:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("🔵 MongoDB connection closed");
  }
}

// Run the seed function
seedCompanyInfo()
  .then(() => {
    console.log("✅ Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
