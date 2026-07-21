import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, doc, setDoc, updateDoc } from "firebase/firestore";

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

const directorsData = [
    {
        fullName: "MOHAMMED NISHAN P",
        nickname: "NISHAN",
        gender: "Male",
        dob: "1997-11-21",
        email: "nishanshanvkd@gmail.com",
        phone: "9745823864",
        dinNumber: "09856454",
        status: "Permanent",
        position: "Co-Founder & Managing Director",
        isDirector: true,
        joinDate: "2024-01-01"
    },
    {
        fullName: "MUHAMMAD MARSHAD P T K",
        nickname: "MARSHAD",
        gender: "Male",
        dob: "2006-05-18",
        email: "muhammedmarshed1@gmail.com",
        phone: "9048967003",
        panNumber: "IHWPP4635P",
        aadhaarNumber: "3770 1902 0676",
        status: "Permanent",
        position: "Co-Founder & Director",
        isDirector: true,
        joinDate: "2024-01-01"
    },
    {
        fullName: "MUHAMMAD NUFOOR M K",
        nickname: "NUFOOR",
        gender: "Male",
        dob: "2006-05-22",
        email: "mohmdnufoor@gmail.com",
        phone: "7012298806",
        panNumber: "QQRPK7442F",
        aadhaarNumber: "6373 9748 8587",
        status: "Permanent",
        position: "Co-Founder & Chief Product Officer",
        isDirector: true,
        joinDate: "2024-01-01"
    },
    {
        fullName: "SAYEED P T K",
        nickname: "SAYEED",
        gender: "Male",
        dob: "1982-06-22",
        email: "Sayeedptk@gmail.com",
        phone: "9060100100",
        panNumber: "DAOPS5257N",
        aadhaarNumber: "6575 2804 1129",
        status: "Permanent",
        position: "Director",
        isDirector: true,
        joinDate: "2024-01-01"
    },
    {
        fullName: "MUHAMMED SINAN",
        nickname: "SINAN",
        gender: "Male",
        dob: "2003-09-29",
        email: "msinanpp3@gmail.com",
        phone: "7592825305",
        panNumber: "KLAPM2270R",
        aadhaarNumber: "8250 6111 5217",
        status: "Permanent",
        position: "Director",
        isDirector: true,
        joinDate: "2024-01-01"
    }
];

const companyDetails = {
    companyName: "HighLaban Foods Private Limited",
    companyEmail: "Info@highlaban.com",
    alternateEmail: "highlaban@gmail.com",
    phone: "7353100100",
    hqAddress: "17, Jeevan Bima Nagar Main Rd, HAL 3rd Stage, Bengaluru, Karnataka 560075"
};

async function importDirectorsAndCompany() {
    console.log("Checking and importing Director & Founder details...");
    
    const staffRef = collection(firestore, "staff");
    const snapshot = await getDocs(staffRef);
    const existingStaff = [];
    snapshot.forEach(doc => {
        existingStaff.push({ id: doc.id, ...doc.data() });
    });

    for (const d of directorsData) {
        const match = existingStaff.find(s => 
            (s.email && s.email.toLowerCase() === d.email.toLowerCase()) || 
            (s.phone && s.phone === d.phone) ||
            (s.fullName && s.fullName.toLowerCase().includes(d.nickname.toLowerCase()))
        );

        if (match) {
            console.log(`Updating existing record for ${d.fullName} (ID: ${match.id})`);
            await updateDoc(doc(firestore, "staff", match.id), d);
        } else {
            console.log(`Adding new director: ${d.fullName}`);
            const docRef = await addDoc(staffRef, d);
            console.log(`Added ${d.fullName} with ID: ${docRef.id}`);
        }
    }

    // Save company details into settings/company_details
    console.log("Saving company details into settings/company_details...");
    await setDoc(doc(firestore, "settings", "company_details"), companyDetails, { merge: true });

    // Update socialLinks / contact info if present
    console.log("Updating contact info in settings/socialLinks...");
    await setDoc(doc(firestore, "settings", "socialLinks"), {
        companyEmail: companyDetails.companyEmail,
        alternateEmail: companyDetails.alternateEmail,
        contactPhone: companyDetails.phone
    }, { merge: true });

    // Update about_founders list for About Us page
    console.log("Updating about_founders in settings/site_content...");
    const foundersList = directorsData.map(d => ({
        name: d.fullName,
        role: d.position,
        email: d.email,
        phone: d.phone,
        imageUrl: ''
    }));
    await setDoc(doc(firestore, "site_content", "about_founders"), { foundersList }, { merge: true });

    console.log("Import completed successfully!");
    process.exit(0);
}

importDirectorsAndCompany().catch(err => {
    console.error("Error during import:", err);
    process.exit(1);
});
