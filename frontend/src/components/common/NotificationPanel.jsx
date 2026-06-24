import { useNotifications } from '../../context/NotificationContext';
import { useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axios';

/* ----------------------------------------------------------------------- */
/*  Constants                                                               */
/* ----------------------------------------------------------------------- */

const TYPE_ICON = {
  task_assigned: '📋',
  status_changed: '🔄',
  comment_added: '💬',
  deadline_approaching: '⏰',
  general: '🔔',
};

const MAX_NOTIFICATIONS_SHOWN = 20;
const FALLBACK_ICON = '🔔';

/* ----------------------------------------------------------------------- */
/*  Style tokens                                                            */
/* ----------------------------------------------------------------------- */

const styles = {
  panel: {
    position: 'absolute', top: '48px', right: 0,
    width: '360px', backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-lg)', zIndex: 1000,
    overflow: 'hidden',
    '@media (max-width: 480px)': { width: '100vw', right: '-16px' }
  },
  header: {
    padding: '16px 20px', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid var(--border)'
  },
  title: { fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)' },
  markAllBtn: {
    background: 'none', border: 'none',
    color: 'var(--accent)', fontSize: '12px',
    fontWeight: '500', cursor: 'pointer', padding: '4px 8px',
    borderRadius: 'var(--radius-sm)'
  },
  list: { maxHeight: '420px', overflowY: 'auto' },
  empty: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '48px 24px', gap: '8px',
    color: 'var(--text-muted)', fontSize: '13px'
  },
  item: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    padding: '14px 20px', transition: 'background-color 0.15s',
    borderBottom: '1px solid var(--border)',
    position: 'relative'
  },
  icon: { fontSize: '18px', flexShrink: 0, marginTop: '2px' },
  content: { flex: 1, minWidth: 0 },
  notifTitle: { fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' },
  notifMsg: { fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', lineHeight: '1.4' },
  notifTime: { fontSize: '11px', color: 'var(--text-muted)' },
  dot: {
    width: '8px', height: '8px', borderRadius: '50%',
    backgroundColor: 'var(--accent)', flexShrink: 0, marginTop: '6px'
  }
};

/* ----------------------------------------------------------------------- */
/*  Outside-click hook                                                      */
/* ----------------------------------------------------------------------- */

function useOutsideClick(onOutsideClick) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutsideClick();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onOutsideClick]);

  return ref;
}

/* ----------------------------------------------------------------------- */
/*  Notification API actions                                                */
/* ----------------------------------------------------------------------- */

async function markAllNotificationsRead() {
  await api.patch('/notifications/read-all');
}

async function markNotificationRead(id) {
  await api.patch(`/notifications/${id}/read`);
}

/* ----------------------------------------------------------------------- */
/*  Subcomponents                                                           */
/* ----------------------------------------------------------------------- */

function PanelHeader({ unreadCount, onMarkAllRead }) {
  return (
    <div style={styles.header}>
      <span style={styles.title}>Notifications</span>
      {unreadCount > 0 && (
        <button onClick={onMarkAllRead} style={styles.markAllBtn}>
          Mark all read
        </button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={styles.empty}>
      <span style={{ fontSize: '32px' }}>{FALLBACK_ICON}</span>
      <p>No notifications yet</p>
    </div>
  );
}

function NotificationItem({ notification, onMarkRead }) {
  const handleClick = () => {
    if (!notification.isRead) onMarkRead(notification.id);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        ...styles.item,
        backgroundColor: notification.isRead ? 'transparent' : 'var(--accent-light)',
        cursor: notification.isRead ? 'default' : 'pointer',
      }}
    >
      <span style={styles.icon}>{TYPE_ICON[notification.type] || FALLBACK_ICON}</span>
      <div style={styles.content}>
        <p style={styles.notifTitle}>{notification.title}</p>
        <p style={styles.notifMsg}>{notification.message}</p>
        <p style={styles.notifTime}>
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      {!notification.isRead && <div style={styles.dot} />}
    </div>
  );
}

function NotificationList({ notifications, onMarkRead }) {
  if (notifications.length === 0) return <EmptyState />;

  return (
    <>
      {notifications.slice(0, MAX_NOTIFICATIONS_SHOWN).map((notification) => (
        <NotificationItem key={notification.id} notification={notification} onMarkRead={onMarkRead} />
      ))}
    </>
  );
}

/* ----------------------------------------------------------------------- */
/*  Main component                                                          */
/* ----------------------------------------------------------------------- */

export default function NotificationPanel({ onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const panelRef = useOutsideClick(onClose);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      markAllAsRead();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      markAsRead(id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div ref={panelRef} style={styles.panel}>
      <PanelHeader unreadCount={unreadCount} onMarkAllRead={handleMarkAllRead} />

      <div style={styles.list}>
        <NotificationList notifications={notifications} onMarkRead={handleMarkRead} />
      </div>
    </div>
  );
}
