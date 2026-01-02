import React, { useState, useEffect } from 'react';
import db from '../../utils/db';

const POS = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState(''); // 'cash', 'card', 'upi'
    const [customerName, setCustomerName] = useState('Walk-in Customer');
    const [customerPhone, setCustomerPhone] = useState('');
    const [storedCustomers, setStoredCustomers] = useState([]);

    useEffect(() => {
        const initData = async () => {
            const prods = await db.getProducts();
            setProducts(prods);
            await refreshCustomers();
        };
        initData();
    }, []);

    const refreshCustomers = async () => {
        const custs = await db.getCustomers();
        setStoredCustomers(custs);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.flavor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.name === product.name && item.flavor === product.flavor);
        if (existingItem) {
            setCart(cart.map(item =>
                item.name === product.name && item.flavor === product.flavor
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            // Use product price or default if missing
            const price = product.price ? parseFloat(product.price) : 120.00;
            setCart([...cart, { ...product, quantity: 1, price }]);
        }
    };

    const updateQuantity = (index, delta) => {
        const newCart = [...cart];
        newCart[index].quantity += delta;
        if (newCart[index].quantity <= 0) {
            newCart.splice(index, 1);
        }
        setCart(newCart);
    };

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05; // 5% GST
    const total = subtotal + tax;

    const generateBillText = () => {
        let text = `*High Laban Supermarket*\n`;
        text += `Date: ${new Date().toLocaleDateString('en-IN')}\n`;
        text += `Customer: ${customerName}\n\n`;
        text += `*Items:*\n`;
        cart.forEach(item => {
            text += `${item.name} x${item.quantity}: ₹${(item.price * item.quantity).toFixed(2)}\n`;
        });
        text += `\nSubtotal: ₹${subtotal.toFixed(2)}`;
        text += `\nGST (5%): ₹${tax.toFixed(2)}`;
        text += `\n*TOTAL: ₹${total.toFixed(2)}*\n\n`;
        text += `Thank you for shopping with us!`;
        return encodeURIComponent(text);
    };

    const handleWhatsAppShare = () => {
        if (!customerPhone) return alert("Please enter customer phone number");
        const text = generateBillText();
        window.open(`https://wa.me/${customerPhone}?text=${text}`, '_blank');
    };

    const handleCheckout = () => {
        if (cart.length === 0) return alert("Cart is empty!");
        setShowPaymentModal(true);
    };

    const handlePhoneChange = (e) => {
        const phone = e.target.value;
        setCustomerPhone(phone);

        // Lookup customer locally from stored list
        const existingCustomer = storedCustomers.find(c => c.phone === phone);
        if (existingCustomer) {
            setCustomerName(existingCustomer.name);
        }
    };

    const confirmPayment = async (method) => {
        setPaymentMethod(method);

        // Save Customer
        if (customerPhone) {
            await db.saveCustomer({
                name: customerName,
                phone: customerPhone,
                lastOrder: new Date().toISOString()
            });
            refreshCustomers(); // Update list immediately
        }

        // Save Order
        const orderData = {
            customer: customerName,
            total,
            items: cart,
            status: 'completed' // Ensure status is set
        };
        await db.createOrder(orderData);

        // Auto-Share WhatsApp if phone exists
        if (customerPhone) {
            const text = generateBillText();
            // Open immediately to avoid popup blockers (triggered by button click)
            window.open(`https://wa.me/${customerPhone}?text=${text}`, '_blank');
        }

        setShowPaymentModal(false);
        setShowSuccessModal(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleNewOrder = () => {
        setCart([]);
        // Reset to default but clear phone
        setCustomerName('Walk-in Customer');
        setCustomerPhone('');
        setPaymentMethod('');
        setShowSuccessModal(false);
    };

    return (
        <div className="pos-container">
            <style>{`
                .pos-container {
                    display: flex;
                    height: calc(100vh - 100px);
                    gap: 1.5rem;
                }
                .pos-left { flex: 2; display: flex; flexDirection: column; gap: 1rem; }
                .pos-right { flex: 1; background: white; borderRadius: 12px; border: 1px solid #ddd; display: flex; flexDirection: column; }
                
                @media (max-width: 900px) {
                    .pos-container {
                        flex-direction: column;
                        height: auto; /* Allow full height scrolling */
                    }
                    .pos-left, .pos-right {
                        flex: none;
                        width: 100%;
                    }
                    /* Adjust product grid for mobile */
                    .pos-product-grid {
                         grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
                    }
                }
            `}</style>
            {/* Left: Product Grid */}
            <div className="pos-left" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="text"
                    placeholder="Search Products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '1rem',
                        width: '100%'
                    }}
                />

                <div className="pos-product-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '1rem',
                    overflowY: 'auto',
                    paddingRight: '0.5rem'
                }}>
                    {filteredProducts.map((product, index) => {
                        const cartItem = cart.find(item => item.name === product.name && item.flavor === product.flavor);
                        const qty = cartItem ? cartItem.quantity : 0;

                        return (
                            <div key={index}
                                onClick={() => addToCart(product)}
                                style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: qty > 0 ? '2px solid var(--color-accent)' : '1px solid #eee',
                                    cursor: 'pointer',
                                    transition: 'transform 0.1s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative'
                                }}
                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                {qty > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        background: 'var(--color-accent)',
                                        color: 'white',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold',
                                        zIndex: 10,
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                    }}>
                                        {qty}
                                    </div>
                                )}
                                <div style={{ height: '120px', overflow: 'hidden' }}>
                                    {product.img && (product.img.includes('video') || product.img.match(/\.(mp4|webm|ogg|mov)$/i)) ? (
                                        <video src={product.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                                    ) : (
                                        <img src={product.img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )}
                                </div>
                                <div style={{ padding: '0.75rem' }}>
                                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>{product.name}</h4>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{product.flavor}</div>
                                    <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 'bold', color: 'var(--color-accent)' }}>₹{product.price || 120}.00</div>
                                        {qty > 0 && (
                                            <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>
                                                Total: ₹{((product.price || 120) * qty).toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right: Cart/Bill */}
            <div className="pos-right" style={{ background: 'white', borderRadius: '12px', border: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Current Bill</h2>
                    <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        style={{ marginTop: '0.5rem', width: '100%', padding: '5px', border: 'none', borderBottom: '1px solid #eee', fontSize: '0.9rem' }}
                        placeholder="Customer Name"
                    />
                    <input
                        type="tel"
                        value={customerPhone}
                        onChange={handlePhoneChange}
                        list="customer-phones"
                        style={{ marginTop: '0.5rem', width: '100%', padding: '5px', border: 'none', borderBottom: '1px solid #eee', fontSize: '0.9rem' }}
                        placeholder="Phone Number (e.g. 919037783864)"
                    />
                    <datalist id="customer-phones">
                        {storedCustomers.map((c, i) => (
                            <option key={i} value={c.phone}>{c.name}</option>
                        ))}
                    </datalist>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#888', marginTop: '2rem' }}>Cart is empty</div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>₹{item.price.toFixed(2)} x {item.quantity}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 'bold' }}>Total: ₹{(item.price * item.quantity).toFixed(2)}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <button onClick={() => updateQuantity(idx, 1)} style={{ cursor: 'pointer', background: '#eef', border: 'none', borderRadius: '4px', width: '20px' }}>+</button>
                                        <button onClick={() => updateQuantity(idx, -1)} style={{ cursor: 'pointer', background: '#fee', border: 'none', borderRadius: '4px', width: '20px' }}>-</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ padding: '1.5rem', background: '#f9fafb', borderTop: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#666' }}>
                        <span>GST (5%)</span>
                        <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        style={{ width: '100%', padding: '1rem', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Checkout
                    </button>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '400px', textAlign: 'center' }}>
                        <h2 style={{ marginTop: 0 }}>Select Payment Method</h2>
                        <div style={{ margin: '2rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>₹{total.toFixed(2)}</div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <button onClick={() => confirmPayment('Cash')} style={paymentButtonStyle}>💸 Cash</button>
                            <button onClick={() => confirmPayment('Card')} style={paymentButtonStyle}>💳 Card</button>
                            <button onClick={() => confirmPayment('UPI')} style={paymentButtonStyle}>📱 UPI</button>
                            <button onClick={() => setShowPaymentModal(false)} style={{ ...paymentButtonStyle, background: '#fee', color: '#ef4444' }}>❌ Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success/Action Modal */}
            {showSuccessModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '400px', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem', color: '#065f46' }}>✓</div>
                        <h2 style={{ margin: 0 }}>Order Complete!</h2>
                        <p style={{ color: '#666', marginBottom: '2rem' }}>Payment of ₹{total.toFixed(2)} received.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button
                                onClick={handlePrint}
                                style={{ padding: '1rem', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            >
                                🖨️ Print Bill
                            </button>
                            {customerPhone && (
                                <button
                                    onClick={handleWhatsAppShare}
                                    style={{ padding: '1rem', background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                >
                                    📱 Share on WhatsApp
                                </button>
                            )}
                            <button
                                onClick={handleNewOrder}
                                style={{ padding: '1rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                🛍️ New Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Printable Receipt (Hidden unless printing) */}
            <div className="print-only" style={{ display: 'none' }}>
                <style>{`
                    @media print {
                        @page {
                            size: 80mm auto;
                            margin: 0mm;
                        }
                        body * { visibility: hidden; }
                        .print-only, .print-only * { visibility: visible; }
                        .print-only { 
                            position: absolute; 
                            left: 0; 
                            top: 0; 
                            width: 78mm; /* Slightly less than 80 to prevent overflow */
                            padding: 5mm;
                            display: block !important;
                            font-family: 'Courier New', Courier, monospace;
                            font-size: 12px;
                            color: black;
                            background: white;
                        }
                        /* Hide default browser headers/footers if supported */
                        header, footer { display: none !important; }
                    }
                `}</style>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>High Laban</div>
                    <div style={{ fontSize: '10px' }}>Supermarket & Bakery</div>
                    <div style={{ fontSize: '10px' }}>123 Street Name, City</div>
                    <div style={{ fontSize: '10px' }}>Tel: +91 94470 08421</div>
                    <div style={{ margin: '5px 0' }}>--------------------------------</div>
                </div>

                <div style={{ marginBottom: '10px', fontSize: '10px' }}>
                    <div>Date: {new Date().toLocaleString('en-IN')}</div>
                    <div>Receipt: #{Math.floor(Math.random() * 10000)}</div>
                    <div>Customer: {customerName}</div>
                    {customerPhone && <div>Phone: {customerPhone}</div>}
                    <div>Payment: {paymentMethod}</div>
                </div>

                <div style={{ margin: '5px 0' }}>--------------------------------</div>

                <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', fontWeight: 'bold', borderBottom: '1px dashed #000', paddingBottom: '2px', marginBottom: '5px' }}>
                        <span style={{ flex: 1.5 }}>Item</span>
                        <span style={{ flex: 0.5, textAlign: 'center' }}>Qty</span>
                        <span style={{ flex: 1, textAlign: 'right' }}>Price</span>
                    </div>
                    {cart.map((item, i) => (
                        <div key={i} style={{ display: 'flex', marginBottom: '2px' }}>
                            <span style={{ flex: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                            <span style={{ flex: 0.5, textAlign: 'center' }}>{item.quantity}</span>
                            <span style={{ flex: 1, textAlign: 'right' }}>{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', marginTop: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Subtotal</span>
                        <span>{subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>GST (5%)</span>
                        <span>{tax.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '5px' }}>
                        <span>TOTAL</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '10px' }}>
                    <div>--------------------------------</div>
                    <div style={{ marginTop: '5px' }}>Thank you for shopping!</div>
                    <div>Visit Again</div>
                </div>
            </div>
        </div>
    );
};

const paymentButtonStyle = {
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #eee',
    background: '#f8f9fa',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem'
};

export default POS;
