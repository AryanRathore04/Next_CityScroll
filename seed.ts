import { faker } from "@faker-js/faker";
import mongoose from "mongoose";
import { config } from "dotenv";
import * as bcrypt from "bcryptjs";

// Load environment variables
config({ path: ".env.local" });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// Define schemas (simplified versions)
const UserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    password: String,
    userType: { type: String, enum: ["customer", "vendor", "admin"] },
    businessName: String,
    businessType: String,
    businessAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    verified: Boolean,
    status: {
      type: String,
      enum: ["active", "pending_approval", "approved", "rejected", "suspended"],
    },
    rating: Number,
    totalBookings: Number,
    profileImage: String,
    description: String,
    images: [String],
  },
  { timestamps: true },
);

const ServiceSchema = new mongoose.Schema(
  {
    vendorId: String,
    name: String,
    description: String,
    price: Number,
    duration: Number,
    category: String,
    isActive: Boolean,
    images: [String],
  },
  { timestamps: true },
);

const StaffSchema = new mongoose.Schema(
  {
    vendorId: String,
    name: String,
    position: String,
    email: String,
    phone: String,
    serviceIds: [String],
    schedule: {
      monday: { available: Boolean, startTime: String, endTime: String },
      tuesday: { available: Boolean, startTime: String, endTime: String },
      wednesday: { available: Boolean, startTime: String, endTime: String },
      thursday: { available: Boolean, startTime: String, endTime: String },
      friday: { available: Boolean, startTime: String, endTime: String },
      saturday: { available: Boolean, startTime: String, endTime: String },
      sunday: { available: Boolean, startTime: String, endTime: String },
    },
    isActive: Boolean,
  },
  { timestamps: true },
);

const BookingSchema = new mongoose.Schema(
  {
    customerId: String,
    vendorId: String,
    serviceId: String,
    staffId: String,
    datetime: Date,
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
    },
    notes: String,
    totalPrice: Number,
  },
  { timestamps: true },
);

const ReviewSchema = new mongoose.Schema(
  {
    bookingId: String,
    customerId: String,
    vendorId: String,
    serviceId: String,
    rating: Number,
    comment: String,
    isAnonymous: Boolean,
    status: { type: String, enum: ["pending", "published", "hidden"] },
    vendorResponse: {
      message: String,
      respondedAt: Date,
    },
  },
  { timestamps: true },
);

// Models
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Service =
  mongoose.models.Service || mongoose.model("Service", ServiceSchema);
const Staff = mongoose.models.Staff || mongoose.model("Staff", StaffSchema);
const Booking =
  mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

// Utility functions
const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

const getRandomElements = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Service categories and names
const serviceCategories = [
  {
    category: "Hair Care",
    services: [
      "Men's Haircut",
      "Women's Haircut",
      "Hair Coloring",
      "Highlights",
      "Keratin Treatment",
      "Hair Spa",
    ],
  },
  {
    category: "Spa & Massage",
    services: [
      "Deep Tissue Massage",
      "Swedish Massage",
      "Hot Stone Therapy",
      "Aromatherapy",
      "Body Scrub",
      "Facial",
    ],
  },
  {
    category: "Beauty",
    services: [
      "Makeup",
      "Bridal Makeup",
      "Party Makeup",
      "Facial Treatment",
      "Skin Treatment",
      "Anti-Aging Treatment",
    ],
  },
  {
    category: "Nails",
    services: [
      "Manicure",
      "Pedicure",
      "Gel Nails",
      "Nail Art",
      "Acrylic Nails",
      "Nail Extensions",
    ],
  },
  {
    category: "Wellness",
    services: [
      "Yoga Session",
      "Meditation",
      "Nutrition Consultation",
      "Spa Package",
      "Detox Treatment",
      "Body Wrap",
    ],
  },
];

