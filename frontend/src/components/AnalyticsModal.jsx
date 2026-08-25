import React from 'react';
import { X, BarChart2 } from 'lucide-react';
import AnalyticsDashboard from './AnalyticsDashboard';

export default function AnalyticsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '1200px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart2 size={22} color="var(--primary-blue)" />
            <div>
              <div style={{ fontWeight: '700', fontSize: '1.2rem' }}>QMS Visual Analytics & Quality Charts</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Real-time visual insights, complaint distribution charts, and risk metrics.
              </div>
            </div>
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <AnalyticsDashboard />
        </div>
      </div>
    </div>
  );
}
