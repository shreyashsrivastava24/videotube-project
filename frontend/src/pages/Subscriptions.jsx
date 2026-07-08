import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { Users, Loader2 } from "lucide-react";

const Subscriptions = () => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await api.get("/subscriptions/me/subscriptions");
        setChannels(response.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-800 pb-4">
        <div className="rounded-xl bg-purple-600/10 border border-purple-500/20 p-2 text-purple-400">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-heading text-white">Subscriptions</h2>
          <p className="text-xs text-gray-500">{channels.length} channels subscribed</p>
        </div>
      </div>

      {channels.length === 0 ? (
        <div className="text-center py-20 text-sm text-gray-500">
          You haven't subscribed to any channels yet!
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {channels.map((chan) => (
            <Link
              key={chan._id}
              to={`/c/${chan.username}`}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-gray-900/20 border border-transparent hover:bg-gray-900/50 hover:border-gray-800 transition-colors"
            >
              <img
                src={chan.avatar || "https://api.dicebear.com/7.x/adventurer/svg"}
                alt="avatar"
                className="h-16 w-16 rounded-full border border-purple-500/10 object-cover mb-3"
              />
              <span className="block text-sm font-semibold text-white truncate max-w-full">
                {chan.fullName}
              </span>
              <span className="block text-[10px] text-gray-500">@{chan.username}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
