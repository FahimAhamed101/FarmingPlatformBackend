const mongoose = require("mongoose");

const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const VendorProfile = require("../src/models/VendorProfile");
const Produce = require("../src/models/Produce");
const RentalSpace = require("../src/models/RentalSpace");
const Order = require("../src/models/Order");
const CommunityPost = require("../src/models/CommunityPost");
const SustainabilityCert = require("../src/models/SustainabilityCert");
const PlantTrack = require("../src/models/PlantTrack");

const shouldDropDatabase = process.argv.includes("--drop");
const seedDomain = "seed.urbanfarm.local";

const adminPassword = "AdminPass123!";
const vendorPassword = "VendorPass123!";
const customerPassword = "CustomerPass123!";

const vendorBlueprints = [
  { farmName: "Skyline Greens", location: "Brooklyn, New York", coordinates: [-73.9442, 40.6782] },
  { farmName: "Metro Harvest Yard", location: "Queens, New York", coordinates: [-73.7949, 40.7282] },
  { farmName: "Rooftop Roots", location: "Jersey City, New Jersey", coordinates: [-74.0431, 40.7178] },
  { farmName: "Civic Soil Collective", location: "Chicago Loop, Illinois", coordinates: [-87.6298, 41.8781] },
  { farmName: "Lakefront Leaf Lab", location: "Evanston, Illinois", coordinates: [-87.6877, 42.0451] },
  { farmName: "Sunline Urban Acres", location: "Downtown Los Angeles, California", coordinates: [-118.2437, 34.0522] },
  { farmName: "Harbor Bloom Farm", location: "Long Beach, California", coordinates: [-118.1937, 33.7701] },
  { farmName: "Brickhouse Botanics", location: "Austin, Texas", coordinates: [-97.7431, 30.2672] },
  { farmName: "Canal Patch Gardens", location: "Houston, Texas", coordinates: [-95.3698, 29.7604] },
  { farmName: "Capitol Sprout Works", location: "Washington, DC", coordinates: [-77.0369, 38.9072] },
];

const productTemplates = [
  { name: "Organic Basil", category: "organic-produce", price: 4.25, description: "Fresh basil bunches grown without synthetic inputs." },
  { name: "Heirloom Tomato Box", category: "organic-produce", price: 8.5, description: "Color-rich heirloom tomatoes curated for local kitchens." },
  { name: "Microgreen Mix", category: "organic-produce", price: 5.75, description: "Tender microgreens harvested the same day they ship." },
  { name: "Pollinator Seed Pack", category: "seeds", price: 6.5, description: "Seed blend for balcony gardens and rooftop pollinator support." },
  { name: "Raised Bed Compost", category: "compost", price: 9.25, description: "Urban compost mix designed for containers and raised beds." },
  { name: "Hand Trowel", category: "tools", price: 11.0, description: "Compact steel trowel for small-space gardening." },
  { name: "Leafy Greens Basket", category: "organic-produce", price: 7.5, description: "Mixed lettuces, kale, and spinach from rooftop beds." },
  { name: "Natural Fertility Blend", category: "fertilizer", price: 10.75, description: "Slow-release organic nutrient blend for edible crops." },
  { name: "Pepper Starter Tray", category: "other", price: 12.0, description: "Healthy pepper seedlings ready for transplanting." },
  { name: "Cucumber Seedling Duo", category: "other", price: 8.0, description: "Two vigorous cucumber starts for patio trellises." },
];

const communityTopics = [
  { tags: ["compost", "soil-health"], content: "Quick tip: mix compost into containers a week before transplanting so the biology settles in." },
  { tags: ["watering", "balcony-garden"], content: "Morning watering worked better for my rooftop tomatoes than evening watering during the last heat wave." },
  { tags: ["pest-control", "organic"], content: "Neem and hand-picking kept aphids under control without stressing the basil." },
  { tags: ["seed-starting"], content: "Heat mats shortened germination time for peppers by almost half in our apartment setup." },
];

const plantStages = ["seeded", "germination", "vegetative", "flowering"];
const healthStates = ["excellent", "good", "good", "fair"];

