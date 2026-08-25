import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateFormField, resetForm } from '../store/complaintSlice';
import {
  RotateCcw,
  Save,
  AlertTriangle,
  ShieldAlert,
  User,
  Building2,
  Package,
  Layers,
  Hash,
  Calendar,
  Box,
  Tag,
  Activity
} from 'lucide-react';

export default function ComplaintForm({ onSaveComplaint, isSaving }) {
  const dispatch = useDispatch();
  const { form, riskAssessment, completeness, duplicateAlert, statusBadge } = useSelector(
    (state) => state.complaint
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(updateFormField({ name, value }));
  };

  const getCompletenessClass = (score) => {
    if (score >= 85) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  return (
    <div className="card-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div>
          <div className="panel-title">Log Customer Complaint</div>
          <div className="panel-subtitle">API & FDF Quality Assurance Triage Module</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className={`completeness-badge ${getCompletenessClass(completeness.score)}`}>
            <Activity size={14} /> Completeness: {completeness.score}%
          </div>
          <span className="badge-pending">{statusBadge}</span>
        </div>
      </div>

      {/* Completeness Health Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.05em' }}>
          <span>DOSAGE & QUALITY FIELD POPULATION INDEX</span>
          <span>{completeness.score}%</span>
        </div>
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{
              width: `${completeness.score}%`,
              background: completeness.score >= 85 ? 'linear-gradient(90deg, #4edea3, #29a195)' : completeness.score >= 50 ? 'linear-gradient(90deg, #ffb95f, #e29100)' : 'linear-gradient(90deg, #ffb4ab, #93000a)'
            }}
          />
        </div>
      </div>

      {/* Duplicate Alert Banner */}
      {duplicateAlert && (
        <div style={{
          background: 'rgba(255, 185, 95, 0.15)',
          border: '1px solid rgba(255, 185, 95, 0.35)',
          color: 'var(--tertiary-amber)',
          padding: '12px 16px',
          borderRadius: 'var(--border-radius-btn)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Duplicate Complaint Warning:</strong> {duplicateAlert}
          </div>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={(e) => { e.preventDefault(); onSaveComplaint(); }}>
        {/* 1. ORIGIN & CUSTOMER DETAILS */}
        <div className="form-section">
          <div className="section-title">
            <Building2 size={14} /> 1. Origin & Customer Details
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Complaint Source</label>
              <div className="input-wrapper">
                <Building2 size={16} className="input-icon" />
                <input
                  type="text"
                  name="complaint_source"
                  value={form.complaint_source}
                  onChange={handleChange}
                  placeholder="Awaiting AI extraction..."
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  placeholder="Awaiting AI extraction..."
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. PRODUCT & BATCH IDENTIFICATION */}
        <div className="form-section">
          <div className="section-title">
            <Package size={14} /> 2. Product & Batch Identification
          </div>
          <div className="form-grid-2" style={{ marginBottom: '14px' }}>
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <div className="input-wrapper">
                <Package size={16} className="input-icon" />
                <input
                  type="text"
                  name="product_name"
                  value={form.product_name}
                  onChange={handleChange}
                  placeholder="Awaiting AI extraction..."
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Product Strength / Grade</label>
              <div className="input-wrapper">
                <Layers size={16} className="input-icon" />
                <input
                  type="text"
                  name="product_strength"
                  value={form.product_strength}
                  onChange={handleChange}
                  placeholder="Awaiting AI extraction..."
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2" style={{ marginBottom: '14px' }}>
            <div className="form-group">
              <label className="form-label">Batch / Lot Number</label>
              <div className="input-wrapper">
                <Hash size={16} className="input-icon" />
                <input
                  type="text"
                  name="batch_number"
                  value={form.batch_number}
                  onChange={handleChange}
                  placeholder="Awaiting AI extraction..."
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Manufacturing Date</label>
              <div className="input-wrapper">
                <Calendar size={16} className="input-icon" />
                <input
                  type="date"
                  name="mfg_date"
                  value={form.mfg_date}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <div className="input-wrapper">
                <Calendar size={16} className="input-icon" />
                <input
                  type="date"
                  name="expiry_date"
                  value={form.expiry_date}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity Affected</label>
              <div className="input-wrapper">
                <Box size={16} className="input-icon" />
                <input
                  type="text"
                  name="quantity_affected"
                  value={form.quantity_affected}
                  onChange={handleChange}
                  placeholder="Awaiting AI extraction..."
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. COMPLAINT DETAILS */}
        <div className="form-section">
          <div className="section-title">
            <Tag size={14} /> 3. Complaint Details
          </div>
          <div className="form-grid-2" style={{ marginBottom: '14px' }}>
            <div className="form-group">
              <label className="form-label">Complaint Type</label>
              <div className="input-wrapper">
                <Tag size={16} className="input-icon" />
                <input
                  type="text"
                  name="complaint_type"
                  value={form.complaint_type}
                  onChange={handleChange}
                  placeholder="Awaiting AI extraction..."
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Complaint Date</label>
              <div className="input-wrapper">
                <Calendar size={16} className="input-icon" />
                <input
                  type="date"
                  name="complaint_date"
                  value={form.complaint_date}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Complaint Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Awaiting AI extraction..."
              className="form-textarea"
            />
          </div>
        </div>

        {/* 4. INITIAL ASSESSMENT & PRIORITY (VITALIS CALLOUT WITH LEFT-ACCENT BORDER) */}
        <div className="qa-callout-box">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-emerald)', marginBottom: '14px' }}>
            <ShieldAlert size={16} /> 4. Initial Assessment & Priority (AI Risk Triage)
          </div>
          
          <div className="form-grid-2" style={{ marginBottom: '14px' }}>
            <div className="form-group">
              <label className="form-label">Initial Severity</label>
              <select
                name="initial_severity"
                value={form.initial_severity || riskAssessment.initial_severity}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Critical">Critical</option>
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
                <option value="Awaiting AI extraction...">Awaiting AI extraction...</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                name="priority"
                value={form.priority || riskAssessment.priority}
                onChange={handleChange}
                className="form-select"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="Awaiting AI extraction...">Awaiting AI extraction...</option>
              </select>
            </div>
          </div>

          {/* Risk reasoning & CAPA readout */}
          {riskAssessment.suggested_next_action && riskAssessment.suggested_next_action !== 'Awaiting AI extraction...' && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--input-bg)', padding: '12px 14px', borderRadius: 'var(--border-radius-btn)', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
              <div><strong style={{ color: 'var(--primary-emerald)' }}>Suggested Next Action:</strong> {riskAssessment.suggested_next_action}</div>
              {riskAssessment.capa_recommendation && (
                <div><strong style={{ color: 'var(--secondary-teal)' }}>CAPA Recommendation:</strong> {riskAssessment.capa_recommendation}</div>
              )}
            </div>
          )}

          {/* System-Generated Immediate Precautions & Quarantine Advisory (Generated by QA Engine / From Us) */}
          {riskAssessment.precautions && riskAssessment.precautions !== 'Awaiting AI extraction...' && (
            <div style={{
              background: riskAssessment.initial_severity === 'Critical' ? 'rgba(255, 180, 171, 0.12)' : 'rgba(255, 185, 95, 0.12)',
              border: riskAssessment.initial_severity === 'Critical' ? '1px solid rgba(255, 180, 171, 0.35)' : '1px solid rgba(255, 185, 95, 0.35)',
              borderRadius: 'var(--border-radius-btn)',
              padding: '14px 16px',
              marginTop: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  color: riskAssessment.initial_severity === 'Critical' ? 'var(--error-pink)' : 'var(--tertiary-amber)'
                }}>
                  <AlertTriangle size={16} /> System Precaution & Quarantine Advisory (QMS Generated)
                </div>
                <span style={{
                  background: riskAssessment.initial_severity === 'Critical' ? 'rgba(255, 180, 171, 0.25)' : 'rgba(255, 185, 95, 0.25)',
                  color: riskAssessment.initial_severity === 'Critical' ? 'var(--error-pink)' : 'var(--tertiary-amber)',
                  padding: '2px 8px',
                  borderRadius: 'var(--border-radius-pill)',
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  letterSpacing: '0.05em'
                }}>
                  SYSTEM DIRECTIVE
                </span>
              </div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                {riskAssessment.precautions}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => dispatch(resetForm())}
            className="btn-secondary"
          >
            <RotateCcw size={16} />
            Reset Form
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Complaint'}
          </button>
        </div>
      </form>
    </div>
  );
}
