import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import VideoCard from "../components/VideoCard";
import VideoSkeleton from "../components/VideoSkeleton";
import { Search as SearchIcon } from "lucide-react";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/videos", {
        params: {
          query: query,
          sortBy: "createdAt",
          sortType: "desc",
        },
      });
      setVideos(response.data?.videos || []);
    } catch {
      // Search failed
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (query) {
      performSearch();
    } else {
      setLoading(false);
    }
  }, [query, performSearch]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold font-heading text-white">Search Results</h2>
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
          <SearchIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-heading text-white">Search Results</h2>
          <p className="text-xs text-gray-500">
            {videos.length} result{videos.length === 1 ? "" : "s"} for "{query}"
          </p>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-20 text-sm text-gray-500">
          No videos matched your search query. Try searching for other keywords!
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

export default Search;
