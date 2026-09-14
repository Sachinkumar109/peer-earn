import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToDoubts } from '../services/doubtService';
import KPBadge from '../components/KPBadge';
import DoubtCard from '../components/DoubtCard';
import { 
  User, 
  Coins, 
  Award, 
  CheckCircle, 
  HelpCircle, 
  ShoppingBag, 
  Coffee, 
  Book, 
  GraduationCap, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const Profile = () => {
  const { userProfile, currentUser } = useAuth();
  const [allDoubts, setAllDoubts] = useState([]);
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'store'
  const [historyFilter, setHistoryFilter] = useState('asked'); // 'asked' | 'solved'
  const [redeemSuccess, setRedeemSuccess] = useState('');

  useEffect(() => {
    const unsub = subscribeToDoubts({}, (doubts) => {
      setAllDoubts(doubts);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  if (!userProfile) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '50px' }}>
        <p>Please log in to view your profile and rewards.</p>
      </div>
    );
  }

  const askedDoubts = allDoubts.filter(d => d.askerId === userProfile.uid);
  const solvedDoubts = allDoubts.filter(d => d.solverId === userProfile.uid && d.status === 'resolved');

  const rewards = [
    {
      id: 'canteen_meal',
      title: 'Campus Canteen Meal Voucher',
      category: 'Food & Dining',
      cost: 60,
      icon: '☕',
      desc: 'Redeemable for lunch or combo snack at the student cafeteria.'
    },
    {
      id: 'bookstore_pass',
      title: 'College Bookstore $10 Voucher',
      category: 'Stationery & Books',
      cost: 100,
      icon: '📚',
      desc: 'Applies to notebooks, reference guides, or textbook rentals.'
    },
    {
      id: 'library_priority',
      title: 'Semester Study Room Priority Pass',
      category: 'Campus Privileges',
      cost: 80,
      icon: '🏛️',
      desc: 'Priority booking for quiet study cubicles during finals week.'
    },
    {
      id: 'tutor_certificate',
      title: 'Verified Peer Tutor Certificate',
      category: 'Academic Honor',
      cost: 150,
      icon: '🎓',
      desc: 'Official digital credential verified by department head for CV.'
    }
  ];

  const handleRedeem = (reward) => {
    if (userProfile.kpBalance < reward.cost) {
      alert(`Insufficient KP balance! You need ${reward.cost} KP to redeem ${reward.title}, but currently have ${userProfile.kpBalance} KP.`);
      return;
    }

    setRedeemSuccess(`🎉 Successfully redeemed "${reward.title}"! Voucher code: PEER-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
    setTimeout(() => {
      setRedeemSuccess('');
    }, 6000);
  };

  return (
    <div className="main-content">
      {/* Profile Header Card */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: 'var(--radius-full)', 
                background: 'linear-gradient(135deg, var(--primary), #818cf8)', 
                color: 'white',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
              }}
            >
              <User size={36} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                  {userProfile.name}
                </h1>
                <span 
                  style={{ 
                    background: 'var(--primary-light)', 
                    color: 'var(--primary)', 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    padding: '2px 8px', 
                    borderRadius: 'var(--radius-full)' 
                  }}
                >
                  Grade: {userProfile.classLevel}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{userProfile.email}</p>
              
              {userProfile.subjects && userProfile.subjects.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {userProfile.subjects.map(s => (
                    <span key={s} style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Balance Block */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                Available Balance
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--kp-gold-dark)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                <Coins size={22} color="#f59e0b" />
                <span>{userProfile.kpBalance} KP</span>
              </div>
            </div>

            <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }} />

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                Reputation
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Award size={20} color="#3b82f6" />
                <span>{userProfile.reputation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('history')}
          className="btn"
          style={{
            borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : '2px solid transparent',
            borderRadius: '0',
            color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            padding: '10px 16px'
          }}
        >
          Activity &amp; Doubt History
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className="btn"
          style={{
            borderBottom: activeTab === 'store' ? '2px solid var(--primary)' : '2px solid transparent',
            borderRadius: '0',
            color: activeTab === 'store' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ShoppingBag size={16} />
          <span>KP Token Redemption Store (Preview)</span>
        </button>
      </div>

      {/* TAB 1: HISTORY */}
      {activeTab === 'history' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => setHistoryFilter('asked')}
              className="btn"
              style={{
                background: historyFilter === 'asked' ? 'var(--primary)' : '#f1f5f9',
                color: historyFilter === 'asked' ? '#ffffff' : '#334155',
                fontSize: '0.85rem',
                padding: '6px 14px'
              }}
            >
              Doubts I Asked ({askedDoubts.length})
            </button>

            <button
              onClick={() => setHistoryFilter('solved')}
              className="btn"
              style={{
                background: historyFilter === 'solved' ? 'var(--primary)' : '#f1f5f9',
                color: historyFilter === 'solved' ? '#ffffff' : '#334155',
                fontSize: '0.85rem',
                padding: '6px 14px'
              }}
            >
              Doubts I Solved ({solvedDoubts.length})
            </button>
          </div>

          {historyFilter === 'asked' ? (
            askedDoubts.length === 0 ? (
              <div className="empty-state">
                <HelpCircle size={40} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                <p>You haven't asked any doubts yet.</p>
              </div>
            ) : (
              <div className="doubts-grid">
                {askedDoubts.map(d => (
                  <DoubtCard key={d.id} doubt={d} currentUserId={userProfile.uid} />
                ))}
              </div>
            )
          ) : (
            solvedDoubts.length === 0 ? (
              <div className="empty-state">
                <CheckCircle size={40} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                <p>You haven't solved and verified any doubts yet. Check the dashboard to earn KP!</p>
              </div>
            ) : (
              <div className="doubts-grid">
                {solvedDoubts.map(d => (
                  <DoubtCard key={d.id} doubt={d} currentUserId={userProfile.uid} />
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* TAB 2: MOCK REDEMPTION STORE */}
      {activeTab === 'store' && (
        <div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: '20px', color: '#166534', fontSize: '0.9rem' }}>
            <strong>Campus Utility &amp; Rewards Ecosystem:</strong> In full production, Knowledge Points (KP) earned by helping peers can be redeemed at participating college cafeterias, bookstores, and academic facilities.
          </div>

          {redeemSuccess && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '12px 18px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontWeight: 600 }}>
              {redeemSuccess}
            </div>
          )}

          <div className="store-grid">
            {rewards.map((reward) => (
              <div key={reward.id} className="store-card">
                <div>
                  <div className="store-card-icon">{reward.icon}</div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {reward.category}
                  </span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '6px 0' }}>{reward.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    {reward.desc}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: 800, color: 'var(--kp-gold-dark)', marginBottom: '10px' }}>
                    <Coins size={16} color="#f59e0b" />
                    <span>{reward.cost} KP</span>
                  </div>

                  <button
                    onClick={() => handleRedeem(reward)}
                    className="btn btn-outline"
                    style={{ width: '100%', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    Redeem Reward
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
