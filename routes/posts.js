import { Router } from "express";
import passport from "passport";
import Post from "../models/post.js";
import multer from "multer";
import cloudinary from "../configs/cloudinary.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
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
      // Check if files exist
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Upload files to Cloudinary using buffer (not file.path)
      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "pat-a-pet",
                resource_type: "image",
              },
              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              },
            )
            .end(file.buffer); // Use file.buffer instead of file.path
        });
      });

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

      res.status(201).json(post);
    } catch (err) {
      console.error("Error creating post:", err);
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
  "/post-comments/:id",
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

      // Repopulate the full post to get fresh data
      const updatedPost = await Post.findById(post._id)
        .populate("author", "fullname profilePictureUrl")
        .populate("comments.author", "fullname profilePictureUrl");

      // Ensure we're sending proper JSON
      res.status(201).json(updatedPost.toObject()); // Add .toObject() for Mongoose documents
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
);

router.patch(
  "/post-love/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      let post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });

      const userId = req.user._id;
      const index = post.loves.indexOf(userId);

      if (index === -1) {
        post.loves.push(userId);
      } else {
        post.loves.splice(index, 1);
      }

      await post.save();

      // Repopulate the author before sending response
      post = await Post.findById(post._id)
        .populate("author", "fullname profilePictureUrl")
        .populate("comments.author", "fullname profilePictureUrl");

      res.json(post.toObject());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// // Get post by ID
// router.get(
//   "/get-posts/:id",
//   passport.authenticate("jwt", { session: false }),
//   async (req, res) => {
//     try {
//       const post = await Post.findById(req.params.id)
//         .populate("author", "fullname profilePictureUrl")
//         .populate("comments.author", "fullname profilePictureUrl");
//
//       if (!post) return res.status(404).json({ error: "Post not found" });
//       res.json(post);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   },
// );

// Get post by ID
router.get(
  "/get-posts/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id)
        .populate("author", "fullname profilePictureUrl")
        .populate("comments.author", "fullname profilePictureUrl");

      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json(post);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

export default router;
