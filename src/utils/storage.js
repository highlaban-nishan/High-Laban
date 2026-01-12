import { storage, isConfigured } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a file (Image or Video) to Cloud Storage.
 * 
 * @param {File} file - The file object to upload
 * @returns {Promise<string>} - The download URL
 */
import { uploadImage as uploadToImgBB } from './imgbb';

/**
 * Uploads a file (Image or Video) to Cloud Storage.
 * 
 * Strategy:
 * 1. Images -> ImgBB (using provided API key in imgbb.js)
 * 2. Others (Videos) -> Firebase Storage
 * 
 * @param {File} file - The file object to upload
 * @returns {Promise<string>} - The download URL
 */
export const uploadMedia = async (file) => {
    const isImage = file.type.startsWith('image/');

    if (isImage) {
        // Use ImgBB for images (direct binary upload)
        try {
            return await uploadToImgBB(file);
        } catch (e) {
            console.error("ImgBB Error:", e);
            throw e;
        }
    } else {
        // Use Firebase for everything else (Videos)
        if (!isConfigured()) {
            throw new Error("Missing Firebase Configuration. Cannot upload videos.");
        }

        try {
            const fileName = `${Date.now()}_${file.name}`;
            const storageRef = ref(storage, `uploads/${fileName}`);

            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error("Firebase Storage Error:", error);
            throw new Error("Failed to upload to Cloud Storage.");
        }
    }
};
