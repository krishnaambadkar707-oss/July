import React from 'react';
import { X, FileText, Calendar, AlertCircle } from 'lucide-react';

export default function SavedComplaintsModal({ isOpen, onClose, complaints }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
              QMS Saved Customer Complaints
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Historical audit log of complaints logged into database
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <FileText size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ fontWeight: '500' }}>No complaints saved yet in database.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                Use the AI assistant on the right to log complaints and click "Save Complaint".
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {complaints.map((comp) => (
                <div key={comp.id} style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  background: '#f8fafc'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', color: '#1e3a8a', fontSize: '0.95rem' }}>
                      {comp.complaint_number} - {comp.product_name || 'Unspecified Product'}
                    </span>
                    <span style={{
                      background: comp.initial_severity === 'Critical' ? '#fee2e2' : comp.initial_severity === 'Major' ? '#fef3c7' : '#e0f2fe',
                      color: comp.initial_severity === 'Critical' ? '#991b1b' : comp.initial_severity === 'Major' ? '#92400e' : '#075985',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: '700'
                    }}>
                      {comp.initial_severity || 'Major'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.82rem', color: '#334155', marginBottom: '8px' }}>
                    <div><strong>Customer:</strong> {comp.customer_name || 'N/A'}</div>
                    <div><strong>Batch:</strong> {comp.batch_number || 'N/A'}</div>
                    <div><strong>Quantity:</strong> {comp.quantity_affected || 'N/A'}</div>
                    <div><strong>Complaint Type:</strong> {comp.complaint_type || 'N/A'}</div>
                    <div><strong>Date:</strong> {comp.complaint_date || comp.created_at}</div>
                    <div><strong>Status:</strong> {comp.status}</div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#475569', background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <strong>Description:</strong> {comp.description}
                  </div>

                  {comp.suggested_next_action && (
                    <div style={{ fontSize: '0.8rem', color: '#1e40af', marginTop: '8px', fontWeight: '500' }}>
                      <strong>QA Action:</strong> {comp.suggested_next_action}
                    </div>
                  )}

                  {comp.precautions && (
                    <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '6px', fontWeight: '500', background: '#fef3c7', padding: '6px 10px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                      <strong>⚠️ Precautions:</strong> {comp.precautions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
