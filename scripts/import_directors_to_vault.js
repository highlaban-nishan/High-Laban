import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

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

const directorsVaultData = [
    {
        id: "dir_nishan",
        fullName: "MOHAMMED NISHAN P",
        designation: "Co-Founder & Managing Director",
        dob: "1997-11-21",
        email: "nishanshanvkd@gmail.com",
        phone: "9745823864",
        dinNumber: "09856454",
        panNumber: "",
        aadhaarNumber: "",
        profilePictureUrl: "",
        panUrl: "",
        aadhaarUrl: "",
        bankStatementUrl: "",
        signatureUrl: "",
        documents: []
    },
    {
        id: "dir_marshad",
        fullName: "MUHAMMAD MARSHAD P T K",
        designation: "Co-Founder & Director",
        dob: "2006-05-18",
        email: "muhammedmarshed1@gmail.com",
        phone: "9048967003",
        panNumber: "IHWPP4635P",
        aadhaarNumber: "377019020676",
        dinNumber: "",
        profilePictureUrl: "",
        panUrl: "",
        aadhaarUrl: "",
        bankStatementUrl: "",
        signatureUrl: "",
        documents: []
    },
    {
        id: "dir_nufoor",
        fullName: "MUHAMMAD NUFOOR M K",
        designation: "Co-Founder & Chief Product Officer",
        dob: "2006-05-22",
        email: "mohmdnufoor@gmail.com",
        phone: "7012298806",
        panNumber: "QQRPK7442F",
        aadhaarNumber: "637397488587",
        dinNumber: "",
        profilePictureUrl: "",
        panUrl: "",
        aadhaarUrl: "",
        bankStatementUrl: "",
        signatureUrl: "",
        documents: []
    },
    {
        id: "dir_sayeed",
        fullName: "SAYEED P T K",
        designation: "Director",
        dob: "1982-06-22",
        email: "Sayeedptk@gmail.com",
        phone: "9060100100",
        panNumber: "DAOPS5257N",
        aadhaarNumber: "657528041129",
        dinNumber: "",
        profilePictureUrl: "",
        panUrl: "",
        aadhaarUrl: "",
        bankStatementUrl: "",
        signatureUrl: "",
        documents: []
    },
    {
        id: "dir_sinan",
        fullName: "MUHAMMED SINAN",
        designation: "Director",
        dob: "2003-09-29",
        email: "msinanpp3@gmail.com",
        phone: "7592825305",
        panNumber: "KLAPM2270R",
        aadhaarNumber: "825061115217",
        dinNumber: "",
        profilePictureUrl: "",
        panUrl: "",
        aadhaarUrl: "",
        bankStatementUrl: "",
        signatureUrl: "",
        documents: []
    }
];

async function importToVault() {
    console.log("Importing profiles into Directors & Founders Vault...");
    for (const dir of directorsVaultData) {
        console.log(`Saving ${dir.fullName} to 'directors' collection...`);
        await setDoc(doc(firestore, "directors", dir.id), dir, { merge: true });
    }
    console.log("Import successfully completed!");
    process.exit(0);
}

importToVault().catch(err => {
    console.error(err);
    process.exit(1);
});
