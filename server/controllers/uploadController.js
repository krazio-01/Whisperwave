const cloudinary = require('../config/cloudinaryConfig');
const sharp = require('sharp');

const CLOUD_FOLDER_PREFIX = 'whisperwave';
const DEFAULT_AVATAR_MATCH = 'noAvatar_fr72mb';

const extractPublicId = (imageUrl, folderName) => {
    try {
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1].split('.')[0];
        return `${CLOUD_FOLDER_PREFIX}/${folderName}/${fileName}`;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};

const uploadImageToCloudinary = async (file, folder) => {
    try {
        const compressedImageBuffer = await sharp(file.buffer)
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `${CLOUD_FOLDER_PREFIX}/${folder}`,
                    upload_preset: CLOUD_FOLDER_PREFIX,
                    timeout: 60000
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                },
            );
            uploadStream.end(compressedImageBuffer);
        });

        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw new Error('Image upload failed');
    }
};

const deleteImageFromCloudinary = async (imageUrl, folderName) => {
    if (!imageUrl || imageUrl.includes(DEFAULT_AVATAR_MATCH)) return;

    const publicId = extractPublicId(imageUrl, folderName);
    if (!publicId) return;

    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error(`Failed to delete image (${publicId}):`, error);
    }
};

const deleteManyImages = async (imageUrls, folderName) => {
    if (!imageUrls || imageUrls.length === 0) return;

    const publicIds = imageUrls
        .filter((url) => url && !url.includes(DEFAULT_AVATAR_MATCH))
        .map((url) => extractPublicId(url, folderName))
        .filter((id) => id !== null);

    if (publicIds.length === 0) return;

    try {
        const CHUNK_SIZE = 100;

        for (let i = 0; i < publicIds.length; i += CHUNK_SIZE) {
            const batch = publicIds.slice(i, i + CHUNK_SIZE);
            await cloudinary.api.delete_resources(batch);
        }
    } catch (error) {
        console.error('Failed to delete bulk images:', error);
    }
};

module.exports = { uploadImageToCloudinary, deleteImageFromCloudinary, deleteManyImages };
