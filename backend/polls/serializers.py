from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Poll, Choice, Vote


class ChoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for Choice model with vote count.
    """
    vote_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Choice
        fields = ['id', 'text', 'vote_count', 'created_at']


class PollListSerializer(serializers.ModelSerializer):
    """
    Basic serializer for listing polls without nested choices.
    """
    total_votes = serializers.ReadOnlyField()
    
    class Meta:
        model = Poll
        fields = ['id', 'question', 'description', 'is_active', 'total_votes', 'created_at']


class PollDetailSerializer(serializers.ModelSerializer):
    """
    Detailed poll serializer with nested choices and user voting status.
    """
    choices = ChoiceSerializer(many=True, read_only=True)
    total_votes = serializers.ReadOnlyField()
    user_has_voted = serializers.SerializerMethodField()
    user_vote_choice_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Poll
        fields = [
            'id', 'question', 'description', 'is_active', 
            'total_votes', 'choices', 'user_has_voted', 
            'user_vote_choice_id', 'created_at', 'updated_at'
        ]
    
    def get_user_has_voted(self, obj):
        """
        Check if the current user has voted in this poll.
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Vote.objects.filter(user=request.user, poll=obj).exists()
        return False
    
    def get_user_vote_choice_id(self, obj):
        """
        Get the choice ID that the current user voted for in this poll.
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = Vote.objects.filter(user=request.user, poll=obj).first()
            return vote.choice.id if vote else None
        return None


class VoteSerializer(serializers.ModelSerializer):
    """
    Serializer for handling vote submissions.
    """
    poll_id = serializers.ReadOnlyField(source='poll.id')
    poll_question = serializers.ReadOnlyField(source='poll.question')
    choice_text = serializers.ReadOnlyField(source='choice.text')
    
    class Meta:
        model = Vote
        fields = ['id', 'choice', 'poll_id', 'poll_question', 'choice_text', 'voted_at']
        read_only_fields = ['id', 'voted_at', 'poll_id', 'poll_question', 'choice_text']
    
    def validate_choice(self, value):
        """
        Validate that the choice exists and belongs to an active poll.
        """
        if not value.poll.is_active:
            raise serializers.ValidationError("This poll is not currently active.")
        return value
    
    def validate(self, data):
        """
        Validate that the user hasn't already voted in this poll.
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("User must be authenticated to vote.")
        
        choice = data.get('choice')
        if choice:
            # Check if user has already voted in this poll
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
        """
        Create a new vote with the current user.
        """
        request = self.context.get('request')
        validated_data['user'] = request.user
        validated_data['poll'] = validated_data['choice'].poll
        return super().create(validated_data)


class UserVoteHistorySerializer(serializers.ModelSerializer):
    """
    Serializer to show a user's voting history.
    """
    poll_question = serializers.ReadOnlyField(source='poll.question')
    choice_text = serializers.ReadOnlyField(source='choice.text')
    
    class Meta:
        model = Vote
        fields = ['id', 'poll_question', 'choice_text', 'voted_at']


class PollCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new polls.
    """
    choices_data = serializers.ListField(
        child=serializers.CharField(max_length=200),
        write_only=True,
        min_length=2,
        help_text="List of choice texts for this poll (minimum 2 choices)"
    )
    
    class Meta:
        model = Poll
        fields = ['question', 'description', 'is_active', 'choices_data']
    
    def create(self, validated_data):
        """
        Create a poll with its associated choices.
        """
        choices_data = validated_data.pop('choices_data')
        poll = Poll.objects.create(**validated_data)
        
        # Create choices for the poll
        for choice_text in choices_data:
            Choice.objects.create(poll=poll, text=choice_text.strip())
        
        return poll
    
    def validate_choices_data(self, value):
        """
        Validate that choices are unique and not empty.
        """
        if len(value) < 2:
            raise serializers.ValidationError("A poll must have at least 2 choices.")
        
        # Remove empty choices and strip whitespace
        cleaned_choices = [choice.strip() for choice in value if choice.strip()]
        
        if len(cleaned_choices) != len(set(cleaned_choices)):
            raise serializers.ValidationError("All choices must be unique.")
        
        return cleaned_choices
