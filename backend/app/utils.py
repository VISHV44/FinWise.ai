from datetime import date
from typing import List


def current_month_key() -> str:
    """Return the current calendar month as 'YYYY-MM'."""
    return date.today().strftime("%Y-%m")


def latest_month_key(txs) -> str | None:
    """Return the most recent 'YYYY-MM' found across a list of transaction objects."""
    months = []
    for t in txs:
        try:
            month_key = t.date[:7]
        except Exception:
            continue
        if len(month_key) == 7:
            months.append(month_key)
    return max(months) if months else None
