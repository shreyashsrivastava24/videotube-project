import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils";
import TweetCard from "./TweetCard";
import TweetComposer from "./TweetComposer";
import { Loader2, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

const TweetList = ({ userId, feed = false, showComposer = false, emptyMessage }) => {
  const { user } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchTweets = useCallback(async () => {
    if (!feed && !userId) return;
    setLoading(true);
    setError(null);
    try {
      const endpoint = feed ? "/tweets" : `/tweets/user/${userId}`;

      const response = await api.get(endpoint);
      setTweets(response.data?.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load tweets"));
    } finally {
      setLoading(false);
    }
  }, [userId, feed]);

  useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);

  const handleCreate = async (content) => {
    setSubmitting(true);
    try {
      const response = await api.post("/tweets", { content });
      const created = response.data?.data;
      if (created) {
        const populated = {
          ...created,
          owner: created.owner || {
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            avatar: user.avatar,
          },
        };
        setTweets((prev) => [populated, ...prev]);
        toast.success("Tweet posted!");
        return true;
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to post tweet"));
    } finally {
      setSubmitting(false);
    }
    return false;
  };

  const handleEdit = async (tweetId, content) => {
    setUpdatingId(tweetId);
    try {
      const response = await api.patch(`/tweets/${tweetId}`, { content });
      const updated = response.data?.data;
      if (updated) {
        setTweets((prev) =>
          prev.map((t) =>
            t._id === tweetId
              ? { ...t, content: updated.content, updatedAt: updated.updatedAt }
              : t
          )
        );
        toast.success("Tweet updated");
        return true;
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update tweet"));
    } finally {
      setUpdatingId(null);
    }
    return false;
  };

  const handleDelete = async (tweetId) => {
    if (!window.confirm("Delete this tweet?")) return;
    try {
      await api.delete(`/tweets/${tweetId}`);
      setTweets((prev) => prev.filter((t) => t._id !== tweetId));
      toast.success("Tweet deleted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete tweet"));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm text-gray-400">{error}</p>
        <button
          onClick={fetchTweets}
          className="rounded-full bg-purple-600 px-5 py-2 text-xs font-semibold hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {showComposer && user && (
        <TweetComposer user={user} onSubmit={handleCreate} submitting={submitting} />
      )}

      {tweets.length === 0 ? (
        <div className="text-center py-16 text-sm text-gray-500">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-600" />
          <p>{emptyMessage || "No tweets yet."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tweets.map((tweet) => (
            <TweetCard
              key={tweet._id}
              tweet={tweet}
              currentUserId={user?._id}
              onEdit={handleEdit}
              onDelete={handleDelete}
              updatingId={updatingId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TweetList;
