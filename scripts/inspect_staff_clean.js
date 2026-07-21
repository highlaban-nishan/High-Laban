import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function inspectStaff() {
    const snapshot = await getDocs(collection(firestore, "staff"));
    console.log(`=== REMAINING UNIQUE HR STAFF (${snapshot.size} records) ===`);
    snapshot.forEach(doc => {
        const d = doc.data();
        console.log(`- ${d.fullName || d.nickname} | Position: ${d.position || 'Staff'} | Phone: ${d.phone || 'N/A'}`);
    });
    process.exit(0);
}

inspectStaff().catch(console.error);
