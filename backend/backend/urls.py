"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from polls.auth_views import register_user, login_user, logout_user, user_profile

def api_root(request):
    """Root API endpoint with available endpoints"""
    return JsonResponse({
        'message': 'Voting App API',
        'version': getattr(settings, 'API_VERSION', '1.0'),
        'endpoints': {
            'admin': '/admin/',
            'authentication': {
                'login': '/auth/login/',
                'refresh': '/auth/refresh/',
                'verify': '/auth/verify/',
                'register': '/auth/register/',
                'logout': '/auth/logout/',
                'profile': '/auth/profile/',
            },
            'polls': '/polls/',
        }
    })

urlpatterns = [
    path('', api_root, name='api_root'),  # Root endpoint
    path('admin/', admin.site.urls),
    # Authentication endpoints
    path('auth/login/', login_user, name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('auth/register/', register_user, name='register'),
    path('auth/logout/', logout_user, name='logout'),
    path('auth/profile/', user_profile, name='user_profile'),
    # App endpoints
    path('polls/', include('polls.urls')),
]
