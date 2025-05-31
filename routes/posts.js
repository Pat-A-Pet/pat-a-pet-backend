import { Router } from "express";
import passport from "passport";
import Post from "../models/post.js";

const router = Router();

// Create a new post
router.post(
  "/create-post",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const post = new Post({
        ...req.body,
        author: req.user._id,
      });
      await post.save();
      res.status(201).json(post);
    } catch (err) {
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

// Get post by ID
router.get("/get-posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "fullname profilePictureUrl")
      .populate("comments.author", "fullname profilePictureUrl");

    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/get-loved-posts/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ loves: req.params.userId })
      .populate("author", "fullname profilePictureUrl")
      .populate("comments.author", "fullname profilePictureUrl")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/get-my-posts/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate("author", "fullname profilePictureUrl")
      .populate("comments.author", "fullname profilePictureUrl")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update post (only author can update)
router.put(
  "/update-post/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });

      if (!post.author.equals(req.user._id))
        return res.status(403).json({ error: "Not authorized" });

      Object.assign(post, req.body);
      await post.save();
      res.json(post);
    } catch (err) {
      res.status(400).json({ error: err.message });
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

      await post.remove();
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
