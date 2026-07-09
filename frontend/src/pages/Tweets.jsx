import React from "react";
import TweetList from "../components/TweetList";

const Tweets = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">Tweets</h1>
        <p className="text-xs text-gray-400 mt-1">Share quick thoughts with the community</p>
      </div>

      <TweetList
        feed
        showComposer
        emptyMessage="No tweets yet. Be the first to share something!"
      />
    </div>
  );
};

export default Tweets;
