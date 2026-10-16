"""Wait for PostgreSQL and apply Alembic migrations once across backend pods."""

import time

from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.database import engine


def main() -> None:
    for attempt in range(60):
        try:
            with engine.connect() as connection:
                # Session-level lock serializes the two backend init containers.
                connection.execute(text("SELECT pg_advisory_lock(812146203)"))
                try:
                    command.upgrade(Config("alembic.ini"), "head")
                finally:
                    connection.execute(text("SELECT pg_advisory_unlock(812146203)"))
            return
        except OperationalError:
            if attempt == 59:
                raise
            time.sleep(2)


if __name__ == "__main__":
    main()
