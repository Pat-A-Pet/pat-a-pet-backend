import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (value) {
          return /.+\@.+\..+/.test(value);
        },
        message: "Please use a valid email",
      },
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    profilePictureUrl: {
      type: String,
      default: "",
      ref: "ProfilePicture",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("User", UserSchema);
