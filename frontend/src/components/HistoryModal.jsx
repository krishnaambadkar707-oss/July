import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { X, History, Search, FileText, CheckCircle2, AlertTriangle, Calendar, User, Package } from 'lucide-react';

export default function HistoryModal({ isOpen, onClose }) {
  const { savedComplaints } = useSelector((state) => state.complaint);
  const { messages } = useSelector((state) => state.chat);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  if (!isOpen) return null;

  const filteredComplaints = savedComplaints.filter((item) => {
    const textMatch =
      item.complaint_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batch_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'CRITICAL') return textMatch && item.initial_severity === 'Critical';
    if (filterType === 'MAJOR') return textMatch && item.initial_severity === 'Major';
    return textMatch;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={22} color="var(--primary-blue)" />
            <div>
              <div style={{ fontWeight: '700', fontSize: '1.2rem' }}>QMS Audit History & Action Log</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Chronological record of complaints, document extractions, and QA triage actions.
              </div>
            </div>
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Controls */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search history by batch, customer, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-select"
              style={{ width: 'auto', minWidth: '150px' }}
            >
              <option value="ALL">All Records</option>
              <option value="CRITICAL">Critical Severity</option>
              <option value="MAJOR">Major Severity</option>
            </select>
          </div>

          {/* Timeline Stream */}
          {filteredComplaints.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileText size={40} style={{ opacity: 0.5, marginBottom: '10px' }} />
              <div>No complaint history records found matching filter criteria.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredComplaints.map((item, index) => (
                <div
                  key={item.id || index}
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--primary-blue)' }}>
                        {item.complaint_number}
                      </span>
                      <span className={`badge-pending`}>
                        {item.status || 'Pending Triage'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '0.82rem', marginTop: '6px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Customer: </span>
                      <strong>{item.customer_name || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Product: </span>
                      <strong>{item.product_name} ({item.product_strength || 'N/A'})</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Batch #: </span>
                      <strong>{item.batch_number || 'N/A'}</strong>
                    </div>
                  </div>

                  {item.suggested_next_action && (
                    <div style={{ fontSize: '0.8rem', background: 'var(--panel-bg)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: '4px' }}>
                      <strong>Suggested QA Action:</strong> {item.suggested_next_action}
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
