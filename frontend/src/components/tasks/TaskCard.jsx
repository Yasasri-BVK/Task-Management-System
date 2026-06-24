import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/* ----------------------------------------------------------------------- */
/*  Lookup tables                                                           */
/* ----------------------------------------------------------------------- */

const STATUS_COLOR = {
  'To Do': '#6b7280',
  'In Progress': '#3b9eed',
  Completed: '#10b981',
};

const STATUS_BG_ALPHA = {
  'To Do': 'rgba(107,114,128,0.12)',
  'In Progress': 'rgba(59,158,237,0.13)',
  Completed: 'rgba(16,185,129,0.13)',
};

const PRIORITY_COLOR = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981',
};

const BANNER_PALETTES = [
  { from: '#6366f1', to: '#818cf8', pattern: 'radial' },
  { from: '#8b5cf6', to: '#c084fc', pattern: 'diagonal' },
  { from: '#ec4899', to: '#f472b6', pattern: 'mesh' },
  { from: '#14b8a6', to: '#2dd4bf', pattern: 'radial' },
  { from: '#f59e0b', to: '#fbbf24', pattern: 'diagonal' },
  { from: '#3b82f6', to: '#60a5fa', pattern: 'mesh' },
  { from: '#10b981', to: '#34d399', pattern: 'radial' },
  { from: '#f97316', to: '#fb923c', pattern: 'diagonal' },
];

const ASSIGNEE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6', '#10b981', '#f97316', '#ef4444', '#06b6d4'];

const MAX_AVATARS_SHOWN = 4;

/* ----------------------------------------------------------------------- */
/*  Deterministic-hash helpers                                              */
/* ----------------------------------------------------------------------- */

function hashString(value = '') {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getBannerPalette(title = '') {
  return BANNER_PALETTES[hashString(title) % BANNER_PALETTES.length];
}

function getAssigneeColor(name = '') {
  return ASSIGNEE_COLORS[hashString(name) % ASSIGNEE_COLORS.length];
}

/* ----------------------------------------------------------------------- */
/*  Date helpers                                                            */
/* ----------------------------------------------------------------------- */

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDueDateMeta(value) {
  const fallback = { color: 'var(--text-muted)', label: null, urgent: false };
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const daysRemaining = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return { color: '#ef4444', label: 'Overdue', urgent: true };
  if (daysRemaining === 0) return { color: '#f97316', label: 'Due today', urgent: true };
  if (daysRemaining <= 3) return { color: '#f59e0b', label: `${daysRemaining}d left`, urgent: true };
  return fallback;
}

/* ----------------------------------------------------------------------- */
/*  Permission helpers                                                      */
/* ----------------------------------------------------------------------- */

function getTaskPermissions(task, user) {
  const isAdmin = user?.role === 'Admin';
  const isPM = user?.role === 'ProjectManager';
  const isTaskCreator = task?.creator?.id === user?.id || task?.createdBy === user?.id;

  const canEdit = isAdmin || (isPM && isTaskCreator);
  const canDelete = isAdmin || (isPM && isTaskCreator);

  return { canEdit, canDelete };
}

/* ----------------------------------------------------------------------- */
/*  Icons                                                                   */
/* ----------------------------------------------------------------------- */

const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const UserIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/* ----------------------------------------------------------------------- */
/*  Banner pattern overlays                                                 */
/* ----------------------------------------------------------------------- */

function RadialBannerPattern() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.2 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rg1" cx="75%" cy="25%" r="55%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#rg1)" />
      <circle cx="82%" cy="14%" r="52" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <circle cx="82%" cy="14%" r="82" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <circle cx="8%" cy="88%" r="36" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
    </svg>
  );
}

function DiagonalBannerPattern() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }} xmlns="http://www.w3.org/2000/svg">
      {[...Array(10)].map((_, i) => (
        <line key={i} x1={i * 32 - 20} y1="0" x2={i * 32 + 100} y2="180" stroke="white" strokeWidth="1.5" />
      ))}
      <circle cx="87%" cy="16%" r="26" fill="rgba(255,255,255,0.18)" />
      <circle cx="87%" cy="16%" r="46" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
    </svg>
  );
}

function MeshBannerPattern() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }} xmlns="http://www.w3.org/2000/svg">
      {[...Array(4)].map((_, r) =>
        [...Array(7)].map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * 34 - 4}
            y={r * 34 - 4}
            width="22"
            height="22"
            rx="5"
            fill="rgba(255,255,255,0.45)"
            transform={`rotate(18,${c * 34 + 7},${r * 34 + 7})`}
          />
        ))
      )}
    </svg>
  );
}

function BannerPattern({ pattern }) {
  if (pattern === 'radial') return <RadialBannerPattern />;
  if (pattern === 'diagonal') return <DiagonalBannerPattern />;
  return <MeshBannerPattern />;
}

/* ----------------------------------------------------------------------- */
/*  Banner subcomponents                                                    */
/* ----------------------------------------------------------------------- */

function PriorityPill({ priority }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '10px',
        fontWeight: '700',
        padding: '4px 10px 4px 8px',
        borderRadius: '20px',
        backgroundColor: 'rgba(0,0,0,0.22)',
        backdropFilter: 'blur(10px)',
        color: '#fff',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        border: '1px solid rgba(255,255,255,0.22)',
      }}
    >
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: PRIORITY_COLOR[priority] || '#6b7280',
          flexShrink: 0,
        }}
      />
      {priority}
    </span>
  );
}

