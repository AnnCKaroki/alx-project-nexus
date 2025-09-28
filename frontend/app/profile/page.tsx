'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile, Poll } from '@/types';
import apiClient from '@/lib/api';
import { formatDate, formatRelativeTime } from '@/lib/utils';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPolls, setUserPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'polls' | 'votes'>('overview');
  const { state } = useAuth();

  // Fetch profile data
  useEffect(() => {
    if (!state.isAuthenticated || !state.user) {
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user profile
        const profileData = await apiClient.getUserProfile();
        setProfile(profileData);

        // Fetch user's polls by filtering all polls for the user
        const allPolls = await apiClient.getPolls(1);
        const userCreatedPolls = allPolls.results.filter(poll => poll.created_by === state.user!.id);
        setUserPolls(userCreatedPolls);
      } catch (err) {
        setError('Failed to load profile data. Please try again.');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [state.isAuthenticated, state.user]);

  // Redirect if not authenticated
  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-blue-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600 mb-4">Please sign in to view your profile.</p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                  </div>
                ))}
              </div>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Profile</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-gray-600">
            Manage your account and view your voting activity.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Profile header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {state.user?.first_name && state.user?.last_name
                    ? `${state.user.first_name} ${state.user.last_name}`
                    : state.user?.username
                  }
                </h2>
                <p className="text-gray-600">@{state.user?.username}</p>
                <p className="text-sm text-gray-500">
                  Member since {formatDate(state.user?.date_joined || '')}
                </p>
              </div>
            </div>

            {/* Statistics */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {profile?.polls_created || 0}
                </div>
                <div className="text-sm text-gray-600">Polls Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {profile?.votes_cast || 0}
                </div>
                <div className="text-sm text-gray-600">Votes Cast</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {userPolls.reduce((sum, poll) => sum + poll.total_votes, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Votes Received</div>
              </div>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'polls', name: 'My Polls' },
                { id: 'votes', name: 'My Votes' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          <div className="px-6 py-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Account info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Username:</span>
                      <span className="text-sm text-gray-900">{state.user?.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <span className="text-sm text-gray-900">{state.user?.email}</span>
                    </div>
                    {state.user?.first_name && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">First Name:</span>
                        <span className="text-sm text-gray-900">{state.user.first_name}</span>
                      </div>
                    )}
                    {state.user?.last_name && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Last Name:</span>
                        <span className="text-sm text-gray-900">{state.user.last_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link
                      href="/polls/create"
                      className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                    >
                      <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <div>
                        <div className="font-medium text-blue-900">Create New Poll</div>
                        <div className="text-sm text-blue-600">Start gathering opinions</div>
                      </div>
                    </Link>
                    <Link
                      href="/polls"
                      className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                    >
                      <svg className="h-8 w-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <div>
                        <div className="font-medium text-green-900">Browse Polls</div>
                        <div className="text-sm text-green-600">Discover and vote on polls</div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'polls' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  My Polls ({userPolls.length})
                </h3>

                {userPolls.length > 0 ? (
                  <div className="space-y-4">
                    {userPolls.map((poll) => (
                      <div key={poll.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">
                              <Link href={`/polls/${poll.id}`} className="hover:text-blue-600">
                                {poll.question}
                              </Link>
                            </h4>
                            {poll.description && (
                              <p className="text-sm text-gray-600 mb-2">{poll.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{poll.total_votes} votes</span>
                              <span>{poll.choices.length} choices</span>
                              <span>Created {formatRelativeTime(poll.created_at)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">{poll.total_votes}</div>
                            <div className="text-xs text-gray-500">total votes</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No polls created yet</h4>
                    <p className="text-gray-600 mb-4">Get started by creating your first poll.</p>
                    <Link
                      href="/polls/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      Create Poll
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'votes' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  My Recent Votes ({profile?.recent_votes?.length || 0})
                </h3>

                {profile?.recent_votes && profile.recent_votes.length > 0 ? (
                  <div className="space-y-4">
                    {profile.recent_votes.map((vote, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              <Link href={`/polls/${vote.poll_id}`} className="hover:text-blue-600">
                                {vote.poll_question}
                              </Link>
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              Your choice: <span className="font-medium">{vote.choice_text}</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Voted {formatRelativeTime(vote.voted_at)}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Voted
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No votes cast yet</h4>
                    <p className="text-gray-600 mb-4">Start participating by voting on polls.</p>
                    <Link
                      href="/polls"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      Browse Polls
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
