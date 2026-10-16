"""
Tests for HireFlow API — covers health, candidates CRUD, and stats.
Uses an isolated SQLite test database (via conftest.py) — no PostgreSQL required.
"""

import pytest


# ---------------------------------------------------------------------------
# Health & root
# ---------------------------------------------------------------------------


def test_root(client):
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["service"] == "HireFlow API"
    assert data["status"] == "running"


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


# ---------------------------------------------------------------------------
# Candidate CRUD
# ---------------------------------------------------------------------------


def _sample_payload(**overrides):
    base = {
        "name": "Test Candidate",
        "email": "test@example.com",
        "position": "Software Engineer",
        "department": "Engineering",
        "status": "applied",
        "priority": "medium",
    }
    base.update(overrides)
    return base


def test_create_candidate(client):
    resp = client.post("/api/candidates/", json=_sample_payload())
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Candidate"
    assert data["email"] == "test@example.com"
    assert data["status"] == "applied"
    assert "id" in data


def test_create_duplicate_email_returns_409(client):
    client.post("/api/candidates/", json=_sample_payload(email="dup@example.com"))
    resp = client.post("/api/candidates/", json=_sample_payload(email="dup@example.com"))
    assert resp.status_code == 409


def test_list_candidates(client):
    client.post("/api/candidates/", json=_sample_payload(email="list1@example.com"))
    client.post("/api/candidates/", json=_sample_payload(email="list2@example.com"))
    resp = client.get("/api/candidates/")
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


def test_get_candidate_by_id(client):
    create_resp = client.post("/api/candidates/", json=_sample_payload(email="get@example.com"))
    candidate_id = create_resp.json()["id"]
    resp = client.get(f"/api/candidates/{candidate_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == candidate_id


def test_get_candidate_not_found(client):
    resp = client.get("/api/candidates/999999")
    assert resp.status_code == 404


def test_update_candidate_status(client):
    create_resp = client.post(
        "/api/candidates/", json=_sample_payload(email="update@example.com")
    )
    candidate_id = create_resp.json()["id"]
    resp = client.put(
        f"/api/candidates/{candidate_id}",
        json={"status": "interview", "priority": "high"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "interview"
    assert data["priority"] == "high"


def test_delete_candidate(client):
    create_resp = client.post(
        "/api/candidates/", json=_sample_payload(email="delete@example.com")
    )
    candidate_id = create_resp.json()["id"]
    del_resp = client.delete(f"/api/candidates/{candidate_id}")
    assert del_resp.status_code == 204
    get_resp = client.get(f"/api/candidates/{candidate_id}")
    assert get_resp.status_code == 404


def test_filter_candidates_by_status(client):
    client.post("/api/candidates/", json=_sample_payload(email="f1@example.com", status="hired"))
    client.post("/api/candidates/", json=_sample_payload(email="f2@example.com", status="applied"))
    resp = client.get("/api/candidates/?status=hired")
    assert resp.status_code == 200
    for c in resp.json():
        assert c["status"] == "hired"


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


def test_get_pipeline_stats(client):
    client.post("/api/candidates/", json=_sample_payload(email="s1@example.com", status="hired"))
    client.post("/api/candidates/", json=_sample_payload(email="s2@example.com", status="interview"))
    resp = client.get("/api/candidates/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "hired" in data
    assert "departments" in data
    assert data["total"] >= 2


def test_update_nonexistent_candidate(client):
    resp = client.put("/api/candidates/999999", json={"status": "hired"})
    assert resp.status_code == 404
