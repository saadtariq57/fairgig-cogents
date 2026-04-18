from contextlib import contextmanager
import psycopg2
from psycopg2.extras import RealDictCursor

from .config import config


@contextmanager
def get_conn():
    conn = psycopg2.connect(config.database_url, cursor_factory=RealDictCursor)
    try:
        yield conn
    finally:
        conn.close()


def fetch_all(sql, params=None):
    """Run a SELECT and return list of dicts."""
    with get_conn() as c, c.cursor() as cur:
        cur.execute(sql, params or ())
        return cur.fetchall()


def fetch_one(sql, params=None):
    with get_conn() as c, c.cursor() as cur:
        cur.execute(sql, params or ())
        return cur.fetchone()
