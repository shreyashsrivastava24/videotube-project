import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { formatDuration, formatTimeAgo, formatViews } from "../utils";
import {
  Film,
  Eye,
  ThumbsUp,
  Users,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
  Upload
} from "lucide-react";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  
  const [videoFileLabel, setVideoFileLabel] = useState("");
  const [thumbnailFileLabel, setThumbnailFileLabel] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch stats
      const statsRes = await api.get("/dashboard/stats");
      setStats(statsRes.data?.data || null);

      // 2. Fetch user's videos
      const videosRes = await api.get("/dashboard/videos");
      setVideos(videosRes.data?.data || []);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleUploadVideo = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !videoFile || !thumbnailFile) {
      toast.error("Please fill all required fields and upload files.");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("videoFile", videoFile);
    formData.append("thumbnail", thumbnailFile);

    try {
      const response = await api.post("/videos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status === 201) {
        toast.success("Video uploaded successfully!");
        setUploadModalOpen(false);
        // Reset form
        setTitle("");
        setDescription("");
        setVideoFile(null);
        setThumbnailFile(null);
        setVideoFileLabel("");
        setThumbnailFileLabel("");
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload video");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (video) => {
    setEditingVideo(video);
    setTitle(video.title);
    setDescription(video.description);
    setEditModalOpen(true);
  };

  const handleEditVideo = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (videoFile) formData.append("videoFile", videoFile);
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile);

    try {
      await api.patch(`/videos/${editingVideo._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Video details updated!");
      setEditModalOpen(false);
      setEditingVideo(null);
      setTitle("");
      setDescription("");
      setVideoFile(null);
      setThumbnailFile(null);
      setVideoFileLabel("");
      setThumbnailFileLabel("");
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to edit video details");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this video forever?")) return;

    try {
      await api.delete(`/videos/${videoId}`);
      toast.success("Video deleted");
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
    } catch {
      toast.error("Failed to delete video");
    }
  };


  const handleTogglePublish = async (videoId) => {
    try {
      const response = await api.patch(`/videos/toggle/publish/${videoId}`);
      const updated = response.data?.data;
      if (updated) {
        setVideos((prev) =>
          prev.map((v) => (v._id === videoId ? { ...v, isPublished: updated.isPublished } : v))
        );
        toast.success("Publish status updated!");
      }
    } catch {
      toast.error("Failed to toggle publish status");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">Creator Dashboard</h1>
          <p className="text-xs text-gray-400">Monitor stats and manage channel videos</p>
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg hover:opacity-95 transition-opacity w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Video</span>
        </button>
      </div>

      {/* Analytics Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Total Videos", value: stats.totalVideos, icon: Film, color: "text-blue-400" },
            { label: "Total Views", value: formatViews(stats.totalViews).replace(" views", ""), icon: Eye, color: "text-purple-400" },
            { label: "Subscribers", value: stats.totalSubscribers, icon: Users, color: "text-emerald-400" },
            { label: "Likes Received", value: stats.totalLikes, icon: ThumbsUp, color: "text-rose-400" },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="glass rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold font-heading text-white">{card.value}</p>
                </div>
                <div className={`rounded-xl bg-gray-900 border border-gray-800 p-2.5 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Videos List Container */}
      <div className="glass rounded-2xl overflow-hidden border border-gray-800">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-base font-bold font-heading text-white">Your Videos</h2>
          <span className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-400">
            {videos.length} uploaded
          </span>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-500 px-4">
            No videos uploaded yet. Click &ldquo;Upload Video&rdquo; to publish your first content!
          </div>
        ) : (
          <>
            {/* Mobile card list — shown below md */}
            <div className="md:hidden divide-y divide-gray-800/60">
              {videos.map((vid) => (
                <div key={vid._id} className="flex gap-3 p-4 hover:bg-gray-900/20 transition-colors">
                  <Link to={`/watch/${vid._id}`} className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-800">
                    <img src={vid.thumbnail} alt="thumb" className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 text-[10px] font-semibold text-white">
                      {formatDuration(vid.duration)}
                    </span>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/watch/${vid._id}`} className="block text-sm font-medium text-white hover:text-purple-400 line-clamp-2 leading-snug">
                      {vid.title}
                    </Link>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <button onClick={() => handleTogglePublish(vid._id)}>
                        {vid.isPublished ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-semibold">
                            <ToggleRight className="h-3.5 w-3.5" />Public
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-500 text-[10px] font-semibold">
                            <ToggleLeft className="h-3.5 w-3.5" />Unlisted
                          </span>
                        )}
                      </button>
                      <span className="text-[10px] text-gray-600">•</span>
                      <span className="text-[10px] text-gray-500">{vid.views} views</span>
                      <span className="text-[10px] text-gray-600">•</span>
                      <span className="text-[10px] text-gray-500">{formatTimeAgo(vid.createdAt)}</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleStartEdit(vid)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-800 transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(vid._id)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table — shown at md and above */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-gray-900/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Video</th>
                    <th className="px-6 py-4">Publish</th>
                    <th className="px-6 py-4">Views</th>
                    <th className="px-6 py-4">Date Uploaded</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/80">
                  {videos.map((vid) => (
                    <tr key={vid._id} className="hover:bg-gray-900/10">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={vid.thumbnail} alt="thumb" className="h-10 w-16 rounded-md object-cover bg-gray-800 shrink-0" />
                          <div className="min-w-0">
                            <Link to={`/watch/${vid._id}`} className="block font-medium text-white hover:text-purple-400 truncate">
                              {vid.title}
                            </Link>
                            <span className="text-[10px] text-gray-500">{formatDuration(vid.duration)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleTogglePublish(vid._id)} className="text-gray-400 hover:text-white">
                          {vid.isPublished ? (
                            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                              <ToggleRight className="h-5 w-5" /><span>Public</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold">
                              <ToggleLeft className="h-5 w-5" /><span>Unlisted</span>
                            </div>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">{vid.views}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{formatTimeAgo(vid.createdAt)}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleStartEdit(vid)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white inline-flex"
                          title="Edit Details"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(vid._id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 inline-flex"
                          title="Delete Video"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Upload/Edit Video Modal overlay */}
      {(uploadModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-lg font-bold font-heading text-white">
                {uploadModalOpen ? "Upload Video" : "Edit Video"}
              </h2>
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setEditModalOpen(false);
                  setEditingVideo(null);
                  setTitle("");
                  setDescription("");
                  setVideoFile(null);
                  setThumbnailFile(null);
                  setVideoFileLabel("");
                  setThumbnailFileLabel("");
                }}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={uploadModalOpen ? handleUploadVideo : handleEditVideo} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Video Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Learning Javascript in 10 Minutes"
                  className="w-full rounded-xl bg-gray-900 border border-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Description *</label>
                <textarea
                  required
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell your viewers about your video..."
                  className="w-full rounded-xl bg-gray-900 border border-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
                />
              </div>

              {/* Files Upload for Upload Modal */}
              <div className="space-y-4">
                {/* Video File */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Video File {uploadModalOpen ? "*" : "(Optional)"}
                  </label>
                  <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 bg-gray-900/50 p-4 text-center cursor-pointer hover:border-purple-500">
                    <input
                      type="file"
                      accept="video/*"
                      required={uploadModalOpen}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setVideoFile(file);
                          setVideoFileLabel(file.name);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="h-6 w-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400 font-semibold">
                      {videoFileLabel || "Drag & drop video or click to upload"}
                    </span>
                  </div>
                </div>

                {/* Thumbnail File */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Thumbnail Image {uploadModalOpen ? "*" : "(Optional)"}
                  </label>
                  <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 bg-gray-900/50 p-4 text-center cursor-pointer hover:border-purple-500">
                    <input
                      type="file"
                      accept="image/*"
                      required={uploadModalOpen}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setThumbnailFile(file);
                          setThumbnailFileLabel(file.name);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="h-6 w-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400 font-semibold">
                      {thumbnailFileLabel || "Drag & drop image or click to upload"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{uploadModalOpen ? "Uploading Video..." : "Saving Changes..."}</span>
                  </>
                ) : (
                  <span>{uploadModalOpen ? "Publish Video" : "Save Changes"}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
