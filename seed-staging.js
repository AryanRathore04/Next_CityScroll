#!/usr/bin/env node

/**
 * Staging Database Seeding Script
 *
 * IMPORTANT: Do you already have Mongoose models defined in your project?
 *
 * - If YES: Uncomment the import lines below and comment out the temporary schema definitions
 * - If NO: Keep the temporary schemas (they're defined below)
 *
 * Example imports if you have existing models:
 * const Salon = require('./models/Salon');
 * const Staff = require('./models/Staff');
 * const Service = require('./models/Service');
 */

const mongoose = require("mongoose");

// MongoDB Connection String (modify if needed)
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/salon-staging";

// ========================================
// TEMPORARY SCHEMAS (Use if no existing models)
// ========================================
// Comment these out if you're importing existing models from your project

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number, default: 60 }, // minutes
  description: { type: String, default: "" },
});

const StaffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  specialties: [String],
  availability: {
    type: Map,
    of: [
      {
        start: String, // e.g., "09:00"
        end: String, // e.g., "17:00"
      },
    ],
  },
});

const SalonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  website: { type: String },
  description: { type: String },
  timezone: { type: String, default: "Asia/Kolkata" },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviewCount: { type: Number, default: 0 },
  photos: [String],
  services: [ServiceSchema],
  staff: [StaffSchema],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create models from schemas
const Salon = mongoose.model("Salon", SalonSchema);
const Staff = mongoose.model("Staff", StaffSchema);
const Service = mongoose.model("Service", ServiceSchema);

// ========================================
// SAMPLE DATA
// ========================================

const sampleSalons = [
  {
    name: "Elite Beauty Lounge",
    address: "123 Fashion Street, Commercial Complex",
    city: "Mumbai",
    state: "Maharashtra",
    zipCode: "400001",
    phone: "+91-98765-43210",
    email: "contact@elitebeauty.com",
    website: "https://elitebeauty.com",
    description:
      "Premium beauty salon offering luxury treatments with expert stylists and the latest beauty technology.",
    timezone: "Asia/Kolkata",
    rating: 4.5,
    reviewCount: 127,
    photos: [
      "elite-salon-front.jpg",
      "elite-interior-1.jpg",
      "elite-treatment-room.jpg",
    ],
    services: [
      {
        name: "Classic Haircut & Styling",
        price: 800,
        duration: 60,
        description: "Professional haircut with wash and styling",
      },
      {
        name: "Hair Color & Highlights",
        price: 2500,
        duration: 180,
        description: "Complete hair coloring with highlights and styling",
      },
      {
        name: "Facial Treatment (Deep Cleansing)",
        price: 1200,
        duration: 90,
        description: "Deep cleansing facial with extraction and moisturizing",
      },
      {
        name: "Manicure & Pedicure",
        price: 900,
        duration: 75,
        description: "Complete nail care with polish and hand/foot massage",
      },
    ],
    staff: [
      {
        name: "Priya Sharma",
        role: "Senior Hair Stylist",
        email: "priya@elitebeauty.com",
        phone: "+91-98765-43211",
        specialties: ["Hair Cutting", "Hair Coloring", "Wedding Styling"],
        availability: new Map([
          ["monday", [{ start: "09:00", end: "17:00" }]],
          ["tuesday", [{ start: "09:00", end: "17:00" }]],
          ["wednesday", [{ start: "09:00", end: "17:00" }]],
          ["thursday", [{ start: "09:00", end: "17:00" }]],
          ["friday", [{ start: "09:00", end: "17:00" }]],
          ["saturday", [{ start: "10:00", end: "18:00" }]],
        ]),
      },
      {
        name: "Ankit Verma",
        role: "Beauty Therapist",
        email: "ankit@elitebeauty.com",
        phone: "+91-98765-43212",
        specialties: ["Facial Treatments", "Skin Care", "Massage Therapy"],
        availability: new Map([
          ["tuesday", [{ start: "10:00", end: "18:00" }]],
          ["wednesday", [{ start: "10:00", end: "18:00" }]],
          ["thursday", [{ start: "10:00", end: "18:00" }]],
          ["friday", [{ start: "10:00", end: "18:00" }]],
          ["saturday", [{ start: "09:00", end: "17:00" }]],
          ["sunday", [{ start: "11:00", end: "16:00" }]],
        ]),
      },
    ],
    isActive: true,
  },
  {
    name: "Glamour Studio & Spa",
    address: "456 Park Avenue, Sector 15",
    city: "Noida",
    state: "Uttar Pradesh",
    zipCode: "201301",
    phone: "+91-98765-54321",
    email: "info@glamourstudio.com",
    website: "https://glamourstudio.com",
    description:
      "Modern salon and spa offering comprehensive beauty services in a relaxing environment with skilled professionals.",
    timezone: "Asia/Kolkata",
    rating: 4.2,
    reviewCount: 89,
    photos: [
      "glamour-reception.jpg",
      "glamour-spa-room.jpg",
      "glamour-salon-area.jpg",
      "glamour-equipment.jpg",
    ],
    services: [
      {
        name: "Premium Haircut & Blow Dry",
        price: 600,
        duration: 45,
        description: "Stylish haircut with professional blow dry and finishing",
      },
      {
        name: "Bridal Makeup Package",
        price: 4500,
        duration: 240,
        description: "Complete bridal makeup with hair styling and draping",
      },
      {
        name: "Full Body Massage (Swedish)",
        price: 2000,
        duration: 120,
        description: "Relaxing full body massage using premium oils",
      },
      {
        name: "Eyebrow Threading & Shaping",
        price: 150,
        duration: 20,
        description: "Professional eyebrow threading and shaping",
      },
      {
        name: "Hair Spa Treatment",
        price: 1500,
        duration: 90,
        description:
          "Nourishing hair spa with deep conditioning and scalp massage",
      },
    ],
    staff: [
      {
        name: "Sneha Patel",
        role: "Makeup Artist & Hair Stylist",
        email: "sneha@glamourstudio.com",
        phone: "+91-98765-54322",
        specialties: ["Bridal Makeup", "Party Makeup", "Hair Styling"],
        availability: new Map([
          ["monday", [{ start: "10:00", end: "19:00" }]],
          ["tuesday", [{ start: "10:00", end: "19:00" }]],
          ["wednesday", [{ start: "10:00", end: "19:00" }]],
          ["friday", [{ start: "10:00", end: "19:00" }]],
          ["saturday", [{ start: "09:00", end: "20:00" }]],
          ["sunday", [{ start: "10:00", end: "18:00" }]],
        ]),
      },
      {
        name: "Rajesh Kumar",
        role: "Massage Therapist",
        email: "rajesh@glamourstudio.com",
        phone: "+91-98765-54323",
        specialties: ["Swedish Massage", "Deep Tissue", "Aromatherapy"],
        availability: new Map([
          ["monday", [{ start: "11:00", end: "18:00" }]],
          ["tuesday", [{ start: "11:00", end: "18:00" }]],
          ["wednesday", [{ start: "11:00", end: "18:00" }]],
          ["thursday", [{ start: "11:00", end: "18:00" }]],
          ["saturday", [{ start: "10:00", end: "17:00" }]],
        ]),
      },
      {
        name: "Kavita Singh",
        role: "Beauty Specialist",
        email: "kavita@glamourstudio.com",
        phone: "+91-98765-54324",
        specialties: ["Threading", "Waxing", "Hair Spa", "Facials"],
        availability: new Map([
          ["monday", [{ start: "09:30", end: "17:30" }]],
          ["tuesday", [{ start: "09:30", end: "17:30" }]],
          ["wednesday", [{ start: "09:30", end: "17:30" }]],
          ["thursday", [{ start: "09:30", end: "17:30" }]],
          ["friday", [{ start: "09:30", end: "17:30" }]],
          ["saturday", [{ start: "09:00", end: "18:00" }]],
        ]),
      },
    ],
    isActive: true,
  },
];

