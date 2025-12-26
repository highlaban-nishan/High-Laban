import { db as firestore, COLLECTIONS } from './firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';

// --- Pure Firestore Implementation ---

const db = {
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
        alert("Reset All is disabled for Cloud Database safety.");
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

    // --- Auth ---
    login: async (email, password) => {
        if (email === 'wazeert13@gmail.com' && password === '1234566') {
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
