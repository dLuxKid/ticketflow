import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import catchAsync from './catchAsync.js';

dotenv.config({ path: './config.env' });

cloudinary.config({
  secure: true,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOptions = {
  use_filename: true,
  unique_filename: false,
  overwrite: true,
  invalidate: true,
  resource_type: 'auto',
};

/**
 * Uploads a single base64/URL image to Cloudinary and returns the secure URL.
 */
const uploadImage = async (img) => {
  const result = await cloudinary.uploader.upload(img, uploadOptions);
  return result.secure_url;
};

/**
 * Express middleware that intercepts base64 images in the request body,
 * uploads them to Cloudinary, and replaces them with the returned URLs.
 * Handles both single photo uploads and cover + other images for events.
 */
const handleImg = catchAsync(async (req, res, next) => {
  if (req.body.photo) req.body.photo = await uploadImage(req.body.photo);
  else if (req.body.coverImage) {
    req.body.coverImage = await uploadImage(req.body.coverImage);

    if (Array.isArray(req.body.otherImages))
      req.body.otherImages = await Promise.all(
        req.body.otherImages.filter(Boolean).map((img) => uploadImage(img)),
      );
  }

  next();
});

export default handleImg;
