import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiPhone, FiMail, FiMapPin, FiSend, FiInstagram } from 'react-icons/fi';
import { FaWhatsapp, FaLinkedinIn } from 'react-icons/fa';
import styles from './ContactUs.module.css';

export default function ContactUs() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
    const [sent, setSent] = useState(false);

    const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        // compose WhatsApp message as fallback
        const msg = encodeURIComponent(
            `*New Contact Enquiry*\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nMessage: ${form.message}`
        );
        window.open(`https://wa.me/917353100100?text=${msg}`, '_blank');
        setSent(true);
        setForm({ name: '', email: '', phone: '', message: '' });
    };

    return (
        <>
            <Helmet>
                <title>Contact Us | High Laban</title>
                <meta name="description" content="Get in touch with High Laban – Egypt's finest desserts in India. Contact our HQ, find us on the map, or reach out via WhatsApp." />
            </Helmet>

            <div className={styles.page}>
                {/* ── Hero Banner ── */}
                <div className={styles.hero}>
                    <div className={styles.heroBadge}>📍 We&apos;d love to hear from you</div>
                    <h1 className={styles.heroTitle}>Contact <span>Us</span></h1>
                    <p className={styles.heroSub}>Reach out for franchise queries, bulk orders, or just to say hello.</p>
                </div>

                <div className={styles.content}>

                    {/* ── Info Cards ── */}
                    <div className={styles.infoGrid}>
                        <a href="tel:+917353100100" className={styles.infoCard}>
                            <div className={styles.infoIcon} style={{ background: 'rgba(39,170,225,0.12)', color: '#27aae1' }}>
                                <FiPhone />
                            </div>
                            <div>
                                <div className={styles.infoLabel}>Phone / WhatsApp</div>
                                <div className={styles.infoValue}>+91 73531 00100</div>
                            </div>
                        </a>

                        <a href="mailto:info@highlaban.com" className={styles.infoCard}>
                            <div className={styles.infoIcon} style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                                <FiMail />
                            </div>
                            <div>
                                <div className={styles.infoLabel}>Email</div>
                                <div className={styles.infoValue}>info@highlaban.com</div>
                            </div>
                        </a>

                        <div className={styles.infoCard} style={{ cursor: 'default' }}>
                            <div className={styles.infoIcon} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                                <FiMapPin />
                            </div>
                            <div>
                                <div className={styles.infoLabel}>HQ Location</div>
                                <div className={styles.infoValue}>Bengaluru, Karnataka, India</div>
                            </div>
                        </div>
                    </div>

                    {/* ── Map + Form Row ── */}
                    <div className={styles.mapFormRow}>

                        {/* Map */}
                        <div className={styles.mapBox}>
                            <div className={styles.mapLabel}>
                                <FiMapPin /> Find Us on Map
                            </div>
                            <iframe
                                title="High Laban HQ"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d497699.9973874144!2d77.35073573359375!3d12.95407654101731!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sBengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin"
                                width="100%"
                                height="100%"
                                style={{ border: 0, borderRadius: '16px' }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>

                        {/* Contact Form */}
                        <div className={styles.formBox}>
                            <h2 className={styles.formTitle}>Send a Message</h2>
                            {sent ? (
                                <div className={styles.successMsg}>
                                    ✅ Message sent via WhatsApp! We&apos;ll get back to you shortly.
                                    <button className={styles.resetBtn} onClick={() => setSent(false)}>Send another</button>
                                </div>
                            ) : (
                                <form className={styles.form} onSubmit={handleSubmit}>
                                    <div className={styles.fieldRow}>
                                        <div className={styles.field}>
                                            <label>Your Name</label>
                                            <input name="name" value={form.name} onChange={handle} placeholder="Full name" required />
                                        </div>
                                        <div className={styles.field}>
                                            <label>Phone</label>
                                            <input name="phone" value={form.phone} onChange={handle} placeholder="+91 XXXXX XXXXX" />
                                        </div>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Email</label>
                                        <input name="email" type="email" value={form.email} onChange={handle} placeholder="you@email.com" />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Message</label>
                                        <textarea name="message" value={form.message} onChange={handle} rows={4} placeholder="Tell us how we can help..." required />
                                    </div>
                                    <button type="submit" className={styles.submitBtn}>
                                        <FiSend /> Send via WhatsApp
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* ── Social Row ── */}
                    <div className={styles.socialRow}>
                        <p className={styles.socialTitle}>Follow us &amp; stay connected</p>
                        <div className={styles.socialBtns}>
                            <a href="https://www.instagram.com/highlaban/" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} style={{ background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}>
                                <FiInstagram /> Instagram
                            </a>
                            <a href="https://wa.me/917353100100" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} style={{ background: '#25D366' }}>
                                <FaWhatsapp /> WhatsApp
                            </a>
                            <a href="https://whatsapp.com/channel/0029Vb8I2pm2v1Im3k3Iez1e" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} style={{ background: '#128C7E' }}>
                                <FaWhatsapp /> WA Channel
                            </a>
                            <a href="https://www.linkedin.com/company/highlaban" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} style={{ background: '#0A66C2' }}>
                                <FaLinkedinIn /> LinkedIn
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
