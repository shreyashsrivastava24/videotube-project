import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatTimeAgo } from "../utils";
import { Loader2, Trash2, Edit2, Check, X, Send } from "lucide-react";
import toast from "react-hot-toast";

const Comments = ({ videoId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchComments = useCallback(async (pageNum, replace = false) => {
    try {
      const response = await api.get(`/comments/${videoId}`, {
        params: { page: pageNum, limit: 10 },
      });

      // Mongoose ApiResponse wraps data as { comments, pagination }
      const data = response.data?.data || {};
      const list = data.comments || [];
      const pagination = data.pagination || {};

      setComments((prev) => (replace ? list : [...prev, ...list]));
      setTotalPages(pagination.totalPages || 1);
    } catch (err) {
      console.error("Failed to load comments:", err);
      toast.error("Could not fetch comments");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [videoId]);

  useEffect(() => {
    setLoading(true);
    setComments([]);
    setPage(1);
    fetchComments(1, true);
  }, [videoId, fetchComments]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/comments/${videoId}`, { content: newComment.trim() });
      const added = response.data?.data;
      if (added) {
        setComments((prev) => [added, ...prev]);
        setNewComment("");
        toast.success("Comment added!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      await api.delete(`/comments/${videoId}/c/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success("Comment deleted");
    } catch (err) {
      toast.error("Failed to delete comment");
    }
  };

  const handleStartEdit = (comment) => {
    setEditingId(comment._id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) return;
    setUpdatingId(commentId);

    try {
      const response = await api.patch(`/comments/${videoId}/c/${commentId}`, {
        content: editContent.trim(),
      });
      const updated = response.data?.data;
      if (updated) {
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? { ...c, content: updated.content } : c))
        );
        setEditingId(null);
        toast.success("Comment updated");
      }
    } catch (err) {
      toast.error("Failed to save changes");
    } finally {
      setUpdatingId(null);
    }
  };

  const loadMoreComments = () => {
    if (page < totalPages && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      setLoadingMore(true);
      fetchComments(nextPage);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold font-heading text-white">Comments ({comments.length})</h3>

      {/* Add Comment Input Form */}
      <form onSubmit={handleAddComment} className="flex gap-3">
        <img
          src={user?.avatar || "https://api.dicebear.com/7.x/adventurer/svg"}
          alt="Avatar"
          className="h-10 w-10 rounded-full border border-gray-800 object-cover shrink-0"
        />
        <div className="relative flex-1">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a public comment..."
            className="w-full rounded-xl bg-gray-900 border border-gray-800 py-3 pl-4 pr-12 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-colors"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="absolute inset-y-0 right-2 flex items-center justify-center p-2 text-purple-500 hover:text-purple-400 disabled:text-gray-600 transition-colors"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-4">No comments yet. Share your thoughts!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const isOwner = comment.owner?._id === user?._id || comment.owner === user?._id;
            const isEditing = editingId === comment._id;

            return (
              <div key={comment._id} className="group flex gap-3 p-3 rounded-xl hover:bg-gray-900/30 border border-transparent transition-colors">
                <img
                  src={comment.owner?.avatar || "https://api.dicebear.com/7.x/adventurer/svg"}
                  alt="commenter"
                  className="h-9 w-9 rounded-full border border-gray-800 object-cover shrink-0"
                />

                <div className="flex-1 min-w-0">
                  {/* Header info */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-gray-200">
                      {comment.owner?.fullName || "Anonymous"}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      @{comment.owner?.username || "unknown"}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>

                  {/* Body Content */}
                  {isEditing ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 min-w-0 rounded-lg bg-gray-950 border border-purple-500/50 px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(comment._id)}
                        disabled={updatingId === comment._id}
                        className="rounded-lg p-1.5 text-green-500 hover:bg-green-500/10"
                      >
                        {updatingId === comment._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-300 break-words leading-relaxed">
                      {comment.content}
                    </p>
                  )}
                </div>

                {/* Edit/Delete Actions */}
                {isOwner && !isEditing && (
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity self-start shrink-0">
                    <button
                      onClick={() => handleStartEdit(comment)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Load More Button */}
          {page < totalPages && (
            <button
              onClick={loadMoreComments}
              disabled={loadingMore}
              className="mt-2 w-full rounded-xl bg-gray-900 border border-gray-800 py-2.5 text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {loadingMore ? "Loading more comments..." : "Load more comments"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Comments;
