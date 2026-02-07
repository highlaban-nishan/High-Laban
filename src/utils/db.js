import { db as firestore, COLLECTIONS } from './firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// --- Pure Firestore Implementation ---

const COLLECTIONS_EXT = { ...COLLECTIONS, SITE_CONTENT: 'site_content' };

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
            alert("Failed to save inquiry: " + error.message);
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

    // --- Auth ---
    login: async (email, password) => {
        if (email === 'highlaban@gmail.com' && password === 'Laban@2025') {
            const user = { email, name: 'Admin', role: 'admin' };
            localStorage.setItem('highlaban_user', JSON.stringify(user));
            return user;
        } else {
            throw new Error('Invalid email or password');
        }
    },
    logout: () => localStorage.removeItem('highlaban_user'),
    getUser: () => {
        try { return JSON.parse(localStorage.getItem('highlaban_user')); } catch (e) { return null; }
    }
};

export default db;
