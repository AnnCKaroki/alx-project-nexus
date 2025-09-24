"""
Custom middleware for the polling application
"""
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
    """
    Rate limiting middleware to prevent abuse of voting endpoints
    """

    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)

    def process_request(self, request):
        # Only apply rate limiting to voting endpoints
        if not request.path.startswith('/api/polls/') or request.method not in ['POST', 'PUT', 'PATCH']:
            return None

        # Get client IP
        client_ip = self.get_client_ip(request)

        # Rate limit: 10 requests per minute per IP for voting actions
        cache_key = f'rate_limit:{client_ip}:{request.path}'
        requests = cache.get(cache_key, 0)

        if requests >= 10:
            logger.warning(f"Rate limit exceeded for IP {client_ip} on {request.path}")
            return HttpResponse(
                "Rate limit exceeded. Please try again later.",
                status=429,
                content_type="application/json"
            )

        # Increment request count
        cache.set(cache_key, requests + 1, 60)  # 60 seconds

        return None

    def get_client_ip(self, request):
        """Get the client's IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log important requests for audit purposes
    """

    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)

    def process_request(self, request):
        # Log voting and poll creation activities
        if self.should_log_request(request):
            user_id = request.user.id if request.user.is_authenticated else 'anonymous'
            logger.info(
                f"Poll activity - User: {user_id}, IP: {self.get_client_ip(request)}, "
                f"Method: {request.method}, Path: {request.path}, "
                f"Timestamp: {timezone.now()}"
            )
        return None

    def should_log_request(self, request):
        """Determine if this request should be logged"""
        # Log poll-related POST/PUT/PATCH/DELETE requests
        return (
            request.path.startswith('/api/polls/') and
            request.method in ['POST', 'PUT', 'PATCH', 'DELETE']
        )

    def get_client_ip(self, request):
        """Get the client's IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class PollSecurityMiddleware(MiddlewareMixin):
    """
    Additional security measures for polling application
    """

    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)

    def process_request(self, request):
        # Add additional headers for API responses
        return None

    def process_response(self, request, response):
        # Add security headers for poll-related responses
        if request.path.startswith('/api/polls/'):
            response['X-Content-Type-Options'] = 'nosniff'
            response['X-Frame-Options'] = 'DENY'
            response['X-XSS-Protection'] = '1; mode=block'
            response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

            # Prevent caching of sensitive poll data
            if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
                response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'

        return response


class CorsCustomMiddleware(MiddlewareMixin):
    """
    Custom CORS handling for specific poll endpoints if needed
    """

    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)

    def process_response(self, request, response):
        # Add custom CORS headers for poll endpoints if needed
        if request.path.startswith('/api/polls/'):
            # These are already handled by django-cors-headers,
            # but you can add custom logic here if needed
            pass

        return response
