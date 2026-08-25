import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { markAllAsRead, clearNotifications, closePopover } from '../store/notificationSlice';
import { Bell, Check, Trash2, AlertTriangle, CheckCircle, Info, ShieldAlert, X } from 'lucide-react';

export default function NotificationDropdown() {
  const dispatch = useDispatch();
  const { items, isPopoverOpen } = useSelector((state) => state.notifications);

  if (!isPopoverOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={18} color="#f59e0b" />;
      case 'success':
        return <CheckCircle size={18} color="#10b981" />;
      case 'critical':
        return <ShieldAlert size={18} color="#ef4444" />;
      default:
        return <Info size={18} color="#3b82f6" />;
    }
  };

  return (
    <div className="notification-popover">
      <div className="notification-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.9rem' }}>
          <Bell size={16} /> Notification Center
        </div>
        <button onClick={() => dispatch(closePopover())} className="modal-close">
          <X size={16} />
        </button>
      </div>

      <div className="notification-list">
        {items.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No notifications right now.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className={`notification-item ${!item.read ? 'unread' : ''}`}>
              <div style={{ marginTop: '2px' }}>{getIcon(item.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700' }}>
                  <span>{item.title}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.timestamp}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {item.message}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justify: 'space-between',
          background: 'var(--input-bg)'
        }}>
          <button
            onClick={() => dispatch(markAllAsRead())}
            style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Check size={14} /> Mark all read
          </button>
          <button
            onClick={() => dispatch(clearNotifications())}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Trash2 size={14} /> Clear all
          </button>
        </div>
      )}
    </div>
  );
}
