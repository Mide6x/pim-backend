const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Cloudinary credentials are not properly configured');
  throw new Error('Cloudinary configuration is missing');
}

const tempDir = path.join(__dirname, "..", "temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Set up multer storage with dynamic folder creation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Controller to handle image upload
exports.uploadImage = async (req, res) => {
  try {
    if (!cloudinary.config().cloud_name) {
      throw new Error('Cloudinary is not properly configured');
    }

    upload.single("image")(req, res, async (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Failed to upload image", error: err.message });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ message: "No image file provided" });
      }

      const filePath = req.file.path;

      try {
        const transformedUrl = await uploadAndTransformImage(filePath);
        fs.unlinkSync(filePath);
        res.status(200).json({ imageUrl: transformedUrl });
      } catch (error) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        console.error(`Failed to upload image: ${error.message}`);
        res
          .status(500)
          .json({ message: "Failed to upload image", error: error.message });
      }
    });
  } catch (error) {
    console.error(`Failed to upload image: ${error.message}`);
    res
      .status(500)
      .json({ message: "Failed to upload image", error: error.message });
  }
};

const uploadAndTransformImage = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      transformation: [
        {
          background: "#FFFFFF",
          gravity: "center",
          height: 500,
          width: 1170,
          crop: "pad",
        },
        { quality: "auto:best" },
        { fetch_format: "auto" },
        { effect: "sharpen:90" },
      ],
    });
    return result.secure_url;
  } catch (error) {
    console.error(
      `Failed to upload and transform image. Error: ${error.message}`
    );
    throw error;
  }
};
