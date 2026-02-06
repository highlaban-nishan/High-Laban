const API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

/**
 * Uploads a base64 image string to ImgBB.
 * @param {string} base64Image - The base64 string of the image (can include data URI scheme).
 * @returns {Promise<string>} - The URL of the uploaded image.
 */
// Helper to convert Blob/File to Base64
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

export const uploadImage = async (imageFileOrBase64) => {
    console.log("Uploading with Key:", API_KEY); // Debug log

    let base64Data = '';

    try {

        if (imageFileOrBase64 instanceof Blob || imageFileOrBase64 instanceof File) {
            console.log("Converting Blob/File to Base64...");
            base64Data = await toBase64(imageFileOrBase64);
        } else if (typeof imageFileOrBase64 === 'string') {
            base64Data = imageFileOrBase64;
        } else {
            throw new Error('Invalid image format.');
        }

        // Remove prefix for ImgBB
        const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

        const formData = new FormData();
        formData.append('image', cleanBase64);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            console.log("Upload Successful:", data.data.url);
            return data.data.url;
        } else {
            console.error("ImgBB API Error:", data);
            throw new Error(data.error?.message || 'Upload failed');
        }
    } catch (error) {
        console.error('ImgBB Upload Error:', error);
        console.warn("Falling back to Base64 Data URI inline storage.");

        // Return null or throw if we don't have base64Data for some reason
        if (!base64Data) throw error;

        // Fallback: Return the full Data URI to be saved directly in DB
        return base64Data;
    }
};
