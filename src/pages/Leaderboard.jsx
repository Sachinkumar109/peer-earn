// src/pages/Leaderboard.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Trophy,
  Crown,
  Zap,
  Brain,
  BookOpen,
  Sprout,
  ArrowLeft,
  RefreshCw,
  Star,
  Medal,
  Flame,
  Sparkles
} from "lucide-react";

import { getLeaderboard } from "../services/leaderboardService";
import { useAuth } from "../context/AuthContext";

// ============================================================
// AVATAR ICON
// ============================================================

const AvatarIcon = ({ level, size = 32 }) => {
  const numericLevel = Number(level) || 1;

  if (numericLevel >= 10) {
    return <Crown size={size} />;
  }

  if (numericLevel >= 9) {
    return <Trophy size={size} />;
  }

  if (numericLevel >= 7) {
    return <Zap size={size} />;
  }

  if (numericLevel >= 5) {
    return <Brain size={size} />;
  }

  if (numericLevel >= 3) {
    return <BookOpen size={size} />;
  }

  return <Sprout size={size} />;
};

// ============================================================
// RANK ICON
// ============================================================

const RankIcon = ({ rank }) => {
  if (rank === 1) {
    return <span className="leaderboard-medal">🥇</span>;
  }
  if (rank === 2) {
    return <span className="leaderboard-medal">🥈</span>;
  }

  if (rank === 3) {
    return <span className="leaderboard-medal">🥉</span>;
  }

  return (
    <span className="leaderboard-rank-number">
      #{rank}
    </span>
  );
};

// ============================================================
// AVATAR CLASS
// ============================================================

const getAvatarClass = (level) => {
  const numericLevel = Number(level) || 1;

  if (numericLevel >= 10) return "avatar-legend";
  if (numericLevel >= 9) return "avatar-master";
  if (numericLevel >= 7) return "avatar-expert";
  if (numericLevel >= 5) return "avatar-knowledge";
  if (numericLevel >= 3) return "avatar-learner";

  return "avatar-beginner";
};

// ============================================================
// LEADERBOARD
// ============================================================

