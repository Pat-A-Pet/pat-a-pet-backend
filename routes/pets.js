import { Router } from "express";
import passport from "passport";
import Pet from "../models/pet.js";
import multer from "multer";
import cloudinary from "../configs/cloudinary.js";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
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

router.post(
  "/upload-pet-images",
  passport.authenticate("jwt", { session: false }),
  upload.array("images", 10), // Allow up to 10 images
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No images provided" });
      }

      const uploadPromises = req.files.map(async (file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "pet_listings",
              resource_type: "image",
              transformation: [
                { width: 800, height: 600, crop: "limit" },
                { quality: "auto" },
              ],
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve({
                  public_id: result.public_id,
                  url: result.secure_url,
                  original_filename: file.originalname,
                  width: result.width,
                  height: result.height,
                });
              }
            },
          );
          uploadStream.end(file.buffer);
        });
      });

      const uploadedImages = await Promise.all(uploadPromises);
      res.status(200).json({ images: uploadedImages });
    } catch (error) {
      console.error("Error uploading images:", error);
      res.status(500).json({ error: "Failed to upload images" });
    }
  },
);

// Updated create listing endpoint
router.post(
  "/create-listing",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const petData = { ...req.body, owner: req.user._id };

      // Calculate age from birthDate if birthDate is provided and age is not
      if (petData.birthDate && !petData.age) {
        const birthDate = new Date(petData.birthDate);
        const today = new Date();
        const ageInYears = Math.floor(
          (today - birthDate) / (365.25 * 24 * 60 * 1000),
        );
        petData.age = ageInYears;
      }

      // Validate that imageUrls are provided
      if (!petData.imageUrls || petData.imageUrls.length === 0) {
        return res
          .status(400)
          .json({ error: "At least one image is required" });
      }

      const pet = new Pet(petData);
      await pet.save();
      res.status(201).json(pet);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
);

// Get all pets (optionally filter by species or owner)
router.get("/get-listings", async (req, res) => {
  try {
    const filters = {};
    if (req.query.species) filters.species = req.query.species;
    if (req.query.owner) filters.owner = req.query.owner;

    const pets = await Pet.find(filters).populate("owner", "fullname email");
    res.json(pets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const categories = await Pet.distinct("species");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/get-loved-pets/:userId", async (req, res) => {
  try {
    const pets = await Pet.find({ loves: req.params.userId });
    res.json(pets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pet by ID
router.get("/get-listing/:id", async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).populate(
      "owner",
      "fullname email",
    );
    if (!pet) return res.status(404).json({ error: "Pet not found" });
    res.json(pet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's adoption posts
router.get('/my-adoptions/:userId', async (req, res) => {
  try {
    const pets = await Pet.find({ owner: req.params.userId })
      .populate('owner', 'fullname email')
      .sort({ createdAt: -1 });

    res.json(pets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Update pet (only owner can update)
router.put(
  "/update-listing/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.id);
      if (!pet) return res.status(404).json({ error: "Pet not found" });

      if (!pet.owner.equals(req.user._id))
        return res.status(403).json({ error: "Not authorized" });

      Object.assign(pet, req.body);
      await pet.save();
      res.json(pet);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
);

// Delete pet (only owner can delete)
router.delete(
  "/delete-listing/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.id);
      if (!pet) return res.status(404).json({ error: "Pet not found" });

      if (!pet.owner.equals(req.user._id))
        return res.status(403).json({ error: "Not authorized" });

      await pet.remove();
      res.json({ message: "Pet deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

export default router;
