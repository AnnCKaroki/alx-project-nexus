from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


class Poll(models.Model):
    """Poll with question and multiple choice options."""
    question = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name='created_polls'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.question

    def total_votes(self):
        """Return total number of votes for this poll."""
        return Vote.objects.filter(choice__poll=self).count()


class Choice(models.Model):
    """Poll choice option."""
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.poll.question} - {self.text}"

    def vote_count(self):
        """Return number of votes for this choice."""
        return self.votes.count()


class Vote(models.Model):
    """User vote for a specific choice - enforces one vote per user per poll."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    choice = models.ForeignKey(Choice, on_delete=models.CASCADE, related_name='votes')
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='votes')
    voted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'poll']  # One vote per user per poll
        ordering = ['-voted_at']

    def __str__(self):
        return f"{self.user.username} voted for '{self.choice.text}' in '{self.poll.question}'"

    def clean(self):
        """Validate user hasn't already voted in this poll."""
        if self.choice:
            self.poll = self.choice.poll  # Auto-set poll from choice

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