function Leaderboard() {
  const { currentUser } = useAuth();

  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD LEADERBOARD
  // ==========================================================

  const loadLeaderboard = async () => {
    try {
      setError("");

      const data = await getLeaderboard(50);

      setLeaders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(
        "Leaderboard loading error:",
        err
      );

      setError(
        "Unable to load leaderboard right now."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadLeaderboard();
  }, []);

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
  };

  // ==========================================================
  // CURRENT USER
  // ==========================================================

  const currentUserId = currentUser?.uid;

  const currentUserData = leaders.find(
    (user) => user.id === currentUserId
  );

  // ==========================================================
  // TOP 3
  // ==========================================================

  const first = leaders[0];
  const second = leaders[1];
  const third = leaders[2];

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="background-orb orb-one"></div>
        <div className="background-orb orb-two"></div>

        <div className="leaderboard-loading">
          <div className="loading-trophy">
            <Trophy size={55} />
          </div>

          <div className="leaderboard-spinner"></div>

          <h2>
            Loading Leaderboard...
          </h2>

          <p>
            Finding the top Peer-Earn learners.
          </p>
        </div>

        <style>{`

          .leaderboard-page {
            min-height: 100vh;
            position: relative;
            overflow: hidden;
            background:
              radial-gradient(
                circle at top left,
                rgba(99, 102, 241, 0.35),
                transparent 35%
              ),
              radial-gradient(
                circle at bottom right,
                rgba(168, 85, 247, 0.30),
                transparent 35%
              ),
              linear-gradient(
                135deg,
                #070b1f,
                #111936,
                #171044
              );
            color: white;
          }

          .background-orb {
            position: fixed;
            border-radius: 50%;
            filter: blur(70px);
            opacity: 0.35;
            pointer-events: none;
          }

          .orb-one {
            width: 300px;
            height: 300px;
            background: #6366f1;
            top: -100px;
            left: -100px;
          }

          .orb-two {
            width: 350px;
            height: 350px;
            background: #a855f7;
            right: -130px;
            bottom: -100px;
          }

          .leaderboard-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 2;
            text-align: center;
            padding: 20px;
          }

          .loading-trophy {
            width: 90px;
            height: 90px;
            border-radius: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fbbf24;
            background: rgba(251, 191, 36, 0.12);
            border: 1px solid rgba(251, 191, 36, 0.3);
            animation: floatingTrophy 2s ease-in-out infinite;
            margin-bottom: 20px;
          }

          .leaderboard-spinner {
            width: 42px;
            height: 42px;
            border: 4px solid rgba(255,255,255,0.15);
            border-top-color: #a78bfa;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 20px;
          }

          .leaderboard-loading h2 {
            margin: 0;
            color: white;
            font-size: 25px;
          }

          .leaderboard-loading p {
            color: #cbd5e1;
            margin-top: 8px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes floatingTrophy {
            0%,100% {
              transform: translateY(0) rotate(-3deg);
            }
            50% {
              transform: translateY(-12px) rotate(3deg);
            }
          }

        `}</style>
      </div>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="leaderboard-page">

      {/* BACKGROUND EFFECTS */}

      <div className="background-grid"></div>

      <div className="background-orb orb-one"></div>
      <div className="background-orb orb-two"></div>
      <div className="background-orb orb-three"></div>

      <div className="floating-star star-one">✦</div>
      <div className="floating-star star-two">✦</div>
      <div className="floating-star star-three">✧</div>

      <div className="leaderboard-container">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <header className="leaderboard-header">

          <div>

            <Link
              to="/profile"
              className="leaderboard-back-button"
            >
              <ArrowLeft size={18} />
              Back to Profile
            </Link>

            <div className="leaderboard-title-row">

              <div className="leaderboard-title-icon">
                <Trophy size={38} />
              </div>

              <div>

                <div className="title-mini">
                  PEER-EARN • COMMUNITY
                </div>

                <h1>
                  Leaderboard
                </h1>

                <p>
                  Learn. Help. Earn. Grow together.
                </p>

              </div>

            </div>

          </div>

          <button
            type="button"
            className="leaderboard-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
          >

            <RefreshCw
              size={18}
              className={
                refreshing
                  ? "refresh-spinning"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>

        </header>

        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (
          <div className="leaderboard-error">
            ⚠️ {error}
          </div>
        )}

        {/* ================================================== */}
        {/* CURRENT USER */}
        {/* ================================================== */}

        {currentUserData && (
          <div className="my-rank-card">

            <div className="my-rank-glow"></div>

            <div className="my-rank-avatar">
              <AvatarIcon
                level={currentUserData.level}
                size={32}
              />
            </div>

            <div className="my-rank-main">

              <span className="my-rank-label">
                YOUR CURRENT POSITION
              </span>

              <strong>
                #{currentUserData.rank}
              </strong>

              <span className="my-rank-level">
                Level {currentUserData.level}
                {" • "}
                {currentUserData.levelName}
              </span>

            </div>

            <div className="my-stat">
              <span>
                XP
              </span>

              <strong>
                {currentUserData.xp.toLocaleString()}
              </strong>
            </div>

            <div className="my-stat">
              <span>
                SOLVED
              </span>

              <strong>
                {currentUserData.totalSolved}
              </strong>
            </div>

            <div className="my-stat">
              <span>
                REPUTATION
              </span>

              <strong>
                {currentUserData.reputation}
              </strong>
            </div>

          </div>
        )}

        {/* ================================================== */}
        {/* EMPTY */}
        {/* ================================================== */}

        {leaders.length === 0 ? (

          <div className="leaderboard-empty">

            <div className="empty-trophy">
              🏆
            </div>

            <h2>
              No leaderboard data yet
            </h2>

            <p>
              Start solving doubts and earning XP
              to appear here.
            </p>

          </div>

        ) : (

          <>

            {/* ============================================== */}
            {/* TOP 3 PODIUM */}
            {/* ============================================== */}

            {leaders.length >= 3 && (

              <section className="podium-section">

                <div className="section-heading">

                  <div>
                    <span>
                      HALL OF FAME
                    </span>

                    <h2>
                      🏆 Top Peer-Earners
                    </h2>
                  </div>

                  <Sparkles
                    size={24}
                    className="heading-sparkle"
                  />

                </div>

                <div className="podium">

                  {/* SECOND */}

                  <div className="podium-user second">

                    <div className="podium-light"></div>

                    <div
                      className={`podium-avatar ${
                        getAvatarClass(second.level)
                      }`}
                    >
                      <AvatarIcon
                        level={second.level}
                        size={40}
                      />
                    </div>

                    <div className="podium-rank">
                      🥈
                    </div>

                    <h3>
                      {second.name}
                    </h3>

                    <span>
                      Level {second.level}
                    </span>

                    <strong>
                      {second.xp.toLocaleString()} XP
                    </strong>

                    <small>
                      {second.totalSolved} doubts solved
                    </small>

                    <div className="podium-base silver">
                      #2
                    </div>

                  </div>

                  {/* FIRST */}

                  <div className="podium-user first">

                    <div className="winner-rays"></div>

                    <div className="crown-above">
                      👑
                    </div>

                    <div
                      className={`podium-avatar ${
                        getAvatarClass(first.level)
                      }`}
                    >
                      <AvatarIcon
                        level={first.level}
                        size={50}
                      />
                    </div>

                    <div className="podium-rank">
                      🥇
                    </div>

                    <h3>
                      {first.name}
                    </h3>

                    <span>
                      Level {first.level}
                    </span>

                    <strong>
                      {first.xp.toLocaleString()} XP
                    </strong>

                    <small>
                      {first.totalSolved} doubts solved
                    </small>

                    <div className="podium-base gold">
                      #1 CHAMPION
                    </div>

                  </div>

                  {/* THIRD */}

                  <div className="podium-user third">

                    <div className="podium-light"></div>

                    <div
                      className={`podium-avatar ${
                        getAvatarClass(third.level)
                      }`}
                    >
                      <AvatarIcon
                        level={third.level}
                        size={38}
                      />
                    </div>

                    <div className="podium-rank">
                      🥉
                    </div>

                    <h3>
                      {third.name}
                    </h3>

                    <span>
                      Level {third.level}
                    </span>

                    <strong>
                      {third.xp.toLocaleString()} XP
                    </strong>

                    <small>
                      {third.totalSolved} doubts solved
                    </small>

                    <div className="podium-base bronze">
                      #3
                    </div>

                  </div>

                </div>

              </section>

            )}

            {/* ============================================== */}
            {/* FULL LEADERBOARD */}
            {/* ============================================== */}

            <section className="leaderboard-card">

              <div className="leaderboard-card-header">

                <div>

                  <div className="card-title-icon">
                    <Medal size={22} />
                  </div>

                  <div>

                    <h2>
                      All Learners
                    </h2>

                    <p>
                      Ranked by XP, solved doubts and reputation
                    </p>

                  </div>

                </div>

                <span className="learner-count">
                  {leaders.length} learners
                </span>

              </div>

              <div className="leaderboard-list">

                {leaders.map((user, index) => {

                  const isCurrentUser =
                    user.id === currentUserId;

                  return (
                    <div
                      key={user.id}
                      className={`leaderboard-row ${
                        isCurrentUser
                          ? "current-user-row"
                          : ""
                      }`}
                      style={{
                        animationDelay: `${index * 0.055}s`
                      }}
                    >

                      {/* RANK */}

                      <div className="leaderboard-rank">
                        <RankIcon
                          rank={user.rank}
                        />
                      </div>

                      {/* AVATAR */}

                      <div
                        className={`leaderboard-avatar ${
                          getAvatarClass(user.level)
                        }`}
                      >
                        <AvatarIcon
                          level={user.level}
                          size={27}
                        />
                      </div>

                      {/* USER */}

                      <div className="leaderboard-user-info">

                        <div className="leaderboard-name">

                          {user.name}

                          {isCurrentUser && (
                            <span className="you-badge">
                              YOU
                            </span>
                          )}

                        </div>

                        <div className="leaderboard-level">
                          Level {user.level}
                          {" • "}
                          {user.levelName}
                        </div>

                      </div>

                      {/* SOLVED */}

                      <div className="leaderboard-stat">

                        <strong>
                          {user.totalSolved}
                        </strong>

                        <span>
                          Solved
                        </span>

                      </div>

                      {/* REPUTATION */}

                      <div className="leaderboard-stat reputation-stat">

                        <strong>
                          {user.reputation}
                        </strong>

                        <span>
                          Reputation
                        </span>

                      </div>

                      {/* XP */}

                      <div className="leaderboard-xp">

                        <strong>
                          {user.xp.toLocaleString()}
                        </strong>

                        <span>
                          XP
                        </span>

                      </div>

                    </div>
                  );
                })}

              </div>

            </section>

          </>
        )}

        {/* ================================================== */}
        {/* AVATAR EVOLUTION */}
        {/* ================================================== */}

        <section className="avatar-level-card">

          <div className="avatar-level-title">

            <div>

              <span className="section-label">
                EVOLUTION SYSTEM
              </span>

              <h2>
                👤 Level-Based Avatars
              </h2>

              <p>
                Your avatar automatically evolves as
                you level up.
              </p>

            </div>

            <Flame
              size={32}
              className="evolution-flame"
            />

          </div>

          <div className="avatar-level-list">

            <div className="avatar-evolution-item beginner-item">
              <span className="level-avatar">🌱</span>
              <strong>Level 1–2</strong>
              <small>Beginner</small>
            </div>

            <div className="avatar-evolution-item learner-item">
              <span className="level-avatar">📘</span>
              <strong>Level 3–4</strong>
              <small>Active Learner</small>
            </div>

            <div className="avatar-evolution-item knowledge-item">
              <span className="level-avatar">🧠</span>
              <strong>Level 5–6</strong>
              <small>Knowledge Seeker</small>
            </div>

            <div className="avatar-evolution-item expert-item">
              <span className="level-avatar">⚡</span>
              <strong>Level 7–8</strong>
              <small>Expert Helper</small>
            </div>

            <div className="avatar-evolution-item master-item">
              <span className="level-avatar">🏆</span>
              <strong>Level 9</strong>
              <small>Master Mentor</small>
            </div>

            <div className="avatar-evolution-item legend-item">
              <span className="level-avatar">👑</span>
              <strong>Level 10</strong>
              <small>Peer-Earn Legend</small>
            </div>

          </div>

        </section>

        {/* FOOTER */}

        <div className="leaderboard-footer">
          <span>
            ✨ Keep learning
          </span>

          <span>
            •
          </span>

          <span>
            🤝 Keep helping
          </span>

          <span>
            •
          </span>

          <span>
            🚀 Keep growing
          </span>
        </div>

      </div>

      {/* ==================================================== */}
      {/* STYLES */}
      {/* ==================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        /* ================================================== */
        /* PAGE */
        /* ================================================== */

        .leaderboard-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;

          background:
            radial-gradient(
              circle at 10% 10%,
              rgba(99, 102, 241, 0.32),
              transparent 28%
            ),
            radial-gradient(
              circle at 90% 15%,
              rgba(168, 85, 247, 0.27),
              transparent 30%
            ),
            radial-gradient(
              circle at 50% 100%,
              rgba(14, 165, 233, 0.20),
              transparent 35%
            ),
            linear-gradient(
              135deg,
              #050816 0%,
              #0b1230 45%,
              #160d36 100%
            );

          padding: 34px 20px 65px;
          color: white;
        }

        .leaderboard-container {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          position: relative;
          z-index: 5;
        }

        /* ================================================== */
        /* BACKGROUND */
        /* ================================================== */

        .background-grid {
          position: fixed;
          inset: 0;
          opacity: 0.12;
          pointer-events: none;

          background-image:
            linear-gradient(
              rgba(255,255,255,0.06) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,0.06) 1px,
              transparent 1px
            );

          background-size: 45px 45px;
          mask-image: linear-gradient(
            to bottom,
            black,
            transparent
          );
        }

        .background-orb {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(75px);
          opacity: 0.28;
          animation: orbFloat 9s ease-in-out infinite;
        }

        .orb-one {
          width: 280px;
          height: 280px;
          background: #6366f1;
          top: -90px;
          left: -90px;
        }

        .orb-two {
          width: 330px;
          height: 330px;
          background: #a855f7;
          right: -120px;
          bottom: -100px;
          animation-delay: 2s;
        }

        .orb-three {
          width: 220px;
          height: 220px;
          background: #06b6d4;
          left: 42%;
          top: 35%;
          animation-delay: 4s;
        }

        .floating-star {
          position: fixed;
          color: rgba(255,255,255,0.35);
          pointer-events: none;
          font-size: 20px;
          animation: starFloat 5s ease-in-out infinite;
        }

        .star-one {
          top: 17%;
          left: 7%;
        }

        .star-two {
          top: 52%;
          right: 8%;
          animation-delay: 1.5s;
        }

        .star-three {
          top: 75%;
          left: 15%;
          animation-delay: 3s;
        }

        @keyframes orbFloat {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }

          50% {
            transform: translate(25px, -30px) scale(1.08);
          }
        }

        @keyframes starFloat {
          0%,100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.2;
          }

          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.7;
          }
        }

        /* ================================================== */
        /* HEADER */
        /* ================================================== */

        .leaderboard-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 30px;
          animation: fadeDown 0.7s ease both;
        }

        .leaderboard-back-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          text-decoration: none;
          color: #cbd5e1;
          font-weight: 800;
          font-size: 14px;
          margin-bottom: 18px;
          transition: 0.2s ease;
        }

        .leaderboard-back-button:hover {
          color: #a78bfa;
          transform: translateX(-4px);
        }

        .leaderboard-title-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .leaderboard-title-icon {
          width: 68px;
          height: 68px;
          border-radius: 21px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #fbbf24;

          background:
            linear-gradient(
              145deg,
              rgba(251,191,36,0.20),
              rgba(245,158,11,0.06)
            );

          border: 1px solid rgba(251,191,36,0.35);

          box-shadow:
            0 0 35px rgba(251,191,36,0.18),
            inset 0 0 20px rgba(255,255,255,0.04);

          animation: trophyFloat 3s ease-in-out infinite;
        }

        .title-mini {
          color: #a78bfa;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
          margin-bottom: 4px;
        }

        .leaderboard-title-row h1 {
          margin: 0;
          font-size: clamp(1.9rem, 4vw, 2.65rem);
          line-height: 1.05;
          font-weight: 950;

          background:
            linear-gradient(
              90deg,
              #ffffff,
              #c4b5fd,
              #67e8f9
            );

          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .leaderboard-title-row p {
          margin: 7px 0 0;
          color: #aab5cf;
          font-size: 15px;
        }

        @keyframes trophyFloat {
          0%,100% {
            transform: translateY(0) rotate(-2deg);
          }

          50% {
            transform: translateY(-8px) rotate(2deg);
          }
        }

        @keyframes fadeDown {
          from {
            opacity: 0;
            transform: translateY(-18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ================================================== */
        /* REFRESH */
        /* ================================================== */

        .leaderboard-refresh {
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 14px;
          padding: 12px 18px;

          display: flex;
          align-items: center;
          gap: 8px;

          background:
            linear-gradient(
              135deg,
              #6366f1,
              #8b5cf6
            );

          color: white;
          font-weight: 900;
          cursor: pointer;

          box-shadow:
            0 10px 30px rgba(99,102,241,0.28);

          transition: 0.25s ease;
        }

        .leaderboard-refresh:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow:
            0 15px 35px rgba(139,92,246,0.4);
        }

        .leaderboard-refresh:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .refresh-spinning {
          animation: spin 0.8s linear infinite;
        }

        /* ================================================== */
        /* MY RANK */
        /* ================================================== */

        .my-rank-card {
          position: relative;
          overflow: hidden;

          display: grid;
          grid-template-columns:
            65px
            minmax(190px, 1.5fr)
            repeat(3, 1fr);

          align-items: center;
          gap: 15px;

          padding: 21px 24px;
          margin-bottom: 30px;

          border-radius: 22px;

          background:
            linear-gradient(
              135deg,
              rgba(99,102,241,0.22),
              rgba(139,92,246,0.12)
            );

          border: 1px solid rgba(167,139,250,0.30);

          box-shadow:
            0 18px 55px rgba(0,0,0,0.25),
            inset 0 1px 0 rgba(255,255,255,0.08);

          animation: cardEntrance 0.75s ease both;
        }

        .my-rank-glow {
          position: absolute;
          width: 170px;
          height: 170px;
          border-radius: 50%;
          background: #6366f1;
          filter: blur(80px);
          opacity: 0.2;
          right: 10%;
          top: -100px;
          pointer-events: none;
        }

        .my-rank-avatar {
          width: 56px;
          height: 56px;
          border-radius: 17px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #c4b5fd;

          background:
            rgba(99,102,241,0.22);

          border:
            1px solid rgba(167,139,250,0.35);

          box-shadow:
            0 0 25px rgba(99,102,241,0.2);
        }

        .my-rank-main {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .my-rank-label {
          color: #a5b4fc;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .my-rank-main strong {
          font-size: 27px;
          color: white;
        }

        .my-rank-level {
          color: #aab5cf;
          font-size: 12px;
          font-weight: 700;
        }

        .my-stat {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding-left: 18px;
          border-left: 1px solid rgba(255,255,255,0.10);
        }

        .my-stat span {
          color: #94a3b8;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .my-stat strong {
          color: white;
          font-size: 21px;
        }

        /* ================================================== */
        /* PODIUM SECTION */
        /* ================================================== */

        .podium-section {
          animation: cardEntrance 0.8s ease both;
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .section-heading span,
        .section-label {
          color: #a78bfa;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .section-heading h2 {
          margin: 3px 0 0;
          color: white;
          font-size: 22px;
        }

        .heading-sparkle {
          color: #fbbf24;
          animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes sparkle {
          0%,100% {
            transform: scale(1) rotate(0);
            opacity: 0.6;
          }

          50% {
            transform: scale(1.3) rotate(15deg);
            opacity: 1;
          }
        }

        .podium {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 18px;
          margin: 20px 0 38px;
        }

        .podium-user {
          width: 30%;
          max-width: 290px;
          min-height: 275px;

          position: relative;
          overflow: hidden;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;

          padding: 25px 15px 0;

          text-align: center;

          border-radius: 24px 24px 8px 8px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,0.09),
              rgba(255,255,255,0.035)
            );

          border: 1px solid rgba(255,255,255,0.12);

          box-shadow:
            0 20px 55px rgba(0,0,0,0.25);

          animation: podiumEntrance 0.8s ease both;
        }

        .podium-user.second {
          animation-delay: 0.12s;
          min-height: 295px;
        }

        .podium-user.first {
          animation-delay: 0.25s;
          min-height: 345px;

          border:
            2px solid rgba(251,191,36,0.55);

          box-shadow:
            0 0 45px rgba(245,158,11,0.17),
            0 25px 70px rgba(0,0,0,0.3);
        }

        .podium-user.third {
          animation-delay: 0.4s;
          min-height: 270px;
        }

        .podium-user:hover {
          transform: translateY(-8px);
          border-color: rgba(167,139,250,0.45);
        }

        .podium-light {
          position: absolute;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: #6366f1;
          filter: blur(65px);
          opacity: 0.15;
          top: -100px;
        }

        .winner-rays {
          position: absolute;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          border: 1px solid rgba(251,191,36,0.12);
          box-shadow:
            0 0 0 20px rgba(251,191,36,0.025),
            0 0 0 40px rgba(251,191,36,0.02);
          top: -90px;
          animation: winnerPulse 2.5s ease-in-out infinite;
        }

        .crown-above {
          font-size: 36px;
          position: relative;
          z-index: 2;
          animation: crownFloat 2s ease-in-out infinite;
        }

        .podium-avatar {
          width: 76px;
          height: 76px;
          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 9px;

          position: relative;
          z-index: 2;

          border: 3px solid rgba(255,255,255,0.2);

          box-shadow:
            0 0 25px currentColor;

          animation: avatarPulse 2.5s ease-in-out infinite;
        }

        .podium-user.first .podium-avatar {
          width: 94px;
          height: 94px;
        }

        .podium-rank {
          font-size: 28px;
          position: relative;
          z-index: 2;
        }

        .podium-user h3 {
          margin: 4px 0;
          font-size: 17px;
          font-weight: 950;
          color: white;
          position: relative;
          z-index: 2;
          word-break: break-word;
        }

        .podium-user span {
          color: #aab5cf;
          font-size: 12px;
          font-weight: 800;
          position: relative;
          z-index: 2;
        }

        .podium-user strong {
          color: #c4b5fd;
          font-size: 17px;
          margin-top: 7px;
          position: relative;
          z-index: 2;
        }

        .podium-user small {
          color: #94a3b8;
          margin-top: 4px;
          position: relative;
          z-index: 2;
        }

        .podium-base {
          width: 100%;
          margin-top: 16px;
          padding: 12px;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 1px;
          position: relative;
          z-index: 2;
        }

        .podium-base.gold {
          color: #451a03;
          background:
            linear-gradient(
              90deg,
              #f59e0b,
              #fbbf24,
              #fde68a
            );
        }

        .podium-base.silver {
          color: #1e293b;
          background:
            linear-gradient(
              90deg,
              #94a3b8,
              #e2e8f0,
              #cbd5e1
            );
        }

        .podium-base.bronze {
          color: #431407;
          background:
            linear-gradient(
              90deg,
              #b45309,
              #d97706,
              #f59e0b
            );
        }

        @keyframes podiumEntrance {
          from {
            opacity: 0;
            transform: translateY(45px) scale(0.92);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes crownFloat {
          0%,100% {
            transform: translateY(0) rotate(-5deg);
          }

          50% {
            transform: translateY(-9px) rotate(5deg);
          }
        }

        @keyframes winnerPulse {
          0%,100% {
            transform: scale(0.85);
            opacity: 0.35;
          }

          50% {
            transform: scale(1.08);
            opacity: 0.8;
          }
        }

        @keyframes avatarPulse {
          0%,100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.04);
          }
        }

        /* ================================================== */
        /* AVATAR COLORS */
        /* ================================================== */

        .avatar-beginner {
          background:
            linear-gradient(
              145deg,
              #064e3b,
              #16a34a
            );
          color: #bbf7d0;
        }

        .avatar-learner {
          background:
            linear-gradient(
              145deg,
              #1e3a8a,
              #2563eb
            );
          color: #bfdbfe;
        }

        .avatar-knowledge {
          background:
            linear-gradient(
              145deg,
              #4c1d95,
              #7c3aed
            );
          color: #ddd6fe;
        }

        .avatar-expert {
          background:
            linear-gradient(
              145deg,
              #78350f,
              #d97706
            );
          color: #fef3c7;
        }

        .avatar-master {
          background:
            linear-gradient(
              145deg,
              #7f1d1d,
              #dc2626
            );
          color: #fee2e2;
        }

        .avatar-legend {
          background:
            linear-gradient(
              145deg,
              #831843,
              #db2777
            );
          color: #fce7f3;
        }

        /* ================================================== */
        /* LEADERBOARD CARD */
        /* ================================================== */

        .leaderboard-card {
          background:
            rgba(8,15,38,0.88);

          backdrop-filter: blur(20px);

          border:
            1px solid rgba(255,255,255,0.10);

          border-radius: 24px;

          overflow: hidden;

          box-shadow:
            0 25px 70px rgba(0,0,0,0.28);

          animation: cardEntrance 0.9s ease both;
        }

        .leaderboard-card-header {
          padding: 23px 25px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 15px;

          background:
            linear-gradient(
              90deg,
              rgba(99,102,241,0.12),
              rgba(139,92,246,0.05)
            );

          border-bottom:
            1px solid rgba(255,255,255,0.08);
        }

        .leaderboard-card-header > div {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .card-title-icon {
          width: 43px;
          height: 43px;
          border-radius: 13px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #c4b5fd;

          background:
            rgba(99,102,241,0.18);

          border:
            1px solid rgba(167,139,250,0.25);
        }

        .leaderboard-card-header h2 {
          margin: 0;
          color: white;
          font-size: 20px;
        }

        .leaderboard-card-header p {
          margin: 5px 0 0;
          color: #94a3b8;
          font-size: 12px;
        }

        .learner-count {
          background:
            rgba(99,102,241,0.16);

          border:
            1px solid rgba(129,140,248,0.25);

          color: #c4b5fd;

          padding: 8px 13px;
          border-radius: 20px;

          font-size: 11px;
          font-weight: 900;
          white-space: nowrap;
        }

        /* ================================================== */
        /* ROW */
        /* ================================================== */

        .leaderboard-row {
          display: grid;

          grid-template-columns:
            65px
            52px
            minmax(180px, 1fr)
            90px
            110px
            100px;

          align-items: center;

          gap: 12px;

          padding: 15px 20px;

          border-bottom:
            1px solid rgba(255,255,255,0.055);

          transition:
            transform 0.25s ease,
            background 0.25s ease,
            box-shadow 0.25s ease;

          animation:
            rowSlideIn 0.55s ease both;
        }

        .leaderboard-row:hover {
          background:
            linear-gradient(
              90deg,
              rgba(99,102,241,0.12),
              rgba(139,92,246,0.04)
            );

          transform:
            translateX(7px);

          box-shadow:
            inset 4px 0 0 #6366f1;
        }

        .leaderboard-row:last-child {
          border-bottom: none;
        }

        .current-user-row {
          background:
            linear-gradient(
              90deg,
              rgba(99,102,241,0.19),
              rgba(139,92,246,0.08)
            );

          box-shadow:
            inset 4px 0 0 #8b5cf6;
        }

        @keyframes rowSlideIn {
          from {
            opacity: 0;
            transform: translateX(-25px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .leaderboard-rank {
          text-align: center;
        }

        .leaderboard-medal {
          font-size: 25px;
          display: inline-block;
          animation: medalBounce 2.5s ease-in-out infinite;
        }

        .leaderboard-rank-number {
          color: #94a3b8;
          font-weight: 950;
        }

        @keyframes medalBounce {
          0%,100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-4px);
          }
        }

        .leaderboard-avatar {
          width: 46px;
          height: 46px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            2px solid rgba(255,255,255,0.10);

          box-shadow:
            0 0 17px rgba(99,102,241,0.15);

          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }

        .leaderboard-row:hover .leaderboard-avatar {
          transform:
            scale(1.13)
            rotate(4deg);

          box-shadow:
            0 0 25px currentColor;
        }

        .leaderboard-user-info {
          min-width: 0;
        }

        .leaderboard-name {
          display: flex;
          align-items: center;
          gap: 7px;

          font-weight: 950;
          color: white;
          font-size: 15px;
        }

        .you-badge {
          background:
            linear-gradient(
              90deg,
              #6366f1,
              #8b5cf6
            );

          color: white !important;

          font-size: 8px !important;

          padding: 3px 6px;

          border-radius: 6px;

          font-weight: 950;

          box-shadow:
            0 0 12px rgba(99,102,241,0.4);
        }

        .leaderboard-level {
          margin-top: 4px;
          color: #8f9bb3;
          font-size: 11px;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .leaderboard-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: center;
        }

        .leaderboard-stat strong {
          color: #e2e8f0;
          font-size: 15px;
        }

        .leaderboard-stat span {
          color: #718096;
          font-size: 9px;
          font-weight: 800;
        }

        .leaderboard-xp {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .leaderboard-xp strong {
          color: #a78bfa;
          font-size: 17px;
          text-shadow:
            0 0 15px rgba(167,139,250,0.25);
        }

        .leaderboard-xp span {
          color: #718096;
          font-size: 9px;
          font-weight: 900;
        }

        /* ================================================== */
        /* AVATAR EVOLUTION */
        /* ================================================== */

        .avatar-level-card {
          margin-top: 30px;

          background:
            linear-gradient(
              135deg,
              rgba(15,23,42,0.92),
              rgba(30,27,75,0.85)
            );

          border:
            1px solid rgba(255,255,255,0.10);

          border-radius: 24px;

          padding: 25px;

          box-shadow:
            0 25px 65px rgba(0,0,0,0.22);

          animation:
            cardEntrance 1s ease both;
        }

        .avatar-level-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .avatar-level-title h2 {
          margin: 4px 0 0;
          color: white;
          font-size: 21px;
        }

        .avatar-level-title p {
          margin: 6px 0 20px;
          color: #94a3b8;
          font-size: 12px;
        }

        .evolution-flame {
          color: #fb923c;
          filter:
            drop-shadow(
              0 0 10px rgba(251,146,60,0.5)
            );

          animation:
            flamePulse 1.8s ease-in-out infinite;
        }

        .avatar-level-list {
          display: grid;
          grid-template-columns:
            repeat(6, 1fr);
          gap: 12px;
        }

        .avatar-evolution-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;

          padding: 16px 8px;

          border-radius: 17px;

          background:
            rgba(255,255,255,0.045);

          border:
            1px solid rgba(255,255,255,0.07);

          transition:
            transform 0.25s ease,
            background 0.25s ease,
            border-color 0.25s ease;
        }

        .avatar-evolution-item:hover {
          transform:
            translateY(-8px)
            scale(1.03);

          background:
            rgba(255,255,255,0.09);

          border-color:
            rgba(167,139,250,0.35);
        }

        .level-avatar {
          font-size: 32px;

          filter:
            drop-shadow(
              0 0 10px rgba(255,255,255,0.12)
            );

          transition:
            transform 0.3s ease;
        }

        .avatar-evolution-item:hover .level-avatar {
          transform:
            scale(1.25)
            rotate(5deg);
        }

        .avatar-level-list strong {
          color: #e2e8f0;
          font-size: 11px;
        }

        .avatar-level-list small {
          color: #7f8ba3;
          font-size: 9px;
        }

        .beginner-item:hover {
          border-color: #22c55e;
        }

        .learner-item:hover {
          border-color: #3b82f6;
        }

        .knowledge-item:hover {
          border-color: #8b5cf6;
        }

        .expert-item:hover {
          border-color: #f59e0b;
        }

        .master-item:hover {
          border-color: #ef4444;
        }

        .legend-item:hover {
          border-color: #ec4899;
        }

        @keyframes flamePulse {
          0%,100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.18) rotate(4deg);
          }
        }

        /* ================================================== */
        /* ERROR */
        /* ================================================== */

        .leaderboard-error {
          background:
            rgba(127,29,29,0.30);

          color: #fecaca;

          border:
            1px solid rgba(248,113,113,0.3);

          border-radius: 14px;

          padding: 13px 16px;

          margin-bottom: 20px;

          font-weight: 800;
        }

        /* ================================================== */
        /* EMPTY */
        /* ================================================== */

        .leaderboard-empty {
          background:
            rgba(15,23,42,0.80);

          border:
            1px solid rgba(255,255,255,0.10);

          border-radius: 24px;

          padding: 65px 20px;

          text-align: center;

          box-shadow:
            0 25px 60px rgba(0,0,0,0.25);
        }

        .empty-trophy {
          font-size: 65px;

          margin-bottom: 15px;

          animation:
            floatingTrophy 2s ease-in-out infinite;
        }

        .leaderboard-empty h2 {
          color: white;
          margin: 0 0 8px;
        }

        .leaderboard-empty p {
          color: #94a3b8;
          margin: 0;
        }

        /* ================================================== */
        /* FOOTER */
        /* ================================================== */

        .leaderboard-footer {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;

          margin-top: 28px;

          color: #718096;

          font-size: 11px;
          font-weight: 800;

          letter-spacing: 0.5px;
        }

        .leaderboard-footer span:first-child {
          color: #a78bfa;
        }

        .leaderboard-footer span:nth-child(4) {
          color: #22d3ee;
        }

        .leaderboard-footer span:nth-child(6) {
          color: #fbbf24;
        }

        /* ================================================== */
        /* CARD ANIMATION */
        /* ================================================== */

        @keyframes cardEntrance {
          from {
            opacity: 0;
            transform: translateY(25px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ================================================== */
        /* RESPONSIVE */
        /* ================================================== */

        @media (max-width: 900px) {

          .leaderboard-header {
            flex-direction: column;
          }

          .leaderboard-refresh {
            align-self: flex-start;
          }

          .my-rank-card {
            grid-template-columns:
              60px
              minmax(150px, 1fr)
              repeat(3, 1fr);
          }

          .leaderboard-row {
            grid-template-columns:
              45px
              45px
              minmax(130px, 1fr)
              70px
              80px;
          }

          .leaderboard-xp {
            display: none;
          }

          .avatar-level-list {
            grid-template-columns:
              repeat(3, 1fr);
          }

        }

        @media (max-width: 650px) {

          .leaderboard-page {
            padding: 22px 12px 45px;
          }

          .leaderboard-title-icon {
            width: 55px;
            height: 55px;
            border-radius: 17px;
          }

          .leaderboard-title-row h1 {
            font-size: 1.65rem;
          }

          .leaderboard-title-row p {
            font-size: 12px;
          }

          .my-rank-card {
            grid-template-columns:
              55px
              1fr
              1fr;

            padding: 17px;
          }

          .my-rank-main strong {
            font-size: 22px;
          }

          .my-stat {
            border-left: none;
            border-top: 1px solid rgba(255,255,255,0.08);
            padding:
              12px 0 0;
          }

          .podium {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .podium-user,
          .podium-user.first,
          .podium-user.second,
          .podium-user.third {
            width: 100%;
            max-width: none;
            min-height: auto;
            padding: 20px 20px 0;
          }

          .podium-user.first {
            order: -1;
          }

          .podium-user:hover {
            transform: translateY(-4px);
          }

          .leaderboard-card-header {
            padding: 18px;
            align-items: flex-start;
            flex-direction: column;
          }

          .leaderboard-card-header > div {
            align-items: flex-start;
          }

          .leaderboard-row {
            grid-template-columns:
              34px
              42px
              minmax(0, 1fr)
              58px;

            gap: 7px;

            padding: 13px 10px;
          }

          .reputation-stat {
            display: none;
          }

          .leaderboard-name {
            font-size: 12px;
          }

          .leaderboard-level {
            font-size: 9px;
          }

          .leaderboard-avatar {
            width: 39px;
            height: 39px;
          }

          .leaderboard-stat strong {
            font-size: 13px;
          }

          .leaderboard-stat span {
            font-size: 8px;
          }

          .leaderboard-xp {
            display: flex;
          }

          .leaderboard-xp strong {
            font-size: 12px;
          }

          .leaderboard-xp span {
            font-size: 8px;
          }

          .avatar-level-list {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .avatar-level-card {
            padding: 19px;
          }

          .section-heading h2 {
            font-size: 19px;
          }

        }

        @media (max-width: 400px) {

          .leaderboard-title-row {
            gap: 10px;
          }

          .leaderboard-title-icon {
            width: 48px;
            height: 48px;
          }

          .leaderboard-title-row h1 {
            font-size: 1.4rem;
          }

          .my-rank-card {
            grid-template-columns:
              50px
              1fr;
          }

          .my-stat {
            grid-column: span 1;
          }

        }

        /* ================================================== */
        /* REDUCE MOTION */
        /* ================================================== */

        @media (prefers-reduced-motion: reduce) {

          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }

        }

      `}</style>

    </div>
  );
}

export default Leaderboard;