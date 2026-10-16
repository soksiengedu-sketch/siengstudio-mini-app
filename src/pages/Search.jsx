import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import DramaCard from '../components/DramaCard';
import { Search as SearchIcon, X, Filter } from 'lucide-react';
import { haptic } from '../services/telegram';

export default function Search() {
  const { t, lang } = useApp();
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [allDramas, setAllDramas] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchDramas = () => {
      api.getDramas().then((data) => {
        setAllDramas(data || []);
        setResults(data || []);
      });
    };
    fetchDramas();
    const handleUpdate = () => fetchDramas();
    window.addEventListener('siengstudio_dramas_updated', handleUpdate);
    return () => window.removeEventListener('siengstudio_dramas_updated', handleUpdate);
  }, []);

  const tags = [
    'Romance',
    'CEO',
    'Revenge',
    'Action',
    'Comedy',
    'Mystery',
    'Khmer Dubbed',
    'VIP'
  ];

  const handleSearch = (q, tag) => {
    let filtered = allDramas;
    if (tag) {
      if (tag === 'VIP') {
        filtered = filtered.filter((d) => d.isVipOnly);
      } else {
        filtered = filtered.filter((d) => d.genres?.includes(tag) || (tag === 'Khmer Dubbed' && d.isKhmerDubbed));
      }
    }
    if (q.trim()) {
      const lower = q.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title?.toLowerCase().includes(lower) ||
          d.titleKm?.includes(q) ||
          d.description?.toLowerCase().includes(lower) ||
          d.descriptionKm?.includes(q) ||
          d.genres?.some((g) => g.toLowerCase().includes(lower))
      );
    }
    setResults(filtered);
  };

  const onQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    handleSearch(val, selectedTag);
  };

  const onTagClick = (tag) => {
    haptic.select();
    const newTag = selectedTag === tag ? '' : tag;
    setSelectedTag(newTag);
    handleSearch(query, newTag);
  };

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 pt-4 max-w-7xl mx-auto">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <SearchIcon size={18} className="absolute left-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={onQueryChange}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-10 pr-10 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              handleSearch('', selectedTag);
            }}
            className="absolute right-3.5 p-1 rounded-full bg-white/10 text-gray-400 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Quick Tags */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-3.5">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagClick(tag)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTag === tag
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-900/30'
                : 'bg-white/5 text-gray-400 hover:text-white border border-white/5 hover:bg-white/10'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Results Section */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400 font-medium">
            រកឃើញ {results.length} {lang === 'km' ? 'រឿង' : 'dramas'}
          </p>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Filter size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">{t('noResults')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
            {results.map((drama) => (
              <DramaCard key={drama.id} drama={drama} size="grid" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
