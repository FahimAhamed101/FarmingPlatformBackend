# Database Schema And Migrations

This backend uses MongoDB with Mongoose, so schema enforcement happens in the application layer while the database stays document-oriented and flexible.

## Collections

| Collection | Model | Purpose | Key Fields |
|---|---|---|---|
| `users` | `User` | Authentication and role control | `name`, `email`, `password`, `role`, `status`, `createdAt` |
| `vendorprofiles` | `VendorProfile` | Vendor farm identity and approval status | `userId`, `farmName`, `certificationStatus`, `farmLocation`, `farmGeo` |
| `produces` | `Produce` | Marketplace inventory | `vendorId`, `name`, `price`, `category`, `certificationStatus`, `availableQuantity` |
| `rentalspaces` | `RentalSpace` | Rentable garden plots | `vendorId`, `locationLabel`, `geoLocation`, `size`, `price`, `availability` |
| `rentalbookings` | `RentalBooking` | Space reservation records | `userId`, `vendorId`, `rentalSpaceId`, `status`, `startDate`, `endDate` |
| `orders` | `Order` | Marketplace purchases | `userId`, `produceId`, `vendorId`, `quantity`, `totalPrice`, `status`, `orderDate` |
| `communityposts` | `CommunityPost` | Gardening forum posts | `userId`, `postContent`, `tags`, `postDate` |
| `sustainabilitycerts` | `SustainabilityCert` | Vendor certification records | `vendorId`, `certifyingAgency`, `certificationDate`, `certificateId`, `status` |
| `planttracks` | `PlantTrack` | Growth, health, and harvest tracking | `userId`, `vendorId`, `rentalSpaceId`, `plantName`, `stage`, `healthStatus`, `updates` |

## Relationships

- `User` to `VendorProfile`: one-to-one by `userId`
- `User` to `Produce`: one-to-many by `vendorId`
- `User` to `RentalSpace`: one-to-many by `vendorId`
- `User` to `Order`: one-to-many by `userId`
- `Produce` to `Order`: one-to-many by `produceId`
- `RentalSpace` to `RentalBooking`: one-to-many by `rentalSpaceId`
- `User` and `Vendor` to `PlantTrack`: shared ownership model for collaboration

## Migration Strategy

MongoDB does not enforce relational DDL migrations the way SQL databases do, so migrations here focus on:

- backfilling missing default fields on older documents
- creating and evolving indexes
- normalizing legacy data after schema changes
- making operational changes repeatable across environments

## Commands

```bash
npm run migrate:status
npm run migrate:up
npm run migrate:down
```

## Included Migration

The baseline migration in [20260418000100-baseline-schema-controls.js](C:/Users/Administrator/Desktop/mactech/backend/migrations/20260418000100-baseline-schema-controls.js) does two things:

- normalizes missing fields such as `status`, `availability`, `tags`, and `lastUpdatedAt`
- creates production-relevant indexes for auth, listings, geo search, recent orders, and bookings

## Notes

- Mongoose models remain the source of truth for validation and field shape.
- Migrations handle data evolution and index management over time.
- Geo search uses `2dsphere` indexes on vendor farm coordinates and rental space coordinates.
