import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* App branding and description */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                V
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900">
                VoteApp
              </span>
            </div>
            <p className="text-gray-600 text-sm max-w-xs">
              A modern democratic polling platform enabling users to create, share, and participate in polls with real-time results.
            </p>
          </div>

          {/* Primary navigation shortcuts */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Quick Links
            </h3>
            <div className="space-y-2">
              <Link
                href="/polls"
                className="text-gray-600 hover:text-blue-600 text-sm block transition-colors"
              >
                Browse Polls
              </Link>
              <Link
                href="/polls/create"
                className="text-gray-600 hover:text-blue-600 text-sm block transition-colors"
              >
                Create Poll
              </Link>
              <Link
                href="/about"
                className="text-gray-600 hover:text-blue-600 text-sm block transition-colors"
              >
                About Us
              </Link>
              <Link
                href="/contact"
                className="text-gray-600 hover:text-blue-600 text-sm block transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Help resources and legal pages */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Support
            </h3>
            <div className="space-y-2">
              <Link
                href="/help"
                className="text-gray-600 hover:text-blue-600 text-sm block transition-colors"
              >
                Help Center
              </Link>
              <Link
                href="/privacy"
                className="text-gray-600 hover:text-blue-600 text-sm block transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-600 hover:text-blue-600 text-sm block transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/feedback"
                className="text-gray-600 hover:text-blue-600 text-sm block transition-colors"
              >
                Feedback
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright and technology attribution */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-500 text-sm">
              © {currentYear} VoteApp. All rights reserved.
            </p>

            {/* Tech stack credit - expandable for social links */}
            <div className="flex space-x-4">
              <span className="text-gray-400 text-sm">
                Built with Next.js & Django
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
