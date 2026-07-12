import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../utils/db';
import { uploadMedia } from '../utils/storage';
import styles from './AdminDashboard.module.css';
import logo from '../assets/logo.png';

import ImageCropper from '../components/UI/ImageCropper';
import Highlights from '../components/Sections/Highlights'; // For Live Preview
import SEO from '../components/SEO/SEO';
import { FiShoppingBag, FiFileText, FiMapPin, FiUsers, FiBriefcase, FiUserCheck, FiDollarSign, FiTruck, FiShoppingCart, FiPieChart, FiGlobe, FiDownload } from 'react-icons/fi';
import { QRCodeCanvas } from 'qrcode.react';
// import SalesChart from '../components/Dashboard/SalesChart'; // Removed as per request
// import POS from '../components/Dashboard/POS'; // Removed as per user request

// Icons
const LoopIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#cbd5e1"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const TrashIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const LogoutIcon = () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const SaveIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const EditIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;

const toInputDate = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('-')) return dateStr; // already YYYY-MM-DD
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            // Assuming DD/MM/YYYY
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
    }
    return dateStr;
};

const getProrationFactor = (staff, monthStr) => {
    if (!monthStr) return 1;
    try {
        const [year, month] = monthStr.split('-').map(Number);
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0); // Last day of month
        const totalDaysInMonth = monthEnd.getDate();

        let joinDateObj = null;
        const joinStr = staff.joinDate || staff.doj;
        if (joinStr) {
            joinDateObj = new Date(toInputDate(joinStr));
        }

        let termDateObj = null;
        if (staff.status === 'Terminated' && (staff.termDate || staff.termDate === '')) {
            termDateObj = staff.termDate ? new Date(toInputDate(staff.termDate)) : new Date();
        }

        // Determine start boundary for this month
        let activeStart = monthStart;
        if (joinDateObj && joinDateObj > monthStart) {
            activeStart = joinDateObj;
        }

        // Determine end boundary for this month
        let activeEnd = monthEnd;
        if (termDateObj && termDateObj < monthEnd) {
            activeEnd = termDateObj;
        }

        // Boundaries check
        if (joinDateObj && joinDateObj > monthEnd) return 0;
        if (termDateObj && termDateObj < monthStart) return 0;
        if (activeStart > activeEnd) return 0;

        const diffTime = Math.abs(activeEnd - activeStart);
        const activeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        return Math.min(1, Math.max(0, activeDays / totalDaysInMonth));
    } catch (e) {
        console.error("Proration error:", e);
        return 1;
    }
};

const availableRoles = [
    { id: 'admin', label: 'Admin (Full Access)' },
    { id: 'purchaser', label: 'Purchaser (Add purchases, view all)' },
    { id: 'accounts', label: 'Accounts (View-only purchases)' },
    { id: 'chef', label: 'Chef (Food costing & shop items)' },
    { id: 'partner', label: 'Partner (All reports view-only)' }
];

const availableTabsList = [
    { id: 'products', label: '🛍️ Products' },
    { id: 'content', label: '📝 Content' },
    { id: 'locations', label: '📍 Locations' },
    { id: 'customers', label: '👥 Users' },
    { id: 'franchise', label: '🤝 Franchise' },
    { id: 'staff', label: '🧑‍🍳 HR Staff' },
    { id: 'payroll', label: '💵 Payroll' },
    { id: 'vendors', label: '🏪 Vendors' },
    { id: 'purchases', label: '🛒 Purchases' },
    { id: 'costing', label: '🧮 Food Costing' }
];

const AdminDashboard = () => {
    const navigate = useNavigate();
    const user = db.getUser(); // Check auth immediately
    const hasTabAccess = (tabId) => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        if (user.allowedTabs && user.allowedTabs.length > 0) {
            return user.allowedTabs.includes(tabId);
        }
        // Fallback for legacy role-based rules
        if (user.role === 'chef') {
            return tabId === 'costing' || tabId === 'products';
        }
        if (user.role === 'purchaser' || user.role === 'accounts') {
            return tabId === 'purchases' || tabId === 'vendors';
        }
        if (user.role === 'partner') {
            return true;
        }
        return false;
    };

    const getInitialTab = () => {
        if (user?.role === 'chef') return 'costing';
        const defaultOrder = ['products', 'content', 'locations', 'customers', 'franchise', 'staff', 'payroll', 'vendors', 'purchases', 'costing'];
        for (const t of defaultOrder) {
            if (hasTabAccess(t)) return t;
        }
        return 'products';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());
    const isReadOnly = user?.role === 'accounts' || user?.role === 'partner';
    const isChef = user?.role === 'chef';
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [franchiseInquiries, setFranchiseInquiries] = useState([]);

    // Food Costing ERP states
    const [rawMaterials, setRawMaterials] = useState([]);
    const [bundleItems, setBundleItems] = useState([]);
    const [recipesList, setRecipesList] = useState([]);
    const [costingSubTab, setCostingSubTab] = useState('raw'); // 'raw' | 'bundle' | 'final' | 'fixed' | 'sop'
    const [rawMaterialCategoryFilter, setRawMaterialCategoryFilter] = useState('All');
    const [selectedToppings, setSelectedToppings] = useState({}); // { [productId]: toppingIndex }
    const [kitchens, setKitchens] = useState([]);
    const [franchiseFilterCity, setFranchiseFilterCity] = useState('All');
    const [franchiseFilterKitchen, setFranchiseFilterKitchen] = useState('All');
    
    // Add raw material form state
    const [showAddRawForm, setShowAddRawForm] = useState(false);
    const [editingRaw, setEditingRaw] = useState(null);
    const [newRaw, setNewRaw] = useState({ name: '', category: 'Dairy & Milk', price: '', quantity: '', unit: 'g', vendorId: '', vendorItemName: '' });
    
    // Add bundle item form state
    const [showAddBundleForm, setShowAddBundleForm] = useState(false);
    const [editingBundle, setEditingBundle] = useState(null);
    const [newBundle, setNewBundle] = useState({ name: '', yieldQuantity: '1000', yieldUnit: 'g', portions: '24', servingTool: 'Standard Scoop', ingredients: [], productUsages: [] }); // ingredients: [{ materialId: '', quantity: '' }]
    const [showNameSuggestions, setShowNameSuggestions] = useState(false);
    const [showBundleSuggestions, setShowBundleSuggestions] = useState(false);

    // Product recipe form state
    const [selectedRecipeProduct, setSelectedRecipeProduct] = useState(null); // product ID for editing recipe
    const [editingRecipe, setEditingRecipe] = useState({ ingredients: [], packagingIngredients: [], containerCost: '0', spoonCost: '0', stickerCost: '0', packagingCost: '0', batchSize: '1', overheadAllocation: '0', toppings: [], kitchenId: '' }); // ingredients: [{ type: 'raw'/'bundle', id: '', quantity: '' }]
    const [selectedPurchaseOutlet, setSelectedPurchaseOutlet] = useState(null);

    // Vendors State
    const [vendors, setVendors] = useState([]);
    const [showAddVendorForm, setShowAddVendorForm] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [vendorCategoryFilter, setVendorCategoryFilter] = useState('All');
    const [vendorSearchQuery, setVendorSearchQuery] = useState('');
    const [vendorItemSearch, setVendorItemSearch] = useState('');
    const [newVendor, setNewVendor] = useState({
        name: '', category: 'Dairy & Milk', phone: '', whatsapp: '', address: '',
        notes: '', items: [] // [{ itemName, unit, price }]
    });

    // Purchases State
    const [purchases, setPurchases] = useState([]);
    const [purchaseFilterDate, setPurchaseFilterDate] = useState('');
    const [purchaseFilterPurchaser, setPurchaseFilterPurchaser] = useState('All');
    const [purchaseFilterCategory, setPurchaseFilterCategory] = useState('All');
    const [purchaseFilterPayment, setPurchaseFilterPayment] = useState('All');
    const [purchaseFilterLocation, setPurchaseFilterLocation] = useState('All');
    const [purchaseFilterPeriod, setPurchaseFilterPeriod] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
    const [purchaseSearchQuery, setPurchaseSearchQuery] = useState('');
    const [showAddPurchaseForm, setShowAddPurchaseForm] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState(null);
    const [isPurchaseCustom, setIsPurchaseCustom] = useState(false);
    const [purchaserType, setPurchaserType] = useState('select');
    const [editPurchaserType, setEditPurchaserType] = useState('select');
    const [newPurchase, setNewPurchase] = useState({
        date: new Date().toISOString().split('T')[0], item: '', category: 'Dairy & Milk',
        vendorId: '', amount: '', paymentMode: 'Cash', notes: '', billUrl: '', location: 'Main Kitchen',
        purchaserName: ''
    });
    const [isEditPurchaseCustom, setIsEditPurchaseCustom] = useState(false);
    const [isRawCustom, setIsRawCustom] = useState(false);


    // Users & Logins State
    const [systemUsers, setSystemUsers] = useState([]);
    const [showAddUserForm, setShowAddUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'purchaser', allowedTabs: [] });
    const [usersSubTab, setUsersSubTab] = useState('logins'); // 'logins' | 'subscribers'


    // Locations State
    const [locations, setLocations] = useState([]);
    const [newLocation, setNewLocation] = useState({ name: '', area: '', mapUrl: '', status: 'Open', imageUrl: '', imageUrls: [], whatsapp: '', zomato: '', swiggy: '', magicpin: '', ondc: '', ownly: '', phone: '', ownerName: '', ownerEmail: '', address: '', franchiseId: '' });
    const [editingLocationId, setEditingLocationId] = useState(null);

    // Franchise Filters & Manual Form State
    const [editingFranchise, setEditingFranchise] = useState(null);
    const [selectedStateFilter, setSelectedStateFilter] = useState('All');
    const [franchiseStatusFilter, setFranchiseStatusFilter] = useState('All');
    const [showAddFranchiseForm, setShowAddFranchiseForm] = useState(false);
    const [newFranchise, setNewFranchise] = useState({
        name: '', email: '', phone: '', street: '', city: '', state: 'DL', pincode: '',
        currentJob: '', ownSpace: 'no', spaceArea: '', shopDescription: '', franchiseType: 'Standard',
        status: 'New'
    });

    // Staff HR Management State
    const [staffList, setStaffList] = useState([]);
    const [showAddStaffForm, setShowAddStaffForm] = useState(false);
    const [newStaff, setNewStaff] = useState({
        fullName: '', nickname: '', gender: 'Male', dob: '', bloodGroup: '',
        email: '', phone: '', alternatePhone: '', currentAddress: '', permanentAddress: '', emergencyContact: '', emergencyPhone: '',
        status: 'Permanent', payType: 'Monthly', position: 'Chef', salary: '', dailyRate: '', incentive: '', kpiRating: '5', joinDate: '', termDate: '',
        bankName: '', accountNumber: '', ifscCode: '', workingDays: '26', leavesTaken: '0',
        aadhaarCollected: false, panCollected: false, medicalCollected: false,
        assignedOutlet: '', aadhaarDocUrl: '', resumeDocUrl: '', medicalDocUrl: '', documents: []
    });
    const [editingStaff, setEditingStaff] = useState(null);
    const [staffSearchQuery, setStaffSearchQuery] = useState('');
    const [staffStatusFilter, setStaffStatusFilter] = useState('All');
    const [staffRoleFilter, setStaffRoleFilter] = useState('All');
    const [staffOutletFilter, setStaffOutletFilter] = useState('All');
    const [selectedHrTab, setSelectedHrTab] = useState('personal');

    // Content management sub-tabs
    const [contentSubTab, setContentSubTab] = useState('story'); // 'story' | 'hero'
    const [heroSettings, setHeroSettings] = useState({
        badge: 'Premium Egyptian Desserts in India',
        title: 'GET HIGH ON BITE',
        subtitle: "Experience Egypt's Finest Creamy Desserts",
        btn1Text: 'FRANCHISE',
        btn2Text: 'Our Story',
        gradientStart: '#27aae1',
        gradientEnd: '#7c3aed',
        glassOpacity: '0.15'
    });
    const [isSavingHero, setIsSavingHero] = useState(false);
    
    // Worker hiring pipeline states
    const [activeStaffSubTab, setActiveStaffSubTab] = useState('directory'); // 'directory' | 'leads'
    const [workerApplications, setWorkerApplications] = useState([]);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showInterviewModal, setShowInterviewModal] = useState(null); // application object
    const [interviewScoreInput, setInterviewScoreInput] = useState('');
    const [interviewNotesInput, setInterviewNotesInput] = useState('');
    const [selectedApplicationStatus, setSelectedApplicationStatus] = useState('Pending');
    const [appSearchQuery, setAppSearchQuery] = useState('');
    const [appPositionFilter, setAppPositionFilter] = useState('All');
    const [showJoinApprovalModal, setShowJoinApprovalModal] = useState(null); // application object
    const [joinPositionInput, setJoinPositionInput] = useState('Waiter');
    const [joinSalaryInput, setJoinSalaryInput] = useState('');
    const [joinOutletInput, setJoinOutletInput] = useState('');
    const [joinDateInput, setJoinDateInput] = useState(new Date().toISOString().split('T')[0]);

    // New states for Approved Franchises, Payroll, and Document Attachments
    const [franchiseSubTab, setFranchiseSubTab] = useState('pipeline'); // 'pipeline' | 'outlets'
    const [runningFranchises, setRunningFranchises] = useState([]);
    const [openFixedCostOutletId, setOpenFixedCostOutletId] = useState(null);
    const [editingFixedCosts, setEditingFixedCosts] = useState({}); // outletId -> [{ name: '', amount: '' }]
    const [selectedOverheadKitchenId, setSelectedOverheadKitchenId] = useState('');
    const [monthlyPiecesSold, setMonthlyPiecesSold] = useState('10000');
    const [showAddFranchiseOutletForm, setShowAddFranchiseOutletForm] = useState(false);
    const [editingFranchiseOutlet, setEditingFranchiseOutlet] = useState(null);
    const [newFranchiseOutlet, setNewFranchiseOutlet] = useState({
        outletName: '', ownerName: '', phone: '', email: '', city: '', state: 'KA',
        address: '', modelType: 'Standard', status: 'Running', openDate: '',
        agreementUrl: '', gstUrl: '', ownerIdUrl: '',
        mapUrl: '', imageUrl: '', whatsapp: '', zomato: '', swiggy: '', magicpin: '', ondc: '',
        documents: [],
        locationId: '',
        assignedKitchenId: ''
    });
    const [payrollMonth, setPayrollMonth] = useState('2026-07');
    const [payrollRecords, setPayrollRecords] = useState([]);
    const [selectedPayrollOutlet, setSelectedPayrollOutlet] = useState('All');
    const [selectedDetailStaff, setSelectedDetailStaff] = useState(null);
    const [allHistoricalPayroll, setAllHistoricalPayroll] = useState([]);
    const [hikeStaff, setHikeStaff] = useState(null);
    const [hikeAmount, setHikeAmount] = useState('');
    const [hikeReason, setHikeReason] = useState('Salary Adjustment');
    const [hikeDate, setHikeDate] = useState(new Date().toISOString().split('T')[0]);
    const [payrollActiveStaffId, setPayrollActiveStaffId] = useState(null);
    // Termination modal state
    const [termModal, setTermModal] = useState(null); // { staff, newStatus }
    const [termModalDate, setTermModalDate] = useState(new Date().toISOString().split('T')[0]);
    const [termModalReason, setTermModalReason] = useState('Resigned');
    const [termModalNotes, setTermModalNotes] = useState('');
    // Doc label modal state
    const [docLabelModal, setDocLabelModal] = useState(null); // { staff, file }
    const [docLabelInput, setDocLabelInput] = useState('');
    const [franchiseDocLabel, setFranchiseDocLabel] = useState('');
    const [franchiseDocLabelEdit, setFranchiseDocLabelEdit] = useState('');
    // Daily Wage payment modal
    const [dailyWagePayModal, setDailyWagePayModal] = useState(null); // { staff, payData }
    const [dailyWageDays, setDailyWageDays] = useState('');
    // Toast notification
    const [toast, setToast] = useState(null);
    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
    
    // Live Counter Stats Setup
    const [statsConfig, setStatsConfig] = useState({
        happyCustomersVal: '10',
        happyCustomersSuffix: 'K+',
        varietiesVal: '30',
        varietiesSuffix: '+'
    });
    const [isSavingStats, setIsSavingStats] = useState(false);

    const [payrollActiveMonth, setPayrollActiveMonth] = useState(null);
    const [profileActiveSubTab, setProfileActiveSubTab] = useState('personal');
    const [payrollDraft, setPayrollDraft] = useState({
        workingDays: 26,
        presentDays: 24,
        weeklyOff: 4,
        paidLeave: 0,
        unpaidLeaves: 0,
        halfDays: 0,
        kpiRating: 5,
        overtime: 0,
        advanceRecovery: 0,
        otherDeductions: 0,
        paymentMethod: 'Bank Transfer',
        transactionId: '',
        remarks: 'Salary credited successfully.',
        isPaid: false
    });

    useEffect(() => {
        if (payrollActiveStaffId && payrollActiveMonth) {
            const staff = staffList.find(s => s.id === payrollActiveStaffId);
            const saved = allHistoricalPayroll.find(r => r.staffId === payrollActiveStaffId && r.month === payrollActiveMonth);
            if (saved) {
                setPayrollDraft({
                    workingDays: saved.workingDays || 26,
                    presentDays: saved.presentDays || 24,
                    weeklyOff: saved.weeklyOff || 4,
                    paidLeave: saved.paidLeave || 0,
                    unpaidLeaves: saved.unpaidLeaves || 0,
                    halfDays: saved.halfDays || 0,
                    kpiRating: saved.kpiRating || 5,
                    overtime: saved.overtime || 0,
                    advanceRecovery: saved.advanceRecovery || 0,
                    otherDeductions: saved.otherDeductions || 0,
                    paymentMethod: saved.paymentMethod || 'Bank Transfer',
                    transactionId: saved.transactionId || '',
                    remarks: saved.remarks || 'Salary credited successfully.',
                    isPaid: true
                });
            } else if (staff) {
                setPayrollDraft({
                    workingDays: 26,
                    presentDays: 26 - (parseInt(staff.leavesTaken) || 0),
                    weeklyOff: 4,
                    paidLeave: parseInt(staff.leavesTaken) || 0,
                    unpaidLeaves: 0,
                    halfDays: 0,
                    kpiRating: parseInt(staff.kpiRating) || 5,
                    overtime: 0,
                    advanceRecovery: 0,
                    otherDeductions: 0,
                    paymentMethod: 'Bank Transfer',
                    transactionId: '',
                    remarks: 'Salary credited successfully.',
                    isPaid: false
                });
            }
        }
    }, [payrollActiveStaffId, payrollActiveMonth, allHistoricalPayroll, staffList]);

    /* Stats removed */
    const [newProduct, setNewProduct] = useState({ name: '', ingredients: '', tag: '', price: '', description: '', badge: '', img: '', images: [], toppings: [] });
    // Content Management State
    const defaultSiteContent = {
        storyTitle: 'Our Story',
        storyBadge: 'HL',
        storyBadgeImage: '/logo-_QsDpavP (2).png', // New field for badge image
        storyText1: 'Rooted in time-honored Egyptian recipes and crafted with only the finest ingredients, our signature desserts are rich, creamy and irresistibly delicious. HIGHLABAN brings you authentic Egyptian desserts that celebrate tradition while creating unforgettable flavor experiences.',
        storyText2: 'Every bite is a journey through tradition and indulgence, made with love by our passionate, expertly trained team.',
        rightLabel: 'ABOUT US',
        rightHeadline: 'Where Tradition Meets Innovation',
        rightDescription: "We are proud to be India's first dedicated Egyptian dessert brand. From our signature Lou'a to the viral Pistachio Kunafa Bomb, we craft happiness in every droplet.",
        features: ['Authentic Recipes', 'Premium Ingredients', 'Freshly Made Daily', 'Zero Preservatives', 'Innovative Fusions', 'Pure Passion']
    };
    const [siteContent, setSiteContent] = useState(defaultSiteContent);
    const [isProductCustom, setIsProductCustom] = useState(false);
    
    // NEW STATES
    const [blogs, setBlogs] = useState([]);
    const [socialLinks, setSocialLinks] = useState({
        instagram: '', whatsapp: '', linkedin: '', website: '', menu: '',
        orderZomato: '', orderSwiggy: '', orderMagicPin: '', orderOwnly: ''
    });
    const [showAddBlogForm, setShowAddBlogForm] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);
    const [newBlog, setNewBlog] = useState({ title: '', content: '', author: 'Admin', tags: '', image: '' });
    
    // Filter & Search states
    const [isSavingContent, setIsSavingContent] = useState(false);

    // Header Dropdown State
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Cropper State
    const [croppingImage, setCroppingImage] = useState(null);
    const [cropTarget, setCropTarget] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showLocationForm, setShowLocationForm] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null); // For crop target identification

    // For inline editing tracking
    const [editingProduct, setEditingProduct] = useState(null);

    // Mobile Menu State
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Helper to fetch data
    const refreshData = async () => {
        if (activeTab === 'products') {
            const prods = await db.getProducts();
            setProducts(prods);
        } else if (activeTab === 'customers') {
            const custs = await db.getCustomers();
            setCustomers(custs);
            const [subs, usrs] = await Promise.all([db.getSubscribers(), db.getUsers()]);
            setSubscribers(subs);
            setSystemUsers(usrs);
        } else if (activeTab === 'franchise') {
            const inquiries = await db.getFranchiseInquiries();
            setFranchiseInquiries(inquiries);
            const [franchises, kitch] = await Promise.all([db.getFranchises(), db.getKitchens()]);
            setRunningFranchises(franchises);
            setKitchens(kitch);
        } else if (activeTab === 'content') {
            const content = await db.getSiteContent('highlights');
            if (content) {
                setSiteContent({ ...defaultSiteContent, ...content });
            } else {
                setSiteContent(defaultSiteContent);
            }
            const heroData = await db.getSiteContent('hero');
            if (heroData) {
                setHeroSettings(prev => ({ ...prev, ...heroData }));
            }
        } else if (activeTab === 'locations') {
            const locs = await db.getLocations();
            setLocations(locs);
            const statsData = await db.getSiteContent('stats');
            if (statsData) {
                setStatsConfig({
                    happyCustomersVal: statsData.happyCustomersVal || '10',
                    happyCustomersSuffix: statsData.happyCustomersSuffix || 'K+',
                    varietiesVal: statsData.varietiesVal || '30',
                    varietiesSuffix: statsData.varietiesSuffix || '+'
                });
            }
        } else if (activeTab === 'staff') {
            const staff = await db.getStaff();
            setStaffList(staff);
            const franchises = await db.getFranchises();
            setRunningFranchises(franchises);
            const applications = await db.getWorkerApplications();
            setWorkerApplications(applications);
        } else if (activeTab === 'payroll') {
            const staff = await db.getStaff();
            setStaffList(staff);
            const records = await db.getPayrollRecords(payrollMonth);
            setPayrollRecords(records);
            const allRecords = await db.getAllPayrollRecords();
            setAllHistoricalPayroll(allRecords);
        } else if (activeTab === 'vendors') {
            const v = await db.getVendors();
            setVendors(v);
        } else if (activeTab === 'purchases') {
            const [p, v, f] = await Promise.all([db.getPurchases(), db.getVendors(), db.getFranchises()]);
            setPurchases(p);
            setVendors(v);
            setRunningFranchises(f);
        } else if (activeTab === 'blogs') {
            const b = await db.getBlogs();
            setBlogs(b);
        } else if (activeTab === 'connect') {
            const s = await db.getSocialLinks();
            if (s) setSocialLinks(s);
        } else if (activeTab === 'costing') {
            const [raws, bunds, recs, prods, p, kitch] = await Promise.all([
                db.getRawMaterials(),
                db.getBundleItems(),
                db.getRecipes(),
                db.getProducts(),
                db.getPurchases(),
                db.getKitchens()
            ]);
            setRawMaterials(raws);
            setBundleItems(bunds);
            setRecipesList(recs);
            setProducts(prods);
            setPurchases(p);
            setKitchens(kitch);
        }
    };

    const handleSaveStats = async (e) => {
        e.preventDefault();
        setIsSavingStats(true);
        try {
            await db.updateSiteContent('stats', statsConfig);
            showToast("Counter stats updated successfully!");
        } catch (err) {
            showToast("Failed to save stats: " + err.message, "error");
        } finally {
            setIsSavingStats(false);
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        refreshData();
        // Removed polling to prevent overwriting local state while editing
    }, [activeTab, navigate]);

    useEffect(() => {
        if (activeTab === 'payroll' && user) {
            db.getPayrollRecords(payrollMonth).then(records => {
                setPayrollRecords(records);
            });
            db.getAllPayrollRecords().then(records => {
                setAllHistoricalPayroll(records);
            });
        }
    }, [payrollMonth, activeTab, user]);

    // Prevent rendering if not logged in (stops flash of content)
    if (!user) return null;

    const handleResetData = async () => {
        if (window.confirm("Are you sure you want to RESET all data? This will clear all orders and revenue.")) {
            await db.resetOrders();
            refreshData();
            showToast("All sales data has been reset to 0.")
        }
    };

    const handleLogout = () => {
        db.logout();
        window.location.href = '/login';
    };

    // --- Franchise Handlers ---

    const handleStatusChange = async (inquiryId, newStatus) => {
        try {
            await db.updateFranchiseInquiry(inquiryId, { status: newStatus });
            setFranchiseInquiries(prev => prev.map(inq => inq.id === inquiryId ? { ...inq, status: newStatus } : inq));
            showToast("Franchise inquiry status updated successfully!")
        } catch (error) {
            console.error("Failed to update status", error);
            showToast("Failed to update status", "error")
        }
    };

    const handleAddFranchise = async (e) => {
        e.preventDefault();
        try {
            const addedInq = await db.addFranchiseInquiry(newFranchise);
            setFranchiseInquiries(prev => [addedInq, ...prev]);
            setNewFranchise({
                name: '', email: '', phone: '', street: '', city: '', state: 'DL', pincode: '',
                currentJob: '', ownSpace: 'no', spaceArea: '', shopDescription: '', franchiseType: 'Standard',
                status: 'New'
            });
            setShowAddFranchiseForm(false);
            showToast("Franchise inquiry added manually successfully!")
        } catch (error) {
            console.error("Failed to add franchise inquiry", error);
            showToast("Failed to add franchise inquiry", "error")
        }
    };

    const handleUpdateFranchise = async (e) => {
        e.preventDefault();
        if (!editingFranchise) return;
        try {
            await db.updateFranchiseInquiry(editingFranchise.id, editingFranchise);
            setFranchiseInquiries(prev => prev.map(inq => inq.id === editingFranchise.id ? editingFranchise : inq));
            setEditingFranchise(null);
            showToast("Franchise inquiry updated successfully!")
        } catch (error) {
            console.error("Failed to update franchise inquiry", error);
            showToast("Failed to update franchise inquiry", "error")
        }
    };

    const handleDeleteFranchise = async (id) => {
        if (window.confirm("Are you sure you want to delete this franchise inquiry?")) {
            try {
                await db.deleteFranchiseInquiry(id);
                setFranchiseInquiries(prev => prev.filter(inq => inq.id !== id));
                showToast("Franchise inquiry deleted successfully!")
            } catch (error) {
                console.error("Failed to delete franchise inquiry", error);
                showToast("Failed to delete franchise inquiry", "error")
            }
        }
    };

    const handleDeleteSubscriber = async (id) => {
        if (window.confirm("Are you sure you want to delete this subscriber?")) {
            try {
                await db.deleteSubscriber(id);
                setSubscribers(prev => prev.filter(sub => sub.id !== id));
                showToast("Subscriber deleted successfully!")
            } catch (error) {
                console.error("Failed to delete subscriber", error);
                showToast("Failed to delete subscriber", "error")
            }
        }
    };

    const handleAddFranchiseOutlet = async (e) => {
        e.preventDefault();
        try {
            const added = await db.addFranchiseOutlet(newFranchiseOutlet);
            setRunningFranchises(prev => [...prev, added]);
            
            if (newFranchiseOutlet.locationId) {
                const loc = locations.find(l => l.id === newFranchiseOutlet.locationId);
                if (loc) {
                    await db.updateLocation(loc.id, { ...loc, franchiseId: added.id });
                    // Refresh locations data locally
                    setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, franchiseId: added.id } : l));
                }
            }

            setNewFranchiseOutlet({
                outletName: '', ownerName: '', phone: '', email: '', city: '', state: 'KA',
                address: '', modelType: 'Standard', status: 'Running', openDate: '',
                agreementUrl: '', gstUrl: '', ownerIdUrl: '',
                mapUrl: '', imageUrl: '', whatsapp: '', zomato: '', swiggy: '', magicpin: '', ondc: '',
                documents: [],
                locationId: ''
            });
            setShowAddFranchiseOutletForm(false);
            showToast("Approved Franchise Outlet added successfully!");
        } catch (error) {
            console.error("Failed to add franchise outlet", error);
        }
    };

    const handleUpdateFranchiseOutlet = async (e) => {
        e.preventDefault();
        if (!editingFranchiseOutlet) return;
        try {
            const updated = await db.updateFranchiseOutlet(editingFranchiseOutlet.id, editingFranchiseOutlet);
            setRunningFranchises(prev => prev.map(o => o.id === editingFranchiseOutlet.id ? updated : o));
            
            // Sync details to the linked Location if present
            const linkedLoc = locations.find(l => l.franchiseId === editingFranchiseOutlet.id || l.id === editingFranchiseOutlet.locationId);
            if (linkedLoc) {
                const updatedLoc = {
                    ...linkedLoc,
                    name: editingFranchiseOutlet.outletName,
                    area: editingFranchiseOutlet.city,
                    address: editingFranchiseOutlet.address || '',
                    mapUrl: editingFranchiseOutlet.mapUrl || '',
                    whatsapp: editingFranchiseOutlet.whatsapp || '',
                    zomato: editingFranchiseOutlet.zomato || '',
                    swiggy: editingFranchiseOutlet.swiggy || '',
                    magicpin: editingFranchiseOutlet.magicpin || '',
                    ondc: editingFranchiseOutlet.ondc || '',
                    imageUrl: editingFranchiseOutlet.imageUrl || linkedLoc.imageUrl || '',
                    franchiseId: editingFranchiseOutlet.id
                };
                await db.updateLocation(linkedLoc.id, updatedLoc);
                setLocations(prev => prev.map(l => l.id === linkedLoc.id ? updatedLoc : l));
            }

            setEditingFranchiseOutlet(null);
            showToast("Approved Franchise Outlet and linked Location updated successfully!");
        } catch (error) {
            console.error("Failed to update franchise outlet", error);
        }
    };

    const handleDeleteFranchiseOutlet = async (id) => {
        if (window.confirm("Are you sure you want to delete this running franchise outlet?")) {
            try {
                await db.deleteFranchiseOutlet(id);
                setRunningFranchises(prev => prev.filter(o => o.id !== id));
                showToast("Approved Franchise Outlet deleted successfully!")
            } catch (error) {
                console.error("Failed to delete franchise outlet", error);
            }
        }
    };

    const handleSaveOutletFixedCosts = async (outletId) => {
        if (isReadOnly || isChef) return;
        const costs = editingFixedCosts[outletId] || [];
        if (costs.some(c => !c.name.trim() || isNaN(parseFloat(c.amount)))) {
            showToast("Please ensure all items have a name and a valid numeric cost amount.", "error");
            return;
        }
        try {
            const outlet = runningFranchises.find(o => o.id === outletId);
            if (!outlet) return;
            const updatedCosts = costs.map(c => ({ name: c.name.trim(), amount: parseFloat(c.amount) || 0 }));
            const updatedOutlet = { ...outlet, fixedCosts: updatedCosts };
            await db.updateFranchiseOutlet(outletId, updatedOutlet);
            setRunningFranchises(prev => prev.map(o => o.id === outletId ? updatedOutlet : o));
            setOpenFixedCostOutletId(null);
            showToast("Franchise Outlet fixed costs updated successfully! 💰");
        } catch (error) {
            console.error("Failed to save franchise outlet fixed costs", error);
            showToast("Failed to save fixed costs", "error");
        }
    };



    const handleStaffDocUpload = async (e, fieldType, isEdit = false) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const url = await uploadMedia(file);
            if (isEdit) {
                setEditingStaff(prev => ({ ...prev, [fieldType]: url }));
            } else {
                setNewStaff(prev => ({ ...prev, [fieldType]: url }));
            }
            showToast("Document uploaded successfully!")
        } catch (error) {
            console.error("Document upload failed", error);
            showToast("Upload failed: " + error.message, "error")
        } finally {
            setIsUploading(false);
        }
    };

    const handleFranchiseDocUpload = async (e, fieldType, isEdit = false) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const url = await uploadMedia(file);
            if (isEdit) {
                setEditingFranchiseOutlet(prev => ({ ...prev, [fieldType]: url }));
            } else {
                setNewFranchiseOutlet(prev => ({ ...prev, [fieldType]: url }));
            }
            showToast("Franchise document uploaded successfully!")
        } catch (error) {
            console.error("Document upload failed", error);
            showToast("Upload failed: " + error.message, "error")
        } finally {
            setIsUploading(false);
        }
    };

    const handleFranchiseCustomDocUpload = async (e, isEdit = false) => {
        const file = e.target.files[0];
        if (!file) return;
        const label = isEdit ? franchiseDocLabelEdit : franchiseDocLabel;
        if (!label.trim()) {
            showToast("Please enter a document label first.", "error");
            e.target.value = null;
            return;
        }
        setIsUploading(true);
        try {
            const url = await uploadMedia(file);
            const docObj = { name: label.trim(), url };
            if (isEdit) {
                setEditingFranchiseOutlet(prev => ({
                    ...prev,
                    documents: [...(prev.documents || []), docObj]
                }));
                setFranchiseDocLabelEdit('');
            } else {
                setNewFranchiseOutlet(prev => ({
                    ...prev,
                    documents: [...(prev.documents || []), docObj]
                }));
                setFranchiseDocLabel('');
            }
            showToast("Document added to outlet vault!");
        } catch (error) {
            console.error("Upload failed", error);
            showToast("Upload failed: " + error.message, "error");
        } finally {
            setIsUploading(false);
        }
        e.target.value = null;
    };

    // --- Staff HR Handlers ---

    const handleAddStaff = async (e) => {
        e.preventDefault();
        try {
            const initialHike = {
                date: newStaff.joinDate || new Date().toISOString().split('T')[0],
                amount: parseFloat(newStaff.salary) || 0,
                reason: "Initial Salary Setup"
            };
            const newStaffWithHistory = {
                ...newStaff,
                salaryHistory: [initialHike]
            };
            const addedStaff = await db.addStaff(newStaffWithHistory);
            setStaffList(prev => [addedStaff, ...prev]);
            setNewStaff({
                fullName: '', nickname: '', gender: 'Male', dob: '', bloodGroup: '',
                email: '', phone: '', alternatePhone: '', currentAddress: '', permanentAddress: '', emergencyContact: '', emergencyPhone: '',
                status: 'Permanent', position: 'Chef', salary: '', incentive: '', kpiRating: '5', joinDate: '', termDate: '',
                bankName: '', accountNumber: '', ifscCode: '', workingDays: '26', leavesTaken: '0',
                aadhaarCollected: false, panCollected: false, medicalCollected: false,
                assignedOutlet: '', aadhaarDocUrl: '', resumeDocUrl: '', medicalDocUrl: '', documents: []
            });
            setShowAddStaffForm(false);
            showToast("Staff profile created successfully!")
        } catch (error) {
            console.error("Failed to add staff member", error);
            showToast("Failed to add staff profile", "error")
        }
    };

    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        if (!editingStaff) return;
        try {
            const original = staffList.find(s => s.id === editingStaff.id);
            let updatedStaff = { ...editingStaff };
            
            if (original && original.salary !== editingStaff.salary) {
                const oldHistory = original.salaryHistory || [];
                const hikeRecord = {
                    date: new Date().toISOString().split('T')[0],
                    amount: parseFloat(editingStaff.salary) || 0,
                    reason: `Profile Edit Adjustment`
                };
                updatedStaff.salaryHistory = [...oldHistory, hikeRecord];
            }
            
            await db.updateStaff(updatedStaff.id, updatedStaff);
            setStaffList(prev => prev.map(s => s.id === updatedStaff.id ? updatedStaff : s));
            setEditingStaff(null);
            showToast("Staff profile updated successfully!")
        } catch (error) {
            console.error("Failed to update staff member", error);
            showToast("Failed to update staff profile", "error")
        }
    };

    const handleSaveHike = async (e) => {
        e.preventDefault();
        if (!hikeStaff) return;
        const newSalaryVal = parseFloat(hikeAmount);
        if (isNaN(newSalaryVal) || newSalaryVal <= 0) {
            showToast("Please enter a valid salary amount.")
            return;
        }
        try {
            const oldHistory = hikeStaff.salaryHistory || [];
            const hikeRecord = {
                date: hikeDate,
                amount: newSalaryVal,
                reason: hikeReason
            };
            const updatedStaff = {
                ...hikeStaff,
                salary: newSalaryVal.toString(),
                salaryHistory: [...oldHistory, hikeRecord]
            };
            
            await db.updateStaff(hikeStaff.id, updatedStaff);
            setStaffList(prev => prev.map(s => s.id === hikeStaff.id ? updatedStaff : s));
            setHikeStaff(null);
            setHikeAmount('');
            setHikeReason('Salary Adjustment');
            showToast(`Salary hike of ₹${newSalaryVal.toLocaleString('en-IN')} processed successfully!`)
        } catch (error) {
            console.error("Failed to process salary adjustment", error);
            showToast("Failed to process salary adjustment", "error")
        }
    };

    const handleDeleteStaff = async (id) => {
        if (window.confirm("Are you sure you want to delete this staff profile?")) {
            try {
                await db.deleteStaff(id);
                setStaffList(prev => prev.filter(s => s.id !== id));
                showToast("Staff profile deleted successfully!")
            } catch (error) {
                console.error("Failed to delete staff member", error);
                showToast("Failed to delete staff profile", "error")
            }
        }
    };

    // --- Payroll Handlers ---
    const handlePayPayroll = async (staffId, recordData) => {
        try {
            await db.savePayrollRecord(payrollMonth, staffId, recordData);
            const records = await db.getPayrollRecords(payrollMonth);
            setPayrollRecords(records);
            const allRecords = await db.getAllPayrollRecords();
            setAllHistoricalPayroll(allRecords);
            showToast("Payroll marked as PAID successfully!")
        } catch (error) {
            console.error("Failed to mark payroll as paid", error);
            showToast("Failed to record payment: " + error.message, "error")
        }
    };

    const handlePayPayrollDetails = async (paymentMethod, transactionId, remarks) => {
        if (!payrollActiveStaffId || !payrollActiveMonth) return;
        const staff = staffList.find(s => s.id === payrollActiveStaffId);
        if (!staff) return;

        const basic = parseFloat(staff.salary) || 0;
        const maxIncentive = parseFloat(staff.incentive) || 0;
        
        const unpaid = parseFloat(payrollDraft.unpaidLeaves) || 0;
        const half = parseFloat(payrollDraft.halfDays) || 0;
        const leaves = parseFloat(payrollDraft.paidLeave) || 0;
        const workingDays = parseFloat(payrollDraft.workingDays) || 26;
        
        const presentDays = workingDays - unpaid - (half * 0.5);
        const attRate = Math.max(0, presentDays / workingDays);
        
        const rating = parseInt(payrollDraft.kpiRating) || 5;
        let kpiMultiplier = 0.5;
        if (rating === 5) kpiMultiplier = 1.0;
        else if (rating === 4) kpiMultiplier = 0.8;
        else if (rating === 3) kpiMultiplier = 0.5;
        else if (rating === 2) kpiMultiplier = 0.2;
        else if (rating === 1) kpiMultiplier = 0;
        
        const overrideKpi = !!payrollDraft.overrideKpiBonus;
        const customKpi = parseFloat(payrollDraft.customKpiBonus) || 0;
        const kpiBonus = overrideKpi ? customKpi : (maxIncentive * kpiMultiplier * attRate);
        const attDeduction = (basic * (unpaid + half * 0.5)) / workingDays;
        
        const overtime = parseFloat(payrollDraft.overtime) || 0;
        const advance = parseFloat(payrollDraft.advanceRecovery) || 0;
        const other = parseFloat(payrollDraft.otherDeductions) || 0;
        
        const calculatedNet = (basic - attDeduction) + kpiBonus + overtime - advance - other;

        const recordData = {
            fullName: staff.fullName,
            position: staff.position,
            assignedOutlet: staff.assignedOutlet || 'Head Office',
            basicSalary: basic,
            leavesTaken: leaves,
            unpaidLeaves: unpaid,
            halfDays: half,
            workingDays: workingDays,
            presentDays: presentDays,
            kpiRating: rating,
            kpiBonusPaid: kpiBonus,
            overrideKpiBonus: overrideKpi,
            customKpiBonus: customKpi,
            overtime: overtime,
            advanceRecovery: advance,
            otherDeduction: other,
            netSalaryPaid: calculatedNet,
            datePaid: new Date().toISOString(),
            paymentMethod: paymentMethod || 'Bank Transfer',
            transactionId: transactionId || '',
            remarks: remarks || 'Salary credited successfully.',
            processedBy: 'Admin'
        };

        try {
            await db.savePayrollRecord(payrollActiveMonth, payrollActiveStaffId, recordData);
            const records = await db.getPayrollRecords(payrollMonth);
            setPayrollRecords(records);
            const allRecords = await db.getAllPayrollRecords();
            setAllHistoricalPayroll(allRecords);
            setPayrollDraft(prev => ({ ...prev, isPaid: true }));
            showToast("Payroll record updated and marked as Paid successfully!")
        } catch (e) {
            console.error(e);
            showToast("Failed to save payment record: " + e.message, "error")
        }
    };

    // --- Product Handlers ---

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        try {
            // Race condition to prevent hanging (increased to 60s)
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Network Timeout: Database is not responding. Check your internet connection or Firebase Quota.")), 60000));
            await Promise.race([db.addProduct(newProduct), timeoutPromise]);
            setNewProduct({ name: '', ingredients: '', tag: '', price: '', description: '', badge: '', img: '', images: [], toppings: [] });
            setShowAddForm(false);
            showToast('Product added successfully!')
            refreshData();
        } catch (error) {
            console.error(error);
            showToast(`Error adding product: ${error.message}`, "error")
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdateProduct = async (id, field, value) => {
        const updatedProducts = products.map(p => {
            if (p.id === id) return { ...p, [field]: value };
            return p;
        });
        setProducts(updatedProducts); // Optimistic UI update

        const productToUpdate = updatedProducts.find(p => p.id === id);
        try {
            await db.updateProduct(id, productToUpdate);
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await db.deleteProduct(id);
                refreshData();
            } catch (error) {
                console.error(error);
                showToast('Error deleting product', "error")
            }
        }
    };



    // Helper: Add image to product state
    const addImageToState = (url, target, productId) => {
        const imageObj = { url, tag: '' }; // New image structure
        if (target === 'new') {
            const currentImages = newProduct.images || (newProduct.img ? [typeof newProduct.img === 'string' ? { url: newProduct.img, tag: '' } : newProduct.img] : []);
            const newImages = [...currentImages, imageObj];
            // Backward compat: keep 'img' as the first URL string for now if needed by other components, or just rely on images array
            setNewProduct({ ...newProduct, images: newImages, img: newImages[0].url });
        } else if (target === 'edit' && editingProduct) {
            // Ensure current images are objects
            const currentImages = (editingProduct.images || (editingProduct.img ? [editingProduct.img] : [])).map(img =>
                typeof img === 'string' ? { url: img, tag: '' } : img
            );
            const newImages = [...currentImages, imageObj];
            setEditingProduct({ ...editingProduct, images: newImages, img: newImages[0].url });
        } else if (target === 'badge') {
            setSiteContent(prev => ({ ...prev, storyBadgeImage: url }));
        }
    };

    // Helper: Update image tag
    const handleImageTagChange = (index, value, target) => {
        if (target === 'new') {
            const newImages = [...newProduct.images];
            // Ensure object
            if (typeof newImages[index] === 'string') {
                newImages[index] = { url: newImages[index], tag: value };
            } else {
                newImages[index] = { ...newImages[index], tag: value };
            }
            setNewProduct({ ...newProduct, images: newImages });
        } else if (target === 'edit' && editingProduct) {
            const newImages = [...editingProduct.images];
            // Ensure object
            if (typeof newImages[index] === 'string') {
                newImages[index] = { url: newImages[index], tag: value };
            } else {
                newImages[index] = { ...newImages[index], tag: value };
            }
            setEditingProduct({ ...editingProduct, images: newImages });
        }
    };

    // Helper: Remove image
    const handleRemoveImage = (index, target) => {
        if (target === 'new') {
            const currentImages = newProduct.images || (newProduct.img ? [typeof newProduct.img === 'string' ? { url: newProduct.img, tag: '' } : newProduct.img] : []);
            const newImages = currentImages.filter((_, i) => i !== index);
            setNewProduct({ ...newProduct, images: newImages, img: newImages.length > 0 ? newImages[0].url || newImages[0] : '' });
        } else if (target === 'edit' && editingProduct) {
            const currentImages = (editingProduct.images || (editingProduct.img ? [editingProduct.img] : [])).map(img =>
                typeof img === 'string' ? { url: img, tag: '' } : img
            );
            const newImages = currentImages.filter((_, i) => i !== index);
            setEditingProduct({ ...editingProduct, images: newImages, img: newImages.length > 0 ? newImages[0].url || newImages[0] : '' });
        }
    };

    // File Upload Logic
    const handleFileUpload = async (e, target, productId = null) => {
        const file = e.target.files[0];
        if (!file) return;

        const isVideo = file.type.startsWith('video/');

        if (isVideo) {
            setIsUploading(true);
            try {
                const url = await uploadMedia(file);
                addImageToState(url, target, productId);
            } catch (e) {
                showToast(e.message)
            } finally {
                setIsUploading(false);
            }
        } else {
            const reader = new FileReader();
            reader.onload = () => {
                setCroppingImage(reader.result);
                setCropTarget(target);
                setEditingProductId(productId);
            };
            reader.readAsDataURL(file);
            e.target.value = null;
        }
    };

    const onCropComplete = async (croppedBlob) => {
        setIsUploading(true);
        try {
            const url = await uploadMedia(croppedBlob);
            addImageToState(url, cropTarget, editingProductId);
            setCroppingImage(null);
            setCropTarget(null);
            setEditingProductId(null);
        } catch (e) {
            showToast(e.message)
        } finally {
            setIsUploading(false);
        }
    };

    const handleEditClick = (product) => {
        // Ensure images array exists and normalize to objects for editing state
        let images = product.images || (product.img ? [product.img] : []);
        // Normalize strings to objects
        images = images.map(img => typeof img === 'string' ? { url: img, tag: '' } : img);

        const toppingsArr = Array.isArray(product.toppings) 
            ? product.toppings 
            : (product.toppings ? product.toppings.split(',').map(t => t.trim()).filter(Boolean) : []);
        setEditingProduct({ ...product, images, toppings: toppingsArr });
    };

    const handleSaveEdit = async () => {
        if (!editingProduct) return;
        setIsUploading(true);
        try {
            // Race condition to prevent hanging
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Network Timeout: Check your internet or Vercel config.")), 15000));
            await Promise.race([db.updateProduct(editingProduct.id, editingProduct), timeoutPromise]);
            // Update local state
            setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p));
            setEditingProduct(null);
            showToast("Changes saved successfully!")
        } catch (error) {
            console.error(error);
            showToast("Failed to save changes.", "error")
        } finally {
            setIsUploading(false);
        }
    };

    // --- Location Handlers ---
    const handleAddLocation = async (e) => {
        e.preventDefault();
        try {
            if (editingLocationId) {
                // Fetch the old location record to check franchise ID
                const oldLoc = locations.find(l => l.id === editingLocationId);
                await db.updateLocation(editingLocationId, newLocation);
                
                const oldFranchiseId = oldLoc ? (oldLoc.franchiseId || '') : '';
                const newFranchiseId = newLocation.franchiseId || '';

                // If linked franchise changed or unlinked, clear the location link from the old franchise
                if (oldFranchiseId && oldFranchiseId !== newFranchiseId) {
                    const oldFranchise = runningFranchises.find(f => f.id === oldFranchiseId);
                    if (oldFranchise) {
                        const cleanedFranchise = { ...oldFranchise, locationId: '' };
                        await db.updateFranchiseOutlet(oldFranchiseId, cleanedFranchise);
                        setRunningFranchises(prev => prev.map(f => f.id === oldFranchiseId ? cleanedFranchise : f));
                    }
                }

                // If a franchise is linked now, sync details to it
                if (newFranchiseId) {
                    const franchise = runningFranchises.find(f => f.id === newFranchiseId);
                    if (franchise) {
                        const updatedFranchise = {
                            ...franchise,
                            locationId: editingLocationId,
                            outletName: newLocation.name,
                            city: newLocation.area,
                            address: newLocation.address || franchise.address || newLocation.name,
                            mapUrl: newLocation.mapUrl || '',
                            whatsapp: newLocation.whatsapp || '',
                            zomato: newLocation.zomato || '',
                            swiggy: newLocation.swiggy || '',
                            magicpin: newLocation.magicpin || '',
                            ondc: newLocation.ondc || '',
                            ownly: newLocation.ownly || '',
                            phone: newLocation.phone || franchise.phone || ''
                        };
                        await db.updateFranchiseOutlet(newFranchiseId, updatedFranchise);
                        setRunningFranchises(prev => prev.map(f => f.id === newFranchiseId ? updatedFranchise : f));
                    }
                }

                showToast('Location and linked franchise updated successfully!');
                setEditingLocationId(null);
            } else {
                // Adding a new Location
                const addedLoc = await db.addLocation(newLocation);
                
                let targetFranchiseId = newLocation.franchiseId;
                if (!targetFranchiseId) {
                    // Auto-create Franchise Outlet
                    const newOutlet = {
                        outletName: newLocation.name,
                        ownerName: 'Admin / Owner Pending',
                        phone: newLocation.phone || 'N/A',
                        email: '',
                        city: newLocation.area,
                        state: 'KA',
                        address: newLocation.name,
                        modelType: 'Standard',
                        status: 'Running',
                        openDate: new Date().toISOString().split('T')[0],
                        agreementUrl: '',
                        gstUrl: '',
                        ownerIdUrl: '',
                        mapUrl: newLocation.mapUrl || '',
                        whatsapp: newLocation.whatsapp || '',
                        zomato: newLocation.zomato || '',
                        swiggy: newLocation.swiggy || '',
                        magicpin: newLocation.magicpin || '',
                        ondc: newLocation.ondc || '',
                        ownly: newLocation.ownly || '',
                        documents: [],
                        locationId: addedLoc.id
                    };
                    const createdOutlet = await db.addFranchiseOutlet(newOutlet);
                    targetFranchiseId = createdOutlet.id;
                    setRunningFranchises(prev => [...prev, createdOutlet]);
                    
                    // Update location with franchise reference
                    await db.updateLocation(addedLoc.id, { ...addedLoc, franchiseId: targetFranchiseId });
                } else {
                    // Update existing franchise to point to this location
                    const franchise = runningFranchises.find(f => f.id === targetFranchiseId);
                    if (franchise) {
                        await db.updateFranchiseOutlet(targetFranchiseId, { ...franchise, locationId: addedLoc.id });
                        setRunningFranchises(prev => prev.map(f => f.id === targetFranchiseId ? { ...f, locationId: addedLoc.id } : f));
                    }
                }

                showToast('Location added and Franchise synced successfully!');
            }
            setNewLocation({ name: '', area: '', mapUrl: '', status: 'Open', imageUrl: '', imageUrls: [], whatsapp: '', zomato: '', swiggy: '', magicpin: '', ondc: '', ownly: '', phone: '', ownerName: '', ownerEmail: '', address: '', franchiseId: '' });
            refreshData();
        } catch (error) {
            console.error(error);
            showToast('Error saving location', "error")
        }
    };

    const handleEditLocation = (loc) => {
        setNewLocation({
            name: loc.name || '',
            area: loc.area || '',
            mapUrl: loc.mapUrl || '',
            status: loc.status || 'Open',
            imageUrl: loc.imageUrl || '',
            imageUrls: loc.imageUrls || [],
            whatsapp: loc.whatsapp || '',
            zomato: loc.zomato || '',
            swiggy: loc.swiggy || '',
            magicpin: loc.magicpin || '',
            ondc: loc.ondc || '',
            ownly: loc.ownly || '',
            phone: loc.phone || '',
            ownerName: loc.ownerName || '',
            ownerEmail: loc.ownerEmail || '',
            address: loc.address || '',
            franchiseId: loc.franchiseId || ''
        });
        setEditingLocationId(loc.id);
        setShowLocationForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLocationFranchiseLink = (fid) => {
        if (!fid) {
            setNewLocation(prev => ({ ...prev, franchiseId: '' }));
            return;
        }
        const franchise = runningFranchises.find(f => f.id === fid);
        if (franchise) {
            setNewLocation(prev => ({
                ...prev,
                franchiseId: fid,
                name: franchise.outletName,
                area: franchise.city,
                address: franchise.address || '',
                whatsapp: franchise.whatsapp || '',
                zomato: franchise.zomato || '',
                swiggy: franchise.swiggy || '',
                magicpin: franchise.magicpin || '',
                ondc: franchise.ondc || '',
                ownly: franchise.ownly || '',
                phone: franchise.phone || '',
                ownerName: franchise.ownerName || '',
                ownerEmail: franchise.email || '',
                mapUrl: franchise.mapUrl || ''
            }));
            showToast(`Auto-filled details from Franchise: ${franchise.outletName}`);
            return;
        }
        const kitchen = kitchens.find(k => k.id === fid);
        if (kitchen) {
             setNewLocation(prev => ({
                ...prev,
                franchiseId: fid,
                name: kitchen.name,
                area: kitchen.city,
                address: kitchen.address || '',
                phone: kitchen.phone || ''
            }));
            showToast(`Auto-filled details from Kitchen: ${kitchen.name}`);
        }
    };

    const handleFranchiseLocationLink = (locId) => {
        if (!locId) {
            setNewFranchiseOutlet(prev => ({ ...prev, locationId: '' }));
            return;
        }
        const loc = locations.find(l => l.id === locId);
        if (loc) {
            setNewFranchiseOutlet(prev => ({
                ...prev,
                locationId: locId,
                outletName: loc.name,
                city: loc.area,
                whatsapp: loc.whatsapp || '',
                swiggy: loc.swiggy || '',
                zomato: loc.zomato || '',
                magicpin: loc.magicpin || '',
                ondc: loc.ondc || '',
                phone: loc.phone || '',
                ownerName: loc.ownerName || '',
                email: loc.ownerEmail || '',
                mapUrl: loc.mapUrl || ''
            }));
            showToast(`Auto-filled outlet info from store location: ${loc.name}`);
        }
    };

    const handleCancelEdit = () => {
        setNewLocation({ name: '', area: '', mapUrl: '', status: 'Open', imageUrl: '', imageUrls: [], whatsapp: '', zomato: '', swiggy: '', magicpin: '', ondc: '', ownly: '', phone: '', ownerName: '', ownerEmail: '', address: '', franchiseId: '' });
        setEditingLocationId(null);
    };

    const handleDeleteLocation = async (id) => {
        if (window.confirm('Delete this location?')) {
            try {
                await db.deleteLocation(id);
                refreshData();
            } catch (error) {
                console.error(error);
                showToast('Error deleting location', "error")
            }
        }
    };

    return (
        <div className={styles.container}>
            <SEO title="Admin Dashboard | High Laban" description="Manage High Laban products, content, and users." />
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div className={styles.overlay} onClick={() => setIsMobileOpen(false)}></div>
            )}

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isMobileOpen ? styles.open : ''}`}>
                <div className={styles.logo}>
                    <img src={logo} alt="HighLaban Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    <div className={styles.logoText}>
                        HighLaban
                        <span className={styles.logoSub}>ADMIN</span>
                    </div>
                </div>

                <nav className={styles.nav}>
                    {hasTabAccess('products') && (
                        <div className={`${styles.navItem} ${activeTab === 'products' ? styles.active : ''}`} onClick={() => { setActiveTab('products'); setIsMobileOpen(false); }}>
                            <FiShoppingBag style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Products
                            {activeTab === 'products' && <div className={styles.activeDot}></div>}
                        </div>
                    )}

                    {hasTabAccess('content') && (
                        <div className={`${styles.navItem} ${activeTab === 'content' ? styles.active : ''}`} onClick={() => { setActiveTab('content'); setIsMobileOpen(false); }}>
                            <FiFileText style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Content
                            {activeTab === 'content' && <div className={styles.activeDot}></div>}
                        </div>
                    )}

                    {hasTabAccess('locations') && (
                        <div className={`${styles.navItem} ${activeTab === 'locations' ? styles.active : ''}`} onClick={() => { setActiveTab('locations'); setIsMobileOpen(false); }}>
                            <FiMapPin style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Locations
                            {activeTab === 'locations' && <div className={styles.activeDot}></div>}
                        </div>
                    )}

                    {hasTabAccess('customers') && (
                        <div className={`${styles.navItem} ${activeTab === 'customers' ? styles.active : ''}`} onClick={() => { setActiveTab('customers'); setIsMobileOpen(false); }}>
                            <FiUsers style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Users
                            {activeTab === 'customers' && <div className={styles.activeDot}></div>}
                        </div>
                    )}

                    {hasTabAccess('franchise') && (
                        <div className={`${styles.navItem} ${activeTab === 'franchise' ? styles.active : ''}`} onClick={() => { setActiveTab('franchise'); setIsMobileOpen(false); }}>
                            <FiBriefcase style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Franchise
                            {activeTab === 'franchise' && <div className={styles.activeDot}></div>}
                        </div>
                    )}

                    {hasTabAccess('staff') && (
                        <div className={`${styles.navItem} ${activeTab === 'staff' ? styles.active : ''}`} onClick={() => { setActiveTab('staff'); setIsMobileOpen(false); }}>
                            <FiUserCheck style={{ fontSize: '1.2rem', marginRight: '8px' }} /> HR Staff
                            {activeTab === 'staff' && <div className={styles.activeDot}></div>}
                        </div>
                    )}

                    {hasTabAccess('payroll') && (
                        <div className={`${styles.navItem} ${activeTab === 'payroll' ? styles.active : ''}`} onClick={() => { setActiveTab('payroll'); setIsMobileOpen(false); }}>
                            <FiDollarSign style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Payroll
                            {activeTab === 'payroll' && <div className={styles.activeDot}></div>}
                        </div>
                    )}

                    {hasTabAccess('vendors') && (
                        <div className={`${styles.navItem} ${activeTab === 'vendors' ? styles.active : ''}`} onClick={() => { setActiveTab('vendors'); setIsMobileOpen(false); }}>
                            <FiTruck style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Vendors
                            {activeTab === 'vendors' && <div className={styles.activeDot}></div>}
                        </div>
                    )}

                    {hasTabAccess('purchases') && (
                        <div className={`${styles.navItem} ${activeTab === 'purchases' ? styles.active : ''}`} onClick={() => { setActiveTab('purchases'); setIsMobileOpen(false); }}>
                            <FiShoppingCart style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Purchases
                            {activeTab === 'purchases' && <div className={styles.activeDot}></div>}
                        </div>
                    )}

                    {hasTabAccess('costing') && (
                        <div className={`${styles.navItem} ${activeTab === 'costing' ? styles.active : ''}`} onClick={() => { setActiveTab('costing'); setIsMobileOpen(false); }}>
                            <FiPieChart style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Food Costing
                            {activeTab === 'costing' && <div className={styles.activeDot}></div>}
                        </div>
                    )}

                    {(user?.role === 'admin' || user?.role === 'partner') && (
                        <>
                            <div className={`${styles.navItem} ${activeTab === 'blogs' ? styles.active : ''}`} onClick={() => { setActiveTab('blogs'); setIsMobileOpen(false); }}>
                                <FiFileText style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Blogs
                                {activeTab === 'blogs' && <div className={styles.activeDot}></div>}
                            </div>
                            <div className={`${styles.navItem} ${activeTab === 'connect' ? styles.active : ''}`} onClick={() => { setActiveTab('connect'); setIsMobileOpen(false); }}>
                                <FiGlobe style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Social Links & QR
                                {activeTab === 'connect' && <div className={styles.activeDot}></div>}
                            </div>
                        </>
                    )}
                </nav>

                <div className={styles.signOut} onClick={handleLogout}>
                    <LogoutIcon /> Sign Out
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {/* Header */}
                <header className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button className={styles.mobileToggle} onClick={() => setIsMobileOpen(!isMobileOpen)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                        </button>
                        <h1 className={styles.pageTitle}>
                            {activeTab === 'dashboard' ? 'Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h1>
                    </div>

                    <div className={styles.headerActions}>
                        <div className={styles.searchBar} style={{ visibility: 'visible' }}>
                            <LoopIcon />
                            <input type="text" placeholder="Search..." className={styles.searchInput} />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className={styles.profileAvatar}>
                                HL
                            </div>
                            {showUserMenu && (
                                <div style={{ position: 'absolute', top: '110%', right: 0, width: '180px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '0.5rem', zIndex: 10 }}>
                                    <button onClick={handleResetData} style={{ width: '100%', padding: '0.8rem', color: '#ef4444', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }}>âš ï¸ Reset Data</button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>





                {/* --- CONTENT TAB --- */}
                {activeTab === 'content' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '850px', width: '100%' }}>
                        {/* Sub-navigation for Site Content */}
                        <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setContentSubTab('story')}
                                style={{
                                    background: 'none', border: 'none', fontSize: '1rem', fontWeight: '800',
                                    color: contentSubTab === 'story' ? '#0ea5e9' : '#64748b',
                                    borderBottom: contentSubTab === 'story' ? '3px solid #0ea5e9' : '3px solid transparent',
                                    padding: '0.5rem 1rem', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                📖 Our Story Section
                            </button>
                            <button
                                type="button"
                                onClick={() => setContentSubTab('hero')}
                                style={{
                                    background: 'none', border: 'none', fontSize: '1rem', fontWeight: '800',
                                    color: contentSubTab === 'hero' ? '#0ea5e9' : '#64748b',
                                    borderBottom: contentSubTab === 'hero' ? '3px solid #0ea5e9' : '3px solid transparent',
                                    padding: '0.5rem 1rem', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                🎨 Hero Banner Config
                            </button>
                        </div>

                        {contentSubTab === 'story' ? (
                            <div className={styles.card} style={{ margin: 0, maxWidth: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Edit "Our Story" Section</h2>
                            <button
                                onClick={async () => {
                                    setIsSavingContent(true);
                                    try {
                                        await db.updateSiteContent('highlights', siteContent);
                                        showToast('Content updated successfully!')
                                    } catch (e) {
                                        showToast('Error saving content: ' + e.message, "error")
                                    } finally {
                                        setIsSavingContent(false);
                                    }
                                }}
                                className={styles.saveButton}
                                disabled={isSavingContent}
                            >
                                {isSavingContent ? 'SAVING...' : 'SAVE CHANGES'}
                            </button>
                        </div>

                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <h3 style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Left Card Content</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className={styles.label}>Section Title</label>
                                    <input type="text" value={siteContent.storyTitle} onChange={e => setSiteContent({ ...siteContent, storyTitle: e.target.value })} className={styles.input} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                </div>
                            </div>
                            <div>
                                <label className={styles.label}>Badge Image (Replaces Text)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {siteContent.storyBadgeImage ? (
                                        <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                            <img src={siteContent.storyBadgeImage} alt="Badge" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f8fafc' }} />
                                            <button
                                                onClick={() => setSiteContent({ ...siteContent, storyBadgeImage: '' })}
                                                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => document.getElementById('badge-upload').click()}
                                            style={{ width: '80px', height: '80px', borderRadius: '12px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f8fafc' }}>
                                            <span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>+</span>
                                        </div>
                                    )}
                                    <input type="file" id="badge-upload" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'badge')} />
                                    {siteContent.storyBadgeImage ? null : <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Upload PNG/JPG</span>}
                                </div>
                                {/* Fallback Text Input (Optional, maybe hidden if image exists?) -> Keeping it for now but maybe user wants only image */}
                                {!siteContent.storyBadgeImage && (
                                    <input type="text" placeholder="Or enter text (HL)" value={siteContent.storyBadge} onChange={e => setSiteContent({ ...siteContent, storyBadge: e.target.value })} className={styles.input} style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                )}
                            </div>
                        </div>

                        <div>
                            <label className={styles.label}>Paragraph 1</label>
                            <textarea rows={3} value={siteContent.storyText1} onChange={e => setSiteContent({ ...siteContent, storyText1: e.target.value })} className={styles.input} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />
                        </div>
                        <div>
                            <label className={styles.label}>Paragraph 2</label>
                            <textarea rows={2} value={siteContent.storyText2} onChange={e => setSiteContent({ ...siteContent, storyText2: e.target.value })} className={styles.input} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />
                        </div>

                        <div style={{ height: '1px', background: '#e2e8f0', margin: '1rem 0' }}></div>

                        <h3 style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Right Card Content</h3>
                        <div>
                            <label className={styles.label}>Small Label</label>
                            <input type="text" value={siteContent.rightLabel} onChange={e => setSiteContent({ ...siteContent, rightLabel: e.target.value })} className={styles.input} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label className={styles.label}>Headline</label>
                            <input type="text" value={siteContent.rightHeadline} onChange={e => setSiteContent({ ...siteContent, rightHeadline: e.target.value })} className={styles.input} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label className={styles.label}>Description</label>
                            <textarea rows={3} value={siteContent.rightDescription} onChange={e => setSiteContent({ ...siteContent, rightDescription: e.target.value })} className={styles.input} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />
                        </div>

                        <div>
                            <label className={styles.label}>Features List</label>
                            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.8rem', background: '#fff', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {siteContent.features.map((feature, index) => (
                                    <div key={index} style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        background: '#e0f2fe', color: '#0369a1',
                                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500'
                                    }}>
                                        {feature}
                                        <span
                                            onClick={() => setSiteContent({ ...siteContent, features: siteContent.features.filter((_, i) => i !== index) })}
                                            style={{ cursor: 'pointer', fontSize: '1rem', lineHeight: 1, opacity: 0.6 }}
                                            onMouseOver={e => e.target.style.opacity = 1}
                                            onMouseOut={e => e.target.style.opacity = 0.6}
                                        >🖼️</span>
                                    </div>
                                ))}
                                <input
                                    type="text"
                                    placeholder="+ Add tag (Enter)"
                                    style={{ border: 'none', outline: 'none', flexGrow: 1, minWidth: '120px', padding: '5px' }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = e.target.value.trim();
                                            if (val) {
                                                setSiteContent({ ...siteContent, features: [...siteContent.features, val] });
                                                e.target.value = '';
                                            }
                                        } else if (e.key === 'Backspace' && e.target.value === '' && siteContent.features.length > 0) {
                                            setSiteContent({ ...siteContent, features: siteContent.features.slice(0, -1) });
                                        }
                                    }}
                                />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>
                                Type a feature and press Enter to add. Backspace to remove last tag.
                            </p>
                        </div>

                        {/* Live Preview Section */}
                        <div style={{ marginTop: '2rem', borderTop: '2px solid #e2e8f0', paddingTop: '2rem' }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#1e293b' }}>Live Preview</h3>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', transform: 'scale(0.9)', transformOrigin: 'top center' }}>
                                {/* Pass manualContent to skip fetching and use local state */}
                                <Highlights manualContent={siteContent} />
                            </div>
                        </div>
                            </div>
                        ) : (
                            <div className={styles.card} style={{ margin: 0, maxWidth: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Edit Hero Banner Overlay</h2>
                                    <button
                                        onClick={async () => {
                                            setIsSavingHero(true);
                                            try {
                                                await db.updateSiteContent('hero', heroSettings);
                                                showToast('Hero Settings updated successfully!');
                                            } catch (e) {
                                                showToast('Error saving hero settings: ' + e.message, "error");
                                            } finally {
                                                setIsSavingHero(false);
                                            }
                                        }}
                                        className={styles.saveButton}
                                        disabled={isSavingHero}
                                    >
                                        {isSavingHero ? 'SAVING...' : 'SAVE CHANGES'}
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gap: '1.25rem' }}>
                                    <div className={styles.formGroup}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Top Badge Text</label>
                                        <input
                                            type="text"
                                            value={heroSettings.badge}
                                            onChange={e => setHeroSettings({ ...heroSettings, badge: e.target.value })}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Main Title</label>
                                        <input
                                            type="text"
                                            value={heroSettings.title}
                                            onChange={e => setHeroSettings({ ...heroSettings, title: e.target.value })}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Sub Headline</label>
                                        <input
                                            type="text"
                                            value={heroSettings.subtitle}
                                            onChange={e => setHeroSettings({ ...heroSettings, subtitle: e.target.value })}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className={styles.formGroup}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Primary Button Text</label>
                                            <input
                                                type="text"
                                                value={heroSettings.btn1Text}
                                                onChange={e => setHeroSettings({ ...heroSettings, btn1Text: e.target.value })}
                                                className={styles.input}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Secondary Button Text</label>
                                            <input
                                                type="text"
                                                value={heroSettings.btn2Text}
                                                onChange={e => setHeroSettings({ ...heroSettings, btn2Text: e.target.value })}
                                                className={styles.input}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                        <div className={styles.formGroup}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Glass Card Opacity (0.0 to 1.0)</label>
                                            <input
                                                type="number" min="0" max="1" step="0.05"
                                                value={heroSettings.glassOpacity}
                                                onChange={e => setHeroSettings({ ...heroSettings, glassOpacity: e.target.value })}
                                                className={styles.input}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Gradient Start Color</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="color"
                                                    value={heroSettings.gradientStart}
                                                    onChange={e => setHeroSettings({ ...heroSettings, gradientStart: e.target.value })}
                                                    style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                                />
                                                <input
                                                    type="text"
                                                    value={heroSettings.gradientStart}
                                                    onChange={e => setHeroSettings({ ...heroSettings, gradientStart: e.target.value })}
                                                    className={styles.input}
                                                    style={{ flex: 1 }}
                                                />
                                            </div>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Gradient End Color</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="color"
                                                    value={heroSettings.gradientEnd}
                                                    onChange={e => setHeroSettings({ ...heroSettings, gradientEnd: e.target.value })}
                                                    style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                                />
                                                <input
                                                    type="text"
                                                    value={heroSettings.gradientEnd}
                                                    onChange={e => setHeroSettings({ ...heroSettings, gradientEnd: e.target.value })}
                                                    className={styles.input}
                                                    style={{ flex: 1 }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
                }

                {/* --- PRODUCTS TAB --- */}
                {
                    activeTab === 'products' && (
                        <section>
                            <div className={styles.catalogHeader}>
                                <h2 className={styles.sectionTitle}>Products Catalog</h2>
                                {(!isReadOnly && !isChef) && (
                                    <button
                                        className={styles.addButton}
                                        onClick={() => setShowAddForm(!showAddForm)}
                                    >
                                        <span>{showAddForm ? '−' : '+'}</span> {showAddForm ? 'CLOSE FORM' : 'ADD PRODUCT'}
                                    </button>
                                )}
                            </div>

                            {/* Add Product Form (Slide Open) */}
                            {showAddForm && (
                                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1rem' }}>
                                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <h3 style={{ margin: 0 }}>Add New Product</h3>
                                            <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                                        </div>
                                    <form onSubmit={handleAddProduct} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
                                        {/* ... Inputs ... */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.5rem' }}>Name</label>
                                            <input type="text" placeholder="e.g. Basbousa" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className={styles.footerField} style={{ background: '#f8fafc', padding: '10px', border: 'none', borderRadius: '8px', width: '100%', outline: 'none' }} required />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.5rem' }}>Ingredients</label>
                                            <input type="text" placeholder="e.g. Milk, Nuts, Honey" value={newProduct.ingredients || ''} onChange={e => setNewProduct({ ...newProduct, ingredients: e.target.value })} className={styles.footerField} style={{ background: '#f8fafc', padding: '10px', border: 'none', borderRadius: '8px', width: '100%', outline: 'none' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.5rem' }}>Tag</label>
                                            <input type="text" placeholder="e.g. SWEET CLASSIC" value={newProduct.tag || ''} onChange={e => setNewProduct({ ...newProduct, tag: e.target.value })} className={styles.footerField} style={{ background: '#f8fafc', padding: '10px', border: 'none', borderRadius: '8px', width: '100%', outline: 'none' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.5rem' }}>Price (₹)</label>
                                            <input type="number" placeholder="220" value={newProduct.price || ''} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className={styles.footerField} style={{ background: '#f8fafc', padding: '10px', border: 'none', borderRadius: '8px', width: '100%', outline: 'none' }} required />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.5rem' }}>Badge</label>
                                            <input type="text" placeholder="e.g. Trending" value={newProduct.badge || ''} onChange={e => setNewProduct({ ...newProduct, badge: e.target.value })} className={styles.footerField} style={{ background: '#f8fafc', padding: '10px', border: 'none', borderRadius: '8px', width: '100%', outline: 'none' }} />
                                        </div>
                                        <div style={{ gridColumn: '1/-1' }}>
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.5rem' }}>✨ Customize Toppings (Added Toppings count as extra varieties)</label>
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                <input 
                                                    type="text" 
                                                    id="new-topping-input"
                                                    placeholder="Type topping name (e.g. Nutella) and press Enter or click Add" 
                                                    className={styles.footerField} 
                                                    style={{ background: '#f8fafc', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', flex: 1, outline: 'none' }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = e.target.value.trim();
                                                            if (val && !(newProduct.toppings || []).includes(val)) {
                                                                setNewProduct(prev => ({ ...prev, toppings: [...(prev.toppings || []), val] }));
                                                                e.target.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        const el = document.getElementById('new-topping-input');
                                                        const val = el ? el.value.trim() : '';
                                                        if (val && !(newProduct.toppings || []).includes(val)) {
                                                            setNewProduct(prev => ({ ...prev, toppings: [...(prev.toppings || []), val] }));
                                                            el.value = '';
                                                        }
                                                    }}
                                                    style={{ background: '#009ceb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    Add Topping
                                                </button>
                                            </div>
                                            
                                            {/* Tag list */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {(newProduct.toppings || []).map((topping, idx) => (
                                                    <span 
                                                        key={idx} 
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0f9ff', border: '1px solid #cbd5e1', color: '#009ceb', padding: '4px 12px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold' }}
                                                    >
                                                        {topping}
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                const updated = (newProduct.toppings || []).filter((_, i) => i !== idx);
                                                                setNewProduct(prev => ({ ...prev, toppings: updated }));
                                                            }}
                                                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', padding: 0, display: 'flex', alignItems: 'center' }}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                                {(newProduct.toppings || []).length === 0 && (
                                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>No toppings configured. Type a topping name above and click "Add Topping".</span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.5rem' }}>Description</label>
                                            <textarea placeholder="Write a short description..." value={newProduct.description || ''} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} style={{ background: '#f8fafc', padding: '10px', border: 'none', borderRadius: '8px', width: '100%', minHeight: '80px', outline: 'none' }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1/-1' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8' }}>Product Image</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                                {/* Image List */}
                                                {/* Image List */}
                                                {newProduct.images && newProduct.images.length > 0 ? (
                                                    newProduct.images.map((imgObj, index) => {
                                                        const url = typeof imgObj === 'string' ? imgObj : imgObj.url;
                                                        const tag = typeof imgObj === 'string' ? '' : imgObj.tag;
                                                        return (
                                                            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                                                <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                                    <img src={url} alt={`Product ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveImage(index, 'new')}
                                                                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Tag"
                                                                    value={tag}
                                                                    onChange={(e) => handleImageTagChange(index, e.target.value, 'new')}
                                                                    style={{ width: '80px', fontSize: '0.7rem', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                                />
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>🖼️</span>
                                                    </div>
                                                )}

                                                {/* Add Button */}
                                                <div
                                                    onClick={() => document.getElementById('new-product-file').click()}
                                                    style={{ width: '80px', height: '80px', borderRadius: '12px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f8fafc' }}>
                                                    <span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>+</span>
                                                </div>
                                                <div style={{ flex: 1, display: 'none' }}>
                                                    <input type="file" onChange={(e) => handleFileUpload(e, 'new')} style={{ fontSize: '0.9rem' }} id="new-product-file" />
                                                </div>
                                                <button type="submit" className={styles.saveButton} disabled={isUploading}>{isUploading ? 'SAVING...' : 'ADD NOW'}</button>
                                            </div>
                                        </div>
                                    </form>
                                    </div>
                                </div>
                            )}

                            <div className={styles.grid}>
                                {products.map((product) => (
                                    <div key={product.id} className={styles.card}>
                                        <div className={styles.imageArea} style={{ position: 'relative' }}>
                                            <img src={product.img || product.image || 'https://placehold.co/200'} alt={product.name} className={styles.productImg} />
                                        </div>

                                        <div className={styles.cardHeader}>
                                            <div className={styles.cardTitle} style={{ width: '70%' }}>
                                                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{product.name}</h4>
                                            </div>
                                            {(!isReadOnly && !isChef) && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className={styles.editBtn} onClick={() => handleEditClick(product)} title="Edit Product">
                                                        <EditIcon />
                                                    </button>
                                                    <button className={styles.deleteBtn} onClick={() => handleDeleteProduct(product.id)} title="Delete Product">
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.cardTag}>
                                            <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', color: '#64748b' }}>{product.tag || 'No Tag'}</span>
                                        </div>

                                        <div className={styles.cardDescription}>
                                            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>{product.description?.slice(0, 60) || 'No description'}...</p>
                                        </div>

                                        <div className={styles.cardFooter}>
                                            <div className={styles.footerField}>
                                                <label>PRICE</label>
                                                <span style={{ fontWeight: 'bold' }}>₹{product.price}</span>
                                            </div>
                                            <div className={styles.footerField}>
                                                <label>BADGE</label>
                                                <span style={{ fontSize: '0.8rem' }}>{product.badge || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )
                }



                {/* --- CUSTOMERS / USERS TAB --- */}
                {
                    activeTab === 'customers' && (() => {
                        const handleSaveUser = async (e) => {
                            e.preventDefault();
                            if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
                                showToast('All fields are required', 'error');
                                return;
                            }
                            try {
                                const added = await db.addUser(newUser);
                                setSystemUsers(prev => [added, ...prev]);
                                setNewUser({ name: '', email: '', password: '', role: 'purchaser', allowedTabs: [] });
                                setShowAddUserForm(false);
                                showToast('User created successfully!');
                            } catch (error) {
                                showToast('Failed to add user', 'error');
                            }
                        };

                        const handleUpdateUser = async (e) => {
                            e.preventDefault();
                            if (!editingUser.name.trim() || !editingUser.email.trim() || !editingUser.password.trim()) {
                                showToast('All fields are required', 'error');
                                return;
                            }
                            try {
                                await db.updateUser(editingUser.id, editingUser);
                                setSystemUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
                                setEditingUser(null);
                                showToast('User updated successfully!');
                            } catch (error) {
                                showToast('Failed to update user', 'error');
                            }
                        };

                        const handleDeleteUser = async (id) => {
                            if (!window.confirm('Delete this user login account?')) return;
                            try {
                                await db.deleteUser(id);
                                setSystemUsers(prev => prev.filter(u => u.id !== id));
                                showToast('User deleted successfully');
                            } catch (error) {
                                showToast('Failed to delete user', 'error');
                            }
                        };

                        return (
                            <div style={{ width: '100%' }}>
                                {/* Sub tab switcher */}
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => setUsersSubTab('logins')}
                                        style={{ 
                                            border: 'none', 
                                            background: usersSubTab === 'logins' ? '#009ceb' : 'none', 
                                            color: usersSubTab === 'logins' ? 'white' : '#64748b', 
                                            padding: '0.5rem 1.2rem', 
                                            borderRadius: '8px', 
                                            fontWeight: 'bold', 
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        🔐 User Logins ({systemUsers.length})
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setUsersSubTab('subscribers')}
                                        style={{ 
                                            border: 'none', 
                                            background: usersSubTab === 'subscribers' ? '#009ceb' : 'none', 
                                            color: usersSubTab === 'subscribers' ? 'white' : '#64748b', 
                                            padding: '0.5rem 1.2rem', 
                                            borderRadius: '8px', 
                                            fontWeight: 'bold', 
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        ✉️ Newsletter Subscribers ({subscribers.length})
                                    </button>
                                </div>

                                {usersSubTab === 'logins' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontWeight: '800', color: '#0f172a' }}>System Logins & Accounts</h3>
                                                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>Define purchaser and accounts roles. Accounts role has view-only access to purchases.</p>
                                            </div>
                                            <button 
                                                onClick={() => { setShowAddUserForm(!showAddUserForm); setEditingUser(null); }}
                                                style={{ background: '#009ceb', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                                            >
                                                {showAddUserForm ? 'Close Form' : '+ Create User'}
                                            </button>
                                        </div>

                                        {/* Add User Form */}
                                        {showAddUserForm && (
                                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
                                                <h4 style={{ margin: '0 0 1rem 0' }}>➕ Create System Login</h4>
                                                <form onSubmit={handleSaveUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Display Name</label>
                                                        <input type="text" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="e.g. Marchad / Nufoor" required />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Login Username / Email</label>
                                                        <input type="text" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="marchad@highlaban.com" required />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Password</label>
                                                        <input type="text" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Set password" required />
                                                    </div>

                                                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>SELECT SYSTEM ROLES (MULTI-ROLE ALLOWED)</span>
                                                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                                            {availableRoles.map(role => {
                                                                const isChecked = (newUser.role || '').split(',').includes(role.id);
                                                                return (
                                                                    <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: '600', color: '#334155' }}>
                                                                        <input type="checkbox" checked={isChecked} onChange={e => {
                                                                            const current = (newUser.role || '').split(',').filter(Boolean);
                                                                            let next;
                                                                            if (e.target.checked) {
                                                                                next = [...current, role.id];
                                                                            } else {
                                                                                next = current.filter(r => r !== role.id);
                                                                            }
                                                                            setNewUser({ ...newUser, role: next.join(',') });
                                                                        }} />
                                                                        {role.label}
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                                         <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>TAB ACCESS PERMISSIONS (GRANULAR ACCESS)</span>
                                                         <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                                             {availableTabsList.map(tab => {
                                                                 const isChecked = (newUser.allowedTabs || []).includes(tab.id);
                                                                 return (
                                                                     <label key={tab.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: '600', color: '#334155' }}>
                                                                         <input type="checkbox" checked={isChecked} onChange={e => {
                                                                             const current = newUser.allowedTabs || [];
                                                                             let next;
                                                                             if (e.target.checked) {
                                                                                 next = [...current, tab.id];
                                                                             } else {
                                                                                 next = current.filter(t => t !== tab.id);
                                                                             }
                                                                             setNewUser({ ...newUser, allowedTabs: next });
                                                                         }} />
                                                                         {tab.label}
                                                                     </label>
                                                                 );
                                                             })}
                                                         </div>
                                                     </div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button type="submit" style={{ flex: 1, background: '#009ceb', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Save User</button>
                                                        <button type="button" onClick={() => setShowAddUserForm(false)} style={{ flex: 1, background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
 
                                        {/* Edit User Form */}
                                        {editingUser && (
                                            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '16px', padding: '1.5rem' }}>
                                                <h4 style={{ margin: '0 0 1rem 0' }}>âœï¸ Edit User Details</h4>
                                                <form onSubmit={handleUpdateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', color: '#b45309', textTransform: 'uppercase', marginBottom: '6px' }}>Display Name</label>
                                                        <input type="text" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', color: '#b45309', textTransform: 'uppercase', marginBottom: '6px' }}>Login Username</label>
                                                        <input type="text" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', color: '#b45309', textTransform: 'uppercase', marginBottom: '6px' }}>Password</label>
                                                        <input type="text" value={editingUser.password} onChange={e => setEditingUser({ ...editingUser, password: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                                                    </div>

                                                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b45309' }}>SELECT SYSTEM ROLES (MULTI-ROLE ALLOWED)</span>
                                                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                                            {availableRoles.map(role => {
                                                                const isChecked = (editingUser.role || '').split(',').includes(role.id);
                                                                return (
                                                                    <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: '600', color: '#334155' }}>
                                                                        <input type="checkbox" checked={isChecked} onChange={e => {
                                                                            const current = (editingUser.role || '').split(',').filter(Boolean);
                                                                            let next;
                                                                            if (e.target.checked) {
                                                                                next = [...current, role.id];
                                                                            } else {
                                                                                next = current.filter(r => r !== role.id);
                                                                            }
                                                                            setEditingUser({ ...editingUser, role: next.join(',') });
                                                                        }} />
                                                                        {role.label}
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                                         <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b45309' }}>TAB ACCESS PERMISSIONS (GRANULAR ACCESS)</span>
                                                         <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                                             {availableTabsList.map(tab => {
                                                                 const isChecked = (editingUser.allowedTabs || []).includes(tab.id);
                                                                 return (
                                                                     <label key={tab.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: '600', color: '#334155' }}>
                                                                         <input type="checkbox" checked={isChecked} onChange={e => {
                                                                             const current = editingUser.allowedTabs || [];
                                                                             let next;
                                                                             if (e.target.checked) {
                                                                                 next = [...current, tab.id];
                                                                             } else {
                                                                                 next = current.filter(t => t !== tab.id);
                                                                             }
                                                                             setEditingUser({ ...editingUser, allowedTabs: next });
                                                                         }} />
                                                                         {tab.label}
                                                                     </label>
                                                                 );
                                                             })}
                                                         </div>
                                                     </div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button type="submit" style={{ flex: 1, background: '#009ceb', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Update</button>
                                                        <button type="button" onClick={() => setEditingUser(null)} style={{ flex: 1, background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}

                                        {/* User Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                            {systemUsers.map(usr => (
                                                <div key={usr.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div>
                                                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.98rem' }}>{usr.name}</div>
                                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                                {(usr.role || 'purchaser').split(',').map(r => {
                                                                    const roleName = r.trim().toLowerCase();
                                                                    const bg = roleName === 'admin' ? '#fee2e2' : roleName === 'accounts' ? '#ede9fe' : roleName === 'chef' ? '#fef3c7' : roleName === 'partner' ? '#dcfce7' : '#e0f2fe';
                                                                    const fg = roleName === 'admin' ? '#991b1b' : roleName === 'accounts' ? '#5b21b6' : roleName === 'chef' ? '#b45309' : roleName === 'partner' ? '#15803d' : '#0369a1';
                                                                    const border = roleName === 'admin' ? '#fca5a5' : roleName === 'accounts' ? '#c4b5fd' : roleName === 'chef' ? '#fde68a' : roleName === 'partner' ? '#86efac' : '#7dd3fc';
                                                                    return (
                                                                        <span key={roleName} style={{ 
                                                                            display: 'inline-block', padding: '2px 8px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 'bold',
                                                                            background: bg, color: fg, border: `1px solid ${border}`
                                                                        }}>
                                                                            {roleName.toUpperCase()}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <button onClick={() => { setEditingUser({ ...usr, allowedTabs: usr.allowedTabs || [] }); setShowAddUserForm(false); }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '5px 10px', fontSize: '0.75rem', fontWeight: 'bold', color: '#009ceb', cursor: 'pointer' }}>Edit</button>
                                                            <button onClick={() => handleDeleteUser(usr.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '0.75rem', fontWeight: 'bold', color: '#ef4444', cursor: 'pointer' }}>Del</button>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', borderTop: '1px dashed #f1f5f9', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div>👤 Username: <strong style={{ color: '#334155' }}>{usr.email}</strong></div>
                                                        <div>🔑 Password: <strong style={{ color: '#334155' }}>{usr.password}</strong></div>
                                                        {usr.allowedTabs && usr.allowedTabs.length > 0 && (
                                                             <div style={{ marginTop: '4px' }}>
                                                                 <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Tab Access:</div>
                                                                 <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                                     {usr.allowedTabs.map(t => {
                                                                         const tabMeta = availableTabsList.find(x => x.id === t);
                                                                         return (
                                                                             <span key={t} style={{ display: 'inline-block', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: '500' }}>
                                                                                 {tabMeta ? tabMeta.label.split(' ')[1] || tabMeta.label : t}
                                                                             </span>
                                                                         );
                                                                     })}
                                                                 </div>
                                                             </div>
                                                         )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.card} style={{ gridColumn: '1/-1', marginBottom: '2rem', border: 'none', boxShadow: 'none' }}>
                                        <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>Newsletter Subscribers</h3>
                                        {subscribers.length > 0 ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                                {subscribers.map(sub => (
                                                    <div key={sub.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{sub.email}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                                Signed up: {sub.date ? new Date(sub.date).toLocaleDateString() : 'N/A'}
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleDeleteSubscriber(sub.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Subscriber">
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ color: '#94a3b8' }}>No subscribers yet.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })()
                }



                {/* --- FRANCHISE TAB --- */}
                {
                    activeTab === 'franchise' && (() => {
                        // Group by state counts
                        const getCountForState = (stateCode) => {
                            return franchiseInquiries.filter(i => i.state === stateCode).length;
                        };

                        const stateTabs = [
                            { code: 'All', name: 'All States', count: franchiseInquiries.length },
                            { code: 'DL', name: 'Delhi (DL)', count: getCountForState('DL') },
                            { code: 'MH', name: 'Maharashtra (MH)', count: getCountForState('MH') },
                            { code: 'KA', name: 'Karnataka (KA)', count: getCountForState('KA') },
                            { code: 'TN', name: 'Tamil Nadu (TN)', count: getCountForState('TN') },
                            { code: 'KL', name: 'Kerala (KL)', count: getCountForState('KL') }
                        ];

                        const filteredInquiries = franchiseInquiries.filter(i => {
                            const matchesState = selectedStateFilter === 'All' || i.state === selectedStateFilter;
                            const matchesStatus = franchiseStatusFilter === 'All' || i.status === franchiseStatusFilter;
                            return matchesState && matchesStatus;
                        });

                        return (
                            <div className={styles.tabContent} style={{ width: '100%' }}>
                                
                                {/* Sub-Tab switcher */}
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => setFranchiseSubTab('pipeline')}
                                        style={{ 
                                            border: 'none', 
                                            background: franchiseSubTab === 'pipeline' ? '#009ceb' : 'none', 
                                            color: franchiseSubTab === 'pipeline' ? 'white' : '#64748b', 
                                            padding: '0.5rem 1.2rem', 
                                            borderRadius: '8px', 
                                            fontWeight: 'bold', 
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        🤝 Inquiry Pipeline ({franchiseInquiries.length})
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setFranchiseSubTab('outlets')}
                                        style={{ 
                                            border: 'none', 
                                            background: franchiseSubTab === 'outlets' ? '#009ceb' : 'none', 
                                            color: franchiseSubTab === 'outlets' ? 'white' : '#64748b', 
                                            padding: '0.5rem 1.2rem', 
                                            borderRadius: '8px', 
                                            fontWeight: 'bold', 
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        🏪 Running Outlets ({runningFranchises.length})
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setFranchiseSubTab('kitchens')}
                                        style={{ 
                                            border: 'none', 
                                            background: franchiseSubTab === 'kitchens' ? '#009ceb' : 'none', 
                                            color: franchiseSubTab === 'kitchens' ? 'white' : '#64748b', 
                                            padding: '0.5rem 1.2rem', 
                                            borderRadius: '8px', 
                                            fontWeight: 'bold', 
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        🍳 Central Kitchens ({kitchens.length})
                                    </button>
                                </div>

                                {franchiseSubTab === 'pipeline' && (
                                    <>
                                        <div className={styles.catalogHeader}>
                                            <h2 className={styles.sectionTitle}>Franchise Applications & Pipeline</h2>
                                            <button
                                                className={styles.addButton}
                                                onClick={() => setShowAddFranchiseForm(!showAddFranchiseForm)}
                                            >
                                                <span>{showAddFranchiseForm ? '−' : '+'}</span> {showAddFranchiseForm ? 'CLOSE FORM' : 'ADD MANUALLY'}
                                            </button>
                                        </div>

                                        {/* Slide down Manual Franchise Form */}
                                        <div style={{
                                            maxHeight: showAddFranchiseForm ? '1500px' : '0',
                                            opacity: showAddFranchiseForm ? 1 : 0,
                                            overflow: 'hidden',
                                            transition: 'all 0.5s ease-in-out',
                                            marginBottom: showAddFranchiseForm ? '2rem' : 0
                                        }}>
                                            <div className={styles.formCard} style={{ maxWidth: '850px' }}>
                                                <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Manually Record Franchise Inquiry</h3>
                                                <form onSubmit={handleAddFranchise} className={styles.staffForm}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                        <div className={styles.formGroup}>
                                                            <label>Applicant Full Name *</label>
                                                            <input type="text" value={newFranchise.name} onChange={e => setNewFranchise({ ...newFranchise, name: e.target.value })} className={styles.input} required placeholder="Full Name" />
                                                        </div>
                                                        <div className={styles.formGroup}>
                                                            <label>Email ID *</label>
                                                            <input type="email" value={newFranchise.email} onChange={e => setNewFranchise({ ...newFranchise, email: e.target.value })} className={styles.input} required placeholder="Email Address" />
                                                        </div>
                                                        <div className={styles.formGroup}>
                                                            <label>Phone Number *</label>
                                                            <input type="tel" value={newFranchise.phone} onChange={e => setNewFranchise({ ...newFranchise, phone: e.target.value })} className={styles.input} required placeholder="Primary Phone Number" />
                                                        </div>
                                                        <div className={styles.formGroup}>
                                                            <label>Current Profession</label>
                                                            <input type="text" value={newFranchise.currentJob} onChange={e => setNewFranchise({ ...newFranchise, currentJob: e.target.value })} className={styles.input} placeholder="Job / Business" />
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                                        <div className={styles.formGroup}>
                                                            <label>Street Address</label>
                                                            <input type="text" value={newFranchise.street} onChange={e => setNewFranchise({ ...newFranchise, street: e.target.value })} className={styles.input} placeholder="Area / Layout / Road" />
                                                        </div>
                                                        <div className={styles.formGroup}>
                                                            <label>City *</label>
                                                            <input type="text" value={newFranchise.city} onChange={e => setNewFranchise({ ...newFranchise, city: e.target.value })} className={styles.input} required placeholder="City Name" />
                                                        </div>
                                                        <div className={styles.formGroup}>
                                                            <label>State *</label>
                                                            <select value={newFranchise.state} onChange={e => setNewFranchise({ ...newFranchise, state: e.target.value })} className={styles.input}>
                                                                <option value="DL">Delhi (DL)</option>
                                                                <option value="MH">Maharashtra (MH)</option>
                                                                <option value="KA">Karnataka (KA)</option>
                                                                <option value="TN">Tamil Nadu (TN)</option>
                                                                <option value="KL">Kerala (KL)</option>
                                                            </select>
                                                        </div>
                                                        <div className={styles.formGroup}>
                                                            <label>Pincode</label>
                                                            <input type="text" value={newFranchise.pincode} onChange={e => setNewFranchise({ ...newFranchise, pincode: e.target.value })} className={styles.input} placeholder="6-digit ZIP code" />
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                                        <div className={styles.formGroup}>
                                                            <label>Own Commercial Space?</label>
                                                            <select value={newFranchise.ownSpace} onChange={e => setNewFranchise({ ...newFranchise, ownSpace: e.target.value })} className={styles.input}>
                                                                <option value="yes">Yes</option>
                                                                <option value="no">No</option>
                                                            </select>
                                                        </div>
                                                        <div className={styles.formGroup}>
                                                            <label>Space Area (sq. ft.)</label>
                                                            <input type="text" value={newFranchise.spaceArea} onChange={e => setNewFranchise({ ...newFranchise, spaceArea: e.target.value })} className={styles.input} placeholder="e.g. 500 sqft" />
                                                        </div>
                                                        <div className={styles.formGroup}>
                                                            <label>Franchise Model Type</label>
                                                            <select value={newFranchise.franchiseType} onChange={e => setNewFranchise({ ...newFranchise, franchiseType: e.target.value })} className={styles.input}>
                                                                <option value="Standard">Standard Model</option>
                                                                <option value="Express">Express Model</option>
                                                                <option value="Premium">Premium Cafe</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                                                        <label>Additional Notes / Shop Description</label>
                                                        <textarea rows={3} value={newFranchise.shopDescription} onChange={e => setNewFranchise({ ...newFranchise, shopDescription: e.target.value })} style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'inherit' }} placeholder="Add details about locations, preferences, or call feedback notes..." />
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                                        <button type="submit" className={styles.addButton}>Add Inquiry Record</button>
                                                        <button type="button" className={styles.cancelBtn} onClick={() => setShowAddFranchiseForm(false)}>Cancel</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>

                                        {/* State Wise Tabs Bar */}
                                        <div className={styles.stateFilterBar} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                            {stateTabs.map(tab => (
                                                <button
                                                    key={tab.code}
                                                    type="button"
                                                    className={`${styles.stateTabItem} ${selectedStateFilter === tab.code ? styles.stateTabItemActive : ''}`}
                                                    onClick={() => setSelectedStateFilter(tab.code)}
                                                    style={{
                                                        border: 'none',
                                                        background: selectedStateFilter === tab.code ? '#009ceb' : '#f8fafc',
                                                        color: selectedStateFilter === tab.code ? 'white' : '#64748b',
                                                        padding: '0.6rem 1.2rem',
                                                        borderRadius: '50px',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.85rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: selectedStateFilter === tab.code ? '0 4px 6px -1px rgba(0, 156, 235, 0.2)' : 'none'
                                                    }}
                                                >
                                                    {tab.name}
                                                    <span 
                                                        className={styles.stateTabBadge} 
                                                        style={{ 
                                                            background: selectedStateFilter === tab.code ? 'rgba(255,255,255,0.25)' : '#e2e8f0', 
                                                            color: selectedStateFilter === tab.code ? 'white' : '#475569',
                                                            padding: '2px 8px',
                                                            borderRadius: '50px',
                                                            fontSize: '0.75rem'
                                                        }}
                                                    >
                                                        {tab.count}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Double filtering row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                Showing <strong>{filteredInquiries.length}</strong> inquiries matching state <strong>{selectedStateFilter}</strong> and status <strong>{franchiseStatusFilter}</strong>.
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Filter by Status:</span>
                                                <select
                                                    value={franchiseStatusFilter}
                                                    onChange={e => setFranchiseStatusFilter(e.target.value)}
                                                    className={styles.statusSelect}
                                                    style={{ minWidth: '160px' }}
                                                >
                                                    <option value="All">All Statuses</option>
                                                    <option value="New">New Lead</option>
                                                    <option value="Called">Called / Emailed</option>
                                                    <option value="Interested">Interested / Hot</option>
                                                    <option value="Follow-up">Follow-up Funnel</option>
                                                    <option value="Terminated">Terminated</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Inquiries Cards Grid */}
                                        <div className={styles.grid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                            {filteredInquiries.length > 0 ? (
                                                filteredInquiries.map((inquiry) => (
                                                    <div key={inquiry.id} className={styles.card} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', position: 'relative', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                                                        
                                                        {/* Top row */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }}>
                                                            <div>
                                                                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: 'bold' }}>{inquiry.name}</h3>
                                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px', display: 'block' }}>
                                                                    Applied: {inquiry.date ? new Date(inquiry.date).toLocaleDateString() : 'N/A'}
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                                                <button onClick={() => setEditingFranchise(inquiry)} className={styles.editBtn} style={{ width: '28px', height: '28px', padding: '4px', border: 'none', background: '#f1f5f9', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Lead">
                                                                    <EditIcon />
                                                                </button>
                                                                <button onClick={() => handleDeleteFranchise(inquiry.id)} className={styles.deleteButton} style={{ width: '28px', height: '28px', padding: '4px', border: 'none', background: '#fee2e2', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Lead">
                                                                    <TrashIcon />
                                                                </button>
                                                                <span className={`${styles.statusBadge} ${styles['status_' + (inquiry.status || 'new').toLowerCase().replace(' ', '_').replace('-', '_')]}`} style={{ marginLeft: '4px' }}>
                                                                    {inquiry.status || 'New'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Contacts */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                                                            <a href={`mailto:${inquiry.email}`} style={{ color: '#009ceb', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>📧 {inquiry.email}</a>
                                                            <a href={`tel:${inquiry.phone}`} style={{ color: '#475569', textDecoration: 'none', fontSize: '0.9rem' }}>📞 {inquiry.phone}</a>
                                                        </div>

                                                        {/* Details Box */}
                                                        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid #f1f5f9' }}>
                                                            <div><strong>Location:</strong> {inquiry.street ? `${inquiry.street}, ` : ''}{inquiry.city}, {inquiry.state} {inquiry.pincode ? `- ${inquiry.pincode}` : ''}</div>
                                                            <div><strong>Type:</strong> {inquiry.franchiseType || 'Standard'} Model</div>
                                                            <div><strong>Profession:</strong> {inquiry.currentJob || 'Not Specified'}</div>
                                                            <div><strong>Own Space:</strong> {inquiry.ownSpace === 'yes' ? `Yes (${inquiry.spaceArea || 'N/A'})` : 'No'}</div>
                                                        </div>

                                                        {/* Description */}
                                                        {inquiry.shopDescription && (
                                                            <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', margin: 0, padding: '4px 0', borderLeft: '3px solid #e2e8f0', paddingLeft: '8px' }}>
                                                                "{inquiry.shopDescription}"
                                                            </p>
                                                        )}

                                                        {/* Status Selector Dropdown */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                                            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>Stage pipeline:</span>
                                                            <select
                                                                value={inquiry.status || 'New'}
                                                                onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                                                                className={styles.statusSelect}
                                                            >
                                                                <option value="New">New Lead</option>
                                                                <option value="Called">Called / Emailed</option>
                                                                <option value="Interested">Interested / Hot</option>
                                                                <option value="Follow-up">Follow-up</option>
                                                                <option value="Terminated">Terminated</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className={styles.card} style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: 'white' }}>
                                                    <p style={{ color: '#94a3b8', fontSize: '1rem' }}>No inquiries match the filters.</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                                {franchiseSubTab === 'outlets' && (
                                    <>
                                        {/* APPROVED RUNNING OUTLETS VIEW */}
                                        <div className={styles.catalogHeader}>
                                            <h2 className={styles.sectionTitle}>Approved & Running Franchises</h2>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    className={styles.addButton}
                                                    onClick={async () => {
                                                        const btn = document.getElementById('syncLocBtn');
                                                        if(btn) btn.innerHTML = 'Syncing...';
                                                        try {
                                                            let syncedCount = 0;
                                                            for (const loc of locations) {
                                                                if ((loc.status === 'Open' || loc.status === 'Running') && !loc.franchiseId) {
                                                                    const existingFranchise = runningFranchises.find(f => f.locationId === loc.id);
                                                                    if (!existingFranchise) {
                                                                        const newOutlet = {
                                                                            outletName: loc.area || loc.name,
                                                                            ownerName: 'Admin / Owner Pending',
                                                                            phone: loc.phone || 'N/A',
                                                                            email: '',
                                                                            city: loc.name,
                                                                            state: 'KA',
                                                                            address: `${loc.name}, ${loc.area || ''}`,
                                                                            modelType: 'Standard',
                                                                            status: 'Running',
                                                                            openDate: new Date().toISOString().split('T')[0],
                                                                            agreementUrl: '', gstUrl: '', ownerIdUrl: '',
                                                                            mapUrl: loc.mapUrl || '', whatsapp: loc.whatsapp || '',
                                                                            zomato: loc.zomato || '', swiggy: loc.swiggy || '',
                                                                            magicpin: loc.magicpin || '', ondc: loc.ondc || '',
                                                                            documents: [], locationId: loc.id
                                                                        };
                                                                        const createdOutlet = await db.addFranchiseOutlet(newOutlet);
                                                                        setRunningFranchises(prev => [...prev, createdOutlet]);
                                                                        await db.updateLocation(loc.id, { ...loc, franchiseId: createdOutlet.id });
                                                                        syncedCount++;
                                                                    }
                                                                }
                                                            }
                                                            if (syncedCount > 0) {
                                                                showToast(`Successfully synced ${syncedCount} missing locations to Franchises!`);
                                                                refreshData();
                                                            } else {
                                                                showToast("All locations are already synced to Franchises.");
                                                            }
                                                        } catch (error) {
                                                            console.error(error);
                                                            showToast('Error syncing locations', "error");
                                                        }
                                                        if(btn) btn.innerHTML = '🔗 Sync Missing Locations';
                                                    }}
                                                    id="syncLocBtn"
                                                    style={{ background: '#10b981' }}
                                                >
                                                    🔗 Sync Missing Locations
                                                </button>
                                                <button
                                                    className={styles.addButton}
                                                    onClick={async () => {
                                                        if(window.confirm("Delete placeholder dummy franchises (Koramangala & Connaught Place)?")) {
                                                            try {
                                                                let deleted = 0;
                                                                const d1 = runningFranchises.find(f => f.outletName === "High Laban - Connaught Place");
                                                                const d2 = runningFranchises.find(f => f.outletName === "High Laban - Koramangala Cafe");
                                                                if (d1) { await db.deleteFranchiseOutlet(d1.id); deleted++; }
                                                                if (d2) { await db.deleteFranchiseOutlet(d2.id); deleted++; }
                                                                if(deleted > 0) {
                                                                    showToast(`Deleted ${deleted} dummy outlets!`);
                                                                    refreshData();
                                                                } else {
                                                                    showToast("No dummy outlets found.");
                                                                }
                                                            } catch(e) {
                                                                showToast("Error deleting", "error");
                                                            }
                                                        }
                                                    }}
                                                    style={{ background: '#ef4444' }}
                                                >
                                                    🗑️ Clear Dummy Outlets
                                                </button>
                                                <select 
                                                    value={franchiseFilterCity} 
                                                    onChange={e => setFranchiseFilterCity(e.target.value)}
                                                    style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', fontWeight: '600', color: '#334155', cursor: 'pointer' }}
                                                >
                                                    <option value="All">🌍 All Cities / Regions</option>
                                                    {[...new Set(runningFranchises.map(f => f.city).filter(Boolean))].map(city => (
                                                        <option key={city} value={city}>📍 {city}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    className={styles.addButton}
                                                    onClick={() => setShowAddFranchiseOutletForm(true)}
                                                >
                                                    + ADD NEW OUTLET
                                                </button>
                                            </div>
                                        </div>

                                        <div className={styles.grid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                                            {runningFranchises.filter(f => (franchiseFilterCity === 'All' || f.city === franchiseFilterCity) && (franchiseFilterKitchen === 'All' || f.assignedKitchenId === franchiseFilterKitchen)).length > 0 ? (
                                                runningFranchises.filter(f => (franchiseFilterCity === 'All' || f.city === franchiseFilterCity) && (franchiseFilterKitchen === 'All' || f.assignedKitchenId === franchiseFilterKitchen)).map((outlet) => (
                                                    <div key={outlet.id} className={styles.card} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', position: 'relative', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                                                        
                                                        {/* Header */}
                                                        {(() => {
                                                            const linkedLoc = locations.find(l => l.franchiseId === outlet.id);
                                                            const displayTitle = linkedLoc?.area || outlet.outletName;
                                                            return (
                                                                <>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                                        <div>
                                                                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: 'bold' }}>{displayTitle}</h3>
                                                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                                                                                Opened: {outlet.openDate ? new Date(outlet.openDate).toLocaleDateString() : 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                                                            <button onClick={() => setEditingFranchiseOutlet(outlet)} className={styles.editBtn} style={{ width: '28px', height: '28px', padding: '4px', border: 'none', background: '#f1f5f9', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Outlet">
                                                                                <EditIcon />
                                                                            </button>
                                                                            <button onClick={() => handleDeleteFranchiseOutlet(outlet.id)} className={styles.deleteButton} style={{ width: '28px', height: '28px', padding: '4px', border: 'none', background: '#fee2e2', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Outlet">
                                                                                <TrashIcon />
                                                                            </button>
                                                                            <span className={`${styles.statusBadge} ${styles['status_' + (outlet.status || 'running').toLowerCase().replace(' ', '_').replace('-', '_')]}`} style={{ marginLeft: '4px' }}>
                                                                                {outlet.status || 'Running'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {/* Owner details */}
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem' }}>
                                                                        <div style={{ fontWeight: '500', color: '#334155' }}>Owner: <strong>{outlet.ownerName}</strong></div>
                                                                        <a href={`tel:${outlet.phone}`} style={{ color: '#475569', textDecoration: 'none' }}>📞 {outlet.phone}</a>
                                                                        {outlet.email && <a href={`mailto:${outlet.email}`} style={{ color: '#009ceb', textDecoration: 'none' }}>📧 {outlet.email}</a>}
                                                                    </div>

                                                                    {/* Address Box */}
                                                                    <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #f1f5f9' }}>
                                                                        <div><strong>Model:</strong> {outlet.modelType}</div>
                                                                        <div style={{ marginTop: '4px', color: '#64748b' }}>📍 {outlet.address}, {outlet.city}, {outlet.state}</div>
                                                                    </div>

                                                                    {/* Linked Store Location status */}
                                                                    {linkedLoc && (
                                                                        <div style={{ padding: '10px', background: '#ecfdf5', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid #a7f3d0' }}>
                                                                            <div style={{ color: '#047857', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                <span>📍 Store Location: {linkedLoc.name}</span>
                                                                                <span style={{ fontSize: '0.7rem', padding: '1px 5px', background: '#10b981', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>{linkedLoc.status}</span>
                                                                            </div>
                                                                            <div style={{ color: '#065f46', marginTop: '2px' }}>Area: {linkedLoc.area}</div>
                                                                            {linkedLoc.mapUrl && (
                                                                                <a href={linkedLoc.mapUrl} target="_blank" rel="noreferrer" style={{ color: '#047857', textDecoration: 'underline', display: 'inline-block', marginTop: '4px', fontWeight: '600' }}>Open Google Map ↗</a>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}

                                                        {/* Documents Box */}
                                                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.8rem', marginTop: '0.4rem' }}>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>📄 Saved Documents</div>
                                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                                {outlet.agreementUrl ? (
                                                                    <a href={outlet.agreementUrl} target="_blank" rel="noreferrer" style={{ background: '#e0f2fe', color: '#0369a1', textDecoration: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>Agreement 📥</a>
                                                                ) : (
                                                                    <span style={{ background: '#f1f5f9', color: '#94a3b8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem' }}>No Agreement</span>
                                                                )}
                                                                {outlet.gstUrl ? (
                                                                    <a href={outlet.gstUrl} target="_blank" rel="noreferrer" style={{ background: '#e2fbee', color: '#15803d', textDecoration: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>GST Cert 📥</a>
                                                                ) : (
                                                                    <span style={{ background: '#f1f5f9', color: '#94a3b8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem' }}>No GST</span>
                                                                )}
                                                                {outlet.ownerIdUrl ? (
                                                                    <a href={outlet.ownerIdUrl} target="_blank" rel="noreferrer" style={{ background: '#f3e8ff', color: '#6b21a8', textDecoration: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>Owner ID 📥</a>
                                                                ) : (
                                                                    <span style={{ background: '#f1f5f9', color: '#94a3b8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem' }}>No ID Copy</span>
                                                                )}
                                                                {outlet.documents && outlet.documents.map((doc, idx) => (
                                                                    <a key={idx} href={doc.url} target="_blank" rel="noreferrer" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', textDecoration: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>{doc.name} 📥</a>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Franchise Fixed Costs Collapsible Section */}
                                                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.8rem', marginTop: '0.8rem' }}>
                                                            <button 
                                                                type="button"
                                                                onClick={() => {
                                                                    if (openFixedCostOutletId === outlet.id) {
                                                                        setOpenFixedCostOutletId(null);
                                                                    } else {
                                                                        setOpenFixedCostOutletId(outlet.id);
                                                                        setEditingFixedCosts({
                                                                            ...editingFixedCosts,
                                                                            [outlet.id]: outlet.fixedCosts ? [...outlet.fixedCosts.map(c => ({ ...c }))] : [{ name: '', amount: '' }]
                                                                        });
                                                                    }
                                                                }}
                                                                style={{
                                                                    width: '100%',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '8px 12px',
                                                                    background: openFixedCostOutletId === outlet.id ? '#f0f9ff' : '#f8fafc',
                                                                    border: openFixedCostOutletId === outlet.id ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                                                                    borderRadius: '8px',
                                                                    cursor: 'pointer',
                                                                    fontWeight: '700',
                                                                    fontSize: '0.8rem',
                                                                    color: openFixedCostOutletId === outlet.id ? '#0369a1' : '#475569',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                <span>💰 Monthly Fixed Costs</span>
                                                                <span style={{ background: openFixedCostOutletId === outlet.id ? '#0ea5e9' : '#e2e8f0', color: openFixedCostOutletId === outlet.id ? 'white' : '#475569', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem' }}>
                                                                    ₹{((outlet.fixedCosts || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)).toFixed(2)}
                                                                </span>
                                                            </button>
                                                            
                                                            {openFixedCostOutletId === outlet.id && (
                                                                <div style={{ marginTop: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                                                                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.5rem' }}>Edit Cost Items</div>
                                                                    
                                                                    {(editingFixedCosts[outlet.id] || []).map((cost, idx) => (
                                                                        <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                                                                            <input 
                                                                                type="text" 
                                                                                placeholder="e.g. Rent, Staff" 
                                                                                value={cost.name} 
                                                                                onChange={e => {
                                                                                    const updated = [...(editingFixedCosts[outlet.id] || [])];
                                                                                    updated[idx].name = e.target.value;
                                                                                    setEditingFixedCosts({ ...editingFixedCosts, [outlet.id]: updated });
                                                                                }} 
                                                                                style={{ flex: 2, padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                                                                            />
                                                                            <input 
                                                                                type="number" 
                                                                                placeholder="Amount" 
                                                                                value={cost.amount} 
                                                                                onChange={e => {
                                                                                    const updated = [...(editingFixedCosts[outlet.id] || [])];
                                                                                    updated[idx].amount = e.target.value;
                                                                                    setEditingFixedCosts({ ...editingFixedCosts, [outlet.id]: updated });
                                                                                }} 
                                                                                style={{ flex: 1, padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', width: '70px' }}
                                                                            />
                                                                            <button 
                                                                                type="button" 
                                                                                onClick={() => {
                                                                                    const updated = (editingFixedCosts[outlet.id] || []).filter((_, i) => i !== idx);
                                                                                    setEditingFixedCosts({ ...editingFixedCosts, [outlet.id]: updated });
                                                                                }} 
                                                                                style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', padding: '4px' }}
                                                                            >
                                                                                ✕
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => {
                                                                            const updated = [...(editingFixedCosts[outlet.id] || []), { name: '', amount: '' }];
                                                                            setEditingFixedCosts({ ...editingFixedCosts, [outlet.id]: updated });
                                                                        }} 
                                                                        style={{ width: '100%', background: 'white', border: '1px dashed #cbd5e1', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', marginBottom: '8px' }}
                                                                    >
                                                                        + Add Item
                                                                    </button>
                                                                    
                                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => handleSaveOutletFixedCosts(outlet.id)}
                                                                            style={{ flex: 1, background: '#0284c7', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem' }}
                                                                        >
                                                                            Save Costs
                                                                        </button>
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => setOpenFixedCostOutletId(null)}
                                                                            style={{ background: 'white', border: '1px solid #cbd5e1', color: '#64748b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem' }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className={styles.card} style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: 'white' }}>
                                                    <p style={{ color: '#94a3b8', fontSize: '1rem' }}>No active franchise outlets recorded.</p>
                                                </div>
                                            )}
                                        </div>
                                        </>
                                )}

                                {franchiseSubTab === 'kitchens' && (
                                    <>
                                        <div className={styles.catalogHeader}>
                                            <h2 className={styles.sectionTitle}>Central Kitchens Hubs</h2>
                                            <button 
                                                className={styles.addButton}
                                                onClick={() => {
                                                    setEditingFixedCosts({});
                                                    setOpenFixedCostOutletId(null);
                                                    showToast('Manage Kitchens in Costing -> Fixed Costs (Or here directly if extended)');
                                                    const newName = prompt('Enter new Kitchen Name:');
                                                    if(newName) {
                                                        const newCity = prompt('Enter City:');
                                                        db.addKitchen({ name: newName, city: newCity, address: '', phone: '', fixedCosts: [] }).then(k => {
                                                            setKitchens(prev => [...prev, k]);
                                                            showToast('Kitchen added! 🍳');
                                                        });
                                                    }
                                                }}
                                            >
                                                + ADD KITCHEN HUB
                                            </button>
                                        </div>
                                        <div className={styles.grid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                                            {kitchens.map((k) => (
                                                <div key={k.id} className={styles.card} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', position: 'relative', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                        <div>
                                                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: 'bold' }}>{k.name}</h3>
                                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                                                                📍 City: {k.city}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                                            <button onClick={() => {
                                                                const newAddress = prompt('Enter new address:', k.address || '');
                                                                if(newAddress !== null) {
                                                                    const newPhone = prompt('Enter new phone:', k.phone || '');
                                                                    if(newPhone !== null) {
                                                                        const updatedK = { ...k, address: newAddress, phone: newPhone };
                                                                        db.updateKitchen(k.id, updatedK).then(() => {
                                                                            setKitchens(prev => prev.map(old => old.id === k.id ? updatedK : old));
                                                                            showToast('Kitchen details updated!');
                                                                        });
                                                                    }
                                                                }
                                                            }} className={styles.editBtn} style={{ width: '28px', height: '28px', padding: '4px', border: 'none', background: '#f1f5f9', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Address/Phone">
                                                                ✏️
                                                            </button>
                                                            <button onClick={async () => {
                                                                if(window.confirm('Delete this Central Kitchen?')) {
                                                                    await db.deleteKitchen(k.id);
                                                                    setKitchens(prev => prev.filter(old => old.id !== k.id));
                                                                    showToast('Kitchen deleted');
                                                                }
                                                            }} className={styles.deleteButton} style={{ width: '28px', height: '28px', padding: '4px', border: 'none', background: '#fee2e2', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Kitchen">
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem' }}>
                                                        {k.address ? <div style={{ color: '#334155' }}>📍 {k.address}</div> : <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No address added</div>}
                                                        {k.phone ? <a href={`tel:${k.phone}`} style={{ color: '#475569', textDecoration: 'none' }}>📞 {k.phone}</a> : null}
                                                    </div>

                                                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.8rem', marginTop: '0.8rem' }}>
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                if (openFixedCostOutletId === k.id) {
                                                                    setOpenFixedCostOutletId(null);
                                                                } else {
                                                                    setOpenFixedCostOutletId(k.id);
                                                                    setEditingFixedCosts({
                                                                        ...editingFixedCosts,
                                                                        [k.id]: k.fixedCosts ? [...k.fixedCosts.map(c => ({ ...c }))] : [{ name: '', amount: '' }]
                                                                    });
                                                                }
                                                            }}
                                                            style={{ 
                                                                width: '100%', 
                                                                background: '#f8fafc', 
                                                                border: '1px solid #e2e8f0', 
                                                                padding: '8px', 
                                                                borderRadius: '6px', 
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                color: '#334155',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.85rem'
                                                            }}
                                                        >
                                                            <span>💰 Fixed Operational Costs</span>
                                                            <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                                                                ₹{k.fixedCosts ? k.fixedCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0) : 0}/mo
                                                            </span>
                                                        </button>
                                                        
                                                        {openFixedCostOutletId === k.id && (
                                                            <div style={{ marginTop: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                <div style={{ marginBottom: '8px', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>MONTHLY EXPENSES (Rent, Salary, etc.)</div>
                                                                {(editingFixedCosts[k.id] || []).map((cost, idx) => (
                                                                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="Expense Name (e.g., Rent)" 
                                                                            value={cost.name}
                                                                            onChange={(e) => {
                                                                                const updated = [...(editingFixedCosts[k.id] || [])];
                                                                                updated[idx].name = e.target.value;
                                                                                setEditingFixedCosts({ ...editingFixedCosts, [k.id]: updated });
                                                                            }}
                                                                            style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                                                        />
                                                                        <input 
                                                                            type="number" 
                                                                            placeholder="Amount (₹)" 
                                                                            value={cost.amount}
                                                                            onChange={(e) => {
                                                                                const updated = [...(editingFixedCosts[k.id] || [])];
                                                                                updated[idx].amount = e.target.value;
                                                                                setEditingFixedCosts({ ...editingFixedCosts, [k.id]: updated });
                                                                            }}
                                                                            style={{ width: '100px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                                                        />
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => {
                                                                                const updated = [...(editingFixedCosts[k.id] || [])];
                                                                                updated.splice(idx, 1);
                                                                                setEditingFixedCosts({ ...editingFixedCosts, [k.id]: updated });
                                                                            }}
                                                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                                                            title="Remove Expense"
                                                                        >
                                                                            ❌
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => {
                                                                        const updated = [...(editingFixedCosts[k.id] || []), { name: '', amount: '' }];
                                                                        setEditingFixedCosts({ ...editingFixedCosts, [k.id]: updated });
                                                                    }} 
                                                                    style={{ width: '100%', background: 'white', border: '1px dashed #cbd5e1', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', marginBottom: '8px' }}
                                                                >
                                                                    + Add Item
                                                                </button>
                                                                
                                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={async () => {
                                                                            const updatedK = { ...k, fixedCosts: editingFixedCosts[k.id] };
                                                                            await db.updateKitchen(k.id, updatedK);
                                                                            setKitchens(prev => prev.map(old => old.id === k.id ? updatedK : old));
                                                                            setOpenFixedCostOutletId(null);
                                                                            showToast('Kitchen fixed costs updated! ✅');
                                                                        }}
                                                                        style={{ flex: 1, background: '#0284c7', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem' }}
                                                                    >
                                                                        Save Costs
                                                                    </button>
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => setOpenFixedCostOutletId(null)}
                                                                        style={{ background: 'white', border: '1px solid #cbd5e1', color: '#64748b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem' }}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        </>
                                )}
                            </div>
                        );
                    })()
                }

                {/* Locations Tab */}
                {activeTab === 'locations' && (
                    <div className={styles.tabContent}>
                        <div className={styles.catalogHeader}>
                            <h2 className={styles.sectionTitle}>Manage Locations</h2>
                            <button
                                className={styles.addButton}
                                onClick={() => setShowLocationForm(!showLocationForm)}
                            >
                                <span>{showLocationForm ? '−' : '+'}</span> {showLocationForm ? 'CLOSE FORM' : 'ADD LOCATION'}
                            </button>
                        </div>

                        <div style={{
                            maxHeight: showLocationForm ? '2000px' : '0',
                            opacity: showLocationForm ? 1 : 0,
                            overflow: 'hidden',
                            transition: 'all 0.5s ease-in-out',
                            marginBottom: showLocationForm ? '2rem' : 0
                        }}>
                            <div className={styles.formCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3>{editingLocationId ? 'Edit Location' : 'Add New Location'}</h3>
                                    {editingLocationId && (
                                        <button onClick={handleCancelEdit} style={{ background: '#f1f5f9', border: 'none', padding: '0.5rem 1rem', borderRadius: '50px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b' }}>
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>
                                <div className={styles.splitLayout}>
                                    {/* Left Side: Form */}
                                    <form onSubmit={handleAddLocation} className={styles.form}>
                                        <div className={styles.formGroup}>
                                            <label>🔗 Link to Running Franchise Outlet (Optional)</label>
                                            <select
                                                value={newLocation.franchiseId || ''}
                                                onChange={e => handleLocationFranchiseLink(e.target.value)}
                                                className={styles.input}
                                            >
                                                <option value="">-- No Franchise Linked --</option>
                                                {runningFranchises.map(f => (
                                                    <option key={f.id} value={f.id}>{f.outletName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Location Name (e.g., High Laban India)</label>
                                            <input
                                                type="text"
                                                placeholder="Name"
                                                value={newLocation.name || ''}
                                                onChange={e => setNewLocation({ ...newLocation, name: e.target.value })}
                                                required
                                                className={styles.input}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Area / City (e.g., Bangalore)</label>
                                            <input
                                                type="text"
                                                placeholder="Area"
                                                value={newLocation.area || ''}
                                                onChange={e => setNewLocation({ ...newLocation, area: e.target.value })}
                                                required
                                                className={styles.input}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Owner Name (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. John Doe"
                                                value={newLocation.ownerName || ''}
                                                onChange={e => setNewLocation({ ...newLocation, ownerName: e.target.value })}
                                                className={styles.input}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Owner Email (Optional)</label>
                                            <input
                                                type="email"
                                                placeholder="e.g. owner@highlaban.com"
                                                value={newLocation.ownerEmail || ''}
                                                onChange={e => setNewLocation({ ...newLocation, ownerEmail: e.target.value })}
                                                className={styles.input}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Store Address (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. MG Road, Bengaluru"
                                                value={newLocation.address || ''}
                                                onChange={e => setNewLocation({ ...newLocation, address: e.target.value })}
                                                className={styles.input}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Google Maps Link</label>
                                            <input
                                                type="url"
                                                placeholder="https://maps.google.com/..."
                                                value={newLocation.mapUrl || ''}
                                                onChange={e => setNewLocation({ ...newLocation, mapUrl: e.target.value })}
                                                className={styles.input}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Status</label>
                                            <select
                                                value={newLocation.status}
                                                onChange={e => setNewLocation({ ...newLocation, status: e.target.value })}
                                                className={styles.input}
                                            >
                                                <option value="Open">Open</option>
                                                <option value="Coming Soon">Coming Soon</option>
                                                <option value="Closed">Closed</option>
                                            </select>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label style={{ fontWeight: 'bold' }}>Outlet Images (Multiple)</label>
                                            
                                            {/* List of uploaded images with Delete options */}
                                            {(((newLocation.imageUrls && newLocation.imageUrls.length > 0) || newLocation.imageUrl)) && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                                                    {/* If legacy imageUrl is set and not in imageUrls, show it first */}
                                                    {newLocation.imageUrl && !(newLocation.imageUrls || []).includes(newLocation.imageUrl) && (
                                                        <div style={{ position: 'relative', width: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #0284c7' }} title="Cover Image">
                                                            <img src={newLocation.imageUrl} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button 
                                                                type="button"
                                                                onClick={() => {
                                                                    setNewLocation(prev => ({ ...prev, imageUrl: '' }));
                                                                }}
                                                                style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                            >
                                                                ×
                                                            </button>
                                                            <span style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(2, 132, 199, 0.8)', color: 'white', fontSize: '8px', textAlign: 'center', fontWeight: 'bold' }}>COVER</span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Show all images in imageUrls */}
                                                    {(newLocation.imageUrls || []).map((imgUrl, index) => (
                                                        <div key={index} style={{ position: 'relative', width: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: newLocation.imageUrl === imgUrl ? '2px solid #0284c7' : '1px solid #cbd5e1' }}>
                                                            <img src={imgUrl} alt={`Preview ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button 
                                                                type="button"
                                                                onClick={() => {
                                                                    const updated = (newLocation.imageUrls || []).filter((_, i) => i !== index);
                                                                    const newCover = newLocation.imageUrl === imgUrl ? (updated[0] || '') : newLocation.imageUrl;
                                                                    setNewLocation(prev => ({ ...prev, imageUrls: updated, imageUrl: newCover }));
                                                                }}
                                                                style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                            >
                                                                ×
                                                            </button>
                                                            {newLocation.imageUrl === imgUrl ? (
                                                                <span style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(2, 132, 199, 0.8)', color: 'white', fontSize: '8px', textAlign: 'center', fontWeight: 'bold' }}>COVER</span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setNewLocation(prev => ({ ...prev, imageUrl: imgUrl }))}
                                                                    style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', fontSize: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                                                >
                                                                    SET COVER
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <input 
                                                    type="text" 
                                                    placeholder="Paste image link and press Enter..." 
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = e.target.value.trim();
                                                            if (val) {
                                                                const currentUrls = newLocation.imageUrls || [];
                                                                const newCover = newLocation.imageUrl || val;
                                                                setNewLocation(prev => ({ ...prev, imageUrls: [...currentUrls, val], imageUrl: newCover }));
                                                                e.target.value = '';
                                                            }
                                                        }
                                                    }}
                                                    className={styles.input}
                                                    style={{ flex: 1 }}
                                                />
                                                <input 
                                                    type="file"
                                                    multiple
                                                    onChange={async (e) => {
                                                        const files = Array.from(e.target.files);
                                                        if (files.length === 0) return;
                                                        setIsUploading(true);
                                                        try {
                                                            const urls = [];
                                                            for (const file of files) {
                                                                const url = await uploadMedia(file);
                                                                urls.push(url);
                                                            }
                                                            const currentUrls = newLocation.imageUrls || [];
                                                            const newCover = newLocation.imageUrl || urls[0] || '';
                                                            setNewLocation(prev => ({ 
                                                                ...prev, 
                                                                imageUrls: [...currentUrls, ...urls],
                                                                imageUrl: newCover
                                                            }));
                                                            showToast(`Successfully uploaded ${files.length} images!`)
                                                        } catch (err) {
                                                            showToast("Upload failed: " + err.message, "error")
                                                        } finally {
                                                            setIsUploading(false);
                                                        }
                                                    }}
                                                    style={{ width: '150px', fontSize: '0.75rem' }}
                                                />
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                                                💡 You can upload multiple files or paste a URL and press Enter. Click <strong>"SET COVER"</strong> to choose which image displays on the card.
                                            </span>
                                        </div>

                                        <div style={{ marginTop: '1.2rem', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                                            <h4 style={{ color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 'bold' }}>🛒 Online Channels & Booking Options</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                <div className={styles.formGroup}>
                                                    <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Store Contact Phone</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="e.g. 9876543210" 
                                                        value={newLocation.phone || ''} 
                                                        onChange={e => setNewLocation({ ...newLocation, phone: e.target.value.replace(/[^0-9+\s-]/g, '') })} 
                                                        className={styles.input} 
                                                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label style={{ fontSize: '0.7rem', color: '#64748b' }}>WhatsApp Connection (Phone / URL)</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="e.g. 919876543210" 
                                                        value={newLocation.whatsapp || ''} 
                                                        onChange={e => setNewLocation({ ...newLocation, whatsapp: e.target.value })} 
                                                        className={styles.input} 
                                                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Zomato Link</label>
                                                    <input 
                                                        type="url" 
                                                        placeholder="https://zomato.com/..." 
                                                        value={newLocation.zomato || ''} 
                                                        onChange={e => setNewLocation({ ...newLocation, zomato: e.target.value })} 
                                                        className={styles.input} 
                                                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Swiggy Link</label>
                                                    <input 
                                                        type="url" 
                                                        placeholder="https://swiggy.com/..." 
                                                        value={newLocation.swiggy || ''} 
                                                        onChange={e => setNewLocation({ ...newLocation, swiggy: e.target.value })} 
                                                        className={styles.input} 
                                                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label style={{ fontSize: '0.7rem', color: '#64748b' }}>MagicPin Link</label>
                                                    <input 
                                                        type="url" 
                                                        placeholder="https://magicpin.in/..." 
                                                        value={newLocation.magicpin || ''} 
                                                        onChange={e => setNewLocation({ ...newLocation, magicpin: e.target.value })} 
                                                        className={styles.input} 
                                                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Ownly Food Link</label>
                                                    <input 
                                                        type="url" 
                                                        placeholder="https://ownly.in/..." 
                                                        value={newLocation.ownly || ''} 
                                                        onChange={e => setNewLocation({ ...newLocation, ownly: e.target.value })} 
                                                        className={styles.input} 
                                                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label style={{ fontSize: '0.7rem', color: '#64748b' }}>ONDC Link</label>
                                                    <input 
                                                        type="url" 
                                                        placeholder="https://ondc.org/..." 
                                                        value={newLocation.ondc || ''} 
                                                        onChange={e => setNewLocation({ ...newLocation, ondc: e.target.value })} 
                                                        className={styles.input} 
                                                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1rem' }}>
                                            <button type="submit" className={styles.addButton}>
                                                {editingLocationId ? 'Update Location' : 'Add Location'}
                                            </button>
                                        </div>
                                    </form>

                                    {/* Right Side: Map Helper */}
                                    <div className={styles.mapHelper}>
                                        <div className={styles.mapIcon}>📍</div>
                                        <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>Locate on Map</h4>
                                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem', maxWidth: '300px' }}>
                                            Search for the location on Google Maps, copy the link from the browser bar, and paste it into the "Google Maps Link" field.
                                        </p>
                                        <button
                                            className={styles.openMapBtn}
                                            onClick={() => window.open('https://www.google.com/maps', '_blank')}
                                            type="button"
                                        >
                                            Open Google Maps ↗
                                        </button>
                                        {newLocation.mapUrl && (
                                            <div style={{ marginTop: '1rem', width: '100%' }}>
                                                <a
                                                    href={newLocation.mapUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ display: 'block', padding: '0.8rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}
                                                >
                                                    Test Link: Open Location
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
                            <h4 style={{ marginBottom: '1rem', color: '#64748b' }}>Existing Locations</h4>
                            <div className={styles.grid}>
                                {locations.map(loc => (
                                    <div key={loc.id} className={styles.card} style={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                                        <div className={styles.cardHeader}>
                                            <h3>{loc.area || loc.name}</h3>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => handleEditLocation(loc)} className={styles.editBtn} style={{ width: '30px', height: '30px' }}>
                                                    <EditIcon />
                                                </button>
                                                <button onClick={() => handleDeleteLocation(loc.id)} className={styles.deleteButton}><TrashIcon /></button>
                                            </div>
                                        </div>
                                        <p style={{ color: '#64748b' }}>{loc.name}</p>
                                        <p style={{ fontSize: '0.9rem' }}>Status: <strong>{loc.status}</strong></p>
                                        
                                        {loc.franchiseId && (() => {
                                            const franchise = runningFranchises.find(f => f.id === loc.franchiseId);
                                            if (franchise) {
                                                return (
                                                    <div style={{ marginTop: '0.5rem', padding: '8px', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid #bae6fd' }}>
                                                        <div style={{ color: '#0369a1', fontWeight: 'bold' }}>🏪 Linked Franchise Outlet</div>
                                                        <div style={{ color: '#0369a1', marginTop: '2px' }}>Owner: {franchise.ownerName} ({franchise.phone})</div>
                                                        {franchise.email && <div style={{ color: '#0369a1' }}>Email: {franchise.email}</div>}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                        
                                        <a href={loc.mapUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.9rem', display: 'inline-block', marginTop: '0.5rem' }}>View Map</a>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Live Counter Stats Configuration Form */}
                        <div style={{ marginTop: '3rem', borderTop: '2px solid #e2e8f0', paddingTop: '2rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>📊 Homepage Live Counter Stats</h3>
                            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                                Edit the counter metrics shown on the homepage hero/stats section. Note: The <strong>"LOCATIONS"</strong> counter automatically syncs with the number of Open locations below.
                            </p>

                            <form onSubmit={handleSaveStats} className={styles.card} style={{ maxWidth: '600px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: 'none' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className={styles.formGroup}>
                                        <label>Locations Count (Auto-calculated)</label>
                                        <input 
                                            type="text" 
                                            value={`${locations.filter(l => l.status === 'Open').length} (Live Locations)`} 
                                            disabled 
                                            className={styles.input}
                                            style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Locations Suffix</label>
                                        <input 
                                            type="text" 
                                            value="+" 
                                            disabled 
                                            className={styles.input}
                                            style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className={styles.formGroup}>
                                        <label>Happy Customers Target</label>
                                        <input 
                                            type="number" 
                                            value={statsConfig.happyCustomersVal} 
                                            onChange={e => setStatsConfig({ ...statsConfig, happyCustomersVal: e.target.value })} 
                                            className={styles.input}
                                            required 
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Happy Customers Suffix</label>
                                        <input 
                                            type="text" 
                                            value={statsConfig.happyCustomersSuffix} 
                                            onChange={e => setStatsConfig({ ...statsConfig, happyCustomersSuffix: e.target.value })} 
                                            className={styles.input}
                                            required 
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div className={styles.formGroup}>
                                        <label>Varieties Target</label>
                                        <input 
                                            type="number" 
                                            value={statsConfig.varietiesVal} 
                                            onChange={e => setStatsConfig({ ...statsConfig, varietiesVal: e.target.value })} 
                                            className={styles.input}
                                            required 
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Varieties Suffix</label>
                                        <input 
                                            type="text" 
                                            value={statsConfig.varietiesSuffix} 
                                            onChange={e => setStatsConfig({ ...statsConfig, varietiesSuffix: e.target.value })} 
                                            className={styles.input}
                                            required 
                                        />
                                    </div>
                                </div>

                                <button type="submit" className={styles.addButton} disabled={isSavingStats}>
                                    {isSavingStats ? 'Saving Changes...' : 'Save Counter Stats'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Staff & HR Management Tab */}
                {activeTab === 'staff' && (() => {
                    const activeStaff = staffList.filter(s => s.status !== 'Terminated');
                    const totalWorkers = staffList.length;
                    const activeCount = activeStaff.length;
                    const terminatedCount = staffList.filter(s => s.status === 'Terminated').length;
                    const pendingBankCount = activeStaff.filter(s => !s.bankName || !s.accountNumber).length;

                    // Compute total payroll (salaries + incentives)
                    const totalPayroll = activeStaff.reduce((acc, s) => {
                        const basic = parseFloat(s.salary) || 0;
                        const inc = parseFloat(s.incentive) || 0;
                        return acc + basic + inc;
                    }, 0);

                    const totalLeaves = activeStaff.reduce((acc, s) => acc + (parseInt(s.leavesTaken) || 0), 0);

                    const totalDocsExpected = activeCount * 3;
                    const totalDocsCollected = activeStaff.reduce((acc, s) => {
                        let count = 0;
                        if (s.aadhaarCollected) count++;
                        if (s.panCollected) count++;
                        if (s.medicalCollected) count++;
                        return acc + count;
                    }, 0);
                    const docsPercent = totalDocsExpected > 0 ? Math.round((totalDocsCollected / totalDocsExpected) * 100) : 0;

                    const filteredStaff = staffList.filter(s => {
                        const nameStr = (s.fullName || '').toLowerCase();
                        const nickStr = (s.nickname || '').toLowerCase();
                        const emailStr = (s.email || '').toLowerCase();
                        const phoneStr = (s.phone || '').toLowerCase();
                        const query = staffSearchQuery.toLowerCase();
                        
                        const matchesSearch = nameStr.includes(query) || nickStr.includes(query) || emailStr.includes(query) || phoneStr.includes(query);
                        const matchesRole = staffRoleFilter === 'All' || s.position === staffRoleFilter;
                        const matchesStatus = staffStatusFilter === 'All' || s.status === staffStatusFilter;
                        const matchesOutlet = staffOutletFilter === 'All' || 
                            (staffOutletFilter === 'Head Office' ? (!s.assignedOutlet || s.assignedOutlet === '') : s.assignedOutlet === staffOutletFilter);
                        
                        return matchesSearch && matchesRole && matchesStatus && matchesOutlet;
                    });

                    // Helper to export CSV
                    const exportToCsv = () => {
                        const headers = ['Full Name', 'Nickname', 'Gender', 'DOB', 'Position', 'Status', 'Salary', 'Incentive', 'Phone', 'Email', 'Bank Name', 'Account No'];
                        const rows = staffList.map(s => [
                            s.fullName, s.nickname, s.gender, s.dob, s.position, s.status, s.salary, s.incentive, s.phone, s.email, s.bankName, s.accountNumber
                        ]);
                        const csvContent = "data:text/csv;charset=utf-8," 
                            + [headers.join(','), ...rows.map(e => e.map(val => `"${val || ''}"`).join(","))].join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "HighLaban_Staff_Directory.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    };

                    return (
                        <div className={styles.tabContent}>
                            {/* HR Catalog Header */}
                            <div className={styles.catalogHeader}>
                                <h2 className={styles.sectionTitle}>Restaurant Staff & HR Directory</h2>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button className={styles.addButton} onClick={() => setShowAddStaffForm(true)}>
                                        <span>+</span> ADD NEW STAFF
                                    </button>
                                    <button onClick={exportToCsv} className={styles.exportBtn} style={{ background: '#10b981', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '50px', border: 'none', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        📥 Export to CSV
                                    </button>
                                </div>
                            </div>

                            {/* Copy URLs Panel */}
                            <div style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '16px',
                                padding: '1rem 1.5rem',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '1.5rem',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Public Job App:</span>
                                        <code style={{ background: '#e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', color: '#0f172a' }}>
                                            {window.location.origin}/apply
                                        </code>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/apply`);
                                                showToast("Job App URL copied!");
                                            }}
                                            style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Staff Onboarding:</span>
                                        <code style={{ background: '#e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', color: '#0f172a' }}>
                                            {window.location.origin}/onboarding
                                        </code>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/onboarding`);
                                                showToast("Onboarding URL copied!");
                                            }}
                                            style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Staff Sub-Tabs Toggle: Directory vs Job Applications */}
                            <div style={{ display: "flex", gap: "1rem", borderBottom: "2px solid #e2e8f0", marginBottom: "1.5rem", paddingBottom: "0.5rem" }}>
                                <button 
                                    onClick={() => setActiveStaffSubTab("directory")}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        fontSize: "1rem",
                                        fontWeight: "800",
                                        color: activeStaffSubTab === "directory" ? "#0ea5e9" : "#64748b",
                                        borderBottom: activeStaffSubTab === "directory" ? "3px solid #0ea5e9" : "3px solid transparent",
                                        padding: "0.5rem 1rem",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    🧑‍🍳 Staff Directory ({staffList.length})
                                </button>
                                <button 
                                    onClick={() => setActiveStaffSubTab("leads")}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        fontSize: "1rem",
                                        fontWeight: "800",
                                        color: activeStaffSubTab === "leads" ? "#0ea5e9" : "#64748b",
                                        borderBottom: activeStaffSubTab === "leads" ? "3px solid #0ea5e9" : "3px solid transparent",
                                        padding: "0.5rem 1rem",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    📋 Job Applications ({workerApplications.length})
                                </button>
                            </div>

                            {activeStaffSubTab === 'directory' ? (
                                <>
                                    {/* KPI Metrics — compact single row */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                {[
                                    { label: 'Total Workers', value: totalWorkers, color: '#1e293b', icon: '🏦' },
                                    { label: 'Active Staff', value: activeCount, color: '#10b981', icon: '🏦' },
                                    { label: 'Terminated', value: terminatedCount, color: '#f59e0b', icon: '🏦' },
                                    { label: 'Pending Bank', value: pendingBankCount, color: '#ef4444', icon: '🏦' },
                                    { label: 'Docs Collected', value: `${docsPercent}%`, color: '#6366f1', icon: '🏦' },
                                    { label: 'Active Payout', value: `₹${totalPayroll.toLocaleString('en-IN')}`, color: '#0f172a', icon: '🏦' },
                                ].map(({ label, value, color, icon }) => (
                                    <div key={label} style={{ background: 'white', padding: '0.85rem 1rem', borderRadius: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                                            <div style={{ fontSize: '1.35rem', fontWeight: '800', color, marginTop: '2px', lineHeight: 1.1 }}>{value}</div>
                                        </div>
                                        <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{icon}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Search and Filters row */}
                            <div className={styles.hrFiltersRow} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', background: 'white', padding: '1rem', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                <div className={styles.searchBar} style={{ flex: 1, minWidth: '250px', display: 'flex', visibility: 'visible' }}>
                                    <LoopIcon />
                                    <input type="text" placeholder="Search staff by name, email, phone or nickname..." value={staffSearchQuery} onChange={e => setStaffSearchQuery(e.target.value)} className={styles.searchInput} />
                                </div>
                                <select value={staffStatusFilter} onChange={e => setStaffStatusFilter(e.target.value)} className={styles.statusSelect} style={{ minWidth: '150px' }}>
                                    <option value="All">All Statuses</option>
                                    <option value="Onboarding">Onboarding</option>
                                    <option value="Permanent">Permanent</option>
                                    <option value="Temporary">Temporary</option>
                                    <option value="Terminated">Terminated</option>
                                </select>
                                <select value={staffRoleFilter} onChange={e => setStaffRoleFilter(e.target.value)} className={styles.statusSelect} style={{ minWidth: '150px' }}>
                                    <option value="All">All Roles</option>
                                    <option value="Chef">Chef / Cook</option>
                                    <option value="Cashier">Cashier</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Waiter">Waiter</option>
                                    <option value="Delivery">Delivery Boy</option>
                                    <option value="Helper">Kitchen Helper</option>
                                    <option value="Other">Other</option>
                                </select>
                                <select value={staffOutletFilter} onChange={e => setStaffOutletFilter(e.target.value)} className={styles.statusSelect} style={{ minWidth: '160px' }}>
                                    <option value="All">All Outlets</option>
                                    <option value="Head Office">Head Office</option>
                                    {runningFranchises.map(outlet => (
                                        <option key={outlet.id} value={outlet.outletName}>{outlet.outletName}</option>
                                    ))}
                                </select>

                                {/* Sub-Tabs Switchers */}
                                <div className={styles.hrSubTabs} style={{ display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                                    <button type="button" className={`${styles.hrSubTabBtn} ${selectedHrTab === 'personal' ? styles.hrSubTabBtnActive : ''}`} onClick={() => setSelectedHrTab('personal')} style={{ border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Personal Info</button>
                                    <button type="button" className={`${styles.hrSubTabBtn} ${selectedHrTab === 'contact' ? styles.hrSubTabBtnActive : ''}`} onClick={() => setSelectedHrTab('contact')} style={{ border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Contact & Address</button>
                                    <button type="button" className={`${styles.hrSubTabBtn} ${selectedHrTab === 'salary' ? styles.hrSubTabBtnActive : ''}`} onClick={() => setSelectedHrTab('salary')} style={{ border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Bank & Salary</button>
                                    <button type="button" className={`${styles.hrSubTabBtn} ${selectedHrTab === 'compliance' ? styles.hrSubTabBtnActive : ''}`} onClick={() => setSelectedHrTab('compliance')} style={{ border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Compliance Checklist</button>
                                    <button type="button" className={`${styles.hrSubTabBtn} ${selectedHrTab === 'exit' ? styles.hrSubTabBtnActive : ''}`} onClick={() => setSelectedHrTab('exit')} style={{ border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Exit & Separation Logs</button>
                                    <button type="button" className={`${styles.hrSubTabBtn} ${selectedHrTab === 'reports' ? styles.hrSubTabBtnActive : ''}`} onClick={() => setSelectedHrTab('reports')} style={{ border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>📈 Analytics & Reports</button>
                                </div>
                            </div>
 
                            {/* Staff Table Card / Reports Analytics Dashboard */}
                            {selectedHrTab === 'reports' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                                    {/* Analytics stats widgets */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '15px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <span style={{ fontSize: '1.75rem' }}>🖼️</span>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginTop: '0.5rem' }}>Average KPI Rating</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', marginTop: '0.25rem' }}>
                                                {(() => {
                                                    const withRating = allHistoricalPayroll.filter(r => r.kpiRating !== undefined);
                                                    if (withRating.length === 0) return '5.0 / 5';
                                                    const avg = withRating.reduce((acc, curr) => acc + parseInt(curr.kpiRating), 0) / withRating.length;
                                                    return `${avg.toFixed(1)} / 5`;
                                                })()}
                                            </div>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '15px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <span style={{ fontSize: '1.75rem' }}>🖼️</span>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginTop: '0.5rem' }}>Total Leaves Taken</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ef4444', marginTop: '0.25rem' }}>
                                                {allHistoricalPayroll.reduce((acc, curr) => acc + (parseInt(curr.leavesTaken) || 0), 0)} Days
                                            </div>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '15px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <span style={{ fontSize: '1.75rem' }}>🖼️</span>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginTop: '0.5rem' }}>Salary Hikes Logged</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981', marginTop: '0.25rem' }}>
                                                {staffList.reduce((acc, curr) => acc + (curr.salaryHistory ? curr.salaryHistory.length - 1 : 0), 0)} Processed
                                            </div>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '15px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <span style={{ fontSize: '1.75rem' }}>🖼️</span>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginTop: '0.5rem' }}>Total Disbursed</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#6366f1', marginTop: '0.25rem' }}>
                                                ₹{allHistoricalPayroll.reduce((acc, curr) => acc + (parseFloat(curr.netSalaryPaid) || 0), 0).toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reports Analytics Table */}
                                    <div className={styles.card} style={{ padding: '0', overflowX: 'auto', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                        <table className={styles.hrTable} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                    <th style={{ padding: '1rem 1.5rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Employee</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Current Salary</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Salary Growth</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>Hikes count</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>Total Leaves</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>Avg KPI Rating</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>Roster Compliance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredStaff.map(staff => {
                                                    const history = allHistoricalPayroll.filter(r => r.staffId === staff.id);
                                                    const leavesCount = history.reduce((acc, curr) => acc + (parseInt(curr.leavesTaken) || 0), 0);
                                                    const ratedMonths = history.filter(r => r.kpiRating !== undefined);
                                                    const avgRating = ratedMonths.length > 0 
                                                        ? (ratedMonths.reduce((acc, curr) => acc + parseInt(curr.kpiRating), 0) / ratedMonths.length).toFixed(1)
                                                        : '5.0';

                                                    const initialSalary = staff.salaryHistory && staff.salaryHistory.length > 0
                                                        ? parseFloat(staff.salaryHistory[0].amount) || 0
                                                        : parseFloat(staff.salary) || 0;
                                                    const currentSalary = parseFloat(staff.salary) || 0;
                                                    const growthPct = initialSalary > 0 
                                                        ? ((currentSalary - initialSalary) / initialSalary) * 100
                                                        : 0;

                                                    const complianceCount = (staff.aadhaarCollected ? 1 : 0) + (staff.panCollected ? 1 : 0) + (staff.medicalCollected ? 1 : 0);

                                                    return (
                                                        <tr key={staff.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td 
                                                                style={{ padding: '1rem 1.5rem', cursor: 'pointer' }}
                                                                onClick={() => setSelectedDetailStaff(staff)}
                                                                title="Click to view full profile report summary"
                                                                onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                <div style={{ fontWeight: 'bold', color: '#009ceb', textDecoration: 'underline' }}>{staff.fullName} 🔎</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{staff.position} • {staff.assignedOutlet || 'Head Office'}</div>
                                                            </td>
                                                            <td style={{ padding: '1rem', fontWeight: 'bold', color: '#1e293b' }}>
                                                                ₹{currentSalary.toLocaleString('en-IN')}
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>
                                                                {growthPct > 0 ? (
                                                                    <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                                        📈 +{growthPct.toFixed(0)}%
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>0% (Base Setup)</span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: '#475569' }}>
                                                                {staff.salaryHistory ? staff.salaryHistory.length - 1 : 0}
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: '#ef4444' }}>
                                                                {leavesCount} Days
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#fffbeb', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                                    ⭐ {avgRating}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                {complianceCount === 3 ? (
                                                                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>100% OK</span>
                                                                ) : (
                                                                    <span style={{ background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>{((complianceCount/3)*100).toFixed(0)}% Complete</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.card} style={{ padding: '0', overflowX: 'auto', borderRadius: '20px' }}>
                                    <table className={styles.hrTable} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            <th style={{ padding: '1rem 1.5rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', minWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Full Name</th>
                                            {selectedHrTab === 'personal' && (
                                                <>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Nickname</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Assigned Outlet</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Gender</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Date of Birth</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Blood Group</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Status</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Salary (INR)</th>
                                                </>
                                            )}
                                            {selectedHrTab === 'exit' && (
                                                <>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Status</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Exit Date</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Separation Reason</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Exit Notes & Handover</th>
                                                </>
                                            )}
                                            {selectedHrTab === 'contact' && (
                                                <>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Mobile No.</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Email ID</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Current Address</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Permanent Address</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Emergency Contact</th>
                                                </>
                                            )}
                                            {selectedHrTab === 'salary' && (
                                                <>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Bank Name</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Account Number</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>IFSC Code</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Basic Salary</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>KPI Incentive</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Join Date</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Term. Date</th>
                                                </>
                                            )}
                                            {selectedHrTab === 'compliance' && (
                                                <>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', width: '55%' }}>Compliance & Roster Documents</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', width: '25%' }}>Quick Upload</th>
                                                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', width: '20%' }}>Verification Status</th>
                                                </>
                                            )}
                                            <th style={{ padding: '1rem 1.5rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStaff.length > 0 ? (
                                            filteredStaff.map((staff) => {
                                                const totalDocCount = (staff.aadhaarCollected ? 1 : 0) + (staff.panCollected ? 1 : 0) + (staff.medicalCollected ? 1 : 0);
                                                const hasBankDetails = staff.bankName && staff.accountNumber;
                                                return (
                                                    <tr key={staff.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        {/* Common Column: Full Name */}
                                                        <td 
                                                            style={{ padding: '1rem 1.5rem', cursor: 'pointer', minWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                            onClick={() => setSelectedDetailStaff(staff)}
                                                            title="Click to view full profile report summary"
                                                            onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <div style={{ fontWeight: 'bold', color: '#009ceb', textDecoration: 'underline' }}>{staff.fullName} 🔎</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                                                                {staff.dob ? `Born ${staff.dob}` : 'DOB not set'} • {staff.position}
                                                            </div>
                                                        </td>

                                                        {/* View 1: Personal Info */}
                                                        {selectedHrTab === 'personal' && (
                                                            <>
                                                                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem' }}>{staff.nickname || '-'}</td>
                                                                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem', fontWeight: '500' }}>
                                                                    {staff.assignedOutlet ? (
                                                                        <span style={{ color: '#009ceb', fontWeight: 'bold' }}>📍 {staff.assignedOutlet}</span>
                                                                    ) : (
                                                                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Head Office / Unassigned</span>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem' }}>{staff.gender}</td>
                                                                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem' }}>{staff.dob || '-'}</td>
                                                                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem' }}>
                                                                    {staff.bloodGroup ? (
                                                                        <span style={{ background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{staff.bloodGroup}</span>
                                                                    ) : '-'}
                                                                </td>
                                                                <td style={{ padding: '1rem' }}>
                                                                    <select 
                                                                        value={staff.status || 'Permanent'}
                                                                        onChange={async (e) => {
                                                                            const newStatus = e.target.value;
                                                                            if (newStatus === 'Terminated') {
                                                                                setTermModalDate(new Date().toISOString().split('T')[0]);
                                                                                setTermModalReason('Resigned');
                                                                                setTermModalNotes('');
                                                                                setTermModal({ staff, newStatus });
                                                                                return;
                                                                            } else {
                                                                                const updates = { status: newStatus, termDate: '', termReason: '', termNotes: '' };
                                                                                await db.updateStaff(staff.id, updates);
                                                                                setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, ...updates } : s));
                                                                                showToast(`Employee status updated to ${newStatus}.`);
                                                                            }
                                                                        }}
                                                                        style={{ 
                                                                            padding: '4px 10px', 
                                                                            borderRadius: '20px', 
                                                                            fontSize: '0.75rem', 
                                                                            fontWeight: 'bold', 
                                                                            border: '1px solid #cbd5e1',
                                                                            cursor: 'pointer',
                                                                            outline: 'none',
                                                                            background: staff.status === 'Terminated' ? '#fee2e2' : staff.status === 'Permanent' ? '#e0f2fe' : staff.status === 'Onboarding' ? '#fff3cd' : '#f1f5f9',
                                                                            color: staff.status === 'Terminated' ? '#ef4444' : staff.status === 'Permanent' ? '#0369a1' : staff.status === 'Onboarding' ? '#b45309' : '#475569'
                                                                        }}
                                                                    >
                                                                        <option value="Onboarding">Onboarding</option>
                                                                        <option value="Permanent">Permanent</option>
                                                                        <option value="Temporary">Temporary</option>
                                                                        <option value="Terminated">Terminated</option>
                                                                    </select>
                                                                </td>
                                                                <td style={{ padding: '1rem', color: '#1e293b', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                                    ₹{(parseFloat(staff.salary) || 0).toLocaleString('en-IN')}
                                                                </td>
                                                            </>
                                                        )}

                                                        {/* View 2: Contact Info */}
                                                        {selectedHrTab === 'contact' && (
                                                            <>
                                                                <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#475569' }}>
                                                                    <div>{staff.phone}</div>
                                                                    {staff.alternatePhone && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Alt: {staff.alternatePhone}</div>}
                                                                </td>
                                                                <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#475569' }}>{staff.email || '-'}</td>
                                                                <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#475569', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{staff.currentAddress || '-'}</td>
                                                                <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#475569', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{staff.permanentAddress || '-'}</td>
                                                                <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#475569' }}>
                                                                    <div>{staff.emergencyContact || '-'}</div>
                                                                    {staff.emergencyPhone && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{staff.emergencyPhone}</div>}
                                                                </td>
                                                            </>
                                                        )}

                                                        {/* View 3: Salary Info */}
                                                        {selectedHrTab === 'salary' && (
                                                            <>
                                                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                                                    {hasBankDetails ? <span style={{ color: '#475569' }}>{staff.bankName}</span> : <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold' }}>âš ï¸ Missing Bank Details</span>}
                                                                </td>
                                                                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem' }}>{staff.accountNumber || '-'}</td>
                                                                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem' }}>{staff.ifscCode || '-'}</td>
                                                                <td style={{ padding: '1rem', color: '#1e293b', fontSize: '0.9rem' }}>
                                                                    <div style={{ fontWeight: 'bold' }}>₹{(parseFloat(staff.salary) || 0).toLocaleString('en-IN')}</div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setHikeStaff(staff);
                                                                            setHikeAmount(staff.salary || '');
                                                                        }}
                                                                        style={{
                                                                            background: '#e0f2fe',
                                                                            color: '#0369a1',
                                                                            border: 'none',
                                                                            padding: '4px 8px',
                                                                            borderRadius: '6px',
                                                                            fontSize: '0.7rem',
                                                                            fontWeight: 'bold',
                                                                            cursor: 'pointer',
                                                                            marginTop: '4px',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '3px'
                                                                        }}
                                                                    >
                                                                        📈 Hike / Adjust
                                                                    </button>
                                                                </td>
                                                                <td style={{ padding: '1rem', color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                                    {staff.incentive ? `₹${parseFloat(staff.incentive).toLocaleString('en-IN')}` : '-'}
                                                                </td>
                                                                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem' }}>{staff.joinDate || '-'}</td>
                                                                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem' }}>{staff.termDate || '-'}</td>
                                                            </>
                                                        )}

                                                        {/* View 5: Exit & Separation Logs */}
                                                        {selectedHrTab === 'exit' && (
                                                            <>
                                                                <td style={{ padding: '1rem' }}>
                                                                    <select 
                                                                        value={staff.status || 'Permanent'}
                                                                        onChange={async (e) => {
                                                                            const newStatus = e.target.value;
                                                                            if (newStatus === 'Terminated') {
                                                                                setTermModalDate(new Date().toISOString().split('T')[0]);
                                                                                setTermModalReason('Resigned');
                                                                                setTermModalNotes('');
                                                                                setTermModal({ staff, newStatus });
                                                                                return;
                                                                            } else {
                                                                                const updates = { status: newStatus, termDate: '', termReason: '', termNotes: '' };
                                                                                await db.updateStaff(staff.id, updates);
                                                                                setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, ...updates } : s));
                                                                                showToast(`Employee status updated to ${newStatus}.`);
                                                                            }
                                                                        }}
                                                                        style={{ 
                                                                            padding: '4px 10px', 
                                                                            borderRadius: '20px', 
                                                                            fontSize: '0.75rem', 
                                                                            fontWeight: 'bold', 
                                                                            border: '1px solid #cbd5e1',
                                                                            cursor: 'pointer',
                                                                            outline: 'none',
                                                                            background: staff.status === 'Terminated' ? '#fee2e2' : staff.status === 'Permanent' ? '#e0f2fe' : staff.status === 'Part-time' ? '#fef9c3' : staff.status === 'Daily Wage' ? '#fef3c7' : '#f1f5f9',
                                                                            color: staff.status === 'Terminated' ? '#ef4444' : staff.status === 'Permanent' ? '#0369a1' : staff.status === 'Part-time' ? '#ca8a04' : staff.status === 'Daily Wage' ? '#d97706' : '#475569'
                                                                        }}
                                                                    >
                                                                        <option value="Permanent">Permanent</option>
                                                                        <option value="Temporary">Temporary</option>
                                                                        <option value="Part-time">Part-time</option>
                                                                        <option value="Daily Wage">Daily Wage</option>
                                                                        <option value="Terminated">Terminated</option>
                                                                    </select>
                                                                </td>
                                                                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                                    {staff.status === 'Terminated' ? (staff.termDate || 'Not set') : '-'}
                                                                </td>
                                                                <td style={{ padding: '1rem', color: '#ef4444', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                                    {staff.status === 'Terminated' ? (staff.termReason || 'Not specified') : '-'}
                                                                </td>
                                                                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={staff.termNotes}>
                                                                    {staff.status === 'Terminated' ? (staff.termNotes || 'No notes added') : '-'}
                                                                </td>
                                                            </>
                                                        )}

                                                        {/* View 4: Compliance Checklist */}
                                                        {selectedHrTab === 'compliance' && (() => {
                                                             const allDocs = [];
                                                             if (staff.aadhaarDocUrl) allDocs.push({ name: 'Aadhaar Card', url: staff.aadhaarDocUrl });
                                                             if (staff.resumeDocUrl) allDocs.push({ name: 'Resume', url: staff.resumeDocUrl });
                                                             if (staff.medicalDocUrl) allDocs.push({ name: 'Medical Cert', url: staff.medicalDocUrl });
                                                             
                                                             if (staff.documents && staff.documents.length > 0) {
                                                                 staff.documents.forEach(d => {
                                                                     if (!allDocs.find(x => x.url === d.url)) {
                                                                         allDocs.push(d);
                                                                     }
                                                                 });
                                                             }

                                                             const isFullyCompliant = allDocs.length >= 3;

                                                             const handleInlineDocUpload = async (e) => {
                                                                 const file = e.target.files[0];
                                                                 if (!file) return;
                                                                 const docLabel = prompt("Enter a label/title for this compliance document (e.g. Health License, Contract Agreement, Aadhaar Card):");
                                                                 if (!docLabel) return;
                                                                 setIsUploading(true);
                                                                 try {
                                                                     const url = await uploadMedia(file);
                                                                     const updatedDocs = [...(staff.documents || []), { name: docLabel, url }];
                                                                     const updates = { documents: updatedDocs };
                                                                     const lowerLabel = docLabel.toLowerCase();
                                                                     if (lowerLabel.includes('aadhaar')) {
                                                                         updates.aadhaarDocUrl = url;
                                                                         updates.aadhaarCollected = true;
                                                                     } else if (lowerLabel.includes('medical')) {
                                                                         updates.medicalDocUrl = url;
                                                                         updates.medicalCollected = true;
                                                                     } else if (lowerLabel.includes('pan')) {
                                                                         updates.panCollected = true;
                                                                     } else if (lowerLabel.includes('resume')) {
                                                                         updates.resumeDocUrl = url;
                                                                     }
                                                                     await db.updateStaff(staff.id, updates);
                                                                     setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, ...updates } : s));
                                                                     showToast("Document uploaded and saved successfully!")
                                                                 } catch (error) {
                                                                     console.error(error);
                                                                     showToast("Failed to upload: " + error.message, "error")
                                                                 } finally {
                                                                     setIsUploading(false);
                                                                 }
                                                             };

                                                             return (
                                                                 <>
                                                                     {/* Column 1: Document List */}
                                                                     <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                                                         <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                                             {allDocs.length > 0 ? (
                                                                                 allDocs.map((doc, idx) => (
                                                                                     <a
                                                                                         key={idx}
                                                                                         href={doc.url}
                                                                                         target="_blank"
                                                                                         rel="noreferrer"
                                                                                         style={{
                                                                                             background: '#e0f2fe',
                                                                                             color: '#0369a1',
                                                                                             textDecoration: 'none',
                                                                                             padding: '4px 10px',
                                                                                             borderRadius: '6px',
                                                                                             fontSize: '0.75rem',
                                                                                             fontWeight: 'bold',
                                                                                             display: 'inline-flex',
                                                                                             alignItems: 'center',
                                                                                             gap: '4px',
                                                                                             transition: 'all 0.2s'
                                                                                         }}
                                                                                         onMouseOver={e => e.target.style.background = '#bae6fd'}
                                                                                         onMouseOut={e => e.target.style.background = '#e0f2fe'}
                                                                                     >
                                                                                         📄 {doc.name} 📥
                                                                                     </a>
                                                                                 ))
                                                                             ) : (
                                                                                 <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No documents uploaded</span>
                                                                             )}
                                                                         </div>
                                                                     </td>
                                                                     
                                                                     {/* Column 2: Quick Upload Trigger */}
                                                                     <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                         <div style={{ display: 'inline-block', position: 'relative' }}>
                                                                             <button
                                                                                 type="button"
                                                                                 disabled={isUploading}
                                                                                 onClick={() => document.getElementById(`inline-upload-${staff.id}`).click()}
                                                                                 style={{
                                                                                     background: '#f1f5f9',
                                                                                     border: '1px dashed #cbd5e1',
                                                                                     padding: '4px 10px',
                                                                                     borderRadius: '6px',
                                                                                     fontSize: '0.75rem',
                                                                                     fontWeight: 'bold',
                                                                                     color: '#475569',
                                                                                     cursor: 'pointer'
                                                                                 }}
                                                                             >
                                                                                 {isUploading ? 'Uploading...' : '➕ Upload Doc'}
                                                                             </button>
                                                                             <input
                                                                                 type="file"
                                                                                 id={`inline-upload-${staff.id}`}
                                                                                 style={{ display: 'none' }}
                                                                                 onChange={handleInlineDocUpload}
                                                                             />
                                                                         </div>
                                                                     </td>

                                                                     {/* Column 3: Verification Status */}
                                                                     <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                         {isFullyCompliant ? (
                                                                             <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold' }}>Fully Compliant</span>
                                                                         ) : (
                                                                             <span style={{ background: '#fee2e2', color: '#ef4444', padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold' }}>Pending Docs ({allDocs.length}/3)</span>
                                                                         )}
                                                                     </td>
                                                                 </>
                                                             );
                                                         })()}

                                                        {/* Actions Column */}
                                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                                <button onClick={() => setEditingStaff(staff)} className={styles.editBtn} style={{ width: '30px', height: '30px' }} title="Edit Profile">
                                                                    <EditIcon />
                                                                </button>
                                                                <button onClick={() => handleDeleteStaff(staff.id)} className={styles.deleteButton} title="Delete Profile">
                                                                    <TrashIcon />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                                    No staff members found matching your search or filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            )}
                                </>
                            ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                                        {/* Search & Filters row */}
                                        <div className={styles.hrFiltersRow} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center', background: 'white', padding: '1rem', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                            <div className={styles.searchBar} style={{ flex: 1, minWidth: '250px', display: 'flex', visibility: 'visible' }}>
                                                <LoopIcon />
                                                <input type="text" placeholder="Search applicants by name or phone..." value={appSearchQuery} onChange={e => setAppSearchQuery(e.target.value)} className={styles.searchInput} />
                                            </div>
                                            <select value={appPositionFilter} onChange={e => setAppPositionFilter(e.target.value)} className={styles.statusSelect} style={{ minWidth: '160px' }}>
                                                <option value="All">All Positions</option>
                                                <option value="Waiter">Waiter / Waitress</option>
                                                <option value="Chef">Chef / Cook</option>
                                                <option value="Cashier">Cashier</option>
                                                <option value="Manager">Manager</option>
                                                <option value="Helper">Kitchen Helper</option>
                                                <option value="Delivery">Delivery Boy</option>
                                                <option value="Cleaner">Cleaner / Steward</option>
                                                <option value="Other">Other Position</option>
                                            </select>
                                        </div>

                                        {/* Table */}
                                        <div className={styles.card} style={{ padding: '0', overflowX: 'auto', borderRadius: '20px' }}>
                                            <table className={styles.hrTable} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                                                <thead>
                                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                        <th style={{ padding: '1rem 1.5rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Applicant Name</th>
                                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Applied Position</th>
                                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Phone Number</th>
                                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Age / Gender</th>
                                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Location (Native / Current)</th>
                                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Documents / CV</th>
                                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Interview Score</th>
                                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                                                        <th style={{ padding: '1rem 1.5rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(() => {
                                                        const filteredApps = workerApplications.filter(app => {
                                                            const nameMatch = (app.fullName || '').toLowerCase().includes(appSearchQuery.toLowerCase());
                                                            const phoneMatch = (app.phone || '').toLowerCase().includes(appSearchQuery.toLowerCase());
                                                            const positionMatch = appPositionFilter === 'All' || app.appliedPosition === appPositionFilter;
                                                            return (nameMatch || phoneMatch) && positionMatch;
                                                        });

                                                        if (filteredApps.length === 0) {
                                                            return (
                                                                <tr>
                                                                    <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                                                        No job applications found matching your search or filters.
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }

                                                        return filteredApps.map(app => (
                                                            <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                <td style={{ padding: '1rem 1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
                                                                    {app.fullName}
                                                                </td>
                                                                <td style={{ padding: '1rem', color: '#009ceb', fontWeight: 'bold' }}>
                                                                    {app.appliedPosition}
                                                                </td>
                                                                <td style={{ padding: '1rem', color: '#475569' }}>
                                                                    {app.phone}
                                                                </td>
                                                                <td style={{ padding: '1rem', color: '#475569' }}>
                                                                    {app.age} yrs • {app.gender}
                                                                </td>
                                                                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem' }}>
                                                                    <div>Current: {app.currentPlace}</div>
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '2px' }}>Native: {app.nativePlace}</div>
                                                                </td>
                                                                <td style={{ padding: '1rem' }}>
                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                                        {app.documents && app.documents.length > 0 ? (
                                                                            app.documents.map((doc, idx) => (
                                                                                <a key={idx} href={doc.url} target="_blank" rel="noreferrer" style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', textDecoration: 'none' }}>
                                                                                    📄 {doc.name.length > 15 ? doc.name.substring(0, 12) + '...' : doc.name}
                                                                                </a>
                                                                            ))
                                                                        ) : (
                                                                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>No Docs</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                    {app.interviewScore ? (
                                                                        <span style={{ background: '#fffbeb', color: '#b45309', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                                            ⭐ {app.interviewScore} / 10
                                                                        </span>
                                                                    ) : (
                                                                        <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>Not Rated</span>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                    <span style={{
                                                                        padding: '4px 10px',
                                                                        borderRadius: '20px',
                                                                        fontSize: '0.72rem',
                                                                        fontWeight: 'bold',
                                                                        background: app.status === 'Pending' ? '#f1f5f9' : app.status === 'Interview Scheduled' ? '#e0f2fe' : app.status === 'Not Fit' ? '#fee2e2' : app.status === 'Selected' ? '#dcfce7' : '#fef3c7',
                                                                        color: app.status === 'Pending' ? '#475569' : app.status === 'Interview Scheduled' ? '#0369a1' : app.status === 'Not Fit' ? '#ef4444' : app.status === 'Selected' ? '#15803d' : '#b45309'
                                                                    }}>
                                                                        {app.status || 'Pending'}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                                        <button onClick={() => {
                                                                            setShowInterviewModal(app);
                                                                            setSelectedApplicationStatus(app.status || 'Pending');
                                                                            setInterviewScoreInput(app.interviewScore || '');
                                                                            setInterviewNotesInput(app.interviewNotes || '');
                                                                        }} className={styles.editBtn} style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                                                                            📝 Review
                                                                        </button>
                                                                        <button onClick={() => {
                                                                            setShowJoinApprovalModal(app);
                                                                            setJoinPositionInput(app.appliedPosition || 'Waiter');
                                                                            setJoinSalaryInput('');
                                                                            setJoinOutletInput('');
                                                                        }} style={{ background: '#dcfce7', color: '#15803d', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                                                                            🤝 Onboard
                                                                        </button>
                                                                        <button onClick={async () => {
                                                                            if (window.confirm(`Are you sure you want to delete the application of ${app.fullName}?`)) {
                                                                                try {
                                                                                    await db.deleteWorkerApplication(app.id);
                                                                                    setWorkerApplications(prev => prev.filter(a => a.id !== app.id));
                                                                                    showToast("Application deleted.");
                                                                                } catch (err) {
                                                                                    showToast("Failed to delete application: " + err.message, "error");
                                                                                }
                                                                            }
                                                                        }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            <TrashIcon />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ));
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                            )}
                        </div>
                    );
                })()}

                {/* --- MONTHLY PAYROLL TAB --- */}
                {
                    activeTab === 'payroll' && (() => {
                        const activeStaff = staffList.filter(s => s.status !== 'Terminated');
                        
                        const outletFilteredStaff = activeStaff.filter(s => {
                            if (selectedPayrollOutlet === 'All') return true;
                            if (selectedPayrollOutlet === 'Head Office') return !s.assignedOutlet || s.assignedOutlet === '';
                            return s.assignedOutlet === selectedPayrollOutlet;
                        });

                        const getCalculatedNetForStaff = (s) => {
                            const basic = parseFloat(s.salary) || 0;
                            const maxIncentive = parseFloat(s.incentive) || 0;
                            const leaves = parseInt(s.leavesTaken) || 0;
                            const rating = parseInt(s.kpiRating) || 3;
                            const attRate = Math.max(0, (26 - leaves) / 26);
                            
                            let kpiMultiplier = 0.5;
                            if (rating === 5) kpiMultiplier = 1.0;
                            else if (rating === 4) kpiMultiplier = 0.8;
                            else if (rating === 3) kpiMultiplier = 0.5;
                            else if (rating === 2) kpiMultiplier = 0.2;
                            else if (rating === 1) kpiMultiplier = 0;
                            
                            const kpiBonus = maxIncentive * kpiMultiplier * attRate;
                            return (basic * attRate) + kpiBonus;
                        };

                        const totalPaidAmount = payrollRecords
                            .filter(r => outletFilteredStaff.find(s => s.id === r.staffId))
                            .reduce((sum, r) => sum + (parseFloat(r.netSalaryPaid) || 0), 0);
                        
                        const totalPaidStaffIds = payrollRecords.map(r => r.staffId);
                        
                        const totalPendingAmount = outletFilteredStaff.reduce((sum, s) => {
                            if (totalPaidStaffIds.includes(s.id)) return sum;
                            return sum + getCalculatedNetForStaff(s);
                        }, 0);

                        const paidCount = payrollRecords.filter(r => outletFilteredStaff.find(s => s.id === r.staffId)).length;

                        // ----------------------------------------------------
                        // DRILL-DOWN STEP 3: Month Payroll Details View
                        // ----------------------------------------------------
                        if (payrollActiveStaffId && payrollActiveMonth) {
                            const staff = staffList.find(s => s.id === payrollActiveStaffId);
                            if (!staff) {
                                setPayrollActiveStaffId(null);
                                setPayrollActiveMonth(null);
                                return null;
                            }

                            const basic = parseFloat(staff.salary) || 0;
                            const maxIncentive = parseFloat(staff.incentive) || 0;
                            const unpaid = parseFloat(payrollDraft.unpaidLeaves) || 0;
                            const half = parseFloat(payrollDraft.halfDays) || 0;
                            const workingDays = parseFloat(payrollDraft.workingDays) || 26;
                            
                            const presentDays = workingDays - unpaid - (half * 0.5);
                            const attPercent = ((presentDays / workingDays) * 100).toFixed(1);
                            
                            const rating = parseInt(payrollDraft.kpiRating) || 5;
                            let kpiMultiplier = 0.5;
                            if (rating === 5) kpiMultiplier = 1.0;
                            else if (rating === 4) kpiMultiplier = 0.8;
                            else if (rating === 3) kpiMultiplier = 0.5;
                            else if (rating === 2) kpiMultiplier = 0.2;
                            else if (rating === 1) kpiMultiplier = 0;

                            const attRate = Math.max(0, presentDays / workingDays);
                            const overrideKpi = !!payrollDraft.overrideKpiBonus;
                            const customKpi = parseFloat(payrollDraft.customKpiBonus) || 0;
                            const kpiBonus = overrideKpi ? customKpi : (maxIncentive * kpiMultiplier * attRate);
                            const attDeduction = (basic * (unpaid + half * 0.5)) / workingDays;
                            
                            const overtime = parseFloat(payrollDraft.overtime) || 0;
                            const advance = parseFloat(payrollDraft.advanceRecovery) || 0;
                            const other = parseFloat(payrollDraft.otherDeductions) || 0;
                            
                            const calculatedNet = (basic - attDeduction) + kpiBonus + overtime - advance - other;

                            const monthNames = {
                                '2026-08': 'August 2026',
                                '2026-07': 'July 2026',
                                '2026-06': 'June 2026',
                                '2026-05': 'May 2026',
                                '2026-04': 'April 2026',
                                '2026-03': 'March 2026'
                            };
                            const friendlyMonth = monthNames[payrollActiveMonth] || payrollActiveMonth;

                            return (
                                <div className={styles.tabContent} style={{ width: '100%' }}>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                                        <div>
                                            <button 
                                                onClick={() => setPayrollActiveMonth(null)} 
                                                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#475569' }}
                                            >
                                                ⬅ Back to Profile
                                            </button>
                                            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', margin: '0.75rem 0 0 0' }}>
                                                {friendlyMonth} Payroll Details: {staff.fullName}
                                            </h2>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button 
                                                onClick={() => {
                                                    const win = window.open("", "_blank");
                                                    win.document.write(`
                                                        <html>
                                                        <head>
                                                            <title>Salary Slip - ${staff.fullName}</title>
                                                            <style>
                                                                body { font-family: system-ui, sans-serif; padding: 2rem; color: #1e293b; }
                                                                .header { border-bottom: 2px solid #009ceb; padding-bottom: 1rem; margin-bottom: 1.5rem; }
                                                                .title { font-size: 1.5rem; font-weight: bold; margin: 0; color: #009ceb; }
                                                                .subtitle { color: #64748b; font-size: 0.9rem; margin-top: 4px; }
                                                                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
                                                                .label { font-weight: bold; color: #475569; }
                                                                table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
                                                                th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
                                                                th { background: #f8fafc; }
                                                                .net { font-size: 1.25rem; font-weight: bold; background: #e0f2fe; color: #0369a1; }
                                                                .footer { margin-top: 3rem; display: flex; justify-content: space-between; font-size: 0.9rem; color: #64748b; }
                                                                .sig { border-top: 1px dashed #cbd5e1; width: 200px; text-align: center; padding-top: 8px; margin-top: 2rem; }
                                                                @media print { .no-print { display: none; } }
                                                            </style>
                                                        </head>
                                                        <body>
                                                            <div class="header">
                                                                <h1 class="title">HIGH LABAN</h1>
                                                                <div class="subtitle">EGYPTIAN DESSERTS CAFE & FOODS</div>
                                                                <h2 style="margin: 10px 0 0 0; font-size: 1.2rem;">Salary Payslip - ${friendlyMonth}</h2>
                                                            </div>
                                                            <div class="grid">
                                                                <div>
                                                                    <div style="margin-bottom: 4px;"><span class="label">Employee Name:</span> ${staff.fullName}</div>
                                                                    <div style="margin-bottom: 4px;"><span class="label">Designation:</span> ${staff.position}</div>
                                                                    <div style="margin-bottom: 4px;"><span class="label">Assigned Outlet:</span> ${staff.assignedOutlet || 'Head Office'}</div>
                                                                </div>
                                                                <div>
                                                                    <div style="margin-bottom: 4px;"><span class="label">Total Working Days:</span> ${workingDays}</div>
                                                                    <div style="margin-bottom: 4px;"><span class="label">Present Days:</span> ${presentDays}</div>
                                                                    <div style="margin-bottom: 4px;"><span class="label">Attendance rate:</span> ${attPercent}%</div>
                                                                </div>
                                                            </div>
                                                            <table>
                                                                <thead>
                                                                    <tr>
                                                                        <th>Earnings Description</th>
                                                                        <th>Amount (₹)</th>
                                                                        <th>Deductions Description</th>
                                                                        <th>Amount (₹)</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr>
                                                                        <td>Basic Salary (Fixed)</td>
                                                                        <td>₹${basic.toLocaleString('en-IN')}</td>
                                                                        <td>Attendance Deduction</td>
                                                                        <td>₹${attDeduction.toFixed(0)}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>KPI Bonus Incentive</td>
                                                                        <td>₹${kpiBonus.toFixed(0)}</td>
                                                                        <td>Advance Recovery</td>
                                                                        <td>₹${advance.toLocaleString('en-IN')}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>Overtime Allowance</td>
                                                                        <td>₹${overtime.toLocaleString('en-IN')}</td>
                                                                        <td>Other Deductions</td>
                                                                        <td>₹${other.toLocaleString('en-IN')}</td>
                                                                    </tr>
                                                                    <tr class="net">
                                                                        <td>Total Earnings</td>
                                                                        <td>₹${(basic + kpiBonus + overtime).toFixed(0)}</td>
                                                                        <td>Net Payable Salary</td>
                                                                        <td>₹${calculatedNet.toFixed(0)}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                            <div style="margin-top: 1rem;">
                                                                <strong>Payment Details:</strong> Status: ${payrollDraft.isPaid ? 'Paid ✅' : 'Pending Payment ⏳'}<br/>
                                                                ${payrollDraft.isPaid ? `Payment Method: ${payrollDraft.paymentMethod || 'Bank Transfer'}<br/>Transaction ID: ${payrollDraft.transactionId || 'N/A'}` : ''}
                                                            </div>
                                                            <div class="footer">
                                                                <div class="sig">Employee Signature</div>
                                                                <div class="sig">Authorized Signatory</div>
                                                            </div>
                                                            <button onclick="window.print()" class="no-print" style="margin-top: 2rem; padding: 10px 20px; background: #009ceb; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Print payslip</button>
                                                        </body>
                                                        </html>
                                                    `);
                                                }}
                                                className={styles.exportBtn}
                                                style={{ background: '#009ceb', color: 'white', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                            >
                                                📄 Generate Salary Slip
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                                        
                                        <div>
                                            <div className={styles.card} style={{ border: '1px solid #e2e8f0', boxShadow: 'none', padding: '1.25rem', marginBottom: '1.25rem' }}>
                                                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.5px' }}>
                                                    📅 Roster & Attendance Setup
                                                </h3>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                                                    <div className={styles.formGroup}>
                                                        <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Working Days</label>
                                                        <input 
                                                            type="number" 
                                                            value={payrollDraft.workingDays} 
                                                            disabled={payrollDraft.isPaid}
                                                            onChange={e => setPayrollDraft({ ...payrollDraft, workingDays: e.target.value })} 
                                                            className={styles.input} 
                                                        />
                                                    </div>
                                                    <div className={styles.formGroup}>
                                                        <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Weekly Offs</label>
                                                        <input 
                                                            type="number" 
                                                            value={payrollDraft.weeklyOff} 
                                                            disabled={payrollDraft.isPaid}
                                                            onChange={e => setPayrollDraft({ ...payrollDraft, weeklyOff: e.target.value })} 
                                                            className={styles.input} 
                                                        />
                                                    </div>
                                                    <div className={styles.formGroup}>
                                                        <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Paid Leave</label>
                                                        <input 
                                                            type="number" 
                                                            value={payrollDraft.paidLeave} 
                                                            disabled={payrollDraft.isPaid}
                                                            onChange={e => setPayrollDraft({ ...payrollDraft, paidLeave: e.target.value })} 
                                                            className={styles.input} 
                                                        />
                                                    </div>
                                                    <div className={styles.formGroup}>
                                                        <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Unpaid Leaves</label>
                                                        <input 
                                                            type="number" 
                                                            value={payrollDraft.unpaidLeaves} 
                                                            disabled={payrollDraft.isPaid}
                                                            onChange={e => setPayrollDraft({ ...payrollDraft, unpaidLeaves: e.target.value })} 
                                                            className={styles.input} 
                                                        />
                                                    </div>
                                                    <div className={styles.formGroup}>
                                                        <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Half Days</label>
                                                        <input 
                                                            type="number" 
                                                            value={payrollDraft.halfDays} 
                                                            disabled={payrollDraft.isPaid}
                                                            onChange={e => setPayrollDraft({ ...payrollDraft, halfDays: e.target.value })} 
                                                            className={styles.input} 
                                                        />
                                                    </div>
                                                </div>

                                                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                    <span>Present Ratio: <strong>{presentDays} / {workingDays} Days</strong></span>
                                                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>Attendance %: {attPercent}%</span>
                                                </div>
                                            </div>

                                            <div className={styles.card} style={{ border: '1px solid #e2e8f0', boxShadow: 'none', padding: '1.25rem', marginBottom: '1.25rem' }}>
                                                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.5px' }}>
                                                    ⭐ KPI Bonus Rating
                                                </h3>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Max KPI Bonus potential</span>
                                                        <strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>₹{maxIncentive.toLocaleString('en-IN')}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', textAlign: 'right' }}>KPI Rating</span>
                                                        {payrollDraft.isPaid ? (
                                                            <div style={{ color: '#eab308', fontSize: '1.2rem', marginTop: '4px' }}>
                                                                {Array.from({ length: 5 }).map((_, i) => (
                                                                    <span key={i}>{i < rating ? '★' : '☆'}</span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <select 
                                                                value={payrollDraft.kpiRating} 
                                                                onChange={e => setPayrollDraft({ ...payrollDraft, kpiRating: e.target.value })}
                                                                className={styles.statusSelect}
                                                                style={{ margin: 0 }}
                                                                disabled={!!payrollDraft.overrideKpiBonus}
                                                            >
                                                                <option value="5">⭐⭐⭐⭐⭐ (100%)</option>
                                                                <option value="4">⭐⭐⭐⭐☆ (80%)</option>
                                                                <option value="3">⭐⭐⭐☆☆ (50%)</option>
                                                                <option value="2">⭐⭐☆☆☆ (20%)</option>
                                                                <option value="1">⭐☆☆☆☆ (0%)</option>
                                                            </select>
                                                        )}
                                                    </div>
                                                </div>

                                                {!payrollDraft.isPaid && (
                                                    <div style={{ marginTop: '1rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.8rem' }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569', cursor: 'pointer', fontWeight: 'bold' }}>
                                                            <input 
                                                                type="checkbox"
                                                                checked={!!payrollDraft.overrideKpiBonus}
                                                                onChange={e => setPayrollDraft({ ...payrollDraft, overrideKpiBonus: e.target.checked })}
                                                            />
                                                            Override with custom KPI Bonus amount
                                                        </label>

                                                        {!!payrollDraft.overrideKpiBonus && (
                                                            <div className={styles.formGroup} style={{ marginTop: '0.5rem' }}>
                                                                <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Custom KPI Bonus (₹)</label>
                                                                <input 
                                                                    type="number"
                                                                    value={payrollDraft.customKpiBonus}
                                                                    onChange={e => setPayrollDraft({ ...payrollDraft, customKpiBonus: e.target.value })}
                                                                    className={styles.input}
                                                                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#fefbeb', border: '1px solid #fef3c7', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginTop: '1rem' }}>
                                                    <span style={{ color: '#d97706' }}>
                                                        {overrideKpi ? 'Status: Custom Overridden' : `Multiplier: ${(kpiMultiplier * 100).toFixed(0)}%`}
                                                    </span>
                                                    <span style={{ color: '#b45309', fontWeight: 'bold' }}>Earned Bonus: ₹{kpiBonus.toFixed(0)}</span>
                                                </div>
                                            </div>

                                            <div className={styles.card} style={{ border: '1px solid #e2e8f0', boxShadow: 'none', padding: '1.25rem' }}>
                                                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', marginBottom: '1.2rem', letterSpacing: '0.5px' }}>
                                                    🧾 Payout Ledger Details
                                                </h3>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px' }}>
                                                        <span style={{ color: '#64748b' }}>Basic Fixed Salary</span>
                                                        <strong style={{ color: '#1e293b' }}>₹{basic.toLocaleString('en-IN')}</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px' }}>
                                                        <span style={{ color: '#ef4444' }}>Attendance Deduction</span>
                                                        <strong style={{ color: '#ef4444' }}>- ₹{attDeduction.toFixed(0)}</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px' }}>
                                                        <span style={{ color: '#10b981' }}>KPI Performance Bonus</span>
                                                        <strong style={{ color: '#10b981' }}>+ ₹{kpiBonus.toFixed(0)}</strong>
                                                    </div>
                                                    
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', margin: '0.25rem 0' }}>
                                                        <div className={styles.formGroup}>
                                                            <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Overtime</label>
                                                            <input 
                                                                type="number" 
                                                                value={payrollDraft.overtime} 
                                                                disabled={payrollDraft.isPaid}
                                                                onChange={e => setPayrollDraft({ ...payrollDraft, overtime: e.target.value })} 
                                                                className={styles.input} 
                                                                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                                            />
                                                        </div>
                                                        <div className={styles.formGroup}>
                                                            <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Advance Recovery</label>
                                                            <input 
                                                                type="number" 
                                                                value={payrollDraft.advanceRecovery} 
                                                                disabled={payrollDraft.isPaid}
                                                                onChange={e => setPayrollDraft({ ...payrollDraft, advanceRecovery: e.target.value })} 
                                                                className={styles.input} 
                                                                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                                            />
                                                        </div>
                                                        <div className={styles.formGroup}>
                                                            <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Other Deductions</label>
                                                            <input 
                                                                type="number" 
                                                                value={payrollDraft.otherDeductions} 
                                                                disabled={payrollDraft.isPaid}
                                                                onChange={e => setPayrollDraft({ ...payrollDraft, otherDeductions: e.target.value })} 
                                                                className={styles.input} 
                                                                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0284c7', padding: '12px', borderRadius: '10px', color: 'white', marginTop: '0.5rem' }}>
                                                        <span style={{ fontWeight: 'bold' }}>Net Salary Payable</span>
                                                        <strong style={{ fontSize: '1.25rem' }}>₹{calculatedNet.toFixed(0)}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                            
                                            <div className={styles.card} style={{ border: '1px solid #e2e8f0', boxShadow: 'none', padding: '1.25rem', background: payrollDraft.isPaid ? '#f0fdf4' : '#fffbeb' }}>
                                                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.5px' }}>
                                                    🏦 Payment processing status
                                                </h3>
                                                {payrollDraft.isPaid ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                                                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', width: 'fit-content' }}>✅ Paid</span>
                                                        <div><strong>Method:</strong> {payrollDraft.paymentMethod}</div>
                                                        <div><strong>Ref / TXN ID:</strong> {payrollDraft.transactionId || 'N/A'}</div>
                                                        <div><strong>Processed By:</strong> {payrollDraft.processedBy || 'Admin'}</div>
                                                        <div><strong>Remarks:</strong> {payrollDraft.remarks}</div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                        <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', width: 'fit-content' }}>⏳ Pending</span>
                                                        
                                                        <div className={styles.formGroup} style={{ margin: 0 }}>
                                                            <label>Payment Method</label>
                                                            <select 
                                                                value={payrollDraft.paymentMethod} 
                                                                onChange={e => setPayrollDraft({ ...payrollDraft, paymentMethod: e.target.value })} 
                                                                className={styles.input}
                                                            >
                                                                <option value="Bank Transfer">Bank Transfer</option>
                                                                <option value="UPI Pay">UPI (GPay / PhonePe / Paytm)</option>
                                                                <option value="Cash Payment">Cash Payment</option>
                                                                <option value="Cheque">Cheque Pay</option>
                                                            </select>
                                                        </div>

                                                        <div className={styles.formGroup} style={{ margin: 0 }}>
                                                            <label>Transaction / Reference ID</label>
                                                            <input 
                                                                type="text" 
                                                                value={payrollDraft.transactionId} 
                                                                onChange={e => setPayrollDraft({ ...payrollDraft, transactionId: e.target.value })} 
                                                                placeholder="e.g. TXN9832470" 
                                                                className={styles.input} 
                                                            />
                                                        </div>

                                                        <div className={styles.formGroup} style={{ margin: 0 }}>
                                                            <label>Remarks</label>
                                                            <input 
                                                                type="text" 
                                                                value={payrollDraft.remarks} 
                                                                onChange={e => setPayrollDraft({ ...payrollDraft, remarks: e.target.value })} 
                                                                placeholder="Salary credited successfully." 
                                                                className={styles.input} 
                                                            />
                                                        </div>

                                                        <button 
                                                            type="button" 
                                                            onClick={() => handlePayPayrollDetails(payrollDraft.paymentMethod, payrollDraft.transactionId, payrollDraft.remarks)}
                                                            className={styles.addButton}
                                                            style={{ margin: 0, width: '100%', padding: '0.75rem' }}
                                                        >
                                                            🔒 Process Payment & Mark Paid
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className={styles.card} style={{ border: '1px solid #e2e8f0', boxShadow: 'none', padding: '1.25rem' }}>
                                                <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.5px' }}>
                                                    📄 Documents
                                                </h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <a href="#" onClick={e => { e.preventDefault(); showToast("Generated leave logs sheet") }} style={{ padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#009ceb', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                            <span>📄 Attendance Report & Leave Record</span>
                                                            <span>📥 View</span>
                                                        </a>
                                                        <a href="#" onClick={e => { e.preventDefault(); showToast("Generated KPI details score sheet") }} style={{ padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#009ceb', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                            <span>📊 KPI Evaluation Summary</span>
                                                            <span>📥 View</span>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.card} style={{ border: '1px solid #e2e8f0', boxShadow: 'none', padding: '1.25rem' }}>
                                                <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.5px' }}>
                                                    📈 Employee Timeline
                                                </h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '20px' }}>
                                                    <div style={{ position: 'absolute', top: '5px', bottom: '5px', left: '6px', width: '2px', background: '#e2e8f0' }}></div>
                                                    
                                                    <div style={{ position: 'relative' }}>
                                                        <div style={{ position: 'absolute', left: '-19px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Joined Company</span>
                                                        <strong style={{ fontSize: '0.8rem', color: '#334155' }}>{staff.joinDate || 'N/A'}</strong>
                                                    </div>

                                                    <div style={{ position: 'relative' }}>
                                                        <div style={{ position: 'absolute', left: '-19px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1' }}></div>
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Salary Structure Configured</span>
                                                        <strong style={{ fontSize: '0.8rem', color: '#334155' }}>Fixed: ₹{basic.toLocaleString('en-IN')}</strong>
                                                    </div>

                                                    <div style={{ position: 'relative' }}>
                                                        <div style={{ position: 'absolute', left: '-19px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: payrollDraft.isPaid ? '#10b981' : '#f59e0b' }}></div>
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>{friendlyMonth} Payroll</span>
                                                        <strong style={{ fontSize: '0.8rem', color: '#334155' }}>{payrollDraft.isPaid ? 'Salary Disbursed' : 'Awaiting Processing'}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // ----------------------------------------------------
                        // DRILL-DOWN STEP 2: Employee Profile & Monthly History
                        // ----------------------------------------------------
                        if (payrollActiveStaffId) {
                            const staff = staffList.find(s => s.id === payrollActiveStaffId);
                            if (!staff) {
                                setPayrollActiveStaffId(null);
                                return null;
                            }

                            const complianceDocs = [];
                            if (staff.aadhaarDocUrl) complianceDocs.push({ name: 'Aadhaar Card', url: staff.aadhaarDocUrl });
                            if (staff.resumeDocUrl) complianceDocs.push({ name: 'Resume File', url: staff.resumeDocUrl });
                            if (staff.medicalDocUrl) complianceDocs.push({ name: 'Medical Cert', url: staff.medicalDocUrl });
                            if (staff.documents) {
                                staff.documents.forEach(d => {
                                    if (!complianceDocs.find(x => x.url === d.url)) {
                                        complianceDocs.push(d);
                                    }
                                });
                            }

                            const targetMonths = ['2026-08', '2026-07', '2026-06', '2026-05', '2026-04', '2026-03'];

                            return (
                                <div className={styles.tabContent} style={{ width: '100%' }}>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                                        <div>
                                            <button 
                                                onClick={() => setPayrollActiveStaffId(null)} 
                                                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#475569' }}
                                            >
                                                ⬅ Back to Staff list
                                            </button>
                                            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', margin: '0.75rem 0 0 0' }}>
                                                Employee Profile: {staff.fullName}
                                            </h2>
                                        </div>
                                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {staff.position}
                                        </span>
                                    </div>

                                    {/* Profile Sub-tabs Switcher */}
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                                        <button 
                                            onClick={() => setProfileActiveSubTab('personal')} 
                                            style={{ 
                                                border: 'none', 
                                                background: 'transparent', 
                                                borderBottom: profileActiveSubTab === 'personal' ? '3px solid #009ceb' : 'none', 
                                                color: profileActiveSubTab === 'personal' ? '#009ceb' : '#64748b', 
                                                padding: '8px 16px', 
                                                cursor: 'pointer', 
                                                fontWeight: 'bold', 
                                                fontSize: '0.85rem' 
                                            }}
                                        >
                                            🧑 Personal Info
                                        </button>
                                        <button 
                                            onClick={() => setProfileActiveSubTab('salary')} 
                                            style={{ 
                                                border: 'none', 
                                                background: 'transparent', 
                                                borderBottom: profileActiveSubTab === 'salary' ? '3px solid #009ceb' : 'none', 
                                                color: profileActiveSubTab === 'salary' ? '#009ceb' : '#64748b', 
                                                padding: '8px 16px', 
                                                cursor: 'pointer', 
                                                fontWeight: 'bold', 
                                                fontSize: '0.85rem' 
                                            }}
                                        >
                                            💵 Salary & Hikes
                                        </button>
                                        <button 
                                            onClick={() => setProfileActiveSubTab('compliance')} 
                                            style={{ 
                                                border: 'none', 
                                                background: 'transparent', 
                                                borderBottom: profileActiveSubTab === 'compliance' ? '3px solid #009ceb' : 'none', 
                                                color: profileActiveSubTab === 'compliance' ? '#009ceb' : '#64748b', 
                                                padding: '8px 16px', 
                                                cursor: 'pointer', 
                                                fontWeight: 'bold', 
                                                fontSize: '0.85rem' 
                                            }}
                                        >
                                            📂 Compliance Vault
                                        </button>
                                        <button 
                                            onClick={() => setProfileActiveSubTab('history')} 
                                            style={{ 
                                                border: 'none', 
                                                background: 'transparent', 
                                                borderBottom: profileActiveSubTab === 'history' ? '3px solid #009ceb' : 'none', 
                                                color: profileActiveSubTab === 'history' ? '#009ceb' : '#64748b', 
                                                padding: '8px 16px', 
                                                cursor: 'pointer', 
                                                fontWeight: 'bold', 
                                                fontSize: '0.85rem' 
                                            }}
                                        >
                                            📅 Payroll Ledger
                                        </button>
                                    </div>

                                    <div style={{ maxWidth: '800px' }}>
                                        
                                        {profileActiveSubTab === 'personal' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                                <div className={styles.card} style={{ border: '1px solid #e2e8f0', boxShadow: 'none', padding: '1.25rem' }}>
                                                    <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                        🧑 Personal details
                                                    </h3>

                                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                                        <div style={{ width: '80px', height: '80px', borderRadius: '50px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                                            {staff.fullName.split(' ').map(n => n[0]).join('')}
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 1.5rem', flex: 1, fontSize: '0.85rem', minWidth: '250px' }}>
                                                            <div><span style={{ color: '#94a3b8' }}>Employee ID:</span> <strong style={{ color: '#334155' }}>{staff.id.substring(0, 8)}</strong></div>
                                                            <div><span style={{ color: '#94a3b8' }}>Nickname:</span> <strong style={{ color: '#334155' }}>{staff.nickname || 'N/A'}</strong></div>
                                                            <div><span style={{ color: '#94a3b8' }}>Mobile:</span> <a href={`tel:${staff.phone}`} style={{ color: '#009ceb', fontWeight: 'bold' }}>{staff.phone}</a></div>
                                                            <div><span style={{ color: '#94a3b8' }}>Email:</span> <a href={`mailto:${staff.email}`} style={{ color: '#009ceb' }}>{staff.email || 'N/A'}</a></div>
                                                            <div><span style={{ color: '#94a3b8' }}>Designation:</span> <strong style={{ color: '#334155' }}>{staff.position}</strong></div>
                                                            <div><span style={{ color: '#94a3b8' }}>Assigned Outlet:</span> <strong style={{ color: '#334155' }}>{staff.assignedOutlet || 'Head Office'}</strong></div>
                                                            <div><span style={{ color: '#94a3b8' }}>Joining Date:</span> <strong style={{ color: '#334155' }}>{staff.joinDate || 'N/A'}</strong></div>
                                                            <div><span style={{ color: '#94a3b8' }}>Employment Type:</span> <strong style={{ color: '#334155' }}>{staff.status}</strong></div>
                                                            <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#94a3b8' }}>Current Address:</span> <strong style={{ color: '#334155' }}>{staff.currentAddress || 'N/A'}</strong></div>
                                                            <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#94a3b8' }}>Emergency Contact:</span> <strong style={{ color: '#334155' }}>{staff.emergencyContact ? `${staff.emergencyContact} (${staff.emergencyPhone || ''})` : 'N/A'}</strong></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {staff.status === 'Terminated' && (
                                                    <div className={styles.card} style={{ border: '1px solid #fee2e2', background: '#fff5f5', boxShadow: 'none', padding: '1.25rem' }}>
                                                        <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.8rem', borderBottom: '1px solid #fecaca', paddingBottom: '0.5rem' }}>
                                                            🚫 Termination / Separation Record
                                                        </h3>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                                                            <div><span style={{ color: '#94a3b8' }}>Exit Date:</span> <strong style={{ color: '#ef4444' }}>{staff.termDate || 'N/A'}</strong></div>
                                                            <div><span style={{ color: '#94a3b8' }}>Reason:</span> <strong style={{ color: '#ef4444' }}>{staff.termReason || 'N/A'}</strong></div>
                                                            <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Exit Notes & Handover Remarks:</span> <div style={{ color: '#475569', background: 'white', padding: '8px', borderRadius: '6px', border: '1px solid #fecaca', whiteSpace: 'pre-wrap' }}>{staff.termNotes || 'No exit notes added.'}</div></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {profileActiveSubTab === 'salary' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                                <div className={styles.card} style={{ border: '1px solid #e2e8f0', boxShadow: 'none', padding: '1.25rem' }}>
                                                    <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                        💵 Salary Details
                                                    </h3>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 2rem', fontSize: '0.85rem' }}>
                                                        <div><span style={{ color: '#94a3b8', display: 'block' }}>Fixed Monthly Salary</span><strong style={{ fontSize: '1.1rem', color: '#10b981' }}>₹{parseFloat(staff.salary || 0).toLocaleString('en-IN')}</strong></div>
                                                        <div><span style={{ color: '#94a3b8', display: 'block' }}>Maximum KPI Bonus potential</span><strong style={{ fontSize: '1.1rem', color: '#0369a1' }}>₹{parseFloat(staff.incentive || 0).toLocaleString('en-IN')}</strong></div>
                                                        <div><span style={{ color: '#94a3b8', display: 'block' }}>Bank Name</span><strong style={{ color: '#334155' }}>{staff.bankName || 'N/A'}</strong></div>
                                                        <div><span style={{ color: '#94a3b8', display: 'block' }}>Account Number</span><strong style={{ color: '#334155' }}>{staff.accountNumber || 'N/A'}</strong></div>
                                                        <div><span style={{ color: '#94a3b8', display: 'block' }}>IFSC Code</span><strong style={{ color: '#334155' }}>{staff.ifscCode || 'N/A'}</strong></div>
                                                        <div><span style={{ color: '#94a3b8', display: 'block' }}>UPI ID</span><strong style={{ color: '#334155' }}>{staff.upiId || 'Not Configured'}</strong></div>
                                                        <div><span style={{ color: '#94a3b8', display: 'block' }}>PF / ESI Status</span><strong style={{ color: '#334155' }}>{staff.pfEsi || 'Optional / Exempted'}</strong></div>
                                                    </div>
                                                </div>

                                                <div className={styles.card} style={{ border: '1px solid #e2e8f0', boxShadow: 'none', padding: '1.25rem' }}>
                                                    <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                        📈 Salary Hike & Adjustment History
                                                    </h3>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                                                        {staff.salaryHistory && staff.salaryHistory.length > 0 ? (
                                                            staff.salaryHistory.map((h, idx) => (
                                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                    <div>
                                                                        <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>₹{parseFloat(h.amount).toLocaleString('en-IN')}</strong>
                                                                        <span style={{ color: '#64748b', marginLeft: '8px' }}>({h.reason})</span>
                                                                    </div>
                                                                    <span style={{ color: '#94a3b8', fontWeight: '500' }}>{h.date}</span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                <div>
                                                                    <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>₹{parseFloat(staff.salary || 0).toLocaleString('en-IN')}</strong>
                                                                    <span style={{ color: '#64748b', marginLeft: '8px' }}>(Initial Salary Setup)</span>
                                                                </div>
                                                                <span style={{ color: '#94a3b8', fontWeight: '500' }}>{staff.joinDate || 'N/A'}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {profileActiveSubTab === 'compliance' && (
                                            <div className={styles.card} style={{ border: '1px solid #e2e8f0', boxShadow: 'none', padding: '1.25rem' }}>
                                                <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                    📂 Compliance Documents
                                                </h3>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {complianceDocs.length > 0 ? (
                                                        complianceDocs.map((doc, index) => (
                                                            <a 
                                                                key={index} 
                                                                href={doc.url} 
                                                                target="_blank" 
                                                                rel="noreferrer" 
                                                                style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.78rem', color: '#475569', textDecoration: 'none', fontWeight: 'bold' }}
                                                            >
                                                                📄 {doc.name} 📥
                                                            </a>
                                                        ))
                                                    ) : (
                                                        <span style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.8rem' }}>No compliance documents collected yet.</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {profileActiveSubTab === 'history' && (
                                            <div className={styles.card} style={{ border: '1px solid #e2e8f0', boxShadow: 'none', padding: '1.25rem' }}>
                                                <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                    📅 Monthly Payroll History
                                                </h3>

                                                <div style={{ overflowX: 'auto' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                                        <thead>
                                                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                                                                <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#475569' }}>Month</th>
                                                                <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#475569' }}>Status</th>
                                                                <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#475569', textAlign: 'right' }}>Net Salary</th>
                                                                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {targetMonths.map(monthStr => {
                                                                const record = allHistoricalPayroll.find(r => r.staffId === staff.id && r.month === monthStr);
                                                                const isPaid = !!record;
                                                                const netSalaryVal = isPaid ? record.netSalaryPaid : getCalculatedNetForStaff(staff);
                                                                
                                                                const [y, m] = monthStr.split('-');
                                                                const d = new Date(parseInt(y), parseInt(m) - 1, 1);
                                                                const formattedMonthName = d.toLocaleDateString('default', { month: 'long', year: 'numeric' });

                                                                return (
                                                                    <tr 
                                                                        key={monthStr} 
                                                                        onClick={() => setPayrollActiveMonth(monthStr)}
                                                                        style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', transition: 'background 0.2s' }}
                                                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                                    >
                                                                        <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#1e293b' }}>{formattedMonthName}</td>
                                                                        <td style={{ padding: '12px 10px' }}>
                                                                            {isPaid ? (
                                                                                <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>Paid</span>
                                                                            ) : (
                                                                                <span style={{ background: '#fffbeb', color: '#b45309', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>Pending</span>
                                                                            )}
                                                                        </td>
                                                                        <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', color: isPaid ? '#15803d' : '#475569' }}>
                                                                            ₹{netSalaryVal.toFixed(0)}
                                                                        </td>
                                                                        <td style={{ padding: '12px 10px', textAlign: 'center', color: '#009ceb', fontWeight: 'bold' }}>View Details</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            );
                        }

                        // ----------------------------------------------------
                        // DRILL-DOWN STEP 1: Staff Directory List View (Default)
                        // ----------------------------------------------------
                        return (
                            <div className={styles.tabContent} style={{ width: '100%' }}>
                                
                                <div className={styles.catalogHeader}>
                                    <div>
                                        <h2 className={styles.sectionTitle}>HR Payroll Management</h2>
                                        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                                            Select an employee from the list below to review their full profile, update parameters, inspect historical paychecks, and process monthly payouts.
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#475569' }}>Target Month:</span>
                                        <select
                                            value={payrollMonth}
                                            onChange={e => setPayrollMonth(e.target.value)}
                                            style={{
                                                padding: '0.6rem 1rem',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '8px',
                                                fontSize: '0.9rem',
                                                fontWeight: 'bold',
                                                color: '#1e293b',
                                                background: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="2026-08">August 2026</option>
                                            <option value="2026-07">July 2026</option>
                                            <option value="2026-06">June 2026</option>
                                            <option value="2026-05">May 2026</option>
                                            <option value="2026-04">April 2026</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', marginTop: '1.5rem', alignItems: 'start' }}>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'white', padding: '1.25rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Filter by Outlet</span>
                                        
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPayrollOutlet('All')}
                                            style={{
                                                padding: '10px 14px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                background: selectedPayrollOutlet === 'All' ? '#e0f2fe' : 'transparent',
                                                color: selectedPayrollOutlet === 'All' ? '#0369a1' : '#475569',
                                                fontWeight: 'bold',
                                                fontSize: '0.85rem',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <span>🏢 All Outlets</span>
                                            <span style={{ background: selectedPayrollOutlet === 'All' ? '#cbd5e1' : '#f1f5f9', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', color: '#1e293b' }}>
                                                {activeStaff.length}
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setSelectedPayrollOutlet('Head Office')}
                                            style={{
                                                padding: '10px 14px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                background: selectedPayrollOutlet === 'Head Office' ? '#e0f2fe' : 'transparent',
                                                color: selectedPayrollOutlet === 'Head Office' ? '#0369a1' : '#475569',
                                                fontWeight: 'bold',
                                                fontSize: '0.85rem',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <span>💼 Head Office</span>
                                            <span style={{ background: selectedPayrollOutlet === 'Head Office' ? '#cbd5e1' : '#f1f5f9', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', color: '#1e293b' }}>
                                                {activeStaff.filter(s => !s.assignedOutlet || s.assignedOutlet === '').length}
                                            </span>
                                        </button>

                                        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />
                                        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Running Franchises</span>
                                        
                                        {runningFranchises.map(outlet => {
                                            const count = activeStaff.filter(s => s.assignedOutlet === outlet.outletName).length;
                                            return (
                                                <button
                                                    key={outlet.id}
                                                    type="button"
                                                    onClick={() => setSelectedPayrollOutlet(outlet.outletName)}
                                                    style={{
                                                        padding: '10px 14px',
                                                        borderRadius: '10px',
                                                        border: 'none',
                                                        background: selectedPayrollOutlet === outlet.outletName ? '#e0f2fe' : 'transparent',
                                                        color: selectedPayrollOutlet === outlet.outletName ? '#0369a1' : '#475569',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.85rem',
                                                        textAlign: 'left',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '8px' }}>🍕 {outlet.outletName.replace("High Laban - ", "")}</span>
                                                    <span style={{ background: selectedPayrollOutlet === outlet.outletName ? '#cbd5e1' : '#f1f5f9', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', color: '#1e293b' }}>
                                                        {count}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', width: '100%' }}>
                                            <div className={styles.card} style={{ border: '1px solid #e2e8f0', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem' }}>
                                                <div style={{ background: '#dcfce7', width: '48px', height: '48px', borderRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📍</div>
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Total Paid Out ({payrollMonth})</div>
                                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#15803d', marginTop: '2px' }}>₹{totalPaidAmount.toLocaleString('en-IN')}</div>
                                                </div>
                                            </div>
                                            <div className={styles.card} style={{ border: '1px solid #e2e8f0', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem' }}>
                                                <div style={{ background: '#fef3c7', width: '48px', height: '48px', borderRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📍</div>
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Pending Payout</div>
                                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#d97706', marginTop: '2px' }}>₹{totalPendingAmount.toLocaleString('en-IN')}</div>
                                                </div>
                                            </div>
                                            <div className={styles.card} style={{ border: '1px solid #e2e8f0', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem' }}>
                                                <div style={{ background: '#e0f2fe', width: '48px', height: '48px', borderRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📍</div>
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Staff Count</div>
                                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0369a1', marginTop: '2px' }}>{outletFilteredStaff.length} Employees</div>
                                                </div>
                                            </div>
                                            <div className={styles.card} style={{ border: '1px solid #e2e8f0', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem' }}>
                                                <div style={{ background: '#fae8ff', width: '48px', height: '48px', borderRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📍</div>
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Paid Count</div>
                                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#a21caf', marginTop: '2px' }}>{paidCount} / {outletFilteredStaff.length} Paid</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.card} style={{ padding: '0', overflowX: 'auto', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                                            <table className={styles.hrTable} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                <thead>
                                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                        <th style={{ padding: '1rem 1.25rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Employee</th>
                                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Fixed Salary</th>
                                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Leaves & Att.</th>
                                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>KPI Rating</th>
                                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>KPI Bonus</th>
                                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Net Payable</th>
                                                        <th style={{ padding: '1rem 1.25rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>Status / Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {outletFilteredStaff.length > 0 ? (
                                                        outletFilteredStaff.map(staff => {
                                                            const record = payrollRecords.find(r => r.staffId === staff.id);
                                                            const isPaid = !!record;
                                                            const isDailyWage = staff.status === 'Daily Wage' || staff.payType === 'Daily';
                                                            const dailyRate = parseFloat(staff.dailyRate) || 0;
                                                            const prorationFactor = isDailyWage ? 1 : getProrationFactor(staff, payrollMonth);
                                                            const basic = isDailyWage ? dailyRate : ((parseFloat(staff.salary) || 0) * prorationFactor);
                                                            const maxIncentive = isDailyWage ? 0 : ((parseFloat(staff.incentive) || 0) * prorationFactor);
                                                            const leaves = parseInt(staff.leavesTaken) || 0;
                                                            const rating = parseInt(staff.kpiRating) || 3;
                                                            const workDays = isDailyWage ? (parseInt(staff.workingDays) || 26) : Math.max(1, Math.round(26 * prorationFactor));
                                                            const presentDays = Math.max(0, workDays - leaves);
                                                            const attRate = Math.max(0, presentDays / workDays);
                                                            
                                                            let kpiMultiplier = 0.5;
                                                            if (rating === 5) kpiMultiplier = 1.0;
                                                            else if (rating === 4) kpiMultiplier = 0.8;
                                                            else if (rating === 3) kpiMultiplier = 0.5;
                                                            else if (rating === 2) kpiMultiplier = 0.2;
                                                            else if (rating === 1) kpiMultiplier = 0;
                                                            
                                                            const kpiBonus = isDailyWage ? 0 : (maxIncentive * kpiMultiplier * attRate);
                                                            const calculatedNet = isDailyWage ? (dailyRate * presentDays) : ((basic * attRate) + kpiBonus);

                                                            const displayBasic = isPaid ? (record.basicSalary || basic) : basic;
                                                            const displayLeaves = isPaid ? (record.leavesTaken || leaves) : leaves;
                                                            const displayRating = isPaid ? (record.kpiRating || rating) : rating;
                                                            const displayBonus = isPaid ? (record.kpiBonusPaid || kpiBonus) : kpiBonus;
                                                            const displayNet = isPaid ? (record.netSalaryPaid || calculatedNet) : calculatedNet;
                                                            const displayPresentDays = isPaid ? (record.presentDays || presentDays) : presentDays;

                                                            return (
                                                                <tr key={staff.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                    <td
                                                                        style={{ padding: '1rem 1.25rem', cursor: 'pointer' }}
                                                                        onClick={() => setSelectedDetailStaff(staff)}
                                                                        title="Click to view full Month-on-Month salary history & performance details"
                                                                        onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                                                                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                                    >
                                                                        <div style={{ fontWeight: 'bold', color: '#009ceb', textDecoration: 'underline' }}>{staff.fullName} 🔎</div>
                                                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <span>{staff.position}</span>
                                                                            {isDailyWage && <span style={{ background: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: '10px', fontWeight: '700', fontSize: '0.65rem' }}>DAILY WAGE</span>}
                                                                            {staff.status === 'Part-time' && <span style={{ background: '#fef9c3', color: '#ca8a04', padding: '1px 6px', borderRadius: '10px', fontWeight: '700', fontSize: '0.65rem' }}>PART-TIME</span>}
                                                                            {prorationFactor < 1 && <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '10px', fontWeight: '700', fontSize: '0.65rem' }}>PRORATED ({(prorationFactor * 100).toFixed(0)}%)</span>}
                                                                            {staff.assignedOutlet ? (
                                                                                <span style={{ color: '#009ceb', fontWeight: '500' }}>📍 {staff.assignedOutlet.replace('High Laban - ', '')}</span>
                                                                            ) : (
                                                                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Head Office</span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem' }}>
                                                                        {isDailyWage ? (
                                                                            <div>
                                                                                <div style={{ fontWeight: '700', color: '#d97706' }}>₹{dailyRate.toLocaleString('en-IN')}<span style={{ fontWeight: '400', fontSize: '0.75rem', color: '#94a3b8' }}>/day</span></div>
                                                                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{displayPresentDays} days × ₹{dailyRate}</div>
                                                                            </div>
                                                                        ) : (
                                                                            <span>₹{displayBasic.toLocaleString('en-IN')}</span>
                                                                        )}
                                                                    </td>
                                                                    <td style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem' }}>
                                                                        {isDailyWage ? (
                                                                            <div>
                                                                                <span style={{ fontWeight: 'bold', color: '#10b981' }}>{displayPresentDays} Days Present</span>
                                                                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{displayLeaves} absent</div>
                                                                            </div>
                                                                        ) : (
                                                                            <div>
                                                                                <span style={{ fontWeight: 'bold', color: displayLeaves > 0 ? '#ef4444' : '#10b981' }}>{displayLeaves} Leaves</span>
                                                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{(attRate * 100).toFixed(0)}% attendance</div>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                        {isDailyWage ? (
                                                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>N/A</span>
                                                                        ) : (
                                                                            <div>
                                                                                <div style={{ display: 'flex', justifyContent: 'center', color: '#eab308', fontSize: '1rem' }}>
                                                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                                                        <span key={i}>{i < displayRating ? '★' : '☆'}</span>
                                                                                    ))}
                                                                                </div>
                                                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Rating: {displayRating}/5</span>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td style={{ padding: '1rem', color: '#10b981', fontWeight: '600', fontSize: '0.9rem' }}>
                                                                        {isDailyWage ? <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>🖼️</span> : `₹${displayBonus.toLocaleString('en-IN')}`}
                                                                    </td>
                                                                    <td style={{ padding: '1rem', color: '#1e293b', fontWeight: '800', fontSize: '0.95rem' }}>
                                                                        ₹{displayNet.toLocaleString('en-IN')}
                                                                    </td>
                                                                    <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                                                                        {isPaid ? (
                                                                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                                <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block' }}>Paid ✅</span>
                                                                                <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '3px' }}>{record.datePaid ? new Date(record.datePaid).toLocaleDateString() : ''}</span>
                                                                            </div>
                                                                        ) : isDailyWage ? (
                                                                            <button type="button"
                                                                                onClick={() => { setDailyWageDays(String(presentDays)); setDailyWagePayModal({ staff, payData: { fullName: staff.fullName, position: staff.position, assignedOutlet: staff.assignedOutlet || 'Head Office', dailyRate, leavesTaken: leaves, kpiRating: rating, kpiBonusPaid: 0, datePaid: new Date().toISOString() } }); }}
                                                                                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>💰 Pay Daily</button>
                                                                        ) : (
                                                                            <button type="button"
                                                                                onClick={() => handlePayPayroll(staff.id, { fullName: staff.fullName, position: staff.position, assignedOutlet: staff.assignedOutlet || 'Head Office', basicSalary: basic, leavesTaken: leaves, kpiRating: rating, kpiBonusPaid: kpiBonus, netSalaryPaid: calculatedNet, datePaid: new Date().toISOString() })}
                                                                                style={{ background: '#009ceb', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', transition: 'background 0.2s' }}
                                                                                onMouseOver={e => e.target.style.background = '#007bb8'}
                                                                                onMouseOut={e => e.target.style.background = '#009ceb'}
                                                                            >Mark Paid</button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                                                No active staff profiles for this outlet filter.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* KPI Logic & Calculation Info Box */}
                                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                                            <div className={styles.card} style={{ padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: 'none', background: '#f8fafc' }}>
                                                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b', textTransform: 'uppercase', marginBottom: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    â„¹ï¸ KPI & Salary Formula
                                                </h3>
                                                <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.45' }}>
                                                    <div>
                                                        <strong>1. Attendance Rate</strong>
                                                        <div style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '4px', borderRadius: '4px', marginTop: '2px' }}>Att. % = (26 - Leaves Taken) / 26</div>
                                                    </div>
                                                    <div>
                                                        <strong>2. Daily Wage Formula</strong>
                                                        <div style={{ fontFamily: 'monospace', background: '#fef3c7', padding: '4px', borderRadius: '4px', marginTop: '2px', color: '#92400e' }}>Net = Daily Rate × Days Present</div>
                                                    </div>
                                                    <div>
                                                        <strong>3. Monthly Staff Net</strong>
                                                        <div style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '4px', borderRadius: '4px', marginTop: '2px', fontWeight: 'bold', color: '#1e293b' }}>Net = (Basic × Att. %) + KPI Bonus</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.card} style={{ padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                                                <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>Need to adjust values?</h4>
                                                <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: '1.4' }}>
                                                    Leaves, ratings, incentives, and basic salaries are tied directly to employee profile details. Head to <strong style={{ color: '#009ceb', cursor: 'pointer' }} onClick={() => setActiveTab('staff')}>🧑‍🍳 HR Staff</strong> and edit the employee profile.
                                                </p>
                                            </div>
                                        </div>

                                        {selectedDetailStaff && (
                                            <div className={styles.modalOverlay} onClick={() => setSelectedDetailStaff(null)}>
                                                <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                                                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Payroll History: {selectedDetailStaff.fullName}</h2>
                                                    <button onClick={() => setSelectedDetailStaff(null)} style={{ marginTop: '1rem' }}>Close</button>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>
                        );
                    })()
                }

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                VENDORS TAB
            â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === 'vendors' && (() => {
                const VENDOR_CATEGORIES = [
                    'Dairy & Milk', 'Eggs', 'Fruits & Vegetables', 'Dry Fruits & Nuts',
                    'Sweeteners & Flavours', 'Packaging', 'Cleaning & Supplies',
                    'Gas & Fuel', 'Equipment & Tools', 'Other'
                ];

                const filteredVendors = vendors.filter(v => {
                    if (vendorCategoryFilter !== 'All' && v.category !== vendorCategoryFilter) return false;
                    if (vendorSearchQuery && !v.name.toLowerCase().includes(vendorSearchQuery.toLowerCase()) &&
                        !(v.phone || '').includes(vendorSearchQuery)) return false;
                    return true;
                });

                const itemComparisonList = vendorItemSearch ? vendors.flatMap(v =>
                    (v.items || [])
                        .filter(it => it.itemName.toLowerCase().includes(vendorItemSearch.toLowerCase()))
                        .map(it => ({ vendorId: v.id, vendorName: v.name, phone: v.phone, category: v.category, ...it }))
                ).sort((a, b) => parseFloat(a.price) - parseFloat(b.price)) : [];

                const VendorForm = ({ data, setData, onSave, onCancel, title }) => {
                    const [isCustom, setIsCustom] = useState(
                        data.category === 'Other' || 
                        (data.category && !['Dairy & Milk', 'Eggs', 'Fruits & Vegetables', 'Dry Fruits & Nuts', 'Sweeteners & Flavours', 'Packaging', 'Cleaning & Supplies', 'Gas & Fuel', 'Equipment & Tools'].includes(data.category))
                    );
                    const addItem = () => setData(d => ({ ...d, items: [...(d.items || []), { itemName: '', unit: 'kg', price: '' }] }));
                    const updateItem = (i, field, val) => setData(d => { const items = [...(d.items || [])]; items[i] = { ...items[i], [field]: val }; return { ...d, items }; });
                    const removeItem = (i) => setData(d => ({ ...d, items: (d.items || []).filter((_, idx) => idx !== i) }));
                    return (
                        <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontWeight: '800', color: '#0f172a' }}>{title}</h3>
                                <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8' }}>🗑️</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                {[['Vendor Name *', 'name', 'text', 'e.g. Suresh Dairy'],
                                  ['Phone *', 'phone', 'tel', '+91 98765 43210'],
                                  ['WhatsApp', 'whatsapp', 'tel', 'WhatsApp number'],
                                  ['Address', 'address', 'text', 'Area / City']].map(([label, key, type, ph]) => (
                                    <div key={key}>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</label>
                                        <input type={type} placeholder={ph} value={data[key] || ''} onChange={e => setData(d => ({ ...d, [key]: e.target.value }))}
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                                    </div>
                                ))}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Category</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <select value={isCustom ? 'Other' : (data.category || '')} onChange={e => {
                                            if (e.target.value === 'Other') {
                                                setIsCustom(true);
                                                setData(d => ({ ...d, category: '' }));
                                            } else {
                                                setIsCustom(false);
                                                setData(d => ({ ...d, category: e.target.value }));
                                            }
                                        }}
                                            style={{ flex: 1, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem', boxSizing: 'border-box', background: 'white' }}>
                                            <option value="">-- Choose Category --</option>
                                            {VENDOR_CATEGORIES.filter(c => c !== 'Other').map(c => <option key={c} value={c}>{c}</option>)}
                                            <option value="Other">Other</option>
                                        </select>
                                        {isCustom && (
                                            <input type="text" placeholder="Type Custom Category..." value={data.category || ''} onChange={e => setData(d => ({ ...d, category: e.target.value }))}
                                                style={{ flex: 1, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem', boxSizing: 'border-box' }} required />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Notes</label>
                                    <input type="text" placeholder="Extra info..." value={data.notes || ''} onChange={e => setData(d => ({ ...d, notes: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                                </div>
                            </div>
                            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📦 Items & Prices</label>
                                    <button type="button" onClick={addItem}
                                        style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}>
                                        + Add Item
                                    </button>
                                </div>
                                {(data.items || []).length === 0 ? (
                                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No items added yet. Click "Add Item" to start.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {(data.items || []).map((item, i) => (
                                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 100px auto', gap: '8px', alignItems: 'center' }}>
                                                <input type="text" placeholder="Item name (e.g. Full Cream Milk)" value={item.itemName} onChange={e => updateItem(i, 'itemName', e.target.value)}
                                                    style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem' }} />
                                                <select value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}
                                                    style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem' }}>
                                                    {['kg', 'g', 'litre', 'ml', 'piece', 'dozen', 'box', 'bag', 'packet'].map(u => <option key={u} value={u}>{u}</option>)}
                                                </select>
                                                <input type="number" placeholder="₹ Price" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)}
                                                    style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem' }} />
                                                <button onClick={() => removeItem(i)}
                                                    style={{ background: '#fee2e2', border: 'none', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', color: '#ef4444', fontWeight: '900', fontSize: '1rem' }}>🗑️</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={onCancel}
                                    style={{ flex: 1, padding: '12px', border: '1.5px solid #e2e8f0', background: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', color: '#64748b' }}>
                                    Cancel
                                </button>
                                <button onClick={onSave}
                                    style={{ flex: 2, padding: '12px', border: 'none', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', color: 'white' }}>
                                    💾 Save Vendor
                                </button>
                            </div>
                        </div>
                    );
                };

                const handleSaveVendor = async () => {
                    if (!newVendor.name.trim() || !newVendor.phone.trim()) { showToast('Vendor name and phone are required', 'error'); return; }
                    try {
                        const saved = await db.addVendor(newVendor);
                        setVendors(prev => [saved, ...prev]);
                        setNewVendor({ name: '', category: 'Dairy & Milk', phone: '', whatsapp: '', address: '', notes: '', items: [] });
                        setShowAddVendorForm(false);
                        showToast('Vendor added!');
                    } catch { showToast('Failed to save vendor', 'error'); }
                };

                const handleUpdateVendor = async () => {
                    if (!editingVendor.name.trim()) { showToast('Vendor name is required', 'error'); return; }
                    try {
                        await db.updateVendor(editingVendor.id, editingVendor);
                        setVendors(prev => prev.map(v => v.id === editingVendor.id ? editingVendor : v));
                        setEditingVendor(null);
                        showToast('Vendor updated!');
                    } catch { showToast('Failed to update vendor', 'error'); }
                };

                const handleDeleteVendor = async (id) => {
                    if (!window.confirm('Delete this vendor?')) return;
                    try {
                        await db.deleteVendor(id);
                        setVendors(prev => prev.filter(v => v.id !== id));
                        showToast('Vendor deleted');
                    } catch { showToast('Failed to delete', 'error'); }
                };

                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontWeight: '900', color: '#0f172a', fontSize: '1.5rem' }}>🏪 Vendor Management</h2>
                                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>{vendors.length} vendors · Compare prices · Track suppliers</p>
                            </div>
                            <button onClick={() => { setShowAddVendorForm(true); setEditingVendor(null); }}
                                style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem' }}>
                                + Add Vendor
                            </button>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <h3 style={{ color: 'white', fontWeight: '800', margin: '0 0 1rem 0', fontSize: '1rem' }}>🔍 Price Comparison — Who gives the best price?</h3>
                            <input type="text" placeholder="Search item (e.g. Milk, Egg, Pistachio)..." value={vendorItemSearch}
                                onChange={e => setVendorItemSearch(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                            {vendorItemSearch && (
                                <div style={{ marginTop: '1rem' }}>
                                    {itemComparisonList.length === 0 ? (
                                        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No vendors found supplying "{vendorItemSearch}"</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {itemComparisonList.map((it, i) => (
                                                <div key={i} style={{
                                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                                    background: i === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                                                    border: i === 0 ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.06)',
                                                    borderRadius: '12px', padding: '10px 16px'
                                                }}>
                                                    <span style={{ fontSize: '1.2rem' }}>{i === 0 ? '🏆' : `#${i + 1}`}</span>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ color: 'white', fontWeight: '700', fontSize: '0.9rem' }}>{it.vendorName}</div>
                                                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{it.itemName} · {it.unit} · {it.category}</div>
                                                    </div>
                                                    <div style={{ color: i === 0 ? '#10b981' : '#f59e0b', fontWeight: '900', fontSize: '1.1rem' }}>₹{parseFloat(it.price).toLocaleString('en-IN')}/{it.unit}</div>
                                                    {i === 0 && <span style={{ background: '#10b981', color: 'white', fontSize: '0.65rem', fontWeight: '800', padding: '2px 8px', borderRadius: '50px' }}>BEST</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {showAddVendorForm && (
                            <VendorForm data={newVendor} setData={setNewVendor}
                                onSave={handleSaveVendor} onCancel={() => setShowAddVendorForm(false)}
                                title="➕ Add New Vendor" />
                        )}
                        {editingVendor && (
                            <VendorForm data={editingVendor} setData={setEditingVendor}
                                onSave={handleUpdateVendor} onCancel={() => setEditingVendor(null)}
                                title="âœï¸ Edit Vendor" />
                        )}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <input type="text" placeholder="🔍 Search vendors..." value={vendorSearchQuery} onChange={e => setVendorSearchQuery(e.target.value)}
                                style={{ flex: '1 1 200px', padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.88rem' }} />
                            <select value={vendorCategoryFilter} onChange={e => setVendorCategoryFilter(e.target.value)}
                                style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.88rem' }}>
                                <option value="All">All Categories</option>
                                {VENDOR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>{filteredVendors.length} results</span>
                        </div>
                        {filteredVendors.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#475569' }}>No vendors yet</div>
                                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Click "Add Vendor" to add your first supplier.</div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                                {filteredVendors.map(v => (
                                    <div key={v.id} style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '1rem', color: '#0f172a' }}>{v.name}</div>
                                                <span style={{ display: 'inline-block', background: '#f0f9ff', color: '#0ea5e9', border: '1px solid #bae6fd', borderRadius: '50px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: '700', marginTop: '4px' }}>{v.category}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button onClick={() => { setEditingVendor(v); setShowAddVendorForm(false); }}
                                                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem', color: '#0ea5e9' }}>Edit</button>
                                                <button onClick={() => handleDeleteVendor(v.id)}
                                                    style={{ background: '#fee2e2', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem', color: '#ef4444' }}>Del</button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap' }}>
                                            {v.phone && <span>📞 <a href={`tel:${v.phone}`} style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: '600' }}>{v.phone}</a></span>}
                                            {v.whatsapp && <span>💬 <a href={`https://wa.me/${v.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: '600' }}>{v.whatsapp}</a></span>}
                                            {v.address && <span>📍 {v.address}</span>}
                                        </div>
                                        {(v.items || []).length > 0 && (
                                            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Items & Pricing</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {(v.items || []).map((it, i) => (
                                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                                            <span style={{ color: '#334155', fontWeight: '600' }}>{it.itemName}</span>
                                                            <span style={{ color: '#0ea5e9', fontWeight: '800' }}>₹{parseFloat(it.price || 0).toLocaleString('en-IN')}/{it.unit}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {v.notes && <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>"{v.notes}"</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                PURCHASES TAB (Admin read-all view)
            â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === 'purchases' && (() => {
                const CATEGORIES = [
                    'Dairy & Milk', 'Eggs', 'Fruits & Vegetables', 'Dry Fruits & Nuts',
                    'Sweeteners & Flavours', 'Packaging', 'Cleaning & Supplies',
                    'Gas & Fuel', 'Equipment & Tools', 'Other'
                ];
                const uniquePreviousItems = [...new Set(purchases.map(p => p.item).filter(Boolean))];

                const locationOptions = ['Main Kitchen', ...runningFranchises.filter(f => f.status === 'Running').map(f => f.outletName)];
                
                // If filter location is not initialized yet or not in list, set default to Main Kitchen
                const currentFilterLoc = purchaseFilterLocation === 'All' ? 'Main Kitchen' : purchaseFilterLocation;

                const filteredPurchases = purchases.filter(p => {
                    // Location separation filter
                    if (currentFilterLoc !== 'All' && (p.location || 'Main Kitchen') !== currentFilterLoc) return false;

                    if (purchaseFilterDate && p.date !== purchaseFilterDate) return false;
                    if (purchaseFilterPurchaser !== 'All' && p.purchaserName !== purchaseFilterPurchaser) return false;
                    if (purchaseFilterCategory !== 'All' && p.category !== purchaseFilterCategory) return false;
                    if (purchaseFilterPayment !== 'All' && p.paymentMode !== purchaseFilterPayment) return false;
                    if (purchaseSearchQuery && !p.item.toLowerCase().includes(purchaseSearchQuery.toLowerCase()) &&
                        !(p.vendorName || '').toLowerCase().includes(purchaseSearchQuery.toLowerCase())) return false;
                    return true;
                });

                const today = new Date().toISOString().split('T')[0];
                const todayTotal = filteredPurchases.filter(p => p.date === today).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
                const periodTotal = filteredPurchases.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
                const cashTotal = filteredPurchases.filter(p => p.paymentMode === 'Cash').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
                const gpayTotal = filteredPurchases.filter(p => p.paymentMode === 'GPay').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
                const uniquePurchasers = [...new Set(purchases.map(p => p.purchaserName).filter(Boolean))];

                const getGroupedPurchases = () => {
                    const sorted = [...filteredPurchases].sort((a, b) => b.date.localeCompare(a.date));
                    
                    if (purchaseFilterPeriod === 'daily') {
                        const groups = {};
                        sorted.forEach(p => {
                            if (!groups[p.date]) groups[p.date] = { date: p.date, total: 0, items: [] };
                            groups[p.date].total += parseFloat(p.amount || 0);
                            groups[p.date].items.push(p);
                        });
                        return Object.values(groups);
                    } else if (purchaseFilterPeriod === 'weekly') {
                        const getWeekRange = (dateStr) => {
                            const date = new Date(dateStr);
                            const day = date.getDay();
                            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                            const monday = new Date(date.setDate(diff));
                            const sunday = new Date(date.setDate(diff + 6));
                            return {
                                label: `Week of ${monday.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${sunday.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
                                key: monday.toISOString().split('T')[0]
                            };
                        };

                        const groups = {};
                        sorted.forEach(p => {
                            const range = getWeekRange(p.date);
                            if (!groups[range.key]) groups[range.key] = { label: range.label, total: 0, items: [] };
                            groups[range.key].total += parseFloat(p.amount || 0);
                            groups[range.key].items.push(p);
                        });
                        return Object.values(groups).sort((a, b) => b.label.localeCompare(a.label));
                    } else if (purchaseFilterPeriod === 'monthly') {
                        const groups = {};
                        sorted.forEach(p => {
                            const monthKey = p.date.substring(0, 7);
                            if (!groups[monthKey]) {
                                const d = new Date(parseInt(monthKey.split('-')[0]), parseInt(monthKey.split('-')[1]) - 1, 1);
                                const label = d.toLocaleDateString('default', { month: 'long', year: 'numeric' });
                                groups[monthKey] = { label, total: 0, items: [] };
                            }
                            groups[monthKey].total += parseFloat(p.amount || 0);
                            groups[monthKey].items.push(p);
                        });
                        return Object.values(groups).sort((a, b) => b.label.localeCompare(a.label));
                    }
                    return [];
                };

                const groupedData = getGroupedPurchases();

                const handleSavePurchase = async (e) => {
                    e.preventDefault();
                    if (!newPurchase.item.trim() || !newPurchase.amount || parseFloat(newPurchase.amount) <= 0) {
                        showToast('Please enter a valid item name and amount', 'error');
                        return;
                    }
                    try {
                        const selectedVendor = vendors.find(v => v.id === newPurchase.vendorId);
                        const data = {
                            ...newPurchase,
                            amount: parseFloat(newPurchase.amount),
                            location: currentFilterLoc,
                            purchaserName: newPurchase.purchaserName || user.name,
                            purchaserEmail: user.email,
                            vendorName: selectedVendor?.name || '',
                        };
                        const saved = await db.addPurchase(data);
                        setPurchases(prev => [saved, ...prev]);

                        // Auto-update vendor item price
                        if (newPurchase.vendorId && selectedVendor) {
                            const updatedItems = [...(selectedVendor.items || [])];
                            const matchingItemIndex = updatedItems.findIndex(
                                it => it.itemName.toLowerCase().trim() === newPurchase.item.toLowerCase().trim()
                            );
                            if (matchingItemIndex > -1) {
                                updatedItems[matchingItemIndex] = {
                                    ...updatedItems[matchingItemIndex],
                                    price: parseFloat(newPurchase.amount).toString()
                                };
                            } else {
                                updatedItems.push({
                                    itemName: newPurchase.item.trim(),
                                    unit: 'kg',
                                    price: parseFloat(newPurchase.amount).toString()
                                });
                            }
                            const updatedVendor = { ...selectedVendor, items: updatedItems };
                            await db.updateVendor(selectedVendor.id, updatedVendor);
                            setVendors(prev => prev.map(v => v.id === selectedVendor.id ? updatedVendor : v));
                        }

                        setNewPurchase({ date: new Date().toISOString().split('T')[0], item: '', category: 'Dairy & Milk', vendorId: '', amount: '', paymentMode: 'Cash', notes: '', billUrl: '', transactionUrl: '', location: currentFilterLoc, purchaserName: user.name });
                        setPurchaserType('select');
                        setShowAddPurchaseForm(false);
                        showToast('Purchase logged successfully and vendor catalog updated!');
                    } catch (error) {
                        showToast('Failed to save purchase', 'error');
                    }
                };

                const handleUpdatePurchase = async (e) => {
                    e.preventDefault();
                    if (!editingPurchase.item.trim() || !editingPurchase.amount || parseFloat(editingPurchase.amount) <= 0) {
                        showToast('Please enter a valid item and amount', 'error');
                        return;
                    }
                    try {
                        const selectedVendor = vendors.find(v => v.id === editingPurchase.vendorId);
                        const data = {
                            ...editingPurchase,
                            amount: parseFloat(editingPurchase.amount),
                            purchaserName: editingPurchase.purchaserName || user.name,
                            vendorName: selectedVendor?.name || '',
                        };
                        await db.updatePurchase(editingPurchase.id, data);
                        setPurchases(prev => prev.map(p => p.id === editingPurchase.id ? data : p));

                        // Auto-update vendor item price
                        if (editingPurchase.vendorId && selectedVendor) {
                            const updatedItems = [...(selectedVendor.items || [])];
                            const matchingItemIndex = updatedItems.findIndex(
                                it => it.itemName.toLowerCase().trim() === editingPurchase.item.toLowerCase().trim()
                            );
                            if (matchingItemIndex > -1) {
                                updatedItems[matchingItemIndex] = {
                                    ...updatedItems[matchingItemIndex],
                                    price: parseFloat(editingPurchase.amount).toString()
                                };
                            } else {
                                updatedItems.push({
                                    itemName: editingPurchase.item.trim(),
                                    unit: 'kg',
                                    price: parseFloat(editingPurchase.amount).toString()
                                });
                            }
                            const updatedVendor = { ...selectedVendor, items: updatedItems };
                            await db.updateVendor(selectedVendor.id, updatedVendor);
                            setVendors(prev => prev.map(v => v.id === selectedVendor.id ? updatedVendor : v));
                        }

                        setEditingPurchase(null);
                        showToast('Purchase and vendor catalog updated successfully!');
                    } catch (error) {
                        showToast('Failed to update purchase', 'error');
                    }
                };

                const handleDeletePurchase = async (id) => {
                    if (!window.confirm('Delete this purchase entry?')) return;
                    try {
                        await db.deletePurchase(id);
                        setPurchases(prev => prev.filter(p => p.id !== id));
                        showToast('Purchase deleted');
                    } catch { showToast('Failed to delete', 'error'); }
                };

                const handleExportCSV = () => {
                    if (!filteredPurchases.length) { showToast('No data to export', 'error'); return; }
                    const headers = ['Date', 'Location', 'Purchaser', 'Item', 'Category', 'Vendor', 'Amount (₹)', 'Payment Mode', 'Notes'];
                    const rows = filteredPurchases.map(p =>
                        [p.date, p.location || 'Main Kitchen', p.purchaserName, `"${p.item}"`, `"${p.category}"`, `"${p.vendorName || ''}"`, p.amount, p.paymentMode, `"${p.notes || ''}"`].join(',')
                    );
                    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `purchases_${currentFilterLoc.replace(/\s+/g, '_')}_${today}.csv`; a.click();
                    URL.revokeObjectURL(url);
                    showToast('Report exported!');
                };

                const handleBillUpload = async (e, isEdit = false) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setIsUploading(true);
                    try {
                        const url = await uploadMedia(file);
                        if (isEdit) {
                            setEditingPurchase(prev => ({ ...prev, billUrl: url }));
                        } else {
                            setNewPurchase(prev => ({ ...prev, billUrl: url }));
                        }
                        showToast('Bill receipt uploaded!');
                    } catch {
                        showToast('Upload failed', 'error');
                    } finally {
                        setIsUploading(false);
                    }
                };

                const handleTransactionUpload = async (e, isEdit = false) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setIsUploading(true);
                    try {
                        const url = await uploadMedia(file);
                        if (isEdit) {
                            setEditingPurchase(prev => ({ ...prev, transactionUrl: url }));
                        } else {
                            setNewPurchase(prev => ({ ...prev, transactionUrl: url }));
                        }
                        showToast('Transaction proof uploaded!');
                    } catch {
                        showToast('Upload failed', 'error');
                    } finally {
                        setIsUploading(false);
                    }
                };

                const catIcon = (cat) => ({
                    'Dairy & Milk': '🥛', 'Eggs': '🥚', 'Fruits & Vegetables': '🍎',
                    'Dry Fruits & Nuts': '🥜', 'Sweeteners & Flavours': '🍯',
                    'Packaging': '📦', 'Gas & Fuel': '🔥', 'Equipment & Tools': '🔧',
                    'Cleaning & Supplies': '🧹'
                }[cat] || '🛒');

                if (!selectedPurchaseOutlet) {
                    const outlets = ['Main Kitchen', ...runningFranchises.filter(f => f.status === 'Running').map(f => f.outletName)];
                    return (
                        <div style={{ width: '100%' }}>
                            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                                <h2 style={{ fontWeight: '900', color: '#0f172a', fontSize: '1.75rem', marginBottom: '8px' }}>🏪 Select Outlet to Manage Purchases</h2>
                                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Choose a location to view and input purchase records</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
                                {outlets.map(outlet => {
                                    const count = purchases.filter(p => (p.location || 'Main Kitchen') === outlet).length;
                                    const totalSpent = purchases.filter(p => (p.location || 'Main Kitchen') === outlet).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                                    const isMain = outlet === 'Main Kitchen';
                                    return (
                                        <div 
                                            key={outlet} 
                                            onClick={() => {
                                                setSelectedPurchaseOutlet(outlet);
                                                setPurchaseFilterLocation(outlet);
                                            }}
                                            style={{
                                                background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '2rem', 
                                                cursor: 'pointer', textAlign: 'center', transition: 'all 0.25s',
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.borderColor = '#0ea5e9';
                                                e.currentTarget.style.boxShadow = '0 10px 25px rgba(14, 165, 233, 0.1)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)';
                                            }}
                                        >
                                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{isMain ? '🍳' : '🏪'}</div>
                                            <h3 style={{ margin: '0 0 10px', fontSize: '1.25rem', color: '#0f172a', fontWeight: '900' }}>{outlet.replace('High Laban - ', '')}</h3>
                                            <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>{isMain ? 'Main Production Facility' : 'Franchise Outlet'}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px dashed #e2e8f0', paddingTop: '15px', marginTop: '10px' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Transactions</div>
                                                    <div style={{ fontSize: '1rem', fontWeight: '800', color: '#334155' }}>{count}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Total Expenses</div>
                                                    <div style={{ fontSize: '1rem', fontWeight: '800', color: '#10b981' }}>₹{totalSpent.toFixed(0)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                }

                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <button 
                                onClick={() => {
                                    setSelectedPurchaseOutlet(null);
                                }}
                                style={{
                                    border: '1px solid #cbd5e1', background: 'white', color: '#64748b',
                                    padding: '8px 16px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer',
                                    fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                ⬅ Switch Outlet
                            </button>
                            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0ea5e9', background: '#f0f9ff', padding: '6px 12px', borderRadius: '20px', border: '1px solid #bae6fd' }}>
                                Selected Location: {selectedPurchaseOutlet}
                            </span>
                        </div>

                        {/* Purchases Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontWeight: '900', color: '#0f172a', fontSize: '1.5rem' }}>🛒 Purchase Ledger: {currentFilterLoc}</h2>
                                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>Manage entries for {currentFilterLoc} · {filteredPurchases.length} records</p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => { setShowAddPurchaseForm(!showAddPurchaseForm); setEditingPurchase(null); }}
                                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    {showAddPurchaseForm ? 'Close Form' : '+ Add Entry'}
                                </button>
                                <button onClick={handleExportCSV}
                                    style={{ background: '#059669', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    📊 Export CSV
                                </button>
                            </div>
                        </div>

                        {/* Add Manual Purchase Form */}
                        {showAddPurchaseForm && (
                            <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ margin: '0 0 1rem 0', fontWeight: '800', color: '#0f172a' }}>➕ Add Manual Purchase Entry ({currentFilterLoc})</h3>
                                <form onSubmit={handleSavePurchase} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Date</label>
                                        <input type="date" value={newPurchase.date} onChange={e => setNewPurchase({ ...newPurchase, date: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} required />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Item Name *</label>
                                        <input type="text" value={newPurchase.item} onChange={e => setNewPurchase({ ...newPurchase, item: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} placeholder="e.g. Fresh Cream Milk" required list="prev-items" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Category</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <select value={isPurchaseCustom ? 'Other' : (newPurchase.category || '')} onChange={e => {
                                                if (e.target.value === 'Other') {
                                                    setIsPurchaseCustom(true);
                                                    setNewPurchase(prev => ({ ...prev, category: '' }));
                                                } else {
                                                    setIsPurchaseCustom(false);
                                                    setNewPurchase(prev => ({ ...prev, category: e.target.value }));
                                                }
                                            }} style={{ flex: 1, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white' }}>
                                                <option value="">-- Choose Category --</option>
                                                {CATEGORIES.filter(c => c !== 'Other').map(c => <option key={c} value={c}>{c}</option>)}
                                                <option value="Other">Other</option>
                                            </select>
                                            {isPurchaseCustom && (
                                                <input type="text" placeholder="Type Custom Category..." value={newPurchase.category || ''} onChange={e => setNewPurchase(prev => ({ ...prev, category: e.target.value }))}
                                                    style={{ flex: 1, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} required />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                                            Purchaser (Staff) 
                                            {purchaserType === 'select' ? (
                                                <span onClick={() => { setPurchaserType('manual'); setNewPurchase({ ...newPurchase, purchaserName: '' }); }} style={{ marginLeft: '8px', color: '#0ea5e9', cursor: 'pointer', textTransform: 'none', fontWeight: 'bold' }}>[âœï¸ Enter Manual]</span>
                                            ) : (
                                                <span onClick={() => { setPurchaserType('select'); setNewPurchase({ ...newPurchase, purchaserName: user.name }); }} style={{ marginLeft: '8px', color: '#0ea5e9', cursor: 'pointer', textTransform: 'none', fontWeight: 'bold' }}>[📋 Choose Staff]</span>
                                            )}
                                        </label>
                                        {purchaserType === 'select' ? (
                                            <select value={newPurchase.purchaserName || user.name} onChange={e => {
                                                if (e.target.value === '__manual__') {
                                                    setPurchaserType('manual');
                                                    setNewPurchase({ ...newPurchase, purchaserName: '' });
                                                } else {
                                                    setNewPurchase({ ...newPurchase, purchaserName: e.target.value });
                                                }
                                            }} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white' }}>
                                                <option value={user.name}>{user.name} (You / Current User)</option>
                                                {staffList.filter(s => s.status !== 'Terminated').map(s => (
                                                    <option key={s.id} value={s.fullName}>{s.fullName} ({s.position})</option>
                                                ))}
                                                <option value="__manual__">-- Enter Name Manually --</option>
                                            </select>
                                        ) : (
                                            <input type="text" value={newPurchase.purchaserName || ''} onChange={e => setNewPurchase({ ...newPurchase, purchaserName: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} placeholder="Type purchaser name..." required />
                                        )}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Vendor (Optional)</label>
                                        <select value={newPurchase.vendorId} onChange={e => setNewPurchase({ ...newPurchase, vendorId: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white' }}>
                                            <option value="">-- Select Vendor --</option>
                                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.category})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Amount (₹) *</label>
                                        <input type="number" step="0.01" value={newPurchase.amount} onChange={e => setNewPurchase({ ...newPurchase, amount: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} placeholder="0.00" required />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Payment Mode</label>
                                        <select value={newPurchase.paymentMode} onChange={e => setNewPurchase({ ...newPurchase, paymentMode: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white' }}>
                                            <option value="Cash">Cash</option>
                                            <option value="GPay">GPay</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Notes</label>
                                        <input type="text" value={newPurchase.notes} onChange={e => setNewPurchase({ ...newPurchase, notes: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} placeholder="Notes details..." />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>🧾 Upload Bill / Invoice</label>
                                        <input type="file" onChange={(e) => handleBillUpload(e, false)} style={{ fontSize: '0.85rem' }} />
                                        {newPurchase.billUrl && <span style={{ fontSize: '0.75rem', color: '#0ea5e9', display: 'block', marginTop: '4px' }}>✅ Invoice Attached</span>}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>📱 Upload Transaction Proof</label>
                                        <input type="file" onChange={(e) => handleTransactionUpload(e, false)} style={{ fontSize: '0.85rem' }} />
                                        {newPurchase.transactionUrl && <span style={{ fontSize: '0.75rem', color: '#22c55e', display: 'block', marginTop: '4px' }}>✅ Proof Attached</span>}
                                    </div>
                                    <button type="submit" style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: '800', cursor: 'pointer' }}>💾 Log Purchase</button>
                                </form>
                            </div>
                        )}

                        {/* Edit Purchase Modal */}
                        {editingPurchase && (
                            <div style={{ background: '#fef3c7', borderRadius: '20px', padding: '1.5rem', border: '1px solid #fde68a', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ margin: '0 0 1rem 0', fontWeight: '800', color: '#b45309' }}>âœï¸ Edit Purchase Details</h3>
                                <form onSubmit={handleUpdatePurchase} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', marginBottom: '6px' }}>Date</label>
                                        <input type="date" value={editingPurchase.date} onChange={e => setEditingPurchase({ ...editingPurchase, date: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} required />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', marginBottom: '6px' }}>Item Name *</label>
                                        <input type="text" value={editingPurchase.item} onChange={e => setEditingPurchase({ ...editingPurchase, item: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} required list="prev-items" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', marginBottom: '6px' }}>Category</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <select value={isEditPurchaseCustom ? 'Other' : (editingPurchase.category || '')} onChange={e => {
                                                if (e.target.value === 'Other') {
                                                    setIsEditPurchaseCustom(true);
                                                    setEditingPurchase(prev => ({ ...prev, category: '' }));
                                                } else {
                                                    setIsEditPurchaseCustom(false);
                                                    setEditingPurchase(prev => ({ ...prev, category: e.target.value }));
                                                }
                                            }} style={{ flex: 1, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', background: 'white' }}>
                                                <option value="">-- Choose Category --</option>
                                                {CATEGORIES.filter(c => c !== 'Other').map(c => <option key={c} value={c}>{c}</option>)}
                                                <option value="Other">Other</option>
                                            </select>
                                            {isEditPurchaseCustom && (
                                                <input type="text" placeholder="Type Custom Category..." value={editingPurchase.category || ''} onChange={e => setEditingPurchase(prev => ({ ...prev, category: e.target.value }))}
                                                    style={{ flex: 1, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} required />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', marginBottom: '6px' }}>
                                            Purchaser (Staff) 
                                            {editPurchaserType === 'select' ? (
                                                <span onClick={() => { setEditPurchaserType('manual'); setEditingPurchase({ ...editingPurchase, purchaserName: '' }); }} style={{ marginLeft: '8px', color: '#b45309', cursor: 'pointer', textTransform: 'none', fontWeight: 'bold' }}>[âœï¸ Enter Manual]</span>
                                            ) : (
                                                <span onClick={() => { setEditPurchaserType('select'); setEditingPurchase({ ...editingPurchase, purchaserName: user.name }); }} style={{ marginLeft: '8px', color: '#b45309', cursor: 'pointer', textTransform: 'none', fontWeight: 'bold' }}>[📋 Choose Staff]</span>
                                            )}
                                        </label>
                                        {editPurchaserType === 'select' ? (
                                            <select value={editingPurchase.purchaserName || user.name} onChange={e => {
                                                if (e.target.value === '__manual__') {
                                                    setEditPurchaserType('manual');
                                                    setEditingPurchase({ ...editingPurchase, purchaserName: '' });
                                                } else {
                                                    setEditingPurchase({ ...editingPurchase, purchaserName: e.target.value });
                                                }
                                            }} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', background: 'white' }}>
                                                <option value={user.name}>{user.name} (You / Current User)</option>
                                                {staffList.filter(s => s.status !== 'Terminated').map(s => (
                                                    <option key={s.id} value={s.fullName}>{s.fullName} ({s.position})</option>
                                                ))}
                                                <option value="__manual__">-- Enter Name Manually --</option>
                                            </select>
                                        ) : (
                                            <input type="text" value={editingPurchase.purchaserName || ''} onChange={e => setEditingPurchase({ ...editingPurchase, purchaserName: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} placeholder="Type purchaser name..." required />
                                        )}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', marginBottom: '6px' }}>Vendor</label>
                                        <select value={editingPurchase.vendorId} onChange={e => setEditingPurchase({ ...editingPurchase, vendorId: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', background: 'white' }}>
                                            <option value="">-- Select Vendor --</option>
                                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.category})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', marginBottom: '6px' }}>Amount (₹) *</label>
                                        <input type="number" step="0.01" value={editingPurchase.amount} onChange={e => setEditingPurchase({ ...editingPurchase, amount: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} required />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', marginBottom: '6px' }}>Payment Mode</label>
                                        <select value={editingPurchase.paymentMode} onChange={e => setEditingPurchase({ ...editingPurchase, paymentMode: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', background: 'white' }}>
                                            <option value="Cash">Cash</option>
                                            <option value="GPay">GPay</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', marginBottom: '6px' }}>Notes</label>
                                        <input type="text" value={editingPurchase.notes || ''} onChange={e => setEditingPurchase({ ...editingPurchase, notes: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', marginBottom: '6px' }}>🧾 Upload Invoice / Bill</label>
                                        <input type="file" onChange={(e) => handleBillUpload(e, true)} style={{ fontSize: '0.85rem' }} />
                                        {editingPurchase.billUrl && <span style={{ fontSize: '0.75rem', color: '#0ea5e9', display: 'block', marginTop: '4px' }}>✅ Invoice Attached</span>}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', marginBottom: '6px' }}>📱 Upload Transaction screenshot</label>
                                        <input type="file" onChange={(e) => handleTransactionUpload(e, true)} style={{ fontSize: '0.85rem' }} />
                                        {editingPurchase.transactionUrl && <span style={{ fontSize: '0.75rem', color: '#22c55e', display: 'block', marginTop: '4px' }}>✅ Proof Attached</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button type="submit" style={{ flex: 1, background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: '800', cursor: 'pointer' }}>Update</button>
                                        <button type="button" onClick={() => setEditingPurchase(null)} style={{ flex: 1, background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Aggregate Spend Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            {[
                                { label: "Today's Total", value: `₹${todayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#0ea5e9', icon: '🏦' },
                                { label: 'Period Total', value: `₹${periodTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#10b981', icon: '🏦' },
                                { label: 'Cash Payments', value: `₹${cashTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#f59e0b', icon: '🏦' },
                                { label: 'GPay / Digital', value: `₹${gpayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#8b5cf6', icon: '🏦' },
                            ].map((s, i) => (
                                <div key={i} style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{s.icon}</div>
                                    <div style={{ color: s.color, fontSize: '1.3rem', fontWeight: '900', lineHeight: 1 }}>{s.value}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Search, Filter & Period (Daily / Weekly / Monthly) controls */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                                {/* Daily / Weekly / Monthly Switch */}
                                <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
                                    {[
                                        { id: 'daily', label: '📅 Daily Wise' },
                                        { id: 'weekly', label: '📊 Weekly Wise' },
                                        { id: 'monthly', label: '📈 Monthly Wise' },
                                        { id: 'detailed', label: '📋 Detailed Log' }
                                    ].map(item => (
                                        <button 
                                            key={item.id}
                                            onClick={() => setPurchaseFilterPeriod(item.id)}
                                            style={{
                                                border: 'none', background: purchaseFilterPeriod === item.id ? 'white' : 'transparent',
                                                color: purchaseFilterPeriod === item.id ? '#0ea5e9' : '#64748b',
                                                padding: '6px 14px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer',
                                                fontSize: '0.78rem', boxShadow: purchaseFilterPeriod === item.id ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                                <input type="text" placeholder="🔍 Search item / vendor..." value={purchaseSearchQuery} onChange={e => setPurchaseSearchQuery(e.target.value)}
                                    style={{ flex: '1 1 180px', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem' }} />
                                <input type="date" value={purchaseFilterDate} onChange={e => setPurchaseFilterDate(e.target.value)}
                                    style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem' }} />
                                <select value={purchaseFilterPurchaser} onChange={e => setPurchaseFilterPurchaser(e.target.value)}
                                    style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', background: 'white' }}>
                                    <option value="All">All Purchasers</option>
                                    {uniquePurchasers.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <select value={purchaseFilterCategory} onChange={e => setPurchaseFilterCategory(e.target.value)}
                                    style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', background: 'white' }}>
                                    <option value="All">All Categories</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select value={purchaseFilterPayment} onChange={e => setPurchaseFilterPayment(e.target.value)}
                                    style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', background: 'white' }}>
                                    <option value="All">All Payments</option>
                                    <option value="Cash">Cash</option>
                                    <option value="GPay">GPay</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                                {(purchaseFilterDate || purchaseFilterPurchaser !== 'All' || purchaseFilterCategory !== 'All' || purchaseFilterPayment !== 'All' || purchaseSearchQuery) && (
                                    <button onClick={() => { setPurchaseFilterDate(''); setPurchaseFilterPurchaser('All'); setPurchaseFilterCategory('All'); setPurchaseFilterPayment('All'); setPurchaseSearchQuery(''); }}
                                        style={{ padding: '9px 14px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List View depending on Period selection */}
                        {filteredPurchases.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#475569' }}>No purchase entries found</div>
                                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Entries logged for {currentFilterLoc} will appear here.</div>
                            </div>
                        ) : purchaseFilterPeriod === 'detailed' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {filteredPurchases.map(p => (
                                    <div key={p.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                        <div style={{ fontSize: '2rem', flexShrink: 0 }}>{catIcon(p.category)}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>{p.item}</span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '700', background: p.paymentMode === 'Cash' ? '#fef9c3' : '#ede9fe', color: p.paymentMode === 'Cash' ? '#92400e' : '#5b21b6', border: p.paymentMode === 'Cash' ? '1px solid #fde68a' : '1px solid #c4b5fd' }}>
                                                    {p.paymentMode === 'Cash' ? '💵' : '📱'} {p.paymentMode}
                                                </span>
                                            </div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '3px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                <span>📅 {p.date}</span>
                                                <span style={{ fontWeight: '700', color: '#64748b' }}>👤 {p.purchaserName}</span>
                                                <span>🏷️ {p.category}</span>
                                                {p.vendorName && <span>🏪 {p.vendorName}</span>}
                                            </div>
                                            {p.notes && <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '4px', fontStyle: 'italic' }}>"{p.notes}"</div>}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                                            <span style={{ color: '#10b981', fontWeight: '900', fontSize: '1.1rem' }}>₹{parseFloat(p.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {p.billUrl && (
                                                    <a href={p.billUrl} target="_blank" rel="noopener noreferrer"
                                                        style={{ background: '#f0f9ff', color: '#0ea5e9', border: '1px solid #bae6fd', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: '700', textDecoration: 'none' }}>
                                                        🧾 Invoice
                                                    </a>
                                                )}
                                                {p.transactionUrl && (
                                                    <a href={p.transactionUrl} target="_blank" rel="noopener noreferrer"
                                                        style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: '700', textDecoration: 'none' }}>
                                                        📱 Proof
                                                    </a>
                                                )}
                                                <button onClick={() => { setEditingPurchase(p); setShowAddPurchaseForm(false); }}
                                                    style={{ background: '#f8fafc', color: '#0ea5e9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDeletePurchase(p.id)}
                                                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {groupedData.map((group, idx) => (
                                    <div key={idx} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                        {/* Group Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>
                                            <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.92rem' }}>
                                                {purchaseFilterPeriod === 'daily' ? `📅 ${group.date}` : `📍 ${group.label}`}
                                            </span>
                                            <span style={{ color: '#10b981', fontWeight: '900', fontSize: '1rem' }}>
                                                Total spent: ₹{group.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        {/* Group Items */}
                                        <div style={{ display: 'flex', flexDirection: 'column', padding: '10px 20px' }}>
                                            {group.items.map(p => (
                                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '1.2rem' }}>{catIcon(p.category)}</span>
                                                            <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.88rem' }}>{p.item}</span>
                                                            <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>by {p.purchaserName}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                        <span style={{ fontWeight: '800', color: '#475569', fontSize: '0.9rem' }}>₹{parseFloat(p.amount).toLocaleString('en-IN')}</span>
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            {p.billUrl && (
                                                                <a href={p.billUrl} target="_blank" rel="noopener noreferrer" style={{ background: '#f0f9ff', color: '#0ea5e9', border: '1px solid #bae6fd', borderRadius: '4px', padding: '3px 8px', fontSize: '0.68rem', fontWeight: '700', textDecoration: 'none' }}>Invoice</a>
                                                            )}
                                                            {p.transactionUrl && (
                                                                <a href={p.transactionUrl} target="_blank" rel="noopener noreferrer" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '3px 8px', fontSize: '0.68rem', fontWeight: '700', textDecoration: 'none' }}>Proof</a>
                                                            )}
                                                            {!isReadOnly && (
                                                                <button onClick={() => handleDeletePurchase(p.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '0.68rem', fontWeight: '700', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <datalist id="prev-items">
                            {uniquePreviousItems.map(item => <option key={item} value={item} />)}
                        </datalist>
                    </div>
                );
            })()}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                FOOD COSTING ERP TAB (raw materials, bundle items, final recipe costings)
            â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === 'costing' && (() => {
                const CATEGORIES = [
                    'Dairy & Milk', 'Eggs', 'Fruits & Vegetables', 'Dry Fruits & Nuts',
                    'Sweeteners & Flavours', 'Packaging', 'Cleaning & Supplies',
                    'Gas & Fuel', 'Equipment & Tools', 'Other'
                ];

                const getRawMaterialPrice = (raw) => {
                    const matchingPurchases = (purchases || []).filter(
                        p => p.item && p.item.toLowerCase().trim() === raw.name.toLowerCase().trim()
                    );
                    if (matchingPurchases.length > 0) {
                        const total = matchingPurchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                        return total / matchingPurchases.length;
                    }
                    return parseFloat(raw.price) || 0;
                };

                const getRawMaterialUnitPrice = (raw) => {
                    const price = getRawMaterialPrice(raw);
                    const qty = parseFloat(raw.quantity) || 1;
                    return price / qty;
                };

                const getBundleItemTotalCost = (bundle) => {
                    let cost = 0;
                    (bundle.ingredients || []).forEach(ing => {
                        const raw = rawMaterials.find(r => r.id === ing.materialId);
                        if (raw) {
                            cost += getRawMaterialUnitPrice(raw) * (parseFloat(ing.quantity) || 0);
                        }
                    });
                    return cost;
                };

                const getBundleItemUnitCost = (bundle) => {
                    const totalCost = getBundleItemTotalCost(bundle);
                    const yieldQty = parseFloat(bundle.yieldQuantity) || 1;
                    return totalCost / yieldQty;
                };

                const getBundleIngredientCost = (bundle, quantity, unit) => {
                    const totalCost = getBundleItemTotalCost(bundle);
                    const portions = parseFloat(bundle.portions) || 1;
                    const yieldQty = parseFloat(bundle.yieldQuantity) || 1;
                    const normalizedUnit = (unit || bundle.yieldUnit || 'g').toLowerCase();
                    if (normalizedUnit === 'pcs' || normalizedUnit === 'pc' || normalizedUnit === 'piece' || normalizedUnit === 'pieces') {
                        return (totalCost / portions) * (parseFloat(quantity) || 0);
                    } else {
                        return (totalCost / yieldQty) * (parseFloat(quantity) || 0);
                    }
                };

                const getBundleSopDetails = (bundle) => {
                    let totalWeight = 0;
                    let batchCost = 0;
                    (bundle.ingredients || []).forEach(ing => {
                        const raw = rawMaterials.find(r => r.id === ing.materialId);
                        const qty = parseFloat(ing.quantity) || 0;
                        totalWeight += qty;
                        if (raw) {
                            batchCost += qty * getRawMaterialUnitPrice(raw);
                        }
                    });
                    const yieldPortions = parseFloat(bundle.portions) || 1;
                    const portionSize = yieldPortions > 0 ? (totalWeight / yieldPortions) : 0;
                    const costPerPortion = yieldPortions > 0 ? (batchCost / yieldPortions) : 0;
                    return {
                        totalWeight,
                        batchCost,
                        portionSize,
                        costPerPortion,
                        yieldPortions
                    };
                };

                const getProductsUsingBundle = (bundleId) => {
                    return products.filter(p => {
                        const recipe = recipesList.find(r => r.id === p.id);
                        if (!recipe) return false;
                        const usesInBase = (recipe.ingredients || []).some(ing => ing.type === 'bundle' && ing.id === bundleId);
                        const usesInToppings = (recipe.toppings || []).some(t => 
                            (t.ingredients || []).some(ing => ing.type === 'bundle' && ing.id === bundleId)
                        );
                        return usesInBase || usesInToppings;
                    });
                };

                const getBundleQuantityUsedInProduct = (product, bundleId) => {
                    const recipe = recipesList.find(r => r.id === product.id);
                    if (!recipe) return 0;
                    const baseIng = (recipe.ingredients || []).find(ing => ing.type === 'bundle' && ing.id === bundleId);
                    if (baseIng) return parseFloat(baseIng.quantity) || 0;
                    
                    let toppingQty = 0;
                    (recipe.toppings || []).forEach(t => {
                        const tIng = (t.ingredients || []).find(ing => ing.type === 'bundle' && ing.id === bundleId);
                        if (tIng) toppingQty += parseFloat(tIng.quantity) || 0;
                    });
                    return toppingQty;
                };

                const getProductRecipeCost = (productId, selectedToppingIndex = -1) => {
                    const recipe = recipesList.find(r => r.id === productId);
                    
                    const recipeKitchen = kitchens.find(k => k.id === (recipe?.kitchenId || selectedOverheadKitchenId));
                    const totalKitchenFixedCost = recipeKitchen ? (recipeKitchen.fixedCosts || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) : 0;
                    const fixedCostPerPiece = parseFloat(monthlyPiecesSold) > 0 ? (totalKitchenFixedCost / parseFloat(monthlyPiecesSold)) : 0;

                    if (!recipe) return { ingredientsCost: 0, packagingCost: 0, overheadCost: 0, fixedCostPerPiece: fixedCostPerPiece, toppingCost: 0, totalUnitCost: fixedCostPerPiece };

                    let ingCost = 0;
                    (recipe.ingredients || []).forEach(ing => {
                        if (ing.type === 'raw') {
                            const raw = rawMaterials.find(r => r.id === ing.id);
                            if (raw) ingCost += getRawMaterialUnitPrice(raw) * (parseFloat(ing.quantity) || 0);
                        } else if (ing.type === 'bundle') {
                            const bundle = bundleItems.find(b => b.id === ing.id);
                            if (bundle) ingCost += getBundleIngredientCost(bundle, ing.quantity, ing.unit);
                        }
                    });

                    let pkgCost = 0;
                    if (recipe.packagingIngredients && recipe.packagingIngredients.length > 0) {
                        recipe.packagingIngredients.forEach(pIng => {
                            const raw = rawMaterials.find(r => r.id === pIng.materialId);
                            if (raw) pkgCost += getRawMaterialUnitPrice(raw) * (parseFloat(pIng.quantity) || 0);
                        });
                    } else {
                        pkgCost = parseFloat(recipe.packagingCost) || 0;
                    }

                    const batch = parseFloat(recipe.batchSize) || 1;
                    const overhead = parseFloat(recipe.overheadAllocation) || 0;

                    let toppingCost = 0;
                    if (selectedToppingIndex > -1 && recipe.toppings && recipe.toppings[selectedToppingIndex]) {
                        const topping = recipe.toppings[selectedToppingIndex];
                        (topping.ingredients || []).forEach(ing => {
                            if (ing.type === 'raw') {
                                const raw = rawMaterials.find(r => r.id === ing.id);
                                if (raw) toppingCost += getRawMaterialUnitPrice(raw) * (parseFloat(ing.quantity) || 0);
                            } else if (ing.type === 'bundle') {
                                const bundle = bundleItems.find(b => b.id === ing.id);
                                if (bundle) toppingCost += getBundleIngredientCost(bundle, ing.quantity, ing.unit);
                            }
                        });
                    }

                    // Kitchen Overhead cost calculation (already calculated above)

                    const unitIngCost = ingCost;
                    const unitPkgCost = pkgCost;
                    // Manual overhead is used only if no kitchen is matched
                    const unitOverheadCost = (!recipeKitchen && batch > 0) ? (overhead / batch) : 0;
                    const totalUnitCost = unitIngCost + unitPkgCost + unitOverheadCost + fixedCostPerPiece + toppingCost;

                    return {
                        ingredientsCost: unitIngCost,
                        packagingCost: unitPkgCost,
                        overheadCost: unitOverheadCost,
                        fixedCostPerPiece: fixedCostPerPiece,
                        toppingCost: toppingCost,
                        totalUnitCost: totalUnitCost
                    };
                };

                const handleExportRecipeCosts = () => {
                    try {
                        let csvContent = "data:text/csv;charset=utf-8,";
                        csvContent += "Product Name,Variant,Base Ingredients Cost,Topping Cost,Packaging Cost,Batch Overhead,Kitchen Fixed Cost,Total Unit Cost,Retail Price,Profit (Rs),Margin (%)\r\n";
                        
                        products.forEach(prod => {
                            const currentRecipe = recipesList.find(r => r.id === prod.id);
                            const baseAnalysis = getProductRecipeCost(prod.id, -1);
                            const baseProfit = (parseFloat(prod.price) || 0) - baseAnalysis.totalUnitCost;
                            const baseMargin = (parseFloat(prod.price) || 0) > 0 ? (baseProfit / (parseFloat(prod.price) || 0)) * 100 : 0;
                            
                            csvContent += `"${prod.name}","Base","${baseAnalysis.ingredientsCost.toFixed(2)}","0.00","${baseAnalysis.packagingCost.toFixed(2)}","${baseAnalysis.overheadCost.toFixed(2)}","${baseAnalysis.fixedCostPerPiece.toFixed(2)}","${baseAnalysis.totalUnitCost.toFixed(2)}","${(parseFloat(prod.price) || 0).toFixed(2)}","${baseProfit.toFixed(2)}","${baseMargin.toFixed(1)}%"\r\n`;
                            
                            if (currentRecipe?.toppings && currentRecipe.toppings.length > 0) {
                                currentRecipe.toppings.forEach((top, tIdx) => {
                                    const topAnalysis = getProductRecipeCost(prod.id, tIdx);
                                    const topProfit = (parseFloat(prod.price) || 0) - topAnalysis.totalUnitCost;
                                    const topMargin = (parseFloat(prod.price) || 0) > 0 ? (topProfit / (parseFloat(prod.price) || 0)) * 100 : 0;
                                    
                                    csvContent += `"${prod.name}","+ Topping: ${top.name}","${baseAnalysis.ingredientsCost.toFixed(2)}","${(topAnalysis.toppingCost || 0).toFixed(2)}","${topAnalysis.packagingCost.toFixed(2)}","${topAnalysis.overheadCost.toFixed(2)}","${topAnalysis.fixedCostPerPiece.toFixed(2)}","${topAnalysis.totalUnitCost.toFixed(2)}","${(parseFloat(prod.price) || 0).toFixed(2)}","${topProfit.toFixed(2)}","${topMargin.toFixed(1)}%"\r\n`;
                                });
                            }
                        });
                        
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `recipe_cost_analysis_${new Date().toISOString().slice(0,10)}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        showToast("Recipe costing analysis exported successfully! 📊");
                    } catch (err) {
                        console.error("Failed to export recipe costing", err);
                        showToast("Export failed", "error");
                    }
                };

                const handleSaveRawMaterial = async (e) => {
                    e.preventDefault();
                    if (isReadOnly || isChef) return;
                    if (!newRaw.name.trim() || !newRaw.price || !newRaw.quantity) {
                        showToast('Please fill all fields', 'error');
                        return;
                    }
                    try {
                        const payload = {
                            name: newRaw.name.trim(),
                            category: newRaw.category,
                            price: parseFloat(newRaw.price),
                            quantity: parseFloat(newRaw.quantity),
                            unit: newRaw.unit,
                            vendorId: newRaw.vendorId || '',
                            vendorItemName: newRaw.vendorItemName || '',
                            updatedAt: new Date().toISOString()
                        };
                        if (editingRaw) {
                            await db.updateRawMaterial(editingRaw.id, payload);
                            setRawMaterials(prev => prev.map(r => r.id === editingRaw.id ? { id: editingRaw.id, ...payload } : r));
                            setEditingRaw(null);
                            showToast('Raw material updated successfully!');
                        } else {
                            const added = await db.addRawMaterial(payload);
                            setRawMaterials(prev => [added, ...prev]);
                            showToast('Raw material added successfully!');
                        }
                        setNewRaw({ name: '', category: 'Dairy & Milk', price: '', quantity: '', unit: 'g', vendorId: '', vendorItemName: '' });
                        setShowAddRawForm(false);
                    } catch (error) {
                        showToast('Failed to save raw material', 'error');
                    }
                };

                const handleDeleteRawMaterial = async (id) => {
                    if (isReadOnly || isChef) return;
                    if (!window.confirm('Delete this raw material?')) return;
                    try {
                        await db.deleteRawMaterial(id);
                        setRawMaterials(prev => prev.filter(r => r.id !== id));
                        showToast('Raw material deleted successfully');
                    } catch {
                        showToast('Failed to delete', 'error');
                    }
                };

                 const handleSaveBundleItem = async (e) => {
                    e.preventDefault();
                    if (isReadOnly || isChef) return;
                    if (!newBundle.name.trim() || !newBundle.yieldQuantity) {
                        showToast('Please enter name and yield quantity', 'error');
                        return;
                    }
                    try {
                        const payload = {
                            name: newBundle.name.trim(),
                            yieldQuantity: parseFloat(newBundle.yieldQuantity),
                            yieldUnit: newBundle.yieldUnit,
                            portions: parseInt(newBundle.portions) || 1,
                            servingTool: newBundle.servingTool || 'Standard Scoop',
                            ingredients: newBundle.ingredients,
                            updatedAt: new Date().toISOString()
                        };
                        if (editingBundle) {
                            await db.updateBundleItem(editingBundle.id, payload);
                            setBundleItems(prev => prev.map(b => b.id === editingBundle.id ? { id: editingBundle.id, ...payload } : b));
                            setEditingBundle(null);
                            showToast('Bundle sub-recipe updated successfully!');
                        } else {
                            const added = await db.addBundleItem(payload);
                            setBundleItems(prev => [added, ...prev]);
                            showToast('Bundle sub-recipe added successfully!');
                        }
                        setNewBundle({ name: '', yieldQuantity: '1000', yieldUnit: 'g', portions: '24', servingTool: 'Standard Scoop', ingredients: [] });
                        setShowAddBundleForm(false);
                    } catch (error) {
                        showToast('Failed to save bundle sub-recipe', 'error');
                    }
                };

                const handleDeleteBundleItem = async (id) => {
                    if (isReadOnly || isChef) return;
                    if (!window.confirm('Delete this bundle sub-recipe?')) return;
                    try {
                        await db.deleteBundleItem(id);
                        setBundleItems(prev => prev.filter(b => b.id !== id));
                        showToast('Bundle item deleted');
                    } catch {
                        showToast('Failed to delete', 'error');
                    }
                };

                const handleSaveProductRecipe = async (e) => {
                    e.preventDefault();
                    if (isReadOnly || isChef) return;
                    if (!selectedRecipeProduct) return;
                    try {
                        const payload = {
                            ingredients: editingRecipe.ingredients,
                            packagingIngredients: editingRecipe.packagingIngredients || [],
                            packagingCost: parseFloat(editingRecipe.packagingCost) || 0,
                            batchSize: parseFloat(editingRecipe.batchSize) || 1,
                            overheadAllocation: parseFloat(editingRecipe.overheadAllocation) || 0,
                            kitchenId: editingRecipe.kitchenId || '',
                            toppings: editingRecipe.toppings || [],
                            updatedAt: new Date().toISOString()
                        };
                        await db.saveRecipe(selectedRecipeProduct.id, payload);
                        setRecipesList(prev => {
                            const existing = prev.find(r => r.id === selectedRecipeProduct.id);
                            if (existing) {
                                return prev.map(r => r.id === selectedRecipeProduct.id ? { id: selectedRecipeProduct.id, ...payload } : r);
                            }
                            return [...prev, { id: selectedRecipeProduct.id, ...payload }];
                        });
                        setSelectedRecipeProduct(null);
                        showToast('Recipe costing configured successfully! ✅');
                    } catch (error) {
                        showToast('Failed to save recipe costing', 'error');
                    }
                };

                return (
                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0', minHeight: '80vh' }}>
                        
                        {/* Tab Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontWeight: '900', color: '#0f172a', fontSize: '1.6rem' }}>🧮 Food Costing ERP</h2>
                                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>Configure raw materials, build sub-recipes, and compute final product menu costing & margins.</p>
                            </div>
                        </div>

                        {/* Sub-tab Navigation */}
                        <div style={{ display: 'flex', gap: '8px', background: '#e2e8f0', padding: '6px', borderRadius: '12px', marginBottom: '2rem', alignSelf: 'flex-start', width: 'fit-content' }}>
                            {[
                                { id: 'raw', label: '🌾 Raw Materials' },
                                { id: 'bundle', label: '📦 Prep Bundles' },
                                { id: 'final', label: '🍲 Product Costs' },
                                { id: 'sop', label: '📖 SOP Manual' }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setCostingSubTab(tab.id)}
                                    style={{
                                        border: 'none', background: costingSubTab === tab.id ? 'white' : 'transparent',
                                        color: costingSubTab === tab.id ? '#0f172a' : '#475569',
                                        padding: '8px 16px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer',
                                        fontSize: '0.85rem', boxShadow: costingSubTab === tab.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                                        transition: 'all 0.15s'
                                    }}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* SUB TAB 1: RAW MATERIALS */}
                        {costingSubTab === 'raw' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                                        <h3 style={{ margin: 0, color: '#1e293b', fontWeight: '800' }}>Raw Materials Registry</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>Filter Category:</span>
                                            <select value={rawMaterialCategoryFilter} onChange={e => setRawMaterialCategoryFilter(e.target.value)}
                                                style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', fontSize: '0.78rem', fontWeight: '600', color: '#334155' }}>
                                                <option value="All">All Categories</option>
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    {(!isReadOnly && !isChef) && (
                                        <button onClick={() => { setShowAddRawForm(!showAddRawForm); setEditingRaw(null); setIsRawCustom(false); }}
                                            style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}>
                                            {showAddRawForm ? 'Close Form' : '+ Add Material'}
                                        </button>
                                    )}
                                </div>

                                {showAddRawForm && (
                                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1rem' }}>
                                        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                                            <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.25rem' }}>{editingRaw ? '✏️ Edit Raw Material' : '➕ Add New Raw Material'}</h4>
                                            <form onSubmit={handleSaveRawMaterial} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', alignItems: 'end' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Link to Vendor (Optional)</label>
                                                <select value={newRaw.vendorId || ''} onChange={e => {
                                                    const vId = e.target.value;
                                                    setNewRaw({ ...newRaw, vendorId: vId, vendorItemName: '' });
                                                }} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white' }}>
                                                    <option value="">-- No Vendor Linked --</option>
                                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                                </select>
                                            </div>
                                            {newRaw.vendorId && (() => {
                                                const vendorObj = vendors.find(v => v.id === newRaw.vendorId);
                                                const vendorItems = vendorObj?.items || [];
                                                return (
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Choose Vendor Item</label>
                                                        <select value={newRaw.vendorItemName || ''} onChange={e => {
                                                            const itemNm = e.target.value;
                                                            const itemObj = vendorItems.find(it => it.itemName === itemNm);
                                                            if (itemObj) {
                                                                setNewRaw({
                                                                    ...newRaw,
                                                                    vendorItemName: itemNm,
                                                                    name: itemNm,
                                                                    price: itemObj.price.toString(),
                                                                    quantity: '1',
                                                                    unit: itemObj.unit || 'g'
                                                                });
                                                            }
                                                        }} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white' }}>
                                                            <option value="">-- Choose Item --</option>
                                                            {vendorItems.map(it => <option key={it.itemName} value={it.itemName}>{it.itemName} (₹{it.price}/{it.unit})</option>)}
                                                        </select>
                                                    </div>
                                                );
                                            })()}
                                            <div style={{ position: 'relative' }}>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Material Name</label>
                                                <input type="text" value={newRaw.name} onChange={e => { setNewRaw({ ...newRaw, name: e.target.value }); setShowNameSuggestions(true); }} onFocus={() => setShowNameSuggestions(true)} onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px' }} required placeholder="e.g. Pistachio Kernels" />
                                                {showNameSuggestions && (() => {
                                                    const nameSug = newRaw.name.trim()
                                                        ? rawMaterials.filter(r => r.name.toLowerCase().includes(newRaw.name.toLowerCase()) && r.name.toLowerCase() !== newRaw.name.toLowerCase())
                                                        : [];
                                                    if (nameSug.length === 0) return null;
                                                    return (
                                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                                                            {nameSug.map(s => (
                                                                <div key={s.id} onClick={() => {
                                                                    setNewRaw({
                                                                        ...newRaw,
                                                                        name: s.name,
                                                                        category: s.category || newRaw.category,
                                                                        unit: s.unit || newRaw.unit
                                                                    });
                                                                    if (s.category) {
                                                                        setIsRawCustom(!CATEGORIES.includes(s.category));
                                                                    }
                                                                    setShowNameSuggestions(false);
                                                                }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9', textAlign: 'left', fontWeight: '500', color: '#334155' }}
                                                                onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                                                                onMouseLeave={e => e.target.style.background = 'transparent'}>
                                                                    {s.name} <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '6px' }}>({s.category})</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Category</label>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <select value={isRawCustom ? 'Other' : (newRaw.category || '')} onChange={e => {
                                                        if (e.target.value === 'Other') {
                                                            setIsRawCustom(true);
                                                            setNewRaw(prev => ({ ...prev, category: '' }));
                                                        } else {
                                                            setIsRawCustom(false);
                                                            setNewRaw(prev => ({ ...prev, category: e.target.value }));
                                                        }
                                                    }} style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white' }}>
                                                        <option value="">-- Choose Category --</option>
                                                        {CATEGORIES.filter(c => c !== 'Other').map(c => <option key={c} value={c}>{c}</option>)}
                                                        <option value="Other">Other</option>
                                                    </select>
                                                    {isRawCustom && (
                                                        <input type="text" placeholder="Type Custom Category..." value={newRaw.category || ''} onChange={e => setNewRaw(prev => ({ ...prev, category: e.target.value }))}
                                                            style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px' }} required />
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Purchase Cost (₹)</label>
                                                <input type="number" step="0.01" value={newRaw.price} onChange={e => setNewRaw({ ...newRaw, price: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px' }} required placeholder="0.00" />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Purchase Quantity</label>
                                                <input type="number" step="0.01" value={newRaw.quantity} onChange={e => setNewRaw({ ...newRaw, quantity: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px' }} required placeholder="1000" />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Unit</label>
                                                <select value={newRaw.unit} onChange={e => setNewRaw({ ...newRaw, unit: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white' }}>
                                                    <option value="g">Grams (g)</option>
                                                    <option value="ml">Millilitres (ml)</option>
                                                    <option value="pcs">Pieces (pcs)</option>
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button type="submit" style={{ flex: 1, background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: '700', cursor: 'pointer' }}>Save</button>
                                                <button type="button" onClick={() => setShowAddRawForm(false)} style={{ flex: 1, background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                                    {rawMaterials
                                        .filter(raw => rawMaterialCategoryFilter === 'All' || raw.category === rawMaterialCategoryFilter)
                                        .sort((a, b) => {
                                            const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime() || 0;
                                            const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime() || 0;
                                            if (timeB !== timeA) return timeB - timeA;
                                            return (b.id || '').localeCompare(a.id || '');
                                        })
                                        .map(raw => {
                                            const unitCost = getRawMaterialUnitPrice(raw);
                                            const dynamicPrice = getRawMaterialPrice(raw);
                                            const hasPurchases = (purchases || []).some(p => p.item && p.item.toLowerCase().trim() === raw.name.toLowerCase().trim());
                                        return (
                                            <div key={raw.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 6px rgba(0,0,0,0.01)' }}>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '20px', fontWeight: '700' }}>{raw.category}</span>
                                                        {(!isReadOnly && !isChef) && (
                                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                                <button onClick={() => { setEditingRaw(raw); setNewRaw({ name: raw.name, category: raw.category, price: raw.price.toString(), quantity: raw.quantity.toString(), unit: raw.unit, vendorId: raw.vendorId || '', vendorItemName: raw.vendorItemName || '' }); setShowAddRawForm(true); }} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}>Edit</button>
                                                                <button onClick={() => handleDeleteRawMaterial(raw.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}>Delete</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <h4 style={{ margin: '10px 0 4px', fontWeight: '800', color: '#0f172a', fontSize: '1rem' }}>{raw.name}</h4>
                                                    {raw.vendorId && (() => {
                                                        const vendorObj = vendors.find(v => v.id === raw.vendorId);
                                                        return vendorObj ? (
                                                            <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: '#0ea5e9', fontWeight: '700' }}>🏪 Vendor: {vendorObj.name}</p>
                                                        ) : null;
                                                    })()}
                                                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                                                        Cost: ₹{dynamicPrice.toFixed(2)} per {raw.quantity}{raw.unit}
                                                        {hasPurchases && (
                                                            <span style={{ marginLeft: '6px', color: '#0ea5e9', fontWeight: 'bold', fontSize: '0.72rem' }}>
                                                                (Avg from Purchases)
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div style={{ marginTop: '1.25rem', borderTop: '1px dashed #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600' }}>Unit Rate:</span>
                                                    <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>₹{unitCost.toFixed(4)} / {raw.unit}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* SUB TAB 2: PREP BUNDLES */}
                        {costingSubTab === 'bundle' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, color: '#1e293b', fontWeight: '800' }}>Prep sub-recipes / Bundles</h3>
                                    {(!isReadOnly && !isChef) && (
                                        <button onClick={() => { setShowAddBundleForm(!showAddBundleForm); setEditingBundle(null); setNewBundle({ name: '', yieldQuantity: '1000', yieldUnit: 'g', portions: '24', servingTool: 'Standard Scoop', ingredients: [], productUsages: [] }); }}
                                            style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}>
                                            {showAddBundleForm ? 'Close Form' : '+ Add Prep Recipe'}
                                        </button>
                                    )}
                                </div>

                                {showAddBundleForm && (
                                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1rem' }}>
                                        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                                            <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.25rem' }}>{editingBundle ? '✏️ Edit Prep Sub-Recipe' : '➕ Add New Prep Sub-Recipe'}</h4>
                                            <form onSubmit={handleSaveBundleItem} style={{ display: 'grid', gap: '1rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                                 <div style={{ position: 'relative' }}>
                                                     <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Sub-Recipe Name</label>
                                                     <input type="text" value={newBundle.name} onChange={e => { setNewBundle({ ...newBundle, name: e.target.value }); setShowBundleSuggestions(true); }} onFocus={() => setShowBundleSuggestions(true)} onBlur={() => setTimeout(() => setShowBundleSuggestions(false), 200)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px' }} required placeholder="e.g. Milk Pudding Base" />
                                                     {showBundleSuggestions && (() => {
                                                         const bundleSug = newBundle.name.trim()
                                                             ? bundleItems.filter(b => b.name.toLowerCase().includes(newBundle.name.toLowerCase()) && b.name.toLowerCase() !== newBundle.name.toLowerCase())
                                                             : [];
                                                         if (bundleSug.length === 0) return null;
                                                         return (
                                                             <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                                                                 {bundleSug.map(s => (
                                                                     <div key={s.id} onClick={() => {
                                                                         setNewBundle({
                                                                             ...newBundle,
                                                                             name: s.name,
                                                                             yieldQuantity: s.yieldQuantity.toString(),
                                                                             yieldUnit: s.yieldUnit,
                                                                             portions: (s.portions || 24).toString(),
                                                                             servingTool: s.servingTool || 'Standard Scoop',
                                                                             ingredients: s.ingredients || [],
                                                                             productUsages: s.productUsages || []
                                                                         });
                                                                         setShowBundleSuggestions(false);
                                                                     }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9', textAlign: 'left', fontWeight: '500', color: '#334155' }}
                                                                     onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                                                                     onMouseLeave={e => e.target.style.background = 'transparent'}>
                                                                         {s.name} <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '6px' }}>({s.yieldQuantity} {s.yieldUnit})</span>
                                                                     </div>
                                                                 ))}
                                                             </div>
                                                         );
                                                     })()}
                                                 </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Yield Output Quantity</label>
                                                    <input type="number" step="0.01" value={newBundle.yieldQuantity} onChange={e => setNewBundle({ ...newBundle, yieldQuantity: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px' }} required />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Yield Output Unit</label>
                                                    <select value={newBundle.yieldUnit} onChange={e => setNewBundle({ ...newBundle, yieldUnit: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white' }}>
                                                        <option value="g">Grams (g)</option>
                                                        <option value="ml">Millilitres (ml)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Yield Portions / Pieces</label>
                                                    <input type="number" value={newBundle.portions || '24'} onChange={e => setNewBundle({ ...newBundle, portions: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px' }} required />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Serving Tool / Standard Scoop</label>
                                                    <input type="text" value={newBundle.servingTool || 'Standard Scoop'} onChange={e => setNewBundle({ ...newBundle, servingTool: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px' }} placeholder="e.g. Standard Scoop, 9-portion Tray" />
                                                </div>
                                            </div>

                                            {/* Product Usage & Yield Mapping */}
                                            <div style={{ border: '1px solid #bae6fd', borderRadius: '12px', padding: '1rem', background: '#f0f9ff' }}>
                                                <h5 style={{ margin: '0 0 4px 0', color: '#0369a1', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    🧠 Product Usage & Yield Mapping
                                                </h5>
                                                <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: '#0369a1' }}>
                                                    Link this prep sub-recipe to final menu products and specify how much goes into each portion. This automatically updates their recipes.
                                                </p>
                                                
                                                {(newBundle.productUsages || []).map((usage, idx) => {
                                                    const qtyUsed = parseFloat(usage.quantity) || 0;
                                                    const batchQty = parseFloat(newBundle.yieldQuantity) || 0;
                                                    const isPcs = (usage.unit === 'pcs');
                                                    const piecesProduced = qtyUsed > 0 ? (isPcs ? ((parseFloat(newBundle.portions) || 1) / qtyUsed) : (batchQty / qtyUsed)) : 0;
                                                    
                                                    return (
                                                        <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                                                            <select value={usage.productId} onChange={e => {
                                                                const updated = [...(newBundle.productUsages || [])];
                                                                updated[idx].productId = e.target.value;
                                                                setNewBundle({ ...newBundle, productUsages: updated });
                                                            }} style={{ flex: 2, minWidth: '150px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }}>
                                                                <option value="">-- Choose Product --</option>
                                                                {products
                                                                    .filter(p => p.id === usage.productId || !(newBundle.productUsages || []).some((otherUsage, otherIdx) => otherIdx !== idx && otherUsage.productId === p.id))
                                                                    .map(p => (
                                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                                    ))}
                                                            </select>
                                                            
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '150px' }}>
                                                                <input type="number" step="0.01" placeholder="Qty used" value={usage.quantity} onChange={e => {
                                                                    const updated = [...(newBundle.productUsages || [])];
                                                                    updated[idx].quantity = e.target.value;
                                                                    setNewBundle({ ...newBundle, productUsages: updated });
                                                                }} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                                                <select value={usage.unit || newBundle.yieldUnit || 'g'} onChange={e => {
                                                                    const updated = [...(newBundle.productUsages || [])];
                                                                    updated[idx].unit = e.target.value;
                                                                    setNewBundle({ ...newBundle, productUsages: updated });
                                                                }} style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', fontSize: '0.85rem' }}>
                                                                    <option value="g">g</option>
                                                                    <option value="ml">ml</option>
                                                                    <option value="pcs">pcs</option>
                                                                </select>
                                                            </div>

                                                            {qtyUsed > 0 && (
                                                                <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: '700', minWidth: '140px' }}>
                                                                    Yields: {piecesProduced.toFixed(1)} pcs/batch
                                                                </span>
                                                            )}

                                                            <button type="button" onClick={() => {
                                                                const updated = (newBundle.productUsages || []).filter((_, i) => i !== idx);
                                                                setNewBundle({ ...newBundle, productUsages: updated });
                                                            }} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                                                                Delete
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                                
                                                <button type="button" onClick={() => {
                                                    const updated = [...(newBundle.productUsages || []), { productId: '', quantity: '', unit: newBundle.yieldUnit || 'g' }];
                                                    setNewBundle({ ...newBundle, productUsages: updated });
                                                }} style={{ background: 'white', border: '1px solid #bae6fd', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', color: '#0369a1', fontSize: '0.8rem', marginTop: '5px' }}>
                                                    + Link Product
                                                </button>
                                            </div>

                                            {/* Ingredients builder */}
                                            <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1rem', background: '#f8fafc' }}>
                                                <h5 style={{ margin: '0 0 10px 0', fontWeight: '700' }}>Ingredients & Raw Materials used</h5>
                                                {newBundle.ingredients.map((ing, idx) => {
                                                    const raw = rawMaterials.find(r => r.id === ing.materialId);
                                                    return (
                                                        <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                                                            <select value={ing.materialId} onChange={e => {
                                                                const updated = [...newBundle.ingredients];
                                                                updated[idx].materialId = e.target.value;
                                                                setNewBundle({ ...newBundle, ingredients: updated });
                                                            }} style={{ flex: 2, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }}>
                                                                <option value="">-- Choose Material --</option>
                                                                {rawMaterials
                                                                    .filter(r => r.id === ing.materialId || !newBundle.ingredients.some((otherIng, otherIdx) => otherIdx !== idx && otherIng.materialId === r.id))
                                                                    .map(r => <option key={r.id} value={r.id}>{r.name} (₹{getRawMaterialUnitPrice(r).toFixed(3)}/{r.unit})</option>)}
                                                            </select>
                                                            <input type="number" step="0.01" placeholder="Quantity used" value={ing.quantity} onChange={e => {
                                                                const updated = [...newBundle.ingredients];
                                                                updated[idx].quantity = e.target.value;
                                                                setNewBundle({ ...newBundle, ingredients: updated });
                                                            }} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                                            <span style={{ fontSize: '0.85rem', color: '#64748b', minWidth: '30px' }}>{raw?.unit || ''}</span>
                                                            
                                                            {raw?.unit === 'pcs' && (
                                                                <>
                                                                    <input type="number" step="0.01" placeholder="g/pc" title="Grams per piece" value={ing.gramsPerPiece || ''} onChange={e => {
                                                                        const updated = [...newBundle.ingredients];
                                                                        updated[idx].gramsPerPiece = e.target.value;
                                                                        setNewBundle({ ...newBundle, ingredients: updated });
                                                                    }} style={{ width: '80px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>g/pc</span>
                                                                </>
                                                            )}

                                                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0369a1', minWidth: '50px' }}>
                                                                {raw && ing.quantity ? `₹${(getRawMaterialUnitPrice(raw) * parseFloat(ing.quantity)).toFixed(2)}` : ''}
                                                            </span>
                                                            <button type="button" onClick={() => {
                                                                setNewBundle({ ...newBundle, ingredients: newBundle.ingredients.filter((_, i) => i !== idx) });
                                                            }} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Delete</button>
                                                        </div>
                                                    );
                                                })}
                                                <button type="button" onClick={() => {
                                                    setNewBundle({ ...newBundle, ingredients: [...newBundle.ingredients, { materialId: '', quantity: '', gramsPerPiece: '' }] });
                                                }} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', color: '#475569', fontSize: '0.8rem', marginTop: '5px' }}>
                                                    + Add Ingredient
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
                                                <button type="submit" style={{ background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: '700', cursor: 'pointer' }}>Save Recipe</button>
                                                <button type="button" onClick={() => setShowAddBundleForm(false)} style={{ background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 24px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                    {[...bundleItems].sort((a, b) => {
                                        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime() || 0;
                                        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime() || 0;
                                        if (timeB !== timeA) return timeB - timeA;
                                        return (b.id || '').localeCompare(a.id || '');
                                    }).map(bundle => {
                                        const totalCost = getBundleItemTotalCost(bundle);
                                        const unitCost = getBundleItemUnitCost(bundle);
                                        const portions = parseFloat(bundle.portions) || 1;
                                        const pieceWeight = (parseFloat(bundle.yieldQuantity) || 0) / portions;
                                        const pieceCost = totalCost / portions;
                                        const usedProducts = getProductsUsingBundle(bundle.id);
                                        return (
                                            <div key={bundle.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 6px rgba(0,0,0,0.01)' }}>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '20px', fontWeight: '700' }}>Prep Recipe</span>
                                                        {(!isReadOnly && !isChef) && (
                                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                                <button onClick={() => {
                                                                    setEditingBundle(bundle);
                                                                    const usages = [];
                                                                    products.forEach(p => {
                                                                        const recipe = recipesList.find(r => r.id === p.id);
                                                                        if (recipe) {
                                                                            const baseIng = (recipe.ingredients || []).find(ing => ing.type === 'bundle' && ing.id === bundle.id);
                                                                            if (baseIng) {
                                                                                usages.push({
                                                                                    productId: p.id,
                                                                                    quantity: (baseIng.quantity || '').toString(),
                                                                                    unit: baseIng.unit || bundle.yieldUnit || 'g'
                                                                                });
                                                                            }
                                                                        }
                                                                    });
                                                                    setNewBundle({
                                                                        name: bundle.name,
                                                                        yieldQuantity: bundle.yieldQuantity.toString(),
                                                                        yieldUnit: bundle.yieldUnit,
                                                                        portions: (bundle.portions || 24).toString(),
                                                                        servingTool: bundle.servingTool || 'Standard Scoop',
                                                                        ingredients: bundle.ingredients || [],
                                                                        productUsages: usages
                                                                    });
                                                                    setShowAddBundleForm(true);
                                                                }} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}>Edit</button>
                                                                <button onClick={() => handleDeleteBundleItem(bundle.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}>Delete</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <h4 style={{ margin: '0 0 6px', fontWeight: '800', color: '#0f172a', fontSize: '1rem' }}>{bundle.name}</h4>
                                                    <p style={{ margin: '0 0 4px', fontSize: '0.82rem', color: '#64748b', fontWeight: '500' }}>
                                                        Output: 1 Batch / Tray ({bundle.yieldQuantity}{bundle.yieldUnit})
                                                    </p>
                                                    <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#0f766e', fontWeight: '700' }}>
                                                        Yields: {portions} Pieces ({pieceWeight.toFixed(0)}g per Piece)
                                                    </p>

                                                    {usedProducts.length > 0 && (
                                                        <p style={{ margin: '0 0 10px', fontSize: '0.72rem', color: '#0ea5e9', fontWeight: '700', background: '#f0f9ff', padding: '4px 8px', borderRadius: '6px' }}>
                                                            🧠 Used in: {usedProducts.map(p => p.name).join(', ')}
                                                        </p>
                                                    )}
                                                    
                                                    {/* Ingredients Mini List */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '0.75rem', color: '#475569' }}>
                                                        {bundle.ingredients.map((ing, i) => {
                                                            const raw = rawMaterials.find(r => r.id === ing.materialId);
                                                            return (
                                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <span>· {raw?.name || 'Unknown'} ({ing.quantity}{raw?.unit || ''})</span>
                                                                    <span style={{ fontWeight: '600' }}>₹{((parseFloat(ing.quantity) || 0) * getRawMaterialUnitPrice(raw || {})).toFixed(2)}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                <div style={{ marginTop: '1.25rem', borderTop: '1px dashed #e2e8f0', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600' }}>Unit Cost:</span>
                                                        <span style={{ fontWeight: '800', color: '#16a34a', fontSize: '1rem' }}>₹{unitCost.toFixed(4)} / {bundle.yieldUnit}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600' }}>Piece Cost:</span>
                                                        <span style={{ fontWeight: '800', color: '#0284c7', fontSize: '1rem' }}>₹{pieceCost.toFixed(2)} / Piece</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* SUB TAB 3: PRODUCT COSTINGS & MARKUPS */}
                        {costingSubTab === 'final' && (
                            <div>
                                {selectedRecipeProduct && (
                                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1rem' }}>
                                        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #0ea5e9', padding: '1.5rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                                            <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontWeight: '800' }}>🧠 Configure Recipe for: {selectedRecipeProduct.name}</h4>
                                        <form onSubmit={handleSaveProductRecipe} style={{ display: 'grid', gap: '1.2rem' }}>
                                            
                                            {/* Overhead Costs & Yield */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#0369a1', marginBottom: '4px' }}>Allocated Kitchen</label>
                                                    <select value={editingRecipe.kitchenId || ''} onChange={e => setEditingRecipe({ ...editingRecipe, kitchenId: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white' }}>
                                                        <option value="">-- Manual Overhead Allocation --</option>
                                                        {kitchens.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                                    </select>
                                                </div>
                                                {(!editingRecipe.kitchenId) && (
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#0369a1', marginBottom: '4px' }}>Manual Overhead (₹/Batch)</label>
                                                    <input type="number" step="0.01" value={editingRecipe.overheadAllocation} onChange={e => setEditingRecipe({ ...editingRecipe, overheadAllocation: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white' }} />
                                                </div>
                                                )}
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#0369a1', marginBottom: '4px' }}>Batch Yield (Qty)</label>
                                                    <input type="number" value={editingRecipe.batchSize} onChange={e => setEditingRecipe({ ...editingRecipe, batchSize: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>Total Packing Cost (Auto-calculated)</label>
                                                    <div style={{ padding: '8px 12px', background: '#e2e8f0', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem', color: '#334155', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                                                        ₹{((editingRecipe.packagingIngredients || []).reduce((sum, ing) => {
                                                            const raw = rawMaterials.find(r => r.id === ing.materialId);
                                                            return sum + (raw ? getRawMaterialUnitPrice(raw) * (parseFloat(ing.quantity) || 0) : 0);
                                                        }, 0)).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Ingredients Mapping */}
                                            <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1rem', background: '#f8fafc' }}>
                                                <h5 style={{ margin: '0 0 10px 0', fontWeight: '700' }}>Recipe Ingredients (Raw Materials or Prep Bundles)</h5>
                                                {editingRecipe.ingredients.map((ing, idx) => {
                                                    const options = ing.type === 'raw' ? rawMaterials : bundleItems;
                                                    const matchItem = options.find(o => o.id === ing.id);
                                                    return (
                                                        <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                                                            <select value={ing.type} onChange={e => {
                                                                const updated = [...editingRecipe.ingredients];
                                                                updated[idx].type = e.target.value;
                                                                updated[idx].id = '';
                                                                updated[idx].unit = e.target.value === 'raw' ? '' : 'g';
                                                                setEditingRecipe({ ...editingRecipe, ingredients: updated });
                                                            }} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }}>
                                                                <option value="raw">🌾 Raw Material</option>
                                                                <option value="bundle">📦 Prep Bundle</option>
                                                            </select>
                                                            <select value={ing.id} onChange={e => {
                                                                const updated = [...editingRecipe.ingredients];
                                                                updated[idx].id = e.target.value;
                                                                const selectedOption = options.find(o => o.id === e.target.value);
                                                                updated[idx].unit = ing.type === 'raw' ? (selectedOption?.unit || 'g') : (selectedOption?.yieldUnit || 'g');
                                                                setEditingRecipe({ ...editingRecipe, ingredients: updated });
                                                            }} style={{ flex: 3, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }}>
                                                                <option value="">-- Choose Ingredient --</option>
                                                                {options
                                                                    .filter(o => o.id === ing.id || !editingRecipe.ingredients.some((otherIng, otherIdx) => otherIdx !== idx && otherIng.type === ing.type && otherIng.id === o.id))
                                                                    .map(o => (
                                                                        <option key={o.id} value={o.id}>
                                                                            {o.name} (₹{ing.type === 'raw' ? getRawMaterialUnitPrice(o).toFixed(3) : getBundleItemUnitCost(o).toFixed(3)}/{ing.type === 'raw' ? o.unit : o.yieldUnit})
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                            <input type="number" step="0.001" placeholder="Qty used" value={ing.quantity} onChange={e => {
                                                                const updated = [...editingRecipe.ingredients];
                                                                updated[idx].quantity = e.target.value;
                                                                setEditingRecipe({ ...editingRecipe, ingredients: updated });
                                                            }} style={{ flex: 1.5, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                                            
                                                            {ing.type === 'raw' ? (
                                                                <span style={{ fontSize: '0.85rem', color: '#64748b', minWidth: '30px' }}>{matchItem?.unit || ''}</span>
                                                            ) : (
                                                                <select value={ing.unit || matchItem?.yieldUnit || 'g'} onChange={e => {
                                                                    const updated = [...editingRecipe.ingredients];
                                                                    updated[idx].unit = e.target.value;
                                                                    setEditingRecipe({ ...editingRecipe, ingredients: updated });
                                                                }} style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', fontSize: '0.85rem' }}>
                                                                    <option value="g">g</option>
                                                                    <option value="ml">ml</option>
                                                                    <option value="pcs">pcs</option>
                                                                </select>
                                                            )}

                                                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0369a1', minWidth: '50px' }}>
                                                                {matchItem ? `₹${(parseFloat(ing.quantity) ? (ing.type === 'raw' ? getRawMaterialUnitPrice(matchItem) * parseFloat(ing.quantity) : getBundleIngredientCost(matchItem, ing.quantity, ing.unit)) : 0).toFixed(2)}` : '₹0.00'}
                                                            </span>
                                                            <button type="button" onClick={() => {
                                                                setEditingRecipe({ ...editingRecipe, ingredients: editingRecipe.ingredients.filter((_, i) => i !== idx) });
                                                            }} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>Delete</button>
                                                        </div>
                                                    );
                                                })}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <button type="button" onClick={() => {
                                                        setEditingRecipe({ ...editingRecipe, ingredients: [...editingRecipe.ingredients, { type: 'raw', id: '', quantity: '', unit: '' }] });
                                                    }} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', color: '#475569', fontSize: '0.8rem', marginTop: '5px' }}>
                                                        + Add Ingredient
                                                    </button>
                                                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.9rem' }}>
                                                        Subtotal: ₹{ (editingRecipe.ingredients || []).reduce((acc, i) => {
                                                            const match = i.type === 'raw' ? rawMaterials.find(r => r.id === i.id) : bundleItems.find(b => b.id === i.id);
                                                            if(!match || !parseFloat(i.quantity)) return acc;
                                                            return acc + (i.type === 'raw' ? getRawMaterialUnitPrice(match) * parseFloat(i.quantity) : getBundleIngredientCost(match, i.quantity, i.unit));
                                                        }, 0).toFixed(2) }
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Packaging Materials Mapping */}
                                            <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1rem', background: '#f8fafc' }}>
                                                <h5 style={{ margin: '0 0 10px 0', fontWeight: '700' }}>📦 Packaging Materials</h5>
                                                {(editingRecipe.packagingIngredients || []).map((ing, idx) => {
                                                    const raw = rawMaterials.find(r => r.id === ing.materialId);
                                                    return (
                                                        <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                                                            <select value={ing.materialId} onChange={e => {
                                                                const updated = [...(editingRecipe.packagingIngredients || [])];
                                                                updated[idx].materialId = e.target.value;
                                                                setEditingRecipe({ ...editingRecipe, packagingIngredients: updated });
                                                            }} style={{ flex: 3, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }}>
                                                                <option value="">-- Choose Packaging Material --</option>
                                                                {rawMaterials
                                                                    .filter(r => r.id === ing.materialId || !(editingRecipe.packagingIngredients || []).some((otherIng, otherIdx) => otherIdx !== idx && otherIng.materialId === r.id))
                                                                    .map(r => (
                                                                        <option key={r.id} value={r.id}>
                                                                            {r.name} (₹{getRawMaterialUnitPrice(r).toFixed(3)}/{r.unit})
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                            <input type="number" step="0.001" placeholder="Qty used" value={ing.quantity} onChange={e => {
                                                                const updated = [...(editingRecipe.packagingIngredients || [])];
                                                                updated[idx].quantity = e.target.value;
                                                                setEditingRecipe({ ...editingRecipe, packagingIngredients: updated });
                                                            }} style={{ flex: 1.5, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                                            <span style={{ fontSize: '0.85rem', color: '#64748b', minWidth: '30px' }}>{raw?.unit || ''}</span>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0369a1', minWidth: '60px' }}>
                                                                ₹{(raw ? getRawMaterialUnitPrice(raw) * (parseFloat(ing.quantity) || 0) : 0).toFixed(2)}
                                                            </span>
                                                            <button type="button" onClick={() => {
                                                                const updated = (editingRecipe.packagingIngredients || []).filter((_, i) => i !== idx);
                                                                setEditingRecipe({ ...editingRecipe, packagingIngredients: updated });
                                                            }} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>Delete</button>
                                                        </div>
                                                    );
                                                })}
                                                <button type="button" onClick={() => {
                                                    const updated = [...(editingRecipe.packagingIngredients || []), { materialId: '', quantity: '' }];
                                                    setEditingRecipe({ ...editingRecipe, packagingIngredients: updated });
                                                }} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', color: '#475569', fontSize: '0.8rem', marginTop: '5px' }}>
                                                    + Add Packaging Material
                                                </button>
                                            </div>
 
                                            {/* Toppings Section */}
                                            <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1rem', background: '#f8fafc' }}>
                                                <h5 style={{ margin: '0 0 10px 0', fontWeight: '700', color: '#1e293b' }}>Toppings & Variants Configuration (e.g. Salakatia Toppings)</h5>
                                                {(editingRecipe.toppings || []).map((topping, tIdx) => (
                                                    <div key={tIdx} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
                                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '10px', flexWrap: 'wrap' }}>
                                                            <div style={{ flex: 2, minWidth: '160px' }}>
                                                                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '700', color: '#64748b', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Topping / Variant Name</label>
                                                                <input type="text" placeholder="e.g. Nutella, Pistachio, Original" value={topping.name} onChange={e => {
                                                                    const updated = [...editingRecipe.toppings];
                                                                    updated[tIdx].name = e.target.value;
                                                                    setEditingRecipe({ ...editingRecipe, toppings: updated });
                                                                }} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '700' }} required />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '700', color: 'transparent', marginBottom: '3px' }}>-</label>
                                                                <button type="button" onClick={() => {
                                                                    setEditingRecipe({ ...editingRecipe, toppings: editingRecipe.toppings.filter((_, i) => i !== tIdx) });
                                                                }} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', whiteSpace: 'nowrap' }}>Delete Topping</button>
                                                            </div>
                                                        </div>

                                                        {/* Topping Ingredients */}
                                                        <div style={{ paddingLeft: '20px', borderLeft: '3px solid #0ea5e9' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Topping Ingredients:</span>
                                                            {(topping.ingredients || []).map((ing, ingIdx) => {
                                                                const options = ing.type === 'raw' ? rawMaterials : bundleItems;
                                                                const matchItem = options.find(o => o.id === ing.id);
                                                                return (
                                                                    <div key={ingIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                                                                        <select value={ing.type} onChange={e => {
                                                                            const updated = [...editingRecipe.toppings];
                                                                            updated[tIdx].ingredients[ingIdx].type = e.target.value;
                                                                            updated[tIdx].ingredients[ingIdx].id = '';
                                                                            updated[tIdx].ingredients[ingIdx].unit = e.target.value === 'raw' ? '' : 'g';
                                                                            setEditingRecipe({ ...editingRecipe, toppings: updated });
                                                                        }} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', fontSize: '0.8rem' }}>
                                                                            <option value="raw">🌾 Raw</option>
                                                                            <option value="bundle">📦 Prep</option>
                                                                        </select>
                                                                        <select value={ing.id} onChange={e => {
                                                                            const updated = [...editingRecipe.toppings];
                                                                            updated[tIdx].ingredients[ingIdx].id = e.target.value;
                                                                            const selectedOption = options.find(o => o.id === e.target.value);
                                                                            updated[tIdx].ingredients[ingIdx].unit = ing.type === 'raw' ? (selectedOption?.unit || 'g') : (selectedOption?.yieldUnit || 'g');
                                                                            setEditingRecipe({ ...editingRecipe, toppings: updated });
                                                                        }} style={{ flex: 1, padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', fontSize: '0.8rem' }}>
                                                                            <option value="">-- Choose Ingredient --</option>
                                                                            {options
                                                                                .filter(o => o.id === ing.id || !(topping.ingredients || []).some((otherIng, otherIdx) => otherIdx !== ingIdx && otherIng.type === ing.type && otherIng.id === o.id))
                                                                                .map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                                                        </select>
                                                                        <input type="number" step="0.001" placeholder="Qty" value={ing.quantity} onChange={e => {
                                                                            const updated = [...editingRecipe.toppings];
                                                                            updated[tIdx].ingredients[ingIdx].quantity = e.target.value;
                                                                            setEditingRecipe({ ...editingRecipe, toppings: updated });
                                                                        }} style={{ width: '80px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem' }} />
                                                                        
                                                                        {ing.type === 'raw' ? (
                                                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{matchItem?.unit || ''}</span>
                                                                        ) : (
                                                                            <select value={ing.unit || matchItem?.yieldUnit || 'g'} onChange={e => {
                                                                                const updated = [...editingRecipe.toppings];
                                                                                updated[tIdx].ingredients[ingIdx].unit = e.target.value;
                                                                                setEditingRecipe({ ...editingRecipe, toppings: updated });
                                                                            }} style={{ padding: '4px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', background: 'white' }}>
                                                                                <option value="g">g</option>
                                                                                <option value="ml">ml</option>
                                                                                <option value="pcs">pcs</option>
                                                                            </select>
                                                                        )}

                                                                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0369a1', minWidth: '40px' }}>
                                                                            {matchItem ? `₹${(parseFloat(ing.quantity) ? (ing.type === 'raw' ? getRawMaterialUnitPrice(matchItem) * parseFloat(ing.quantity) : getBundleIngredientCost(matchItem, ing.quantity, ing.unit)) : 0).toFixed(2)}` : '₹0.00'}
                                                                        </span>
                                                                        <button type="button" onClick={() => {
                                                                            const updated = [...editingRecipe.toppings];
                                                                            updated[tIdx].ingredients = updated[tIdx].ingredients.filter((_, i) => i !== ingIdx);
                                                                            setEditingRecipe({ ...editingRecipe, toppings: updated });
                                                                        }} style={{ border: 'none', background: 'transparent', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer' }}>🗑️</button>
                                                                    </div>
                                                                );
                                                            })}
                                                            <button type="button" onClick={() => {
                                                                const updated = [...editingRecipe.toppings];
                                                                updated[tIdx].ingredients = [...(updated[tIdx].ingredients || []), { type: 'raw', id: '', quantity: '', unit: '' }];
                                                                setEditingRecipe({ ...editingRecipe, toppings: updated });
                                                            }} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: '700', color: '#475569', fontSize: '0.72rem', marginTop: '6px', display: 'block' }}>
                                                                + Add Ingredient to Topping
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => {
                                                    setEditingRecipe({ ...editingRecipe, toppings: [...(editingRecipe.toppings || []), { name: '', ingredients: [], packagingCost: '0' }] });
                                                }} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', color: '#475569', fontSize: '0.8rem', marginTop: '5px' }}>
                                                    + Add Topping Variant
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                                                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', background: '#e0f2fe', padding: '8px 16px', borderRadius: '8px' }}>
                                                    Total Cost: ₹{ (
                                                        (editingRecipe.ingredients || []).reduce((acc, i) => {
                                                            const match = i.type === 'raw' ? rawMaterials.find(r => r.id === i.id) : bundleItems.find(b => b.id === i.id);
                                                            if(!match || !parseFloat(i.quantity)) return acc;
                                                            return acc + (i.type === 'raw' ? getRawMaterialUnitPrice(match) * parseFloat(i.quantity) : getBundleIngredientCost(match, i.quantity, i.unit));
                                                        }, 0) +
                                                        (editingRecipe.packagingIngredients || []).reduce((acc, i) => {
                                                            const raw = rawMaterials.find(r => r.id === i.materialId);
                                                            if(!raw || !parseFloat(i.quantity)) return acc;
                                                            return acc + getRawMaterialUnitPrice(raw) * parseFloat(i.quantity);
                                                        }, 0) + 
                                                        parseFloat(editingRecipe.overheadAllocation || 0)
                                                    ).toFixed(2) }
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button type="submit" style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: '700', cursor: 'pointer' }}>💾 Save Costing Configuration</button>
                                                    <button type="button" onClick={() => setSelectedRecipeProduct(null)} style={{ background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 24px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                                    <h3 style={{ margin: 0, color: '#1e293b', fontWeight: '800' }}>Final Menu Product Cost Analysis</h3>
                                    <div style={{ display: 'flex', gap: '10px' }}>

                                        <button type="button" onClick={handleExportRecipeCosts} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            📊 Export Pricing CSV
                                        </button>
                                    </div>
                                </div>

                                {/* Kitchen Fixed Cost Overhead Selector */}
                                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>🏭 Select Kitchen Hub</label>
                                        <select value={selectedOverheadKitchenId} onChange={e => setSelectedOverheadKitchenId(e.target.value)} style={{ padding: '8px 12px', background: 'white', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem', color: '#334155', border: '1px solid #cbd5e1' }}>
                                            <option value="">-- Select Kitchen to View Overheads --</option>
                                            {kitchens.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>📦 Estimated Pieces Sold / Month</label>
                                        <input type="number" value={monthlyPiecesSold} onChange={e => setMonthlyPiecesSold(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', maxWidth: '180px', fontWeight: '700' }} />
                                    </div>
                                    {(() => {
                                        const selectedK = kitchens.find(k => k.id === selectedOverheadKitchenId);
                                        const totalFixed = selectedK ? (selectedK.fixedCosts || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) : 0;
                                        const perPiece = parseFloat(monthlyPiecesSold) > 0 ? (totalFixed / parseFloat(monthlyPiecesSold)) : 0;
                                        return (
                                            <div style={{ marginLeft: 'auto', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 16px', borderRadius: '12px', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                <div>
                                                    <span style={{ fontSize: '0.68rem', color: '#065f46', textTransform: 'uppercase', display: 'block', fontWeight: '800' }}>Monthly Fixed Cost</span>
                                                    <strong style={{ fontSize: '1.1rem', color: '#047857' }}>₹{totalFixed.toFixed(2)}</strong>
                                                </div>
                                                <div style={{ borderLeft: '1px solid #a7f3d0', paddingLeft: '1.5rem' }}>
                                                    <span style={{ fontSize: '0.68rem', color: '#065f46', textTransform: 'uppercase', display: 'block', fontWeight: '800' }}>Kitchen Overhead Per Piece</span>
                                                    <strong style={{ fontSize: '1.1rem', color: '#047857' }}>₹{perPiece.toFixed(2)}</strong>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div style={{ overflowX: 'auto', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1200px' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                                                <th style={{ padding: '14px 20px', fontWeight: '800', color: '#0f172a', fontSize: '0.85rem' }}>Product Name</th>
                                                <th style={{ padding: '14px 20px', fontWeight: '800', color: '#0f172a', fontSize: '0.85rem' }}>Raw Cost</th>
                                                <th style={{ padding: '14px 20px', fontWeight: '800', color: '#0f172a', fontSize: '0.85rem' }}>Packing Cost</th>
                                                <th style={{ padding: '14px 20px', fontWeight: '800', color: '#0f172a', fontSize: '0.85rem' }}>Overhead Allocation</th>
                                                <th style={{ padding: '14px 20px', fontWeight: '800', color: '#0f172a', fontSize: '0.85rem' }}>Kitchen Overhead</th>
                                                <th style={{ padding: '14px 20px', fontWeight: '800', color: '#16a34a', fontSize: '0.85rem' }}>Total Cost</th>
                                                <th style={{ padding: '14px 20px', fontWeight: '800', color: '#0284c7', fontSize: '0.85rem' }}>Suggested Price (2x)</th>
                                                <th style={{ padding: '14px 20px', fontWeight: '800', color: '#e11d48', fontSize: '0.85rem' }}>Retail Price</th>
                                                <th style={{ padding: '14px 20px', fontWeight: '800', color: '#0f766e', fontSize: '0.85rem' }}>Profit (₹)</th>
                                                <th style={{ padding: '14px 20px', fontWeight: '800', color: '#b45309', fontSize: '0.85rem' }}>Margin (%)</th>
                                                <th style={{ padding: '14px 20px', fontWeight: '800', color: '#0f172a', fontSize: '0.85rem' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map(prod => {
                                                const currentRecipe = recipesList.find(r => r.id === prod.id);
                                                const activeToppingIndex = selectedToppings[prod.id] !== undefined ? selectedToppings[prod.id] : -1;
                                                const analysis = getProductRecipeCost(prod.id, activeToppingIndex);
                                                const retailPrice = parseFloat(prod.price) || 0;
                                                return (
                                                    <tr key={prod.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '14px 20px', color: '#1e293b' }}>
                                                            <div style={{ fontWeight: '700' }}>{prod.name}</div>
                                                            {currentRecipe?.toppings && currentRecipe.toppings.length > 0 && (
                                                                <div style={{ marginTop: '6px' }}>
                                                                    <select value={activeToppingIndex} onChange={e => {
                                                                        setSelectedToppings({ ...selectedToppings, [prod.id]: parseInt(e.target.value) });
                                                                    }} style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.72rem', background: '#f8fafc', fontWeight: '700', color: '#0f172a' }}>
                                                                        <option value="-1">Base Only</option>
                                                                        {currentRecipe.toppings.map((top, idx) => (
                                                                            <option key={idx} value={idx}>+ Topping: {top.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '14px 20px', color: '#475569' }}>₹{analysis.ingredientsCost.toFixed(2)}</td>
                                                        <td style={{ padding: '14px 20px', color: '#475569' }}>
                                                             ₹{analysis.packagingCost.toFixed(2)}
                                                             {currentRecipe?.packagingIngredients && currentRecipe.packagingIngredients.length > 0 && (
                                                                 <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>
                                                                     ({currentRecipe.packagingIngredients.map(ing => {
                                                                         const raw = rawMaterials.find(r => r.id === ing.materialId);
                                                                         return raw ? `${raw.name.slice(0, 8)}:${ing.quantity}` : '';
                                                                     }).filter(Boolean).join(', ')})
                                                                 </span>
                                                             )}
                                                         </td>
                                                        <td style={{ padding: '14px 20px', color: '#475569' }}>
                                                            ₹{analysis.overheadCost.toFixed(2)}
                                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>(batch: {currentRecipe?.batchSize || 1})</span>
                                                        </td>
                                                        <td style={{ padding: '14px 20px', color: '#475569' }}>₹{analysis.fixedCostPerPiece.toFixed(2)}</td>
                                                        <td style={{ padding: '14px 20px', fontWeight: '800', color: '#16a34a' }}>
                                                            ₹{analysis.totalUnitCost.toFixed(2)}
                                                            {analysis.toppingCost > 0 && (
                                                                <span style={{ display: 'block', fontSize: '0.7rem', color: '#0ea5e9' }}>
                                                                    (Base: ₹{(analysis.totalUnitCost - analysis.toppingCost).toFixed(2)} + Topping: ₹{analysis.toppingCost.toFixed(2)})
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontWeight: '800', color: '#0284c7' }}>₹{(analysis.totalUnitCost * 2).toFixed(2)}</td>
                                                        <td style={{ padding: '14px 20px', fontWeight: '800', color: '#e11d48' }}>₹{retailPrice.toFixed(2)}</td>
                                                        {(() => {
                                                            const profit = retailPrice - analysis.totalUnitCost;
                                                            const margin = retailPrice > 0 ? (profit / retailPrice) * 100 : 0;
                                                            const profitColor = profit >= 0 ? '#0f766e' : '#ef4444';
                                                            return (
                                                                <>
                                                                    <td style={{ padding: '14px 20px', fontWeight: '800', color: profitColor }}>₹{profit.toFixed(2)}</td>
                                                                    <td style={{ padding: '14px 20px', fontWeight: '800', color: profitColor }}>{margin.toFixed(1)}%</td>
                                                                </>
                                                            );
                                                        })()}
                                                        <td style={{ padding: '14px 20px' }}>
                                                            {(!isReadOnly && !isChef) ? (
                                                                <button onClick={() => {
                                                                    const productToppingsList = Array.isArray(prod.toppings) 
                                                                        ? prod.toppings 
                                                                        : (prod.toppings ? prod.toppings.split(',').map(t => t.trim()) : []);
                                                                    const recipeToppings = (currentRecipe?.toppings && currentRecipe.toppings.length > 0)
                                                                        ? currentRecipe.toppings
                                                                        : productToppingsList.map(tName => ({
                                                                            name: tName,
                                                                            ingredients: [],
                                                                            packagingCost: '0',
                                                                            stickerCost: '0'
                                                                        }));
                                                                    setSelectedRecipeProduct(prod);
                                                                    setEditingRecipe({
                                                                        ingredients: currentRecipe?.ingredients || [],
                                                                        packagingIngredients: currentRecipe?.packagingIngredients || [],
                                                                        packagingCost: (currentRecipe?.packagingCost || 0).toString(),
                                                                        batchSize: (currentRecipe?.batchSize || 1).toString(),
                                                                        overheadAllocation: (currentRecipe?.overheadAllocation || 0).toString(),
                                                                        kitchenId: currentRecipe?.kitchenId || '',
                                                                        toppings: recipeToppings
                                                                    });
                                                                }} style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>
                                                                    Configure Costing
                                                                </button>
                                                            ) : (
                                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Read-only</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {costingSubTab === 'fixed' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, color: '#1e293b', fontWeight: '800' }}>Kitchen Fixed Costs</h3>
                                    <button onClick={async () => {
                                        const name = window.prompt("Enter new Kitchen Name (e.g. Indiranagar Central Kitchen):");
                                        if(!name) return;
                                        const city = window.prompt("Enter Kitchen City (e.g. Bengaluru):");
                                        if(!city) return;
                                        try {
                                            const newK = await db.addKitchen({ name, city, fixedCosts: [] });
                                            setKitchens([...kitchens, newK]);
                                            showToast("Kitchen added successfully!");
                                        } catch(e) {
                                            showToast("Error adding kitchen", "error");
                                        }
                                    }} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem' }}>
                                        + Add New Kitchen
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                                    {kitchens.map(kitchen => (
                                        <div key={kitchen.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <div>
                                                    <h4 style={{ margin: '0', color: '#0f172a', fontSize: '1.1rem' }}>{kitchen.name}</h4>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>📍 {kitchen.city}</span>
                                                </div>
                                                <button onClick={async () => {
                                                    if(window.confirm(`Delete ${kitchen.name}?`)) {
                                                        await db.deleteKitchen(kitchen.id);
                                                        setKitchens(kitchens.filter(k => k.id !== kitchen.id));
                                                        showToast("Kitchen deleted");
                                                    }
                                                }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem' }}>
                                                {(kitchen.fixedCosts || []).map((cost, idx) => (
                                                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <input type="text" placeholder="Expense (e.g. Rent)" value={cost.name} onChange={e => {
                                                            const updated = kitchens.map(k => {
                                                                if(k.id === kitchen.id) {
                                                                    const updatedCosts = [...(k.fixedCosts || [])];
                                                                    updatedCosts[idx].name = e.target.value;
                                                                    return { ...k, fixedCosts: updatedCosts };
                                                                }
                                                                return k;
                                                            });
                                                            setKitchens(updated);
                                                        }} style={{ flex: 2, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                                                        
                                                        <input type="number" placeholder="₹ Amount" value={cost.amount} onChange={e => {
                                                            const updated = kitchens.map(k => {
                                                                if(k.id === kitchen.id) {
                                                                    const updatedCosts = [...(k.fixedCosts || [])];
                                                                    updatedCosts[idx].amount = e.target.value;
                                                                    return { ...k, fixedCosts: updatedCosts };
                                                                }
                                                                return k;
                                                            });
                                                            setKitchens(updated);
                                                        }} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                                                        
                                                        <button type="button" onClick={() => {
                                                            const updated = kitchens.map(k => {
                                                                if(k.id === kitchen.id) {
                                                                    const updatedCosts = (k.fixedCosts || []).filter((_, i) => i !== idx);
                                                                    return { ...k, fixedCosts: updatedCosts };
                                                                }
                                                                return k;
                                                            });
                                                            setKitchens(updated);
                                                        }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>🗑️</button>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <button type="button" onClick={() => {
                                                    const updated = kitchens.map(k => {
                                                        if(k.id === kitchen.id) {
                                                            return { ...k, fixedCosts: [...(k.fixedCosts || []), { name: '', amount: '' }] };
                                                        }
                                                        return k;
                                                    });
                                                    setKitchens(updated);
                                                }} style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}>
                                                    + Add Fixed Cost
                                                </button>
                                                
                                                <button onClick={async () => {
                                                    try {
                                                        await db.updateKitchen(kitchen.id, kitchen);
                                                        showToast(`${kitchen.name} costs saved!`);
                                                    } catch(e) {
                                                        showToast("Error saving kitchen costs", "error");
                                                    }
                                                }} style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}>
                                                    💾 Save
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <h3 style={{ margin: '2rem 0 1rem 0', color: '#1e293b', fontWeight: '800' }}>Outlet Fixed Costs</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                    {runningFranchises.map(franchise => (
                                        <div key={franchise.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                            <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1rem' }}>{franchise.outletName}</h4>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem' }}>
                                                {(franchise.fixedCosts || []).map((cost, idx) => (
                                                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <input type="text" placeholder="Expense (e.g. Rent)" value={cost.name} onChange={e => {
                                                            const updatedFranchises = runningFranchises.map(f => {
                                                                if(f.id === franchise.id) {
                                                                    const updatedCosts = [...(f.fixedCosts || [])];
                                                                    updatedCosts[idx].name = e.target.value;
                                                                    return { ...f, fixedCosts: updatedCosts };
                                                                }
                                                                return f;
                                                            });
                                                            setRunningFranchises(updatedFranchises);
                                                        }} style={{ flex: 2, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                                                        
                                                        <input type="number" placeholder="₹ Amount" value={cost.amount} onChange={e => {
                                                            const updatedFranchises = runningFranchises.map(f => {
                                                                if(f.id === franchise.id) {
                                                                    const updatedCosts = [...(f.fixedCosts || [])];
                                                                    updatedCosts[idx].amount = e.target.value;
                                                                    return { ...f, fixedCosts: updatedCosts };
                                                                }
                                                                return f;
                                                            });
                                                            setRunningFranchises(updatedFranchises);
                                                        }} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                                                        
                                                        <button type="button" onClick={() => {
                                                            const updatedFranchises = runningFranchises.map(f => {
                                                                if(f.id === franchise.id) {
                                                                    const updatedCosts = (f.fixedCosts || []).filter((_, i) => i !== idx);
                                                                    return { ...f, fixedCosts: updatedCosts };
                                                                }
                                                                return f;
                                                            });
                                                            setRunningFranchises(updatedFranchises);
                                                        }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>🗑️</button>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <button type="button" onClick={() => {
                                                    const updatedFranchises = runningFranchises.map(f => {
                                                        if(f.id === franchise.id) {
                                                            return { ...f, fixedCosts: [...(f.fixedCosts || []), { name: '', amount: '' }] };
                                                        }
                                                        return f;
                                                    });
                                                    setRunningFranchises(updatedFranchises);
                                                }} style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}>
                                                    + Add Fixed Cost
                                                </button>
                                                
                                                <button onClick={async () => {
                                                    try {
                                                        await db.updateFranchiseOutlet(franchise.id, franchise);
                                                        showToast(`${franchise.outletName} costs saved!`);
                                                    } catch(e) {
                                                        showToast("Error saving outlet costs", "error");
                                                    }
                                                }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}>
                                                    💾 Save
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {costingSubTab === 'sop' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '15px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: '#1e293b', fontWeight: '800' }}>📖 Kitchen SOP & Recipe Manual</h3>
                                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.8rem' }}>Displaying standardized batches, serving tools, and cost metrics for kitchen staff.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            let fullMarkdown = '';
                                            bundleItems.forEach(bundle => {
                                                const details = getBundleSopDetails(bundle);
                                                let tableRows = '';
                                                (bundle.ingredients || []).forEach(ing => {
                                                    const raw = rawMaterials.find(r => r.id === ing.materialId);
                                                    tableRows += `| ${raw?.name || 'Unknown'} | ${(ing.quantity || 0)} ${raw?.unit || ''} |\n`;
                                                });
                                                fullMarkdown += `\n---\n\n# ${bundle.name.toUpperCase()}\n\n### Batch Information\n\n* **Batch Yield:** ${details.yieldPortions} Portions\n* **Total Batch Weight:** ${details.totalWeight} g\n* **Standard Portion Size:** **${details.portionSize.toFixed(0)} g**\n* **Batch Cost:** ₹${details.batchCost.toFixed(2)}\n* **Cost Per Portion:** ₹${details.costPerPortion.toFixed(2)}\n\n### Ingredients\n\n| Ingredient | Qty |\n| --- | ---: |\n${tableRows}\n`;
                                            });
                                            navigator.clipboard.writeText(fullMarkdown);
                                            showToast('Copied full manual to clipboard! 📋');
                                        }}
                                        style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        📋 Copy Full Manual (Markdown)
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                    {bundleItems.map(bundle => {
                                        const details = getBundleSopDetails(bundle);
                                        const usedProducts = getProductsUsingBundle(bundle.id);
                                        const copyCardHandler = () => {
                                            let tableRows = '';
                                            (bundle.ingredients || []).forEach(ing => {
                                                const raw = rawMaterials.find(r => r.id === ing.materialId);
                                                tableRows += `| ${raw?.name || 'Unknown'} | ${(ing.quantity || 0)} ${raw?.unit || ''} |\n`;
                                            });
                                            const usesText = usedProducts.length > 0 ? `\n* **Used In Products:** ${usedProducts.map(p => p.name).join(', ')}` : '';
                                            const cardMd = `\n---\n\n# ${bundle.name.toUpperCase()}\n\n### Batch Information\n\n* **Batch Yield:** ${details.yieldPortions} Pieces / Portions (1 Batch / Tray)\n* **Total Batch Weight:** ${details.totalWeight} g\n* **Standard Portion Size:** **${details.portionSize.toFixed(0)} g**\n* **Serving Tool:** ${bundle.servingTool || 'Standard Scoop'}\n* **Batch Cost:** ₹${details.batchCost.toFixed(2)}\n* **Cost Per Portion:** ₹${details.costPerPortion.toFixed(2)}${usesText}\n\n### Ingredients\n\n| Ingredient | Qty |\n| --- | ---: |\n${tableRows}\n`;
                                            navigator.clipboard.writeText(cardMd);
                                            showToast(`Copied ${bundle.name} SOP! 📋`);
                                        };
                                        return (
                                            <div key={bundle.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative' }}>
                                                <button 
                                                    onClick={copyCardHandler}
                                                    style={{ position: 'absolute', top: '15px', right: '15px', background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                                                >
                                                    Copy Card
                                                </button>
                                                
                                                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#0f172a', fontWeight: '900', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px' }}>
                                                    {bundle.name.toUpperCase()}
                                                </h3>

                                                {usedProducts.length > 0 && (
                                                    <div style={{ marginBottom: '12px', fontSize: '0.72rem', color: '#0ea5e9', fontWeight: '700', background: '#f0f9ff', padding: '6px 10px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                                        🧠 Used in: {usedProducts.map(p => p.name).join(', ')}
                                                    </div>
                                                )}

                                                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Batch Information
                                                </h4>
                                                
                                                <ul style={{ margin: '0 0 1.2rem 0', paddingLeft: '20px', fontSize: '0.88rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px', listStyleType: 'disc' }}>
                                                    <li><strong>Batch Yield / Tray:</strong> {details.yieldPortions} Pieces / Portions</li>
                                                    <li><strong>Total Batch Weight:</strong> {details.totalWeight} g</li>
                                                    <li><strong>Standard Piece Weight:</strong> <span style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>{details.portionSize.toFixed(0)} g</span></li>
                                                    <li><strong>Serving Tool:</strong> <span style={{ fontStyle: 'italic', color: '#0ea5e9', fontWeight: 'bold' }}>{bundle.servingTool || 'Standard Scoop'}</span></li>
                                                    <li><strong>Batch Cost:</strong> ₹{details.batchCost.toFixed(2)}</li>
                                                    <li><strong>Cost Per Piece / Portion:</strong> ₹{details.costPerPortion.toFixed(2)}</li>
                                                </ul>

                                                {bundle.ingredients && bundle.ingredients.length > 0 && (
                                                    <>
                                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            Ingredients
                                                        </h4>

                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                                                            <thead>
                                                                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                                                    <th style={{ padding: '6px 0', color: '#64748b' }}>Ingredient</th>
                                                                    <th style={{ padding: '6px 0', textAlign: 'right', color: '#64748b' }}>Qty</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(bundle.ingredients || []).map((ing, idx) => {
                                                                    const raw = rawMaterials.find(r => r.id === ing.materialId);
                                                                    return (
                                                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                            <td style={{ padding: '6px 0', color: '#334155', fontWeight: '600' }}>{raw?.name || 'Unknown'}</td>
                                                                            <td style={{ padding: '6px 0', textAlign: 'right', color: '#475569', fontWeight: '700' }}>{ing.quantity} {raw?.unit || ''}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}

            {activeTab === 'blogs' && (() => {
                const handleBlogSave = async () => {
                    try {
                        if (editingBlog) {
                            await db.updateBlog(editingBlog.id, newBlog);
                            setBlogs(blogs.map(b => b.id === editingBlog.id ? { ...newBlog, id: editingBlog.id } : b));
                        } else {
                            const created = await db.addBlog(newBlog);
                            setBlogs([created, ...blogs]);
                        }
                        setShowAddBlogForm(false);
                        setEditingBlog(null);
                        setNewBlog({ title: '', content: '', author: 'Admin', tags: '', image: '' });
                        alert('Blog saved successfully');
                    } catch (err) {
                        console.error(err);
                        alert('Error saving blog');
                    }
                };

                const handleDeleteBlog = async (id) => {
                    if (window.confirm('Delete this blog?')) {
                        await db.deleteBlog(id);
                        setBlogs(blogs.filter(b => b.id !== id));
                    }
                };

                return (
                    <div className={styles.tabContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 className={styles.tabTitle}>Blog Management</h2>
                            <button className={styles.addButton} onClick={() => { setShowAddBlogForm(true); setEditingBlog(null); setNewBlog({ title: '', content: '', author: 'Admin', tags: '', image: '' }); }}>+ Add Blog</button>
                        </div>
                        
                        {showAddBlogForm ? (
                            <div className={styles.formCard}>
                                <h3>{editingBlog ? 'Edit Blog' : 'Add New Blog'}</h3>
                                <div className={styles.formGroup}>
                                    <label>Title</label>
                                    <input className={styles.input} type="text" value={newBlog.title} onChange={e => setNewBlog({...newBlog, title: e.target.value})} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Image URL</label>
                                    <input className={styles.input} type="text" value={newBlog.image} onChange={e => setNewBlog({...newBlog, image: e.target.value})} placeholder="https://..." />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Author</label>
                                    <input className={styles.input} type="text" value={newBlog.author} onChange={e => setNewBlog({...newBlog, author: e.target.value})} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Tags</label>
                                    <input className={styles.input} type="text" value={newBlog.tags} onChange={e => setNewBlog({...newBlog, tags: e.target.value})} placeholder="e.g. Recipes, News" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Content</label>
                                    <textarea className={styles.input} style={{minHeight: '200px'}} value={newBlog.content} onChange={e => setNewBlog({...newBlog, content: e.target.value})} />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className={styles.saveButton} onClick={handleBlogSave}>Save Blog</button>
                                    <button className={styles.cancelButton} onClick={() => setShowAddBlogForm(false)}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead><tr><th>Title</th><th>Author</th><th>Date</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {blogs.map(blog => (
                                            <tr key={blog.id}>
                                                <td>{blog.title}</td>
                                                <td>{blog.author}</td>
                                                <td>{new Date(blog.date).toLocaleDateString()}</td>
                                                <td>
                                                    <button onClick={() => { setEditingBlog(blog); setNewBlog(blog); setShowAddBlogForm(true); }} className={styles.actionBtn} style={{background: '#e0f2fe', color: '#0284c7', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px'}}>Edit</button>
                                                    <button onClick={() => handleDeleteBlog(blog.id)} className={styles.actionBtn} style={{background: '#fee2e2', color: '#dc2626', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })()}

            {activeTab === 'connect' && (() => {
                const downloadQR = () => {
                    const canvas = document.getElementById('qr-canvas');
                    if (canvas) {
                        const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
                        let downloadLink = document.createElement('a');
                        downloadLink.href = pngUrl;
                        downloadLink.download = 'highlaban-connect-qr.png';
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                    }
                };

                const handleLinksSave = async () => {
                    try {
                        const saved = await db.saveSocialLinks(socialLinks);
                        setSocialLinks(saved);
                        alert('Social links saved successfully!');
                    } catch (error) {
                        alert('Error saving links.');
                    }
                };

                return (
                    <div className={styles.tabContent}>
                        <h2 className={styles.tabTitle}>Social Links & Connect Page</h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px' }}>
                            <div className={styles.formCard}>
                                <h3>Manage Links</h3>
                                <p style={{color: '#64748b', marginBottom: '20px', fontSize: '0.9rem'}}>These links power your public <a href="/connect" target="_blank" style={{color: '#0ea5e9'}}>Connect Page</a>.</p>
                                
                                {['bannerTitle', 'bannerDescription', 'instagram', 'whatsapp', 'linkedin', 'website', 'menu', 'orderZomato', 'orderSwiggy', 'orderMagicPin', 'orderOwnly'].map(field => {
                                    const getFieldLabel = (f) => {
                                        if (f === 'bannerTitle') return 'Connect Page Banner Title';
                                        if (f === 'bannerDescription') return 'Connect Page Banner Description';
                                        return f.replace('order', 'Order ').replace(/([A-Z])/g, ' $1').trim() + ' URL';
                                    };
                                    return (
                                        <div className={styles.formGroup} key={field}>
                                            <label style={{textTransform: 'capitalize'}}>{getFieldLabel(field)}</label>
                                            <input className={styles.input} type="text" value={socialLinks[field] || ''} onChange={e => setSocialLinks({...socialLinks, [field]: e.target.value})} placeholder={`Enter ${field} details...`} />
                                        </div>
                                    );
                                })}
                                
                                <button className={styles.saveButton} onClick={handleLinksSave}>Save All Links</button>
                            </div>

                            <div className={styles.formCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: 'fit-content' }}>
                                <h3>Permanent QR Code</h3>
                                <p style={{color: '#64748b', marginBottom: '20px', fontSize: '0.9rem'}}>This QR directly links to <strong>highlaban.web.app/connect</strong> and never expires.</p>
                                
                                <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                    <QRCodeCanvas id="qr-canvas" value="https://highlaban.web.app/connect" size={200} level="H" />
                                </div>

                                <button onClick={downloadQR} className={styles.saveButton} style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                                    <FiDownload /> Download QR PNG
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            </main>

            {/* EDIT MODAL */}
            {
                editingProduct && (
                    <div className={styles.modalOverlay} onClick={() => setEditingProduct(null)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Edit Product</h2>

                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                {/* Image Edit */}
                                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
                                        {editingProduct.images && editingProduct.images.length > 0 ? (
                                            editingProduct.images.map((imgObj, index) => {
                                                const url = typeof imgObj === 'string' ? imgObj : imgObj.url;
                                                const tag = typeof imgObj === 'string' ? '' : imgObj.tag;
                                                return (
                                                    <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                                        <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                            <img src={url} alt={`Product ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveImage(index, 'edit')}
                                                                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                                                ✕
                                                            </button>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Tag"
                                                            value={tag}
                                                            onChange={(e) => handleImageTagChange(index, e.target.value, 'edit')}
                                                            style={{ width: '80px', fontSize: '0.7rem', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                        />
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                <img src={editingProduct.img || 'https://placehold.co/200'} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                        {/* Add Button */}
                                        <div
                                            onClick={() => document.getElementById(`edit-file-${editingProduct.id}`).click()}
                                            style={{ width: '80px', height: '80px', borderRadius: '12px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f8fafc' }}>
                                            <span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>+</span>
                                        </div>
                                    </div>
                                    <br />
                                    <input type="file" id={`edit-file-${editingProduct.id}`} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'edit', editingProduct.id)} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Name</label>
                                        <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className={styles.footerField} style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Ingredients</label>
                                        <input type="text" value={editingProduct.ingredients || ''} onChange={e => setEditingProduct({ ...editingProduct, ingredients: e.target.value })} className={styles.footerField} style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Price (₹)</label>
                                        <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} className={styles.footerField} style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Tag</label>
                                        <input type="text" value={editingProduct.tag || ''} onChange={e => setEditingProduct({ ...editingProduct, tag: e.target.value })} className={styles.footerField} style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Badge</label>
                                        <input type="text" value={editingProduct.badge || ''} onChange={e => setEditingProduct({ ...editingProduct, badge: e.target.value })} className={styles.footerField} style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                    </div>
                                </div>

                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', marginTop: '0.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>✨ Customize Toppings (Added Toppings count as extra varieties)</label>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <input 
                                            type="text" 
                                            id="edit-topping-input"
                                            placeholder="Type topping name (e.g. Nutella) and press Enter or click Add" 
                                            className={styles.footerField} 
                                            style={{ background: 'white', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', flex: 1, outline: 'none' }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const val = e.target.value.trim();
                                                    if (val && !(editingProduct.toppings || []).includes(val)) {
                                                        setEditingProduct(prev => ({ ...prev, toppings: [...(prev.toppings || []), val] }));
                                                        e.target.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const el = document.getElementById('edit-topping-input');
                                                const val = el ? el.value.trim() : '';
                                                if (val && !(editingProduct.toppings || []).includes(val)) {
                                                    setEditingProduct(prev => ({ ...prev, toppings: [...(prev.toppings || []), val] }));
                                                    el.value = '';
                                                }
                                            }}
                                            style={{ background: '#009ceb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                        >
                                            Add Topping
                                        </button>
                                    </div>
                                    
                                    {/* Tag list */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {(editingProduct.toppings || []).map((topping, idx) => (
                                            <span 
                                                key={idx} 
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid #cbd5e1', color: '#009ceb', padding: '4px 12px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold' }}
                                            >
                                                {topping}
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        const updated = (editingProduct.toppings || []).filter((_, i) => i !== idx);
                                                        setEditingProduct(prev => ({ ...prev, toppings: updated }));
                                                    }}
                                                    style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', padding: 0, display: 'flex', alignItems: 'center' }}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                        {(editingProduct.toppings || []).length === 0 && (
                                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>No toppings configured. Type a topping name above and click "Add Topping".</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Description</label>
                                    <textarea rows={4} value={editingProduct.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontFamily: 'inherit' }} />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <button onClick={() => setEditingProduct(null)} className={styles.cancelBtn}>Cancel</button>
                                    <button onClick={handleSaveEdit} className={styles.saveChangesBtn} disabled={isUploading}>
                                        <SaveIcon />
                                        {isUploading ? 'Saving...' : 'SAVE CHANGES'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* EDIT STAFF MODAL */}
            {
                editingStaff && (
                    <div className={styles.modalOverlay} onClick={() => setEditingStaff(null)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Edit Profile: {editingStaff.fullName}</h2>
                                <button type="button" onClick={() => setEditingStaff(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', padding: '0 0.5rem' }}>&times;</button>
                            </div>

                            <form onSubmit={handleUpdateStaff} className={styles.staffForm}>
                                
                                {/* SECTION 1: Personal Details */}
                                <div style={{ marginBottom: '1.2rem' }}>
                                    <h4 style={{ color: '#009ceb', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.2rem', fontWeight: 'bold' }}>1. Personal & Core Details</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                                        <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                                            <label>Full Name *</label>
                                            <input type="text" value={editingStaff.fullName} onChange={e => setEditingStaff({ ...editingStaff, fullName: e.target.value })} className={styles.input} required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Nickname / Call Name</label>
                                            <input type="text" value={editingStaff.nickname || ''} onChange={e => setEditingStaff({ ...editingStaff, nickname: e.target.value })} className={styles.input} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Gender</label>
                                            <select value={editingStaff.gender} onChange={e => setEditingStaff({ ...editingStaff, gender: e.target.value })} className={styles.input}>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                                            <label>Date of Birth</label>
                                            <input type="date" value={toInputDate(editingStaff.dob)} onChange={e => setEditingStaff({ ...editingStaff, dob: e.target.value })} className={styles.input} />
                                        </div>
                                        <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                                            <label>Blood Group</label>
                                            <input type="text" value={editingStaff.bloodGroup || ''} onChange={e => setEditingStaff({ ...editingStaff, bloodGroup: e.target.value })} className={styles.input} />
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2: Contact & Address Coordinates */}
                                <div style={{ marginBottom: '1.2rem' }}>
                                    <h4 style={{ color: '#009ceb', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.2rem', fontWeight: 'bold' }}>2. Contact & Address Coordinates</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                        <div className={styles.formGroup}>
                                            <label>Email ID</label>
                                            <input type="email" value={editingStaff.email || ''} onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })} className={styles.input} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Primary Mobile *</label>
                                            <input type="tel" value={editingStaff.phone} onChange={e => setEditingStaff({ ...editingStaff, phone: e.target.value })} className={styles.input} required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Alternate Contact</label>
                                            <input type="tel" value={editingStaff.alternatePhone || ''} onChange={e => setEditingStaff({ ...editingStaff, alternatePhone: e.target.value })} className={styles.input} />
                                        </div>
                                        <div className={styles.formGroup} style={{ gridColumn: 'span 3' }}>
                                            <label>Current Address (Bangalore Coordinates)</label>
                                            <textarea rows={2} value={editingStaff.currentAddress || ''} onChange={e => setEditingStaff({ ...editingStaff, currentAddress: e.target.value })} className={styles.input} />
                                        </div>
                                        <div className={styles.formGroup} style={{ gridColumn: 'span 3' }}>
                                            <label>Permanent Address (Home Base)</label>
                                            <textarea rows={2} value={editingStaff.permanentAddress || ''} onChange={e => setEditingStaff({ ...editingStaff, permanentAddress: e.target.value })} className={styles.input} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Emergency Contact Name</label>
                                            <input type="text" value={editingStaff.emergencyContact || ''} onChange={e => setEditingStaff({ ...editingStaff, emergencyContact: e.target.value })} className={styles.input} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Emergency Contact Phone</label>
                                            <input type="tel" value={editingStaff.emergencyPhone || ''} onChange={e => setEditingStaff({ ...editingStaff, emergencyPhone: e.target.value })} className={styles.input} />
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 3: Work Status & Financial Parameters */}
                                <div style={{ marginBottom: '1.2rem' }}>
                                    <h4 style={{ color: '#009ceb', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.2rem', fontWeight: 'bold' }}>3. Work Status & Financial Parameters</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                        <div className={styles.formGroup}>
                                            <label>Employment Status</label>
                                            <select value={editingStaff.status} onChange={e => setEditingStaff({ ...editingStaff, status: e.target.value })} className={styles.input}>
                                                <option value="Onboarding">Onboarding</option>
                                                <option value="Permanent">Permanent</option>
                                                <option value="Temporary">Temporary</option>
                                                <option value="Part-time">Part-time</option>
                                                <option value="Daily Wage">Daily Wage</option>
                                                <option value="Terminated">Terminated</option>
                                            </select>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Date of Joining</label>
                                            <input type="date" value={toInputDate(editingStaff.doj)} onChange={e => setEditingStaff({ ...editingStaff, doj: e.target.value })} className={styles.input} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Base Salary (Monthly)</label>
                                            <input type="number" value={editingStaff.salary || ''} onChange={e => setEditingStaff({ ...editingStaff, salary: e.target.value })} className={styles.input} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Daily Rate (If Daily Wage)</label>
                                            <input type="number" value={editingStaff.dailyRate || ''} onChange={e => setEditingStaff({ ...editingStaff, dailyRate: e.target.value })} className={styles.input} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Position / Role</label>
                                            <select 
                                                value={['Chef', 'Cashier', 'Manager', 'Waiter', 'Delivery', 'Helper'].includes(editingStaff.position) ? editingStaff.position : 'Other'} 
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setEditingStaff({ ...editingStaff, position: val === 'Other' ? '' : val });
                                                }}
                                                className={styles.input}
                                            >
                                                <option value="Chef">Chef / Cook</option>
                                                <option value="Cashier">Cashier</option>
                                                <option value="Manager">Manager</option>
                                                <option value="Waiter">Waiter</option>
                                                <option value="Delivery">Delivery Boy</option>
                                                <option value="Helper">Kitchen Helper</option>
                                                <option value="Other">Other / Custom Role</option>
                                            </select>
                                            {!['Chef', 'Cashier', 'Manager', 'Waiter', 'Delivery', 'Helper'].includes(editingStaff.position) && (
                                                <input 
                                                    type="text" 
                                                    value={editingStaff.position} 
                                                    onChange={e => setEditingStaff({ ...editingStaff, position: e.target.value })} 
                                                    placeholder="Enter Custom Role/Designation" 
                                                    className={styles.input}
                                                    style={{ marginTop: '5px' }}
                                                />
                                            )}
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Max Monthly KPI Bonus (INR)</label>
                                            <input type="number" value={editingStaff.incentive || ''} onChange={e => setEditingStaff({ ...editingStaff, incentive: e.target.value })} className={styles.input} />
                                        </div>
                                        {editingStaff.status === 'Terminated' && (
                                            <>
                                                <div className={styles.formGroup}>
                                                    <label>Termination Date</label>
                                                    <input type="date" value={toInputDate(editingStaff.termDate)} onChange={e => setEditingStaff({ ...editingStaff, termDate: e.target.value })} className={styles.input} />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label>Separation Reason</label>
                                                    <select value={editingStaff.termReason || ''} onChange={e => setEditingStaff({ ...editingStaff, termReason: e.target.value })} className={styles.input}>
                                                        <option value="">Select Reason</option>
                                                        <option value="Resigned">Resigned</option>
                                                        <option value="Absconded">Absconded / Left without Notice</option>
                                                        <option value="Performance">Terminated (Performance)</option>
                                                        <option value="Misconduct">Terminated (Misconduct)</option>
                                                        <option value="Relocated">Relocated</option>
                                                        <option value="Other">Other Reason</option>
                                                    </select>
                                                </div>
                                                <div className={styles.formGroup} style={{ gridColumn: 'span 3' }}>
                                                    <label>Exit Notes & Handover Remarks</label>
                                                    <textarea rows={2} value={editingStaff.termNotes || ''} onChange={e => setEditingStaff({ ...editingStaff, termNotes: e.target.value })} placeholder="Details about why they left, handover status, etc." className={styles.input} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                                                </div>
                                            </>
                                        )}
                                        <div className={styles.formGroup}>
                                            <label>Assigned Franchise Outlet</label>
                                            <select value={editingStaff.assignedOutlet || ''} onChange={e => setEditingStaff({ ...editingStaff, assignedOutlet: e.target.value })} className={styles.input}>
                                                <option value="">Unassigned / Head Office</option>
                                                {runningFranchises.map(outlet => (
                                                    <option key={outlet.id} value={outlet.outletName}>{outlet.outletName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 4: Bank Setup & Compliance Documentation */}
                                <div style={{ marginBottom: '1.2rem' }}>
                                    <h4 style={{ color: '#009ceb', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.2rem', fontWeight: 'bold' }}>4. Bank Setup & Compliance Documentation</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                        <div className={styles.formGroup}>
                                            <label>Bank Name</label>
                                            <input type="text" value={editingStaff.bankName || ''} onChange={e => setEditingStaff({ ...editingStaff, bankName: e.target.value })} className={styles.input} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Account Number</label>
                                            <input type="text" value={editingStaff.accountNumber || ''} onChange={e => setEditingStaff({ ...editingStaff, accountNumber: e.target.value })} className={styles.input} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>IFSC Code</label>
                                            <input type="text" value={editingStaff.ifscCode || ''} onChange={e => setEditingStaff({ ...editingStaff, ifscCode: e.target.value })} className={styles.input} />
                                        </div>
                                    </div>

                                    {/* Compliance Box */}
                                    <div className={styles.complianceBox} style={{ marginTop: '0.75rem' }}>
                                        <div className={styles.complianceItem}>
                                            <input type="checkbox" checked={editingStaff.aadhaarCollected || false} onChange={e => setEditingStaff({ ...editingStaff, aadhaarCollected: e.target.checked })} id="edit_aadhaarCollected" />
                                            <div className={styles.complianceText}>
                                                <label htmlFor="edit_aadhaarCollected" className={styles.complianceTitle}>Aadhaar Card Submitted</label>
                                                <span className={styles.complianceSub}>Validated copy on file</span>
                                            </div>
                                        </div>
                                        <div className={styles.complianceItem}>
                                            <input type="checkbox" checked={editingStaff.panCollected || false} onChange={e => setEditingStaff({ ...editingStaff, panCollected: e.target.checked })} id="edit_panCollected" />
                                            <div className={styles.complianceText}>
                                                <label htmlFor="edit_panCollected" className={styles.complianceTitle}>PAN Card Submitted</label>
                                                <span className={styles.complianceSub}>PAN setup for tax verification</span>
                                            </div>
                                        </div>
                                        <div className={styles.complianceItem}>
                                            <input type="checkbox" checked={editingStaff.medicalCollected || false} onChange={e => setEditingStaff({ ...editingStaff, medicalCollected: e.target.checked })} id="edit_medicalCollected" />
                                            <div className={styles.complianceText}>
                                                <label htmlFor="edit_medicalCollected" className={styles.complianceTitle}>Medical Certificate</label>
                                                <span className={styles.complianceSub}>Required for restaurant license</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 5: Document Attachments */}
                                <div style={{ marginBottom: '1.2rem' }}>
                                    <h4 style={{ color: '#009ceb', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.2rem', fontWeight: 'bold' }}>5. Document Attachments & Compliance Vault</h4>
                                    
                                    {/* Existing documents list */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Current Uploaded Documents:</span>
                                        {(() => {
                                            const docList = [];
                                            if (editingStaff.aadhaarDocUrl) docList.push({ key: 'aadhaarDocUrl', name: 'Aadhaar Card', url: editingStaff.aadhaarDocUrl });
                                            if (editingStaff.resumeDocUrl) docList.push({ key: 'resumeDocUrl', name: 'Resume', url: editingStaff.resumeDocUrl });
                                            if (editingStaff.medicalDocUrl) docList.push({ key: 'medicalDocUrl', name: 'Medical Certificate', url: editingStaff.medicalDocUrl });
                                            
                                            if (editingStaff.documents && editingStaff.documents.length > 0) {
                                                editingStaff.documents.forEach((d, idx) => {
                                                    if (!docList.find(x => x.url === d.url)) {
                                                        docList.push({ key: `doc-${idx}`, index: idx, name: d.name, url: d.url });
                                                    }
                                                });
                                            }

                                            if (docList.length === 0) {
                                                return <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No documents attached yet.</span>;
                                            }

                                            return docList.map((doc, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                                    <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#009ceb', fontWeight: 'bold', textDecoration: 'none' }}>📄 {doc.name}</a>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (window.confirm(`Remove ${doc.name}?`)) {
                                                                if (doc.key.startsWith('doc-')) {
                                                                    const updated = editingStaff.documents.filter((_, i) => i !== doc.index);
                                                                    setEditingStaff({ ...editingStaff, documents: updated });
                                                                } else {
                                                                    const labelCollectedField = doc.key === 'aadhaarDocUrl' ? 'aadhaarCollected' : doc.key === 'medicalDocUrl' ? 'medicalCollected' : '';
                                                                    const updates = { [doc.key]: '' };
                                                                    if (labelCollectedField) updates[labelCollectedField] = false;
                                                                    setEditingStaff({ ...editingStaff, ...updates });
                                                                }
                                                            }
                                                        }}
                                                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            ));
                                        })()}
                                    </div>

                                    {/* Upload form */}
                                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Add New Document:</span>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                            <div className={styles.formGroup} style={{ flex: 1, minWidth: '200px', margin: 0 }}>
                                                <label style={{ fontSize: '0.75rem' }}>Document Name / Label</label>
                                                <input
                                                    type="text"
                                                    id="edit-new-doc-label"
                                                    placeholder="e.g. Health License, PAN, NDA"
                                                    className={styles.input}
                                                    style={{ padding: '6px' }}
                                                />
                                            </div>
                                            <div className={styles.formGroup} style={{ flex: 1, minWidth: '200px', margin: 0 }}>
                                                <label style={{ fontSize: '0.75rem' }}>Select File</label>
                                                <input
                                                    type="file"
                                                    id="edit-new-doc-file"
                                                    style={{ fontSize: '0.75rem', padding: '4px' }}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                disabled={isUploading}
                                                onClick={async () => {
                                                    const labelInput = document.getElementById('edit-new-doc-label');
                                                    const fileInput = document.getElementById('edit-new-doc-file');
                                                    const label = labelInput.value.trim();
                                                    const file = fileInput.files[0];
                                                    if (!label || !file) {
                                                        showToast("Please specify a document name and select a file.")
                                                        return;
                                                    }
                                                    setIsUploading(true);
                                                    try {
                                                        const url = await uploadMedia(file);
                                                        const updatedDocs = [...(editingStaff.documents || []), { name: label, url }];
                                                        const updates = { documents: updatedDocs };
                                                        const lower = label.toLowerCase();
                                                        if (lower.includes('aadhaar')) {
                                                            updates.aadhaarDocUrl = url;
                                                            updates.aadhaarCollected = true;
                                                        } else if (lower.includes('medical')) {
                                                            updates.medicalDocUrl = url;
                                                            updates.medicalCollected = true;
                                                        } else if (lower.includes('pan')) {
                                                            updates.panCollected = true;
                                                        } else if (lower.includes('resume')) {
                                                            updates.resumeDocUrl = url;
                                                        }

                                                        setEditingStaff({ ...editingStaff, ...updates });
                                                        labelInput.value = '';
                                                        fileInput.value = '';
                                                        showToast("Document attached locally. Click 'Save Staff Changes' below to finalize.")
                                                    } catch (e) {
                                                        showToast("Upload failed: " + e.message, "error")
                                                    } finally {
                                                        setIsUploading(false);
                                                    }
                                                }}
                                                className={styles.addButton}
                                                style={{ padding: '0.4rem 1rem', margin: 0, height: '34px', fontSize: '0.8rem' }}
                                            >
                                                {isUploading ? 'Uploading...' : 'Attach File'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                    <button type="button" onClick={() => setEditingStaff(null)} className={styles.cancelBtn}>Cancel</button>
                                    <button type="submit" className={styles.saveChangesBtn} style={{ margin: 0 }}>Save Profile Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* ADD STAFF MODAL */}
            {
                showAddStaffForm && (
                    <div className={styles.modalOverlay} onClick={() => setShowAddStaffForm(false)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Add New Restaurant Staff Profile</h2>
                                <button type="button" onClick={() => setShowAddStaffForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', padding: '0 0.5rem' }}>&times;</button>
                            </div>

                            <form onSubmit={handleAddStaff} className={styles.staffForm}>
                                
                                {/* SECTION 1: Personal Details */}
                                <div style={{ marginBottom: '1.2rem' }}>
                                    <h4 style={{ color: '#009ceb', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.2rem', fontWeight: 'bold' }}>1. Personal & Core Details</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                                        <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                                            <label>Full Name *</label>
                                            <input type="text" value={newStaff.fullName} onChange={e => setNewStaff({ ...newStaff, fullName: e.target.value })} placeholder="Full Name" required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Nickname / Call Name</label>
                                            <input type="text" value={newStaff.nickname} onChange={e => setNewStaff({ ...newStaff, nickname: e.target.value })} placeholder="Nickname" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Gender</label>
                                            <select value={newStaff.gender} onChange={e => setNewStaff({ ...newStaff, gender: e.target.value })}>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                                            <label>Date of Birth</label>
                                            <input type="date" value={toInputDate(newStaff.dob)} onChange={e => setNewStaff({ ...newStaff, dob: e.target.value })} />
                                        </div>
                                        <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                                            <label>Blood Group</label>
                                            <input type="text" value={newStaff.bloodGroup} onChange={e => setNewStaff({ ...newStaff, bloodGroup: e.target.value })} placeholder="e.g. O+" />
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2: Contact & Address Coordinates */}
                                <div style={{ marginBottom: '1.2rem' }}>
                                    <h4 style={{ color: '#009ceb', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.2rem', fontWeight: 'bold' }}>2. Contact & Address Coordinates</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                        <div className={styles.formGroup}>
                                            <label>Email ID</label>
                                            <input type="email" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} placeholder="Email ID" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Primary Mobile *</label>
                                            <input type="tel" value={newStaff.phone} onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} placeholder="Primary Mobile" required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Alternate Contact</label>
                                            <input type="tel" value={newStaff.alternatePhone} onChange={e => setNewStaff({ ...newStaff, alternatePhone: e.target.value })} placeholder="Alternate Contact" />
                                        </div>
                                        <div className={styles.formGroup} style={{ gridColumn: 'span 3' }}>
                                            <label>Current Address (Bangalore Coordinates)</label>
                                            <textarea rows={2} value={newStaff.currentAddress} onChange={e => setNewStaff({ ...newStaff, currentAddress: e.target.value })} placeholder="Current Address" />
                                        </div>
                                        <div className={styles.formGroup} style={{ gridColumn: 'span 3' }}>
                                            <label>Permanent Address (Home Base)</label>
                                            <textarea rows={2} value={newStaff.permanentAddress} onChange={e => setNewStaff({ ...newStaff, permanentAddress: e.target.value })} placeholder="Permanent Address" />
                                        </div>
                                        <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                                            <label>Emergency Contact Person</label>
                                            <input type="text" value={newStaff.emergencyContact} onChange={e => setNewStaff({ ...newStaff, emergencyContact: e.target.value })} placeholder="Name of Relative" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Emergency Contact Number</label>
                                            <input type="tel" value={newStaff.emergencyPhone} onChange={e => setNewStaff({ ...newStaff, emergencyPhone: e.target.value })} placeholder="Emergency Number" />
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 3: Work Status & Financial Parameters */}
                                <div style={{ marginBottom: '1.2rem' }}>
                                    <h4 style={{ color: '#009ceb', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.2rem', fontWeight: 'bold' }}>3. Work Status & Financial Parameters</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                        <div className={styles.formGroup}>
                                            <label>Employment Status</label>
                                            <select value={newStaff.status} onChange={e => setNewStaff({ ...newStaff, status: e.target.value })}>
                                                 <option value="Onboarding">Onboarding</option>
                                                <option value="Permanent">Permanent</option>
                                                <option value="Temporary">Temporary</option>
                                                <option value="Part-time">Part-time</option>
                                                <option value="Daily Wage">Daily Wage</option>
                                                <option value="Terminated">Terminated</option>
                                            </select>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Base Salary (Monthly)</label>
                                            <input type="number" value={newStaff.salary} onChange={e => setNewStaff({ ...newStaff, salary: e.target.value })} placeholder="Base Salary (Monthly)" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Daily Rate (If Daily Wage)</label>
                                            <input type="number" value={newStaff.dailyRate} onChange={e => setNewStaff({ ...newStaff, dailyRate: e.target.value })} placeholder="Daily Wage Rate" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Joining Date</label>
                                            <input type="date" value={toInputDate(newStaff.joinDate)} onChange={e => setNewStaff({ ...newStaff, joinDate: e.target.value })} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Position / Role</label>
                                            <select 
                                                value={['Chef', 'Cashier', 'Manager', 'Waiter', 'Delivery', 'Helper'].includes(newStaff.position) ? newStaff.position : 'Other'} 
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setNewStaff({ ...newStaff, position: val === 'Other' ? '' : val });
                                                }}
                                            >
                                                <option value="Chef">Chef / Cook</option>
                                                <option value="Cashier">Cashier</option>
                                                <option value="Manager">Manager</option>
                                                <option value="Waiter">Waiter</option>
                                                <option value="Delivery">Delivery Boy</option>
                                                <option value="Helper">Kitchen Helper</option>
                                                <option value="Other">Other / Custom Role</option>
                                            </select>
                                            {!['Chef', 'Cashier', 'Manager', 'Waiter', 'Delivery', 'Helper'].includes(newStaff.position) && (
                                                <input 
                                                    type="text" 
                                                    value={newStaff.position} 
                                                    onChange={e => setNewStaff({ ...newStaff, position: e.target.value })} 
                                                    placeholder="Enter Custom Role/Designation" 
                                                    style={{ marginTop: '5px' }}
                                                />
                                            )}
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Max Monthly KPI Bonus (INR)</label>
                                            <input type="number" value={newStaff.incentive} onChange={e => setNewStaff({ ...newStaff, incentive: e.target.value })} placeholder="KPI Incentive" />
                                        </div>
                                        {newStaff.status === 'Terminated' && (
                                            <>
                                                <div className={styles.formGroup}>
                                                    <label>Termination Date</label>
                                                    <input type="date" value={toInputDate(newStaff.termDate)} onChange={e => setNewStaff({ ...newStaff, termDate: e.target.value })} />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label>Separation Reason</label>
                                                    <select value={newStaff.termReason || ''} onChange={e => setNewStaff({ ...newStaff, termReason: e.target.value })}>
                                                        <option value="">Select Reason</option>
                                                        <option value="Resigned">Resigned</option>
                                                        <option value="Absconded">Absconded / Left without Notice</option>
                                                        <option value="Performance">Terminated (Performance)</option>
                                                        <option value="Misconduct">Terminated (Misconduct)</option>
                                                        <option value="Relocated">Relocated</option>
                                                        <option value="Other">Other Reason</option>
                                                    </select>
                                                </div>
                                                <div className={styles.formGroup} style={{ gridColumn: 'span 3' }}>
                                                    <label>Exit Notes & Handover Remarks</label>
                                                    <textarea rows={2} value={newStaff.termNotes || ''} onChange={e => setNewStaff({ ...newStaff, termNotes: e.target.value })} placeholder="Details about why they left, handover status, etc." style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                                                </div>
                                            </>
                                        )}
                                        <div className={styles.formGroup}>
                                            <label>Assigned Franchise Outlet</label>
                                            <select value={newStaff.assignedOutlet || ''} onChange={e => setNewStaff({ ...newStaff, assignedOutlet: e.target.value })}>
                                                <option value="">Unassigned / Head Office</option>
                                                {runningFranchises.map(outlet => (
                                                    <option key={outlet.id} value={outlet.outletName}>{outlet.outletName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 4: Bank Setup & Compliance Documentation */}
                                <div style={{ marginBottom: '1.2rem' }}>
                                    <h4 style={{ color: '#009ceb', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.2rem', fontWeight: 'bold' }}>4. Bank Setup & Compliance Documentation</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                        <div className={styles.formGroup}>
                                            <label>Bank Name</label>
                                            <input type="text" value={newStaff.bankName} onChange={e => setNewStaff({ ...newStaff, bankName: e.target.value })} placeholder="e.g. HDFC Bank" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Account Number</label>
                                            <input type="text" value={newStaff.accountNumber} onChange={e => setNewStaff({ ...newStaff, accountNumber: e.target.value })} placeholder="Account Number" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>IFSC Code</label>
                                            <input type="text" value={newStaff.ifscCode} onChange={e => setNewStaff({ ...newStaff, ifscCode: e.target.value })} placeholder="IFSC Code" />
                                        </div>
                                    </div>

                                    {/* Compliance Box */}
                                    <div className={styles.complianceBox} style={{ marginTop: '0.75rem' }}>
                                        <div className={styles.complianceItem}>
                                            <input type="checkbox" checked={newStaff.aadhaarCollected} onChange={e => setNewStaff({ ...newStaff, aadhaarCollected: e.target.checked })} id="add_aadhaarCollected" />
                                            <div className={styles.complianceText}>
                                                <label htmlFor="add_aadhaarCollected" className={styles.complianceTitle}>Aadhaar Card Submitted</label>
                                                <span className={styles.complianceSub}>Validated copy on file</span>
                                            </div>
                                        </div>
                                        <div className={styles.complianceItem}>
                                            <input type="checkbox" checked={newStaff.panCollected} onChange={e => setNewStaff({ ...newStaff, panCollected: e.target.checked })} id="add_panCollected" />
                                            <div className={styles.complianceText}>
                                                <label htmlFor="add_panCollected" className={styles.complianceTitle}>PAN Card Submitted</label>
                                                <span className={styles.complianceSub}>PAN setup for tax verification</span>
                                            </div>
                                        </div>
                                        <div className={styles.complianceItem}>
                                            <input type="checkbox" checked={newStaff.medicalCollected} onChange={e => setNewStaff({ ...newStaff, medicalCollected: e.target.checked })} id="add_medicalCollected" />
                                            <div className={styles.complianceText}>
                                                <label htmlFor="add_medicalCollected" className={styles.complianceTitle}>Medical Certificate</label>
                                                <span className={styles.complianceSub}>Required for restaurant license</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 5: Document Attachments */}
                                <div style={{ marginBottom: '1.2rem' }}>
                                    <h4 style={{ color: '#009ceb', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.2rem', fontWeight: 'bold' }}>5. Document Attachments & Compliance Vault</h4>
                                    
                                    {/* Existing documents list */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Documents Scheduled for Upload:</span>
                                        {(() => {
                                            const docList = [];
                                            if (newStaff.aadhaarDocUrl) docList.push({ key: 'aadhaarDocUrl', name: 'Aadhaar Card', url: newStaff.aadhaarDocUrl });
                                            if (newStaff.resumeDocUrl) docList.push({ key: 'resumeDocUrl', name: 'Resume', url: newStaff.resumeDocUrl });
                                            if (newStaff.medicalDocUrl) docList.push({ key: 'medicalDocUrl', name: 'Medical Certificate', url: newStaff.medicalDocUrl });
                                            
                                            if (newStaff.documents && newStaff.documents.length > 0) {
                                                newStaff.documents.forEach((d, idx) => {
                                                    if (!docList.find(x => x.url === d.url)) {
                                                        docList.push({ key: `doc-${idx}`, index: idx, name: d.name, url: d.url });
                                                    }
                                                });
                                            }

                                            if (docList.length === 0) {
                                                return <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No documents attached yet.</span>;
                                            }

                                            return docList.map((doc, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                                    <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#009ceb', fontWeight: 'bold', textDecoration: 'none' }}>📄 {doc.name}</a>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (window.confirm(`Remove ${doc.name}?`)) {
                                                                if (doc.key.startsWith('doc-')) {
                                                                    const updated = newStaff.documents.filter((_, i) => i !== doc.index);
                                                                    setNewStaff({ ...newStaff, documents: updated });
                                                                } else {
                                                                    const labelCollectedField = doc.key === 'aadhaarDocUrl' ? 'aadhaarCollected' : doc.key === 'medicalDocUrl' ? 'medicalCollected' : '';
                                                                    const updates = { [doc.key]: '' };
                                                                    if (labelCollectedField) updates[labelCollectedField] = false;
                                                                    setNewStaff({ ...newStaff, ...updates });
                                                                }
                                                            }
                                                        }}
                                                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            ));
                                        })()}
                                    </div>

                                    {/* Upload form */}
                                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Attach New Document:</span>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                            <div className={styles.formGroup} style={{ flex: 1, minWidth: '200px', margin: 0 }}>
                                                <label style={{ fontSize: '0.75rem' }}>Document Name / Label</label>
                                                <input
                                                    type="text"
                                                    id="add-new-doc-label"
                                                    placeholder="e.g. Health License, PAN, NDA"
                                                    className={styles.input}
                                                    style={{ padding: '6px' }}
                                                />
                                            </div>
                                            <div className={styles.formGroup} style={{ flex: 1, minWidth: '200px', margin: 0 }}>
                                                <label style={{ fontSize: '0.75rem' }}>Select File</label>
                                                <input
                                                    type="file"
                                                    id="add-new-doc-file"
                                                    style={{ fontSize: '0.75rem', padding: '4px' }}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                disabled={isUploading}
                                                onClick={async () => {
                                                    const labelInput = document.getElementById('add-new-doc-label');
                                                    const fileInput = document.getElementById('add-new-doc-file');
                                                    const label = labelInput.value.trim();
                                                    const file = fileInput.files[0];
                                                    if (!label || !file) {
                                                        showToast("Please specify a document name and select a file.")
                                                        return;
                                                    }
                                                    setIsUploading(true);
                                                    try {
                                                        const url = await uploadMedia(file);
                                                        const updatedDocs = [...(newStaff.documents || []), { name: label, url }];
                                                        const updates = { documents: updatedDocs };
                                                        const lower = label.toLowerCase();
                                                        if (lower.includes('aadhaar')) {
                                                            updates.aadhaarDocUrl = url;
                                                            updates.aadhaarCollected = true;
                                                        } else if (lower.includes('medical')) {
                                                            updates.medicalDocUrl = url;
                                                            updates.medicalCollected = true;
                                                        } else if (lower.includes('pan')) {
                                                            updates.panCollected = true;
                                                        } else if (lower.includes('resume')) {
                                                            updates.resumeDocUrl = url;
                                                        }

                                                        setNewStaff({ ...newStaff, ...updates });
                                                        labelInput.value = '';
                                                        fileInput.value = '';
                                                        showToast("Document attached. Click 'Add Staff Member' below to save completely.")
                                                    } catch (e) {
                                                        showToast("Upload failed: " + e.message, "error")
                                                    } finally {
                                                        setIsUploading(false);
                                                    }
                                                }}
                                                className={styles.addButton}
                                                style={{ padding: '0.4rem 1rem', margin: 0, height: '34px', fontSize: '0.8rem' }}
                                            >
                                                {isUploading ? 'Uploading...' : 'Attach File'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                    <button type="button" onClick={() => setShowAddStaffForm(false)} className={styles.cancelBtn}>Cancel</button>
                                    <button type="submit" className={styles.addButton} style={{ margin: 0 }}>Add Staff Member</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* SALARY HIKE MODAL */}
            {
                hikeStaff && (
                    <div className={styles.modalOverlay} onClick={() => setHikeStaff(null)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', width: '90%', borderRadius: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem' }}>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>📈 Process Salary Hike</h2>
                                <button type="button" onClick={() => setHikeStaff(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', padding: '0 0.5rem' }}>&times;</button>
                            </div>

                            <form onSubmit={handleSaveHike}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Employee Name</label>
                                        <input type="text" value={hikeStaff.fullName} disabled style={{ width: '100%', padding: '0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', color: '#475569' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Current Fixed Salary</label>
                                        <input type="text" value={`₹${(parseFloat(hikeStaff.salary) || 0).toLocaleString('en-IN')}`} disabled style={{ width: '100%', padding: '0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', color: '#475569' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>New Fixed Salary (INR) *</label>
                                        <input 
                                            type="number" 
                                            value={hikeAmount} 
                                            onChange={e => setHikeAmount(e.target.value)} 
                                            placeholder="Enter New Fixed Salary Amount" 
                                            required 
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Effective Date *</label>
                                        <input 
                                            type="date" 
                                            value={hikeDate} 
                                            onChange={e => setHikeDate(e.target.value)} 
                                            required 
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Reason / Remarks *</label>
                                        <input 
                                            type="text" 
                                            value={hikeReason} 
                                            onChange={e => setHikeReason(e.target.value)} 
                                            placeholder="e.g. Annual Hike, Promotion, Roster Change" 
                                            required 
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                    <button type="button" onClick={() => setHikeStaff(null)} className={styles.cancelBtn}>Cancel</button>
                                    <button type="submit" className={styles.saveChangesBtn} style={{ margin: 0 }}>Update Salary</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* EDIT FRANCHISE MODAL */}
            {
                editingFranchise && (
                    <div className={styles.modalOverlay} onClick={() => setEditingFranchise(null)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Edit Franchise Inquiry: {editingFranchise.name}</h2>
                                <button type="button" onClick={() => setEditingFranchise(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', padding: '0 0.5rem' }}>&times;</button>
                            </div>

                            <form onSubmit={handleUpdateFranchise} className={styles.staffForm}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    <div className={styles.formGroup}>
                                        <label>Applicant Full Name *</label>
                                        <input type="text" value={editingFranchise.name} onChange={e => setEditingFranchise({ ...editingFranchise, name: e.target.value })} className={styles.input} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Email ID *</label>
                                        <input type="email" value={editingFranchise.email} onChange={e => setEditingFranchise({ ...editingFranchise, email: e.target.value })} className={styles.input} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Phone Number *</label>
                                        <input type="tel" value={editingFranchise.phone} onChange={e => setEditingFranchise({ ...editingFranchise, phone: e.target.value })} className={styles.input} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Current Profession</label>
                                        <input type="text" value={editingFranchise.currentJob || ''} onChange={e => setEditingFranchise({ ...editingFranchise, currentJob: e.target.value })} className={styles.input} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                    <div className={styles.formGroup}>
                                        <label>Street Address</label>
                                        <input type="text" value={editingFranchise.street || ''} onChange={e => setEditingFranchise({ ...editingFranchise, street: e.target.value })} className={styles.input} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>City *</label>
                                        <input type="text" value={editingFranchise.city} onChange={e => setEditingFranchise({ ...editingFranchise, city: e.target.value })} className={styles.input} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>State *</label>
                                        <select value={editingFranchise.state} onChange={e => setEditingFranchise({ ...editingFranchise, state: e.target.value })} className={styles.input}>
                                            <option value="DL">Delhi (DL)</option>
                                            <option value="MH">Maharashtra (MH)</option>
                                            <option value="KA">Karnataka (KA)</option>
                                            <option value="TN">Tamil Nadu (TN)</option>
                                            <option value="KL">Kerala (KL)</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Pincode</label>
                                        <input type="text" value={editingFranchise.pincode || ''} onChange={e => setEditingFranchise({ ...editingFranchise, pincode: e.target.value })} className={styles.input} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                    <div className={styles.formGroup}>
                                        <label>Own Commercial Space?</label>
                                        <select value={editingFranchise.ownSpace} onChange={e => setEditingFranchise({ ...editingFranchise, ownSpace: e.target.value })} className={styles.input}>
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Space Area (sq. ft.)</label>
                                        <input type="text" value={editingFranchise.spaceArea || ''} onChange={e => setEditingFranchise({ ...editingFranchise, spaceArea: e.target.value })} className={styles.input} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Franchise Model Type</label>
                                        <select value={editingFranchise.franchiseType} onChange={e => setEditingFranchise({ ...editingFranchise, franchiseType: e.target.value })} className={styles.input}>
                                            <option value="Standard">Standard Model</option>
                                            <option value="Express">Express Model</option>
                                            <option value="Premium">Premium Cafe</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Pipeline Stage</label>
                                        <select value={editingFranchise.status} onChange={e => setEditingFranchise({ ...editingFranchise, status: e.target.value })} className={styles.input}>
                                            <option value="New">New Lead</option>
                                            <option value="Called">Called / Emailed</option>
                                            <option value="Interested">Interested / Hot Lead</option>
                                            <option value="Follow-up">In Follow-up</option>
                                            <option value="Terminated">Terminated / Closed</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                                    <label>Additional Notes / Shop Description</label>
                                    <textarea rows={3} value={editingFranchise.shopDescription || ''} onChange={e => setEditingFranchise({ ...editingFranchise, shopDescription: e.target.value })} className={styles.input} />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                    <button type="button" onClick={() => setEditingFranchise(null)} className={styles.cancelBtn}>Cancel</button>
                                    <button type="submit" className={styles.addButton} style={{ margin: 0 }}>Save Franchise Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* ADD RUNNING FRANCHISE OUTLET MODAL */}
            {
                showAddFranchiseOutletForm && (
                    <div className={styles.modalOverlay} onClick={() => setShowAddFranchiseOutletForm(false)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Register Approved Franchise Outlet</h2>
                                <button type="button" onClick={() => setShowAddFranchiseOutletForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', padding: '0 0.5rem' }}>&times;</button>
                            </div>

                            <form onSubmit={handleAddFranchiseOutlet} className={styles.staffForm}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className={styles.formGroup}>
                                        <label>🔗 Link to Existing Store Location (Optional - Auto Fills Details)</label>
                                        <select
                                            value={newFranchiseOutlet.locationId || ''}
                                            onChange={e => handleFranchiseLocationLink(e.target.value)}
                                            className={styles.input}
                                        >
                                            <option value="">-- Select Store Location to Link --</option>
                                            {locations.filter(l => !l.franchiseId).map(l => (
                                                <option key={l.id} value={l.id}>{l.name} ({l.area})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    <div className={styles.formGroup}>
                                        <label>Outlet Name *</label>
                                        <input type="text" value={newFranchiseOutlet.outletName} onChange={e => setNewFranchiseOutlet({ ...newFranchiseOutlet, outletName: e.target.value })} className={styles.input} required placeholder="High Laban - Bangalore Cafe" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Franchise Owner Name *</label>
                                        <input type="text" value={newFranchiseOutlet.ownerName} onChange={e => setNewFranchiseOutlet({ ...newFranchiseOutlet, ownerName: e.target.value })} className={styles.input} required placeholder="Owner Full Name" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Owner Phone *</label>
                                        <input type="tel" value={newFranchiseOutlet.phone} onChange={e => setNewFranchiseOutlet({ ...newFranchiseOutlet, phone: e.target.value })} className={styles.input} required placeholder="Owner Contact Number" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Owner Email</label>
                                        <input type="email" value={newFranchiseOutlet.email} onChange={e => setNewFranchiseOutlet({ ...newFranchiseOutlet, email: e.target.value })} className={styles.input} placeholder="owner@gmail.com" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                    <div className={styles.formGroup}>
                                        <label>City *</label>
                                        <input type="text" value={newFranchiseOutlet.city} onChange={e => setNewFranchiseOutlet({ ...newFranchiseOutlet, city: e.target.value })} className={styles.input} required placeholder="City Name" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>State *</label>
                                        <select value={newFranchiseOutlet.state} onChange={e => setNewFranchiseOutlet({ ...newFranchiseOutlet, state: e.target.value })} className={styles.input}>
                                            <option value="KA">Karnataka (KA)</option>
                                            <option value="DL">Delhi (DL)</option>
                                            <option value="MH">Maharashtra (MH)</option>
                                            <option value="TN">Tamil Nadu (TN)</option>
                                            <option value="KL">Kerala (KL)</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Franchise Model Type</label>
                                        <select value={newFranchiseOutlet.modelType} onChange={newFranchiseOutlet.modelType === 'Standard' ? () => {} : e => setNewFranchiseOutlet({ ...newFranchiseOutlet, modelType: e.target.value })} className={styles.input}>
                                            <option value="Standard">Standard Model</option>
                                            <option value="Express">Express Model</option>
                                            <option value="Premium Cafe">Premium Cafe</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Outlet Status</label>
                                        <select value={newFranchiseOutlet.status} onChange={e => setNewFranchiseOutlet({ ...newFranchiseOutlet, status: e.target.value })} className={styles.input}>
                                            <option value="Running">Running</option>
                                            <option value="Under Construction">Under Construction</option>
                                            <option value="Closed">Closed</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Assigned Kitchen *</label>
                                        <select value={newFranchiseOutlet.assignedKitchenId || ''} onChange={e => setNewFranchiseOutlet({ ...newFranchiseOutlet, assignedKitchenId: e.target.value })} className={styles.input} required>
                                            <option value="">-- Select Central Kitchen --</option>
                                            {kitchens.map(k => (
                                                <option key={k.id} value={k.id}>{k.name} ({k.city})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                    <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                                        <label>Detailed Outlet Address *</label>
                                        <input type="text" value={newFranchiseOutlet.address} onChange={e => setNewFranchiseOutlet({ ...newFranchiseOutlet, address: e.target.value })} className={styles.input} required placeholder="Full Outlet Address coordinates" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Opening Date</label>
                                        <input type="date" value={toInputDate(newFranchiseOutlet.openDate)} onChange={e => setNewFranchiseOutlet({ ...newFranchiseOutlet, openDate: e.target.value })} className={styles.input} />
                                    </div>
                                </div>

                                {/* Documents Section */}
                                <div style={{ marginTop: '1.2rem', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                    <h4 style={{ color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 'bold' }}>📄 Store Documents & ID Copy Uploads</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div className={styles.formGroup}>
                                            <label>Franchise Agreement File</label>
                                            <input type="file" onChange={e => handleFranchiseDocUpload(e, 'agreementUrl', false)} style={{ fontSize: '0.8rem' }} />
                                            {newFranchiseOutlet.agreementUrl && <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'block', marginTop: '4px' }}>🟢 Agreement Uploaded</span>}
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>GST Registration Certificate</label>
                                            <input type="file" onChange={e => handleFranchiseDocUpload(e, 'gstUrl', false)} style={{ fontSize: '0.8rem' }} />
                                            {newFranchiseOutlet.gstUrl && <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'block', marginTop: '4px' }}>🟢 GST Cert Uploaded</span>}
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Owner ID Card Copy</label>
                                            <input type="file" onChange={e => handleFranchiseDocUpload(e, 'ownerIdUrl', false)} style={{ fontSize: '0.8rem' }} />
                                            {newFranchiseOutlet.ownerIdUrl && <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'block', marginTop: '4px' }}>🟢 Owner ID Uploaded</span>}
                                        </div>
                                    </div>

                                    {/* Custom Document Vault list */}
                                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '10px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>Custom Document Vault</label>
                                        
                                        {newFranchiseOutlet.documents && newFranchiseOutlet.documents.length > 0 && (
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                                {newFranchiseOutlet.documents.map((doc, idx) => (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem' }}>
                                                        <span>📄 {doc.name}</span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                setNewFranchiseOutlet(prev => ({
                                                                    ...prev,
                                                                    documents: prev.documents.filter((_, i) => i !== idx)
                                                                }));
                                                            }}
                                                            style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Enter Document Label (e.g. FSSAI License)" 
                                                value={franchiseDocLabel} 
                                                onChange={e => setFranchiseDocLabel(e.target.value)} 
                                                className={styles.input}
                                                style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem' }}
                                            />
                                            <input 
                                                type="file" 
                                                onChange={e => handleFranchiseCustomDocUpload(e, false)} 
                                                style={{ fontSize: '0.8rem', width: '200px' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                    <button type="button" onClick={() => setShowAddFranchiseOutletForm(false)} className={styles.cancelBtn}>Cancel</button>
                                    <button type="submit" className={styles.addButton} style={{ margin: 0 }}>Register Outlet</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* EDIT RUNNING FRANCHISE OUTLET MODAL */}
            {
                editingFranchiseOutlet && (
                    <div className={styles.modalOverlay} onClick={() => setEditingFranchiseOutlet(null)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Edit Franchise Outlet: {editingFranchiseOutlet.outletName}</h2>
                                <button type="button" onClick={() => setEditingFranchiseOutlet(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', padding: '0 0.5rem' }}>&times;</button>
                            </div>

                            <form onSubmit={handleUpdateFranchiseOutlet} className={styles.staffForm}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    <div className={styles.formGroup}>
                                        <label>Outlet Name *</label>
                                        <input type="text" value={editingFranchiseOutlet.outletName} onChange={e => setEditingFranchiseOutlet({ ...editingFranchiseOutlet, outletName: e.target.value })} className={styles.input} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Franchise Owner Name *</label>
                                        <input type="text" value={editingFranchiseOutlet.ownerName} onChange={e => setEditingFranchiseOutlet({ ...editingFranchiseOutlet, ownerName: e.target.value })} className={styles.input} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Owner Phone *</label>
                                        <input type="tel" value={editingFranchiseOutlet.phone} onChange={e => setEditingFranchiseOutlet({ ...editingFranchiseOutlet, phone: e.target.value })} className={styles.input} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Owner Email</label>
                                        <input type="email" value={editingFranchiseOutlet.email || ''} onChange={e => setEditingFranchiseOutlet({ ...editingFranchiseOutlet, email: e.target.value })} className={styles.input} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                    <div className={styles.formGroup}>
                                        <label>City *</label>
                                        <input type="text" value={editingFranchiseOutlet.city} onChange={e => setEditingFranchiseOutlet({ ...editingFranchiseOutlet, city: e.target.value })} className={styles.input} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>State *</label>
                                        <select value={editingFranchiseOutlet.state} onChange={e => setEditingFranchiseOutlet({ ...editingFranchiseOutlet, state: e.target.value })} className={styles.input}>
                                            <option value="KA">Karnataka (KA)</option>
                                            <option value="DL">Delhi (DL)</option>
                                            <option value="MH">Maharashtra (MH)</option>
                                            <option value="TN">Tamil Nadu (TN)</option>
                                            <option value="KL">Kerala (KL)</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Franchise Model Type</label>
                                        <select value={editingFranchiseOutlet.modelType} onChange={e => setEditingFranchiseOutlet({ ...editingFranchiseOutlet, modelType: e.target.value })} className={styles.input}>
                                            <option value="Standard">Standard Model</option>
                                            <option value="Express">Express Model</option>
                                            <option value="Premium Cafe">Premium Cafe</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Outlet Status</label>
                                        <select value={editingFranchiseOutlet.status} onChange={e => setEditingFranchiseOutlet({ ...editingFranchiseOutlet, status: e.target.value })} className={styles.input}>
                                            <option value="Running">Running</option>
                                            <option value="Under Construction">Under Construction</option>
                                            <option value="Closed">Closed</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Assigned Kitchen *</label>
                                        <select value={editingFranchiseOutlet.assignedKitchenId || ''} onChange={e => setEditingFranchiseOutlet({ ...editingFranchiseOutlet, assignedKitchenId: e.target.value })} className={styles.input} required>
                                            <option value="">-- Select Central Kitchen --</option>
                                            {kitchens.map(k => (
                                                <option key={k.id} value={k.id}>{k.name} ({k.city})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                    <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                                        <label>Detailed Outlet Address *</label>
                                        <input type="text" value={editingFranchiseOutlet.address} onChange={e => setEditingFranchiseOutlet({ ...editingFranchiseOutlet, address: e.target.value })} className={styles.input} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Opening Date</label>
                                        <input type="date" value={toInputDate(editingFranchiseOutlet.openDate)} onChange={e => setEditingFranchiseOutlet({ ...editingFranchiseOutlet, openDate: e.target.value })} className={styles.input} />
                                    </div>
                                </div>

                                {/* Documents Section */}
                                <div style={{ marginTop: '1.2rem', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                    <h4 style={{ color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 'bold' }}>📄 Store Documents & ID Copy Uploads</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div className={styles.formGroup}>
                                            <label>Franchise Agreement File</label>
                                            <input type="file" onChange={e => handleFranchiseDocUpload(e, 'agreementUrl', true)} style={{ fontSize: '0.8rem' }} />
                                            {editingFranchiseOutlet.agreementUrl && (
                                                <a href={editingFranchiseOutlet.agreementUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#009ceb', fontWeight: 'bold', marginTop: '4px', display: 'inline-block' }}>📥 Download Agreement</a>
                                            )}
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>GST Registration Certificate</label>
                                            <input type="file" onChange={e => handleFranchiseDocUpload(e, 'gstUrl', true)} style={{ fontSize: '0.8rem' }} />
                                            {editingFranchiseOutlet.gstUrl && (
                                                <a href={editingFranchiseOutlet.gstUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#009ceb', fontWeight: 'bold', marginTop: '4px', display: 'inline-block' }}>📥 Download GST Cert</a>
                                            )}
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Owner ID Card Copy</label>
                                            <input type="file" onChange={e => handleFranchiseDocUpload(e, 'ownerIdUrl', true)} style={{ fontSize: '0.8rem' }} />
                                            {editingFranchiseOutlet.ownerIdUrl && (
                                                <a href={editingFranchiseOutlet.ownerIdUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#009ceb', fontWeight: 'bold', marginTop: '4px', display: 'inline-block' }}>📥 Download Owner ID</a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Custom Document Vault list */}
                                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '10px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>Custom Document Vault</label>
                                        
                                        {editingFranchiseOutlet.documents && editingFranchiseOutlet.documents.length > 0 && (
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                                {editingFranchiseOutlet.documents.map((doc, idx) => (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem' }}>
                                                        <a href={doc.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#0ea5e9', fontWeight: 'bold' }}>📄 {doc.name} 📥</a>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                setEditingFranchiseOutlet(prev => ({
                                                                    ...prev,
                                                                    documents: prev.documents.filter((_, i) => i !== idx)
                                                                }));
                                                            }}
                                                            style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', padding: 0, marginLeft: '4px' }}
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Enter Document Label (e.g. FSSAI License)" 
                                                value={franchiseDocLabelEdit} 
                                                onChange={e => setFranchiseDocLabelEdit(e.target.value)} 
                                                className={styles.input}
                                                style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem' }}
                                            />
                                            <input 
                                                type="file" 
                                                onChange={e => handleFranchiseCustomDocUpload(e, true)} 
                                                style={{ fontSize: '0.8rem', width: '200px' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                    <button type="button" onClick={() => setEditingFranchiseOutlet(null)} className={styles.cancelBtn}>Cancel</button>
                                    <button type="submit" className={styles.addButton} style={{ margin: 0 }}>Save Outlet Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* EMPLOYEE PAYROLL HISTORY & PERFORMANCE REPORT MODAL */}
            {
                selectedDetailStaff && (() => {
                    const history = allHistoricalPayroll
                        .filter(r => r.staffId === selectedDetailStaff.id)
                        .sort((a, b) => b.month.localeCompare(a.month));

                    const ratedMonths = history.filter(r => r.kpiRating !== undefined);
                    const avgKpi = ratedMonths.length > 0
                        ? (ratedMonths.reduce((acc, curr) => acc + parseInt(curr.kpiRating), 0) / ratedMonths.length).toFixed(1)
                        : parseFloat(selectedDetailStaff.kpiRating || 5).toFixed(1);

                    const totalLeavesHistory = history.reduce((acc, curr) => acc + (parseInt(curr.leavesTaken) || 0), 0);
                    const totalEarnings = history.reduce((acc, curr) => acc + (parseFloat(curr.netSalaryPaid) || 0), 0);
                    
                    const avgAtt = history.length > 0 
                        ? (history.reduce((acc, curr) => { 
                            const l = parseInt(curr.leavesTaken) || 0; 
                            return acc + Math.max(0, (26 - l)/26); 
                          }, 0) / history.length * 100).toFixed(0) 
                        : (Math.max(0, (26 - parseInt(selectedDetailStaff.leavesTaken || 0)) / 26) * 100).toFixed(0);

                    const employeeDocs = [];
                    if (selectedDetailStaff.aadhaarDocUrl) employeeDocs.push({ name: 'Aadhaar Card', url: selectedDetailStaff.aadhaarDocUrl });
                    if (selectedDetailStaff.resumeDocUrl) employeeDocs.push({ name: 'Resume', url: selectedDetailStaff.resumeDocUrl });
                    if (selectedDetailStaff.medicalDocUrl) employeeDocs.push({ name: 'Medical Cert', url: selectedDetailStaff.medicalDocUrl });
                    if (selectedDetailStaff.documents && selectedDetailStaff.documents.length > 0) {
                        selectedDetailStaff.documents.forEach(d => {
                            if (!employeeDocs.find(x => x.url === d.url)) {
                                employeeDocs.push(d);
                            }
                        });
                    }

                    const activeContext = activeTab === 'payroll' ? 'analytics' : selectedHrTab;
                    const modalMaxWidth = 
                        activeContext === 'exit' ? '600px' : 
                        activeContext === 'salary' ? '650px' :
                        activeContext === 'compliance' ? '600px' :
                        (activeContext === 'personal' || activeContext === 'contact') ? '700px' : '950px';

                    return (
                        <div className={styles.modalOverlay} onClick={() => setSelectedDetailStaff(null)}>
                            <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: modalMaxWidth, width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                                                {selectedDetailStaff.fullName}
                                            </h2>
                                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                {selectedDetailStaff.position}
                                            </span>
                                        </div>
                                        <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '4px', margin: 0 }}>
                                            {selectedDetailStaff.assignedOutlet ? `📍 Outlet: ${selectedDetailStaff.assignedOutlet}` : '💼 Head Office / Unassigned'}
                                            <span style={{ margin: '0 8px' }}>🖼️</span>
                                            Joined: {selectedDetailStaff.joinDate || 'N/A'}
                                            <span style={{ margin: '0 8px' }}>🖼️</span>
                                            Status: <strong style={{ color: selectedDetailStaff.status === 'Terminated' ? '#ef4444' : selectedDetailStaff.status === 'Onboarding' ? '#d97706' : '#10b981' }}>{selectedDetailStaff.status}</strong>
                                        </p>
                                    </div>
                                    <button type="button" onClick={() => setSelectedDetailStaff(null)} style={{ background: 'none', border: 'none', fontSize: '1.75rem', cursor: 'pointer', color: '#94a3b8', padding: '0 0.5rem', lineHeight: 1 }}>&times;</button>
                                </div>

                                {/* CONDITION 1: EXIT & SEPARATION CONTEXT */}
                                {activeContext === 'exit' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        <div style={{ background: '#fff1f2', border: '1px solid #ffe4e6', padding: '1.5rem', borderRadius: '15px' }}>
                                            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#be123c', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 1rem 0' }}>
                                                âš ï¸ Exit & Separation Record
                                            </h3>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #ffe4e6', paddingBottom: '8px' }}>
                                                    <span style={{ color: '#be123c', fontWeight: 'bold' }}>Employment Status:</span>
                                                    <span style={{ background: selectedDetailStaff.status === 'Terminated' ? '#ef4444' : selectedDetailStaff.status === 'Onboarding' ? '#d97706' : '#10b981', color: 'white', padding: '2px 8px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                        {selectedDetailStaff.status}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #ffe4e6', paddingBottom: '8px' }}>
                                                    <span style={{ color: '#475569' }}>Date of Joining:</span>
                                                    <strong style={{ color: '#1e293b' }}>{selectedDetailStaff.joinDate || 'N/A'}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #ffe4e6', paddingBottom: '8px' }}>
                                                    <span style={{ color: '#be123c', fontWeight: 'bold' }}>Exit/Termination Date:</span>
                                                    <strong style={{ color: '#ef4444' }}>{selectedDetailStaff.termDate || 'N/A'}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #ffe4e6', paddingBottom: '8px' }}>
                                                    <span style={{ color: '#475569' }}>Separation Reason:</span>
                                                    <strong style={{ color: '#334155' }}>{selectedDetailStaff.separationReason || 'N/A'}</strong>
                                                </div>
                                                
                                                <div style={{ background: 'white', padding: '12px', borderRadius: '10px', border: '1px solid #fecdd3', marginTop: '4px' }}>
                                                    <span style={{ fontSize: '0.78rem', color: '#be123c', display: 'block', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>Handover Notes & Exit Remarks:</span>
                                                    <p style={{ margin: 0, color: '#9f1239', fontSize: '0.85rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                                        {selectedDetailStaff.separationNotes || 'No exit notes recorded for this termination.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* CONDITION 2: COMPENSATION & APPRAISAL CONTEXT */}
                                {activeContext === 'salary' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                                <h4 style={{ color: '#475569', margin: '0 0 10px 0', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold' }}>💳 Base Pay & Bonus Setup</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#64748b' }}>Basic Salary (Base):</span>
                                                        <strong style={{ color: '#1e293b' }}>₹{parseFloat(selectedDetailStaff.salary || 0).toLocaleString('en-IN')}</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#64748b' }}>Max Monthly KPI Bonus:</span>
                                                        <strong style={{ color: '#0ea5e9' }}>₹{parseFloat(selectedDetailStaff.incentive || 0).toLocaleString('en-IN')}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                                <h4 style={{ color: '#475569', margin: '0 0 10px 0', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold' }}>🏦 Bank Account Details</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#64748b' }}>Bank Name:</span>
                                                        <strong style={{ color: '#1e293b' }}>{selectedDetailStaff.bankName || 'N/A'}</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#64748b' }}>Account Number:</span>
                                                        <strong style={{ color: '#1e293b' }}>{selectedDetailStaff.accountNumber || 'N/A'}</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#64748b' }}>IFSC Code:</span>
                                                        <strong style={{ color: '#1e293b' }}>{selectedDetailStaff.ifscCode || 'N/A'}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                            <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                📈 Chronological Appraisal & Hike History
                                            </h3>
                                            {selectedDetailStaff.salaryHistory && selectedDetailStaff.salaryHistory.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                                                    {selectedDetailStaff.salaryHistory.map((hike, idx) => (
                                                        <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ color: '#64748b', fontWeight: '500' }}>{hike.date}</span>
                                                                <strong style={{ color: idx === 0 ? '#64748b' : '#10b981', fontSize: '0.95rem' }}>
                                                                    ₹{parseFloat(hike.amount).toLocaleString('en-IN')}
                                                                </strong>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '2px' }}>
                                                                <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                                                                    {idx === 0 ? 'Base Joined Salary' : 'Appraisal Salary Bump'}
                                                                </span>
                                                                <span style={{ color: '#475569', fontWeight: 'bold' }}>{hike.reason}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '15px' }}>
                                                    No salary hikes or appraisals logged for this profile yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* CONDITION 3: COMPLIANCE & DOCUMENTS CONTEXT */}
                                {activeContext === 'compliance' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                            <h4 style={{ color: '#475569', margin: '0 0 1rem 0', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>✅ Compliance Verification Status</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
                                                <div style={{ padding: '10px', borderRadius: '8px', background: selectedDetailStaff.aadhaarCollected ? '#dcfce7' : '#fee2e2', border: '1px solid #cbd5e1' }}>
                                                    <span style={{ fontSize: '1.5rem', display: 'block' }}>🖼️</span>
                                                    <strong style={{ fontSize: '0.8rem', color: selectedDetailStaff.aadhaarCollected ? '#15803d' : '#ef4444' }}>
                                                        Aadhaar Card: {selectedDetailStaff.aadhaarCollected ? 'OK ✅' : 'MISSING âŒ'}
                                                    </strong>
                                                </div>
                                                <div style={{ padding: '10px', borderRadius: '8px', background: selectedDetailStaff.panCollected ? '#dcfce7' : '#fee2e2', border: '1px solid #cbd5e1' }}>
                                                    <span style={{ fontSize: '1.5rem', display: 'block' }}>🖼️</span>
                                                    <strong style={{ fontSize: '0.8rem', color: selectedDetailStaff.panCollected ? '#15803d' : '#ef4444' }}>
                                                        PAN Card: {selectedDetailStaff.panCollected ? 'OK ✅' : 'MISSING âŒ'}
                                                    </strong>
                                                </div>
                                                <div style={{ padding: '10px', borderRadius: '8px', background: selectedDetailStaff.medicalCollected ? '#dcfce7' : '#fee2e2', border: '1px solid #cbd5e1' }}>
                                                    <span style={{ fontSize: '1.5rem', display: 'block' }}>🖼️</span>
                                                    <strong style={{ fontSize: '0.8rem', color: selectedDetailStaff.medicalCollected ? '#15803d' : '#ef4444' }}>
                                                        Medical Certificate: {selectedDetailStaff.medicalCollected ? 'OK ✅' : 'MISSING âŒ'}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                            <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                📄 Compliance Documents Download
                                            </h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {employeeDocs.length > 0 ? (
                                                    employeeDocs.map((doc, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={doc.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            style={{
                                                                background: 'white',
                                                                color: '#009ceb',
                                                                textDecoration: 'none',
                                                                padding: '10px 14px',
                                                                borderRadius: '8px',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 'bold',
                                                                border: '1px solid #cbd5e1',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between'
                                                            }}
                                                        >
                                                            <span>📄 {doc.name}</span>
                                                            <span style={{ fontSize: '0.8rem' }}>Download File 📥</span>
                                                        </a>
                                                    ))
                                                ) : (
                                                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '15px' }}>
                                                        No compliance documents uploaded yet.
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* CONDITION 4: PERSONAL & CONTACT PROFILE SHEET */}
                                {(activeContext === 'personal' || activeContext === 'contact') && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.25rem' }}>
                                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                            <h4 style={{ color: '#475569', margin: '0 0 1rem 0', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>👤 Personal Information</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Call Name / Nickname:</span>
                                                    <strong style={{ color: '#1e293b' }}>{selectedDetailStaff.nickname || 'N/A'}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Gender:</span>
                                                    <strong style={{ color: '#1e293b' }}>{selectedDetailStaff.gender || 'N/A'}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Date of Birth:</span>
                                                    <strong style={{ color: '#1e293b' }}>{selectedDetailStaff.dob || 'N/A'}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Blood Group:</span>
                                                    {selectedDetailStaff.bloodGroup ? (
                                                        <span style={{ background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{selectedDetailStaff.bloodGroup}</span>
                                                    ) : <strong>N/A</strong>}
                                                </div>
                                            </div>
                                            
                                            <h4 style={{ color: '#475569', margin: '1.5rem 0 1rem 0', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>📞 Contact Details</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Mobile Number:</span>
                                                    <strong style={{ color: '#1e293b' }}>{selectedDetailStaff.phone || 'N/A'}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Alternate Phone:</span>
                                                    <strong style={{ color: '#1e293b' }}>{selectedDetailStaff.alternatePhone || 'N/A'}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Email Address:</span>
                                                    <strong style={{ color: '#1e293b' }}>{selectedDetailStaff.email || 'N/A'}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                                <h4 style={{ color: '#475569', margin: '0 0 1rem 0', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>🏡 Address Coordinates</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', marginBottom: '2px', fontWeight: 'bold' }}>Current Address:</span>
                                                        <p style={{ margin: 0, color: '#334155', lineHeight: '1.4' }}>{selectedDetailStaff.currentAddress || 'No current address recorded.'}</p>
                                                    </div>
                                                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                                                        <span style={{ color: '#64748b', display: 'block', marginBottom: '2px', fontWeight: 'bold' }}>Permanent Address:</span>
                                                        <p style={{ margin: 0, color: '#334155', lineHeight: '1.4' }}>{selectedDetailStaff.permanentAddress || 'No permanent address recorded.'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                                <h4 style={{ color: '#475569', margin: '0 0 1rem 0', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>🚨 Emergency Reference</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#64748b' }}>Emergency Name:</span>
                                                        <strong style={{ color: '#1e293b' }}>{selectedDetailStaff.emergencyContact || 'N/A'}</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#64748b' }}>Emergency Phone:</span>
                                                        <strong style={{ color: '#be123c' }}>{selectedDetailStaff.emergencyPhone || 'N/A'}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* CONDITION 5: MONTH-ON-MONTH PAYOUTS & ANALYTICS LEDGER */}
                                {(activeContext === 'analytics' || activeContext === 'general' || !activeContext) && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.75rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.5px' }}>
                                                📅 Month-on-Month Payment History
                                            </h3>

                                            <div style={{ overflowX: 'auto', background: '#f8fafc', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                                    <thead>
                                                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                                            <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#475569' }}>Month</th>
                                                            <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#475569' }}>Leaves</th>
                                                            <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#475569', textAlign: 'center' }}>KPI Rating</th>
                                                            <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#475569' }}>KPI Bonus</th>
                                                            <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#475569' }}>Net Paid</th>
                                                            <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#475569' }}>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {history.length > 0 ? (
                                                            history.map((record) => (
                                                                <tr key={record.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                                    <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>
                                                                        {(() => {
                                                                            const [y, m] = record.month.split('-');
                                                                            const d = new Date(parseInt(y), parseInt(m) - 1, 1);
                                                                            return d.toLocaleDateString('default', { month: 'short', year: 'numeric' });
                                                                        })()}
                                                                    </td>
                                                                    <td style={{ padding: '10px 12px', color: '#475569' }}>
                                                                        {record.leavesTaken || 0} Leaves
                                                                    </td>
                                                                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#eab308' }}>
                                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                                            <span key={i}>{i < (record.kpiRating || 0) ? '★' : '☆'}</span>
                                                                        ))}
                                                                    </td>
                                                                    <td style={{ padding: '10px 12px', color: '#10b981', fontWeight: '500' }}>
                                                                        ₹{(record.kpiBonusPaid || 0).toLocaleString('en-IN')}
                                                                    </td>
                                                                    <td style={{ padding: '10px 12px', color: '#1e293b', fontWeight: 'bold' }}>
                                                                        ₹{(record.netSalaryPaid || 0).toLocaleString('en-IN')}
                                                                    </td>
                                                                    <td style={{ padding: '10px 12px' }}>
                                                                        <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
                                                                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>Paid ✅</span>
                                                                            <span style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '2px' }}>
                                                                                {record.datePaid ? new Date(record.datePaid).toLocaleDateString() : ''}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                                                    No payroll logs recorded for this employee yet.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                            
                                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                                <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                                    📈 Performance Scorecard
                                                </h3>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                    <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Avg KPI Rating</span>
                                                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#eab308', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                            ⭐ {avgKpi}
                                                        </div>
                                                    </div>
                                                    <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Attendance Consistency</span>
                                                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                                                            {avgAtt}%
                                                        </div>
                                                    </div>
                                                    <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Leaves Taken</span>
                                                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
                                                            {totalLeavesHistory} Days
                                                        </div>
                                                    </div>
                                                    <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Payout (To Date)</span>
                                                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                                                            ₹{totalEarnings.toLocaleString('en-IN')}
                                                        </div>
                                                    </div>
                                                </div>

                                                {history.length > 0 && (
                                                    <div style={{ marginTop: '1.25rem', borderTop: '1px solid #cbd5e1', paddingTop: '1rem' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>KPI Rating Trend (Last 5 Months)</span>
                                                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100px', background: 'white', borderRadius: '10px', border: '1px solid #cbd5e1', padding: '10px' }}>
                                                            {history.slice(0, 5).reverse().map((rec, index) => {
                                                                const rating = rec.kpiRating || 3;
                                                                const pct = (rating / 5) * 100;
                                                                return (
                                                                    <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                                                        <div style={{ fontSize: '0.7rem', color: '#eab308', fontWeight: 'bold', marginBottom: '2px' }}>{rating}★</div>
                                                                        <div style={{ width: '16px', height: `${pct * 0.6}px`, background: '#f59e0b', borderRadius: '4px 4px 0 0', transition: 'all 0.3s' }}></div>
                                                                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>
                                                                            {(() => {
                                                                                const [_, m] = rec.month.split('-');
                                                                                return `${m}/${rec.month.substring(2,4)}`;
                                                                            })()}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    );
                })()
            }


            {
                croppingImage && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '90%', maxWidth: '600px' }}>
                            <ImageCropper
                                imageSrc={croppingImage}
                                onCropComplete={onCropComplete}
                                aspect={cropTarget === 'badge' ? 1 : 4 / 3}
                            />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button onClick={() => setCroppingImage(null)} style={{ padding: '0.8rem 1.5rem', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* ── TOAST NOTIFICATION ── */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: '12px',
                    background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${toast.type === 'error' ? '#fca5a5' : '#86efac'}`,
                    color: toast.type === 'error' ? '#dc2626' : '#16a34a',
                    padding: '0.85rem 1.25rem', borderRadius: '14px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    fontWeight: '600', fontSize: '0.9rem',
                    animation: 'slideInRight 0.3s ease'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>{toast.type === 'error' ? 'âŒ' : '✅'}</span>
                    {toast.msg}
                </div>
            )}

            {/* ── TERMINATION MODAL ── */}
            {termModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setTermModal(null)}>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}
                        onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>📍</div>
                            <div>
                                <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a' }}>Exit & Separation</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{termModal.staff?.fullName}</div>
                            </div>
                            <button onClick={() => setTermModal(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>🗑️</button>
                        </div>

                        {/* Fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                                    Exit / Termination Date
                                </label>
                                <input type="date" value={termModalDate} onChange={e => setTermModalDate(e.target.value)}
                                    style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.95rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                                    Separation Reason
                                </label>
                                <select value={termModalReason} onChange={e => setTermModalReason(e.target.value)}
                                    style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.95rem', color: '#0f172a', outline: 'none', background: 'white', boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer' }}>
                                    {['Resigned', 'Absconded', 'Performance', 'End of Contract', 'Relocated', 'Misconduct', 'Medical', 'Other'].map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                                    Handover / Exit Notes <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '0.72rem' }}>(optional)</span>
                                </label>
                                <textarea value={termModalNotes} onChange={e => setTermModalNotes(e.target.value)}
                                    rows={3} placeholder="e.g. Keys returned, training handover complete..."
                                    style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.88rem', color: '#0f172a', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button onClick={() => setTermModal(null)}
                                style={{ flex: 1, padding: '0.75rem', border: '1.5px solid #e2e8f0', background: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', color: '#64748b', fontSize: '0.9rem' }}>
                                Cancel
                            </button>
                            <button onClick={async () => {
                                if (!termModalDate) { showToast('Please enter the exit date.', 'error'); return; }
                                const updates = { status: 'Terminated', termDate: termModalDate, termReason: termModalReason, termNotes: termModalNotes };
                                await db.updateStaff(termModal.staff.id, updates);
                                setStaffList(prev => prev.map(s => s.id === termModal.staff.id ? { ...s, ...updates } : s));
                                setTermModal(null);
                                showToast(`${termModal.staff.fullName} marked as Terminated.`);
                            }}
                                style={{ flex: 2, padding: '0.75rem', border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', color: 'white', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(239,68,68,0.35)' }}>
                                🔴 Confirm Termination
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DOC LABEL MODAL ── */}
            {docLabelModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setDocLabelModal(null)}>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '420px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>📍</div>
                            <div>
                                <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a' }}>Name This Document</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{docLabelModal.staff?.fullName}</div>
                            </div>
                            <button onClick={() => setDocLabelModal(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>🗑️</button>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                                Document Label / Title
                            </label>
                            <input type="text" value={docLabelInput} onChange={e => setDocLabelInput(e.target.value)}
                                autoFocus
                                placeholder="e.g. Aadhaar Card, Medical Certificate, Contract..."
                                style={{ width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.95rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                onKeyDown={async e => { if (e.key === 'Enter') e.target.blur(); }} />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                                {['Aadhaar Card', 'PAN Card', 'Resume', 'Medical Certificate', 'Health License', 'Contract Agreement', 'Police Verification'].map(tag => (
                                    <button key={tag} onClick={() => setDocLabelInput(tag)}
                                        style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: '20px', background: docLabelInput === tag ? '#0ea5e9' : '#f8fafc', color: docLabelInput === tag ? 'white' : '#64748b', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600', transition: 'all 0.15s' }}>
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button onClick={() => setDocLabelModal(null)}
                                style={{ flex: 1, padding: '0.75rem', border: '1.5px solid #e2e8f0', background: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', color: '#64748b', fontSize: '0.9rem' }}>
                                Cancel
                            </button>
                            <button onClick={async () => {
                                if (!docLabelInput.trim()) { showToast('Please enter a document label.', 'error'); return; }
                                const { staff, file } = docLabelModal;
                                setIsUploading(true);
                                setDocLabelModal(null);
                                try {
                                    const url = await uploadMedia(file);
                                    const updatedDocs = [...(staff.documents || []), { name: docLabelInput.trim(), url }];
                                    const updates = { documents: updatedDocs };
                                    const lowerLabel = docLabelInput.toLowerCase();
                                    if (lowerLabel.includes('aadhaar')) { updates.aadhaarDocUrl = url; updates.aadhaarCollected = true; }
                                    else if (lowerLabel.includes('medical')) { updates.medicalDocUrl = url; updates.medicalCollected = true; }
                                    else if (lowerLabel.includes('pan')) { updates.panCollected = true; }
                                    else if (lowerLabel.includes('resume')) { updates.resumeDocUrl = url; }
                                    await db.updateStaff(staff.id, updates);
                                    setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, ...updates } : s));
                                    showToast('Document uploaded and saved!');
                                } catch (error) {
                                    showToast('Upload failed: ' + error.message, 'error');
                                } finally {
                                    setIsUploading(false);
                                }
                            }}
                                style={{ flex: 2, padding: '0.75rem', border: 'none', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', color: 'white', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(14,165,233,0.35)' }}>
                                📎 Upload Document
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DAILY WAGE PAYMENT MODAL ── */}
            {dailyWagePayModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setDailyWagePayModal(null)}>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '420px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>📍</div>
                            <div>
                                <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a' }}>Daily Wage Payment</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{dailyWagePayModal.staff?.fullName} · ₹{dailyWagePayModal.payData?.dailyRate}/day</div>
                            </div>
                            <button onClick={() => setDailyWagePayModal(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>🗑️</button>
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                                Days Worked This Month
                            </label>
                            <input
                                type="number" min="1" max="31"
                                value={dailyWageDays}
                                onChange={e => setDailyWageDays(e.target.value)}
                                autoFocus
                                placeholder="e.g. 24"
                                style={{ width: '100%', padding: '0.75rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', textAlign: 'center' }}
                            />
                            {dailyWageDays && dailyWagePayModal.payData?.dailyRate && (
                                <div style={{ marginTop: '12px', background: '#fef3c7', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid #fde68a' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: '600', marginBottom: '4px' }}>Net Payable Amount</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#d97706' }}>
                                        ₹{(parseFloat(dailyWagePayModal.payData.dailyRate) * parseInt(dailyWageDays || 0)).toLocaleString('en-IN')}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#78350f', marginTop: '2px' }}>
                                        {dailyWageDays} days × ₹{dailyWagePayModal.payData.dailyRate}/day
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setDailyWagePayModal(null)}
                                style={{ flex: 1, padding: '0.75rem', border: '1.5px solid #e2e8f0', background: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', color: '#64748b', fontSize: '0.9rem' }}>
                                Cancel
                            </button>
                            <button onClick={async () => {
                                const days = parseInt(dailyWageDays);
                                if (!days || days < 1) { showToast('Please enter valid days worked.', 'error'); return; }
                                const { staff, payData } = dailyWagePayModal;
                                const net = (parseFloat(payData.dailyRate) || 0) * days;
                                await handlePayPayroll(staff.id, {
                                    ...payData,
                                    basicSalary: payData.dailyRate,
                                    presentDays: days,
                                    netSalaryPaid: net,
                                    payType: 'Daily',
                                    datePaid: new Date().toISOString()
                                });
                                setDailyWagePayModal(null);
                                showToast(`${staff.fullName} — ₹${net.toLocaleString('en-IN')} paid for ${days} days.`);
                            }}
                                style={{ flex: 2, padding: '0.75rem', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', color: 'white', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>
                                💰 Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── WORKER INTERVIEW REVIEW MODAL ── */}
            {showInterviewModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setShowInterviewModal(null)}>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>📝</div>
                            <div>
                                <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a' }}>Review Applicant Interview</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{showInterviewModal.fullName} · {showInterviewModal.appliedPosition}</div>
                            </div>
                            <button onClick={() => setShowInterviewModal(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.75rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>&times;</button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                const updates = {
                                    status: selectedApplicationStatus,
                                    interviewScore: interviewScoreInput,
                                    interviewNotes: interviewNotesInput
                                };
                                await db.updateWorkerApplication(showInterviewModal.id, updates);
                                setWorkerApplications(prev => prev.map(a => a.id === showInterviewModal.id ? { ...a, ...updates } : a));
                                setShowInterviewModal(null);
                                showToast('Interview details updated successfully!');
                            } catch (err) {
                                showToast('Failed to update details: ' + err.message, 'error');
                            }
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className={styles.formGroup}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>Application Status</label>
                                    <select 
                                        value={selectedApplicationStatus} 
                                        onChange={e => setSelectedApplicationStatus(e.target.value)}
                                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Interview Scheduled">Interview Scheduled</option>
                                        <option value="Not Fit">Not Fit</option>
                                        <option value="Selected">Selected</option>
                                        <option value="Coming">Coming</option>
                                        <option value="Joined">Joined</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>Interview Score (0 - 10)</label>
                                    <input 
                                        type="number" min="0" max="10" step="0.5"
                                        value={interviewScoreInput} 
                                        onChange={e => setInterviewScoreInput(e.target.value)}
                                        placeholder="e.g. 8.5"
                                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' }}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>Interview Notes / Evaluation</label>
                                    <textarea 
                                        rows={4}
                                        value={interviewNotesInput} 
                                        onChange={e => setInterviewNotesInput(e.target.value)}
                                        placeholder="Enter details about communication skills, experience, availability..."
                                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setShowInterviewModal(null)}
                                    style={{ flex: 1, padding: '0.75rem', border: '1.5px solid #e2e8f0', background: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', color: '#64748b', fontSize: '0.9rem' }}>
                                    Cancel
                                </button>
                                <button type="submit"
                                    style={{ flex: 2, padding: '0.75rem', border: 'none', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', color: 'white', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(14,165,233,0.35)' }}>
                                    Save Review
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── WORKER JOIN APPROVAL / PROMOTION MODAL ── */}
            {showJoinApprovalModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setShowJoinApprovalModal(null)}>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🤝</div>
                            <div>
                                <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a' }}>Promote to Onboarding Staff</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{showJoinApprovalModal.fullName} · {showJoinApprovalModal.phone}</div>
                            </div>
                            <button onClick={() => setShowJoinApprovalModal(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.75rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>&times;</button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                const app = showJoinApprovalModal;
                                
                                // Format documents array for staff
                                const formattedDocs = (app.documents || []).map(d => ({
                                    name: d.name,
                                    url: d.url
                                }));
                                
                                // Check if Aadhaar is among documents
                                const aadhaarDoc = formattedDocs.find(d => d.name.toLowerCase().includes('aadhaar'));
                                const medicalDoc = formattedDocs.find(d => d.name.toLowerCase().includes('medical'));
                                const panDoc = formattedDocs.find(d => d.name.toLowerCase().includes('pan'));
                                
                                const newStaff = {
                                    fullName: app.fullName,
                                    nickname: app.fullName.split(' ')[0].toUpperCase(),
                                    phone: app.phone,
                                    gender: app.gender,
                                    dob: '',
                                    email: '',
                                    bloodGroup: '',
                                    alternatePhone: '',
                                    currentAddress: app.currentPlace || '',
                                    permanentAddress: app.nativePlace || '',
                                    emergencyContact: '',
                                    emergencyPhone: '',
                                    bankName: '',
                                    accountNumber: '',
                                    ifscCode: '',
                                    
                                    // Documents/Compliance
                                    aadhaarCollected: !!aadhaarDoc,
                                    aadhaarDocUrl: aadhaarDoc ? aadhaarDoc.url : '',
                                    medicalCollected: !!medicalDoc,
                                    medicalDocUrl: medicalDoc ? medicalDoc.url : '',
                                    panCollected: !!panDoc,
                                    documents: formattedDocs,
                                    
                                    // Job parameters
                                    status: 'Onboarding', // Put them into Onboarding status
                                    position: joinPositionInput,
                                    salary: joinSalaryInput,
                                    assignedOutlet: joinOutletInput,
                                    joinDate: joinDateInput,
                                    salaryHistory: [
                                        {
                                            date: joinDateInput,
                                            amount: parseFloat(joinSalaryInput) || 0,
                                            reason: 'Initial Hire'
                                        }
                                    ]
                                };

                                // 1. Save as staff
                                const savedStaff = await db.addStaff(newStaff);
                                
                                // 2. Delete application
                                await db.deleteWorkerApplication(app.id);

                                // 3. Update local states
                                setStaffList(prev => [...prev, savedStaff]);
                                setWorkerApplications(prev => prev.filter(a => a.id !== app.id));
                                setShowJoinApprovalModal(null);
                                showToast(`${app.fullName} has been successfully promoted to Onboarding Staff!`);
                            } catch (err) {
                                showToast('Failed to onboard worker: ' + err.message, 'error');
                            }
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className={styles.formGroup}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>Final Assigned Position *</label>
                                    <select 
                                        value={joinPositionInput} 
                                        onChange={e => setJoinPositionInput(e.target.value)}
                                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }}
                                    >
                                        <option value="Waiter">Waiter / Waitress</option>
                                        <option value="Chef">Chef / Cook</option>
                                        <option value="Cashier">Cashier</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Helper">Kitchen Helper</option>
                                        <option value="Delivery">Delivery Boy</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>Starting Monthly Salary (INR) *</label>
                                    <input 
                                        type="number" required
                                        value={joinSalaryInput} 
                                        onChange={e => setJoinSalaryInput(e.target.value)}
                                        placeholder="e.g. 18000"
                                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' }}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>Assigned Outlet / Location *</label>
                                    <select 
                                        value={joinOutletInput} 
                                        onChange={e => setJoinOutletInput(e.target.value)}
                                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }}
                                    >
                                        <option value="">Head Office / Unassigned</option>
                                        {runningFranchises.map(outlet => (
                                            <option key={outlet.id} value={outlet.outletName}>{outlet.outletName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>Join Date *</label>
                                    <input 
                                        type="date" required
                                        value={joinDateInput} 
                                        onChange={e => setJoinDateInput(e.target.value)}
                                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setShowJoinApprovalModal(null)}
                                    style={{ flex: 1, padding: '0.75rem', border: '1.5px solid #e2e8f0', background: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', color: '#64748b', fontSize: '0.9rem' }}>
                                    Cancel
                                </button>
                                <button type="submit"
                                    style={{ flex: 2, padding: '0.75rem', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', color: 'white', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}>
                                    Create Staff Entry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div >
    );
};

export default AdminDashboard;