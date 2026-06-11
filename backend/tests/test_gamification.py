from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.application.services.gamification_service import get_current_streak


def test_current_streak_counts_consecutive_utc_days():
    today = datetime.now(timezone.utc).date()
    practice_days = [
        (today - timedelta(days=offset)).isoformat()
        for offset in range(4)
    ]

    assert get_current_streak(practice_days) == 4


def test_current_streak_allows_today_to_be_missing():
    today = datetime.now(timezone.utc).date()
    practice_days = [
        (today - timedelta(days=1)).isoformat(),
        (today - timedelta(days=2)).isoformat(),
    ]

    assert get_current_streak(practice_days) == 2


def test_current_streak_stops_at_first_gap():
    today = datetime.now(timezone.utc).date()
    practice_days = [
        today.isoformat(),
        (today - timedelta(days=2)).isoformat(),
    ]

    assert get_current_streak(practice_days) == 1
