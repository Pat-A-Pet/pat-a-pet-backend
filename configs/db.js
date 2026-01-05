import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error("Missing MONGO_URI in .env");
    await mongoose.connect(mongoUri);
    console.log("MongoDB Connected");
    return mongoose.connection;
  } catch (error) {
    if (error instanceof Error) {
      console.error("MongoDB connection error:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
    process.exit(1);
  }
};

export default connectDB;
