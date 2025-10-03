const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

async function checkServices() {
  await mongoose.connect(process.env.MONGODB_URI);

  const Service = mongoose.model(
    "Service",
    new mongoose.Schema({}, { strict: false }),
  );
  const User = mongoose.model(
    "User",
    new mongoose.Schema({}, { strict: false }),
  );

  console.log("\n=== VENDORS ===");
  const vendors = await User.find({ userType: "vendor", status: "approved" })
    .limit(3)
    .lean();
  vendors.forEach((v) => {
    console.log(`ID: ${v._id}`);
    console.log(`Name: ${v.businessName}`);
    console.log(`City: ${v.businessAddress?.city || "N/A"}`);
    console.log("---");
  });

  console.log("\n=== SERVICES ===");
  const services = await Service.find().limit(5).lean();
  console.log(`Total services in DB: ${await Service.countDocuments()}`);
  services.forEach((s) => {
    console.log(`Service: ${s.name}`);
    console.log(`VendorId: ${s.vendorId} (type: ${typeof s.vendorId})`);
    console.log(`Price: ${s.price}`);
    console.log("---");
  });

  if (vendors.length > 0) {
    const testVendorId = vendors[0]._id.toString();
    console.log(`\n=== QUERY TEST: Services for vendor ${testVendorId} ===`);
    const vendorServices = await Service.find({
      vendorId: testVendorId,
    }).lean();
    console.log(`Found ${vendorServices.length} services`);
    if (vendorServices.length > 0) {
      console.log("Sample:", vendorServices[0].name);
    }
  }

  process.exit(0);
}

checkServices().catch(console.error);
