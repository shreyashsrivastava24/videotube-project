import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatTimeAgo, formatViews } from "../utils";
import VideoCard from "../components/VideoCard";
import VideoSkeleton from "../components/VideoSkeleton";
import { Folder, Film, Info, UserCheck, UserPlus, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [activeTab, setActiveTab] = useState("videos"); // "videos" | "playlists" | "about"
  
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [error, setError] = useState(null);
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch channel profile info
      const channelRes = await api.get(`/users/c/${username}`);
      const channelData = channelRes.data?.data;
      if (!channelData) {
        throw new Error("Channel not found");
      }
      setChannel(channelData);
      setIsSubscribed(channelData.isSubscribed || false);
      setSubscribersCount(channelData.subscribersCount || 0);

      // Trigger lazy tab loads
      fetchChannelVideos(channelData._id);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load channel profile.");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfileData();
  }, [username, fetchProfileData]);

  const fetchChannelVideos = async (userId) => {
    setLoadingVideos(true);
    try {
      // If viewing own profile, use dashboard/videos to see all (including unlisted)
      // Otherwise use public /videos endpoint (only published)
      const isOwnChannel = currentUser?._id === userId;
      let fetchedVideos = [];
      if (isOwnChannel) {
        const response = await api.get("/dashboard/videos");
        fetchedVideos = response.data?.data || [];
      } else {
        const response = await api.get("/videos", {
          params: { userId, sortBy: "createdAt", sortType: "desc" },
        });
        fetchedVideos = response.data?.videos || [];
      }
      setVideos(fetchedVideos);
    } catch (err) {
      console.error("Failed to load channel videos", err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const fetchChannelPlaylists = async (userId) => {
    setLoadingPlaylists(true);
    try {
      const response = await api.get(`/playlist/user/${userId}`);
      setPlaylists(response.data?.data || []);
    } catch (err) {
      console.error("Failed to load channel playlists", err);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    setCreatingPlaylist(true);
    try {
      const response = await api.post("/playlist", {
        name: newPlaylistName,
        description: newPlaylistDesc,
      });
      const created = response.data?.data;
      if (created) {
        setPlaylists((prev) => [created, ...prev]);
        setCreatePlaylistOpen(false);
        setNewPlaylistName("");
        setNewPlaylistDesc("");
        toast.success("Playlist created successfully!");
      }
    } catch (err) {
      toast.error("Failed to create playlist");
    } finally {
      setCreatingPlaylist(false);
    }
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (!channel) return;
    if (tabName === "videos" && videos.length === 0) {
      fetchChannelVideos(channel._id);
    } else if (tabName === "playlists" && playlists.length === 0) {
      fetchChannelPlaylists(channel._id);
    }
  };

  const handleToggleSubscribe = async () => {
    if (!channel?._id) return;
    try {
      const response = await api.post(`/subscriptions/c/${channel._id}`);
      setIsSubscribed(!isSubscribed);
      setSubscribersCount((prev) => (isSubscribed ? prev - 1 : prev + 1));
      toast.success(response.data?.message || "Success");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not toggle subscription");
    }
  };

  const isOwnProfile = currentUser?.username === username;

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-gray-400 mb-4">{error || "Profile not found."}</p>
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
    <div className="space-y-6">
      {/* Cover Banner */}
      <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-gray-900 border border-gray-800">
        <img
          src={
            channel.coverImage ||
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=60"
          }
          alt="Channel Banner"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] to-transparent opacity-80"></div>
      </div>

      {/* Profile Info Section */}
      <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-end justify-between border-b border-gray-800 pb-6 px-1 sm:px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <img
            src={channel.avatar || "https://api.dicebear.com/7.x/adventurer/svg"}
            alt="avatar"
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-[#0B0F19] object-cover -mt-10 sm:-mt-12 shadow-xl shrink-0"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">{channel.fullName}</h1>
            <p className="text-xs text-gray-400">@{channel.username}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>{subscribersCount} subscriber{subscribersCount === 1 ? "" : "s"}</span>
              <span className="h-1 w-1 rounded-full bg-gray-700"></span>
              <span>{channel.channelsSubscribedToCount || 0} subscribed</span>
            </div>
          </div>
        </div>

        {/* Subscribe / Edit Profile Action Button */}
        <div className="sm:shrink-0">
          {isOwnProfile ? (
            <Link
              to="/settings"
              className="flex items-center justify-center rounded-full bg-gray-800 border border-gray-700 px-6 py-2.5 text-xs font-semibold hover:bg-gray-700 transition-colors w-full sm:w-auto"
            >
              Edit Profile
            </Link>
          ) : (
            <button
              onClick={handleToggleSubscribe}
              className={`flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-full px-6 py-2.5 text-xs font-semibold tracking-wide transition-all ${
                isSubscribed
                  ? "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
                  : "bg-purple-600 text-white shadow-md shadow-purple-500/20 hover:bg-purple-700"
              }`}
            >
              {isSubscribed ? (
                <><UserCheck className="h-3.5 w-3.5" /><span>Subscribed</span></>
              ) : (
                <><UserPlus className="h-3.5 w-3.5" /><span>Subscribe</span></>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tabs Selection */}
      <div className="flex gap-1 border-b border-gray-800/80 px-1 overflow-x-auto scrollbar-none">
        {[
          { name: "Videos", id: "videos", icon: Film },
          { name: "Playlists", id: "playlists", icon: Folder },
          { name: "About", id: "about", icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold tracking-wider uppercase transition-all ${
                isActive
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="px-2">
        {/* Videos Grid */}
        {activeTab === "videos" && (
          loadingVideos ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <VideoSkeleton key={i} />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-500">
              No videos uploaded by this channel yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {videos.map((video) => (
                <VideoCard key={video._id} video={{ ...video, owner: channel }} />
              ))}
            </div>
          )
        )}

        {/* Playlists Grid */}
        {activeTab === "playlists" && (
          loadingPlaylists ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-500">
              <p>No playlists created by this channel yet.</p>
              {isOwnProfile && (
                <button
                  onClick={() => setCreatePlaylistOpen(true)}
                  className="mt-4 inline-flex rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-purple-700 transition-colors"
                >
                  Create Playlist
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {isOwnProfile && (
                <button
                  onClick={() => setCreatePlaylistOpen(true)}
                  className="rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-purple-700 transition-colors"
                >
                  + Create Playlist
                </button>
              )}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {playlists.map((playlist) => (
                  <Link
                    key={playlist._id}
                    to={`/playlist/${playlist._id}`}
                    className="group flex flex-col gap-2 rounded-2xl bg-gray-900/30 p-4 border border-gray-800/50 hover:bg-gray-900/60 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-purple-900/25 border border-purple-500/10 text-purple-500 group-hover:scale-102 transition-transform">
                      <Folder className="h-10 w-10" />
                    </div>
                    <div className="mt-2 min-w-0">
                      <h3 className="truncate text-sm font-semibold text-white group-hover:text-purple-400 transition-colors">
                        {playlist.name}
                      </h3>
                      <p className="truncate mt-0.5 text-xs text-gray-500">
                        {playlist.description || "No description"}
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-gray-800 px-2.5 py-1 text-[10px] text-gray-400">
                        {playlist.videos?.length || 0} video{playlist.videos?.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        )}

        {/* About tab */}
        {activeTab === "about" && (
          <div className="max-w-2xl rounded-2xl bg-gray-900/10 border border-gray-800/40 p-6 space-y-4 text-sm text-gray-300">
            <h3 className="text-base font-bold text-white font-heading">Channel Description</h3>
            <p className="leading-relaxed">
              Welcome to {channel.fullName}'s channel! Subscribe for premium video content uploads.
            </p>
            <div className="border-t border-gray-800/50 pt-4 space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Username:</span>
                <span className="text-white">@{channel.username}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="text-white">{channel.email || "Private"}</span>
              </div>
              <div className="flex justify-between">
                <span>Account Created:</span>
                <span className="text-white">{formatTimeAgo(channel.createdAt)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Playlist Modal */}
      {createPlaylistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-base font-bold font-heading text-white">Create Playlist</h2>
              <button
                onClick={() => setCreatePlaylistOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Playlist Name *</label>
                <input
                  type="text"
                  required
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="E.g., My Favorite Videos"
                  className="w-full rounded-xl bg-gray-900 border border-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Description</label>
                <textarea
                  rows="3"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="Description of the playlist..."
                  className="w-full rounded-xl bg-gray-900 border border-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={creatingPlaylist}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
              >
                {creatingPlaylist ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Playlist</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
