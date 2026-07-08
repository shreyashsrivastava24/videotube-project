export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

export const formatViews = (views) => {
  if (views === undefined || views === null) return "0 views";
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1).replace(/\.0$/, "")}M views`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}K views`;
  }
  return `${views} view${views === 1 ? "" : "s"}`;
};

export const getErrorMessage = (error, defaultMsg = "An error occurred") => {
  if (!error) return defaultMsg;
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  const status = error.response?.status;
  if (status) {
    switch (status) {
      case 400:
        return "Required fields are missing or invalid.";
      case 401:
        return "Unauthorized. Please log in again.";
      case 403:
        return "Access denied. You do not have permission.";
      case 404:
        return "Requested resource not found.";
      case 409:
        return "User already exists with this username or email.";
      case 500:
        return "Internal server error. Please try again later.";
      default:
        break;
    }
  }
  if (error.message === "Network Error") {
    return "Network error. Please check if the backend server is running.";
  }
  return error.message || defaultMsg;
};

