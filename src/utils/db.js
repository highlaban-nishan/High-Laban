import { db as firestore, COLLECTIONS } from './firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// --- Pure Firestore Implementation ---

const COLLECTIONS_EXT = { ...COLLECTIONS, SITE_CONTENT: 'site_content', STAFF: 'staff' };

const db = {
    // --- Site Content ---
    getSiteContent: async (sectionId) => {
        try {
            const docRef = doc(firestore, COLLECTIONS_EXT.SITE_CONTENT, sectionId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error getting content:", error);
            return null;
        }
    },

    subscribeToSiteContent: (sectionId, callback) => {
        const docRef = doc(firestore, COLLECTIONS_EXT.SITE_CONTENT, sectionId);
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback({ id: docSnap.id, ...docSnap.data() });
            } else {
                callback(null);
            }
        }, (error) => {
            console.error("Error subscribing to content:", error);
        });
    },

    updateSiteContent: async (sectionId, data) => {
        try {
            const docRef = doc(firestore, COLLECTIONS_EXT.SITE_CONTENT, sectionId);
            await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
            return true;
        } catch (error) {
            console.error("Error updating content:", error);
            throw error;
        }
    },

    // --- Products ---
    getProducts: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, COLLECTIONS.PRODUCTS));
            const products = [];
            querySnapshot.forEach((doc) => products.push({ id: doc.id, ...doc.data() }));
            return products;
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to load products: " + error.message);
            return [];
        }
    },

    addProduct: async (product) => {
        try {
            const docRef = await addDoc(collection(firestore, COLLECTIONS.PRODUCTS), product);
            return { id: docRef.id, ...product };
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to save to Cloud: " + error.message);
            throw error;
        }
    },

    updateProduct: async (id, updatedProduct) => {
        try {
            const productRef = doc(firestore, COLLECTIONS.PRODUCTS, id);
            await updateDoc(productRef, updatedProduct);
            return { id, ...updatedProduct };
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to update product: " + error.message);
            throw error;
        }
    },

    deleteProduct: async (id) => {
        try {
            await deleteDoc(doc(firestore, COLLECTIONS.PRODUCTS, id));
            return id;
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to delete product: " + error.message);
            throw error;
        }
    },

    // --- Orders ---
    getOrders: async () => {
        try {
            const q = query(collection(firestore, COLLECTIONS.ORDERS), orderBy('date', 'desc'));
            const querySnapshot = await getDocs(q);
            const orders = [];
            querySnapshot.forEach((doc) => orders.push({ id: doc.id, ...doc.data() }));
            return orders;
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to load orders: " + error.message);
            return [];
        }
    },

    createOrder: async (orderData) => {
        const finalOrder = {
            ...orderData,
            date: new Date().toISOString(),
            status: orderData.status || 'completed'
        };

        try {
            const docRef = await addDoc(collection(firestore, COLLECTIONS.ORDERS), finalOrder);
            return { id: docRef.id, ...finalOrder };
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to create order: " + error.message);
            throw error;
        }
    },

    resetOrders: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, COLLECTIONS.ORDERS));
            const deletePromises = [];
            querySnapshot.forEach((doc) => {
                deletePromises.push(deleteDoc(doc.ref));
            });
            await Promise.all(deletePromises);
            return true;
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to reset data: " + error.message);
            throw error;
        }
    },

    // --- Customers ---
    getCustomers: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, COLLECTIONS.CUSTOMERS));
            const customers = [];
            querySnapshot.forEach((doc) => customers.push({ id: doc.id, ...doc.data() }));
            return customers;
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to load customers: " + error.message);
            return [];
        }
    },

    saveCustomer: async (customer) => {
        try {
            await addDoc(collection(firestore, COLLECTIONS.CUSTOMERS), customer);
        } catch (error) {
            console.error("Firestore Error:", error);
            // Silent fail for customer save background op? No, let's alert for now.
            alert("Failed to save customer: " + error.message);
            throw error;
        }
    },

    // --- Stats ---
    getStats: async () => {
        const orders = await db.getOrders();
        const totalOrders = orders.length;
        const totalRevenue = orders
            .filter(o => o.status === 'completed')
            .reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
        const activeUsers = new Set(orders.map(o => o.customerPhone || o.customer)).size;

        return {
            totalOrders: { value: totalOrders.toLocaleString(), change: '+0%' },
            totalRevenue: { value: '₹' + totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 }), change: '+0%' },
            activeUsers: { value: activeUsers.toLocaleString(), change: '+0%' },
            pendingReview: { value: '0', change: '0%' }
        };
    },

    // --- Locations ---
    getLocations: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'locations'));
            const locations = [];
            querySnapshot.forEach((doc) => locations.push({ id: doc.id, ...doc.data() }));
            return locations;
        } catch (error) {
            console.error("Firestore Error:", error);
            // alert("Failed to load locations: " + error.message);
            return []; // Fail silent or empty
        }
    },

    addLocation: async (location) => {
        try {
            const docRef = await addDoc(collection(firestore, 'locations'), location);
            return { id: docRef.id, ...location };
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to save location: " + error.message);
            throw error;
        }
    },

    updateLocation: async (id, updatedLocation) => {
        try {
            const locationRef = doc(firestore, 'locations', id);
            await updateDoc(locationRef, updatedLocation);
            return { id, ...updatedLocation };
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to update location: " + error.message);
            throw error;
        }
    },

    deleteLocation: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'locations', id));
            return id;
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to delete location: " + error.message);
            throw error;
        }
    },

    // --- Locations ---
    getLocations: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'locations'));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error getting locations:", error);
            return [];
        }
    },

    subscribeToLocations: (callback) => {
        const q = query(collection(firestore, 'locations'));
        return onSnapshot(q, (querySnapshot) => {
            const locations = [];
            querySnapshot.forEach((doc) => {
                locations.push({ id: doc.id, ...doc.data() });
            });
            callback(locations);
        }, (error) => {
            console.error("Error subscribing to locations:", error);
            callback([]);
        });
    },

    // --- Franchise Inquiries ---
    getFranchiseInquiries: async () => {
        try {
            const q = query(collection(firestore, 'franchise_requests'), orderBy('date', 'desc'));
            const querySnapshot = await getDocs(q);
            const inquiries = [];
            querySnapshot.forEach((doc) => inquiries.push({ id: doc.id, ...doc.data() }));
            return inquiries;
        } catch (error) {
            console.error("Firestore Error:", error);
            return [];
        }
    },

    // Check if a franchise inquiry already exists for this phone OR email
    checkFranchiseDuplicate: async (phone, email) => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'franchise_requests'));
            let match = null;
            querySnapshot.forEach((docSnap) => {
                const d = docSnap.data();
                const normalizePhone = (p) => (p || '').replace(/\D/g, '').slice(-10);
                const normEmail = (e) => (e || '').toLowerCase().trim();
                if (
                    (phone && normalizePhone(d.phone) === normalizePhone(phone)) ||
                    (email && normEmail(d.email) === normEmail(email))
                ) {
                    if (!match) match = { id: docSnap.id, ...d };
                }
            });
            return match; // null if no duplicate
        } catch (error) {
            console.error("Firestore Error checking duplicate:", error);
            return null;
        }
    },

    // Merge new inquiry data into existing record (update locations + bump date)
    mergeFranchiseInquiry: async (existingId, newData) => {
        try {
            const docRef = doc(firestore, 'franchise_requests', existingId);
            const existingSnap = await getDoc(docRef);
            const existing = existingSnap.data() || {};
            const mergedLocations = [
                ...(existing.targetLocations || []),
                ...(newData.targetLocations || [])
            ].filter((loc, idx, arr) =>
                arr.findIndex(l => l.city === loc.city && l.state === loc.state) === idx
            );
            const updates = {
                ...newData,
                targetLocations: mergedLocations,
                updatedAt: new Date().toISOString(),
                reappliedAt: new Date().toISOString(),
                reapplyCount: (existing.reapplyCount || 0) + 1,
            };
            await updateDoc(docRef, updates);
            return { id: existingId, ...existing, ...updates };
        } catch (error) {
            console.error("Firestore Error merging inquiry:", error);
            throw error;
        }
    },

    addFranchiseInquiry: async (data) => {
        try {
            const finalData = {
                ...data,
                date: new Date().toISOString(),
                status: 'New'
            };
            const docRef = await addDoc(collection(firestore, 'franchise_requests'), finalData);
            return { id: docRef.id, ...finalData };
        } catch (error) {
            console.error("Firestore Error:", error);
            throw error;
        }
    },

    updateFranchiseInquiry: async (id, updatedData) => {
        try {
            const docRef = doc(firestore, 'franchise_requests', id);
            await updateDoc(docRef, updatedData);
            return true;
        } catch (error) {
            console.error("Firestore Error:", error);
            throw error;
        }
    },

    deleteFranchiseInquiry: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'franchise_requests', id));
            return id;
        } catch (error) {
            console.error("Firestore Error:", error);
            throw error;
        }
    },

    // --- Staff Management ---
    getStaff: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, COLLECTIONS_EXT.STAFF));
            const list = [];
            querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
            
            if (list.length === 0) {
                const samples = [
                    {
                        fullName: "Rahul Sharma",
                        nickname: "RAHUL",
                        gender: "Male",
                        dob: "1994-08-15",
                        bloodGroup: "O+",
                        email: "rahul.sharma@highlaban.com",
                        phone: "9876543210",
                        alternatePhone: "9876543211",
                        currentAddress: "S-2, Block B, Koramangala, Bangalore",
                        permanentAddress: "Flat 104, Sunrise Apartments, Jaipur, Rajasthan",
                        emergencyContact: "Alok Sharma (Father)",
                        emergencyPhone: "9876543219",
                        status: "Permanent",
                        position: "Manager",
                        salary: "35000",
                        incentive: "3500",
                        kpiRating: "5",
                        joinDate: "2024-01-10",
                        termDate: "",
                        bankName: "HDFC Bank",
                        accountNumber: "50100456123478",
                        ifscCode: "HDFC0000124",
                        workingDays: "26",
                        leavesTaken: "1",
                        aadhaarCollected: true,
                        panCollected: true,
                        medicalCollected: true
                    },
                    {
                        fullName: "Bindu M. B.",
                        nickname: "BINDU",
                        gender: "Female",
                        dob: "1997-03-24",
                        bloodGroup: "B+",
                        email: "bindu.mb@gmail.com",
                        phone: "9366732277",
                        alternatePhone: "",
                        currentAddress: "PG House, Indiranagar, Bangalore",
                        permanentAddress: "Ward 4, Near Temple, Wayanad, Kerala",
                        emergencyContact: "M. B. Balan (Father)",
                        emergencyPhone: "9845621456",
                        status: "Permanent",
                        position: "Chef",
                        salary: "22000",
                        incentive: "2500",
                        kpiRating: "4",
                        joinDate: "2024-03-15",
                        termDate: "",
                        bankName: "State Bank of India",
                        accountNumber: "30456123789",
                        ifscCode: "SBIN0000854",
                        workingDays: "26",
                        leavesTaken: "2",
                        aadhaarCollected: true,
                        panCollected: true,
                        medicalCollected: true
                    },
                    {
                        fullName: "Nihal Ahmed Khan",
                        nickname: "NIHAL",
                        gender: "Male",
                        dob: "1999-11-05",
                        bloodGroup: "A-",
                        email: "nihalkhan@gmail.com",
                        phone: "9863701485",
                        alternatePhone: "",
                        currentAddress: "No. 45, SG Palya, Bangalore",
                        permanentAddress: "Mohalla Kazi, Bhopal, Madhya Pradesh",
                        emergencyContact: "Javed Khan (Brother)",
                        emergencyPhone: "9765432101",
                        status: "Temporary",
                        position: "Waiter",
                        salary: "14500",
                        incentive: "1200",
                        kpiRating: "3",
                        joinDate: "2024-05-01",
                        termDate: "",
                        bankName: "ICICI Bank",
                        accountNumber: "001205612478",
                        ifscCode: "ICIC0000012",
                        workingDays: "26",
                        leavesTaken: "0",
                        aadhaarCollected: true,
                        panCollected: false,
                        medicalCollected: true
                    }
                ];

                for (const s of samples) {
                    const docRef = await addDoc(collection(firestore, COLLECTIONS_EXT.STAFF), s);
                    list.push({ id: docRef.id, ...s });
                }
            }
            return list;
        } catch (error) {
            console.error("Firestore Error:", error);
            return [];
        }
    },

    addStaff: async (staffData) => {
        try {
            const docRef = await addDoc(collection(firestore, COLLECTIONS_EXT.STAFF), staffData);
            return { id: docRef.id, ...staffData };
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to add staff: " + error.message);
            throw error;
        }
    },

    updateStaff: async (id, updatedData) => {
        try {
            const docRef = doc(firestore, COLLECTIONS_EXT.STAFF, id);
            await updateDoc(docRef, updatedData);
            return true;
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to update staff: " + error.message);
            throw error;
        }
    },

    deleteStaff: async (id) => {
        try {
            await deleteDoc(doc(firestore, COLLECTIONS_EXT.STAFF, id));
            return id;
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to delete staff: " + error.message);
            throw error;
        }
    },

    // --- Subscribers ---
    getSubscribers: async () => {
        try {
            const q = query(collection(firestore, 'subscribers'), orderBy('date', 'desc'));
            const querySnapshot = await getDocs(q);
            const subscribers = [];
            querySnapshot.forEach((doc) => subscribers.push({ id: doc.id, ...doc.data() }));
            return subscribers;
        } catch (error) {
            console.error("Firestore Error:", error);
            return [];
        }
    },

    deleteSubscriber: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'subscribers', id));
            return id;
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to delete subscriber: " + error.message);
            throw error;
        }
    },

    saveSubscriber: async (email) => {
        try {
            // Check if already exists (optional but good) - skipping for simplicity as per request
            const data = {
                email,
                date: new Date().toISOString()
            };
            await addDoc(collection(firestore, 'subscribers'), data);
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to subscribe: " + error.message);
            throw error;
        }
    },

    // --- Approved Franchises CRUD ---
    getFranchises: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'franchises'));
            const list = [];
            querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));

            return list;
        } catch (error) {
            console.error("Firestore Error:", error);
            return [];
        }
    },

    addFranchiseOutlet: async (data) => {
        try {
            const finalData = { ...data, updatedAt: new Date().toISOString() };
            const docRef = await addDoc(collection(firestore, 'franchises'), finalData);
            return { id: docRef.id, ...finalData };
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to add franchise outlet: " + error.message);
            throw error;
        }
    },

    updateFranchiseOutlet: async (id, data) => {
        try {
            const docRef = doc(firestore, 'franchises', id);
            const finalData = { ...data, updatedAt: new Date().toISOString() };
            await updateDoc(docRef, finalData);
            return { id, ...finalData };
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to update franchise outlet: " + error.message);
            throw error;
        }
    },

    deleteFranchiseOutlet: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'franchises', id));
            return id;
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to delete franchise outlet: " + error.message);
            throw error;
        }
    },

    // --- Kitchens CRUD (Hub & Spoke Model) ---
    getKitchens: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'kitchens'));
            const list = [];
            querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
            
            // Seed a default Main Kitchen if empty
            if (list.length === 0) {
                const defaultKitchen = {
                    name: "Bangalore Main Kitchen",
                    city: "Bengaluru",
                    fixedCosts: [],
                    projectedMonthlyVolume: "10000",
                    updatedAt: new Date().toISOString()
                };
                const docRef = await addDoc(collection(firestore, 'kitchens'), defaultKitchen);
                list.push({ id: docRef.id, ...defaultKitchen });
            }
            return list;
        } catch (error) {
            console.error("Firestore Error:", error);
            return [];
        }
    },

    addKitchen: async (data) => {
        try {
            const finalData = { ...data, updatedAt: new Date().toISOString() };
            const docRef = await addDoc(collection(firestore, 'kitchens'), finalData);
            return { id: docRef.id, ...finalData };
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to add kitchen: " + error.message);
            throw error;
        }
    },

    updateKitchen: async (id, data) => {
        try {
            const docRef = doc(firestore, 'kitchens', id);
            const finalData = { ...data, updatedAt: new Date().toISOString() };
            await updateDoc(docRef, finalData);
            return { id, ...finalData };
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to update kitchen: " + error.message);
            throw error;
        }
    },

    deleteKitchen: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'kitchens', id));
            return id;
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to delete kitchen: " + error.message);
            throw error;
        }
    },

    // --- Payroll CRUD ---
    getPayrollRecords: async (monthStr) => {
        try {
            // monthStr e.g. "2026-07"
            const querySnapshot = await getDocs(collection(firestore, 'payroll'));
            const list = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.month === monthStr) {
                    list.push({ id: doc.id, ...data });
                }
            });
            return list;
        } catch (error) {
            console.error("Firestore Error:", error);
            return [];
        }
    },

    getAllPayrollRecords: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'payroll'));
            const list = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            return list;
        } catch (error) {
            console.error("Firestore Error:", error);
            return [];
        }
    },

    savePayrollRecord: async (monthStr, staffId, recordData) => {
        try {
            const docId = `${monthStr}_${staffId}`;
            const docRef = doc(firestore, 'payroll', docId);
            const finalData = {
                ...recordData,
                month: monthStr,
                staffId: staffId,
                updatedAt: new Date().toISOString()
            };
            await setDoc(docRef, finalData, { merge: true });
            return { id: docId, ...finalData };
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("Failed to save payroll record: " + error.message);
            throw error;
        }
    },

    // --- Vendors ---
    getVendors: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'vendors'));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Firestore Error:', error);
            return [];
        }
    },

    addVendor: async (data) => {
        try {
            const finalData = { ...data, createdAt: new Date().toISOString() };
            const docRef = await addDoc(collection(firestore, 'vendors'), finalData);
            return { id: docRef.id, ...finalData };
        } catch (error) {
            console.error('Firestore Error:', error);
            throw error;
        }
    },

    updateVendor: async (id, data) => {
        try {
            const docRef = doc(firestore, 'vendors', id);
            const finalData = { ...data, updatedAt: new Date().toISOString() };
            await updateDoc(docRef, finalData);
            return { id, ...finalData };
        } catch (error) {
            console.error('Firestore Error:', error);
            throw error;
        }
    },

    deleteVendor: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'vendors', id));
            return id;
        } catch (error) {
            console.error('Firestore Error:', error);
            throw error;
        }
    },

    // --- Daily Purchases ---
    getPurchases: async () => {
        try {
            const q = query(collection(firestore, 'purchases'), orderBy('date', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Firestore Error:', error);
            return [];
        }
    },

    addPurchase: async (data) => {
        try {
            const finalData = { ...data, createdAt: new Date().toISOString() };
            const docRef = await addDoc(collection(firestore, 'purchases'), finalData);
            return { id: docRef.id, ...finalData };
        } catch (error) {
            console.error('Firestore Error:', error);
            throw error;
        }
    },

    updatePurchase: async (id, data) => {
        try {
            const docRef = doc(firestore, 'purchases', id);
            await updateDoc(docRef, data);
            return { id, ...data };
        } catch (error) {
            console.error('Firestore Error:', error);
            throw error;
        }
    },

    deletePurchase: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'purchases', id));
            return id;
        } catch (error) {
            console.error('Firestore Error:', error);
            throw error;
        }
    },

    // --- Auth & User Management ---
    getUsers: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'users'));
            const list = [];
            querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
            
            if (list.length === 0) {
                // Seed default users
                const defaults = [
                    { name: 'Admin', email: 'highlaban@gmail.com', password: 'Laban@2025', role: 'admin' },
                    { name: 'Marchad', email: 'marchad@highlaban.com', password: 'Marchad@2026', role: 'purchaser' },
                    { name: 'Nufoor', email: 'nufoor@highlaban.com', password: 'Nufoor@2026', role: 'purchaser' },
                    { name: 'Accounts Team', email: 'accounts@highlaban.com', password: 'Accounts@2026', role: 'accounts' },
                    { name: 'Chef', email: 'chef@highlaban.com', password: 'Chef@2026', role: 'chef' },
                    { name: 'Partner', email: 'partner@highlaban.com', password: 'Partner@2026', role: 'partner' }
                ];
                for (const u of defaults) {
                    const docRef = await addDoc(collection(firestore, 'users'), u);
                    list.push({ id: docRef.id, ...u });
                }
            }
            return list;
        } catch (error) {
            console.error('Firestore Error getting users:', error);
            return [];
        }
    },

    addUser: async (data) => {
        try {
            const finalData = { ...data, createdAt: new Date().toISOString() };
            const docRef = await addDoc(collection(firestore, 'users'), finalData);
            return { id: docRef.id, ...finalData };
        } catch (error) {
            console.error('Firestore Error adding user:', error);
            throw error;
        }
    },

    updateUser: async (id, data) => {
        try {
            const docRef = doc(firestore, 'users', id);
            await updateDoc(docRef, data);
            return { id, ...data };
        } catch (error) {
            console.error('Firestore Error updating user:', error);
            throw error;
        }
    },

    deleteUser: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'users', id));
            return id;
        } catch (error) {
            console.error('Firestore Error deleting user:', error);
            throw error;
        }
    },

    login: async (email, password) => {
        const cleanEmail = email.toLowerCase().trim();
        try {
            // First check Firestore users
            const querySnapshot = await getDocs(collection(firestore, 'users'));
            let foundUser = null;
            querySnapshot.forEach((doc) => {
                const u = doc.data();
                if (u.email && u.email.toLowerCase().trim() === cleanEmail && u.password === password) {
                    foundUser = { id: doc.id, ...u };
                }
            });
            if (foundUser) {
                const user = { 
                    email: foundUser.email, 
                    name: foundUser.name, 
                    role: foundUser.role,
                    allowedTabs: foundUser.allowedTabs || []
                };
                localStorage.setItem('highlaban_user', JSON.stringify(user));
                return user;
            }
        } catch (error) {
            console.error('Firestore login query failed, checking static credentials:', error);
        }

        // Fallback to static credentials if Firestore query didn't find anything or failed
        if (cleanEmail === 'highlaban@gmail.com' && password === 'Laban@2025') {
            const user = { email: cleanEmail, name: 'Admin', role: 'admin', allowedTabs: ['products', 'content', 'locations', 'customers', 'franchise', 'staff', 'payroll', 'vendors', 'purchases', 'costing'] };
            localStorage.setItem('highlaban_user', JSON.stringify(user));
            return user;
        } else if (cleanEmail === 'marchad@highlaban.com' && password === 'Marchad@2026') {
            const user = { email: cleanEmail, name: 'Marchad', role: 'purchaser', allowedTabs: ['purchases', 'vendors'] };
            localStorage.setItem('highlaban_user', JSON.stringify(user));
            return user;
        } else if (cleanEmail === 'nufoor@highlaban.com' && password === 'Nufoor@2026') {
            const user = { email: cleanEmail, name: 'Nufoor', role: 'purchaser', allowedTabs: ['purchases', 'vendors'] };
            localStorage.setItem('highlaban_user', JSON.stringify(user));
            return user;
        } else if (cleanEmail === 'accounts@highlaban.com' && password === 'Accounts@2026') {
            const user = { email: cleanEmail, name: 'Accounts Team', role: 'accounts', allowedTabs: ['purchases', 'vendors'] };
            localStorage.setItem('highlaban_user', JSON.stringify(user));
            return user;
        } else if (cleanEmail === 'chef@highlaban.com' && password === 'Chef@2026') {
            const user = { email: cleanEmail, name: 'Chef', role: 'chef', allowedTabs: ['costing', 'products'] };
            localStorage.setItem('highlaban_user', JSON.stringify(user));
            return user;
        } else if (cleanEmail === 'partner@highlaban.com' && password === 'Partner@2026') {
            const user = { email: cleanEmail, name: 'Partner', role: 'partner', allowedTabs: ['products', 'content', 'locations', 'customers', 'franchise', 'staff', 'payroll', 'vendors', 'purchases', 'costing'] };
            localStorage.setItem('highlaban_user', JSON.stringify(user));
            return user;
        } else {
            throw new Error('Invalid email or password');
        }
    },
    // --- Food Costing ERP CRUD ---
    getRawMaterials: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'rawMaterials'));
            const list = [];
            querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
            return list;
        } catch (error) {
            console.error('Error getting raw materials:', error);
            return [];
        }
    },
    addRawMaterial: async (data) => {
        try {
            const docRef = await addDoc(collection(firestore, 'rawMaterials'), data);
            return { id: docRef.id, ...data };
        } catch (error) {
            console.error('Error adding raw material:', error);
            throw error;
        }
    },
    updateRawMaterial: async (id, data) => {
        try {
            const docRef = doc(firestore, 'rawMaterials', id);
            await updateDoc(docRef, data);
            return { id, ...data };
        } catch (error) {
            console.error('Error updating raw material:', error);
            throw error;
        }
    },
    deleteRawMaterial: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'rawMaterials', id));
            return id;
        } catch (error) {
            console.error('Error deleting raw material:', error);
            throw error;
        }
    },

    getBundleItems: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'bundleItems'));
            const list = [];
            querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
            return list;
        } catch (error) {
            console.error('Error getting bundle items:', error);
            return [];
        }
    },
    addBundleItem: async (data) => {
        try {
            const docRef = await addDoc(collection(firestore, 'bundleItems'), data);
            return { id: docRef.id, ...data };
        } catch (error) {
            console.error('Error adding bundle item:', error);
            throw error;
        }
    },
    updateBundleItem: async (id, data) => {
        try {
            const docRef = doc(firestore, 'bundleItems', id);
            await updateDoc(docRef, data);
            return { id, ...data };
        } catch (error) {
            console.error('Error updating bundle item:', error);
            throw error;
        }
    },
    deleteBundleItem: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'bundleItems', id));
            return id;
        } catch (error) {
            console.error('Error deleting bundle item:', error);
            throw error;
        }
    },

    getRecipes: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'recipes'));
            const list = [];
            querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
            return list;
        } catch (error) {
            console.error('Error getting recipes:', error);
            return [];
        }
    },
    saveRecipe: async (productId, data) => {
        try {
            const docRef = doc(firestore, 'recipes', productId);
            await setDoc(docRef, data, { merge: true });
            return { id: productId, ...data };
        } catch (error) {
            console.error('Error saving recipe:', error);
            throw error;
        }
    },
    logout: () => localStorage.removeItem('highlaban_user'),
    getUser: () => {
        try { return JSON.parse(localStorage.getItem('highlaban_user')); } catch (e) { return null; }
    },

    // --- Blogs ---
    getBlogs: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'blogs'));
            const list = [];
            querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
            return list.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error getting blogs:', error);
            return [];
        }
    },
    addBlog: async (data) => {
        try {
            const finalData = { ...data, date: new Date().toISOString() };
            const docRef = await addDoc(collection(firestore, 'blogs'), finalData);
            return { id: docRef.id, ...finalData };
        } catch (error) {
            console.error('Error adding blog:', error);
            throw error;
        }
    },
    updateBlog: async (id, data) => {
        try {
            const docRef = doc(firestore, 'blogs', id);
            await updateDoc(docRef, data);
            return { id, ...data };
        } catch (error) {
            console.error('Error updating blog:', error);
            throw error;
        }
    },
    deleteBlog: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'blogs', id));
            return id;
        } catch (error) {
            console.error('Error deleting blog:', error);
            throw error;
        }
    },

    // --- Social Links (For Connect Page) ---
    getSocialLinks: async () => {
        try {
            const docRef = doc(firestore, 'settings', 'socialLinks');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                const defaultLinks = {
                    instagram: 'https://instagram.com/highlaban',
                    whatsapp: 'https://wa.me/917483837201',
                    linkedin: 'https://linkedin.com/company/highlaban',
                    website: 'https://highlaban.web.app',
                    menu: 'https://highlaban.web.app/menu',
                    orderZomato: '',
                    orderSwiggy: '',
                    orderMagicPin: '',
                    orderOwnly: ''
                };
                await setDoc(docRef, defaultLinks);
                return defaultLinks;
            }
        } catch (error) {
            console.error('Error getting social links:', error);
            return null;
        }
    },
    saveSocialLinks: async (data) => {
        try {
            const docRef = doc(firestore, 'settings', 'socialLinks');
            await setDoc(docRef, data, { merge: true });
            return data;
        } catch (error) {
            console.error('Error saving social links:', error);
            throw error;
        }
    },

    // --- Worker Applications / Hiring leads ---
    getWorkerApplications: async () => {
        try {
            const q = query(collection(firestore, 'worker_applications'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const applications = [];
            querySnapshot.forEach((doc) => applications.push({ id: doc.id, ...doc.data() }));
            return applications;
        } catch (error) {
            console.error("Error getting worker applications:", error);
            return [];
        }
    },

    addWorkerApplication: async (appData) => {
        try {
            const docRef = await addDoc(collection(firestore, 'worker_applications'), {
                ...appData,
                createdAt: new Date().toISOString()
            });
            return { id: docRef.id, ...appData };
        } catch (error) {
            console.error("Error adding worker application:", error);
            throw error;
        }
    },

    updateWorkerApplication: async (id, updatedData) => {
        try {
            const docRef = doc(firestore, 'worker_applications', id);
            await updateDoc(docRef, updatedData);
            return true;
        } catch (error) {
            console.error("Error updating worker application:", error);
            throw error;
        }
    },

    deleteWorkerApplication: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'worker_applications', id));
            return id;
        } catch (error) {
            console.error("Error deleting worker application:", error);
            throw error;
        }
    },

    getContactMessages: async () => {
        try {
            const q = query(collection(firestore, 'contact_messages'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const messages = [];
            querySnapshot.forEach((doc) => messages.push({ id: doc.id, ...doc.data() }));
            return messages;
        } catch (error) {
            console.error("Error getting contact messages:", error);
            return [];
        }
    },

    addContactMessage: async (msgData) => {
        try {
            const docRef = await addDoc(collection(firestore, 'contact_messages'), {
                ...msgData,
                createdAt: new Date().toISOString()
            });
            return { id: docRef.id, ...msgData };
        } catch (error) {
            console.error("Error adding contact message:", error);
            throw error;
        }
    },

    deleteContactMessage: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'contact_messages', id));
            return id;
        } catch (error) {
            console.error("Error deleting contact message:", error);
            throw error;
        }
    },

    // --- Stock Transfers & Inventory ---
    getTransfers: async () => {
        try {
            const q = query(collection(firestore, 'transfers'), orderBy('sentAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const transfers = [];
            querySnapshot.forEach((doc) => transfers.push({ id: doc.id, ...doc.data() }));
            return transfers;
        } catch (error) {
            console.error("Error getting transfers:", error);
            return [];
        }
    },

    addTransfer: async (transferData) => {
        try {
            const docRef = await addDoc(collection(firestore, 'transfers'), {
                ...transferData,
                sentAt: new Date().toISOString()
            });
            return { id: docRef.id, ...transferData };
        } catch (error) {
            console.error("Error adding transfer:", error);
            throw error;
        }
    },

    updateTransfer: async (id, updatedData) => {
        try {
            const docRef = doc(firestore, 'transfers', id);
            await updateDoc(docRef, updatedData);
            return true;
        } catch (error) {
            console.error("Error updating transfer:", error);
            throw error;
        }
    },

    deleteTransfer: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'transfers', id));
            return id;
        } catch (error) {
            console.error("Error deleting transfer:", error);
            throw error;
        }
    },

    getLocalPurchases: async () => {
        try {
            const q = query(collection(firestore, 'local_purchases'), orderBy('date', 'desc'));
            const querySnapshot = await getDocs(q);
            const purchases = [];
            querySnapshot.forEach((doc) => purchases.push({ id: doc.id, ...doc.data() }));
            return purchases;
        } catch (error) {
            console.error("Error getting local purchases:", error);
            return [];
        }
    },

    addLocalPurchase: async (purchaseData) => {
        try {
            const docRef = await addDoc(collection(firestore, 'local_purchases'), purchaseData);
            return { id: docRef.id, ...purchaseData };
        } catch (error) {
            console.error("Error adding local purchase:", error);
            throw error;
        }
    },

    deleteLocalPurchase: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'local_purchases', id));
            return id;
        } catch (error) {
            console.error("Error deleting local purchase:", error);
            throw error;
        }
    },

    getInventoryStocks: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'inventory_stock'));
            const stocks = [];
            querySnapshot.forEach((doc) => stocks.push({ id: doc.id, ...doc.data() }));
            return stocks;
        } catch (error) {
            console.error("Error getting inventory stock:", error);
            return [];
        }
    },

    saveInventoryStock: async (outletId, itemId, itemType, data) => {
        try {
            const docId = `${outletId}_${itemId}`;
            const docRef = doc(firestore, 'inventory_stock', docId);
            await setDoc(docRef, {
                outletId,
                itemId,
                itemType,
                ...data,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            return true;
        } catch (error) {
            console.error("Error saving inventory stock:", error);
            throw error;
        }
    },

    getBackupData: async () => {
        try {
            const collectionsToBackup = [
                'products', 'raw_materials', 'recipes', 'bundle_items', 'purchases',
                'kitchens', 'franchises', 'franchise_inquiries', 'locations', 'users',
                'subscribers', 'payroll', 'vendors', 'transfers', 'local_purchases',
                'inventory_stock', 'contact_messages', 'worker_applications',
                'custom_inventory_items', 'daily_sales', 'franchise_transactions'
            ];
            const backup = {};
            await Promise.all(collectionsToBackup.map(async (colName) => {
                try {
                    const snapshot = await getDocs(collection(firestore, colName));
                    const list = [];
                    snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
                    backup[colName] = list;
                } catch (err) {
                    console.warn(`Could not backup collection ${colName}:`, err);
                    backup[colName] = [];
                }
            }));
            return backup;
        } catch (error) {
            console.error("Backup error:", error);
            throw error;
        }
    },

    getCustomInventoryItems: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'custom_inventory_items'));
            const list = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            return list;
        } catch (error) {
            console.error("Error getting custom inventory items:", error);
            return [];
        }
    },

    addCustomInventoryItem: async (item) => {
        try {
            const docRef = await addDoc(collection(firestore, 'custom_inventory_items'), {
                ...item,
                createdAt: new Date().toISOString()
            });
            return { id: docRef.id, ...item };
        } catch (error) {
            console.error("Error adding custom inventory item:", error);
            throw error;
        }
    },

    deleteCustomInventoryItem: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'custom_inventory_items', id));
            return true;
        } catch (error) {
            console.error("Error deleting custom inventory item:", error);
            throw error;
        }
    },

    getDailySales: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'daily_sales'));
            const list = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            return list;
        } catch (error) {
            console.error("Error getting daily sales:", error);
            return [];
        }
    },

    addDailySale: async (sale) => {
        try {
            const docRef = await addDoc(collection(firestore, 'daily_sales'), {
                ...sale,
                createdAt: new Date().toISOString()
            });
            return { id: docRef.id, ...sale };
        } catch (error) {
            console.error("Error adding daily sale:", error);
            throw error;
        }
    },

    deleteDailySale: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'daily_sales', id));
            return true;
        } catch (error) {
            console.error("Error deleting daily sale:", error);
            throw error;
        }
    },

    getFranchiseTransactions: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'franchise_transactions'));
            const list = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            return list;
        } catch (error) {
            console.error("Error getting franchise transactions:", error);
            return [];
        }
    },

    addFranchiseTransaction: async (tx) => {
        try {
            const docRef = await addDoc(collection(firestore, 'franchise_transactions'), {
                ...tx,
                createdAt: new Date().toISOString()
            });
            return { id: docRef.id, ...tx };
        } catch (error) {
            console.error("Error adding franchise transaction:", error);
            throw error;
        }
    },

    deleteFranchiseTransaction: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'franchise_transactions', id));
            return true;
        } catch (error) {
            console.error("Error deleting franchise transaction:", error);
            throw error;
        }
    },

    // --- Franchise Cash Management ---
    getFranchiseCashEntries: async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'franchise_cash_entries'));
            const list = [];
            querySnapshot.forEach((docSnap) => {
                list.push({ id: docSnap.id, ...docSnap.data() });
            });
            return list.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error("Error getting franchise cash entries:", error);
            return [];
        }
    },

    addFranchiseCashEntry: async (entry) => {
        try {
            const docRef = await addDoc(collection(firestore, 'franchise_cash_entries'), {
                ...entry,
                createdAt: new Date().toISOString()
            });
            return { id: docRef.id, ...entry };
        } catch (error) {
            console.error("Error adding franchise cash entry:", error);
            throw error;
        }
    },

    updateFranchiseCashEntry: async (id, entry) => {
        try {
            const ref = doc(firestore, 'franchise_cash_entries', id);
            await updateDoc(ref, { ...entry, updatedAt: new Date().toISOString() });
            return { id, ...entry };
        } catch (error) {
            console.error("Error updating franchise cash entry:", error);
            throw error;
        }
    },

    deleteFranchiseCashEntry: async (id) => {
        try {
            await deleteDoc(doc(firestore, 'franchise_cash_entries', id));
            return true;
        } catch (error) {
            console.error("Error deleting franchise cash entry:", error);
            throw error;
        }
    }
};

export default db;