const cleanExistingSeedData = async () => {
  const seedUsers = await User.find({ email: { $regex: `@${seedDomain}$`, $options: "i" } }).select("_id");
  const seedUserIds = seedUsers.map((user) => user._id);

  if (!seedUserIds.length) {
    return;
  }

  await Promise.all([
    VendorProfile.deleteMany({ userId: { $in: seedUserIds } }),
    Produce.deleteMany({ vendorId: { $in: seedUserIds } }),
    RentalSpace.deleteMany({ vendorId: { $in: seedUserIds } }),
    Order.deleteMany({
      $or: [{ userId: { $in: seedUserIds } }, { vendorId: { $in: seedUserIds } }],
    }),
    CommunityPost.deleteMany({ userId: { $in: seedUserIds } }),
    SustainabilityCert.deleteMany({ vendorId: { $in: seedUserIds } }),
    PlantTrack.deleteMany({
      $or: [{ userId: { $in: seedUserIds } }, { vendorId: { $in: seedUserIds } }],
    }),
    User.deleteMany({ _id: { $in: seedUserIds } }),
  ]);
};

const createAdmin = async () => {
  return User.create({
    name: "Platform Admin",
    email: `admin@${seedDomain}`,
    password: adminPassword,
    role: "admin",
    status: "active",
  });
};

const createVendors = async () => {
  const vendors = [];

  for (let index = 0; index < vendorBlueprints.length; index += 1) {
    const vendorData = vendorBlueprints[index];
    const vendorUser = await User.create({
      name: `${vendorData.farmName} Owner`,
      email: `vendor${String(index + 1).padStart(2, "0")}@${seedDomain}`,
      password: vendorPassword,
      role: "vendor",
      status: "active",
    });

    const vendorProfile = await VendorProfile.create({
      userId: vendorUser._id,
      farmName: vendorData.farmName,
      certificationStatus: "approved",
      farmLocation: vendorData.location,
      farmGeo: {
        type: "Point",
        coordinates: vendorData.coordinates,
      },
      description: `${vendorData.farmName} specializes in dense-city growing, compost-first soil management, and neighborhood food access.`,
    });

    await SustainabilityCert.create({
      vendorId: vendorUser._id,
      certifyingAgency: "Urban Organic Standards Council",
      certificationDate: new Date("2026-01-15T00:00:00.000Z"),
      certificateId: `UOSC-${String(index + 1).padStart(4, "0")}`,
      documentUrl: `https://example.org/certs/vendor-${index + 1}.pdf`,
      status: "approved",
      reviewNote: "Seed data certification approved for demonstration.",
    });

    for (let spaceIndex = 0; spaceIndex < 2; spaceIndex += 1) {
      await RentalSpace.create({
        vendorId: vendorUser._id,
        locationLabel: `${vendorData.farmName} Plot ${spaceIndex + 1}`,
        geoLocation: {
          type: "Point",
          coordinates: vendorData.coordinates,
        },
        size: 18 + index + spaceIndex * 4,
        price: 95 + index * 8 + spaceIndex * 10,
        availability: true,
        description: `Managed raised-bed plot ${spaceIndex + 1} at ${vendorData.farmName}.`,
      });
    }

    vendors.push({ user: vendorUser, profile: vendorProfile });
  }

  return vendors;
};

const createCustomers = async (count = 12) => {
  const customers = [];

  for (let index = 0; index < count; index += 1) {
    const customer = await User.create({
      name: `Customer ${index + 1}`,
      email: `customer${String(index + 1).padStart(2, "0")}@${seedDomain}`,
      password: customerPassword,
      role: "customer",
      status: "active",
    });

    customers.push(customer);
  }

  return customers;
};

const createProducts = async (vendors) => {
  const products = [];

  for (let vendorIndex = 0; vendorIndex < vendors.length; vendorIndex += 1) {
    const vendor = vendors[vendorIndex];

    for (let productIndex = 0; productIndex < productTemplates.length; productIndex += 1) {
      const template = productTemplates[productIndex];
      const produce = await Produce.create({
        vendorId: vendor.user._id,
        name: `${template.name} ${vendorIndex + 1}-${productIndex + 1}`,
        description: `${template.description} Supplied by ${vendor.profile.farmName}.`,
        price: Number((template.price + vendorIndex * 0.35).toFixed(2)),
        category: template.category,
        certificationStatus: "approved",
        availableQuantity: 20 + vendorIndex + productIndex,
        isActive: true,
      });

      products.push(produce);
    }
  }

  return products;
};

