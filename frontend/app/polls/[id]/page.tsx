'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Poll, Choice } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';

interface PollDetailPageProps {
  params: {
    id: string;
  };
}

export default function PollDetailPage({ params }: PollDetailPageProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const { state } = useAuth();

  // Fetch poll details
  const fetchPoll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const pollData = await apiClient.getPoll(parseInt(params.id));
      setPoll(pollData);

      // Set selected choice if user has already voted
      if (pollData.user_has_voted && pollData.user_choice_id) {
        setSelectedChoiceId(pollData.user_choice_id);
      }
    } catch (err) {
      setError('Failed to load poll. Please try again.');
      console.error('Error fetching poll:', err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  // Handle voting
  const handleVote = async () => {
    if (!selectedChoiceId || !state.isAuthenticated) return;

    setIsVoting(true);
    setVoteError(null);

    try {
      await apiClient.vote(parseInt(params.id), selectedChoiceId);
      // Refresh poll data to show updated results
      await fetchPoll();
    } catch (err) {
      setVoteError('Failed to submit vote. Please try again.');
      console.error('Error voting:', err);
    } finally {
      setIsVoting(false);
    }
  };

  // Calculate vote percentage
  const calculatePercentage = (votes: number, total: number): number => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Poll Not Found</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={fetchPoll}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/polls"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Back to Polls
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Poll not found
  if (!poll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Poll not found</h3>
          <Link href="/polls" className="text-blue-600 hover:text-blue-500">
            Back to polls
          </Link>
        </div>
      </div>
    );
  }

  const hasVoted = poll.user_has_voted;
  const showResults = hasVoted || !state.isAuthenticated;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/polls" className="text-gray-500 hover:text-gray-700 transition-colors">
                Polls
              </Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
            </li>
            <li>
              <span className="text-gray-900 font-medium" aria-current="page">
                {poll.question}
              </span>
            </li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Poll header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {poll.question}
            </h1>

            {poll.description && (
              <p className="text-lg text-gray-600 mb-6">
                {poll.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}
              </div>

              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Published {formatDate(poll.pub_date)}
              </div>

              {poll.created_by_username && (
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Created by {poll.created_by_username}
                </div>
              )}
            </div>

            {hasVoted && (
              <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                You have voted
              </div>
            )}
          </div>

          {/* Voting section or results */}
          <div className="px-6 py-8">
            {!state.isAuthenticated && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-800">
                      <Link href="/auth/login" className="font-medium underline hover:no-underline">
                        Sign in
                      </Link>
                      {' '}or{' '}
                      <Link href="/auth/register" className="font-medium underline hover:no-underline">
                        create an account
                      </Link>
                      {' '}to participate in this poll.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {poll.choices.map((choice: Choice) => {
                const percentage = calculatePercentage(choice.votes, poll.total_votes);
                const isSelected = selectedChoiceId === choice.id;
                const isUserChoice = hasVoted && poll.user_choice_id === choice.id;

                return (
                  <div key={choice.id} className="relative">
                    {showResults ? (
                      // Results view
                      <div className={`relative bg-gray-50 rounded-lg p-4 border-2 ${
                        isUserChoice ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900">
                            {choice.choice_text}
                            {isUserChoice && (
                              <span className="ml-2 text-sm text-green-600 font-medium">
                                (Your choice)
                              </span>
                            )}
                          </span>
                          <span className="text-sm font-medium text-gray-600">
                            {choice.votes} votes ({percentage}%)
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isUserChoice ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      // Voting view
                      <label className={`relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                        <input
                          type="radio"
                          name="poll-choice"
                          value={choice.id}
                          checked={isSelected}
                          onChange={() => setSelectedChoiceId(choice.id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-900 font-medium">
                          {choice.choice_text}
                        </span>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Vote button */}
            {state.isAuthenticated && !hasVoted && (
              <div className="mt-6">
                {voteError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-800">{voteError}</p>
                  </div>
                )}

                <button
                  onClick={handleVote}
                  disabled={!selectedChoiceId || isVoting}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isVoting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting Vote...
                    </div>
                  ) : (
                    'Submit Vote'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Back to polls */}
        <div className="mt-6">
          <Link
            href="/polls"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to all polls
          </Link>
        </div>
      </div>
    </div>
  );
}
