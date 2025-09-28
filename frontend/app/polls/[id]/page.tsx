'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Poll, Choice } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { calculatePercentage, formatDateWithTime } from '@/lib/utils';
import SharePoll from '@/components/SharePoll';

interface PollDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PollDetailPage({ params }: PollDetailPageProps) {
  // Use React 18+ 'use' hook to handle async params properly
  const resolvedParams = use(params);

  console.log('PollDetailPage: Direct resolved params:', resolvedParams);  if (!resolvedParams?.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">No poll ID provided in URL.</p>
          <Link
            href="/polls"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Back to Polls
          </Link>
        </div>
      </div>
    );
  }

  return <PollDetailPageClient pollId={resolvedParams.id} />;
}function PollDetailPageClient({ pollId }: { pollId: string }) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const { state } = useAuth();
  const router = useRouter();

  // Delete poll function
  const handleDeletePoll = async () => {
    if (!poll) return;

    setIsDeleting(true);
    try {
      const numericPollId = parseInt(pollId, 10);
      await apiClient.deletePoll(numericPollId);

      // Redirect to polls page after successful deletion
      router.push('/polls');
    } catch (err: unknown) {
      console.error('Error deleting poll:', err);

      // Show error message
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        if (axiosError.response?.data?.error) {
          setError(axiosError.response.data.error);
        } else {
          setError('Failed to delete poll. Please try again.');
        }
      } else {
        setError('Failed to delete poll. Please try again.');
      }
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Early validation of pollId
  useEffect(() => {
    console.log('PollDetailPageClient received pollId:', pollId, '(type:', typeof pollId, ')');

    // Check for obviously invalid pollIds
    if (!pollId || pollId === 'undefined' || pollId === 'null') {
      console.error('PollDetailPageClient received invalid pollId:', pollId);
      setError('Invalid poll ID. Please check the URL.');
      setLoading(false);
      return;
    }

    const numericPollId = parseInt(pollId, 10);
    if (isNaN(numericPollId) || numericPollId <= 0) {
      console.error('PollDetailPageClient: pollId is not a valid positive number:', pollId);
      setError('Invalid poll ID. Please check the URL.');
      setLoading(false);
      return;
    }
  }, [pollId]);

  // Fetch poll details
  const fetchPoll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Early return if already determined to be invalid
      if (!pollId || pollId === 'undefined' || pollId === 'null') {
        setError('Invalid poll ID. Please check the URL.');
        return;
      }

      // Validate poll ID is a valid number
      console.log('fetchPoll: Poll ID from URL:', pollId, '(type:', typeof pollId, ')');
      const numericPollId = parseInt(pollId, 10);
      console.log('fetchPoll: Parsed numeric poll ID:', numericPollId, '(isNaN:', isNaN(numericPollId), ', <= 0:', numericPollId <= 0, ')');

      if (isNaN(numericPollId) || numericPollId <= 0) {
        console.error('fetchPoll: Invalid poll ID validation failed:', {
          pollId,
          numericPollId,
          isNaN: isNaN(numericPollId),
          lessThanOrEqualZero: numericPollId <= 0
        });
        setError('Invalid poll ID. Please check the URL.');
        return;
      }

      console.log('fetchPoll: Making API call with pollId:', numericPollId);
      const pollData = await apiClient.getPoll(numericPollId);
      console.log('fetchPoll: Received poll data:', pollData);
      setPoll(pollData);

      // Set selected choice if user has already voted
      if (pollData.user_has_voted && pollData.user_choice_id) {
        setSelectedChoiceId(pollData.user_choice_id);
      }
    } catch (err) {
      console.error('fetchPoll: Error fetching poll:', err);
      setError('Failed to load poll. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  // Handle voting
  const handleVote = async () => {
    if (!selectedChoiceId || !state.isAuthenticated) return;

    // Validate poll ID is a valid number
    const numericPollId = parseInt(pollId, 10);
    if (isNaN(numericPollId) || numericPollId <= 0) {
      setVoteError('Invalid poll ID. Cannot submit vote.');
      return;
    }

    setIsVoting(true);
    setVoteError(null);
    setVoteSuccess(false);

    try {
      await apiClient.vote(numericPollId, selectedChoiceId);
      setVoteSuccess(true);
      // Refresh poll data to show updated results
      await fetchPoll();

      // Show success message for 3 seconds, then optionally redirect
      setTimeout(() => {
        setVoteSuccess(false);
      }, 3000);
    } catch (err) {
      setVoteError('Failed to submit vote. Please try again.');
      console.error('Error voting:', err);
    } finally {
      setIsVoting(false);
    }
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
                Published {formatDateWithTime(poll.pub_date)}
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

            {/* Share button - available to everyone */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share Poll
              </button>

              {/* Delete button for poll creators */}
              {state.isAuthenticated && poll.created_by === state.user?.id && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Poll
                </button>
              )}
            </div>

            {/* Delete confirmation modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                  <div className="flex items-center mb-4">
                    <svg className="h-6 w-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Poll</h3>
                  </div>

                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this poll? This action cannot be undone.
                  </p>

                  {poll.total_votes > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        <strong>Warning:</strong> This poll has {poll.total_votes} votes. You can only delete polls with no votes.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeletePoll}
                      disabled={isDeleting || poll.total_votes > 0}
                      className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Poll'}
                    </button>
                  </div>
                </div>
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
                const percentage = calculatePercentage(choice.vote_count, poll.total_votes);
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
                            {choice.text}
                            {isUserChoice && (
                              <span className="ml-2 text-sm text-green-600 font-medium">
                                (Your choice)
                              </span>
                            )}
                          </span>
                          <span className="text-sm font-medium text-gray-600">
                            {choice.vote_count} votes ({percentage}%)
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
                          {choice.text}
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

                {voteSuccess && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm text-green-800">Vote submitted successfully! Results updated below.</p>
                    </div>
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

      {/* Share Modal */}
      {poll && (
        <SharePoll
          pollId={poll.id}
          pollTitle={poll.question}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
