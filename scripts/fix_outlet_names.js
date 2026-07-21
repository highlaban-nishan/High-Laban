import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

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

async function fixOutletNames() {
    console.log("Fixing outlet names in Firestore...");
    
    // 1. Update Franchises
    const franRef = collection(firestore, "franchises");
    const franSnap = await getDocs(franRef);
    
    for (const d of franSnap.docs) {
        const data = d.data();
        console.log("Current Franchise:", d.id, data.outletName, data.address, data.ownerName);
        
        let newName = data.outletName;
        const addr = (data.address || '').toLowerCase();
        const owner = (data.ownerName || '').toLowerCase();
        
        if (addr.includes('aecs') || owner.includes('sumithra')) {
            newName = "AECS Layout";
        } else if (addr.includes('indiranagar') || owner.includes('highlaban')) {
            newName = "Indiranagar";
        } else if (addr.includes('jayanagar') || owner.includes('raja raheshwari')) {
            newName = "Jayanagar";
        }
        
        if (newName !== data.outletName || !data.city) {
            console.log(`Updating Franchise ${d.id} => outletName: "${newName}", city: "Bengaluru"`);
            await updateDoc(doc(firestore, "franchises", d.id), {
                outletName: newName,
                city: "Bengaluru",
                area: newName
            });
        }
    }

    // 2. Update Locations
    const locRef = collection(firestore, "locations");
    const locSnap = await getDocs(locRef);
    for (const d of locSnap.docs) {
        const data = d.data();
        console.log("Current Location:", d.id, data.name, data.area);
        let newArea = data.area;
        const nameStr = (data.name || '').toLowerCase();
        const areaStr = (data.area || '').toLowerCase();
        
        if (nameStr.includes('aecs') || areaStr.includes('aecs')) {
            newArea = "AECS Layout";
        } else if (nameStr.includes('indiranagar') || areaStr.includes('indiranagar')) {
            newArea = "Indiranagar";
        } else if (nameStr.includes('jayanagar') || areaStr.includes('jayanagar')) {
            newArea = "Jayanagar";
        }
        
        if (newArea && newArea !== data.area) {
            console.log(`Updating Location ${d.id} => area: "${newArea}"`);
            await updateDoc(doc(firestore, "locations", d.id), {
                area: newArea,
                name: data.name === "Bengaluru" ? "Bengaluru" : data.name
            });
        }
    }

    console.log("Outlet names successfully updated!");
    process.exit(0);
}

fixOutletNames().catch(err => {
    console.error(err);
    process.exit(1);
});
