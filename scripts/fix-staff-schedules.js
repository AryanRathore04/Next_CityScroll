/**
 * Fix Staff Schedules Script
 *
 * This script updates all staff members who don't have a schedule set
 * with the default schedule (Monday-Saturday 9AM-6PM, Sunday off)
 */

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const mongoose = require("mongoose");

// MongoDB connection string from environment
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI environment variable is not set!");
  console.error("Please set MONGODB_URI in your .env.local file");
  process.exit(1);
}

// Default schedule for staff members
const defaultStaffSchedule = {
  monday: {
    isAvailable: true,
    startTime: "09:00",
    endTime: "18:00",
    breaks: [{ startTime: "13:00", endTime: "14:00" }],
  },
  tuesday: {
    isAvailable: true,
    startTime: "09:00",
    endTime: "18:00",
    breaks: [{ startTime: "13:00", endTime: "14:00" }],
  },
  wednesday: {
    isAvailable: true,
    startTime: "09:00",
    endTime: "18:00",
    breaks: [{ startTime: "13:00", endTime: "14:00" }],
  },
  thursday: {
    isAvailable: true,
    startTime: "09:00",
    endTime: "18:00",
    breaks: [{ startTime: "13:00", endTime: "14:00" }],
  },
  friday: {
    isAvailable: true,
    startTime: "09:00",
    endTime: "18:00",
    breaks: [{ startTime: "13:00", endTime: "14:00" }],
  },
  saturday: {
    isAvailable: true,
    startTime: "09:00",
    endTime: "17:00",
    breaks: [{ startTime: "13:00", endTime: "14:00" }],
  },
  sunday: {
    isAvailable: false,
    startTime: "09:00",
    endTime: "17:00",
    breaks: [],
  },
};

async function fixStaffSchedules() {
  try {
    console.log("🔵 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get Staff model
    const Staff = mongoose.model(
      "Staff",
      new mongoose.Schema({}, { strict: false }),
    );

    // Find all staff without schedule or with incomplete schedule
    console.log("\n🔍 Finding staff members without schedules...");
    const staffWithoutSchedule = await Staff.find({
      $or: [
        { schedule: { $exists: false } },
        { schedule: null },
        { "schedule.monday": { $exists: false } },
      ],
    });

    console.log(
      `📊 Found ${staffWithoutSchedule.length} staff members without schedules`,
    );

    if (staffWithoutSchedule.length === 0) {
      console.log("✅ All staff members already have schedules!");
      return;
    }

    // Update each staff member
    console.log("\n🔧 Updating staff schedules...");
    let updated = 0;
    let failed = 0;

    for (const staff of staffWithoutSchedule) {
      try {
        await Staff.updateOne(
          { _id: staff._id },
          { $set: { schedule: defaultStaffSchedule } },
        );
        console.log(
          `  ✅ Updated schedule for: ${staff.firstName} ${staff.lastName} (${staff._id})`,
        );
        updated++;
      } catch (error) {
        console.error(
          `  ❌ Failed to update ${staff.firstName} ${staff.lastName}:`,
          error.message,
        );
        failed++;
      }
    }

    console.log("\n📊 Summary:");
    console.log(`  ✅ Successfully updated: ${updated}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📝 Total processed: ${staffWithoutSchedule.length}`);

    // Show updated staff
    console.log("\n🔍 Verifying updates...");
    const allStaff = await Staff.find({}).select("firstName lastName schedule");
    console.log(`\n📋 All staff members (${allStaff.length} total):`);

    for (const staff of allStaff) {
      const hasSchedule = staff.schedule && staff.schedule.monday;
      const status = hasSchedule ? "✅" : "❌";
      console.log(
        `  ${status} ${staff.firstName} ${staff.lastName} - Schedule: ${
          hasSchedule ? "Set" : "Missing"
        }`,
      );
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("\n🔵 Disconnected from MongoDB");
  }
}

// Run the script
console.log("=".repeat(60));
console.log("🚀 Fix Staff Schedules Script");
console.log("=".repeat(60));

fixStaffSchedules()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
