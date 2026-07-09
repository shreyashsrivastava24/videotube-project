import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { formatDuration, formatTimeAgo, formatViews } from "../utils";
import { Folder, Trash2, Edit2, Play, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const PlaylistDetail = () => {
  const { playlistId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchPlaylistDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/playlist/${playlistId}`);
      const data = response.data?.data;
      setPlaylist(data);
      if (data) {
        setName(data.name);
        setDescription(data.description);
      }
    } catch {
      toast.error("Failed to load playlist details");
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    fetchPlaylistDetails();
  }, [playlistId, fetchPlaylistDetails]);

  const handleDeletePlaylist = async () => {
    if (!window.confirm("Are you sure you want to delete this playlist?")) return;
    try {
      await api.delete(`/playlist/${playlistId}`);
      toast.success("Playlist deleted");
      navigate(`/c/${user.username}`);
    } catch {
      toast.error("Failed to delete playlist");
    }
  };

  const handleUpdatePlaylist = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const response = await api.patch(`/playlist/${playlistId}`, { name, description });
      if (response.data?.data) {
        setPlaylist((prev) => ({ ...prev, name, description }));
        setEditModalOpen(false);
        toast.success("Playlist updated");
      }
    } catch {
      toast.error("Failed to update playlist");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveVideo = async (videoId) => {
    try {
      await api.patch(`/playlist/remove/${videoId}/${playlistId}`);
      setPlaylist((prev) => ({
        ...prev,
        videos: prev.videos.filter((v) => v._id !== videoId),
      }));
      toast.success("Video removed from playlist");
    } catch {
      toast.error("Failed to remove video");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-gray-400 mb-4">Playlist not found.</p>
        <Link
          to="/"
          className="rounded-full bg-purple-600 px-6 py-2.5 text-sm font-semibold hover:bg-purple-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const isOwner = playlist.owner?._id === user?._id || playlist.owner === user?._id;
  const firstVideoId = playlist.videos?.[0]?._id;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Playlist Meta — full width on mobile, sidebar on md+ */}
      <div className="glass rounded-2xl p-6 border border-gray-800/80 flex flex-col gap-4 self-start">
        <div className="aspect-video w-full rounded-xl bg-purple-900/20 border border-purple-500/10 flex items-center justify-center text-purple-500">
          <Folder className="h-16 w-16" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-white font-heading tracking-wide truncate">{playlist.name}</h1>
          <p className="mt-1 text-xs text-gray-500">
            Created by{" "}
            <Link to={`/c/${playlist.owner?.username}`} className="hover:text-purple-400 font-semibold">
              @{playlist.owner?.username || "unknown"}
            </Link>
          </p>
        </div>

        <p className="text-sm text-gray-300 whitespace-pre-wrap">{playlist.description || "No description"}</p>

        <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-gray-800/80 pt-4">
          <span>{playlist.videos?.length || 0} videos</span>
          <span className="h-1 w-1 rounded-full bg-gray-700"></span>
          <span>Last updated {formatTimeAgo(playlist.updatedAt)}</span>
        </div>

        {/* Action triggers */}
        <div className="mt-4 flex flex-col gap-2">
          {firstVideoId ? (
            <Link
              to={`/watch/${firstVideoId}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/15"
            >
              <Play className="h-4 w-4" fill="currentColor" />
              <span>Play All</span>
            </Link>
          ) : (
            <button
              disabled
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-xs font-semibold text-gray-600 cursor-not-allowed border border-gray-800"
            >
              <Play className="h-4 w-4" />
              <span>Play All</span>
            </button>
          )}

          {isOwner && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setEditModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-800 bg-gray-900 py-2.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDeletePlaylist}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-500/10 bg-red-500/5 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Playlist Videos List */}
      <div className="md:col-span-2 space-y-4">
        <h2 className="text-base font-bold font-heading text-white">Videos</h2>

        {playlist.videos.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-sm text-gray-500">
            No videos in this playlist yet. Add videos from their watch pages!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {playlist.videos.map((vid, idx) => (
              <div
                key={vid._id}
                className="group flex gap-3 rounded-2xl p-2.5 hover:bg-gray-900/30 transition-colors relative"
              >
                {/* Index number */}
                <span className="self-center text-xs font-semibold text-gray-500 w-4 text-center shrink-0">
                  {idx + 1}
                </span>

                {/* Thumbnail */}
                <Link to={`/watch/${vid._id}`} className="relative aspect-video w-28 sm:w-36 shrink-0 overflow-hidden rounded-xl bg-gray-900">
                  <img src={vid.thumbnail} alt={vid.title} className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 right-1.5 rounded bg-black/75 px-1 py-0.5 text-[10px] font-semibold text-white">
                    {formatDuration(vid.duration)}
                  </span>
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0 pr-10">
                  <Link to={`/watch/${vid._id}`} className="block">
                    <h3 className="line-clamp-2 text-sm font-semibold text-white group-hover:text-purple-400 transition-colors leading-snug">
                      {vid.title}
                    </h3>
                  </Link>
                  <Link to={`/c/${vid.owner?.username}`} className="mt-1 block text-xs text-gray-400 hover:text-white transition-colors">
                    {vid.owner?.fullName || "Channel"}
                  </Link>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                    <span>{formatViews(vid.views)}</span>
                    <span className="h-1 w-1 rounded-full bg-gray-700"></span>
                    <span>{formatTimeAgo(vid.createdAt)}</span>
                  </div>
                </div>

                {/* Remove button (if owner) */}
                {isOwner && (
                  <button
                    onClick={() => handleRemoveVideo(vid._id)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                    title="Remove Video"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Playlist Modal Overlay */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-base font-bold font-heading text-white">Edit Playlist</h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePlaylist} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Playlist Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g., Web Development Tutorials"
                  className="w-full rounded-xl bg-gray-900 border border-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Description</label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this playlist about?"
                  className="w-full rounded-xl bg-gray-900 border border-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistDetail;
