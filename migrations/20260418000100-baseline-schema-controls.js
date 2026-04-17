const now = new Date("2026-04-18T00:00:00.000Z");

const dropIndexIfExists = async (collection, indexName) => {
  try {
    await collection.dropIndex(indexName);
  } catch (error) {
    const safeErrors = [
      "index not found",
      "ns not found",
      "namespace not found",
    ];

    if (!safeErrors.some((message) => error.message.toLowerCase().includes(message))) {
      throw error;
    }
  }
};

module.exports = {
  async up(db) {
    const users = db.collection("users");
    const vendorProfiles = db.collection("vendorprofiles");
    const produces = db.collection("produces");
    const rentalSpaces = db.collection("rentalspaces");
    const rentalBookings = db.collection("rentalbookings");
    const orders = db.collection("orders");
    const communityPosts = db.collection("communityposts");
    const sustainabilityCerts = db.collection("sustainabilitycerts");
    const plantTracks = db.collection("planttracks");

    await Promise.all([
      users.updateMany({ status: { $exists: false } }, { $set: { status: "active" } }),
      users.updateMany({ createdAt: { $exists: false } }, { $set: { createdAt: now } }),
      vendorProfiles.updateMany(
        { certificationStatus: { $exists: false } },
        { $set: { certificationStatus: "pending" } }
      ),
      vendorProfiles.updateMany({ description: { $exists: false } }, { $set: { description: "" } }),
      produces.updateMany(
        { certificationStatus: { $exists: false } },
        { $set: { certificationStatus: "pending" } }
      ),
      produces.updateMany({ availableQuantity: { $exists: false } }, { $set: { availableQuantity: 0 } }),
      produces.updateMany({ isActive: { $exists: false } }, { $set: { isActive: true } }),
      rentalSpaces.updateMany({ availability: { $exists: false } }, { $set: { availability: true } }),
      rentalBookings.updateMany({ status: { $exists: false } }, { $set: { status: "pending" } }),
      orders.updateMany({ status: { $exists: false } }, { $set: { status: "pending" } }),
      orders.updateMany({ orderDate: { $exists: false } }, { $set: { orderDate: now } }),
      communityPosts.updateMany({ tags: { $exists: false } }, { $set: { tags: [] } }),
      communityPosts.updateMany({ postDate: { $exists: false } }, { $set: { postDate: now } }),
      sustainabilityCerts.updateMany({ status: { $exists: false } }, { $set: { status: "pending" } }),
      sustainabilityCerts.updateMany({ reviewNote: { $exists: false } }, { $set: { reviewNote: "" } }),
      plantTracks.updateMany({ updates: { $exists: false } }, { $set: { updates: [] } }),
      plantTracks.updateMany({ lastUpdatedAt: { $exists: false } }, { $set: { lastUpdatedAt: now } }),
    ]);

    await Promise.all([
      users.createIndex({ email: 1 }, { name: "email_unique", unique: true }),
      users.createIndex({ role: 1, status: 1 }, { name: "role_status_idx" }),
      vendorProfiles.createIndex({ userId: 1 }, { name: "vendor_user_unique", unique: true }),
      vendorProfiles.createIndex({ certificationStatus: 1 }, { name: "vendor_certification_idx" }),
      vendorProfiles.createIndex({ farmGeo: "2dsphere" }, { name: "vendor_farm_geo_idx" }),
      produces.createIndex({ vendorId: 1, category: 1 }, { name: "produce_vendor_category_idx" }),
      produces.createIndex(
        { certificationStatus: 1, isActive: 1, createdAt: -1 },
        { name: "produce_listing_idx" }
      ),
      rentalSpaces.createIndex({ vendorId: 1, availability: 1 }, { name: "rental_vendor_availability_idx" }),
      rentalSpaces.createIndex({ geoLocation: "2dsphere" }, { name: "rental_geo_idx" }),
      rentalBookings.createIndex(
        { rentalSpaceId: 1, status: 1, startDate: 1, endDate: 1 },
        { name: "booking_conflict_idx" }
      ),
      rentalBookings.createIndex({ userId: 1, createdAt: -1 }, { name: "booking_user_recent_idx" }),
      orders.createIndex({ userId: 1, orderDate: -1 }, { name: "order_user_recent_idx" }),
      orders.createIndex({ vendorId: 1, orderDate: -1 }, { name: "order_vendor_recent_idx" }),
      communityPosts.createIndex({ postDate: -1 }, { name: "community_post_date_idx" }),
      sustainabilityCerts.createIndex({ vendorId: 1, status: 1 }, { name: "sustainability_vendor_status_idx" }),
      plantTracks.createIndex({ userId: 1, lastUpdatedAt: -1 }, { name: "plant_user_recent_idx" }),
      plantTracks.createIndex({ vendorId: 1, lastUpdatedAt: -1 }, { name: "plant_vendor_recent_idx" }),
    ]);
  },

  async down(db) {
    const users = db.collection("users");
    const vendorProfiles = db.collection("vendorprofiles");
    const produces = db.collection("produces");
    const rentalSpaces = db.collection("rentalspaces");
    const rentalBookings = db.collection("rentalbookings");
    const orders = db.collection("orders");
    const communityPosts = db.collection("communityposts");
    const sustainabilityCerts = db.collection("sustainabilitycerts");
    const plantTracks = db.collection("planttracks");

    await Promise.all([
      dropIndexIfExists(users, "email_unique"),
      dropIndexIfExists(users, "role_status_idx"),
      dropIndexIfExists(vendorProfiles, "vendor_user_unique"),
      dropIndexIfExists(vendorProfiles, "vendor_certification_idx"),
      dropIndexIfExists(vendorProfiles, "vendor_farm_geo_idx"),
      dropIndexIfExists(produces, "produce_vendor_category_idx"),
      dropIndexIfExists(produces, "produce_listing_idx"),
      dropIndexIfExists(rentalSpaces, "rental_vendor_availability_idx"),
      dropIndexIfExists(rentalSpaces, "rental_geo_idx"),
      dropIndexIfExists(rentalBookings, "booking_conflict_idx"),
      dropIndexIfExists(rentalBookings, "booking_user_recent_idx"),
      dropIndexIfExists(orders, "order_user_recent_idx"),
      dropIndexIfExists(orders, "order_vendor_recent_idx"),
      dropIndexIfExists(communityPosts, "community_post_date_idx"),
      dropIndexIfExists(sustainabilityCerts, "sustainability_vendor_status_idx"),
      dropIndexIfExists(plantTracks, "plant_user_recent_idx"),
      dropIndexIfExists(plantTracks, "plant_vendor_recent_idx"),
    ]);
  },
};
