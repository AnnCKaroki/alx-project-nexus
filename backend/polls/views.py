from django.shortcuts import render
from rest_framework import viewsets, permissions, status, generics, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import Poll, Choice, Vote
from .serializers import PollListSerializer, PollDetailSerializer, VoteSerializer, UserVoteHistorySerializer, PollCreateSerializer


class PollViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing polls with full CRUD operations.
    Focused solely on poll management - voting is handled by separate views.
    """
    queryset = Poll.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        """
        Return the appropriate serializer class based on the action.
        """
        if self.action == 'list':
            return PollListSerializer
        elif self.action == 'create':
            return PollCreateSerializer
        else:
            return PollDetailSerializer

    def get_queryset(self):
        """
        Filter queryset to show active polls for list view.
        """
        if self.action == 'list':
            return Poll.objects.filter(is_active=True)
        return Poll.objects.all()

    def perform_create(self, serializer):
        """
        Set the creator when creating a new poll.
        """
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """
        Custom action to get poll results with vote counts.
        """
        poll = self.get_object()
        serializer = PollDetailSerializer(poll, context={'request': request})
        return Response(serializer.data)


class VoteCreateView(generics.CreateAPIView):
    """
    Generic view for creating votes.
    Handles vote submission with proper validation.
    """
    serializer_class = VoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """
        Create vote with current user and proper poll association.
        Uses select_for_update to prevent race conditions in duplicate vote prevention.
        """
        choice = serializer.validated_data['choice']

        # Additional validation for poll status
        if not choice.poll.is_active:
            raise serializers.ValidationError(
                {'error': 'This poll is not currently active.'}
            )

        # Use transaction with select_for_update to prevent race conditions
        with transaction.atomic():
            # Lock the poll to prevent concurrent vote creation
            poll = Poll.objects.select_for_update().get(pk=choice.poll.pk)

            existing_vote = Vote.objects.filter(
                user=self.request.user,
                poll=poll
            ).exists()

            if existing_vote:
                raise serializers.ValidationError(
                    {'error': 'You have already voted in this poll.'}
                )

            serializer.save(user=self.request.user, poll=poll)


class UserVoteHistoryView(generics.ListAPIView):
    """
    Generic view for listing user's vote history.
    Returns all votes made by the authenticated user.
    """
    serializer_class = UserVoteHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Return votes for the authenticated user only.
        """
        return Vote.objects.filter(user=self.request.user).order_by('-voted_at')
