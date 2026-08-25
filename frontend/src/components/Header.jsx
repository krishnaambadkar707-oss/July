import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../store/themeSlice';
import { togglePopover } from '../store/notificationSlice';
import NotificationDropdown from './NotificationDropdown';
import {
  ShieldCheck,
  FileText,
  Bot,
  Sun,
  Moon,
  Bell,
  History,
  Settings,
  BarChart2,
  LayoutDashboard
} from 'lucide-react';

export default function Header({
  activeMainView,
  setActiveMainView,
  onOpenSavedModal,
  onOpenHistoryModal,
  onOpenSettingsModal,
  onOpenAnalyticsModal,
  savedCount
}) {
  const dispatch = useDispatch();
  const { mode } = useSelector((state) => state.theme);
  const { items } = useSelector((state) => state.notifications);

  const unreadCount = items.filter((item) => !item.read).length;

  return (
    <header style={{
      background: 'var(--header-bg)',
      borderBottom: '1px solid var(--border-color)',
      padding: '14px 32px',
      display: 'flex',
      justify: 'space-between',
      alignItems: 'center',
      transition: 'background-color var(--transition-speed)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Left Side: Brand Logo & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #29a195)',
          color: '#ffffff',
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: '1.2rem',
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
        }}>
          <Bot size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
            AIVOA <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}>| QMS Customer Complaint Co-Pilot</span>
          </h1>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            Pharmaceutical Quality Assurance & Risk Management Module (API & FDF)
          </div>
        </div>
      </div>

      {/* TOP RIGHT CORNER: Unified Action & View Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        position: 'relative'
      }}>
        {/* 1. Main View Mode Tabs (Intake vs Visual Analytics) */}
        <div style={{
          display: 'inline-flex',
          background: 'var(--input-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-btn)',
          padding: '3px'
        }}>
          <button
            onClick={() => setActiveMainView('intake')}
            className={activeMainView === 'intake' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 14px', fontSize: '0.8rem', border: 'none', gap: '5px' }}
          >
            <LayoutDashboard size={14} /> Intake & Copilot
          </button>
          <button
            onClick={() => {
              setActiveMainView('analytics');
              if (onOpenAnalyticsModal) onOpenAnalyticsModal();
            }}
            className={activeMainView === 'analytics' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 14px', fontSize: '0.8rem', border: 'none', gap: '5px' }}
          >
            <BarChart2 size={14} /> Visual Analytics
          </button>
        </div>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

        {/* 2. Saved Complaints Button */}
        <button
          onClick={onOpenSavedModal}
          className="btn-secondary"
          style={{ padding: '7px 14px', fontSize: '0.8rem', gap: '6px' }}
          title="View Saved Complaint Records"
        >
          <FileText size={15} color="var(--primary-emerald)" />
          Saved ({savedCount})
        </button>

        {/* 3. Action History Button */}
        <button
          onClick={onOpenHistoryModal}
          className="icon-btn"
          title="QMS Action & Complaint History"
          style={{ width: '38px', height: '38px' }}
        >
          <History size={18} color="var(--text-main)" />
        </button>

        {/* 4. Notification Center Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => dispatch(togglePopover())}
            className="icon-btn"
            title="Notification Center"
            style={{ width: '38px', height: '38px' }}
          >
            <Bell size={18} color="var(--text-main)" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: 'var(--error-pink)',
                color: '#690005',
                fontSize: '0.65rem',
                fontWeight: '800',
                borderRadius: '9999px',
                padding: '2px 5px',
                lineHeight: 1
              }}>
                {unreadCount}
              </span>
            )}
          </button>
          <NotificationDropdown />
        </div>

        {/* 5. Settings Button */}
        <button
          onClick={onOpenSettingsModal}
          className="icon-btn"
          title="Settings & System Preferences"
          style={{ width: '38px', height: '38px' }}
        >
          <Settings size={18} color="var(--text-main)" />
        </button>

        {/* 6. Dark / Light Theme Switcher */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="icon-btn"
          title={`Switch to ${mode === 'light' ? 'Dark' : 'Bright'} Mode`}
          style={{ width: '38px', height: '38px' }}
        >
          {mode === 'light' ? <Moon size={18} color="var(--primary-emerald)" /> : <Sun size={18} color="var(--tertiary-amber)" />}
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

        {/* 7. Vitalis 21 CFR Part 11 Compliance Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(78, 222, 163, 0.12)',
          padding: '5px 12px',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          color: 'var(--primary-emerald)',
          fontWeight: '700',
          border: '1px solid rgba(78, 222, 163, 0.3)',
          whiteSpace: 'nowrap'
        }}>
          <ShieldCheck size={15} color="var(--primary-emerald)" />
          21 CFR Part 11
        </div>
      </div>
    </header>
  );
}
