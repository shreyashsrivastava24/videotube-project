import React, { useState, useEffect } from "react";
import api from "../services/api";
import VideoCard from "../components/VideoCard";
import VideoSkeleton from "../components/VideoSkeleton";
import { History as HistoryIcon } from "lucide-react";

const History = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get("/users/history");
        setVideos(response.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold font-heading text-white">Watch History</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <VideoSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-800 pb-4">
        <div className="rounded-xl bg-purple-600/10 border border-purple-500/20 p-2 text-purple-400">
          <HistoryIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-heading text-white">Watch History</h2>
          <p className="text-xs text-gray-500">{videos.length} videos viewed</p>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-20 text-sm text-gray-500">
          Your watch history is empty.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
