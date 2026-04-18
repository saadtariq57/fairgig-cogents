import os
from contextlib import contextmanager
import psycopg2
from psycopg2.extras import RealDictCursor


@contextmanager
def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"], cursor_factory=RealDictCursor)
    try:
        yield conn
    finally:
        conn.close()
