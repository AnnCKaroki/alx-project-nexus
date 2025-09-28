from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction

from .models import Poll, Choice, Vote


class ChoiceSerializer(serializers.ModelSerializer):
    """Choice serializer with vote count."""
    vote_count = serializers.ReadOnlyField()

    class Meta:
        model = Choice
        fields = ['id', 'text', 'vote_count', 'created_at']


class PollListSerializer(serializers.ModelSerializer):
    """Basic poll list serializer without nested choices."""
    total_votes = serializers.ReadOnlyField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    pub_date = serializers.DateTimeField(source='created_at', read_only=True)
    user_has_voted = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = ['id', 'question', 'description', 'is_active', 'total_votes', 'created_by', 'created_by_username', 'pub_date', 'user_has_voted']

    def get_user_has_voted(self, obj):
        """Check if current user has voted in this poll."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Vote.objects.filter(user=request.user, poll=obj).exists()
        return False


class PollDetailSerializer(serializers.ModelSerializer):
    """Detailed poll serializer with choices and user voting status."""
    choices = ChoiceSerializer(many=True, read_only=True)
    total_votes = serializers.ReadOnlyField()
    user_has_voted = serializers.SerializerMethodField()
    user_choice_id = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    pub_date = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Poll
        fields = [
            'id', 'question', 'description', 'is_active',
            'total_votes', 'choices', 'user_has_voted',
            'user_choice_id', 'created_by', 'created_by_username', 'pub_date', 'created_at', 'updated_at'
        ]

    def get_user_has_voted(self, obj):
        """Check if current user has voted in this poll."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Vote.objects.filter(user=request.user, poll=obj).exists()
        return False

    def get_user_choice_id(self, obj):
        """Get choice ID that current user voted for."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = Vote.objects.filter(user=request.user, poll=obj).first()
            return vote.choice.id if vote else None
        return None


class VoteSerializer(serializers.ModelSerializer):
    """Vote submission serializer."""
    poll_id = serializers.ReadOnlyField(source='poll.id')
    poll_question = serializers.ReadOnlyField(source='poll.question')
    choice_text = serializers.ReadOnlyField(source='choice.text')

    class Meta:
        model = Vote
        fields = ['id', 'choice', 'poll_id', 'poll_question', 'choice_text', 'voted_at']
        read_only_fields = ['id', 'voted_at', 'poll_id', 'poll_question', 'choice_text']

    def validate_choice(self, value):
        """Validate choice exists and belongs to active poll."""
        if not value.poll.is_active:
            raise serializers.ValidationError("This poll is not currently active.")
        return value

    def validate(self, data):
        """Validate user hasn't already voted in this poll."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("User must be authenticated to vote.")

        choice = data.get('choice')
        if choice:
            existing_vote = Vote.objects.filter(
                user=request.user,
                poll=choice.poll
            ).first()

            if existing_vote:
                raise serializers.ValidationError(
                    f"You have already voted in this poll. Your current vote is for '{existing_vote.choice.text}'."
                )

        return data

    def create(self, validated_data):
        """Create new vote with current user."""
        request = self.context.get('request')
        validated_data['user'] = request.user
        validated_data['poll'] = validated_data['choice'].poll
        return super().create(validated_data)


class UserVoteHistorySerializer(serializers.ModelSerializer):
    """User voting history serializer."""
    poll_question = serializers.ReadOnlyField(source='poll.question')
    choice_text = serializers.ReadOnlyField(source='choice.text')

    class Meta:
        model = Vote
        fields = ['id', 'poll_question', 'choice_text', 'voted_at']


class PollCreateSerializer(serializers.ModelSerializer):
    """Poll creation serializer with choices."""
    choices_data = serializers.ListField(
        child=serializers.CharField(max_length=200),
        write_only=True,
        min_length=2,
    )

    class Meta:
        model = Poll
        fields = ['id', 'question', 'description', 'is_active', 'choices_data']
        read_only_fields = ['id']

    def create(self, validated_data):
        """Create poll with associated choices."""
        choices_data = validated_data.pop('choices_data')
        with transaction.atomic():
            poll = Poll.objects.create(**validated_data)
            for choice_text in choices_data:
                Choice.objects.create(poll=poll, text=choice_text)
        return poll

    def validate_choices_data(self, value):
        """Validate choices are unique and non-empty."""
        if len(value) < 2:
            raise serializers.ValidationError("A poll must have at least 2 choices.")

        cleaned_choices = [choice.strip() for choice in value if choice.strip()]

        if len(cleaned_choices) < 2:
            raise serializers.ValidationError("A poll must have at least 2 non-empty choices.")

        if len(cleaned_choices) != len(set(cleaned_choices)):
            raise serializers.ValidationError("All choices must be unique.")

        return cleaned_choices
