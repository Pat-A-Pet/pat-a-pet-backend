import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comment: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

const postSchema = new mongoose.Schema(
  {
    captions: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    imageUrls: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "A post must have at least one image or video.",
      },
    },
    loves: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Post", postSchema);
