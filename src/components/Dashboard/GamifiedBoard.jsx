import React, { useState, useEffect } from 'react';
import db from '../../utils/db';
import { FiZap, FiAward, FiStar, FiCoffee, FiTrendingUp } from 'react-icons/fi';

const FUNNY_MOTIVATIONALS = [
    "🔥 Warning: Ahmed is leading Saket branch by 20 points! Go whip up some viral Pistachio Kunafa to catch up!",
    "🚀 Don't let your checklist get cold! A cold checklist is sadder than a basbousa without cream.",
    "👀 The Supervisor is watching, and she loves clean nails! Keep clipping and keep shining.",
    "🍦 Laban Level 100 is unlocked when you complete 10 checklists in a row. Go get that bread!",
    "🌙 Good night, sweet desserts! Make sure the fridge door is closed, or the cheese will go rogue.",
    "🌅 Rise and shine, modern dessert wizards! India is waiting for its modern twist!"
];

export default function GamifiedBoard({ workerBranch, workerName }) {
    const [period, setPeriod] = useState('monthly');
    const [randomQuote, setRandomQuote] = useState('');
    const [stats, setStats] = useState({
        level: 3,
        xp: 340,
        streak: 5,
        totalPoints: 1250,
        badges: ['Hygiene Master 🧼', 'Punctual King ⏰', 'Checklist Wizard 📋']
    });

    useEffect(() => {
        // Choose a random motivational quote
        const idx = Math.floor(Math.random() * FUNNY_MOTIVATIONALS.length);
        setRandomQuote(FUNNY_MOTIVATIONALS[idx]);
    }, []);

    return (
        <div style={{ color: 'white', padding: '1.25rem', background: 'linear-gradient(135deg, #1e1b4b, #0f172a)', borderRadius: '12px', border: '1px solid #4338ca', fontFamily: 'Inter, sans-serif' }}>
            
            {/* Top Level Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: '#4f46e5', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', color: 'white' }}>
                        Lvl {stats.level}
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>Dessert Alchemist</h4>
                        <span style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>{stats.xp} / 500 XP to Level {stats.level + 1}</span>
                    </div>
                </div>
                
                {/* Checklist Streak */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#311010', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid #7f1d1d' }}>
                    <FiZap style={{ color: '#ef4444' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fca5a5' }}>🔥 {stats.streak} Day Streak!</span>
                </div>
            </div>

            {/* XP progress bar */}
            <div style={{ background: '#334155', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <div style={{ width: `${(stats.xp / 500) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #3b82f6)', height: '100%', borderRadius: '4px' }}></div>
            </div>

            {/* Funny encouragement notes */}
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', borderLeft: '4px solid #6366f1', padding: '0.8rem 1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#c7d2fe', fontStyle: 'italic' }}>
                "{randomQuote}"
            </div>

            {/* Arena Comparison Cards */}
            <h4 style={{ color: '#38bdf8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.8rem 0' }}>🏆 Branch & Worker Master Leaderboard</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                
                <div style={{ background: '#1e293b', padding: '0.8rem', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                        <FiTrendingUp style={{ color: '#10b981' }} />
                        <span>Top Performing Outlet</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f8fafc', marginTop: '4px' }}>Connaught Place</div>
                    <span style={{ fontSize: '0.75rem', color: '#34d399' }}>94.2% Index Score</span>
                </div>

                <div style={{ background: '#1e293b', padding: '0.8rem', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                        <FiStar style={{ color: '#fbbf24' }} />
                        <span>Best in {workerBranch || 'My Branch'}</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f8fafc', marginTop: '4px' }}>Sameer</div>
                    <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>95.0% Index Score</span>
                </div>

                <div style={{ background: '#1e293b', padding: '0.8rem', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                        <FiAward style={{ color: '#a7f3d0' }} />
                        <span>Overall Top Performer</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f8fafc', marginTop: '4px' }}>Nour (Supervisor)</div>
                    <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>98.0% Index Score</span>
                </div>

            </div>

            {/* Achievements & Badges Earned */}
            <div style={{ borderTop: '1px dashed #334155', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>🛡️ Earned Badges:</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {stats.badges.map((badge, idx) => (
                        <span key={idx} style={{ background: '#312e81', color: '#c7d2fe', border: '1px solid #4338ca', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {badge}
                        </span>
                    ))}
                </div>
            </div>

        </div>
    );
}
