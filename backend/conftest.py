"""
Test configuration.

Uses a dedicated SQLite test database so tests run without a PostgreSQL instance.
The conftest patches both `get_db` (used by route handlers) and
`app.main.SessionLocal` (used by the /ready endpoint) with SQLite sessions.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.main as main_module
from app.database import Base, get_db
from app.main import app

# ---------------------------------------------------------------------------
# SQLite test engine (one file per test session, wiped at the end)
# ---------------------------------------------------------------------------
SQLALCHEMY_TEST_URL = "sqlite:///./test_hireflow.db"

engine_test = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine_test
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def db_setup():
    """Create all tables at session start; drop at session end."""
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)


@pytest.fixture()
def db_session(db_setup):
    """Each test gets a fresh transaction that is rolled back afterwards."""
    connection = engine_test.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """
    FastAPI test client with:
      - get_db overridden → SQLite session (route handlers)
      - app.main.SessionLocal overridden → SQLite factory (/ready endpoint)
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    # Patch the route-level dependency
    app.dependency_overrides[get_db] = override_get_db

    # Patch SessionLocal used directly in /ready and lifespan
    original_session_local = main_module.SessionLocal
    main_module.SessionLocal = TestingSessionLocal

    with TestClient(app) as c:
        yield c

    # Restore
    app.dependency_overrides.clear()
    main_module.SessionLocal = original_session_local
