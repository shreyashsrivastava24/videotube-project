import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  Loader2,
  AlertCircle,
  Settings,
} from "lucide-react";
import { formatDuration } from "../utils";

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const VideoPlayer = ({ src, poster, title }) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hideControlsTimer = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [buffered, setBuffered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
        setSpeedMenuOpen(false);
      }
    }, 3000);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || error) return;
    if (video.paused) {
      video.play().catch(() => setError("Playback was blocked. Click play to start."));
    } else {
      video.pause();
    }
  }, [error]);

  const handleSeek = useCallback(
    (e) => {
      const video = videoRef.current;
      if (!video || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      video.currentTime = percent * duration;
      setCurrentTime(video.currentTime);
    },
    [duration]
  );

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setMuted(val === 0);
    }
  };

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (muted || volume === 0) {
      const restored = volume === 0 ? 1 : volume;
      video.volume = restored;
      video.muted = false;
      setVolume(restored);
      setMuted(false);
    } else {
      video.muted = true;
      setMuted(true);
    }
  }, [muted, volume]);

  const changeSpeed = (rate) => {
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setSpeedMenuOpen(false);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not supported or denied
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch {
      // PiP not supported or denied
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => { setPlaying(true); setLoading(false); resetHideTimer(); };
    const onPause = () => { setPlaying(false); setShowControls(true); };
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration || 0);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setMuted(video.muted);
    };
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onPlaying = () => setLoading(false);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onError = () => {
      setLoading(false);
      setError("Unable to load video. The file may be unavailable or unsupported.");
    };
    const onEnterPiP = () => setIsPiP(true);
    const onLeavePiP = () => setIsPiP(false);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("progress", onProgress);
    video.addEventListener("error", onError);
    video.addEventListener("enterpictureinpicture", onEnterPiP);
    video.addEventListener("leavepictureinpicture", onLeavePiP);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("error", onError);
      video.removeEventListener("enterpictureinpicture", onEnterPiP);
      video.removeEventListener("leavepictureinpicture", onLeavePiP);
    };
  }, [resetHideTimer]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!containerRef.current?.contains(document.activeElement) &&
          document.activeElement !== document.body) return;

      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime -= 5;
          break;
        case "ArrowRight":
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime += 5;
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume((v) => {
            const next = Math.min(1, v + 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume((v) => {
            const next = Math.max(0, v - 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlay, toggleMute]);

  useEffect(() => {
    setError(null);
    setLoading(true);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
  }, [src]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;
  const supportsPiP = typeof document !== "undefined" && document.pictureInPictureEnabled;

  return (
    <div
      ref={containerRef}
      className="video-player group relative w-full overflow-hidden rounded-2xl bg-black border border-gray-800 shadow-2xl"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => {
        if (playing) setShowControls(false);
      }}
      onClick={() => containerRef.current?.focus()}
      tabIndex={0}
      role="region"
      aria-label={title ? `Video player: ${title}` : "Video player"}
    >
      <div className="relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="video-player-element absolute inset-0 h-full w-full"
          playsInline
          preload="metadata"
          onClick={togglePlay}
        />

        {/* Loading spinner */}
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
            <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
            <p className="text-sm text-gray-300 max-w-xs">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                if (videoRef.current) videoRef.current.load();
              }}
              className="mt-4 rounded-full bg-purple-600 px-5 py-2 text-xs font-semibold hover:bg-purple-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Center play button when paused */}
        {!playing && !loading && !error && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity"
            aria-label="Play"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600/90 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-600 hover:scale-105 transition-all">
              <Play className="h-7 w-7 ml-1" fill="currentColor" />
            </div>
          </button>
        )}

        {/* Controls overlay */}
        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-3 pt-10 transition-opacity duration-300 ${
            showControls || !playing ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Progress bar */}
          <div
            className="group/progress relative mb-2 h-1.5 w-full cursor-pointer rounded-full bg-gray-700/80"
            onClick={handleSeek}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gray-500/60"
              style={{ width: `${bufferedPercent}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-purple-500"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-purple-400 opacity-0 shadow-md transition-opacity group-hover/progress:opacity-100"
              style={{ left: `calc(${progressPercent}% - 7px)` }}
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" fill="currentColor" />}
            </button>

            {/* Volume — mobile mute toggle, desktop slider */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={toggleMute}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors sm:hidden"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <div className="hidden sm:flex items-center gap-1.5">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="video-volume-slider w-16 accent-purple-500"
                aria-label="Volume"
              />
              </div>
            </div>

            {/* Time */}
            <span className="text-[11px] sm:text-xs text-gray-300 tabular-nums shrink-0">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>

            <div className="flex-1" />

            {/* Playback speed */}
            <div className="relative shrink-0">
              <button
                onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                aria-label="Playback speed"
              >
                <Settings className="h-3.5 w-3.5 sm:hidden" />
                <span>{playbackRate === 1 ? "1x" : `${playbackRate}x`}</span>
              </button>
              {speedMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 rounded-xl bg-gray-900 border border-gray-700 py-1 shadow-xl min-w-[80px]">
                  {PLAYBACK_SPEEDS.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changeSpeed(rate)}
                      className={`block w-full px-4 py-1.5 text-left text-xs hover:bg-gray-800 transition-colors ${
                        playbackRate === rate ? "text-purple-400 font-semibold" : "text-gray-300"
                      }`}
                    >
                      {rate === 1 ? "Normal" : `${rate}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PiP */}
            {supportsPiP && (
              <button
                onClick={togglePiP}
                className={`hidden sm:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 transition-colors shrink-0 ${
                  isPiP ? "text-purple-400" : "text-white"
                }`}
                aria-label="Picture in picture"
              >
                <PictureInPicture2 className="h-4 w-4" />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
