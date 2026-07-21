import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "firebase/firestore";

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

async function removeDuplicateStaff() {
    console.log("Checking for duplicate workers in HR staff collection...");
    const staffRef = collection(firestore, "staff");
    const snapshot = await getDocs(staffRef);
    
    const staffList = [];
    snapshot.forEach(d => {
        staffList.push({ id: d.id, ...d.data() });
    });

    console.log(`Total staff records in database: ${staffList.length}`);

    const seen = new Map();
    const duplicatesToDelete = [];

    for (const member of staffList) {
        // Create unique key based on name & phone/email
        const nameKey = (member.fullName || member.nickname || '').trim().toLowerCase();
        const phoneKey = (member.phone || member.mobile || '').trim();
        const emailKey = (member.email || '').trim().toLowerCase();

        let uniqueKey = '';
        if (nameKey) {
            uniqueKey = `name:${nameKey}`;
        } else if (phoneKey) {
            uniqueKey = `phone:${phoneKey}`;
        } else if (emailKey) {
            uniqueKey = `email:${emailKey}`;
        } else {
            uniqueKey = `id:${member.id}`;
        }

        if (seen.has(uniqueKey)) {
            // Keep the one with more filled details or newer ID
            const existing = seen.get(uniqueKey);
            console.log(`Found Duplicate! Keeping ID: ${existing.id}, Marking for deletion ID: ${member.id} (${member.fullName || member.nickname})`);
            duplicatesToDelete.push(member.id);
        } else {
            seen.set(uniqueKey, member);
        }
    }

    if (duplicatesToDelete.length > 0) {
        console.log(`\nDeleting ${duplicatesToDelete.length} duplicate staff records from Firestore...`);
        for (const dupId of duplicatesToDelete) {
            await deleteDoc(doc(firestore, "staff", dupId));
            console.log(`Deleted document ID: ${dupId}`);
        }
        console.log("Duplicates successfully removed!");
    } else {
        console.log("No duplicate staff records found!");
    }

    process.exit(0);
}

removeDuplicateStaff().catch(err => {
    console.error("Error removing duplicates:", err);
    process.exit(1);
});
