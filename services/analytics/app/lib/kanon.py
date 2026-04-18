"""k-anonymity helpers.

Every aggregate endpoint must guarantee that each returned bucket was
computed over at least K distinct workers. In SQL we prefer a
HAVING COUNT(DISTINCT worker_id) >= :k clause. For cases where we need
to return the bucket with a masked value instead of dropping it, we call
build_masked_bucket() to shape the payload.
"""

from ..config import config


K = config.k_anonymity_min


def is_sufficient(sample_size: int) -> bool:
    return (sample_size or 0) >= K


def masked_value(sample_size: int) -> dict:
    """Shape the 'insufficient sample' reply half of a bucket."""
    return {
        "value": None,
        "reason": "insufficient_sample",
        "sample_size": int(sample_size or 0),
    }
