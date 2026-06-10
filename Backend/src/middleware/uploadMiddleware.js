import multer from "multer";
import CloudinaryStorage from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinaryConfig.js";

const allowedFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const imageFileFilter = (req, file, cb) => {
  if (allowedFormats.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(
    new Error("Alleen JPEG, PNG, WEBP en GIF afbeeldingen zijn toegestaan"),
    false,
  );
};

const createImageUpload = (folder, fileSize) => {
  return multer({
    storage: new CloudinaryStorage({
      cloudinary,
      params: {
        folder,
        resource_type: "auto",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
      },
    }),
    fileFilter: imageFileFilter,
    limits: { fileSize },
  });
};

export const uploadProfileImage = createImageUpload(
  "profile_images",
  5 * 1024 * 1024,
); // Max 5MB

export default uploadProfileImage;
