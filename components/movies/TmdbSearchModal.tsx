"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ITmdbSearchResult, ITmdbDetails } from "@/lib/types";
import { api } from "@/lib/api-client";
import { Search, Loader2, Sparkles, Star, Calendar, Film, Tv, Check } from "lucide-react";

interface TmdbSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType: "MOVIE" | "SERIES";
  onSelect: (details: ITmdbDetails) => void;
}

export function TmdbSearchModal({
  isOpen,
  onClose,
  mediaType,
  onSelect,
}: TmdbSearchModalProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [results, setResults] = useState<ITmdbSearchResult[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const typeParam = mediaType === "SERIES" ? "tv" : "movie";
      const res = await api.tmdb.search(query.trim(), typeParam);
      setResults(res.data?.results || []);
    } catch (err) {
      console.error("TMDB Search Error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = async (item: ITmdbSearchResult) => {
    setSelectedId(item.id);
    setIsLoadingDetails(true);
    try {
      const typeParam = mediaType === "SERIES" ? "tv" : "movie";
      const res = await api.tmdb.getDetails(item.id, typeParam);
      if (res.data) {
        onSelect(res.data);
        onClose();
      }
    } catch (err) {
      console.error("Failed to load TMDB details:", err);
    } finally {
      setIsLoadingDetails(false);
      setSelectedId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Search TMDB for ${mediaType === "SERIES" ? "TV Series" : "Movie"}`}
      subtitle="Auto-fetch synopsis, high-res posters, backdrop, genres, rating, cast and director"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${mediaType === "SERIES" ? "series (e.g. Breaking Bad, Stranger Things)" : "movie (e.g. Oppenheimer, Dune)"}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-200" />}
            <span>Search</span>
          </button>
        </form>

        {/* Results List */}
        <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {isSearching && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-xs">Searching TMDB Database...</p>
            </div>
          )}

          {!isSearching && results.length === 0 && query && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium">No results found on TMDB</p>
              <p className="text-xs text-slate-500 mt-1">Try another title spelling or keyword</p>
            </div>
          )}

          {!isSearching &&
            results.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => !isLoadingDetails && handleSelect(item)}
                  className={`group p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border transition-all cursor-pointer flex gap-4 items-center ${
                    isSelected
                      ? "border-indigo-500 ring-1 ring-indigo-500/30 bg-indigo-950/20"
                      : "border-slate-800/80 hover:border-indigo-500/40"
                  }`}
                >
                  {/* Poster Thumbnail */}
                  <div className="w-14 h-20 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700/60 relative">
                    {item.poster ? (
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        {mediaType === "SERIES" ? <Tv className="w-6 h-6" /> : <Film className="w-6 h-6" />}
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors truncate">
                        {item.title}
                      </h4>
                      {item.releaseYear && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {item.releaseYear}
                        </span>
                      )}
                      {item.rating > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold bg-amber-400/10 px-1.5 py-0.5 rounded">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {item.rating}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.overview || "No synopsis available on TMDB."}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="shrink-0 pl-2">
                    {isSelected && isLoadingDetails ? (
                      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    ) : (
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Select</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </Modal>
  );
}
