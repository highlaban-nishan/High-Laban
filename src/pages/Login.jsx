import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import db from '../utils/db';
import logo from '../assets/logo.png';

import styles from './Login.module.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import SEO from '../components/SEO/SEO';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await db.login(email, password);
            navigate('/dashboard');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <SEO title="Admin Login | High Laban" description="Secure login for High Laban administration." />
            <div className={styles.container}>
                {/* Left Panel - Form */}
                <div className={styles.leftPanel}>
                    <div className={styles.logoContainer}>
                        <Link to="/">
                            <img src={logo} alt="High Laban" className={styles.logo} />
                        </Link>
                    </div>

                    <div className={styles.header}>
                        <h1 className={styles.title}>Log In</h1>
                        <p className={styles.subtitle}>Welcome back! Please enter your details.</p>
                    </div>

                    <form onSubmit={handleLogin} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Username</label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your username"
                                required
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Password</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className={styles.input}
                                />
                                <span
                                    className={styles.eyeIcon}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.submitBtn}
                        >
                            {loading ? 'Logging in...' : 'Log In'}
                        </button>
                    </form>

                    <div className={styles.footerLinks}>
                        HighLaban Admin Portal • Secure Access
                    </div>

                </div>

                {/* Right Panel - Visual */}
                <div className={styles.rightPanel}>
                    <video
                        src="/video/1230 (2)(2).mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className={styles.characterImage}
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;
