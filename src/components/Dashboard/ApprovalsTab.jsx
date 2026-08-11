import React, { useState, useEffect } from 'react';
import db from '../../utils/db';

export default function ApprovalsTab() {
    const [requests, setRequests] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const reqs = await db.getProfileEditRequests();
            const staff = await db.getStaff();
            setRequests(reqs);
            setStaffList(staff);
        } catch (err) {
            console.error("Error loading approvals data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (req) => {
        const staffObj = staffList.find(s => s.id === req.staffId);
        if (!staffObj) {
            alert("No corresponding staff record found!");
            return;
        }

        try {
            // Apply requested changes to the staff object
            const updatedStaff = {
                ...staffObj,
                ...req.requestedChanges
            };
            // 1. Update staff document
            await db.updateStaff(staffObj.id, updatedStaff);
            // 2. Remove profile edit request
            await db.deleteProfileEditRequest(req.id);
            alert("Profile edit request approved and applied successfully!");
            loadRequests();
        } catch (err) {
            alert("Error approving request: " + err.message);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Are you sure you want to reject this request?")) return;
        try {
            await db.deleteProfileEditRequest(id);
            alert("Request rejected.");
            loadRequests();
        } catch (err) {
            alert("Error rejecting request: " + err.message);
        }
    };

    if (loading) {
        return <div style={{ color: 'white' }}>Loading profile approvals...</div>;
    }

    return (
        <div style={{ color: 'white', padding: '1.5rem', background: '#1e293b', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#38bdf8' }}>Profile Edit Approvals</h3>

            {requests.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {requests.map(req => {
                        const staffObj = staffList.find(s => s.id === req.staffId) || {};
                        return (
                            <div key={req.id} style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #334155' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#38bdf8' }}>{req.staffName}</h4>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Submitted: {new Date(req.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleApprove(req)}
                                            style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            ✓ Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(req.id)}
                                            style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            ✗ Reject
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    {/* Current values */}
                                    <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '6px' }}>
                                        <span style={{ fontWeight: 'bold', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Current Value</span>
                                        {Object.keys(req.requestedChanges).map(key => (
                                            <div key={key} style={{ marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                                <span style={{ color: '#818cf8', fontWeight: '500' }}>{key}: </span>
                                                <span>{staffObj[key] || 'N/A'}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Requested values */}
                                    <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '6px', border: '1px solid #38bdf8' }}>
                                        <span style={{ fontWeight: 'bold', color: '#38bdf8', display: 'block', marginBottom: '0.5rem' }}>Requested Value</span>
                                        {Object.entries(req.requestedChanges).map(([key, value]) => {
                                            const hasChanged = staffObj[key] !== value;
                                            return (
                                                <div key={key} style={{ marginBottom: '0.25rem', fontSize: '0.85rem', color: hasChanged ? '#f43f5e' : 'white' }}>
                                                    <span style={{ color: '#818cf8', fontWeight: '500' }}>{key}: </span>
                                                    <span style={{ fontWeight: hasChanged ? 'bold' : 'normal' }}>{value || 'N/A'}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p style={{ color: '#94a3b8' }}>No pending profile edit requests.</p>
            )}
        </div>
    );
}