function AssigneeAvatarStack({ assignees }) {
  if (assignees.length === 0) return null;

  const shown = assignees.slice(0, MAX_AVATARS_SHOWN);
  const overflowCount = assignees.length - MAX_AVATARS_SHOWN;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((assignee, index) => (
        <div
          key={assignee.id}
          title={assignee.name}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: getAssigneeColor(assignee.name),
            border: '2.5px solid rgba(255,255,255,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: '800',
            color: '#fff',
            marginLeft: index === 0 ? 0 : '-8px',
            zIndex: assignees.length - index,
            position: 'relative',
            flexShrink: 0,
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
          }}
        >
          {assignee.name?.charAt(0) || '?'}
        </div>
      ))}

      {overflowCount > 0 && (
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.28)',
            backdropFilter: 'blur(4px)',
            border: '2.5px solid rgba(255,255,255,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: '700',
            color: '#fff',
            marginLeft: '-8px',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
}

function TaskBanner({ task, palette, assignees }) {
  return (
    <div
      style={{
        background: `linear-gradient(140deg, ${palette.from} 0%, ${palette.to} 100%)`,
        height: '170px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '14px 16px 20px',
      }}
    >
      <BannerPattern pattern={palette.pattern} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <PriorityPill priority={task.priority} />
        <AssigneeAvatarStack assignees={assignees} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3
          style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '800',
            color: '#fff',
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: '0 2px 12px rgba(0,0,0,0.25)',
            letterSpacing: '-0.3px',
          }}
        >
          {task.title}
        </h3>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Body subcomponents                                                      */
/* ----------------------------------------------------------------------- */

function StatusPill({ status }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '11px',
        fontWeight: '600',
        padding: '4px 11px',
        borderRadius: '20px',
        color: STATUS_COLOR[status] || 'var(--text-muted)',
        backgroundColor: STATUS_BG_ALPHA[status] || 'rgba(107,114,128,0.1)',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: STATUS_COLOR[status] || '#6b7280',
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}

function TaskDescription({ description }) {
  if (description) {
    return (
      <p
        style={{
          fontSize: '13.5px',
          color: 'var(--text-secondary)',
          margin: 0,
          lineHeight: 1.7,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {description}
      </p>
    );
  }

  return (
    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic', opacity: 0.6 }}>
      No description provided
    </p>
  );
}

function DueDateRow({ dueDate, dueDateMeta }) {
  if (!dueDate) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '12.5px',
          fontWeight: dueDateMeta.urgent ? '600' : '500',
          color: dueDateMeta.color,
        }}
      >
        <CalendarIcon />
        {formatDate(dueDate)}
      </span>
      {dueDateMeta.label && (
        <span
          style={{
            fontSize: '10px',
            fontWeight: '700',
            color: dueDateMeta.color,
            backgroundColor: `${dueDateMeta.color}18`,
            padding: '2px 7px',
            borderRadius: '20px',
          }}
        >
          {dueDateMeta.label}
        </span>
      )}
    </div>
  );
}

function CreatorRow({ creatorName }) {
  if (!creatorName) return null;

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)' }}>
      <UserIcon />
      {creatorName}
    </span>
  );
}

function TaskActionButtons({ canEdit, canDelete, palette, onEdit, onDelete }) {
  if (!canEdit && !canDelete) return null;

  return (
    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
      {canEdit && (
        <button
          onClick={onEdit}
          title="Edit task"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: `${palette.from}14`,
            border: `1.5px solid ${palette.from}40`,
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: '600',
            color: palette.from,
            cursor: 'pointer',
            transition: 'background 0.15s, border-color 0.15s, transform 0.1s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${palette.from}24`;
            e.currentTarget.style.borderColor = palette.from;
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${palette.from}14`;
            e.currentTarget.style.borderColor = `${palette.from}40`;
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <EditIcon /> Edit
        </button>
      )}

      {canDelete && (
        <button
          onClick={onDelete}
          title="Delete task"
          style={{
            flex: canEdit ? '0 0 auto' : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'rgba(239,68,68,0.08)',
            border: '1.5px solid rgba(239,68,68,0.3)',
            borderRadius: '10px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#ef4444',
            cursor: 'pointer',
            transition: 'background 0.15s, border-color 0.15s, transform 0.1s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
            e.currentTarget.style.borderColor = '#ef4444';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <TrashIcon /> Delete
        </button>
      )}
    </div>
  );
}

function TaskCardBody({ task, dueDateMeta, canEdit, canDelete, palette, onEdit, onDelete }) {
  const hasActions = canEdit || canDelete;

  return (
    <div
      style={{
        padding: '16px 18px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flex: 1,
        backgroundColor: 'var(--bg-card)',
      }}
    >
      <div>
        <StatusPill status={task.status} />
      </div>

      <TaskDescription description={task.description} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '2px' }}>
        <DueDateRow dueDate={task.dueDate} dueDateMeta={dueDateMeta} />
        <CreatorRow creatorName={task.creator?.name} />
      </div>

      {hasActions && <div style={{ height: '1px', backgroundColor: 'var(--border)', marginTop: '2px' }} />}

      <TaskActionButtons canEdit={canEdit} canDelete={canDelete} palette={palette} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Main component                                                          */
/* ----------------------------------------------------------------------- */

export default function TaskCard({ task, onDelete }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { canEdit, canDelete } = getTaskPermissions(task, user);
  const palette = getBannerPalette(task.title);
  const assignees = task.assignees || [];
  const dueDateMeta = getDueDateMeta(task.dueDate);

  const handleCardClick = () => navigate(`/tasks/${task.id}`);
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(task);
  };
  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/tasks/edit/${task.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.22s ease, transform 0.22s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.16)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <TaskBanner task={task} palette={palette} assignees={assignees} />

      <TaskCardBody
        task={task}
        dueDateMeta={dueDateMeta}
        canEdit={canEdit}
        canDelete={canDelete}
        palette={palette}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
