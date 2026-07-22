import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

const firebaseConfig = {
    apiKey: "AIzaSyBqpMyF6O3M865M97_TKNgGWeOYH65Doy8",
    authDomain: "highlaban-833fc.firebaseapp.com",
    projectId: "highlaban-833fc",
    storageBucket: "highlaban-833fc.firebasestorage.app",
    messagingSenderId: "662034537087",
    appId: "1:662034537087:web:8270d976ed012a8050bd4a",
    measurementId: "G-R2WJ30698P"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const founderDir = "d:/ANTI/highlaban/High-Laban/founder";
const IMGBB_KEY = "a3f20cbabd029be3408dfb659dd16c78";

const mappings = {
    dir_nishan: {
        "NISHAN STATMENT.pdf": "bankStatementUrl"
    },
    dir_marshad: {
        "MARSHAD STATMN.pdf": "bankStatementUrl",
        "Marshad.JPG.jpeg": "profilePictureUrl",
        "marshad pan.jpg": "panUrlFront",
        "marshad [pan back.jpg": "panUrlBack",
        "marshad adhar front.jpeg": "aadhaarUrlFront",
        "marshad adhar back.jpeg": "aadhaarUrlBack"
    },
    dir_nufoor: {
        "NUFOOR STATEMNT.pdf": "bankStatementUrl",
        "nufoor adhar.jpg": "aadhaarUrlFront",
        "nufoor adhar back.jpg": "aadhaarUrlBack",
        "nufoor pan'.jpg": "panUrlFront"
    },
    dir_sayeed: {
        "SAYEED STATMENT (1).pdf": "bankStatementUrl",
        "sayeed profile.jpeg": "profilePictureUrl",
        "sayeed adhar.jpeg": "aadhaarUrlFront",
        "sayeed adhar back.jpeg": "aadhaarUrlBack",
        "sayeed pana dn adhar.jpeg": "panUrlFront"
    },
    dir_sinan: {
        "sinan pic.png": "profilePictureUrl",
        "sinana adhar front'.jpeg": "aadhaarUrlFront",
        "sinan adhar back.jpeg": "aadhaarUrlBack",
        "sinana pan.jpeg": "panUrlFront"
    }
};

async function uploadToImgBB(fileBuffer, fileName) {
    const base64Data = fileBuffer.toString("base64");
    const formData = new URLSearchParams();
    formData.append("image", base64Data);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    const data = await res.json();
    if (data.success) {
        return data.data.url;
    } else {
        throw new Error(data.error?.message || "ImgBB upload failed");
    }
}

async function run() {
    console.log("Starting upload of founder compliance documents...");

    for (const [dirId, fileMap] of Object.entries(mappings)) {
        console.log(`\nProcessing Director ID: ${dirId}`);
        const docRef = doc(firestore, "directors", dirId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            console.log(`WARNING: Profile with ID ${dirId} does not exist in 'directors' collection. Skipping.`);
            continue;
        }

        const updates = {};
        for (const [fileName, fieldName] of Object.entries(fileMap)) {
            const filePath = path.join(founderDir, fileName);
            if (!fs.existsSync(filePath)) {
                console.log(`WARNING: Local file ${fileName} does not exist. Skipping.`);
                continue;
            }

            const fileBuffer = fs.readFileSync(filePath);
            const ext = path.extname(fileName).toLowerCase();

            if (ext === '.pdf') {
                console.log(`Converting PDF ${fileName} to Base64 Data URI...`);
                const base64Pdf = fileBuffer.toString("base64");
                updates[fieldName] = `data:application/pdf;base64,${base64Pdf}`;
                console.log(`Formatted PDF as Data URI (${base64Pdf.length} bytes)`);
            } else {
                console.log(`Uploading image ${fileName} to ImgBB...`);
                try {
                    const url = await uploadToImgBB(fileBuffer, fileName);
                    updates[fieldName] = url;
                    
                    // Sync legacy fields
                    if (fieldName === 'panUrlFront') updates['panUrl'] = url;
                    if (fieldName === 'aadhaarUrlFront') updates['aadhaarUrl'] = url;
                    
                    console.log(`Uploaded image to ImgBB successfully! URL: ${url}`);
                } catch (e) {
                    console.error(`FAILED to upload image ${fileName} to ImgBB:`, e.message);
                }
            }
        }

        if (Object.keys(updates).length > 0) {
            console.log(`Saving updates to directors collection for ${dirId}...`);
            await setDoc(docRef, updates, { merge: true });
        }
    }

    console.log("\nUpload and configuration complete!");
    process.exit(0);
}

run().catch(err => {
    console.error("Upload error:", err);
    process.exit(1);
});
