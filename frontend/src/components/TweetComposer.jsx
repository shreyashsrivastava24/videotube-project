import React, { useState } from "react";
import { Loader2, Send } from "lucide-react";

const TweetComposer = ({ user, onSubmit, submitting }) => {
  const [content, setContent] = useState("");
  const maxLength = 280;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    const success = await onSubmit(content.trim());
    if (success) setContent("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-800/60 bg-gray-900/30 p-4"
    >
      <div className="flex gap-3">
        <img
          src={user?.avatar || "https://api.dicebear.com/7.x/adventurer/svg"}
          alt={user?.username}
          className="avatar h-10 w-10 border border-gray-800 shrink-0"
        />
        <div className="flex-1 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-colors resize-none"
          />
          <div className="flex items-center justify-between">
            <span
              className={`text-xs ${
                content.length > maxLength * 0.9 ? "text-amber-400" : "text-gray-500"
              }`}
            >
              {content.length}/{maxLength}
            </span>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="flex items-center gap-1.5 rounded-full bg-purple-600 px-5 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Post
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default TweetComposer;
