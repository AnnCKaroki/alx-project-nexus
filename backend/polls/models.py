from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


class Poll(models.Model):
    """
    Model representing a poll with a question.
    """
    question = models.CharField(max_length=200, help_text="The main question for this poll")
    description = models.TextField(blank=True, help_text="Optional description for the poll")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True, help_text="Whether this poll is currently active")

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.question

    def total_votes(self):
        """Return the total number of votes for this poll."""
        return Vote.objects.filter(choice__poll=self).count()


class Choice(models.Model):
    """
    Model representing a choice/option for a poll.
    """
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=200, help_text="The text of this choice option")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.poll.question} - {self.text}"

    def vote_count(self):
        """Return the number of votes for this choice."""
        return self.votes.count()


class Vote(models.Model):
    """
    Model representing a user's vote for a specific choice.
    Enforces one vote per user per poll.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    choice = models.ForeignKey(Choice, on_delete=models.CASCADE, related_name='votes')
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='votes')
    voted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Ensure one vote per user per poll
        unique_together = ['user', 'poll']
        ordering = ['-voted_at']

    def __str__(self):
        return f"{self.user.username} voted for '{self.choice.text}' in '{self.poll.question}'"

    def clean(self):
        """
        Custom validation to ensure user hasn't already voted in this poll.
        """
        if self.choice:
            # Auto-set the poll field from the choice
            self.poll = self.choice.poll

        if self.pk is None:  # Only check for new votes
            existing_vote = Vote.objects.filter(
                user=self.user,
                poll=self.poll
            ).first()

            if existing_vote:
                raise ValidationError(
                    f"User {self.user.username} has already voted in poll '{self.poll.question}'"
                )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
