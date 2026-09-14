import React from 'react';
import { Link } from 'react-router-dom';
import { Coins, MessageSquare, CheckCircle, Clock, User } from 'lucide-react';

export const DoubtCard = ({ doubt, currentUserId }) => {
  const isAsker = currentUserId === doubt.askerId;
  const isSolver = currentUserId === doubt.solverId;

  const formatDate = (dateVal) => {
    if (!dateVal) return 'Just now';
    const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
    const diffMin = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getStatusBadge = () => {
    if (doubt.status === 'resolved') {
      return (
        <span className="tag-status-resolved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle size={12} /> Resolved
        </span>
      );
    }
    if (doubt.status === 'in_progress') {
      return (
        <span className="tag-status-progress" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> In Discussion
        </span>
      );
    }
    return <span className="tag-status-open">Open Bounty</span>;
  };

  return (
    <div className="card card-hover">
      <div className="doubt-card-inner">
        <div style={{ flex: 1 }}>
          <div className="doubt-tags">
            <span className="tag-subject">{doubt.subject}</span>
            <span className="tag-class">Class: {doubt.classLevel}</span>
            {getStatusBadge()}
            {isAsker && (
              <span style={{ fontSize: '0.72rem', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '9999px', color: '#475569' }}>
                Your Doubt
              </span>
            )}
          </div>

          <h3 className="doubt-text">{doubt.text}</h3>

          <div className="doubt-meta">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <User size={13} /> {doubt.askerName || 'Anonymous Student'}
            </span>
            <span>&bull;</span>
            <span>{formatDate(doubt.createdAt)}</span>
            {doubt.solverName && doubt.status === 'resolved' && (
              <>
                <span>&bull;</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  Solved by {doubt.solverName}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Bounty & CTA column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
          <div 
            style={{ 
              background: '#fef3c7', 
              color: '#b45309', 
              padding: '6px 12px', 
              borderRadius: 'var(--radius-md)', 
              fontWeight: 700, 
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid #fde68a'
            }}
          >
            <Coins size={16} color="#f59e0b" />
            <span>+{doubt.stakedPoints} KP</span>
          </div>

          <Link
            to={`/chat/${doubt.id}`}
            className={`btn ${
              doubt.status === 'resolved' 
                ? 'btn-outline' 
                : isAsker 
                  ? 'btn-outline' 
                  : 'btn-primary'
            }`}
            style={{ fontSize: '0.85rem', padding: '7px 14px', whiteSpace: 'nowrap' }}
          >
            <MessageSquare size={14} />
            <span>
              {doubt.status === 'resolved'
                ? 'View Solution'
                : isAsker
                  ? 'Manage & Resolve'
                  : 'Help & Earn KP'}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoubtCard;
