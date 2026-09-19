"""Conversation ID helpers for chat."""


def conversation_id_for(user_a: int, user_b: int) -> str:
    low, high = sorted((user_a, user_b))
    return f"dm:{low}:{high}"
