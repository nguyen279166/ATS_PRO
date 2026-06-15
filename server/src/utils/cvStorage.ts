import fs from "fs";
import multer from "multer";
import path from "path";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
const LOCAL_UPLOAD_DIR = path.join(__dirname, "../../uploads/cv");
const LOCAL_AVATAR_DIR = path.join(__dirname, "../../uploads");

export const cvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
      return;
    }

    cb(new Error("Chỉ chấp nhận file PDF, DOC, DOCX, JPG, PNG"));
  },
});

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_SIZE },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }

    cb(new Error("Chỉ chấp nhận file ảnh"));
  },
});

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "file";
}

function cleanOriginalFileName(originalName: string) {
  return path
    .basename(originalName)
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "cv";
}

function getFileExtension(originalName: string) {
  return path.extname(originalName).toLowerCase();
}

function buildReadableCvPublicId(file: Express.Multer.File, candidateName?: string) {
  const folder = process.env.CLOUDINARY_CV_FOLDER || "ats-pro/cv";
  const ext = getFileExtension(file.originalname);
  const originalBase = path.basename(file.originalname, ext);
  const namePart = slugify(candidateName || "candidate");
  const filePart = slugify(originalBase || "cv");
  const stamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14);

  return `${folder}/${namePart}-${filePart}-${stamp}${ext}`;
}

function uploadToCloudinary(file: Express.Multer.File, candidateName?: string) {
  configureCloudinary();

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: buildReadableCvPublicId(file, candidateName),
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Không thể upload CV lên Cloudinary"));
          return;
        }

        resolve(result);
      },
    );

    stream.end(file.buffer);
  });
}

function uploadAvatarToCloudinary(file: Express.Multer.File) {
  configureCloudinary();

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_AVATAR_FOLDER || "ats-pro/avatars",
        resource_type: "image",
        transformation: [
          { width: 320, height: 320, crop: "fill", gravity: "face:auto" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Không thể upload avatar lên Cloudinary"));
          return;
        }

        resolve(result);
      },
    );

    stream.end(file.buffer);
  });
}

function buildLocalFileName(originalName: string) {
  const ext = getFileExtension(originalName);
  return `cv_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
}

function buildLocalAvatarName(originalName: string) {
  const ext = path.extname(originalName).toLowerCase();
  return `avatar_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
}

async function saveLocalCv(file: Express.Multer.File) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  const fileName = buildLocalFileName(file.originalname);
  const filePath = path.join(LOCAL_UPLOAD_DIR, fileName);
  await fs.promises.writeFile(filePath, file.buffer);
  return {
    cvUrl: `/uploads/cv/${fileName}`,
    cvPublicId: null,
    cvFileName: cleanOriginalFileName(file.originalname),
  };
}

async function saveLocalAvatar(file: Express.Multer.File) {
  fs.mkdirSync(LOCAL_AVATAR_DIR, { recursive: true });
  const fileName = buildLocalAvatarName(file.originalname);
  const filePath = path.join(LOCAL_AVATAR_DIR, fileName);
  await fs.promises.writeFile(filePath, file.buffer);
  return `/uploads/${fileName}`;
}

export async function saveCv(file: Express.Multer.File, candidateName?: string) {
  if (!isCloudinaryConfigured()) {
    return saveLocalCv(file);
  }

  const result = await uploadToCloudinary(file, candidateName);
  return {
    cvUrl: result.secure_url,
    cvPublicId: result.public_id,
    cvFileName: cleanOriginalFileName(file.originalname),
  };
}

export async function saveAvatar(file: Express.Multer.File) {
  if (!isCloudinaryConfigured()) {
    return saveLocalAvatar(file);
  }

  const result = await uploadAvatarToCloudinary(file);
  return result.secure_url;
}

export async function deleteCv(cvUrl?: string | null, cvPublicId?: string | null) {
  if (cvPublicId && isCloudinaryConfigured()) {
    configureCloudinary();
    await cloudinary.uploader.destroy(cvPublicId, { resource_type: "raw" });
    return;
  }

  if (!cvUrl || !cvUrl.startsWith("/uploads/")) return;

  const relativePath = cvUrl.replace(/^\//, "");
  const filePath = path.join(__dirname, "../../", relativePath);
  await fs.promises.rm(filePath, { force: true });
}
