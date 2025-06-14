import mongoose from "mongoose";

const petSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    species: { type: String, required: true },
    breed: { type: String, required: true },
    age: {
      type: Number,
      required: true,
    },
    gender: { type: String, required: true },
    color: { type: String, required: true },
    weight: { type: String, required: true },
    vaccinated: { type: Boolean, required: true },
    neutered: { type: Boolean, required: true },
    microchipped: { type: Boolean, required: true },
    medicalConditions: { type: String },
    specialNeeds: { type: String },
    description: { type: String, required: true },
    imageUrls: { type: [String], required: true },
    location: { type: String, required: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adoptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: { type: String, default: "available" },
    loves: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    adoptionFee: { type: Number, required: true },
    adoptionRequests: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        // channelId: String,
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Pet", petSchema);
