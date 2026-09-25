from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_invalid_request():
    response = client.post("/api/generate", json={"input": "", "mode": "casual"})
    assert response.status_code == 422


def test_profile_endpoint():
    response = client.get("/api/voice-profile")
    assert response.status_code == 200
    data = response.json()
    assert len(data["samples"]) >= 3
    assert "chatgpt_project_instructions" in data
    assert "Tanmay's Brand Voice Guide" in data["chatgpt_project_instructions"]


def test_generate_endpoint():
    response = client.post(
        "/api/generate",
        json={"input": "Launching our new project", "mode": "casual", "audience": "general", "format_type": "social_post"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert data["mode"] == "casual"
    assert data["evaluation"]["overall"] > 0


def test_dual_draft_endpoint():
    response = client.post(
        "/api/dual-draft",
        json={
            "input": "We redesigned the onboarding workflow to be simpler and 50% faster.",
            "format_a": "email",
            "mode_a": "professional",
            "audience_a": "recruiter",
            "format_b": "social_post",
            "mode_b": "casual",
            "audience_b": "general"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "draft_a" in data
    assert "draft_b" in data
    assert "drift_comparison" in data
    assert data["draft_a"]["format_type"] == "email"
    assert data["draft_b"]["format_type"] == "social_post"


def test_fix_drift_in_guide():
    response = client.post(
        "/api/fix-drift-in-guide",
        json={"forbidden_pattern": "test_jargon_phrase_123", "rule_note": "Never use test jargon"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_submission_pack():
    response = client.post(
        "/api/submission-pack",
        json={
            "core_topic": "Setting up daily work boundaries and avoiding burnout",
            "draft_a_format": "Executive Email",
            "draft_b_format": "Casual LinkedIn Post"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "markdown_report" in data
    assert "writing_samples" in data
    assert "draft_a" in data
    assert "draft_b" in data

