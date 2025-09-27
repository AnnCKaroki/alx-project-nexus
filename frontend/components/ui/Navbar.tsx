'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  // TODO: Connect to AuthContext for persistent login state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    // TODO: Clear JWT tokens and redirect to home
    setIsAuthenticated(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Establish brand identity and home navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                V
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900">
                VoteApp
              </span>
            </Link>
          </div>

          {/* Conditional navigation based on authentication status */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/polls"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Polls
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Profile
                </Link>
                <Link
                  href="/polls/create"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Poll
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Responsive menu toggle for smaller screens */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900 p-2"
              aria-label="Toggle menu"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Collapsible mobile navigation with auto-close behavior */}
        {isOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                href="/polls"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Polls
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/polls/create"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Create Poll
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="text-gray-700 hover:text-red-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
