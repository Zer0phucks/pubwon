/**
 * Subreddit Selection Component
 * Phase 3.4: Subreddit Selection UI
 */
'use client';

import { useState } from 'react';
import type { SubredditSuggestion } from '@/types';

interface SubredditSelectorProps {
  suggestions: SubredditSuggestion[];
  onSelect: (selected: SubredditSuggestion[]) => void;
  onSearch?: (query: string) => void;
}

export function SubredditSelector({ suggestions, onSelect, onSearch }: SubredditSelectorProps) {
  const [selectedSubreddits, setSelectedSubreddits] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSubreddit = (subreddit: SubredditSuggestion) => {
    const newSelected = new Set(selectedSubreddits);
    if (newSelected.has(subreddit.name)) {
      newSelected.delete(subreddit.name);
    } else {
      newSelected.add(subreddit.name);
    }
    setSelectedSubreddits(newSelected);
  };

  const handleConfirm = () => {
    const selected = suggestions.filter((sr) => selectedSubreddits.has(sr.name));
    onSelect(selected);
  };

  const handleSearch = () => {
    if (onSearch && searchQuery) {
      onSearch(searchQuery);
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-blue-100 text-blue-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      {onSearch && (
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for additional subreddits..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      )}

      {/* Selection Counter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {selectedSubreddits.size} subreddit{selectedSubreddits.size !== 1 ? 's' : ''} selected
        </p>
        <button
          onClick={handleConfirm}
          disabled={selectedSubreddits.size === 0}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Confirm Selection
        </button>
      </div>

      {/* Subreddit List */}
      <div className="grid gap-4">
        {suggestions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No subreddits found</p>
        ) : (
          suggestions.map((subreddit) => {
            const isSelected = selectedSubreddits.has(subreddit.name);

            return (
              <div
                key={subreddit.name}
                onClick={() => toggleSubreddit(subreddit)}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">r/{subreddit.displayName}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${getRelevanceColor(subreddit.relevanceScore)}`}
                      >
                        {subreddit.relevanceScore}% relevant
                      </span>
                    </div>

                    {subreddit.description && (
                      <p className="text-sm text-gray-600 mt-2">{subreddit.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>👥 {subreddit.subscribers.toLocaleString()} subscribers</span>
                      {subreddit.relevanceReason && (
                        <span className="text-blue-600">{subreddit.relevanceReason}</span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="ml-4">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
