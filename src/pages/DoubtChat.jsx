import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  subscribeToDoubt, 
  subscribeToMessages, 
  sendMessage, 
  resolveDoubt,
  claimDoubt
} from '../services/doubtService';
import KPBadge from '../components/KPBadge';
import { 
  Send, 
  CheckCircle, 
  ArrowLeft, 
  Coins, 
  Clock, 
  User, 
  Sparkles, 
  AlertCircle,
  Award
} from 'lucide-react';

export const DoubtChat = () => {
  const { doubtId } = useParams();
  const navigate = useNavigate();
  const { userProfile, currentUser } = useAuth();

  const [doubt, setDoubt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolutionSuccess, setResolutionSuccess] = useState(null);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  // Subscribe to doubt details
  useEffect(() => {
    const unsubDoubt = subscribeToDoubt(doubtId, (data) => {
      setDoubt(data);
    });
    return () => {
      if (typeof unsubDoubt === 'function') unsubDoubt();
    };
  }, [doubtId]);

  // Subscribe to messages
  useEffect(() => {
    const unsubMsgs = subscribeToMessages(doubtId, (msgs) => {
      setMessages(msgs);
    });
    return () => {
      if (typeof unsubMsgs === 'function') unsubMsgs();
    };
  }, [doubtId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!doubt) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading live doubt session...</p>
      </div>
    );
  }

  const isAsker = userProfile?.uid === doubt.askerId;
  const isResolved = doubt.status === 'resolved';

  // Find candidate solver: if already assigned, or the last non-asker who sent a message
  const candidateSolverId = doubt.solverId || messages.filter(m => m.senderId !== doubt.askerId).pop()?.senderId;
  const candidateSolverName = doubt.solverName || messages.filter(m => m.senderId !== doubt.askerId).pop()?.senderName;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      // If student is not the asker and doubt is open, claim it as in_progress
      if (!isAsker && doubt.status === 'open' && userProfile) {
        await claimDoubt(doubt.id, userProfile);
      }

      await sendMessage(doubt.id, {
        senderId: userProfile?.uid || 'anon',
        senderName: userProfile?.name || 'Peer Scholar',
        text: textToSend
      });
    } catch (err) {
      console.error('Send error:', err);
      setError('Could not send message. Please retry.');
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!isAsker) return;

    if (!candidateSolverId) {
      alert('Cannot resolve yet: No peer solver has joined or replied to this doubt.');
      return;
    }

    if (!window.confirm(`Transfer ${doubt.stakedPoints} KP (+5 KP platform bonus) to ${candidateSolverName || 'the solver'} and mark this doubt resolved?`)) {
      return;
    }

    setResolving(true);
    setError('');
    try {
      const res = await resolveDoubt(doubt.id, userProfile, candidateSolverId);
      setResolutionSuccess(res);
    } catch (err) {
      setError(err.message || 'Failed to resolve doubt');
    } finally {
      setResolving(false);
    }
  };

  const formatMessageTime = (dateVal) => {
    if (!dateVal) return '';
    const d = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="main-content" style={{ maxWidth: '900px' }}>
      {/* Top action header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <button
          onClick={() => navigate('/')}
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> Back to Doubt Feed
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <KPBadge amount={doubt.stakedPoints} size="sm" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Subject: <strong>{doubt.subject}</strong> ({doubt.classLevel})
          </span>
        </div>
      </div>

      {/* Doubt Summary Card */}
      <div className="card" style={{ marginBottom: '16px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="tag-subject">{doubt.subject}</span>
              <span className="tag-class">Class: {doubt.classLevel}</span>
              {isResolved ? (
                <span className="tag-status-resolved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={12} /> Resolved
                </span>
              ) : doubt.status === 'in_progress' ? (
                <span className="tag-status-progress" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> In Progress
                </span>
              ) : (
                <span className="tag-status-open">Open for Solution</span>
              )}
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px', lineHeight: 1.35 }}>
              {doubt.text}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span>Asked by: <strong>{doubt.askerName}</strong></span>
              {doubt.solverName && (
                <span>&bull; Helping Solver: <strong style={{ color: 'var(--primary)' }}>{doubt.solverName}</strong></span>
              )}
            </div>
          </div>

          {/* Asker Action: Resolve Button */}
          {isAsker && !isResolved && (
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={handleResolve}
                disabled={resolving || !candidateSolverId}
                className="btn btn-success"
                style={{ padding: '10px 18px', fontWeight: 700 }}
                title={!candidateSolverId ? 'Wait for a peer to reply before resolving' : 'Transfer KP & Mark Resolved'}
              >
                <CheckCircle size={18} />
                <span>{resolving ? 'Executing Transfer...' : 'Mark as Resolved'}</span>
              </button>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {candidateSolverName ? `Transfers ${doubt.stakedPoints}+5 KP to ${candidateSolverName}` : 'Awaiting peer answers'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resolved Success Banner */}
      {isResolved && (
        <div className="resolved-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={24} color="#059669" />
            <div>
              <strong>Doubt Successfully Resolved!</strong>
              <div style={{ fontSize: '0.85rem' }}>
                {doubt.stakedPoints} KP (+5 bonus) transferred to <strong>{doubt.solverName || candidateSolverName || 'the solver'}</strong>.
              </div>
            </div>
          </div>
          <Link to="/" className="btn btn-outline" style={{ background: 'white', fontSize: '0.85rem', padding: '6px 12px' }}>
            Browse More Doubts
          </Link>
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Real-time 1-to-1 Chat Container */}
      <div className="chat-container">
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: isResolved ? '#10b981' : '#22c55e', display: 'inline-block' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {isResolved ? 'Resolution Transcript' : 'Live Peer Solving Thread'}
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>No messages yet.</p>
              <p style={{ fontSize: '0.85rem' }}>
                {isAsker 
                  ? 'Waiting for a classmate or senior peer to join the discussion...'
                  : 'Type a helpful explanation below to claim the staked KP bounty!'}
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.senderId === userProfile?.uid;
              const isSenderAsker = m.senderId === doubt.askerId;
              return (
                <div 
                  key={m.id} 
                  className={`message-item ${isMine ? 'sent' : 'received'}`}
                >
                  <div className="message-sender" style={{ textAlign: isMine ? 'right' : 'left' }}>
                    {m.senderName} {isSenderAsker ? '(Asker)' : '(Helper)'}
                  </div>
                  <div className="message-bubble">
                    {m.text}
                    <div className="message-time">
                      {formatMessageTime(m.sentAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            placeholder={
              isResolved 
                ? 'This doubt is resolved. You can still leave follow-up comments...' 
                : isAsker 
                  ? 'Reply to helpers, ask for clarification, or guide the solution...' 
                  : 'Type your explanation, formula steps, or answer...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0 20px' }}
            disabled={sending || !inputText.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default DoubtChat;
