'use client';
import dynamic from 'next/dynamic';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Heart,
  MoreHorizontal,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  Maximize2,
  ListMusic
} from 'lucide-react';
import Image from 'next/image';
import Data from '../../../../Data.json';

// Pool of images to rotate through since Data.json doesn't strictly provide song covers
const COVER_IMAGES = [
  '/img1.jpg',
  '/img2.jpg',
  '/img3.jpg',
  '/img4.jpg',
  '/mfy1.jpg',
  '/music.jpg',
  '/Teni1.jpg',
  '/Magasco.jpg',
  '/CeCe Winans.jpeg',
  '/music4.jpg'
];

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

export default function MusicPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isLiked, setIsLiked] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleSongsCount, setVisibleSongsCount] = useState(10);

  const [allSongs, setAllSongs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate data fetching with useEffect
  useEffect(() => {
    setIsLoading(true);
    // Simulate API delay
    const timer = setTimeout(() => {
      // 1. Process Songs
      let songIdCounter = 1;
      const processedSongs = Data.music_artists.flatMap((artist, artistIndex) => {
        const primaryGenre = artist.genre && artist.genre.length > 0 ? artist.genre[0] : 'Unknown';
        return artist.songs.map((song, songIndex) => {
          const imageIndex = (artistIndex + songIndex) % COVER_IMAGES.length;
          return {
            id: songIdCounter++,
            title: song.title,
            artist: artist.name,
            category: primaryGenre,
            cover: COVER_IMAGES[imageIndex],
            url: song.url,
            duration: '3:45',
          };
        });
      });
      setAllSongs(processedSongs);

      // 2. Process Categories
      const normalizeGenre = (genre) => {
        const g = genre.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (g === 'afropop' || g === 'afropops') return 'Afropop';
        if (g === 'afrobeat' || g === 'afrobeats') return 'Afrobeats';
        if (g === 'hiphop') return 'Hip-Hop';
        if (g === 'afrofusion') return 'Afro-Fusion';
        if (g === 'makosa' || g === 'makossa') return 'Makossa';
        return genre.charAt(0).toUpperCase() + genre.slice(1);
      };

      const genres = new Set();
      Data.music_artists.forEach(artist => {
        artist.genre.forEach(g => genres.add(normalizeGenre(g)));
      });

      let genreList = Array.from(genres);
      const makossaIndex = genreList.indexOf('Makossa');
      if (makossaIndex > -1) {
        genreList.splice(makossaIndex, 1);
        genreList = ['Makossa', ...genreList];
      }
      setCategories(['All', ...genreList]);

      setIsLoading(false);
    }, 500); // 500ms delay to show loading state

    return () => clearTimeout(timer);
  }, []);

  // Filter songs based on category and search query
  const filteredSongs = useMemo(() => {
    return allSongs.filter(song => {
      const normalizeGenre = (genre) => {
        const g = genre.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (g === 'afropop' || g === 'afropops') return 'Afropop';
        if (g === 'afrobeat' || g === 'afrobeats') return 'Afrobeats';
        if (g === 'hiphop') return 'Hip-Hop';
        if (g === 'afrofusion') return 'Afro-Fusion';
        if (g === 'makosa' || g === 'makossa') return 'Makossa';
        return genre.charAt(0).toUpperCase() + genre.slice(1);
      }

      const songCategory = normalizeGenre(song.category);
      const matchesCategory = activeCategory === 'All' || songCategory === activeCategory;
      const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, allSongs]);

  const displayedSongs = useMemo(() => {
    return filteredSongs.slice(0, visibleSongsCount);
  }, [filteredSongs, visibleSongsCount]);

  // Placeholder state for no song selected
  const [currentSong, setCurrentSong] = useState({
    title: 'Select a song',
    artist: 'Artist',
    cover: '/img1.jpg',
    duration: '--:--',
    currentTime: '0:00',
    url: ''
  });

  // Update currentSong when allSongs is populated for the first time
  useEffect(() => {
    if (allSongs.length > 0 && currentSong.title === 'Select a song') {
      setCurrentSong({
        ...allSongs[0],
        currentTime: '0:00'
      });
    }
  }, [allSongs]);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Format time helper
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlaySong = (song) => {
    if (currentSong.id === song.id) {
      // Toggle play/pause if same song
      setIsPlaying(!isPlaying);
    } else {
      // New song
      setCurrentSong(song);
      setIsPlaying(true);
      setProgress(0);
      setIsReady(false);
    }
  };

  // No need for manual audio Ref effects as ReactPlayer handles props

  const handleProgress = ({ playedSeconds }) => {
    // Only update progress if we're not seeking (optional optimization, but simple set is fine)
    setProgress(playedSeconds);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-gray-900 text-white rounded-3xl overflow-hidden relative font-sans">

      {/* Top Bar with Search */}
      <div className="p-6 pb-2 flex justify-end items-center z-10">
        <div className="relative w-72">
          <input
            type="text"
            placeholder="Search songs, artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 text-sm text-gray-300 rounded-full py-2.5 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-red-600/50 placeholder-gray-500"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-8 pb-32 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
            <p>Loading your music...</p>
          </div>
        ) : (
          <>
            {/* Categories */}
            <div className="flex space-x-4 mb-8 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${activeCategory === category
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Songs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {displayedSongs.length > 0 ? (
                displayedSongs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => handlePlaySong(song)}
                    className={`p-4 rounded-2xl group transition-all duration-300 cursor-pointer hover:-translate-y-1 ${currentSong.id === song.id && isPlaying
                      ? 'bg-slate-700/80 border border-red-500/50 shadow-lg shadow-red-500/10'
                      : 'bg-slate-800/40 hover:bg-slate-800/80'
                      }`}
                  >
                    <div className="relative aspect-square mb-4 rounded-xl overflow-hidden shadow-lg">
                      <Image
                        src={song.cover}
                        alt={song.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px] ${currentSong.id === song.id && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                        <button className="bg-red-600 text-white p-3 rounded-full transform transition-transform duration-300 hover:bg-red-700 shadow-xl">
                          {currentSong.id === song.id && isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-100 truncate mb-1">{song.title}</h3>
                    <p className="text-sm text-gray-400 truncate">{song.artist}</p>

                    {/* Category tag - visual indicator based on category hashing */}
                    <div className={`h-1 w-full mt-3 rounded-full ${song.category === 'Makossa' || song.category === 'Makosa' ? 'bg-red-500' :
                      song.category === 'Bikusi' ? 'bg-blue-500' :
                        song.category === 'Afro-Fusion' || song.category === 'Afropop' ? 'bg-purple-500' :
                          song.category === 'Hip-Hop' || song.category === 'Hip-hop' ? 'bg-orange-500' : 'bg-green-500'
                      }`}></div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-12">
                  <p>No songs found matching your criteria.</p>
                </div>
              )}
            </div>

            {/* Load More Button */}
            {visibleSongsCount < filteredSongs.length && (
              <div className="mt-12 mb-8 flex justify-center">
                <button
                  onClick={() => setVisibleSongsCount(prev => prev + 10)}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-red-600/20"
                >
                  <span>Load More</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Player Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-[#0a0f1d]/95 backdrop-blur-xl border-t border-gray-800/50 px-8 flex items-center justify-between z-20">

        {/* Track Info */}
        <div className="flex items-center w-1/4 min-w-[200px]">
          <div className="w-14 h-14 relative rounded-xl overflow-hidden mr-4 shadow-lg">
            <div className="bg-gradient-to-br from-green-800 to-black w-full h-full flex items-center justify-center">
              <Image
                src={currentSong.cover}
                alt="Active Art"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div className="flex-1 mr-4 overflow-hidden">
            <h4 className="font-bold text-white truncate">{currentSong.title}</h4>
            <p className="text-sm text-gray-400 truncate">{currentSong.artist}</p>
          </div>
          <button
            onClick={() => setIsLiked(!isLiked)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
          </button>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center flex-1 max-w-2xl px-8">
          <div className="flex items-center space-x-6 mb-2">
            <button className="text-gray-400 hover:text-white transition-colors">
              <Shuffle className="w-4 h-4" />
            </button>
            <button className="text-gray-300 hover:text-white transition-colors">
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-full transition-all shadow-lg shadow-red-600/20 hover:scale-105"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current pl-1" />}
            </button>
            <button className="text-gray-300 hover:text-white transition-colors">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full flex items-center space-x-3 text-xs font-medium text-gray-500">
            <span>{formatTime(progress)}</span>
            <div
              className="flex-1 h-1 bg-gray-700 rounded-full relative cursor-pointer group"
              onClick={(e) => {
                const width = e.currentTarget.clientWidth;
                const clickX = e.nativeEvent.offsetX;
                const newTime = (clickX / width) * duration; // Calculate safe time?
                // Avoid potential division by zero if duration is 0
                if (duration > 0 && playerRef.current) {
                  playerRef.current.seekTo(newTime);
                  setProgress(newTime);
                }
              }}
            >
              <div
                className="absolute left-0 top-0 h-full bg-red-600 rounded-full group-hover:bg-red-500"
                style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
              ></div>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md"
                style={{ left: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
              ></div>
            </div>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="hidden">
            <ReactPlayer
              ref={playerRef}
              url={currentSong.url}
              playing={isPlaying}
              volume={volume}
              onProgress={handleProgress}
              onDuration={handleDuration}
              onEnded={handleEnded}
              onReady={() => setIsReady(true)}
              width="0"
              height="0"
            />
          </div>
        </div>

        {/* Volume & Extras */}
        <div className="flex items-center justify-end w-1/4 min-w-[200px] space-x-4">
          <button className="text-gray-400 hover:text-white">
            <ListMusic className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 w-32 group">
            <Volume2 className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            <div
              className="flex-1 h-1 bg-gray-700 rounded-full relative cursor-pointer"
              onClick={(e) => {
                const width = e.currentTarget.clientWidth;
                const clickX = e.nativeEvent.offsetX;
                const newVolume = Math.max(0, Math.min(1, clickX / width));
                setVolume(newVolume);
              }}
            >
              <div
                className="absolute left-0 top-0 h-full bg-gray-400 group-hover:bg-white rounded-full transition-colors"
                style={{ width: `${volume * 100}%` }}
              ></div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-white">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}