const cities = [
  { city: "Mumbai", state: "Maharashtra" },
  { city: "Delhi", state: "Delhi" },
  { city: "Bangalore", state: "Karnataka" },
  { city: "Hyderabad", state: "Telangana" },
  { city: "Chennai", state: "Tamil Nadu" },
  { city: "Kolkata", state: "West Bengal" },
  { city: "Pune", state: "Maharashtra" },
  { city: "Ahmedabad", state: "Gujarat" },
];

const salonImages = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800",
  "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=800",
  "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=800",
];

async function seed() {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await User.deleteMany({});
    await Service.deleteMany({});
    await Staff.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    console.log("✅ Existing data cleared");

    // Create Admin User
    console.log("👤 Creating admin user...");
    const adminPassword = await hashPassword("Admin@123456");
    const admin = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@beautybook.com",
      phone: "+911234567890",
      password: adminPassword,
      userType: "admin",
      verified: true,
      status: "active",
    });
    console.log("✅ Admin created:", admin.email);

    // Create Vendor Users
    console.log("🏢 Creating vendor users...");
    const vendors: any[] = [];
    const vendorStatuses: ("approved" | "pending_approval")[] = [
      "approved",
      "approved",
      "approved",
      "pending_approval",
      "pending_approval",
    ];

    for (let i = 0; i < 5; i++) {
      const location = cities[i % cities.length];
      const businessTypes = [
        "Salon",
        "Spa",
        "Wellness Center",
        "Beauty Studio",
        "Massage Parlor",
      ];
      const businessType = businessTypes[i % businessTypes.length];

      const vendorPassword = await hashPassword("Vendor@123456");
      const vendor = await User.create({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: `vendor${i + 1}@beautybook.com`,
        phone: `+91${faker.string.numeric(10)}`,
        password: vendorPassword,
        userType: "vendor",
        businessName: `${faker.company.name()} ${businessType}`,
        businessType: businessType,
        businessAddress: {
          street: faker.location.streetAddress(),
          city: location.city,
          state: location.state,
          zipCode: faker.location.zipCode(),
        },
        description: `${faker.lorem.paragraph(3)}\n\n${faker.lorem.paragraph(
          2,
        )}\n\n${faker.lorem.paragraph(2)}`,
        verified: vendorStatuses[i] === "approved",
        status: vendorStatuses[i],
        rating:
          vendorStatuses[i] === "approved"
            ? parseFloat((4 + Math.random()).toFixed(1))
            : 0,
        totalBookings:
          vendorStatuses[i] === "approved"
            ? faker.number.int({ min: 10, max: 200 })
            : 0,
        profileImage: salonImages[i % salonImages.length],
        images: getRandomElements(salonImages, 5),
      });

      vendors.push(vendor);
      console.log(
        `✅ Vendor created: ${vendor.businessName} (${vendor.status})`,
      );
    }

    const approvedVendors = vendors.filter((v) => v.status === "approved");

    // Create Customer Users
    console.log("👥 Creating customer users...");
    const customers: any[] = [];
    for (let i = 0; i < 14; i++) {
      const customerPassword = await hashPassword("Customer@123456");
      const customer = await User.create({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: `customer${i + 1}@example.com`,
        phone: `+91${faker.string.numeric(10)}`,
        password: customerPassword,
        userType: "customer",
        verified: true,
        status: "active",
      });
      customers.push(customer);
    }
    console.log(`✅ Created ${customers.length} customers`);

    // Create Services for each approved vendor
    console.log("💅 Creating services...");
    const allServices: any[] = [];

    for (const vendor of approvedVendors) {
      const vendorServices: any[] = [];
      const categoryPool = getRandomElements(serviceCategories, 3);

      for (const categoryData of categoryPool) {
        const servicesToCreate = getRandomElements(categoryData.services, 2);

        for (const serviceName of servicesToCreate) {
          const service = await Service.create({
            vendorId: vendor._id.toString(),
            name: serviceName,
            description: faker.lorem.sentence(10),
            price: faker.number.int({ min: 500, max: 5000 }),
            duration: faker.helpers.arrayElement([30, 45, 60, 75, 90, 120]),
            category: categoryData.category,
            isActive: true,
            images: getRandomElements(salonImages, 2),
          });
          vendorServices.push(service);
          allServices.push(service);
        }
      }

      console.log(
        `✅ Created ${vendorServices.length} services for ${vendor.businessName}`,
      );
    }

    // Create Staff for each approved vendor
    console.log("👨‍💼 Creating staff members...");
    const allStaff: any[] = [];

    const scheduleTemplates = [
      // Mon-Fri 9-6
      {
        monday: { available: true, startTime: "09:00", endTime: "18:00" },
        tuesday: { available: true, startTime: "09:00", endTime: "18:00" },
        wednesday: { available: true, startTime: "09:00", endTime: "18:00" },
        thursday: { available: true, startTime: "09:00", endTime: "18:00" },
        friday: { available: true, startTime: "09:00", endTime: "18:00" },
        saturday: { available: false, startTime: "", endTime: "" },
        sunday: { available: false, startTime: "", endTime: "" },
      },
      // Wed-Sun 10-7
      {
        monday: { available: false, startTime: "", endTime: "" },
        tuesday: { available: false, startTime: "", endTime: "" },
        wednesday: { available: true, startTime: "10:00", endTime: "19:00" },
        thursday: { available: true, startTime: "10:00", endTime: "19:00" },
        friday: { available: true, startTime: "10:00", endTime: "19:00" },
        saturday: { available: true, startTime: "10:00", endTime: "19:00" },
        sunday: { available: true, startTime: "10:00", endTime: "19:00" },
      },
      // All week 8-8
      {
        monday: { available: true, startTime: "08:00", endTime: "20:00" },
        tuesday: { available: true, startTime: "08:00", endTime: "20:00" },
        wednesday: { available: true, startTime: "08:00", endTime: "20:00" },
        thursday: { available: true, startTime: "08:00", endTime: "20:00" },
        friday: { available: true, startTime: "08:00", endTime: "20:00" },
        saturday: { available: true, startTime: "08:00", endTime: "20:00" },
        sunday: { available: true, startTime: "08:00", endTime: "20:00" },
      },
    ];

    for (const vendor of approvedVendors) {
      const vendorServices = allServices.filter(
        (s) => s.vendorId.toString() === vendor._id.toString(),
      );
      const staffCount = faker.number.int({ min: 2, max: 3 });

      for (let i = 0; i < staffCount; i++) {
        const staffServices = getRandomElements(
          vendorServices,
          faker.number.int({ min: 2, max: vendorServices.length }),
        );

        const staff = await Staff.create({
          vendorId: vendor._id.toString(),
          name: faker.person.fullName(),
          position: faker.helpers.arrayElement([
            "Senior Stylist",
            "Massage Therapist",
            "Beauty Expert",
            "Nail Technician",
            "Spa Specialist",
          ]),
          email: faker.internet.email(),
          phone: `+91${faker.string.numeric(10)}`,
          serviceIds: staffServices.map((s) => s._id.toString()),
          schedule: scheduleTemplates[i % scheduleTemplates.length],
          isActive: true,
        });

        allStaff.push(staff);
      }

      console.log(
        `✅ Created ${staffCount} staff members for ${vendor.businessName}`,
      );
    }

    // Create Bookings
    console.log("📅 Creating bookings...");
    const bookings: any[] = [];

    for (let i = 0; i < 40; i++) {
      const vendor = faker.helpers.arrayElement(approvedVendors);
      const vendorServices = allServices.filter(
        (s) => s.vendorId.toString() === vendor._id.toString(),
      );
      const service = faker.helpers.arrayElement(vendorServices);
      const vendorStaff = allStaff.filter(
        (s) => s.vendorId.toString() === vendor._id.toString(),
      );
      const staff = faker.helpers.arrayElement(vendorStaff);
      const customer = faker.helpers.arrayElement(customers);

      // Mix of past, present, and future bookings
      let bookingDate: Date;
      let status: "pending" | "confirmed" | "completed" | "cancelled";

      if (i < 15) {
        // Past bookings (completed or cancelled)
        bookingDate = faker.date.past({ years: 0.5 });
        status = faker.helpers.arrayElement([
          "completed",
          "completed",
          "completed",
          "cancelled",
        ]);
      } else if (i < 25) {
        // Recent/today bookings
        bookingDate = faker.date.recent({ days: 3 });
        status = faker.helpers.arrayElement(["confirmed", "completed"]);
      } else {
        // Future bookings
        bookingDate = faker.date.soon({ days: 30 });
        status = "confirmed";
      }

      const booking = await Booking.create({
        customerId: customer._id.toString(),
        vendorId: vendor._id.toString(),
        serviceId: service._id.toString(),
        staffId: staff._id.toString(),
        datetime: bookingDate,
        status: status,
        notes:
          faker.helpers.maybe(() => faker.lorem.sentence(), {
            probability: 0.3,
          }) || "",
        totalPrice: service.price,
      });

      bookings.push(booking);
    }
    console.log(`✅ Created ${bookings.length} bookings`);

    // Create Reviews for completed bookings
    console.log("⭐ Creating reviews...");
    const completedBookings = bookings.filter((b) => b.status === "completed");
    const reviewsToCreate = Math.min(15, completedBookings.length);
    const bookingsToReview = getRandomElements(
      completedBookings,
      reviewsToCreate,
    );

    for (const booking of bookingsToReview) {
      const rating = faker.helpers.arrayElement([5, 5, 5, 4, 4, 4, 3, 2]); // Skewed toward positive

      const reviewComments = [
        "Excellent service! The staff was professional and friendly.",
        "Great experience, would definitely come back again.",
        "Very satisfied with the results. Highly recommended!",
        "Good service but a bit pricey.",
        "The ambiance was nice and relaxing.",
        "Staff was courteous and the service was on time.",
        "Amazing results! Exceeded my expectations.",
        "Decent service, nothing extraordinary.",
        "Will definitely recommend to friends and family.",
        "Professional and hygienic environment.",
      ];

      const review = await Review.create({
        bookingId: booking._id.toString(),
        customerId: booking.customerId.toString(),
        vendorId: booking.vendorId.toString(),
        serviceId: booking.serviceId.toString(),
        rating: rating,
        comment: faker.helpers.arrayElement(reviewComments),
        isAnonymous: faker.datatype.boolean(),
        status: "published",
        vendorResponse: faker.helpers.maybe(
          () => ({
            message:
              "Thank you for your feedback! We appreciate your business.",
            respondedAt: faker.date.recent({ days: 5 }),
          }),
          { probability: 0.4 },
        ),
      });

      console.log(`✅ Created review (${rating}⭐) for booking ${booking._id}`);
    }

    console.log("\n🎉 Database seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - Admin Users: 1`);
    console.log(
      `   - Vendor Users: ${vendors.length} (${approvedVendors.length} approved)`,
    );
    console.log(`   - Customer Users: ${customers.length}`);
    console.log(`   - Services: ${allServices.length}`);
    console.log(`   - Staff: ${allStaff.length}`);
    console.log(`   - Bookings: ${bookings.length}`);
    console.log(`   - Reviews: ${reviewsToCreate}`);
    console.log("\n💡 Test Credentials:");
    console.log("   Admin: admin@beautybook.com / Admin@123456");
    console.log("   Vendor: vendor1@beautybook.com / Vendor@123456");
    console.log("   Customer: customer1@example.com / Customer@123456");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log("✅ Seeding process finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding process failed:", error);
    process.exit(1);
  });
