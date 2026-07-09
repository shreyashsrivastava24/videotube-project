import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";
import VideoCard from "../components/VideoCard";
import VideoSkeleton from "../components/VideoSkeleton";
import { Play } from "lucide-react";

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const observerRef = useRef();
  const limit = 12;

  const fetchVideos = useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);
    try {
      // Endpoint is GET /videos with query params: page, limit, sortBy, sortType
      const response = await api.get("/videos", {
        params: {
          page: pageNum,
          limit,
          sortBy: "createdAt",
          sortType: "desc",
        },
      });

      // The API directly returns { success: true, count: videos.length, videos: [...] }
      const fetchedVideos = response.data?.videos || [];

      setVideos((prev) => {
        // Avoid duplicate videos
        const existingIds = new Set(prev.map((v) => v._id));
        const filtered = fetchedVideos.filter((v) => !existingIds.has(v._id));
        return [...prev, ...filtered];
      });

      // If count fetched is less than limit, then there are no more videos to load
      if (fetchedVideos.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch {
      setError("Failed to load videos. Please try again.");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  // Fetch initial videos
  useEffect(() => {
    fetchVideos(1);
  }, [fetchVideos]);

  // Load next page
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVideos(nextPage);
    }
  }, [loading, hasMore, page, fetchVideos]);

  // Intersection Observer for Infinite Scroll
  const lastElementRef = useCallback(
    (node) => {
      if (loading || initialLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, initialLoading, hasMore, loadMore]
  );

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold font-heading text-white">Recommended</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <VideoSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => {
            setInitialLoading(true);
            setPage(1);
            setVideos([]);
            fetchVideos(1);
          }}
          className="rounded-full bg-purple-600 px-6 py-2.5 text-sm font-semibold hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 border border-gray-800 text-purple-500">
          <Play className="h-6 w-6 ml-0.5" />
        </div>
        <h3 className="text-lg font-bold text-white">No videos found</h3>
        <p className="mt-1 text-sm text-gray-500 max-w-xs">
          Looks like there are no videos published yet. Be the first to upload one!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-heading text-white">Recommended</h2>
      
      {/* Video Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {videos.map((video) => (
          <VideoCard key={video._id} video={video} />
        ))}
        
        {/* Loading skeletons for infinite scroll loading */}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <VideoSkeleton key={`loading-${i}`} />
          ))}
      </div>

      {/* Invisible element at bottom to trigger observer */}
      <div ref={lastElementRef} className="h-10 w-full pointer-events-none"></div>

      {/* End of content display */}
      {!hasMore && videos.length > 0 && (
        <div className="text-center text-xs text-gray-500 py-8">
          You've reached the end of the feed.
        </div>
      )}
    </div>
  );
};

export default Home;
