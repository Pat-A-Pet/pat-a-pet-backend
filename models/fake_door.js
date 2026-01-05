import mongoose from "mongoose";

const fakeDoorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Mengetahui fitur mana yang paling laku
    featureTriggered: {
      type: String,
      enum: [
        "video_upload",
        "ai_recommender",
        "unlimited_chat",
        "verified_badge",
        "priority_listing_post",
        "priority_listing_pet",
        "video_support",
        "android_app_download",
        "user_signin_success",
        "user_signup_success",
        "navbar_premium_button",
      ],
      required: true,
    },
    hasOpenedModal: { type: Boolean, default: false },
    selectedPlan: {
      type: String,
      enum: ["basic", "pro", null],
      default: null,
    },
    isConverted: { type: Boolean, default: false }, // User klik 'Lanjutkan'
    isDeclined: { type: Boolean, default: false }, // User klik 'Nanti Saja'
  },
  { timestamps: true },
);

export default mongoose.model("FakeDoor", fakeDoorSchema);
