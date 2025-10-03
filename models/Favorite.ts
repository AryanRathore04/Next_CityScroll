import mongoose, { Schema, Document } from "mongoose";

export interface IFavorite extends Document {
  userId: string;
  vendorId: string;
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    vendorId: {
      type: String,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
FavoriteSchema.index({ userId: 1, vendorId: 1 }, { unique: true }); // Prevent duplicate favorites
FavoriteSchema.index({ userId: 1, createdAt: -1 }); // Get user favorites sorted by date

export default mongoose.models.Favorite ||
  mongoose.model<IFavorite>("Favorite", FavoriteSchema);
