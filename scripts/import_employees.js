import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";

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

const staffData = [
    {
        fullName: "Tiguangchuiliu Gangmei",
        nickname: "THAICHING",
        gender: "Female",
        dob: "2005-10-30",
        bloodGroup: "O+",
        email: "chuigangmei23@gmail.com",
        phone: "7085521758",
        alternatePhone: "6009257219",
        permanentAddress: "Manipur",
        currentAddress: "Jeevan Bima Nagar, Bangalore",
        emergencyContact: "Zenthuimei",
        emergencyPhone: "9862572080",
        status: "Permanent",
        position: "Staff",
        joinDate: new Date().toISOString().split('T')[0]
    },
    {
        fullName: "Nemhoiching Lhungdim",
        nickname: "AIZA",
        gender: "Female",
        dob: "2006-05-13",
        bloodGroup: "",
        email: "lhungdimnaosen@gmail.com",
        phone: "9863701485",
        alternatePhone: "93667632277",
        permanentAddress: "T. Gamnomjang",
        currentAddress: "S Canaan Veng, Tuibuong",
        emergencyContact: "Tilgin",
        emergencyPhone: "8131038572",
        status: "Permanent",
        position: "Staff",
        joinDate: new Date().toISOString().split('T')[0]
    },
    {
        fullName: "Bindu MB",
        nickname: "BINDU",
        gender: "Female",
        dob: "2006-05-18",
        bloodGroup: "O+",
        email: "bindu.bhaskar18@gmail.com",
        phone: "9945249057",
        alternatePhone: "",
        permanentAddress: "#13, 1st Main, 1st Cross, coconut garden, Arekere, Bannerghatta Road, next to adigas preschool, Bangalore-560076",
        currentAddress: "#13, 1st Main, 1st Cross, coconut garden, Arekere, Bannerghatta Road, next to adigas preschool, Bangalore-560076",
        emergencyContact: "Hari",
        emergencyPhone: "9008040902",
        status: "Permanent",
        position: "Staff",
        joinDate: new Date().toISOString().split('T')[0]
    },
    {
        fullName: "Gracy Siingeipuinath",
        nickname: "GRACY",
        gender: "Female",
        dob: "2004-02-01",
        bloodGroup: "O+",
        email: "gracysiingei8@gmail.com",
        phone: "6909504864",
        alternatePhone: "",
        permanentAddress: "Mayangkhang, senapati district, Manipur",
        currentAddress: "Indiranagar Jeevan Beem nagar, Bangalore",
        emergencyContact: "Chemma",
        emergencyPhone: "8732825587",
        bankName: "HDFC Bank",
        accountNumber: "50100767786883",
        ifscCode: "HDFC0006543",
        status: "Permanent",
        position: "Staff",
        joinDate: new Date().toISOString().split('T')[0]
    },
    {
        fullName: "Guirila Rangnamei",
        nickname: "KUIRI",
        gender: "Female",
        dob: "2004-10-29",
        bloodGroup: "O+",
        email: "guirilarangnamei@gmail.com",
        phone: "8794354179",
        alternatePhone: "",
        permanentAddress: "Mayangkhang Senapati Manipur",
        currentAddress: "Jeevan bima nagar main road highlaban, Bangalore",
        emergencyContact: "Aunty/Dad",
        emergencyPhone: "9366623036",
        status: "Permanent",
        position: "Staff",
        joinDate: new Date().toISOString().split('T')[0]
    },
    {
        fullName: "Nihal Ahmed Khan",
        nickname: "NIHAL",
        gender: "Male",
        dob: "2003-11-07",
        bloodGroup: "A+",
        email: "scorpio07nihal@gmail.com",
        phone: "9035851315",
        alternatePhone: "",
        permanentAddress: "#20/1 kenchappa garden, chamundi nagar main road, r.t.nagar, bengaluru 560032",
        currentAddress: "#101, primrose apartment, 2nd cross ranka nagar, kaval bairasandra, r.t.nagar, bengaluru 560032",
        emergencyContact: "Nayaz",
        emergencyPhone: "9845094573",
        bankName: "HDFC Bank",
        accountNumber: "50100801589581",
        status: "Permanent",
        position: "Staff",
        joinDate: new Date().toISOString().split('T')[0]
    },
    {
        fullName: "Kanga Sangei",
        nickname: "PUI",
        gender: "Female",
        dob: "2005-07-11",
        bloodGroup: "",
        email: "kkanga422@gmail.com",
        phone: "9366313016",
        alternatePhone: "8867007214",
        permanentAddress: "Mayangkhang Village, Senapati District",
        currentAddress: "Bangalore indiranagar",
        emergencyContact: "Relative",
        emergencyPhone: "6009897186",
        status: "Permanent",
        position: "Staff",
        joinDate: new Date().toISOString().split('T')[0]
    },
    {
        fullName: "Rosemary Sangeipuinath",
        nickname: "ROSE",
        gender: "Female",
        dob: "2005-02-06",
        bloodGroup: "O+",
        email: "sangeipuinathr@gmail.com",
        phone: "8369570167",
        alternatePhone: "",
        permanentAddress: "Manipur mayangkhang village",
        currentAddress: "indiranagar 17, jeevan bima nagar, Bangalore",
        emergencyContact: "Ringuila sangeipuinath (Sister)",
        emergencyPhone: "8798430568",
        bankName: "HDFC Bank",
        accountNumber: "50100767786870",
        ifscCode: "HDFC0006543",
        status: "Permanent",
        position: "Staff",
        joinDate: new Date().toISOString().split('T')[0]
    },
    {
        fullName: "Konjengbam Silky Devi",
        nickname: "SILKY",
        gender: "Female",
        dob: "2006-10-10",
        bloodGroup: "A+",
        email: "konjengbamsilky14@gmail.com",
        phone: "8798752735",
        alternatePhone: "9366381195",
        permanentAddress: "Kodompokpi Mamang Leikai, Imphal West, Manipur",
        currentAddress: "Gummanahalli, Bangalore, Karnataka",
        emergencyContact: "Konjengbam Bobi Singh (Father)",
        emergencyPhone: "9615215210",
        status: "Permanent",
        position: "Staff",
        joinDate: new Date().toISOString().split('T')[0]
    },
    {
        fullName: "Theirila Rangnamei",
        nickname: "THAIRI",
        gender: "Female",
        dob: "2007-09-29",
        bloodGroup: "O+",
        email: "angnameitheirila@gmail.com",
        phone: "8433951564",
        alternatePhone: "",
        permanentAddress: "Mayangkhang, senapati, Manipur",
        currentAddress: "491 jeevanbeema nagar main rd, Bangalore",
        emergencyContact: "Relative",
        emergencyPhone: "8974522625",
        status: "Permanent",
        position: "Staff",
        joinDate: new Date().toISOString().split('T')[0]
    },
    {
        fullName: "Teena Ngangom",
        nickname: "TINA",
        gender: "Female",
        dob: "2003-03-19",
        bloodGroup: "O+",
        email: "rextinababe@gmail.com",
        phone: "6009167454",
        alternatePhone: "",
        permanentAddress: "Phiwangbam Leikai, Moirang",
        currentAddress: "Indiranagar, Bengaluru",
        emergencyContact: "Spouse",
        emergencyPhone: "8147167614",
        status: "Permanent",
        position: "Staff",
        joinDate: new Date().toISOString().split('T')[0]
    },
    {
        fullName: "Mohammed Zaid Fareed",
        nickname: "ZAID",
        gender: "Male",
        dob: "2004-01-01",
        bloodGroup: "",
        email: "Zaidfareed2004@gmail.com",
        phone: "6302979535",
        alternatePhone: "",
        permanentAddress: "Svs Patel’s Callisto b414 talacauvery layout amruthahalli",
        currentAddress: "Svs Patel’s Callisto b414 talacauvery layout amruthahalli",
        emergencyContact: "Relative",
        emergencyPhone: "",
        status: "Permanent",
        position: "Staff",
        joinDate: new Date().toISOString().split('T')[0]
    },
    {
        fullName: "Nufoor",
        nickname: "NUFOOR",
        gender: "",
        dob: "2006-05-22",
        bloodGroup: "",
        email: "",
        phone: "",
        alternatePhone: "",
        permanentAddress: "",
        currentAddress: "",
        emergencyContact: "",
        emergencyPhone: "",
        status: "Permanent",
        position: "Staff",
        joinDate: new Date().toISOString().split('T')[0]
    },
    {
        fullName: "Machu",
        nickname: "MACHU",
        gender: "",
        dob: "2006-05-18",
        bloodGroup: "",
        email: "",
        phone: "",
        alternatePhone: "",
        permanentAddress: "",
        currentAddress: "",
        emergencyContact: "",
        emergencyPhone: "",
        status: "Permanent",
        position: "Staff",
        joinDate: new Date().toISOString().split('T')[0]
    }
];

async function run() {
    const collRef = collection(firestore, 'staff');
    const querySnapshot = await getDocs(collRef);
    const existingNicknames = new Set();
    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.nickname) {
            existingNicknames.add(data.nickname.toUpperCase());
        }
    });

    console.log("Checking and importing employee details...");
    for (const staff of staffData) {
        if (existingNicknames.has(staff.nickname.toUpperCase())) {
            console.log(`Skipping existing employee: ${staff.nickname}`);
            continue;
        }
        const docRef = await addDoc(collRef, staff);
        console.log(`Added employee: ${staff.nickname} (ID: ${docRef.id})`);
    }
    console.log("Import completed successfully!");
    process.exit(0);
}

run().catch(error => {
    console.error("Import failed:", error);
    process.exit(1);
});