const createOrders = async (customers, products) => {
  const orders = [];

  for (let index = 0; index < 20; index += 1) {
    const customer = customers[index % customers.length];
    const product = products[index];
    const quantity = (index % 3) + 1;

    const order = await Order.create({
      userId: customer._id,
      produceId: product._id,
      vendorId: product.vendorId,
      quantity,
      totalPrice: Number((product.price * quantity).toFixed(2)),
      status: index % 4 === 0 ? "delivered" : "confirmed",
      orderDate: new Date(Date.now() - index * 86400000),
    });

    product.availableQuantity = Math.max(product.availableQuantity - quantity, 0);
    await product.save();

    orders.push(order);
  }

  return orders;
};

const createCommunityPosts = async (customers, vendors) => {
  const authors = [...customers.slice(0, 8), ...vendors.slice(0, 4).map((vendor) => vendor.user)];
  const posts = [];

  for (let index = 0; index < authors.length; index += 1) {
    const topic = communityTopics[index % communityTopics.length];
    const post = await CommunityPost.create({
      userId: authors[index]._id,
      postContent: `${topic.content} Post #${index + 1}.`,
      tags: topic.tags,
      postDate: new Date(Date.now() - index * 3600000),
    });

    posts.push(post);
  }

  return posts;
};

const createPlantTracks = async (customers, vendors, rentalSpaces) => {
  const tracks = [];

  for (let index = 0; index < 15; index += 1) {
    const customer = customers[index % customers.length];
    const vendor = vendors[index % vendors.length];
    const rentalSpace = rentalSpaces[index % rentalSpaces.length];
    const stage = plantStages[index % plantStages.length];
    const healthStatus = healthStates[index % healthStates.length];

    const track = await PlantTrack.create({
      userId: customer._id,
      vendorId: vendor.user._id,
      rentalSpaceId: rentalSpace._id,
      plantName: `Tracked Plant ${index + 1}`,
      stage,
      healthStatus,
      expectedHarvestDate: new Date(Date.now() + (index + 20) * 86400000),
      lastUpdatedAt: new Date(),
      updates: [
        {
          note: "Initial seed data tracking entry.",
          stage,
          healthStatus,
          createdAt: new Date(),
        },
      ],
    });

    tracks.push(track);
  }

  return tracks;
};

const run = async () => {
  try {
    await connectDB();

    if (shouldDropDatabase) {
      await mongoose.connection.dropDatabase();
    } else {
      await cleanExistingSeedData();
    }

    const admin = await createAdmin();
    const vendors = await createVendors();
    const customers = await createCustomers();
    const products = await createProducts(vendors);
    const rentalSpaces = await RentalSpace.find({ vendorId: { $in: vendors.map((vendor) => vendor.user._id) } });
    const orders = await createOrders(customers, products);
    const communityPosts = await createCommunityPosts(customers, vendors);
    const plantTracks = await createPlantTracks(customers, vendors, rentalSpaces);

    const summary = {
      admins: 1,
      vendors: vendors.length,
      customers: customers.length,
      products: products.length,
      rentalSpaces: rentalSpaces.length,
      orders: orders.length,
      communityPosts: communityPosts.length,
      plantTracks: plantTracks.length,
    };

    console.log("Seed completed successfully.");
    console.table(summary);
    console.log("Seed credentials:");
    console.log(`- Admin: admin@${seedDomain} / ${adminPassword}`);
    console.log(`- Vendors: vendor01@${seedDomain} .. vendor10@${seedDomain} / ${vendorPassword}`);
    console.log(`- Customers: customer01@${seedDomain} .. customer12@${seedDomain} / ${customerPassword}`);
    console.log(`Primary admin id: ${admin._id}`);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
