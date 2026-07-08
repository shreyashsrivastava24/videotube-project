import React from "react";

const VideoSkeleton = () => {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-gray-900/20 p-2 border border-transparent animate-pulse">
      {/* Thumbnail Skeleton */}
      <div className="aspect-video w-full rounded-xl bg-gray-800"></div>

      {/* Details Row Skeleton */}
      <div className="flex gap-3 px-1 py-2">
        {/* Avatar Skeleton */}
        <div className="h-9 w-9 rounded-full bg-gray-800 shrink-0"></div>

        {/* Text Skeletons */}
        <div className="flex-1 space-y-2">
          <div className="h-4 rounded bg-gray-800 w-5/6"></div>
          <div className="h-3 rounded bg-gray-800 w-2/3"></div>
          <div className="flex gap-2">
            <div className="h-3 rounded bg-gray-800 w-1/4"></div>
            <div className="h-3 rounded bg-gray-800 w-1/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSkeleton;
