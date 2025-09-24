from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PollViewSet, VoteCreateView, UserVoteHistoryView

# Create a router and register our viewset with it
router = DefaultRouter()
router.register(r'polls', PollViewSet, basename='poll')

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('api/', include(router.urls)),
    path('api/votes/', VoteCreateView.as_view(), name='vote-create'),
    path('api/votes/history/', UserVoteHistoryView.as_view(), name='vote-history'),
]
