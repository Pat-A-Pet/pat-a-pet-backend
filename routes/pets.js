import { Router } from "express";
import passport from "passport";
import Pet from "../models/pet.js";
import User from "../models/user.js";
import multer from "multer";
import cloudinary from "../configs/cloudinary.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
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

    const pets = await Pet.find(filters)
      .populate("owner", "fullname email")
      .populate("adoptedBy", "fullname profilePictureUrl")
      .populate("adoptionRequests.user", "fullname profilePictureUrl")
      .sort({ createdAt: -1 });

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

      await pet.deleteOne();
      res.json({ message: "Pet deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// Add to existing routes or create new file
router.patch(
  "/pet-love/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.id);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      const userId = req.user._id;
      const loveIndex = pet.loves.indexOf(userId);

      if (loveIndex === -1) {
        // Add love
        pet.loves.push(userId);
      } else {
        // Remove love
        pet.loves.splice(loveIndex, 1);
      }

      await pet.save();
      res.json({ loves: pet.loves });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

router.get(
  "/get-loved-pets/:userId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const pets = await Pet.find({ loves: req.params.userId });
      res.json(pets);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// Get pet by ID
// router.get("/get-listing/:id", async (req, res) => {
//   try {
//     const pet = await Pet.findById(req.params.id).populate(
//       "owner",
//       "fullname email",
//     );
//     if (!pet) return res.status(404).json({ error: "Pet not found" });

//     const populatedPet = await Pet.findById(pet._id)
//       .populate("adoptedBy", "fullname profilePictureUrl")
//       .populate("adoptionRequests.user", "fullname profilePictureUrl");
//     res.json({
//       pet: populatedPet,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Get pet by ID (Jangan dihapus bang XD)
router.get("/get-listing/:id", async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id)
      .populate("owner", "fullname email")
      .populate("adoptedBy", "fullname profilePictureUrl")
      .populate("adoptionRequests.user", "fullname profilePictureUrl");
    
    if (!pet) return res.status(404).json({ error: "Pet not found" });

    res.json({
      pet: pet,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's adoption posts (jangan dihapus juga bang XD)
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

// Get user's adoption posts
router.get(
  "/get-all-adoptions-buyer/:userId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // 1. Get all pets where user has made requests
      const requestedPets = await Pet.find({
        "adoptionRequests.user": req.params.userId,
      })
        .populate("owner", "fullname profilePictureUrl")
        .populate("adoptionRequests.user", "fullname profilePictureUrl");

      // 2. Get all pets user has successfully adopted
      const user = await User.findById(req.params.userId).populate({
        path: "adoptions",
        populate: {
          path: "owner",
          select: "fullname profilePictureUrl",
        },
      });

      // Format the response
      const response = {
        requested: requestedPets.map((pet) => {
          const petObj = pet.toObject();
          const userRequest = pet.adoptionRequests.find(
            (request) => request.user._id.toString() === req.params.userId,
          );
          return {
            ...petObj,
            userRequest: userRequest,
          };
        }),
        adopted: user ? user.adoptions : [],
      };

      res.json(response);
    } catch (error) {
      console.error("Error in /get-all-adoptions-buyer:", error);
      res.status(500).json({ message: error.message });
    }
  },
);

router.post(
  "/request-adoption/:petId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.petId);
      if (!pet) return res.status(404).json({ message: "Pet not found" });

      // Check if pet is available
      if (pet.status !== "available") {
        return res
          .status(400)
          .json({ message: "Pet is not available for adoption" });
      }

      // Check if user already requested
      const existingRequest = pet.adoptionRequests.find(
        (req) => req.user.toString() === req.body.userId,
      );

      if (existingRequest) {
        return res
          .status(400)
          .json({ message: "You already requested to adopt this pet" });
      }

      // Add new request
      pet.adoptionRequests.push({
        user: req.body.userId,
        status: "pending",
      });

      await pet.save();
      res.status(201).json(pet);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// In your pet routes file
router.delete(
  "/cancel-request-adoption/:petId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { petId } = req.params;
      const { userId } = req.body;

      // Remove the adoption request
      const updatedPet = await Pet.findByIdAndUpdate(
        petId,
        { $pull: { adoptionRequests: { user: userId } } },
        { new: true },
      );

      if (!updatedPet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      res.status(200).json({ message: "Adoption request canceled" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Update adoption request status
router.patch(
  "/update-request-status/:petId/:requestId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { petId, requestId } = req.params;
      const { action } = req.body; // 'approve' or 'reject'

      // Validate action
      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }

      const newStatus = action === "approve" ? "accepted" : "rejected";

      // Find the pet and request
      const pet = await Pet.findById(petId);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      // Find the request
      const requestIndex = pet.adoptionRequests.findIndex(
        (req) => req._id.toString() === requestId,
      );

      if (requestIndex === -1) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Update status
      pet.adoptionRequests[requestIndex].status = newStatus;

      // If approving, reject all other pending requests
      if (action === "approve") {
        pet.adoptionRequests.forEach((req) => {
          if (req.status === "pending" && req._id.toString() !== requestId) {
            req.status = "rejected";
          }
        });
        pet.adoptedBy = pet.adoptionRequests[requestIndex].user;
        pet.status = "adopted";
      }

      await pet.save();

      // Then populate the adoptedBy field before sending response
      const populatedPet = await Pet.findById(pet._id)
        .populate("adoptedBy", "fullname profilePictureUrl")
        .populate("adoptionRequests.user", "fullname profilePictureUrl");

      res.json({
        message: `Request ${newStatus}`,
        pet: populatedPet,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.get(
  "/get-adoption-requests/:petId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.petId)
        .populate("adoptionRequests.user", "fullname profilePictureUrl")
        .sort({ createdAt: -1 });

      if (!pet) return res.status(404).json({ message: "Pet not found" });

      res.json(pet.adoptionRequests);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

export default router;
