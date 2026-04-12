import React, { useState } from 'react';

export default function MedicationModal({ isOpen, onClose, onAdd }) {
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [time, setTime] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd({
            id: Date.now(),
            name,
            dosage,
            time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        setName('');
        setDosage('');
        setTime('');
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div style={{
                backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px',
                width: '100%', maxWidth: '400px', padding: '1.5rem', position: 'relative',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
            }}>
                <button 
                  onClick={onClose}
                  style={{
                      position: 'absolute', top: '1rem', right: '1rem', 
                      background: 'none', border: 'none', color: '#94a3b8', 
                      fontSize: '1.2rem', cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#f8fafc' }}>Log Medication</h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Medication Name</label>
                        <input 
                            required
                            type="text" 
                            style={{
                                width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', 
                                borderRadius: '6px', padding: '0.5rem', color: '#f8fafc',
                                outline: 'none'
                            }}
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Albuterol Inhaler"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Dosage (Optional)</label>
                        <input 
                            type="text" 
                            style={{
                                width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', 
                                borderRadius: '6px', padding: '0.5rem', color: '#f8fafc',
                                outline: 'none'
                            }}
                            value={dosage} 
                            onChange={(e) => setDosage(e.target.value)}
                            placeholder="e.g. 2 puffs"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Time Taken (Optional)</label>
                        <input 
                            type="time" 
                            style={{
                                width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', 
                                borderRadius: '6px', padding: '0.5rem', color: '#f8fafc',
                                outline: 'none', colorScheme: 'dark'
                            }}
                            value={time} 
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </div>
                    <button type="submit" style={{
                        marginTop: '0.5rem', backgroundColor: '#4A6CF7', color: 'white', 
                        padding: '0.75rem', borderRadius: '6px', fontWeight: 600, 
                        border: 'none', cursor: 'pointer', transition: 'background-color 0.2s'
                    }}>
                        Add to Tracker
                    </button>
                </form>
            </div>
        </div>
    );
}
