"use client";
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  List,
  Maximize2
} from "lucide-react";

import Data from "../../../../Data.json";

export default function MusicPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // AUDIO STATE
  const [currentSong, setCurrentSong] = useState({
    title: "Select a song",
    url: "",
    artist: "",
    cover: ""
  });
  const [activeSongTitle, setActiveSongTitle] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState("off");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [player, setPlayer] = useState(null);

  // YOUTUBE API
  useEffect(() => {
    if (window.YT) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }, []);

  // CATEGORIES
  const categories = useMemo(() => {
    const all = new Set(["All"]);
    Data?.music_artists?.forEach((a) => a.genre?.forEach((g) => all.add(g)));
    return Array.from(all);
  }, []);

  // FILTERED CONTENT
  const displayedContent = useMemo(() => {
    return Data.music_artists
      .map((artist) => {
        const matchCat =
          activeCategory === "All" ||
          artist.genre.some((g) =>
            g.toLowerCase().includes(activeCategory.toLowerCase())
          );

        if (!matchCat) return null;

        const songs = artist.songs.filter(
          (s) =>
            artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (songs.length === 0) return null;

        return { ...artist, songs };
      })
      .filter(Boolean);
  }, [activeCategory, searchQuery]);

  // HELPER
  const getYouTubeId = (url) => {
    if (!url) return "";
    try {
      if (url.includes("youtu.be")) return url.split("youtu.be/")[1].split("?")[0];
      if (url.includes("v=")) return url.split("v=")[1].split("&")[0];
      return "";
    } catch {
      return "";
    }
  };
  const cleanUrl = (url) => {
    const id = getYouTubeId(url);
    return id ? `https://www.youtube.com/embed/${id}` : url;
  };

  const initPlayer = (videoId) => {
    if (!window.YT || !window.YT.Player) {
      setTimeout(() => initPlayer(videoId), 100);
      return;
    }

    if (player) {
      player.loadVideoById(videoId);
      player.playVideo();
      return;
    }

    const newPlayer = new window.YT.Player("youtube-player", {
      height: "0",
      width: "0",
      videoId,
      playerVars: { autoplay: 1, controls: 0 },
      events: {
        onReady: (event) => {
          setPlayer(event.target);
          event.target.setVolume(volume * 100);
          event.target.playVideo();
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            setDuration(event.target.getDuration());
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          } else if (event.data === window.YT.PlayerState.ENDED) {
            handleNext();
          }
        }
      }
    });
  };

  // PROGRESS UPDATE
  useEffect(() => {
    if (!player || !isPlaying) return;
    const interval = setInterval(() => {
      if (player.getCurrentTime) setCurrentTime(player.getCurrentTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [player, isPlaying]);

  useEffect(() => {
    if (player && player.setVolume) player.setVolume(volume * 100);
  }, [volume, player]);

  // QUEUE
  const generateQueue = useCallback(() => {
    const q = [];
    displayedContent.forEach((artist) =>
      artist.songs.forEach((song) => q.push({ ...song, artist: artist.name, cover: song.cover || "" }))
    );
    return q;
  }, [displayedContent]);

  useEffect(() => setQueue(generateQueue()), [generateQueue]);

  const handlePlaySong = (song, artistName, coverImage, indexInQueue) => {
    const videoId = getYouTubeId(song.url);
    if (activeSongTitle === song.title) {
      if (player) isPlaying ? player.pauseVideo() : player.playVideo();
      return;
    }
    setCurrentSong({ title: song.title, url: cleanUrl(song.url), artist: artistName, cover: coverImage });
    setActiveSongTitle(song.title);
    setCurrentIndex(indexInQueue);
    setCurrentTime(0);
    initPlayer(videoId);
  };

  const playAtIndex = (index) => {
    if (!queue.length || index < 0 || index >= queue.length) return;
    const song = queue[index];
    handlePlaySong(song, song.artist, song.cover, index);
  };

  const handleNext = () => {
    if (!queue.length) return;
    if (repeatMode === "one" && player) {
      player.seekTo(0);
      player.playVideo();
      return;
    }
    if (isShuffled) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      playAtIndex(randomIndex);
    } else {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === "all") nextIndex = 0;
        else return setIsPlaying(false);
      }
      playAtIndex(nextIndex);
    }
  };

  const handlePrev = () => {
    if (!queue.length) return;
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = queue.length - 1;
    playAtIndex(prevIndex);
  };

  const toggleShuffle = () => setIsShuffled(!isShuffled);
  const toggleRepeat = () => {
    const modes = ["off", "all", "one"];
    setRepeatMode(modes[(modes.indexOf(repeatMode) + 1) % 3]);
  };
  const togglePlayPause = () => { if (player) isPlaying ? player.pauseVideo() : player.playVideo(); };
  const formatTime = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col h-screen w-full bg-[#1a2332] text-white overflow-hidden">

      {/* Hidden YT Player */}
      <div id="youtube-player" style={{ display: 'none' }}></div>

      {/* Categories */}
      <div className="px-6 pt-6 pb-4 flex gap-3 overflow-x-auto scrollbar-hide">
        {categories.map(c => (
          <button key={c} onClick={() => setActiveCategory(c)}
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeCategory === c ? "bg-red-600 text-white" : "bg-[#2a3544] text-gray-300"}`}>{c}</button>
        ))}
      </div>

      {/* Songs Content */}
      <div className="flex-1 px-6 overflow-y-auto scrollbar-hide">
        {displayedContent.map((artist, aIdx) => (
          <div key={aIdx} className="mb-10">
            <h2 className="text-3xl font-bold mb-2">{artist.name}</h2>
            <div className="flex gap-2 mb-4">{artist.genre.map((g, i) => <span key={i} className="px-3 py-1 bg-[#2a3544] text-xs rounded text-gray-300">{g}</span>)}</div>
            {artist.biography && <p className="text-sm text-gray-400 mb-4">{artist.biography}</p>}
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {artist.songs.map((song, sIdx) => {
                const cover = song.cover || "";
                const isActive = activeSongTitle === song.title;
                const globalIndex = queue.findIndex(q => q.title === song.title && q.artist === artist.name);
                return (
                  <div key={sIdx} className="flex-shrink-0 w-40 cursor-pointer" onClick={() => handlePlaySong(song, artist.name, cover, globalIndex)}>
                    <div className="bg-[#2a3544] rounded-2xl overflow-hidden">
                      <div className="relative aspect-square p-2">
                        <img src={cover} alt={song.title} className="w-full h-full object-cover rounded-xl" />
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                              {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="px-3 pb-2">
                        <h3 className="font-semibold text-sm truncate mb-1">{song.title}</h3>
                        <p className="text-xs text-gray-400 truncate">{artist.name}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* CONTROL PANEL ALWAYS AT BOTTOM */}
      <div className="sticky bottom-0 left-0 right-0 bg-[#0f1824] px-6 py-4 border-t border-gray-800 flex-shrink-0">
        {/* --- Keep your control panel content exactly as before --- */}
        {/* Left: Song Info */}
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3 w-72">
            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
              <img src={currentSong.cover} alt={currentSong.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{currentSong.title}</h4>
              <p className="text-xs text-gray-400 truncate">{currentSong.artist}</p>
            </div>
            <button onClick={() => setIsLiked(!isLiked)}>
              <Heart className={`w-5 h-5 ${isLiked ? "fill-pink-500 text-pink-500" : "text-gray-400"}`} />
            </button>
          </div>

          {/* Center Controls */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-6">
              <button onClick={toggleShuffle} className={`${isShuffled ? "text-red-500" : "text-gray-400"}`}><Shuffle className="w-5 h-5" /></button>
              <button onClick={handlePrev} className="text-gray-400"><SkipBack className="w-6 h-6" /></button>
              <button onClick={togglePlayPause} className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
              </button>
              <button onClick={handleNext} className="text-gray-400"><SkipForward className="w-6 h-6" /></button>
              <button onClick={toggleRepeat} className={`${repeatMode !== "off" ? "text-red-500" : "text-gray-400"}`}><Repeat className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <div className="w-48 h-1 bg-gray-700 rounded-full">
                <div className="h-full bg-white rounded-full" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4 w-72 justify-end">
            <button className="text-gray-400"><List className="w-5 h-5" /></button>
            <button className="text-gray-400"><Volume2 className="w-5 h-5" /></button>
            <div className="w-24 h-1 bg-gray-700 rounded-full cursor-pointer" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const newVol = (e.clientX - rect.left) / rect.width;
              setVolume(Math.min(1, Math.max(0, newVol)));
            }}>
              <div className="h-full bg-white rounded-full" style={{ width: `${volume * 100}%` }} />
            </div>
            <button className="text-gray-400"><Maximize2 className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Hide all scrollbars */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