// ========================================
// SEEDING FUNCTIONS
// ========================================

async function connectToDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully");
    console.log(`📍 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
}

async function clearExistingSalons() {
  try {
    console.log("🧹 Clearing existing salons...");
    const deleteResult = await Salon.deleteMany({});
    console.log(`🗑️  Removed ${deleteResult.deletedCount} existing salon(s)`);
  } catch (error) {
    console.error("❌ Error clearing salons:", error.message);
    throw error;
  }
}

async function seedSalons() {
  try {
    console.log("🌱 Seeding sample salons...");
    const insertedSalons = await Salon.insertMany(sampleSalons);
    console.log(`✅ Successfully inserted ${insertedSalons.length} salons:`);

    insertedSalons.forEach((salon, index) => {
      console.log(`   ${index + 1}. ${salon.name} (ID: ${salon._id})`);
      console.log(
        `      - ${salon.services.length} services, ${salon.staff.length} staff members`,
      );
      console.log(
        `      - Rating: ${salon.rating}/5.0 (${salon.reviewCount} reviews)`,
      );
    });

    return insertedSalons;
  } catch (error) {
    console.error("❌ Error seeding salons:", error.message);
    throw error;
  }
}

async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error disconnecting from MongoDB:", error.message);
  }
}

// ========================================
// MAIN EXECUTION
// ========================================

async function main() {
  console.log("🚀 Starting staging database seeding...\n");

  try {
    await connectToDatabase();
    await clearExistingSalons();
    const seededSalons = await seedSalons();

    console.log("\n🎉 Seeding completed successfully!");
    console.log(
      `📊 Summary: ${seededSalons.length} salons added to staging database`,
    );
    console.log("💡 You can now run your app and test with this sample data");

    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error("\n💥 Seeding failed:", error.message);
    console.error("🔍 Stack trace:", error.stack);

    await disconnectDatabase();
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error.message);
  console.error("🔍 Stack trace:", error.stack);
  process.exit(1);
});

// Run the seeding script
if (require.main === module) {
  main();
}
