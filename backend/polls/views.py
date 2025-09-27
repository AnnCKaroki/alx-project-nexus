from django.shortcuts import render
from rest_framework import viewsets, permissions, status, generics, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.db import transaction

from .models import Poll, Choice, Vote
from .serializers import (
    PollListSerializer, PollDetailSerializer, VoteSerializer,
    UserVoteHistorySerializer, PollCreateSerializer
)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Allow read access to all, write access to owner only."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.created_by == request.user


class PollViewSet(viewsets.ModelViewSet):
    """Poll management with full CRUD operations."""
    queryset = Poll.objects.all()

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['list', 'retrieve', 'results']:
            permission_classes = [IsAuthenticatedOrReadOnly]
        elif self.action == 'create':
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return PollListSerializer
        elif self.action == 'create':
            return PollCreateSerializer
        else:
            return PollDetailSerializer

    def get_queryset(self):
        """Filter polls - show active polls plus user's own polls."""
        if self.action == 'list':
            if self.request.user.is_authenticated:
                from django.db.models import Q
                return Poll.objects.filter(
                    Q(is_active=True) | Q(created_by=self.request.user)
                ).distinct()
            else:
                return Poll.objects.filter(is_active=True)
        return Poll.objects.all()

    def perform_create(self, serializer):
        """Set creator when creating new poll."""
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """Get poll results with vote counts."""
        poll = self.get_object()
        serializer = PollDetailSerializer(poll, context={'request': request})
        return Response(serializer.data)


class VoteCreateView(generics.CreateAPIView):
    """Create votes with validation and race condition protection."""
    serializer_class = VoteSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Create vote with user validation and race condition protection."""
        choice = serializer.validated_data['choice']

        if not choice.poll.is_active:
            raise serializers.ValidationError(
                {'error': 'This poll is not currently active.'}
            )

        with transaction.atomic():
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

    def create(self, request, *args, **kwargs):
        """Override create for better error handling and response format."""
        try:
            response = super().create(request, *args, **kwargs)
            return Response({
                'message': 'Vote cast successfully',
                'vote': response.data
            }, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            return Response(
                {'error': e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserVoteHistoryView(generics.ListAPIView):
    """List authenticated user's vote history."""
    serializer_class = UserVoteHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return votes for authenticated user only."""
        return Vote.objects.filter(user=self.request.user).order_by('-voted_at')
