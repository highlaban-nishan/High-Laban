import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import db from '../utils/db';
import logo from '../assets/logo.png';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await db.login(email, password);
            navigate('/admin');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f0f2f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                padding: '2.5rem',
                border: '1px solid var(--color-border)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <Link to="/">
                        <img src={logo} alt="High Laban" style={{ height: '48px', marginBottom: '1.5rem' }} />
                    </Link>
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.75rem',
                        marginBottom: '0.5rem',
                        color: 'var(--color-text-primary)'
                    }}>Welcome Back</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Please enter your details to sign in</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="wazeert13@gmail.com"
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                outline: 'none',
                                background: '#f9fafb',
                                color: 'var(--color-text-primary)',
                                fontSize: '1rem',
                                transition: 'all 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                outline: 'none',
                                background: '#f9fafb',
                                color: 'var(--color-text-primary)',
                                fontSize: '1rem',
                                transition: 'all 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'var(--color-accent)',
                            color: '#fff',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'background 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    Don't have an account? <a href="#" style={{ color: 'var(--color-accent)', fontWeight: '500' }}>Contact Admin</a>
                </div>
            </div>
        </div>
    );
};

export default Login;
