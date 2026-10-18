import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToDoubts } from '../services/doubtService';
import DoubtCard from '../components/DoubtCard';
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
    'coding',
    'Programming',
    'Artificial Intelligence',
    'Machine Learning',
    'Data Science',
    'Statistics',
    'History',
    'Geography',
    'Economics',
    'Political Science',
    'Psychology',
    'Sociology',
    'Philosophy',
    'Literature',
    'English'
  ];

  const classLevels = [
    { value: '10th', label: '10th Grade' },
    { value: '11th', label: '11th Grade' },
    { value: '12th', label: '12th Grade' },
    { value: 'college', label: 'College / Undergrad' },
    { value: 'PG', label: 'Postgraduate / Masters' }
  ];

  // ==================================================
  // SMART FEED PRIORITY
  // ==================================================
  // 0 = Fresh / no reward
  // 1 = Partially rewarded
  // 2 = Fully resolved
  //
  // Lower priority number appears first.
  // ==================================================

  const getFeedPriority = (doubt) => {
    const awardedStars = Number(doubt?.awardedStars) || 0;
    const rewardedPoints = Number(doubt?.rewardedPoints) || 0;

    const remainingPoints = Number(
      doubt?.remainingPoints ??
      doubt?.stakedPoints ??
      0
    ) || 0;

    // Fully completed doubt
    if (
      doubt?.status === 'resolved' ||
      awardedStars >= 5 ||
      remainingPoints <= 0
    ) {
      return 2;
    }

    // Some reward has already been given
    if (
      awardedStars > 0 ||
      rewardedPoints > 0
    ) {
      return 1;
    }

    // Fresh doubt
    return 0;
  };

  // ==================================================
  // CONVERT FIREBASE / MOCK DATE TO TIMESTAMP
  // ==================================================

  const getCreatedTime = (doubt) => {
    if (!doubt?.createdAt) {
      return 0;
    }

    if (
      typeof doubt.createdAt.toDate === 'function'
    ) {
      return doubt.createdAt.toDate().getTime();
    }

    if (
      typeof doubt.createdAt.toMillis === 'function'
    ) {
      return doubt.createdAt.toMillis();
    }

    if (
      doubt.createdAt.seconds !== undefined
    ) {
      return Number(doubt.createdAt.seconds) * 1000;
    }

    const parsed = new Date(doubt.createdAt).getTime();

    return Number.isNaN(parsed) ? 0 : parsed;
  };

  // ==================================================
  // REAL-TIME DOUBTS SUBSCRIPTION
  // ==================================================

  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToDoubts(
      {
        subject: selectedSubject,
        classLevel: selectedClass,
        status: selectedStatus
      },
      (data) => {
        setDoubts(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [
    selectedSubject,
    selectedClass,
    selectedStatus
  ]);

  // ==================================================
  // SEARCH + SMART FEED RANKING
  // ==================================================

  const rankedDoubts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const sorted = [...doubts];

    // ==================================================
    // NO SEARCH
    // ==================================================
    // Smart Feed is the main ordering:
    //
    // 0★ → newest first
    // 1–4★ → newest first
    // 5★ → newest first
    // ==================================================

    if (!query) {
      return sorted.sort((a, b) => {
        const priorityA = getFeedPriority(a);
        const priorityB = getFeedPriority(b);

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        return getCreatedTime(b) - getCreatedTime(a);
      });
    }

    // ==================================================
    // SEARCH MODE
    // ==================================================

    const codingKeywords = [
      'coding',
      'code',
      'programming',
      'program',
      'developer',
      'development',
      'python',
      'java',
      'javascript',
      'typescript',
      'c++',
      'cpp',
      'html',
      'css',
      'react',
      'node',
      'algorithm',
      'algorithms',
      'data structure',
      'data structures',
      'dsa',
      'debugging',
      'debug',
      'bug',
      'error',
      'function',
      'class',
      'object',
      'api',
      'database',
      'sql'
    ];

    const isCodingSearch = codingKeywords.some(
      (keyword) =>
        query.includes(keyword) ||
        keyword.includes(query)
    );

    const queryWords = query
      .split(/\s+/)
      .filter((word) => word.length > 1);

    return sorted.sort((a, b) => {
      const aText = (a?.text || '').toLowerCase();
      const bText = (b?.text || '').toLowerCase();

      const aSubject = (a?.subject || '').toLowerCase();
      const bSubject = (b?.subject || '').toLowerCase();

      const aAsker = (a?.askerName || '').toLowerCase();
      const bAsker = (b?.askerName || '').toLowerCase();

      let scoreA = 0;
      let scoreB = 0;

      // -----------------------------------------------
      // Exact phrase in doubt text
      // -----------------------------------------------

      if (aText.includes(query)) {
        scoreA += 100;
      }

      if (bText.includes(query)) {
        scoreB += 100;
      }

      // -----------------------------------------------
      // Subject match
      // -----------------------------------------------

      if (aSubject.includes(query)) {
        scoreA += 80;
      }

      if (bSubject.includes(query)) {
        scoreB += 80;
      }

      // -----------------------------------------------
      // Asker name match
      // -----------------------------------------------

      if (aAsker.includes(query)) {
        scoreA += 20;
      }

      if (bAsker.includes(query)) {
        scoreB += 20;
      }

      // -----------------------------------------------
      // Individual word matching
      // -----------------------------------------------

      queryWords.forEach((word) => {
        if (aText.includes(word)) {
          scoreA += 30;
        }

        if (bText.includes(word)) {
          scoreB += 30;
        }

        if (aSubject.includes(word)) {
          scoreA += 25;
        }

        if (bSubject.includes(word)) {
          scoreB += 25;
        }

        if (aAsker.includes(word)) {
          scoreA += 10;
        }

        if (bAsker.includes(word)) {
          scoreB += 10;
        }
      });

      // -----------------------------------------------
      // Coding-related search
      // -----------------------------------------------

      if (isCodingSearch) {
        codingKeywords.forEach((keyword) => {
          if (
            aText.includes(keyword) ||
            aSubject.includes(keyword)
          ) {
            scoreA += 15;
          }

          if (
            bText.includes(keyword) ||
            bSubject.includes(keyword)
          ) {
            scoreB += 15;
          }
        });
      }

      // -----------------------------------------------
      // SMART FEED PRIORITY
      // -----------------------------------------------
      // Search relevance comes first.
      // If relevance is equal, smart feed decides.
      // -----------------------------------------------

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      const priorityA = getFeedPriority(a);
      const priorityB = getFeedPriority(b);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // -----------------------------------------------
      // Same score + same feed group
      // Newest first
      // -----------------------------------------------

      return getCreatedTime(b) - getCreatedTime(a);
    });
  }, [doubts, searchQuery]);

  // ==================================================
  // CLEAR SEARCH
  // ==================================================

  const clearSearch = () => {
    setSearchQuery('');
  };

  // ==================================================
  // FEED COUNTS
  // ==================================================

  const freshCount = doubts.filter(
    (doubt) => getFeedPriority(doubt) === 0
  ).length;

  const partialCount = doubts.filter(
    (doubt) => getFeedPriority(doubt) === 1
  ).length;

  const resolvedCount = doubts.filter(
    (doubt) => getFeedPriority(doubt) === 2
  ).length;

  return (
    <div className="main-content">

      {/* ==================================================
          STUDENT OVERVIEW
      ================================================== */}

      {userProfile && (
        <div className="stat-grid">

          {/* Wallet */}
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{
                background: '#fef3c7',
                color: '#d97706'
              }}
            >
              <Coins size={26} />
            </div>

            <div>
              <div className="stat-val">
                {userProfile.kpBalance ?? 0} KP
              </div>

              <div className="stat-lbl">
                Wallet Balance
              </div>
            </div>
          </div>

          {/* Reputation */}
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{
                background: '#eff6ff',
                color: '#2563eb'
              }}
            >
              <Award size={26} />
            </div>

            <div>
              <div className="stat-val">
                {userProfile.reputation ?? 0}
              </div>

              <div className="stat-lbl">
                Scholar Reputation
              </div>
            </div>
          </div>

          {/* Doubts Solved */}
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{
                background: '#dcfce7',
                color: '#16a34a'
              }}
            >
              <CheckCircle2 size={26} />
            </div>

            <div>
              <div className="stat-val">
                {userProfile.totalSolved ?? 0}
              </div>

              <div className="stat-lbl">
                Doubts Solved
              </div>
            </div>
          </div>

          {/* Doubts Resolved */}
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{
                background: '#f3e8ff',
                color: '#eab333'
              }}
            >
              <HelpCircle size={26} />
            </div>

            <div>
              <div className="stat-val">
                {userProfile.totalAccepted ?? 0}
              </div>

              <div className="stat-lbl">
                Doubts Resolved
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==================================================
          HERO SECTION
      ================================================== */}

      <div
        className="card"
        style={{
          background:
            'linear-gradient(135deg, #312e81 0%, #4338ca 100%)',
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

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '8px'
            }}
          >
            <Flame size={14} color="#f59e0b" />

            <span>
              Earn Knowledge Points by Helping Peers
            </span>
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.45rem',
              marginBottom: '6px'
            }}
          >
            Need answers or want to earn rewards?
          </h2>

          <p
            style={{
              opacity: 0.9,
              fontSize: '0.92rem',
              maxWidth: '600px'
            }}
          >
            Stake KP on your tough homework doubts, or browse
            open questions below to earn bounty tokens directly
            into your wallet.
          </p>

        </div>

        <Link
          to="/raise"
          className="btn"
          style={{
            background: 'var(--kp-gold)',
            color: '#000',
            fontWeight: 700,
            padding: '10px 20px'
          }}
        >
          <PlusCircle size={18} />

          <span>
            Post a Doubt &amp; Stake KP
          </span>
        </Link>

      </div>

      {/* ==================================================
          FILTER + SEARCH BAR
      ================================================== */}

      <div className="filter-bar">

        <div className="filter-group">

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            <SlidersHorizontal size={16} />

            <span>
              Filters:
            </span>
          </div>

          {/* Subject */}
          <select
            className="filter-select"
            value={selectedSubject}
            onChange={(e) =>
              setSelectedSubject(e.target.value)
            }
          >
            <option value="all">
              All Subjects
            </option>

            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Class */}
          <select
            className="filter-select"
            value={selectedClass}
            onChange={(e) =>
              setSelectedClass(e.target.value)
            }
          >
            <option value="all">
              All Classes
            </option>

            {classLevels.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value)
            }
          >
            <option value="all">
              All Statuses
            </option>

            <option value="open">
              Open Bounties Only
            </option>

            <option value="in_progress">
              In Discussion
            </option>

            <option value="resolved">
              Resolved Doubts
            </option>
          </select>

        </div>

        {/* ==================================================
            SEARCH BOX
        ================================================== */}

        <div
          style={{
            position: 'relative',
            minWidth: '220px'
          }}
        >

          <Search
            size={16}
            color="#94a3b8"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)'
            }}
          />

          <input
            type="text"
            placeholder="Search doubts or keywords..."
            className="form-input"
            style={{
              paddingLeft: '36px',
              paddingRight: searchQuery ? '40px' : '12px',
              paddingBottom: '7px',
              paddingTop: '7px',
              fontSize: '0.88rem'
            }}
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
          />

          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              title="Clear search"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: '18px',
                padding: '2px 5px'
              }}
            >
              ×
            </button>
          )}

        </div>

      </div>

      {/* ==================================================
          SEARCH INFORMATION
      ================================================== */}

      {searchQuery.trim() && (
        <div
          style={{
            marginTop: '12px',
            marginBottom: '12px',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}
        >
          Showing results for:

          <strong style={{ marginLeft: '5px' }}>
            "{searchQuery}"
          </strong>
        </div>
      )}

      {/* ==================================================
          DOUBTS FEED HEADER
      ================================================== */}

      <div
        style={{
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >

        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 700
          }}
        >
          Live Academic Doubts ({rankedDoubts.length})
        </h3>

        <span
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}
        >
          Real-time updates active
        </span>

      </div>

      {/* ==================================================
          SMART FEED INFORMATION
      ================================================== */}

      {!searchQuery.trim() && doubts.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '18px'
          }}
        >

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '5px 9px',
              borderRadius: '999px',
              background: '#dcfce7',
              color: '#166534'
            }}
          >
            🟢 Fresh: {freshCount}
          </span>

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '5px 9px',
              borderRadius: '999px',
              background: '#fef3c7',
              color: '#92400e'
            }}
          >
            🟡 Partially Rewarded: {partialCount}
          </span>

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '5px 9px',
              borderRadius: '999px',
              background: '#e0e7ff',
              color: '#3730a3'
            }}
          >
            🔵 Fully Resolved: {resolvedCount}
          </span>

        </div>
      )}

      {/* ==================================================
          LOADING
      ================================================== */}

      {loading ? (

        <div
          style={{
            textAlign: 'center',
            padding: '40px'
          }}
        >
          <p
            style={{
              color: 'var(--text-muted)'
            }}
          >
            Loading live doubts feed...
          </p>
        </div>

      ) : rankedDoubts.length === 0 ? (

        /* ==================================================
           EMPTY STATE
        ================================================== */

        <div className="empty-state">

          <BookOpen
            size={42}
            color="#94a3b8"
            style={{
              margin: '0 auto 12px'
            }}
          />

          <h4
            style={{
              fontSize: '1.2rem',
              marginBottom: '8px'
            }}
          >
            {searchQuery.trim()
              ? 'No matching doubts found'
              : 'No doubts match your filters'}
          </h4>

          <p
            style={{
              color: 'var(--text-muted)',
              marginBottom: '16px',
              fontSize: '0.9rem'
            }}
          >
            {searchQuery.trim()
              ? 'Try another keyword, subject, or search term.'
              : 'Be the first to raise a doubt in this category and stake Knowledge Points!'}
          </p>

          {searchQuery.trim() ? (
            <button
              type="button"
              className="btn btn-outline"
              onClick={clearSearch}
            >
              Clear Search
            </button>
          ) : (
            <Link
              to="/raise"
              className="btn btn-primary"
            >
              <PlusCircle size={16} />
              Post Doubt Now
            </Link>
          )}

        </div>

      ) : (

        /* ==================================================
           DOUBTS GRID
        ================================================== */

        <div className="doubts-grid">

          {rankedDoubts.map((doubt) => (

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