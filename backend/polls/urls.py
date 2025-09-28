from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PollViewSet, VoteCreateView, UserVoteHistoryView

# Create a router and register our viewset with it
router = DefaultRouter()
router.register(r'', PollViewSet, basename='poll')

urlpatterns = [
    # Vote endpoints (must come before router to avoid conflicts)
    path('votes/', VoteCreateView.as_view(), name='vote-create'),
    path('votes/history/', UserVoteHistoryView.as_view(), name='vote-history'),

    # Poll CRUD endpoints (router patterns)
    path('', include(router.urls)),
]
