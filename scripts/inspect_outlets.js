import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyD-placeholder",
    authDomain: "highlaban.firebaseapp.com",
    projectId: "highlaban",
    storageBucket: "highlaban.appspot.com",
    messagingSenderId: "1087817081702",
    appId: "1:1087817081702:web:placeholder"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspect() {
    console.log("=== FRANCHISES ===");
    const franSnap = await getDocs(collection(db, "franchises"));
    franSnap.forEach(doc => {
        console.log(doc.id, "=>", JSON.stringify(doc.data()));
    });

    console.log("\n=== LOCATIONS ===");
    const locSnap = await getDocs(collection(db, "locations"));
    locSnap.forEach(doc => {
        console.log(doc.id, "=>", JSON.stringify(doc.data()));
    });

    process.exit(0);
}

inspect().catch(err => {
    console.error(err);
    process.exit(1);
});
