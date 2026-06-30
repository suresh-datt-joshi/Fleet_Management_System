import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads', 'vehicles');

const isCloudinaryConfigured = () =>
  config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret;

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

const ensureUploadDir = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
};

export const uploadImage = async (fileBuffer, originalName, mimetype, folder = 'vehicles') => {
  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `fleet-management/${folder}`, resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      stream.end(fileBuffer);
    });
  }

  ensureUploadDir();
  const subDir = path.join(uploadsDir, '..', folder);
  if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });

  const ext = path.extname(originalName) || '.jpg';
  const filename = `${folder}-${Date.now()}${ext}`;
  const filepath = path.join(subDir, filename);
  fs.writeFileSync(filepath, fileBuffer);

  return {
    url: `/uploads/${folder}/${filename}`,
    publicId: filename,
  };
};

export const deleteImage = async (publicId) => {
  if (!publicId) return;

  if (isCloudinaryConfigured() && !publicId.startsWith('vehicle-') && !publicId.startsWith('documents-')) {
    await cloudinary.uploader.destroy(publicId);
    return;
  }

  ensureUploadDir();
  const subDirs = ['vehicles', 'drivers', 'documents'];
  const baseName = publicId.split('-')[0];
  let filepath = path.join(uploadsDir, publicId);

  if (subDirs.includes(baseName)) {
    filepath = path.join(uploadsDir, '..', baseName, publicId);
  }

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
};

export const uploadFile = async (fileBuffer, originalName, mimetype, folder = 'documents') => {
  if (isCloudinaryConfigured()) {
    const resourceType = mimetype.startsWith('image/') ? 'image' : 'raw';
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `fleet-management/${folder}`, resource_type: resourceType },
        (error, result) => {
          if (error) reject(error);
          else resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      stream.end(fileBuffer);
    });
  }

  const subDir = path.join(uploadsDir, '..', folder);
  if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });

  const ext = path.extname(originalName) || (mimetype === 'application/pdf' ? '.pdf' : '.jpg');
  const filename = `${folder}-${Date.now()}${ext}`;
  const filepath = path.join(subDir, filename);
  fs.writeFileSync(filepath, fileBuffer);

  return {
    url: `/uploads/${folder}/${filename}`,
    publicId: filename,
  };
};

export const deleteFile = deleteImage;

export default { uploadImage, uploadFile, deleteImage, deleteFile };
