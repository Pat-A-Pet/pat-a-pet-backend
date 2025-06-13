import { Router } from "express";
import passport from "passport";
import Post from "../models/post.js";
import multer from "multer";
import cloudinary from "../configs/cloudinary.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(), // Use memory for consistency with pet listings
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (adjust as needed)
  },
  fileFilter: (req, file, cb) => {
    // Allow only common image MIME types
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, or GIF images are allowed"), false);
    }
  },
});
// Create a new post
router.post(
  "/create-post",
  passport.authenticate("jwt", { session: false }),
  upload.array("images"),
  async (req, res) => {
    try {
      // Upload files to Cloudinary
      const uploadPromises =
        req.files?.map((file) => {
          return cloudinary.uploader.upload(file.path, {
            folder: "pat-a-pet", // Optional folder in Cloudinary
          });
        }) || [];

      const cloudinaryResults = await Promise.all(uploadPromises);

      // Get secure URLs from Cloudinary
      const imageUrls = cloudinaryResults.map((result) => result.secure_url);

      // Create post with Cloudinary URLs
      const post = new Post({
        captions: req.body.captions,
        author: req.user._id,
        imageUrls: imageUrls,
      });

      await post.save();

      // Clean up temporary files

      res.status(201).json(post);
    } catch (err) {
      // Clean up on error
      res.status(400).json({ error: err.message });
    }
  },
);

// Get all posts (with author populated)
router.get("/get-posts", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "fullname profilePictureUrl")
      .populate("comments.author", "fullname profilePictureUrl")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get(
  "/get-loved-posts/:userId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const posts = await Post.find({ loves: req.params.userId })
        .populate("author", "fullname profilePictureUrl")
        .populate("comments.author", "fullname profilePictureUrl")
        .sort({ createdAt: -1 });

      res.json(posts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

router.get(
  "/get-my-posts/:userId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const posts = await Post.find({ author: req.params.userId })
        .populate("author", "fullname profilePictureUrl")
        .populate("comments.author", "fullname profilePictureUrl")
        .sort({ createdAt: -1 });

      res.json(posts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// Delete post (only author can delete)
router.delete(
  "/delete-post/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });

      if (!post.author.equals(req.user._id))
        return res.status(403).json({ error: "Not authorized" });

      await post.deleteOne();
      res.json({ message: "Post deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// Add comment to post
router.post(
  "/update-post/:id/comments",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });

      const comment = {
        author: req.user._id,
        comment: req.body.comment,
      };

      post.comments.push(comment);
      await post.save();

      // Optionally populate author in the response
      await post.populate("comments.author", "fullname profilePictureUrl");

      res.status(201).json(post);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
);

// Like or Unlike a post
router.post(
  "/update-post/:id/like",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });

      const userId = req.user._id;
      const index = post.likes.findIndex((id) => id.equals(userId));

      if (index === -1) {
        post.likes.push(userId); // Like
      } else {
        post.likes.splice(index, 1); // Unlike
      }

      await post.save();
      res.json(post);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

export default router;
