import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBqpMyF6O3M865M97_TKNgGWeOYH65Doy8",
    authDomain: "highlaban-833fc.firebaseapp.com",
    projectId: "highlaban-833fc",
    storageBucket: "highlaban-833fc.appspot.com", // try .appspot.com
    messagingSenderId: "662034537087",
    appId: "1:662034537087:web:8270d976ed012a8050bd4a"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function test() {
    try {
        console.log("Testing upload to highlaban-833fc.appspot.com...");
        const storageRef = ref(storage, "test.txt");
        const buffer = Buffer.from("Hello World");
        const snap = await uploadBytes(storageRef, buffer, { contentType: "text/plain" });
        const url = await getDownloadURL(snap.ref);
        console.log("SUCCESS! URL:", url);
    } catch (e) {
        console.error("FAILED:", e);
    }
    process.exit(0);
}

test();
