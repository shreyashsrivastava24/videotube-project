import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { formatTimeAgo, formatViews } from "../utils";
import Comments from "../components/Comments";
import { ThumbsUp, Bell, BellOff, Eye, Loader2, Play, FolderPlus, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const Watch = () => {
  const { videoId } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [channelProfile, setChannelProfile] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);

  const handleOpenPlaylistModal = async () => {
    if (!user) {
      toast.error("Please log in to manage playlists");
      return;
    }
    setPlaylistModalOpen(true);
    setLoadingPlaylists(true);
    try {
      const response = await api.get(`/playlist/user/${user._id}`);
      setPlaylists(response.data?.data || []);
    } catch (err) {
      toast.error("Failed to load your playlists");
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleAddVideoToPlaylist = async (playlistId) => {
    try {
      await api.patch(`/playlist/add/${videoId}/${playlistId}`);
      toast.success("Added to playlist!");
      setPlaylistModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to playlist");
    }
  };

  const fetchWatchPageData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch video details
      const videoRes = await api.get(`/videos/${videoId}`);
      const videoData = videoRes.data?.data;
      if (!videoData) {
        throw new Error("Video not found");
      }
      setVideo(videoData);
      // likeCount is derived from user's liked videos list, not from videoData (no likesCount field)
      // We'll initialize to 0 and let the toggle adjust it

      // 2. Fetch channel subscription info
      if (videoData.owner?.username) {
        const channelRes = await api.get(`/users/c/${videoData.owner.username}`);
        const channelData = channelRes.data?.data;
        if (channelData) {
          setChannelProfile(channelData);
          setIsSubscribed(channelData.isSubscribed || false);
          setSubscribersCount(channelData.subscribersCount || 0);
        }
      }

      // 3. Fetch user liked status and count from dedicated endpoint
      try {
        const likesRes = await api.get(`/likes/count/v/${videoId}`);
        const likesData = likesRes.data?.data;
        if (likesData) {
          setIsLiked(likesData.isLiked || false);
          setLikeCount(likesData.count || 0);
        }
      } catch (err) {
        // Non-critical: failed to load like status
      }


      // 4. Fetch recommendations
      try {
        const suggestionsRes = await api.get("/videos", { params: { page: 1, limit: 10 } });
        const list = suggestionsRes.data?.videos || [];
        // Filter out current video
        setSuggestions(list.filter((v) => v._id !== videoId));
      } catch (err) {
        console.error("Failed to load recommendations:", err);
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load watch page data.");
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchWatchPageData();
  }, [videoId, fetchWatchPageData]);

  const handleToggleLike = async () => {
    try {
      // Backend: POST /likes/toggle/v/:videoId
      const response = await api.post(`/likes/toggle/v/${videoId}`);
      setIsLiked(!isLiked);
      setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
      toast.success(response.data?.message || "Success");
    } catch (err) {
      toast.error("Could not toggle like");
    }
  };

  const handleToggleSubscribe = async () => {
    if (!video?.owner?._id) return;
    try {
      // Backend: POST /subscriptions/c/:channelId
      const response = await api.post(`/subscriptions/c/${video.owner._id}`);
      setIsSubscribed(!isSubscribed);
      setSubscribersCount((prev) => (isSubscribed ? prev - 1 : prev + 1));
      toast.success(response.data?.message || "Success");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update subscription");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-gray-400 mb-4">{error || "Video details not found."}</p>
        <Link
          to="/"
          className="rounded-full bg-purple-600 px-6 py-2.5 text-sm font-semibold hover:bg-purple-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Video Content & Comments */}
      <div className="lg:col-span-2 space-y-4">
        {/* HTML5 Video Player */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-gray-800 shadow-2xl">
          <video
            src={video.videoFile}
            poster={video.thumbnail}
            controls
            autoPlay
            className="h-full w-full object-contain"
          ></video>
        </div>

        {/* Video Info Header */}
        <div className="space-y-3">
          <h1 className="text-xl font-bold text-white tracking-wide leading-snug">
            {video.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
            {/* Channel Details & Subscription */}
            <div className="flex items-center gap-3">
              <Link to={`/c/${video.owner?.username}`}>
                <img
                  src={video.owner?.avatar || "https://api.dicebear.com/7.x/adventurer/svg"}
                  alt="avatar"
                  className="h-11 w-11 rounded-full border border-purple-500/20 object-cover"
                />
              </Link>
              <div>
                <Link to={`/c/${video.owner?.username}`} className="block text-sm font-semibold hover:text-purple-400 transition-colors">
                  {video.owner?.fullName || "Channel Owner"}
                </Link>
                <span className="text-xs text-gray-500">
                  {subscribersCount} subscriber{subscribersCount === 1 ? "" : "s"}
                </span>
              </div>

              {/* Subscribe button */}
              <button
                onClick={handleToggleSubscribe}
                className={`ml-4 flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold tracking-wide transition-all ${
                  isSubscribed
                    ? "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
                    : "bg-purple-600 text-white shadow-md shadow-purple-500/20 hover:bg-purple-700"
                }`}
              >
                {isSubscribed ? (
                  <>
                    <BellOff className="h-3.5 w-3.5" />
                    <span>Subscribed</span>
                  </>
                ) : (
                  <>
                    <Bell className="h-3.5 w-3.5" />
                    <span>Subscribe</span>
                  </>
                )}
              </button>
            </div>

            {/* Like and Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleLike}
                className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-semibold transition-all ${
                  isLiked
                    ? "bg-purple-600/10 border-purple-500 text-purple-400"
                    : "bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800"
                }`}
              >
                <ThumbsUp className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
                <span>{likeCount > 0 ? likeCount : ""} Like{likeCount !== 1 ? "s" : ""}</span>
              </button>
              <button
                onClick={handleOpenPlaylistModal}
                className="flex items-center gap-2 rounded-full border border-gray-800 bg-gray-900 px-5 py-2.5 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition-all"
              >
                <FolderPlus className="h-4 w-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>

        {/* Video Description Box */}
        <div className="rounded-xl bg-gray-900/40 border border-gray-800/40 p-4 text-sm">
          <div className="flex items-center gap-2 font-medium text-gray-200">
            <span>{formatViews(video.views)}</span>
            <span className="h-1 w-1 rounded-full bg-gray-700"></span>
            <span>{formatTimeAgo(video.createdAt)}</span>
          </div>
          <p className={`mt-2 text-gray-300 whitespace-pre-wrap leading-relaxed ${!descExpanded && "line-clamp-2"}`}>
            {video.description}
          </p>
          {video.description && video.description.length > 80 && (
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="mt-2 text-xs font-semibold text-purple-400 hover:text-purple-300 hover:underline"
            >
              {descExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* Comments Section */}
        <Comments videoId={videoId} />
      </div>

      {/* Suggested Videos Column */}
      <div className="space-y-4">
        <h3 className="text-md font-bold font-heading text-white">Up Next</h3>

        {suggestions.length === 0 ? (
          <p className="text-xs text-gray-500">No suggestions available.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {suggestions.map((item) => (
              <Link
                key={item._id}
                to={`/watch/${item._id}`}
                className="group flex gap-3 rounded-xl p-1.5 hover:bg-gray-900/40 transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-gray-900">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info details */}
                <div className="flex-1 min-w-0">
                  <h4 className="line-clamp-2 text-xs font-semibold text-white group-hover:text-purple-400 transition-colors leading-snug">
                    {item.title}
                  </h4>
                  <span className="mt-1 block text-[10px] text-gray-400">
                    {item.owner?.fullName || "Channel"}
                  </span>
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-500">
                    <span>{formatViews(item.views)}</span>
                    <span className="h-0.5 w-0.5 rounded-full bg-gray-700"></span>
                    <span>{formatTimeAgo(item.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      {/* Add to Playlist Modal */}
      {playlistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-base font-bold font-heading text-white">Save to Playlist</h2>
              <button
                onClick={() => setPlaylistModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingPlaylists ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500">
                <p>No playlists found.</p>
                <Link
                  to={`/c/${user?.username}`}
                  onClick={() => setPlaylistModalOpen(false)}
                  className="mt-3 inline-block font-semibold text-purple-400 hover:text-purple-300"
                >
                  Create one on your Profile page
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {playlists.map((playlist) => (
                  <button
                    key={playlist._id}
                    onClick={() => handleAddVideoToPlaylist(playlist._id)}
                    className="flex items-center justify-between rounded-xl bg-gray-900/50 hover:bg-gray-900 border border-gray-800 px-4 py-3 text-sm text-white text-left transition-colors w-full"
                  >
                    <div>
                      <p className="font-semibold">{playlist.name}</p>
                      <p className="text-[10px] text-gray-500">{playlist.videos?.length || 0} videos</p>
                    </div>
                    <span className="text-xs font-semibold text-purple-400 hover:text-purple-300">Add</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Watch;
