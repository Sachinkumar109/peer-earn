import React, {
  useState,
  useEffect,
  useRef
} from "react";

import {
  useParams,
  useNavigate,
  Link
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {
  subscribeToDoubt,
  subscribeToMessages,
  sendMessage,
  resolveDoubt,
  claimDoubt
} from "../services/doubtService";

import KPBadge from "../components/KPBadge";

import {
  Send,
  CheckCircle,
  ArrowLeft,
  Clock,
  Award,
  AlertCircle,
  Image as ImageIcon,
  Video,
  X
} from "lucide-react";

export const DoubtChat = () => {
  const { doubtId: routeDoubtId } = useParams();

  const navigate = useNavigate();

  const { userProfile } = useAuth();

  // =======================================================
  // SAFE DOUBT ID
  // =======================================================

  const doubtId =
    typeof routeDoubtId === "string"
      ? routeDoubtId.trim()
      : "";

  // =======================================================
  // STATE
  // =======================================================

  const [doubt, setDoubt] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [inputText, setInputText] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [resolving, setResolving] =
    useState(false);

  const [selectedRating, setSelectedRating] =
    useState(0);

  const [resolutionSuccess, setResolutionSuccess] =
    useState(null);

  const [error, setError] =
    useState("");

  // =======================================================
  // ATTACHMENT
  // =======================================================

  const [attachmentFile, setAttachmentFile] =
    useState(null);

  const [attachmentType, setAttachmentType] =
    useState(null);

  const [attachmentPreviewUrl, setAttachmentPreviewUrl] =
    useState(null);

  // =======================================================
  // REFS
  // =======================================================

  const messagesEndRef =
    useRef(null);

  const imageInputRef =
    useRef(null);

  const videoInputRef =
    useRef(null);

  // =======================================================
  // INVALID ID CHECK
  // =======================================================

  useEffect(() => {
    if (!doubtId) {
      setError(
        "Invalid doubt link. No doubt ID was found."
      );
    }
  }, [doubtId]);

  // =======================================================
  // SUBSCRIBE TO DOUBT
  // =======================================================

  useEffect(() => {
    if (!doubtId) {
      return;
    }

    const unsubscribe =
      subscribeToDoubt(
        doubtId,
        (data) => {
          setDoubt(data);
        }
      );

    return () => {
      if (
        typeof unsubscribe ===
        "function"
      ) {
        unsubscribe();
      }
    };
  }, [doubtId]);

  // =======================================================
  // SUBSCRIBE TO MESSAGES
  // =======================================================

  useEffect(() => {
    if (!doubtId) {
      return;
    }

    const unsubscribe =
      subscribeToMessages(
        doubtId,
        (msgs) => {
          setMessages(
            Array.isArray(msgs)
              ? msgs
              : []
          );
        }
      );

    return () => {
      if (
        typeof unsubscribe ===
        "function"
      ) {
        unsubscribe();
      }
    };
  }, [doubtId]);

  // =======================================================
  // AUTO SCROLL
  // =======================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

  // =======================================================
  // CLEANUP PREVIEW
  // =======================================================

  useEffect(() => {
    return () => {
      if (attachmentPreviewUrl) {
        URL.revokeObjectURL(
          attachmentPreviewUrl
        );
      }
    };
  }, [attachmentPreviewUrl]);

  // =======================================================
  // BLOCK PASTE MESSAGE
  // =======================================================

  const showPasteBlockedMessage = () => {
    setError(
      "Pasting is disabled. Please type your answer yourself."
    );

    // Automatically remove the message after 3 seconds.
    setTimeout(() => {
      setError((currentError) => {
        if (
          currentError ===
          "Pasting is disabled. Please type your answer yourself."
        ) {
          return "";
        }

        return currentError;
      });
    }, 3000);10   };

  // =======================================================
  // BLOCK PASTE
  // =======================================================

  const handleInputPaste = (event) => {
    event.preventDefault();

    event.stopPropagation();

    showPasteBlockedMessage();
  };

  // =======================================================
  // BLOCK CTRL+V / CMD+V / INSERT PASTE
  // =======================================================

  const handleInputKeyDown = (event) => {
    const key =
      event.key?.toLowerCase();

    const isPasteShortcut =
      (
        (event.ctrlKey || event.metaKey) &&
        key === "v"
      ) ||
      (
        event.shiftKey &&
        key === "insert"
      ) ||
      (
        event.ctrlKey &&
        key === "insert"
      );

    if (isPasteShortcut) {
      event.preventDefault();

      event.stopPropagation();

      showPasteBlockedMessage();

      return;
    }
  };

  // =======================================================
  // BLOCK RIGHT CLICK
  // =======================================================

  const handleInputContextMenu = (event) => {
    event.preventDefault();

    event.stopPropagation();

    showPasteBlockedMessage();
  };

  // =======================================================
  // LOADING
  // =======================================================

  if (!doubtId) {
    return (
      <div
        className="main-content"
        style={{
          textAlign: "center",
          padding: "60px 20px"
        }}
      >
        <AlertCircle
          size={40}
          style={{
            marginBottom: "10px"
          }}
        />

        <p>
          Invalid doubt ID.
        </p>

        <button
          className="btn btn-outline"
          onClick={() =>
            navigate("/")
          }
        >
          Back to Doubts
        </button>
      </div>
    );
  }

  if (!doubt) {
    return (
      <div
        className="main-content"
        style={{
          textAlign: "center",
          padding: "60px 20px"
        }}
      >
        <p
          style={{
            color:
              "var(--text-muted)"
          }}
        >
          Loading live doubt session...
        </p>
      </div>
    );
  }

  // =======================================================
  // BASIC DATA
  // =======================================================

  const isAsker =
    userProfile?.uid ===
    doubt.askerId;

  const isResolved =
    doubt.status ===
    "resolved";

  const originalPoints =
    Number(
      doubt.stakedPoints
    ) || 0;

  const remainingPoints =
    Number(
      doubt.remainingPoints ??
      originalPoints
    );

  // =======================================================
  // STAR DATA
  // =======================================================

  const rewardHistory =
    Array.isArray(
      doubt.rewardHistory
    )
      ? doubt.rewardHistory
      : [];

  const storedStars =
    Number(
      doubt.awardedStars
    ) || 0;

  const historyStars =
    rewardHistory.reduce(
      (total, item) => {
        return (
          total +
          (
            Number(
              item.stars
            ) || 0
          )
        );
      },
      0
    );

  const awardedStars =
    Math.min(
      5,
      Math.max(
        storedStars,
        historyStars
      )
    );

  const maxAvailableStars =
    Math.max(
      0,
      5 - awardedStars
    );

  // =======================================================
  // SOLVER
  // =======================================================

  const candidateSolverId =
    doubt.currentSolverId ||
    doubt.solverId ||
    null;

  const candidateSolverName =
    doubt.currentSolverName ||
    doubt.solverName ||
    null;

  // =======================================================
  // ATTACHMENT SELECT
  // =======================================================

  const handleAttachmentSelect = (
    event,
    expectedType
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const isImage =
      file.type.startsWith(
        "image/"
      );

    const isVideo =
      file.type.startsWith(
        "video/"
      );

    if (
      expectedType === "image" &&
      !isImage
    ) {
      setError(
        "Please select an image/photo file."
      );

      event.target.value = "";

      return;
    }

    if (
      expectedType === "video" &&
      !isVideo
    ) {
      setError(
        "Please select a video file."
      );

      event.target.value = "";

      return;
    }

    const maxSize =
      expectedType === "image"
        ? 5 * 1024 * 1024
        : 30 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        expectedType === "image"
          ? "Photo must be 5 MB or less."
          : "Video must be 30 MB or less."
      );

      event.target.value = "";

      return;
    }

    if (attachmentPreviewUrl) {
      URL.revokeObjectURL(
        attachmentPreviewUrl
      );
    }

    setAttachmentFile(file);

    setAttachmentType(
      expectedType
    );

    setAttachmentPreviewUrl(
      URL.createObjectURL(file)
    );

    setError("");

    event.target.value = "";
  };

  // =======================================================
  // CLEAR ATTACHMENT
  // =======================================================

  const clearAttachment = () => {
    if (attachmentPreviewUrl) {
      URL.revokeObjectURL(
        attachmentPreviewUrl
      );
    }

    setAttachmentFile(null);

    setAttachmentType(null);

    setAttachmentPreviewUrl(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  // =======================================================
  // SEND MESSAGE
  // =======================================================

  const handleSendMessage =
    async (e) => {
      e.preventDefault();

      if (!doubtId) {
        setError(
          "Invalid doubt ID."
        );
        return;
      }

      if (!userProfile?.uid) {
        setError(
          "Please login before sending a message."
        );
        return;
      }

      if (
        (
          !inputText.trim() &&
          !attachmentFile
        ) ||
        sending
      ) {
        return;
      }

      const textToSend =
        inputText.trim();

      setSending(true);

      setError("");

      try {
        // -------------------------------------------------
        // CLAIM DOUBT
        // -------------------------------------------------

        if (
          !isAsker &&
          doubt.status === "open"
        ) {
          await claimDoubt(
            doubtId,
            userProfile
          );
        }

        // -------------------------------------------------
        // SEND MESSAGE
        // -------------------------------------------------

        await sendMessage({
          doubtId,

          senderId:
            userProfile.uid,

          senderName:
            userProfile.name ||
            "Peer Scholar",

          text:
            textToSend,

          photoFile:
            attachmentType ===
            "image"
              ? attachmentFile
              : null,

          videoFile:
            attachmentType ===
            "video"
              ? attachmentFile
              : null
        });

        // Clear after successful send

        setInputText("");

        clearAttachment();

      } catch (err) {
        console.error(
          "Send error:",
          err
        );

        setError(
          err.message ||
          "Could not send message. Please retry."
        );
      } finally {
        setSending(false);
      }
    };

  // =======================================================
  // RATE SOLUTION
  // =======================================================

  const handleResolve =
    async () => {
      if (!isAsker) {
        return;
      }

      if (!candidateSolverId) {
        alert(
          "No solver is currently assigned to this doubt."
        );
        return;
      }

      if (!selectedRating) {
        alert(
          "Please select a star rating first."
        );
        return;
      }

      if (
        selectedRating >
        maxAvailableStars
      ) {
        alert(
          `Only ${maxAvailableStars} star${
            maxAvailableStars > 1
              ? "s"
              : ""
          } available.`
        );

        return;
      }

      const alreadyRewardedPoints =
        Number(
          doubt.rewardedPoints
        ) || 0;

      const newAwardedStars =
        awardedStars +
        selectedRating;

      const targetRewardedPoints =
        newAwardedStars >= 5
          ? originalPoints
          : Math.floor(
              (
                originalPoints *
                newAwardedStars
              ) / 5
            );

      const rewardPreview =
        Math.min(
          Math.max(
            0,
            targetRewardedPoints -
              alreadyRewardedPoints
          ),
          remainingPoints
        );

      const remainingAfter =
        Math.max(
          0,
          remainingPoints -
            rewardPreview
        );

      const remainingStarsAfter =
        Math.max(
          0,
          5 -
            newAwardedStars
        );

      const isFinalReward =
        remainingAfter === 0 ||
        remainingStarsAfter === 0;

      const confirmed =
        window.confirm(
          `Give ${selectedRating} star${
            selectedRating > 1
              ? "s"
              : ""
          } to ${
            candidateSolverName ||
            "the solver"
          }?\n\n` +
          `Solver receives: ${rewardPreview} KP\n` +
          `Remaining bounty: ${remainingAfter} KP\n` +
          `Remaining stars: ${remainingStarsAfter}\n\n` +
          (
            isFinalReward
              ? "This will fully resolve the doubt."
              : "The doubt will remain open for another solver."
          )
        );

      if (!confirmed) {
        return;
      }

      setResolving(true);

      setError("");

      try {
        // IMPORTANT:
        // resolveDoubt expects cumulative stars.
        // Example:
        // Existing = 2
        // User selects = 2
        // Send = 4

        const targetStars =
          Math.min(
            5,
            awardedStars +
              selectedRating
          );

        const result =
          await resolveDoubt(
            doubtId,
            candidateSolverId,
            targetStars
          );

        setResolutionSuccess(
          result
        );

        setSelectedRating(0);

      } catch (err) {
        console.error(
          "Rating error:",
          err
        );

        setError(
          err.message ||
          "Failed to submit rating."
        );
      } finally {
        setResolving(false);
      }
    };

  // =======================================================
  // FORMAT MESSAGE TIME
  // =======================================================

  const formatMessageTime =
    (dateVal) => {
      if (!dateVal) {
        return "";
      }

      const d =
        typeof dateVal.toDate ===
        "function"
          ? dateVal.toDate()
          : new Date(dateVal);

      if (
        Number.isNaN(
          d.getTime()
        )
      ) {
        return "";
      }

      return d.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );
    };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div
      className="main-content"
      style={{
        maxWidth: "900px"
      }}
    >

      {/* ===================================================
          HEADER
      =================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: "14px",
          flexWrap: "wrap",
          gap: "10px"
        }}
      >

        <button
          onClick={() =>
            navigate("/")
          }
          className="btn btn-outline"
          style={{
            padding:
              "6px 12px",
            fontSize:
              "0.85rem"
          }}
        >
          <ArrowLeft
            size={16}
          />

          Back to Doubt Feed
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap"
          }}
        >

          <KPBadge
            amount={
              remainingPoints
            }
            size="sm"
          />

          <span
            style={{
              fontSize:
                "0.85rem",
              color:
                "var(--text-muted)"
            }}
          >
            Remaining Bounty
          </span>

          <span
            style={{
              fontSize:
                "0.85rem",
              color:
                "var(--text-muted)"
            }}
          >
            Subject:{" "}
            <strong>
              {doubt.subject}
            </strong>{" "}
            ({doubt.classLevel})
          </span>

        </div>

      </div>

      {/* ===================================================
          DOUBT SUMMARY
      =================================================== */}

      <div
        className="card"
        style={{
          marginBottom:
            "16px",
          background:
            "#ffffff"
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "flex-start",
            gap: "14px",
            flexWrap: "wrap"
          }}
        >

          <div
            style={{
              flex: 1
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: "8px",
                marginBottom:
                  "8px",
                flexWrap:
                  "wrap"
              }}
            >

              <span className="tag-subject">
                {doubt.subject}
              </span>

              <span className="tag-class">
                Class:{" "}
                {doubt.classLevel}
              </span>

              {isResolved ? (
                <span
                  className="tag-status-resolved"
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: "4px"
                  }}
                >
                  <CheckCircle
                    size={12}
                  />
                  Resolved
                </span>
              ) : doubt.status ===
                "in_progress" ? (
                <span
                  className="tag-status-progress"
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: "4px"
                  }}
                >
                  <Clock
                    size={12}
                  />
                  In Progress
                </span>
              ) : (
                <span className="tag-status-open">
                  Open for Solution
                </span>
              )}

            </div>

            <h2
              style={{
                fontSize:
                  "1.25rem",
                fontWeight: 700,
                color:
                  "#1e293b",
                marginBottom:
                  "8px",
                lineHeight:
                  1.35
              }}
            >
              {doubt.text}
            </h2>

            {doubt.photoUrl && (
              <img
                src={
                  doubt.photoUrl
                }
                alt="Doubt attachment"
                style={{
                  maxWidth:
                    "280px",
                  maxHeight:
                    "300px",
                  objectFit:
                    "contain",
                  borderRadius:
                    "var(--radius-md)",
                  marginBottom:
                    "10px",
                  border:
                    "1px solid var(--border-color)",
                  display:
                    "block"
                }}
              />
            )}

            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: "12px",
                fontSize:
                  "0.85rem",
                color:
                  "var(--text-muted)",
                flexWrap:
                  "wrap"
              }}
            >

              <span>
                Asked by:{" "}
                <strong>
                  {doubt.askerName}
                </strong>
              </span>

              {candidateSolverName && (
                <span>
                  • Helping Solver:{" "}
                  <strong
                    style={{
                      color:
                        "var(--primary)"
                    }}
                  >
                    {
                      candidateSolverName
                    }
                  </strong>
                </span>
              )}

            </div>

            {/* STAR PROGRESS */}

            <div
              style={{
                marginTop:
                  "12px",
                display:
                  "flex",
                alignItems:
                  "center",
                gap: "10px",
                flexWrap:
                  "wrap"
              }}
            >

              <span
                style={{
                  fontSize:
                    "0.82rem",
                  fontWeight: 600
                }}
              >
                Reward Progress:
              </span>

              <span
                style={{
                  fontSize:
                    "0.9rem",
                  letterSpacing:
                    "2px"
                }}
              >
                {"★".repeat(
                  awardedStars
                )}

                {"☆".repeat(
                  5 -
                    awardedStars
                )}
              </span>

              <span
                style={{
                  fontSize:
                    "0.78rem",
                  color:
                    "var(--text-muted)"
                }}
              >
                {awardedStars}/5
                {" "}
                stars awarded
              </span>

            </div>

          </div>

          {/* =================================================
              RATING PANEL
          ================================================= */}

          {isAsker &&
            !isResolved &&
            candidateSolverId && (
              <div
                style={{
                  textAlign:
                    "right",
                  minWidth:
                    "280px",
                  padding:
                    "12px",
                  border:
                    "1px solid var(--border-color)",
                  borderRadius:
                    "12px",
                  background:
                    "#f8fafc"
                }}
              >

                <div
                  style={{
                    fontSize:
                      "0.8rem",
                    color:
                      "var(--text-muted)",
                    marginBottom:
                      "5px"
                  }}
                >
                  Remaining Bounty
                </div>

                <div
                  style={{
                    fontSize:
                      "1.05rem",
                    fontWeight: 700,
                    marginBottom:
                      "8px"
                  }}
                >
                  {remainingPoints} KP
                </div>

                <div
                  style={{
                    fontSize:
                      "0.82rem",
                    fontWeight: 600,
                    marginBottom:
                      "6px"
                  }}
                >
                  Rate this solution
                </div>

                <div
                  style={{
                    fontSize:
                      "0.72rem",
                    color:
                      "var(--text-muted)",
                    marginBottom:
                      "7px"
                  }}
                >
                  {maxAvailableStars}{" "}
                  star
                  {maxAvailableStars !==
                  1
                    ? "s"
                    : ""}{" "}
                  remaining
                </div>

                {/* AVAILABLE STARS */}

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "flex-end",
                    gap: "3px",
                    marginBottom:
                      "8px"
                  }}
                >

                  {Array.from(
                    {
                      length:
                        maxAvailableStars
                    },
                    (_, index) =>
                      index + 1
                  ).map(
                    (star) => {
                      const selected =
                        star <=
                        selectedRating;

                      return (
                        <button
                          key={
                            star
                          }
                          type="button"
                          onClick={() =>
                            setSelectedRating(
                              star
                            )
                          }
                          style={{
                            border:
                              "none",
                            background:
                              "transparent",
                            cursor:
                              "pointer",
                            fontSize:
                              "1.8rem",
                            padding:
                              "1px",
                            lineHeight:
                              1
                          }}
                        >
                          {selected
                            ? "★"
                            : "☆"}
                        </button>
                      );
                    }
                  )}

                </div>

                {/* REWARD PREVIEW */}

                {selectedRating >
                  0 && (
                  <div
                    style={{
                      fontSize:
                        "0.78rem",
                      color:
                        "var(--text-muted)",
                      marginBottom:
                        "8px"
                    }}
                  >

                    Selected:{" "}
                    <strong>
                      {selectedRating}★
                    </strong>

                    <br />

                    Solver receives:{" "}
                    <strong>
                      {(() => {
                        const previous =
                          Number(
                            doubt.rewardedPoints
                          ) || 0;

                        const target =
                          (
                            awardedStars +
                            selectedRating
                          ) >= 5
                            ? originalPoints
                            : Math.floor(
                                (
                                  originalPoints *
                                  (
                                    awardedStars +
                                    selectedRating
                                  )
                                ) /
                                5
                              );

                        return Math.min(
                          Math.max(
                            0,
                            target -
                              previous
                          ),
                          remainingPoints
                        );
                      })()}{" "}
                      KP
                    </strong>

                    <br />

                    After reward:{" "}
                    <strong>
                      {(() => {
                        const previous =
                          Number(
                            doubt.rewardedPoints
                          ) || 0;

                        const target =
                          (
                            awardedStars +
                            selectedRating
                          ) >= 5
                            ? originalPoints
                            : Math.floor(
                                (
                                  originalPoints *
                                  (
                                    awardedStars +
                                    selectedRating
                                  )
                                ) /
                                5
                              );

                        const reward =
                          Math.min(
                            Math.max(
                              0,
                              target -
                                previous
                            ),
                            remainingPoints
                          );

                        return Math.max(
                          0,
                          remainingPoints -
                            reward
                        );
                      })()}{" "}
                      KP
                    </strong>

                  </div>
                )}

                <button
                  onClick={
                    handleResolve
                  }
                  disabled={
                    resolving ||
                    !selectedRating
                  }
                  className="btn btn-success"
                  style={{
                    padding:
                      "9px 16px",
                    fontWeight: 700,
                    width:
                      "100%"
                  }}
                >
                  <CheckCircle
                    size={17}
                  />

                  <span>
                    {resolving
                      ? "Processing..."
                      : selectedRating
                        ? "Submit Rating"
                        : "Select Stars"}
                  </span>
                </button>

              </div>
            )}

        </div>

      </div>

      {/* ===================================================
          SUCCESS
      =================================================== */}

      {resolutionSuccess && (
        <div
          style={{
            background:
              "#ecfdf5",
            border:
              "1px solid #a7f3d0",
            color:
              "#065f46",
            padding:
              "12px 16px",
            borderRadius:
              "10px",
            marginBottom:
              "12px"
          }}
        >

          <strong>
            {resolutionSuccess.fullyResolved
              ? "Doubt Fully Resolved! 🎉"
              : "Rating Submitted Successfully!"}
          </strong>

          <div
            style={{
              fontSize:
                "0.85rem",
              marginTop:
                "4px"
            }}
          >
            Solver received{" "}
            <strong>
              {
                resolutionSuccess.rewardThisSolve ??
                0
              }{" "}
              KP
            </strong>.

            {resolutionSuccess.remainingPoints >
              0 && (
              <>
                {" "}
                <strong>
                  {
                    resolutionSuccess.remainingPoints
                  }{" "}
                  KP
                </strong>{" "}
                remains for the next solver.
              </>
            )}
          </div>

        </div>
      )}

      {/* ===================================================
          RESOLVED
      =================================================== */}

      {isResolved && (
        <div
          className="resolved-banner"
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "10px"
            }}
          >
            <Award
              size={24}
              color="#059669"
            />

            <div>
              <strong>
                Doubt Successfully
                Resolved!
              </strong>

              <div
                style={{
                  fontSize:
                    "0.85rem"
                }}
              >
                The complete bounty
                has been distributed
                to the successful
                solver(s).
              </div>
            </div>
          </div>

          <Link
            to="/"
            className="btn btn-outline"
            style={{
              background:
                "white",
              fontSize:
                "0.85rem",
              padding:
                "6px 12px"
            }}
          >
            Browse More Doubts
          </Link>
        </div>
      )}

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div
          style={{
            background:
              "#fee2e2",
            color:
              "#b91c1c",
            padding:
              "10px 14px",
            borderRadius:
              "var(--radius-sm)",
            marginBottom:
              "12px",
            display:
              "flex",
            alignItems:
              "center",
            gap: "8px"
          }}
        >
          <AlertCircle
            size={16}
          />

          <span>
            {error}
          </span>
        </div>
      )}

      {/* ===================================================
          CHAT
      =================================================== */}

      <div
        className="chat-container"
      >

        <div
          className="chat-header"
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "8px"
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius:
                  "50%",
                background:
                  isResolved
                    ? "#10b981"
                    : "#22c55e",
                display:
                  "inline-block"
              }}
            />

            <span
              style={{
                fontWeight:
                  700,
                fontSize:
                  "0.95rem"
              }}
            >
              {isResolved
                ? "Resolution Transcript"
                : "Live Peer Solving Thread"}
            </span>
          </div>

          <div
            style={{
              fontSize:
                "0.8rem",
              color:
                "var(--text-muted)"
            }}
          >
            {messages.length}{" "}
            {messages.length ===
            1
              ? "message"
              : "messages"}
          </div>
        </div>

        {/* =================================================
            MESSAGES
        ================================================= */}

        <div
          className="chat-messages"
        >

          {messages.length ===
          0 ? (
            <div
              style={{
                textAlign:
                  "center",
                margin: "auto",
                color:
                  "var(--text-muted)"
              }}
            >
              <p
                style={{
                  fontWeight:
                    600,
                  marginBottom:
                    "4px"
                }}
              >
                No messages yet.
              </p>

              <p
                style={{
                  fontSize:
                    "0.85rem"
                }}
              >
                {isAsker
                  ? "Waiting for a classmate or senior peer to join the discussion..."
                  : "Type an explanation or attach a photo/video to claim the remaining KP bounty!"}
              </p>
            </div>
          ) : (
            messages.map(
              (m) => {
                const isMine =
                  m.senderId ===
                  userProfile?.uid;

                const isSenderAsker =
                  m.senderId ===
                  doubt.askerId;

                const imageUrl =
                  m.photoUrl ||
                  (
                    m.attachmentType ===
                      "image"
                      ? m.attachmentUrl
                      : null
                  );

                const videoUrl =
                  m.videoUrl ||
                  (
                    m.attachmentType ===
                      "video"
                      ? m.attachmentUrl
                      : null
                  );

                return (
                  <div
                    key={
                      m.id
                    }
                    className={`message-item ${
                      isMine
                        ? "sent"
                        : "received"
                    }`}
                  >

                    <div
                      className="message-sender"
                      style={{
                        textAlign:
                          isMine
                            ? "right"
                            : "left"
                      }}
                    >
                      {m.senderName}{" "}
                      {isSenderAsker
                        ? "(Asker)"
                        : "(Helper)"}
                    </div>

                    <div
                      className="message-bubble"
                    >

                      {m.text && (
                        <div
                          style={{
                            whiteSpace:
                              "pre-wrap",
                            wordBreak:
                              "break-word",
                            marginBottom:
                              imageUrl ||
                              videoUrl
                                ? "10px"
                                : "0"
                          }}
                        >
                          {m.text}
                        </div>
                      )}

                      {imageUrl && (
                        <div
                          style={{
                            marginTop:
                              "6px"
                          }}
                        >
                          <img
                            src={
                              imageUrl
                            }
                            alt={
                              m.attachmentName ||
                              "Solution photo"
                            }
                            style={{
                              display:
                                "block",
                              maxWidth:
                                "100%",
                              maxHeight:
                                "400px",
                              objectFit:
                                "contain",
                              borderRadius:
                                "10px",
                              border:
                                "1px solid var(--border-color)"
                            }}
                          />
                        </div>
                      )}

                      {videoUrl && (
                        <div
                          style={{
                            marginTop:
                              "6px"
                          }}
                        >
                          <video
                            src={
                              videoUrl
                            }
                            controls
                            playsInline
                            style={{
                              display:
                                "block",
                              width:
                                "100%",
                              maxWidth:
                                "520px",
                              maxHeight:
                                "400px",
                              borderRadius:
                                "10px",
                              background:
                                "#000"
                            }}
                          />
                        </div>
                      )}

                      {(
                        m.attachmentUrl &&
                        m.attachmentName
                      ) && (
                        <a
                          href={
                            m.attachmentUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display:
                              "inline-block",
                            marginTop:
                              "7px",
                            fontSize:
                              "0.75rem",
                            color:
                              "var(--primary)",
                            textDecoration:
                              "none"
                          }}
                        >
                          📎{" "}
                          {
                            m.attachmentName
                          }
                        </a>
                      )}

                      <div
                        className="message-time"
                      >
                        {formatMessageTime(
                          m.createdAt ||
                          m.sentAt
                        )}
                      </div>

                    </div>
                  </div>
                );
              }
            )
          )}

          <div
            ref={
              messagesEndRef
            }
          />

        </div>

        {/* =================================================
            ATTACHMENT PREVIEW
        ================================================= */}

        {attachmentFile && (
          <div
            style={{
              padding:
                "10px 14px",
              borderTop:
                "1px solid var(--border-color)",
              background:
                "#f8fafc"
            }}
          >

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "flex-start",
                gap: "10px"
              }}
            >

              <div
                style={{
                  flex: 1
                }}
              >

                <div
                  style={{
                    fontSize:
                      "0.78rem",
                    fontWeight: 700,
                    marginBottom:
                      "6px"
                  }}
                >
                  {attachmentType ===
                  "image"
                    ? "📷 Photo selected"
                    : "🎥 Video selected"}
                </div>

                {attachmentType ===
                "image" ? (
                  <img
                    src={
                      attachmentPreviewUrl
                    }
                    alt="Selected preview"
                    style={{
                      maxWidth:
                        "220px",
                      maxHeight:
                        "160px",
                      objectFit:
                        "contain",
                      borderRadius:
                        "8px",
                      border:
                        "1px solid var(--border-color)"
                    }}
                  />
                ) : (
                  <video
                    src={
                      attachmentPreviewUrl
                    }
                    controls
                    playsInline
                    style={{
                      maxWidth:
                        "300px",
                      maxHeight:
                        "180px",
                      borderRadius:
                        "8px",
                      background:
                        "#000"
                    }}
                  />
                )}

                <div
                  style={{
                    fontSize:
                      "0.72rem",
                    color:
                      "var(--text-muted)",
                    marginTop:
                      "5px",
                    wordBreak:
                      "break-word"
                  }}
                >
                  {
                    attachmentFile.name
                  }
                </div>

              </div>

              <button
                type="button"
                onClick={
                  clearAttachment
                }
                title="Remove attachment"
                style={{
                  border:
                    "none",
                  background:
                    "#fee2e2",
                  color:
                    "#b91c1c",
                  width:
                    "30px",
                  height:
                    "30px",
                  borderRadius:
                    "50%",
                  cursor:
                    "pointer",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  flexShrink:
                    0
                }}
              >
                <X
                  size={16}
                />
              </button>

            </div>
          </div>
        )}

        {/* =================================================
            CHAT INPUT
        ================================================= */}

        <form
          onSubmit={
            handleSendMessage
          }
          className="chat-input-area"
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: "8px",
            flexWrap:
              "wrap"
          }}
        >

          {/* PHOTO INPUT */}

          <input
            ref={
              imageInputRef
            }
            type="file"
            accept="image/*"
            style={{
              display:
                "none"
            }}
            onChange={(e) =>
              handleAttachmentSelect(
                e,
                "image"
              )
            }
          />

          {/* VIDEO INPUT */}

          <input
            ref={
              videoInputRef
            }
            type="file"
            accept="video/*"
            style={{
              display:
                "none"
            }}
            onChange={(e) =>
              handleAttachmentSelect(
                e,
                "video"
              )
            }
          />

          {/* PHOTO */}

          <button
            type="button"
            className="btn btn-outline"
            title="Attach photo"
            onClick={() =>
              imageInputRef.current?.click()
            }
            disabled={
              sending
            }
            style={{
              padding:
                "8px 10px",
              display:
                "flex",
              alignItems:
                "center",
              gap: "5px"
            }}
          >
            <ImageIcon
              size={17}
            />

            <span
              style={{
                fontSize:
                  "0.78rem"
              }}
            >
              Photo
            </span>
          </button>

          {/* VIDEO */}

          <button
            type="button"
            className="btn btn-outline"
            title="Attach video"
            onClick={() =>
              videoInputRef.current?.click()
            }
            disabled={
              sending
            }
            style={{
              padding:
                "8px 10px",
              display:
                "flex",
              alignItems:
                "center",
              gap: "5px"
            }}
          >
            <Video
              size={17}
            />

            <span
              style={{
                fontSize:
                  "0.78rem"
              }}
            >
              Video
            </span>
          </button>

          {/* =================================================
              TEXT INPUT — PASTE BLOCKED
          ================================================= */}

          <input
            type="text"
            className="chat-input"
            placeholder={
              isResolved
                ? "Doubt is resolved. You can still leave follow-up comments or attachments..."
                : isAsker
                  ? "Reply to helpers, ask for clarification, or attach a file..."
                  : "Type your solution or attach a photo/video..."
            }
            value={
              inputText
            }
            onChange={(e) =>
              setInputText(
                e.target.value
              )
            }

            /* ================================
               PASTE BLOCKING
               ================================ */

            onPaste={
              handleInputPaste
            }

            onKeyDown={
              handleInputKeyDown
            }

            onContextMenu={
              handleInputContextMenu
            }

            disabled={
              sending
            }

            style={{
              flex: 1,
              minWidth:
                "180px"
            }}
          />

          {/* SEND */}

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              padding:
                "0 20px"
            }}
            disabled={
              sending ||
              (
                !inputText.trim() &&
                !attachmentFile
              )
            }
          >
            <Send
              size={18}
            />

            <span
              style={{
                marginLeft:
                  "4px"
              }}
            >
              {sending
                ? "Sending..."
                : "Send"}
            </span>
          </button>

        </form>

      </div>
    </div>
  );
};

export default DoubtChat;