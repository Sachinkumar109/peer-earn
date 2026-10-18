import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KPBadge from './KPBadge';

import {
  GraduationCap,
  PlusCircle,
  Star,
  User,
  LogOut,
  Bell,
  CheckCircle2,
  Clock,
  X,
  Trophy
} from 'lucide-react';

export const Navbar = () => {
  const {
    userProfile,
    logout,
    notifications = [],
    unreadNotificationCount = 0
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);

  const notificationRef = useRef(null);

  // ---------------------------------------------------------
  // Close notification dropdown when clicking outside
  // ---------------------------------------------------------
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, []);

  // ---------------------------------------------------------
  // Logout
  // ---------------------------------------------------------
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // ---------------------------------------------------------
  // Notification helpers
  // ---------------------------------------------------------
  const getNotificationIcon = (notification) => {
    if (
      notification?.type === 'doubt_waiting' ||
      notification?.type === 'doubt_reminder'
    ) {
      return <Clock size={16} />;
    }

    if (
      notification?.type === 'doubt_solved' ||
      notification?.type === 'reward'
    ) {
      return <CheckCircle2 size={16} />;
    }

    return <Bell size={16} />;
  };

  const getNotificationTitle = (notification) => {
    if (notification?.title) {
      return notification.title;
    }

    if (
      notification?.type === 'doubt_waiting' ||
      notification?.type === 'doubt_reminder'
    ) {
      return 'New Doubt Needs Help';
    }

    if (notification?.type === 'doubt_solved') {
      return 'Doubt Solved';
    }

    if (notification?.type === 'reward') {
      return 'You Earned KP';
    }

    return 'Peer-Earn Notification';
  };

  const getNotificationMessage = (notification) => {
    if (notification?.message) {
      return notification.message;
    }

    if (notification?.doubtText) {
      return notification.doubtText;
    }

    return 'You have a new Peer-Earn update.';
  };

  // ---------------------------------------------------------
  // Format notification time
  // ---------------------------------------------------------
  const formatNotificationTime = (notification) => {
    const rawTime =
      notification?.createdAt ||
      notification?.timestamp;

    if (!rawTime) {
      return '';
    }

    let date;

    if (rawTime?.toDate) {
      date = rawTime.toDate();
    } else if (rawTime instanceof Date) {
      date = rawTime;
    } else {
      date = new Date(rawTime);
    }

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const now = Date.now();
    const difference = now - date.getTime();

    const minutes = Math.floor(
      difference / (1000 * 60)
    );

    const hours = Math.floor(
      difference / (1000 * 60 * 60)
    );

    const days = Math.floor(
      difference / (1000 * 60 * 60 * 24)
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

  // ---------------------------------------------------------
  // Open notification
  // ---------------------------------------------------------
  const handleNotificationClick = (notification) => {
    setShowNotifications(false);

    if (notification?.doubtId) {
      navigate(
        `/doubt/${notification.doubtId}`
      );
      return;
    }

    navigate('/');
  };

  // ---------------------------------------------------------
  // Recent notifications
  // ---------------------------------------------------------
  const recentNotifications = Array.isArray(
    notifications
  )
    ? [...notifications]
        .sort((a, b) => {
          const getTime = (item) => {
            const value =
              item?.createdAt ||
              item?.timestamp;

            if (value?.toDate) {
              return value.toDate().getTime();
            }

            const parsed = new Date(
              value || 0
            ).getTime();

            return Number.isNaN(parsed)
              ? 0
              : parsed;
          };

          return getTime(b) - getTime(a);
        })
        .slice(0, 8)
    : [];

  return (
    <header className="navbar">
      <div className="nav-inner">

        {/* =================================================
            BRAND
        ================================================= */}
        <Link
          to="/"
          className="brand-logo"
        >
          <div className="brand-icon-wrapper">
            <GraduationCap size={22} />
          </div>

          <div>
            <span>Peer-Earn</span>

            <span
              style={{
                fontSize: '0.65rem',
                display: 'block',
                color: 'var(--primary)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              Learn &amp; Earn
            </span>
          </div>
        </Link>

        {/* =================================================
            NAVIGATION LINKS
        ================================================= */}
        <nav className="nav-links">

          {/* Explore Doubts */}
          <Link
            to="/"
            className={`nav-link ${
              location.pathname === '/'
                ? 'active'
                : ''
            }`}
          >
            Explore Doubts
          </Link>

          {/* 🏆 LEADERBOARD */}
          {userProfile && (
            <Link
              to="/leaderboard"
              className={`nav-link leaderboard-nav-link ${
                location.pathname === '/leaderboard'
                  ? 'active'
                  : ''
              }`}
              title="View Solver Leaderboard"
            >
              <Trophy size={16} />

              <span>
                Leaderboard
              </span>
            </Link>
          )}

          {/* Raise Doubt */}
          {userProfile && (
            <Link
              to="/raise"
              className={`btn btn-primary ${
                location.pathname === '/raise'
                  ? 'active'
                  : ''
              }`}
              style={{
                padding: '7px 14px',
                fontSize: '0.88rem'
              }}
            >
              <PlusCircle size={16} />

              <span>
                Raise Doubt
              </span>
            </Link>
          )}

        </nav>

        {/* =================================================
            USER STATS / PROFILE AREA
        ================================================= */}
        <div className="user-stats-bar">

          {userProfile ? (
            <>

              {/* -------------------------------------------
                  KP
              ------------------------------------------- */}
              <KPBadge
                amount={userProfile.kpBalance}
                animated={true}
              />

              {/* -------------------------------------------
                  REPUTATION
              ------------------------------------------- */}
              <div
                className="reputation-chip"
                title="Scholar Reputation Score"
              >
                <Star
                  size={14}
                  style={{
                    color: '#eab308',
                    fill: '#eab308'
                  }}
                />

                <span>
                  {userProfile.reputation ?? 0}
                </span>
              </div>

              {/* =================================================
                  NOTIFICATION BELL
              ================================================= */}
              <div
                ref={notificationRef}
                style={{
                  position: 'relative'
                }}
              >

                <button
                  type="button"
                  onClick={() =>
                    setShowNotifications(
                      (previous) =>
                        !previous
                    )
                  }
                  className="btn btn-outline"
                  style={{
                    width: '38px',
                    height: '38px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Bell size={17} />

                  {unreadNotificationCount >
                    0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        minWidth: '18px',
                        height: '18px',
                        padding: '0 4px',
                        borderRadius: '999px',
                        background:
                          '#ef4444',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border:
                          '2px solid var(--bg)'
                      }}
                    >
                      {unreadNotificationCount >
                      99
                        ? '99+'
                        : unreadNotificationCount}
                    </span>
                  )}
                </button>

                {/* =================================================
                    NOTIFICATION DROPDOWN
                ================================================= */}
                {showNotifications && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 12px)',
                      right: 0,
                      width: '360px',
                      maxWidth:
                        'calc(100vw - 30px)',
                      background:
                        'var(--surface, #ffffff)',
                      border:
                        '1px solid var(--border, #e2e8f0)',
                      borderRadius: '14px',
                      boxShadow:
                        '0 15px 40px rgba(15, 23, 42, 0.15)',
                      zIndex: 1000,
                      overflow: 'hidden'
                    }}
                  >

                    {/* Dropdown Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                          'space-between',
                        padding:
                          '14px 16px',
                        borderBottom:
                          '1px solid var(--border, #e2e8f0)'
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize:
                              '0.95rem'
                          }}
                        >
                          Notifications
                        </div>

                        <div
                          style={{
                            fontSize:
                              '0.72rem',
                            color:
                              'var(--text-muted)'
                          }}
                        >
                          Stay updated with
                          Peer-Earn
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setShowNotifications(
                            false
                          )
                        }
                        style={{
                          border: 'none',
                          background:
                            'transparent',
                          cursor: 'pointer',
                          color:
                            'var(--text-muted)',
                          padding: '4px'
                        }}
                        aria-label="Close notifications"
                      >
                        <X size={17} />
                      </button>
                    </div>

                    {/* Notification List */}
                    <div
                      style={{
                        maxHeight:
                          '380px',
                        overflowY: 'auto'
                      }}
                    >

                      {recentNotifications.length ===
                      0 ? (
                        <div
                          style={{
                            padding:
                              '34px 20px',
                            textAlign:
                              'center',
                            color:
                              'var(--text-muted)'
                          }}
                        >
                          <Bell
                            size={30}
                            style={{
                              opacity: 0.4,
                              marginBottom:
                                '8px'
                            }}
                          />

                          <div
                            style={{
                              fontWeight: 600,
                              marginBottom:
                                '4px'
                            }}
                          >
                            No notifications
                          </div>

                          <div
                            style={{
                              fontSize:
                                '0.78rem'
                            }}
                          >
                            You are all caught
                            up!
                          </div>
                        </div>
                      ) : (
                        recentNotifications.map(
                          (
                            notification,
                            index
                          ) => {
                            const isRead =
                              notification?.read ===
                              true;

                            return (
                              <button
                                key={
                                  notification?.id ||
                                  notification?.notificationId ||
                                  `${notification?.doubtId || 'notification'}-${index}`
                                }
                                type="button"
                                onClick={() =>
                                  handleNotificationClick(
                                    notification
                                  )
                                }
                                style={{
                                  width: '100%',
                                  display:
                                    'flex',
                                  gap: '11px',
                                  padding:
                                    '13px 15px',
                                  border: 'none',
                                  borderBottom:
                                    '1px solid var(--border, #e2e8f0)',
                                  background:
                                    isRead
                                      ? 'transparent'
                                      : 'rgba(37, 99, 235, 0.06)',
                                  cursor:
                                    'pointer',
                                  textAlign:
                                    'left'
                                }}
                              >

                                {/* Icon */}
                                <div
                                  style={{
                                    flexShrink: 0,
                                    width: '32px',
                                    height: '32px',
                                    borderRadius:
                                      '10px',
                                    display:
                                      'flex',
                                    alignItems:
                                      'center',
                                    justifyContent:
                                      'center',
                                    background:
                                      isRead
                                        ? 'var(--surface-muted, #f1f5f9)'
                                        : 'rgba(37, 99, 235, 0.12)',
                                    color:
                                      isRead
                                        ? 'var(--text-muted)'
                                        : 'var(--primary, #2563eb)'
                                  }}
                                >
                                  {getNotificationIcon(
                                    notification
                                  )}
                                </div>

                                {/* Content */}
                                <div
                                  style={{
                                    minWidth: 0,
                                    flex: 1
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
                                    <span
                                      style={{
                                        fontWeight:
                                          isRead
                                            ? 600
                                            : 700,
                                        fontSize:
                                          '0.82rem',
                                        color:
                                          'var(--text)'
                                      }}
                                    >
                                      {getNotificationTitle(
                                        notification
                                      )}
                                    </span>

                                    {!isRead && (
                                      <span
                                        style={{
                                          width:
                                            '7px',
                                          height:
                                            '7px',
                                          borderRadius:
                                            '50%',
                                          background:
                                            'var(--primary, #2563eb)',
                                          flexShrink: 0,
                                          marginTop:
                                            '5px'
                                        }}
                                      />
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      fontSize:
                                        '0.75rem',
                                      color:
                                        'var(--text-muted)',
                                      marginTop:
                                        '3px',
                                      lineHeight:
                                        1.4,
                                      display:
                                        '-webkit-box',
                                      WebkitLineClamp:
                                        2,
                                      WebkitBoxOrient:
                                        'vertical',
                                      overflow:
                                        'hidden'
                                    }}
                                  >
                                    {getNotificationMessage(
                                      notification
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      fontSize:
                                        '0.68rem',
                                      color:
                                        'var(--text-muted)',
                                      marginTop:
                                        '5px'
                                    }}
                                  >
                                    {formatNotificationTime(
                                      notification
                                    )}
                                  </div>
                                </div>

                              </button>
                            );
                          }
                        )
                      )}

                    </div>

                    {/* Footer */}
                    {recentNotifications.length >
                      0 && (
                      <div
                        style={{
                          padding:
                            '10px 14px',
                          borderTop:
                            '1px solid var(--border, #e2e8f0)',
                          textAlign:
                            'center'
                        }}
                      >
                        <Link
                          to="/profile"
                          onClick={() =>
                            setShowNotifications(
                              false
                            )
                          }
                          style={{
                            fontSize:
                              '0.75rem',
                            color:
                              'var(--primary)',
                            fontWeight: 600,
                            textDecoration:
                              'none'
                          }}
                        >
                          View your profile
                        </Link>
                      </div>
                    )}

                  </div>
                )}

              </div>

              {/* -------------------------------------------
                  PROFILE
              ------------------------------------------- */}
              <Link
                to="/profile"
                className="btn btn-outline"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.85rem'
                }}
                title="View Profile & Rewards"
              >
                <User size={15} />

                <span>
                  {userProfile.name?.split(
                    ' '
                  )[0]}
                </span>

                <span
                  style={{
                    fontSize: '0.75rem',
                    color:
                      'var(--text-muted)'
                  }}
                >
                  ({userProfile.classLevel})
                </span>
              </Link>

              {/* -------------------------------------------
                  LOGOUT
              ------------------------------------------- */}
              <button
                onClick={handleLogout}
                className="btn btn-outline"
                style={{
                  padding: '6px 10px'
                }}
                title="Sign Out"
              >
                <LogOut
                  size={16}
                  color="#64748b"
                />
              </button>

            </>
          ) : (

            /* =================================================
               LOGGED OUT AREA
            ================================================= */
            <div
              style={{
                display: 'flex',
                gap: '8px'
              }}
            >
              <Link
                to="/login"
                className="btn btn-outline"
              >
                Log In
              </Link>

              <Link
                to="/signup"
                className="btn btn-primary"
              >
                Sign Up
              </Link>
            </div>

          )}

        </div>
      </div>

      {/* =====================================================
          SMALL RESPONSIVE STYLE FOR LEADERBOARD LINK
      ===================================================== */}

      <style>{`
        .leaderboard-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        @media (max-width: 900px) {
          .leaderboard-nav-link span {
            display: none;
          }
        }
      `}</style>

    </header>
  );
};

export default Navbar;