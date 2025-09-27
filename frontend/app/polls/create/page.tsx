'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';

interface Choice {
  id: string;
  text: string;
}

export default function CreatePollPage() {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [choices, setChoices] = useState<Choice[]>([
    { id: '1', text: '' },
    { id: '2', text: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state } = useAuth();
  const router = useRouter();

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
            <p className="text-gray-600 mb-4">Please sign in to create a poll.</p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/polls"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Back to Polls
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add new choice option
  const addChoice = () => {
    const newId = (Math.max(...choices.map(c => parseInt(c.id))) + 1).toString();
    setChoices([...choices, { id: newId, text: '' }]);
  };

  // Remove choice option
  const removeChoice = (id: string) => {
    if (choices.length <= 2) return; // Minimum 2 choices required
    setChoices(choices.filter(choice => choice.id !== id));
  };

  // Update choice text
  const updateChoice = (id: string, text: string) => {
    setChoices(choices.map(choice =>
      choice.id === id ? { ...choice, text } : choice
    ));
  };

  // Validate form
  const validateForm = () => {
    if (!question.trim()) {
      setError('Poll question is required.');
      return false;
    }

    if (question.trim().length < 5) {
      setError('Poll question must be at least 5 characters long.');
      return false;
    }

    const validChoices = choices.filter(choice => choice.text.trim());
    if (validChoices.length < 2) {
      setError('At least 2 choices are required.');
      return false;
    }

    // Check for duplicate choices
    const choiceTexts = validChoices.map(c => c.text.trim().toLowerCase());
    const uniqueTexts = new Set(choiceTexts);
    if (choiceTexts.length !== uniqueTexts.size) {
      setError('All choices must be unique.');
      return false;
    }

    setError(null);
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const validChoices = choices.filter(choice => choice.text.trim());

      const pollData = {
        question: question.trim(),
        description: description.trim() || undefined,
        choices: validChoices.map(choice => ({ choice_text: choice.text.trim() }))
      };

      const newPoll = await apiClient.createPoll(pollData);

      // Redirect to the new poll
      router.push(`/polls/${newPoll.id}`);
    } catch (err) {
      console.error('Error creating poll:', err);
      setError('Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Poll</h1>
          <p className="mt-2 text-gray-600">
            Create a poll to gather opinions and insights from the community.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Question */}
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                Poll Question *
              </label>
              <input
                type="text"
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to ask?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                maxLength={200}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                {question.length}/200 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional context or details about your poll..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                maxLength={500}
              />
              <p className="mt-1 text-sm text-gray-500">
                {description.length}/500 characters
              </p>
            </div>

            {/* Choices */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Answer Choices *
              </label>
              <div className="space-y-3">
                {choices.map((choice, index) => (
                  <div key={choice.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={choice.text}
                      onChange={(e) => updateChoice(choice.id, e.target.value)}
                      placeholder={`Choice ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      maxLength={100}
                    />

                    {choices.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeChoice(choice.id)}
                        className="flex-shrink-0 p-1 text-red-400 hover:text-red-600 transition-colors"
                        aria-label={`Remove choice ${index + 1}`}
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {choices.length < 6 && (
                <button
                  type="button"
                  onClick={addChoice}
                  className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Choice
                </button>
              )}

              <p className="mt-2 text-sm text-gray-500">
                You can add up to 6 choices. At least 2 choices are required.
              </p>
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Link
                href="/polls"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Poll...
                  </div>
                ) : (
                  'Create Poll'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
