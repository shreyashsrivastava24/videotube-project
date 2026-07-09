import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatTimeAgo } from "../utils";
import { Edit2, Trash2, Check, X, Loader2, ThumbsUp } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const TweetCard = ({
  tweet,
  currentUserId,
  onEdit,
  onDelete,
  updatingId,
}) => {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(tweet.content);
  const [isLiked, setIsLiked] = useState(!!tweet.isLiked);
  const [likesCount, setLikesCount] = useState(tweet.likesCount ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);

  // Sync when parent re-fetches tweets
  useEffect(() => {
    setIsLiked(!!tweet.isLiked);
    setLikesCount(tweet.likesCount ?? 0);
  }, [tweet.isLiked, tweet.likesCount]);

  const owner = tweet.owner;
  const ownerId = owner?._id ? String(owner._id) : String(owner);
  const isOwner = ownerId === String(currentUserId);

  const handleSave = async () => {
    if (!editContent.trim()) return;
    const success = await onEdit(tweet._id, editContent.trim());
    if (success) setEditing(false);
  };

  const handleCancel = () => {
    setEditContent(tweet.content);
    setEditing(false);
  };

  const handleToggleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (likeLoading) return;

    // Optimistic update
    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    setLikeLoading(true);

    try {
      await api.post(`/likes/toggle/t/${tweet._id}`);
    } catch (err) {
      // Revert on failure
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error(err?.response?.data?.message || "Could not toggle like");
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <article className="group rounded-2xl border border-gray-800/60 bg-gray-900/30 p-4 hover:border-gray-700/60 transition-colors">
      <div className="flex gap-3">
        <Link to={`/c/${owner?.username || "unknown"}`} className="shrink-0">
          <img
            src={owner?.avatar || "https://api.dicebear.com/7.x/adventurer/svg"}
            alt={owner?.username || "User"}
            className="avatar h-10 w-10 border border-gray-800"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Link
              to={`/c/${owner?.username || "unknown"}`}
              className="text-sm font-semibold text-white hover:text-purple-400 transition-colors"
            >
              {owner?.fullName || "User"}
            </Link>
            <span className="text-xs text-gray-500">@{owner?.username || "unknown"}</span>
            <span className="text-xs text-gray-600">·</span>
            <time className="text-xs text-gray-500" dateTime={tweet.createdAt}>
              {formatTimeAgo(tweet.createdAt)}
            </time>
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-gray-950 border border-purple-500/50 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={updatingId === tweet._id || !editContent.trim()}
                  className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {updatingId === tweet._id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-400 hover:bg-gray-800 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
              {tweet.content}
            </p>
          )}

          {/* Like button — always visible below content */}
          {!editing && (
            <div className="mt-3">
              <button
                onClick={handleToggleLike}
                disabled={likeLoading}
                className={`flex items-center gap-1.5 text-xs font-medium transition-all duration-150 disabled:opacity-60 ${
                  isLiked
                    ? "text-purple-400 hover:text-purple-300"
                    : "text-gray-500 hover:text-gray-300"
                }`}
                aria-label={isLiked ? "Unlike tweet" : "Like tweet"}
              >
                <ThumbsUp
                  className={`h-4 w-4 transition-transform duration-150 ${
                    isLiked ? "fill-current scale-110" : ""
                  } ${likeLoading ? "animate-pulse" : ""}`}
                />
                <span>{likesCount}</span>
              </button>
            </div>
          )}
        </div>

        {isOwner && !editing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-start">
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              title="Edit tweet"
              aria-label="Edit tweet"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(tweet._id)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              title="Delete tweet"
              aria-label="Delete tweet"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

export default TweetCard;
