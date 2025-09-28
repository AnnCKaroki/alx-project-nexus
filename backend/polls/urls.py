from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PollViewSet, VoteCreateView, UserVoteHistoryView

# Create a router and register our viewset with it
router = DefaultRouter()
router.register(r'', PollViewSet, basename='poll')  # Empty string so /polls/ goes directly to polls

# The API URLs are now determined automatically by the router
urlpatterns = [
    # Main polls endpoints - accessible via /polls/
    path('', include(router.urls)),
    path('votes/', VoteCreateView.as_view(), name='vote-create'),
    path('votes/history/', UserVoteHistoryView.as_view(), name='vote-history'),

    # Keep the nested api structure for compatibility
    path('api/', include(router.urls)),
    path('api/votes/', VoteCreateView.as_view(), name='vote-create-nested'),
    path('api/votes/history/', UserVoteHistoryView.as_view(), name='vote-history-nested'),
]
