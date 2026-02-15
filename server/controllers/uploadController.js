const cloudinary = require('../config/cloudinaryConfig');
const sharp = require('sharp');

const uploadImageToCloudinary = async (file, folder) => {
    try {
        // Use sharp to compress the image
        const compressedImageBuffer = await sharp(file.buffer).jpeg({ quality: 70 }).toBuffer();

        const result = await new Promise((resolve) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `whisperwave/${folder}`,
                    upload_preset: 'whisperwave',
                },
                (error, result) => {
                    if (error) return;
                    else resolve(result);
                },
            );
            uploadStream.end(compressedImageBuffer);
        });

        return result.secure_url;
    } catch (error) {
        console.error(error);
        return null;
    }
};

const deleteImageFromCloudinary = async (imageUrl, folderName) => {
    if (!imageUrl) return;

    // default avatar check
    if (imageUrl.includes('noAvatar_fr72mb.png')) return;

    try {
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1].split('.')[0];

        const publicId = `whisperwave/${folderName}/${fileName}`;

        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error(`Failed to delete image (${imageUrl}):`, error);
    }
};

const deleteManyImages = async (imageUrls, folderName) => {
    if (!imageUrls || imageUrls.length === 0) return;

    const publicIds = imageUrls
        .map((url) => {
            const urlParts = url.split('/');
            const fileName = urlParts[urlParts.length - 1].split('.')[0];
            return `whisperwave/${folderName}/${fileName}`;
        })
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
