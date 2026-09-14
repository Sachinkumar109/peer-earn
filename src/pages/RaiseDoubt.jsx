import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createDoubt } from '../services/doubtService';
import { HelpCircle, Coins, AlertCircle, ArrowLeft, Sparkles, Check } from 'lucide-react';

export const RaiseDoubt = () => {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();

  const [subject, setSubject] = useState('Physics');
  const [classLevel, setClassLevel] = useState(userProfile?.classLevel || '12th');
  const [text, setText] = useState('');
  const [stakedPoints, setStakedPoints] = useState(20);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const subjects = [
    'Physics',
    'Mathematics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'English'
  ];

  const quickStakes = [10, 20, 25, 50];

  const currentBalance = userProfile?.kpBalance ?? 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!text.trim() || text.trim().length < 10) {
      setError('Please provide a detailed description of your doubt (minimum 10 characters).');
      return;
    }

    if (stakedPoints <= 0) {
      setError('Please stake at least 5 Knowledge Points (KP).');
      return;
    }

    if (stakedPoints > currentBalance) {
      setError(`Insufficient KP balance! You have ${currentBalance} KP, but tried to stake ${stakedPoints} KP.`);
      return;
    }

    setSubmitting(true);
    try {
      const created = await createDoubt(userProfile, {
        text: text.trim(),
        subject,
        classLevel,
        stakedPoints: Number(stakedPoints)
      });
      // Redirect directly to the live doubt chat
      navigate(`/chat/${created.id}`);
    } catch (err) {
      setError(err.message || 'Failed to post doubt.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-content">
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/')}
          className="btn btn-outline"
          style={{ marginBottom: '16px', padding: '6px 12px', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> Back to Doubt Feed
        </button>

        <div className="form-container" style={{ margin: '0', maxWidth: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div 
              style={{ 
                width: '44px', 
                height: '44px', 
                background: 'var(--primary-light)', 
                color: 'var(--primary)', 
                borderRadius: 'var(--radius-md)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <HelpCircle size={24} />
            </div>
            <div>
              <h2 className="form-title" style={{ fontSize: '1.4rem', margin: 0 }}>Raise an Academic Doubt</h2>
              <p className="form-subtitle" style={{ margin: 0, fontSize: '0.85rem' }}>
                Peers will answer in real-time chat. Stake KP to reward the solver!
              </p>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select
                  className="form-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Class / Level</label>
                <select
                  className="form-input"
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                >
                  <option value="10th">10th Grade</option>
                  <option value="11th">11th Grade</option>
                  <option value="12th">12th Grade</option>
                  <option value="college">College / Undergrad</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Describe Your Academic Doubt</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Explain the specific concept, problem statement, or where you got stuck..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Tip: Clear doubts receive faster responses from top peer scholars.
              </span>
            </div>

            {/* Staking Section */}
            <div 
              style={{ 
                background: '#fffbeb', 
                border: '1px solid #fef3c7', 
                borderRadius: 'var(--radius-md)', 
                padding: '16px', 
                marginBottom: '24px' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: '#92400e' }}>
                  <Coins size={18} color="#f59e0b" />
                  <strong>Knowledge Points to Stake:</strong>
                </label>
                <span style={{ fontSize: '0.85rem', color: '#78350f' }}>
                  Your Balance: <strong>{currentBalance} KP</strong>
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {quickStakes.map(amount => (
                  <button
                    type="button"
                    key={amount}
                    onClick={() => setStakedPoints(amount)}
                    className="btn"
                    style={{
                      fontSize: '0.85rem',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: Number(stakedPoints) === amount ? '#f59e0b' : '#ffffff',
                      color: Number(stakedPoints) === amount ? '#ffffff' : '#78350f',
                      border: '1px solid #fde68a',
                      fontWeight: 700
                    }}
                  >
                    {amount} KP
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="number"
                  min="5"
                  max={currentBalance}
                  className="form-input"
                  value={stakedPoints}
                  onChange={(e) => setStakedPoints(e.target.value)}
                  style={{ width: '130px', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.82rem', color: '#92400e' }}>
                  Points are held in escrow until you mark the doubt as resolved.
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
              disabled={submitting || currentBalance < stakedPoints}
            >
              <Sparkles size={18} />
              <span>
                {submitting ? 'Broadcasting to Peers...' : `Stake ${stakedPoints} KP & Post Doubt`}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RaiseDoubt;
