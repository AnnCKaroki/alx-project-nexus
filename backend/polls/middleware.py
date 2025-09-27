"""Custom middleware for the polling application."""
import time
import logging
from django.core.cache import cache
from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from django.utils import timezone

logger = logging.getLogger(__name__)
User = get_user_model()


class RateLimitMiddleware(MiddlewareMixin):
    """Rate limiting middleware for voting endpoints."""

    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def process_request(self, request):
        if not request.path.startswith('/polls/') or request.method not in ['POST', 'PUT', 'PATCH']:
            return None

        client_ip = self.get_client_ip(request)
        cache_key = f'rate_limit:{client_ip}:{request.path}'
        requests = cache.get(cache_key, 0)

        if requests >= 10:
            logger.warning(f"Rate limit exceeded for IP {client_ip} on {request.path}")
            import json
            return HttpResponse(
                json.dumps({"error": "Rate limit exceeded. Please try again later."}),
                status=429,
                content_type="application/json"
            )

        cache.set(cache_key, requests + 1, 60)
        return None

    def should_log_request(self, request):
        """Check if request should be logged."""
        return (
            request.path.startswith('/polls/') and
            request.method in ['POST', 'PUT', 'PATCH', 'DELETE']
        )


class RequestLoggingMiddleware(MiddlewareMixin):
    """Request logging middleware for polling endpoints."""

    def process_request(self, request):
        if self.should_log_request(request):
            logger.info(f"Poll request: {request.method} {request.path} from {self.get_client_ip(request)}")
        return None

    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def should_log_request(self, request):
        """Check if request should be logged."""
        return (
            request.path.startswith('/polls/') and
            request.method in ['POST', 'PUT', 'PATCH', 'DELETE']
        )


class PollSecurityMiddleware(MiddlewareMixin):
    """Security headers middleware for polling application."""

    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)

    def process_request(self, request):
        return None

    def process_response(self, request, response):
        """Add security headers for poll-related responses."""
        if request.path.startswith('polls/'):
            response['X-Content-Type-Options'] = 'nosniff'
            response['X-Frame-Options'] = 'DENY'
            response['X-XSS-Protection'] = '1; mode=block'
            response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

            if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
                response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'

        return response
