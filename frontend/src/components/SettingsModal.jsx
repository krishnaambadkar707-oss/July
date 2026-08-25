import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme, setTheme } from '../store/themeSlice';
import { X, Settings, Sun, Moon, ShieldCheck, Cpu, Database, Sliders } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { mode } = useSelector((state) => state.theme);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={22} color="var(--primary-blue)" />
            <div>
              <div style={{ fontWeight: '700', fontSize: '1.2rem' }}>QMS System Settings & Preferences</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Configure theme interface, AI Copilot mode, and regulatory audit settings.
              </div>
            </div>
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. Theme Configuration */}
          <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '10px' }}>
            <div style={{ fontWeight: '700', fontSize: '0.92rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {mode === 'dark' ? <Moon size={18} color="#3b82f6" /> : <Sun size={18} color="#f59e0b" />} Appearance & Theme Mode
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => dispatch(setTheme('light'))}
                className={mode === 'light' ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              >
                <Sun size={16} /> Bright / Light Mode
              </button>
              <button
                onClick={() => dispatch(setTheme('dark'))}
                className={mode === 'dark' ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              >
                <Moon size={16} /> Dark Mode
              </button>
            </div>
          </div>

          {/* 2. AI Extraction & Model Config */}
          <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '10px' }}>
            <div style={{ fontWeight: '700', fontSize: '0.92rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="var(--primary-blue)" /> AI Copilot Engine Status
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Primary Agent Model:</span>
                <strong>Groq Llama-3.3-70b / Gemma2-9b (With Rule Fallback)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Extraction Mode:</span>
                <strong>Structured JSON Entity Extraction</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Risk Assessment Engine:</span>
                <strong>Pharma QMS Risk Matrix (21 CFR Part 11)</strong>
              </div>
            </div>
          </div>

          {/* 3. Database & System Status */}
          <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '10px' }}>
            <div style={{ fontWeight: '700', fontSize: '0.92rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="#10b981" /> Database & Storage
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Storage Engine:</span>
                <strong>SQLite (qms_complaints.db)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Audit Trail Logging:</span>
                <span style={{ color: '#10b981', fontWeight: '700' }}>ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
