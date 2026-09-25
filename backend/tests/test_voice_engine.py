from pathlib import Path
from app.services.evaluator import VoiceEvaluator
from app.services.prompt_builder import PromptBuilder
from app.services.voice_engine import VoiceEngine

ROOT = Path(__file__).resolve().parents[2]


def test_loads_all_modes_and_exact_samples():
    engine = VoiceEngine(ROOT / "voice_profile", ROOT / "voice_samples")
    assert {engine.load_mode(mode)["mode"] for mode in ("casual", "professional", "technical", "spoken")} == {"casual", "professional", "technical", "spoken"}
    assert len(engine.load_samples()) >= 3
    assert engine.load_samples()[0]["content"].startswith("So yeah, I usually like")


def test_prompt_contains_core_mode_and_context():
    engine = VoiceEngine(ROOT / "voice_profile", ROOT / "voice_samples")
    messages = PromptBuilder().build(
        profile=engine.profile("technical"),
        mode="technical",
        audience="recruiter",
        length="short",
        user_input="Explain my project",
        context="Interview"
    )
    assert "CORE VOICE" in messages[0]["content"]
    assert "MODE OVERRIDES (TECHNICAL)" in messages[0]["content"]
    assert "Interview" in messages[1]["content"]


def test_evaluator_flags_ai_phrases():
    result = VoiceEvaluator().evaluate("In today's rapidly evolving world, we leverage a robust solution.", "professional")
    assert result["issues"]
    assert result["ai_sounding"] < 10
    assert result["drift_status"] in ["drift_detected", "minor_drift"]
    assert len(result["flagged_phrases"]) >= 2

