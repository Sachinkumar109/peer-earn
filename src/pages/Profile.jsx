import React, { useState, useEffect } from 'react';

import { useAuth } from '../context/AuthContext';

import { subscribeToDoubts } from '../services/doubtService';

import {
  getAllAchievementsWithProgress,
  getAchievementSummary
} from '../services/achievementService';

import {
  getLevelProgress
} from '../services/progressService';

import DoubtCard from '../components/DoubtCard';

import {
  User,
  Coins,
  Award,
  CheckCircle,
  HelpCircle,
  ShoppingBag,
  Bell,
  Clock,
  CheckCheck,
  Zap,
  Trophy,
  Lock,
  Star
} from 'lucide-react';

export const Profile = () => {

  const {
    userProfile,
    currentUser,
    notifications = [],
    unreadNotificationCount = 0,
    redeemReward
  } = useAuth();

  const [allDoubts, setAllDoubts] = useState([]);

  // history | notifications | store | achievements
  const [activeTab, setActiveTab] = useState('history');

  const [historyFilter, setHistoryFilter] =
    useState('asked');

  const [redeemSuccess, setRedeemSuccess] =
    useState('');

  const [redeemingRewardId, setRedeemingRewardId] =
    useState(null);

  // =========================================================
  // SUBSCRIBE TO DOUBTS
  // =========================================================

  useEffect(() => {

    const unsub = subscribeToDoubts(
      {},
      (doubts) => {

        setAllDoubts(
          Array.isArray(doubts)
            ? doubts
            : []
        );
      }
    );

    return () => {

      if (typeof unsub === 'function') {
        unsub();
      }
    };

  }, []);

  // =========================================================
  // NOT LOGGED IN
  // =========================================================

  if (!userProfile) {

    return (
      <div
        className="main-content"
        style={{
          textAlign: 'center',
          padding: '50px',
          color: '#1e293b'
        }}
      >
        <p
          style={{
            color: '#475569',
            fontSize: '1rem'
          }}
        >
          Please log in to view your profile and
          rewards.
        </p>
      </div>
    );
  }

  // =========================================================
  // USER PROGRESS
  // =========================================================

  const currentXP =
    Number(userProfile.xp ?? 0);

  const levelProgress =
    getLevelProgress(currentXP);

  const achievementList =
    getAllAchievementsWithProgress(
      userProfile
    );

  const achievementSummary =
    getAchievementSummary(
      userProfile
    );

  const unlockedAchievements =
    achievementList.filter(
      (achievement) =>
        achievement.isUnlocked
    );

  const lockedAchievements =
    achievementList.filter(
      (achievement) =>
        !achievement.isUnlocked
    );

  // =========================================================
  // DOUBT HISTORY
  // =========================================================

  const askedDoubts =
    allDoubts.filter(
      (doubt) =>
        doubt.askerId ===
        userProfile.uid
    );

  const solvedDoubts =
    allDoubts.filter((doubt) => {

      if (
        doubt.currentSolverId ===
        userProfile.uid
      ) {
        return true;
      }

      if (
        doubt.solverId ===
        userProfile.uid
      ) {
        return true;
      }

      if (
        Array.isArray(
          doubt.rewardHistory
        )
      ) {

        return doubt.rewardHistory.some(
          (entry) =>
            entry?.solverId ===
            userProfile.uid
        );
      }

      return false;
    });

  // =========================================================
  // REWARDS
  // =========================================================

  const rewards = [
    {
      id: 'canteen_meal',
      title: 'Campus Canteen Meal Voucher',
      category: 'Food & Dining',
      cost: 60,
      icon: '☕',
      desc:
        'Redeemable for lunch or combo snack at the student cafeteria.'
    },

    {
      id: 'bookstore_pass',
      title: 'College Bookstore $10 Voucher',
      category: 'Stationery & Books',
      cost: 100,
      icon: '📚',
      desc:
        'Applies to notebooks, reference guides, or textbook rentals.'
    },

    {
      id: 'library_priority',
      title:
        'Semester Study Room Priority Pass',
      category: 'Campus Privileges',
      cost: 80,
      icon: '🏛️',
      desc:
        'Priority booking for quiet study cubicles during finals week.'
    },

    {
      id: 'tutor_certificate',
      title:
        'Verified Peer Tutor Certificate',
      category: 'Academic Honor',
      cost: 550,
      icon: '🎓',
      desc:
        'Official digital credential verified by department head for CV.'
    }
  ];

  // =========================================================
  // GENERATE VOUCHER CODE
  // =========================================================

  const generateVoucherCode = () => {

    return (
      'PEER-' +
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()
    );
  };

  // =========================================================
  // REDEEM REWARD
  // =========================================================

  const handleRedeem = async (reward) => {

    // -------------------------------------------------------
    // PREVENT DOUBLE CLICK
    // -------------------------------------------------------

    if (
      redeemingRewardId
    ) {
      return;
    }

    // -------------------------------------------------------
    // BASIC VALIDATION
    // -------------------------------------------------------

    if (!reward) {
      return;
    }

    const balance =
      Number(
        userProfile.kpBalance ?? 0
      );

    const cost =
      Number(reward.cost);

    // -------------------------------------------------------
    // FRONTEND BALANCE CHECK
    // -------------------------------------------------------
    //
    // This is only for quick UI feedback.
    //
    // The real security check is performed again inside
    // redeemReward() using the latest Firebase balance.
    //

    if (
      !Number.isFinite(cost) ||
      cost <= 0
    ) {

      setRedeemSuccess(
        '❌ Invalid reward cost.'
      );

      setTimeout(() => {
        setRedeemSuccess('');
      }, 100000);

      return;
    }

    if (
      balance < cost
    ) {

      setRedeemSuccess(
        `❌ Insufficient KP! You have ${balance} KP, but "${reward.title}" costs ${cost} KP.`
      );

      setTimeout(() => {
        setRedeemSuccess('');
      }, 100000);

      return;
    }

    // -------------------------------------------------------
    // START REDEMPTION
    // -------------------------------------------------------

    setRedeemingRewardId(
      reward.id
    );

    setRedeemSuccess('');

    try {

      // -----------------------------------------------------
      // ACTUAL FIREBASE REDEMPTION
      // -----------------------------------------------------

      const result =
        await redeemReward(
          reward
        );

      // -----------------------------------------------------
      // GENERATE VOUCHER CODE
      // -----------------------------------------------------

      const voucherCode =
        generateVoucherCode();

      // -----------------------------------------------------
      // SUCCESS MESSAGE
      // -----------------------------------------------------

      setRedeemSuccess(
        `🎉 Successfully redeemed "${reward.title}"! ${result.cost} KP deducted. Remaining balance: ${result.newBalance} KP. Voucher code: ${voucherCode}`
      );

      // -----------------------------------------------------
      // AUTO HIDE SUCCESS MESSAGE
      // -----------------------------------------------------

      setTimeout(() => {

        setRedeemSuccess('');

      }, 100000);

    } catch (error) {

      console.error(
        'Reward redemption error:',
        error
      );

      // -----------------------------------------------------
      // FIREBASE / WALLET ERROR
      // -----------------------------------------------------

      setRedeemSuccess(
        `❌ ${error?.message || 'Unable to redeem this reward. Please try again.'}`
      );

      setTimeout(() => {

        setRedeemSuccess('');

      }, 6000);

    } finally {

      setRedeemingRewardId(
        null
      );
    }
  };

  // =========================================================
  // NOTIFICATION HELPERS
  // =========================================================

  const getNotificationIcon = (
    notification
  ) => {

    if (
      notification?.type ===
        'doubt_waiting' ||
      notification?.type ===
        'doubt_reminder'
    ) {

      return (
        <Clock size={18} />
      );
    }

    if (
      notification?.type ===
        'doubt_solved' ||
      notification?.type ===
        'reward'
    ) {

      return (
        <CheckCircle size={18} />
      );
    }

    return (
      <Bell size={18} />
    );
  };

  const getNotificationTitle = (
    notification
  ) => {

    if (notification?.title) {
      return notification.title;
    }

    if (
      notification?.type ===
        'doubt_waiting' ||
      notification?.type ===
        'doubt_reminder'
    ) {

      return 'New Doubt Needs Help';
    }

    if (
      notification?.type ===
      'doubt_solved'
    ) {

      return 'Doubt Solved';
    }

    if (
      notification?.type ===
      'reward'
    ) {

      return 'You Earned KP';
    }

    return 'Peer-Earn Notification';
  };

  const getNotificationMessage = (
    notification
  ) => {

    if (notification?.message) {
      return notification.message;
    }

    if (notification?.doubtText) {
      return notification.doubtText;
    }

    return 'You have a new Peer-Earn update.';
  };

  // =========================================================
  // NOTIFICATION TIME
  // =========================================================

  const formatNotificationTime = (
    notification
  ) => {

    const rawTime =
      notification?.createdAt ||
      notification?.timestamp;

    if (!rawTime) {
      return '';
    }

    let date;

    if (rawTime?.toDate) {

      date =
        rawTime.toDate();

    } else if (
      rawTime instanceof Date
    ) {

      date = rawTime;

    } else {

      date =
        new Date(rawTime);
    }

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return '';
    }

    const difference =
      Date.now() -
      date.getTime();

    const minutes =
      Math.floor(
        difference /
          (1000 * 60)
      );

    const hours =
      Math.floor(
        difference /
          (1000 * 60 * 60)
      );

    const days =
      Math.floor(
        difference /
          (1000 * 60 * 60 * 24)
      );

    if (minutes < 1) {
      return 'Just now';
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    if (hours < 24) {
      return `${hours}h ago`;
    }

    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString();
  };

  // =========================================================
  // SORT NOTIFICATIONS
  // =========================================================

  const sortedNotifications =
    Array.isArray(notifications)
      ? [...notifications].sort(
          (a, b) => {

            const getTime = (
              item
            ) => {

              const value =
                item?.createdAt ||
                item?.timestamp;

              if (
                value?.toDate
              ) {

                return value
                  .toDate()
                  .getTime();
              }

              const parsed =
                new Date(
                  value || 0
                ).getTime();

              return Number.isNaN(
                parsed
              )
                ? 0
                : parsed;
            };

            return (
              getTime(b) -
              getTime(a)
            );
          }
        )
      : [];

  return (
    <div className="main-content">

      {/* =====================================================
          PROFILE HEADER
      ===================================================== */}

      <div
        className="card"
        style={{
          marginBottom: '24px',
          background:
            'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          color: '#1e293b'
        }}
      >

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >

          {/* USER INFORMATION */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >

            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius:
                  'var(--radius-full)',
                background:
                  'linear-gradient(135deg, var(--primary), #818cf8)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow:
                  '0 4px 12px rgba(79, 70, 229, 0.25)'
              }}
            >
              <User size={36} />
            </div>

            <div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}
              >

                <h1
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    fontFamily:
                      'var(--font-heading)',
                    color: '#1e293b',
                    margin: 0
                  }}
                >
                  {userProfile.name}
                </h1>

                <span
                  style={{
                    background:
                      'var(--primary-light)',
                    color:
                      'var(--primary)',
                    fontSize:
                      '0.75rem',
                    fontWeight: 700,
                    padding:
                      '2px 8px',
                    borderRadius:
                      'var(--radius-full)'
                  }}
                >
                  Grade:{' '}
                  {userProfile.classLevel}
                </span>

              </div>

              <p
                style={{
                  color:
                    '#475569',
                  fontSize:
                    '0.88rem',
                  margin:
                    '4px 0 0'
                }}
              >
                {userProfile.email}
              </p>

              {userProfile.subjects &&
                userProfile.subjects.length >
                  0 && (

                <div
                  style={{
                    display:
                      'flex',
                    gap: '6px',
                    marginTop:
                      '6px',
                    flexWrap:
                      'wrap'
                  }}
                >

                  {userProfile.subjects.map(
                    (subject) => (

                      <span
                        key={subject}
                        style={{
                          fontSize:
                            '0.7rem',
                          background:
                            '#f1f5f9',
                          color:
                            '#475569',
                          padding:
                            '2px 8px',
                          borderRadius:
                            'var(--radius-full)'
                        }}
                      >
                        {subject}
                      </span>

                    )
                  )}

                </div>
              )}

            </div>
          </div>

          {/* BALANCE + REPUTATION */}

          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems:
                'center'
            }}
          >

            <div
              style={{
                textAlign: 'right'
              }}
            >

              <div
                style={{
                  fontSize:
                    '0.75rem',
                  textTransform:
                    'uppercase',
                  color:
                    '#64748b',
                  fontWeight: 700
                }}
              >
                Available Balance
              </div>

              <div
                style={{
                  fontSize:
                    '1.6rem',
                  fontWeight: 800,
                  color:
                    'var(--kp-gold-dark)',
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap: '6px',
                  justifyContent:
                    'flex-end'
                }}
              >

                <Coins
                  size={22}
                  color="#f59e0b"
                />

                <span>
                  {Number(
                    userProfile.kpBalance ??
                      0
                  )}{' '}
                  KP
                </span>

              </div>
            </div>

            <div
              style={{
                width: '1px',
                height: '40px',
                background:
                  'var(--border-color)'
              }}
            />

            <div
              style={{
                textAlign: 'center'
              }}
            >

              <div
                style={{
                  fontSize:
                    '0.75rem',
                  textTransform:
                    'uppercase',
                  color:
                    '#64748b',
                  fontWeight: 700
                }}
              >
                Reputation
              </div>

              <div
                style={{
                  fontSize:
                    '1.4rem',
                  fontWeight: 800,
                  color:
                    '#3b82f6',
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap: '4px'
                }}
              >

                <Award
                  size={20}
                  color="#3b82f6"
                />

                <span>
                  {userProfile.reputation ??
                    0}
                </span>

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* =====================================================
          XP + LEVEL CARD
      ===================================================== */}

      <div
        className="card"
        style={{
          marginBottom: '24px',
          background:
            'linear-gradient(135deg, #eef2ff 0%, #ffffff 100%)',
          border:
            '1px solid rgba(79, 70, 229, 0.15)',
          color: '#1e293b'
        }}
      >

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}
        >

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}
          >

            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background:
                  'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Zap size={27} />
            </div>

            <div>

              <div
                style={{
                  fontSize:
                    '0.72rem',
                  color:
                    '#64748b',
                  fontWeight: 700,
                  textTransform:
                    'uppercase'
                }}
              >
                Your Level
              </div>

              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  marginTop: '3px',
                  color: '#1e293b',
                  letterSpacing: '-0.3px'
                }}
              >
                Level {levelProgress.currentLevel}
                {' — '}
                {levelProgress.levelName}
              </h2>

            </div>
          </div>

          <div
            style={{
              textAlign: 'right'
            }}
          >

            <div
              style={{
                fontSize:
                  '1.35rem',
                fontWeight: 800,
                color:
                  '#6366f1'
              }}
            >
              {currentXP} XP
            </div>

            {levelProgress.isMaxLevel ? (

              <div
                style={{
                  fontSize:
                    '0.75rem',
                  color:
                    '#475569'
                }}
              >
                Maximum Level Reached 🎉
              </div>

            ) : (

              <div
                style={{
                  fontSize:
                    '0.75rem',
                  color:
                    '#475569'
                }}
              >
                Next Level:{' '}
                {levelProgress.nextLevelXP}{' '}
                XP
              </div>

            )}

          </div>
        </div>

        {/* XP PROGRESS */}

        <div
          style={{
            marginTop: '18px'
          }}
        >

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.72rem',
              color: '#6366f1',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '6px'
            }}
          >

            <span>
              Level Progress
            </span>

            <span>
              {levelProgress.progressPercent}%
            </span>

          </div>

          <div
            style={{
              height: '9px',
              background:
                '#e2e8f0',
              borderRadius:
                '999px',
              overflow:
                'hidden'
            }}
          >

            <div
              style={{
                width: `${levelProgress.progressPercent}%`,
                height: '100%',
                background:
                  'linear-gradient(90deg, #6366f1, #8b5cf6)',
                borderRadius:
                  '999px',
                transition:
                  'width 0.4s ease'
              }}
            />

          </div>

          {!levelProgress.isMaxLevel && (

            <div
              style={{
                marginTop: '6px',
                fontSize:
                  '0.72rem',
                color:
                  '#475569'
              }}
            >
              {levelProgress.progressXP} XP /{' '}
              {levelProgress.nextLevelXP -
                levelProgress.requiredXP}{' '}
              XP in this level
            </div>

          )}

        </div>
      </div>

      {/* =====================================================
          TAB SWITCHER
      ===================================================== */}

      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom:
            '1px solid var(--border-color)',
          marginBottom: '20px',
          overflowX: 'auto'
        }}
      >

        {/* HISTORY */}

        <button
          onClick={() =>
            setActiveTab('history')
          }
          className="btn"
          style={{
            borderBottom:
              activeTab ===
              'history'
                ? '2px solid var(--primary)'
                : '2px solid transparent',
            borderRadius: '0',
            color:
              activeTab ===
              'history'
                ? 'var(--primary)'
                : '#475569',
            fontWeight: 700,
            padding:
              '10px 16px',
            whiteSpace:
              'nowrap'
          }}
        >
          Activity &amp; Doubt History
        </button>

        {/* ACHIEVEMENTS */}

        <button
          onClick={() =>
            setActiveTab(
              'achievements'
            )
          }
          className="btn"
          style={{
            borderBottom:
              activeTab ===
              'achievements'
                ? '2px solid var(--primary)'
                : '2px solid transparent',
            borderRadius: '0',
            color:
              activeTab ===
              'achievements'
                ? 'var(--primary)'
                : '#475569',
            fontWeight: 700,
            padding:
              '10px 16px',
            display:
              'flex',
            alignItems:
              'center',
            gap: '6px',
            whiteSpace:
              'nowrap'
          }}
        >
          <Trophy size={16} />

          Achievements

          <span
            style={{
              background:
                '#fef3c7',
              color:
                '#92400e',
              padding:
                '2px 7px',
              borderRadius:
                '999px',
              fontSize:
                '0.65rem',
              fontWeight: 800
            }}
          >
            {achievementSummary.unlocked}/
            {achievementSummary.total}
          </span>
        </button>

        {/* NOTIFICATIONS */}

        <button
          onClick={() =>
            setActiveTab(
              'notifications'
            )
          }
          className="btn"
          style={{
            borderBottom:
              activeTab ===
              'notifications'
                ? '2px solid var(--primary)'
                : '2px solid transparent',
            borderRadius: '0',
            color:
              activeTab ===
              'notifications'
                ? 'var(--primary)'
                : '#475569',
            fontWeight: 700,
            padding:
              '10px 16px',
            display:
              'flex',
            alignItems:
              'center',
            gap: '7px',
            whiteSpace:
              'nowrap'
          }}
        >
          <Bell size={16} />

          <span>
            Notifications
          </span>

          {unreadNotificationCount >
            0 && (

            <span
              style={{
                minWidth:
                  '19px',
                height:
                  '19px',
                borderRadius:
                  '999px',
                background:
                  '#ef4444',
                color:
                  '#ffffff',
                fontSize:
                  '0.65rem',
                fontWeight: 800,
                display:
                  'inline-flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                padding:
                  '0 5px'
              }}
            >
              {unreadNotificationCount >
              99
                ? '99+'
                : unreadNotificationCount}
            </span>
          )}

        </button>

        {/* STORE */}

        <button
          onClick={() =>
            setActiveTab('store')
          }
          className="btn"
          style={{
            borderBottom:
              activeTab ===
              'store'
                ? '2px solid var(--primary)'
                : '2px solid transparent',
            borderRadius: '0',
            color:
              activeTab ===
              'store'
                ? 'var(--primary)'
                : '#475569',
            fontWeight: 700,
            padding:
              '10px 16px',
            display:
              'flex',
            alignItems:
              'center',
            gap: '6px',
            whiteSpace:
              'nowrap'
          }}
        >
          <ShoppingBag
            size={16}
          />

          <span>
            KP Token Redemption Store
          </span>

        </button>

      </div>

      {/* =====================================================
          TAB 1: HISTORY
      ===================================================== */}

      {activeTab ===
        'history' && (

        <div>

          <div
            style={{
              display:
                'flex',
              gap: '8px',
              marginBottom:
                '16px',
              flexWrap:
                'wrap'
            }}
          >

            <button
              onClick={() =>
                setHistoryFilter(
                  'asked'
                )
              }
              className="btn"
              style={{
                background:
                  historyFilter ===
                  'asked'
                    ? 'var(--primary)'
                    : '#f1f5f9',
                color:
                  historyFilter ===
                  'asked'
                    ? '#ffffff'
                    : '#334155',
                fontSize:
                  '0.85rem',
                padding:
                  '6px 14px'
              }}
            >
              Doubts I Asked (
              {askedDoubts.length}
              )
            </button>

            <button
              onClick={() =>
                setHistoryFilter(
                  'solved'
                )
              }
              className="btn"
              style={{
                background:
                  historyFilter ===
                  'solved'
                    ? 'var(--primary)'
                    : '#f1f5f9',
                color:
                  historyFilter ===
                  'solved'
                    ? '#ffffff'
                    : '#334155',
                fontSize:
                  '0.85rem',
                padding:
                  '6px 14px'
              }}
            >
              Doubts I Solved (
              {solvedDoubts.length}
              )
            </button>

          </div>

          {historyFilter ===
          'asked' ? (

            askedDoubts.length ===
            0 ? (

              <div
                className="empty-state"
                style={{
                  color: '#1e293b'
                }}
              >

                <HelpCircle
                  size={40}
                  color="#94a3b8"
                  style={{
                    margin:
                      '0 auto 8px'
                  }}
                />

                <p
                  style={{
                    color: '#475569'
                  }}
                >
                  You haven't asked
                  any doubts yet.
                </p>

              </div>

            ) : (

              <div className="doubts-grid">

                {askedDoubts.map(
                  (doubt) => (

                    <DoubtCard
                      key={
                        doubt.id
                      }
                      doubt={
                        doubt
                      }
                      currentUserId={
                        userProfile.uid
                      }
                    />

                  )
                )}

              </div>
            )

          ) : solvedDoubts.length ===
            0 ? (

            <div
              className="empty-state"
              style={{
                color: '#1e293b'
              }}
            >

              <CheckCircle
                size={40}
                color="#94a3b8"
                style={{
                  margin:
                    '0 auto 8px'
                }}
              />

              <p
                style={{
                  color: '#475569'
                }}
              >
                You haven't solved
                and verified any
                doubts yet.
              </p>

            </div>

          ) : (

            <div className="doubts-grid">

              {solvedDoubts.map(
                (doubt) => (

                  <DoubtCard
                    key={
                      doubt.id
                    }
                    doubt={doubt}
                    currentUserId={
                      userProfile.uid
                    }
                  />

                )
              )}

            </div>
          )}

        </div>
      )}

      {/* =====================================================
          TAB 2: ACHIEVEMENTS
      ===================================================== */}

      {activeTab ===
        'achievements' && (

        <div>

          {/* ACHIEVEMENT SUMMARY */}

          <div
            className="card"
            style={{
              marginBottom:
                '20px',
              background:
                'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)',
              border:
                '1px solid #fed7aa',
              color: '#1e293b'
            }}
          >

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                gap: '15px',
                flexWrap:
                  'wrap'
              }}
            >

              <div
                style={{
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap: '12px'
                }}
              >

                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius:
                      '14px',
                    background:
                      '#fef3c7',
                    display:
                      'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center'
                  }}
                >

                  <Trophy
                    size={25}
                    color="#d97706"
                  />

                </div>

                <div>

                  <h2
                    style={{
                      fontSize:
                        '1.15rem',
                      fontWeight:
                        800,
                      color:
                        '#1e293b',
                      margin: 0
                    }}
                  >
                    Achievement Progress
                  </h2>

                  <p
                    style={{
                      fontSize:
                        '0.78rem',
                      color:
                        '#6366f1',
                      marginTop:
                        '3px'
                    }}
                  >
                    Complete milestones
                    and earn bonus XP.
                  </p>

                </div>
              </div>

              <div
                style={{
                  textAlign:
                    'right'
                }}
              >

                <div
                  style={{
                    fontSize:
                      '1.4rem',
                    fontWeight:
                      800,
                    color:
                      '#d97706'
                  }}
                >
                  {
                    achievementSummary.unlocked
                  } /{' '}
                  {
                    achievementSummary.total
                  }
                </div>

                <div
                  style={{
                    fontSize:
                      '0.72rem',
                    color:
                      '#6366f1'
                  }}
                >
                  Achievements Unlocked
                </div>

              </div>
            </div>

            <div
              style={{
                marginTop:
                  '16px'
              }}
            >

              <div
                style={{
                  height:
                    '8px',
                  background:
                    '#e2e8f0',
                  borderRadius:
                    '999px',
                  overflow:
                    'hidden'
                }}
              >

                <div
                  style={{
                    width: `${achievementSummary.percentage}%`,
                    height:
                      '100%',
                    background:
                      'linear-gradient(90deg, #f59e0b, #f97316)',
                    borderRadius:
                      '999px'
                  }}
                />

              </div>

            </div>
          </div>

          {/* UNLOCKED */}

          <div
            style={{
              marginBottom:
                '28px'
            }}
          >

            <div
              style={{
                display:
                  'flex',
                alignItems:
                  'center',
                gap: '8px',
                marginBottom:
                  '14px'
              }}
            >

              <Star
                size={20}
                color="#f59e0b"
                fill="#f59e0b"
              />

              <h2
                style={{
                  fontSize:
                    '1.05rem',
                  fontWeight:
                    800,
                  color:
                    '#1e293b',
                  margin: 0
                }}
              >
                Unlocked Achievements
              </h2>

            </div>

            {unlockedAchievements.length ===
            0 ? (

              <div
                className="empty-state"
                style={{
                  padding:
                    '30px',
                  color: '#1e293b'
                }}
              >

                <Trophy
                  size={40}
                  color="#cbd5e1"
                  style={{
                    margin:
                      '0 auto 8px'
                  }}
                />

                <p
                  style={{
                    color: '#475569'
                  }}
                >
                  No achievements
                  unlocked yet.
                </p>

                <p
                  style={{
                    fontSize:
                      '0.75rem',
                    color:
                      '#64748b',
                    marginTop:
                      '4px'
                  }}
                >
                  Raise your first
                  doubt to unlock
                  your first badge.
                </p>

              </div>

            ) : (

              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '14px'
                }}
              >

                {unlockedAchievements.map(
                  (achievement) => (

                    <div
                      key={
                        achievement.id
                      }
                      className="card"
                      style={{
                        background:
                          'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
                        border:
                          '1px solid #fde68a',
                        color:
                          '#1e293b'
                      }}
                    >

                      <div
                        style={{
                          display:
                            'flex',
                          gap: '12px',
                          alignItems:
                            'flex-start'
                        }}
                      >

                        <div
                          style={{
                            width:
                              '48px',
                            height:
                              '48px',
                            borderRadius:
                              '14px',
                            background:
                              '#fef3c7',
                            display:
                              'flex',
                            alignItems:
                              'center',
                            justifyContent:
                              'center',
                            fontSize:
                              '1.6rem',
                            flexShrink:
                              0
                          }}
                        >
                          {
                            achievement.icon
                          }
                        </div>

                        <div
                          style={{
                            flex: 1,
                            minWidth: 0
                          }}
                        >

                          <div
                            style={{
                              display:
                                'flex',
                              justifyContent:
                                'space-between',
                              gap: '8px'
                            }}
                          >

                            <h3
                              style={{
                                fontSize:
                                  '0.95rem',
                                fontWeight:
                                  800,
                                color:
                                  '#1e293b',
                                lineHeight:
                                  1.3,
                                margin: 0
                              }}
                            >
                              {
                                achievement.title
                              }
                            </h3>

                            <CheckCircle
                              size={
                                18
                              }
                              color="#16a34a"
                              style={{
                                flexShrink:
                                  0
                              }}
                            />

                          </div>

                          <p
                            style={{
                              fontSize:
                                '0.76rem',
                              color:
                                '#475569',
                              marginTop:
                                '4px',
                              lineHeight:
                                1.45
                            }}
                          >
                            {
                              achievement.description
                            }
                          </p>

                          <div
                            style={{
                              marginTop:
                                '10px',
                              display:
                                'flex',
                              justifyContent:
                                'space-between',
                              alignItems:
                                'center',
                              gap: '8px'
                            }}
                          >

                            <span
                              style={{
                                fontSize:
                                  '0.7rem',
                                color:
                                  '#92400e',
                                fontWeight:
                                  700
                              }}
                            >
                              {
                                achievement.category
                              }
                            </span>

                            <span
                              style={{
                                fontSize:
                                  '0.7rem',
                                color:
                                  '#16a34a',
                                fontWeight:
                                  800,
                                whiteSpace:
                                  'nowrap'
                              }}
                            >
                              +
                              {
                                achievement.rewardXP
                              }{' '}
                              XP
                            </span>

                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}

              </div>
            )}
          </div>

          {/* LOCKED */}

          <div>

            <div
              style={{
                display:
                  'flex',
                alignItems:
                  'center',
                gap: '8px',
                marginBottom:
                  '14px'
              }}
            >

              <Lock
                size={19}
                color="#64748b"
              />

              <h2
                style={{
                  fontSize:
                    '1.05rem',
                  fontWeight:
                    800,
                  color:
                    '#1e293b',
                  margin: 0
                }}
              >
                Next Achievements
              </h2>

            </div>

            <div
              style={{
                display:
                  'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '14px'
              }}
            >

              {lockedAchievements.map(
                (achievement) => (

                  <div
                    key={
                      achievement.id
                    }
                    className="card"
                    style={{
                      background:
                        '#f8fafc',
                      border:
                        '1px solid #e2e8f0',
                      color:
                        '#1e293b'
                    }}
                  >

                    <div
                      style={{
                        display:
                          'flex',
                        gap: '12px',
                        alignItems:
                          'flex-start'
                      }}
                    >

                      <div
                        style={{
                          width:
                            '48px',
                          height:
                            '48px',
                          borderRadius:
                            '14px',
                          background:
                            '#e2e8f0',
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          fontSize:
                            '1.5rem',
                          filter:
                            'grayscale(1)',
                          opacity:
                            0.65,
                          flexShrink:
                            0
                        }}
                      >
                        {
                          achievement.icon
                        }
                      </div>

                      <div
                        style={{
                          flex: 1,
                          minWidth: 0
                        }}
                      >

                        <div
                          style={{
                            display:
                              'flex',
                            justifyContent:
                              'space-between',
                            gap: '8px'
                          }}
                        >

                          <h3
                            style={{
                              fontSize:
                                '0.95rem',
                              fontWeight:
                                800,
                              color:
                                '#1e293b',
                              lineHeight:
                                1.3,
                              margin: 0
                            }}
                          >
                            {
                              achievement.title
                            }
                          </h3>

                          <Lock
                            size={
                              16
                            }
                            color="#94a3b8"
                            style={{
                              flexShrink:
                                0
                            }}
                          />

                        </div>

                        <p
                          style={{
                            fontSize:
                              '0.76rem',
                            color:
                              '#475569',
                            marginTop:
                              '4px',
                            lineHeight:
                              1.45
                          }}
                        >
                          {
                            achievement.description
                          }
                        </p>

                        {/* PROGRESS */}

                        <div
                          style={{
                            marginTop:
                              '12px'
                          }}
                        >

                          <div
                            style={{
                              display:
                                'flex',
                              justifyContent:
                                'space-between',
                              fontSize:
                                '0.68rem',
                              color:
                                '#64748b',
                              marginBottom:
                                '5px'
                            }}
                          >

                            <span>
                              Progress
                            </span>

                            <span>
                              {
                                achievement.current
                              }{' '}
                              /{' '}
                              {
                                achievement.target
                              }
                            </span>

                          </div>

                          <div
                            style={{
                              height:
                                '7px',
                              background:
                                '#e2e8f0',
                              borderRadius:
                                '999px',
                              overflow:
                                'hidden'
                            }}
                          >

                            <div
                              style={{
                                width: `${achievement.percentage}%`,
                                height:
                                  '100%',
                                background:
                                  '#94a3b8',
                                borderRadius:
                                  '999px'
                              }}
                            />

                          </div>
                        </div>

                        <div
                          style={{
                            marginTop:
                              '9px',
                            display:
                              'flex',
                            justifyContent:
                              'space-between',
                            alignItems:
                              'center'
                          }}
                        >

                          <span
                            style={{
                              fontSize:
                                '0.68rem',
                              color:
                                '#64748b',
                              fontWeight:
                                700
                            }}
                          >
                            {
                              achievement.percentage
                            }
                            %
                          </span>

                          <span
                            style={{
                              fontSize:
                                '0.7rem',
                              color:
                                '#6366f1',
                              fontWeight:
                                800
                            }}
                          >
                            +
                            {
                              achievement.rewardXP
                            }{' '}
                            XP
                          </span>

                        </div>

                      </div>
                    </div>
                  </div>
                )
              )}

            </div>
          </div>

        </div>
      )}

      {/* =====================================================
          TAB 3: NOTIFICATIONS
      ===================================================== */}

      {activeTab ===
        'notifications' && (

        <div>

          <div
            className="card"
            style={{
              marginBottom:
                '16px',
              display:
                'flex',
              alignItems:
                'center',
              justifyContent:
                'space-between',
              gap: '12px',
              flexWrap:
                'wrap',
              color:
                '#1e293b'
            }}
          >

            <div
              style={{
                display:
                  'flex',
                alignItems:
                  'center',
                gap: '10px'
              }}
            >

              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius:
                    '12px',
                  background:
                    'rgba(37, 99, 235, 0.1)',
                  color:
                    'var(--primary)',
                  display:
                    'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center'
                }}
              >
                <Bell
                  size={20}
                />
              </div>

              <div>

                <h2
                  style={{
                    fontSize:
                      '1.05rem',
                    fontWeight:
                      800,
                    color:
                      '#1e293b',
                    margin: 0
                  }}
                >
                  Your Notifications
                </h2>

                <p
                  style={{
                    fontSize:
                      '0.75rem',
                    color:
                      '#64748b',
                    marginTop:
                      '2px'
                  }}
                >
                  Updates about doubts,
                  rewards and Peer-Earn
                  activity.
                </p>

              </div>

            </div>

            {unreadNotificationCount >
              0 && (

              <div
                style={{
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap: '5px',
                  fontSize:
                    '0.75rem',
                  fontWeight:
                    700,
                  color:
                    'var(--primary)'
                }}
              >

                <CheckCheck
                  size={15}
                />

                {unreadNotificationCount}{' '}
                unread

              </div>
            )}

          </div>

          {sortedNotifications.length ===
          0 ? (

            <div
              className="empty-state"
              style={{
                color: '#1e293b'
              }}
            >

              <Bell
                size={44}
                color="#94a3b8"
                style={{
                  margin:
                    '0 auto 10px'
                }}
              />

              <h3
                style={{
                  marginBottom:
                    '5px',
                  color:
                    '#1e293b'
                }}
              >
                No notifications yet
              </h3>

              <p
                style={{
                  color:
                    '#64748b'
                }}
              >
                When a relevant doubt
                needs your help or you
                receive a Peer-Earn update,
                it will appear here.
              </p>

            </div>

          ) : (

            <div
              style={{
                display:
                  'flex',
                flexDirection:
                  'column',
                gap: '10px'
              }}
            >

              {sortedNotifications.map(
                (
                  notification,
                  index
                ) => {

                  const isRead =
                    notification?.read ===
                    true;

                  return (

                    <div
                      key={
                        notification?.id ||
                        notification?.notificationId ||
                        `${notification?.doubtId || 'notification'}-${index}`
                      }
                      className="card"
                      style={{
                        display:
                          'flex',
                        gap: '14px',
                        alignItems:
                          'flex-start',
                        background:
                          isRead
                            ? 'var(--surface, #ffffff)'
                            : 'rgba(37, 99, 235, 0.04)',
                        border:
                          isRead
                            ? undefined
                            : '1px solid rgba(37, 99, 235, 0.18)',
                        color:
                          '#1e293b'
                      }}
                    >

                      <div
                        style={{
                          flexShrink:
                            0,
                          width:
                            '40px',
                          height:
                            '40px',
                          borderRadius:
                            '12px',
                          background:
                            isRead
                              ? '#f1f5f9'
                              : 'rgba(37, 99, 235, 0.1)',
                          color:
                            isRead
                              ? '#64748b'
                              : 'var(--primary)',
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center'
                        }}
                      >
                        {getNotificationIcon(
                          notification
                        )}
                      </div>

                      <div
                        style={{
                          flex: 1,
                          minWidth: 0
                        }}
                      >

                        <div
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            justifyContent:
                              'space-between',
                            gap: '10px'
                          }}
                        >

                          <h3
                            style={{
                              fontSize:
                                '0.9rem',
                              fontWeight:
                                isRead
                                  ? 650
                                  : 800,
                              color:
                                '#1e293b',
                              margin: 0
                            }}
                          >
                            {getNotificationTitle(
                              notification
                            )}
                          </h3>

                          {!isRead && (

                            <span
                              style={{
                                flexShrink:
                                  0,
                                width:
                                  '8px',
                                height:
                                  '8px',
                                borderRadius:
                                  '50%',
                                background:
                                  'var(--primary)'
                              }}
                            />

                          )}

                        </div>

                        <p
                          style={{
                            marginTop:
                              '5px',
                            fontSize:
                              '0.82rem',
                            lineHeight:
                              1.5,
                            color:
                              '#475569'
                          }}
                        >
                          {getNotificationMessage(
                            notification
                          )}
                        </p>

                        <div
                          style={{
                            marginTop:
                              '7px',
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: '6px',
                            fontSize:
                              '0.7rem',
                            color:
                              '#64748b'
                          }}
                        >

                          <Clock
                            size={12}
                          />

                          {formatNotificationTime(
                            notification
                          )}

                        </div>

                      </div>
                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>
      )}

      {/* =====================================================
          TAB 4: REDEMPTION STORE
      ===================================================== */}

      {activeTab ===
        'store' && (

        <div>

          {/* STORE INFORMATION */}

          <div
            style={{
              background:
                '#f0fdf4',
              border:
                '1px solid #bbf7d0',
              padding:
                '14px 18px',
              borderRadius:
                'var(--radius-md)',
              marginBottom:
                '20px',
              color:
                '#166534',
              fontSize:
                '0.9rem'
            }}
          >

            <strong>
              Campus Utility &amp;
              Rewards Ecosystem:
            </strong>{' '}

            In full production, Knowledge
            Points (KP) earned by helping
            peers can be redeemed at
            participating college cafeterias,
            bookstores, and academic
            facilities.

          </div>

          {/* SUCCESS / ERROR MESSAGE */}

          {redeemSuccess && (

            <div
              style={{
                background:
                  redeemSuccess.startsWith('❌')
                    ? '#fee2e2'
                    : '#dcfce7',

                border:
                  redeemSuccess.startsWith('❌')
                    ? '1px solid #fecaca'
                    : '1px solid #86efac',

                color:
                  redeemSuccess.startsWith('❌')
                    ? '#b91c1c'
                    : '#15803d',

                padding:
                  '12px 18px',

                borderRadius:
                  'var(--radius-md)',

                marginBottom:
                  '16px',

                fontWeight: 600,

                lineHeight: 1.5
              }}
            >
              {redeemSuccess}
            </div>
          )}

          {/* REWARDS */}

          <div className="store-grid">

            {rewards.map(
              (reward) => {

                const isRedeeming =
                  redeemingRewardId ===
                  reward.id;

                const currentBalance =
                  Number(
                    userProfile.kpBalance ??
                      0
                  );

                const insufficientBalance =
                  currentBalance <
                  reward.cost;

                return (

                  <div
                    key={
                      reward.id
                    }
                    className="store-card"
                    style={{
                      color:
                        '#1e293b'
                    }}
                  >

                    <div>

                      <div className="store-card-icon">
                        {
                          reward.icon
                        }
                      </div>

                      <span
                        style={{
                          fontSize:
                            '0.72rem',
                          textTransform:
                            'uppercase',
                          color:
                            '#64748b',
                          fontWeight:
                            700
                        }}
                      >
                        {
                          reward.category
                        }
                      </span>

                      <h3
                        style={{
                          fontSize:
                            '1.1rem',
                          fontWeight:
                            700,
                          margin:
                            '6px 0',
                          color:
                            '#1e293b'
                        }}
                      >
                        {
                          reward.title
                        }
                      </h3>

                      <p
                        style={{
                          fontSize:
                            '0.85rem',
                          color:
                            '#475569',
                          marginBottom:
                            '14px'
                        }}
                      >
                        {
                          reward.desc
                        }
                      </p>

                    </div>

                    <div>

                      {/* COST */}

                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          gap: '4px',
                          fontWeight:
                            800,
                          color:
                            'var(--kp-gold-dark)',
                          marginBottom:
                            '10px'
                        }}
                      >

                        <Coins
                          size={16}
                          color="#f59e0b"
                        />

                        <span>
                          {
                            reward.cost
                          }{' '}
                          KP
                        </span>

                      </div>

                      {/* REDEEM BUTTON */}

                      <button
                        onClick={() =>
                          handleRedeem(
                            reward
                          )
                        }
                        disabled={
                          Boolean(
                            redeemingRewardId
                          ) ||
                          insufficientBalance
                        }
                        className="btn btn-outline"
                        style={{
                          width:
                            '100%',
                          fontSize:
                            '0.85rem',
                          fontWeight:
                            700,

                          opacity:
                            (
                              Boolean(
                                redeemingRewardId
                              ) ||
                              insufficientBalance
                            )
                              ? 0.6
                              : 1,

                          cursor:
                            (
                              Boolean(
                                redeemingRewardId
                              ) ||
                              insufficientBalance
                            )
                              ? 'not-allowed'
                              : 'pointer'
                        }}
                      >

                        {isRedeeming
                          ? 'Redeeming...'
                          : insufficientBalance
                            ? 'Not Enough KP'
                            : 'Redeem Reward'}

                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;