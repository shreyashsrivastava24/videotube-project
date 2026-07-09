import React from "react";
import { Link } from "react-router-dom";
import { formatDuration, formatTimeAgo, formatViews } from "../utils";

const VideoCard = ({ video }) => {
  const { _id, title, thumbnail, duration, views, createdAt, owner } = video;

  return (
    <div className="group flex flex-col gap-2 rounded-2xl bg-gray-900/20 p-2 border border-transparent transition-all duration-300 hover:bg-gray-900/60 hover:border-gray-800">
      {/* Thumbnail Container */}
      <Link to={`/watch/${_id}`} className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-900">
        <img
          src={thumbnail || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=60"}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Duration Overlay */}
        <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-semibold tracking-wider text-white">
          {formatDuration(duration)}
        </span>
      </Link>

      {/* Details Row */}
      <div className="flex gap-3 px-1 py-2">
        {/* Owner Avatar */}
        <Link to={`/c/${owner?.username}`} className="avatar h-9 w-9 shrink-0">
          <img
            src={owner?.avatar || "https://api.dicebear.com/7.x/adventurer/svg"}
            alt={owner?.username || "channel"}
            className="border border-gray-800"
          />
        </Link>

        {/* Text Details */}
        <div className="flex-1 overflow-hidden">
          <Link to={`/watch/${_id}`} className="block">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white hover:text-purple-400 transition-colors">
              {title}
            </h3>
          </Link>
          <Link to={`/c/${owner?.username}`} className="mt-1 block text-xs text-gray-400 hover:text-white transition-colors">
            {owner?.fullName || "Unknown Channel"}
          </Link>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
            <span>{formatViews(views)}</span>
            <span className="h-1 w-1 rounded-full bg-gray-700"></span>
            <span>{formatTimeAgo(createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
