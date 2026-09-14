import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToDoubts } from '../services/doubtService';
import DoubtCard from '../components/DoubtCard';
import KPBadge from '../components/KPBadge';
import { 
  PlusCircle, 
  Search, 
  SlidersHorizontal, 
  Award, 
  HelpCircle, 
  CheckCircle2, 
  Coins, 
  Flame,
  BookOpen
} from 'lucide-react';

export const Dashboard = () => {
  const { userProfile, currentUser } = useAuth();
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'English'
  ];

  const classLevels = [
    { value: '10th', label: '10th Grade' },
    { value: '11th', label: '11th Grade' },
    { value: '12th', label: '12th Grade' },
    { value: 'college', label: 'College / Undergrad' }
  ];

  // Subscribe to doubts with real-time updates
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToDoubts(
      {
        subject: selectedSubject,
        classLevel: selectedClass,
        status: selectedStatus
      },
      (data) => {
        setDoubts(data);
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [selectedSubject, selectedClass, selectedStatus]);

  // Client search query filter
  const filteredDoubts = doubts.filter((d) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.text?.toLowerCase().includes(query) ||
      d.subject?.toLowerCase().includes(query) ||
      d.askerName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="main-content">
      {/* Student Overview Stat Cards */}
      {userProfile && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Coins size={26} />
            </div>
            <div>
              <div className="stat-val">{userProfile.kpBalance ?? 0} KP</div>
              <div className="stat-lbl">Wallet Balance</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Award size={26} />
            </div>
            <div>
              <div className="stat-val">{userProfile.reputation ?? 0}</div>
              <div className="stat-lbl">Scholar Reputation</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <CheckCircle2 size={26} />
            </div>
            <div>
              <div className="stat-val">{userProfile.totalSolved ?? 0}</div>
              <div className="stat-lbl">Doubts Solved</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>
              <HelpCircle size={26} />
            </div>
            <div>
              <div className="stat-val">{userProfile.totalAccepted ?? 0}</div>
              <div className="stat-lbl">Doubts Resolved</div>
            </div>
          </div>
        </div>
      )}

      {/* Hero / Callout for Doubt Solving */}
      <div 
        className="card" 
        style={{ 
          background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)', 
          color: 'white', 
          padding: '24px 28px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.15)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
            <Flame size={14} color="#f59e0b" />
            <span>Earn Knowledge Points by Helping Peers</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', marginBottom: '6px' }}>
            Need answers or want to earn rewards?
          </h2>
          <p style={{ opacity: 0.9, fontSize: '0.92rem', maxWidth: '600px' }}>
            Stake KP on your tough homework doubts, or browse open questions below to earn bounty tokens directly into your wallet.
          </p>
        </div>

        <Link to="/raise" className="btn" style={{ background: 'var(--kp-gold)', color: '#000', fontWeight: 700, padding: '10px 20px' }}>
          <PlusCircle size={18} />
          <span>Post a Doubt &amp; Stake KP</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
            <SlidersHorizontal size={16} />
            <span>Filters:</span>
          </div>

          <select
            className="filter-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">All Classes</option>
            {classLevels.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open Bounties Only</option>
            <option value="in_progress">In Discussion</option>
            <option value="resolved">Resolved Doubts</option>
          </select>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search doubts or keywords..."
            className="form-input"
            style={{ paddingLeft: '36px', paddingRight: '12px', paddingBottom: '7px', paddingTop: '7px', fontSize: '0.88rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Doubts Feed */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
          Live Academic Doubts ({filteredDoubts.length})
        </h3>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Real-time updates active
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading live doubts feed...</p>
        </div>
      ) : filteredDoubts.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={42} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No doubts match your filters</h4>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
            Be the first to raise a doubt in this category and stake Knowledge Points!
          </p>
          <Link to="/raise" className="btn btn-primary">
            <PlusCircle size={16} /> Post Doubt Now
          </Link>
        </div>
      ) : (
        <div className="doubts-grid">
          {filteredDoubts.map((doubt) => (
            <DoubtCard
              key={doubt.id}
              doubt={doubt}
              currentUserId={currentUser?.uid}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
