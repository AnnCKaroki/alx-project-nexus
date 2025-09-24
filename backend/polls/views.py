from django.shortcuts import render
from rest_framework import viewsets, permissions, status, generics, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from django.db import transaction
from .models import Poll, Choice, Vote
from .serializers import PollListSerializer, PollDetailSerializer, VoteSerializer, UserVoteHistorySerializer, PollCreateSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write permissions are only allowed to the owner of the poll.
        return obj.created_by == request.user


class PollViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing polls with full CRUD operations.
    Focused solely on poll management - voting is handled by separate views.
    """
    queryset = Poll.objects.all()

    def get_permissions(self):
        """
        Instantiate and return the list of permissions required for this view.
        """
        if self.action == 'list' or self.action == 'retrieve' or self.action == 'results':
            permission_classes = [IsAuthenticatedOrReadOnly]
        elif self.action == 'create':
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

        return [permission() for permission in permission_classes]

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
        For authenticated users, show their own polls even if inactive.
        """
        if self.action == 'list':
            if self.request.user.is_authenticated:
                # Show all active polls plus user's own polls
                from django.db.models import Q
                return Poll.objects.filter(
                    Q(is_active=True) | Q(created_by=self.request.user)
                ).distinct()
            else:
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
    permission_classes = [IsAuthenticated]

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

    def create(self, request, *args, **kwargs):
        """
        Override create to provide better error handling and response format.
        """
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
    """
    Generic view for listing user's vote history.
    Returns all votes made by the authenticated user.
    """
    serializer_class = UserVoteHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return votes for the authenticated user only.
        """
        return Vote.objects.filter(user=self.request.user).order_by('-voted_at')
