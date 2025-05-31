import mongoose from "mongoose";

const petSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    species: { type: String, required: true },
    breed: { type: String, required: true },
    age: { type: Number, required: true },
    birthDate: { type: Date },
    gender: { type: String, required: true },
    color: { type: String, required: true },
    weight: { type: String, required: true },
    vaccinated: { type: Boolean, required: true },
    neutered: { type: Boolean, required: true },
    microchipped: { type: Boolean, required: true },
    medicalConditions: { type: String },
    specialNeeds: { type: String },
    favoriteActivities: [String],
    description: { type: String, required: true },
    imageUrls: { type: [String], required: true },
    videoUrls: [String],
    profileImageUrl: { type: String, required: true },
    location: { type: String, required: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adopted: { type: Boolean, default: false },
    status: { type: String, default: "available" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    adoptionFee: { type: Number, required: true },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Pet", petSchema);
