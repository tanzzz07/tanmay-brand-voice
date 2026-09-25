import re
from typing import Any

DEFAULT_AI_PHRASES = [
    "in today's rapidly evolving world",
    "in today's fast-paced world",
    "it is important to note",
    "it is essential to",
    "furthermore",
    "moreover",
    "in conclusion",
    "delve into",
    "delving into",
    "leverage",
    "leveraging",
    "seamlessly",
    "robust solution",
    "cutting-edge",
    "game-changing",
    "unlock the potential",
    "revolutionize",
    "empower",
    "transform the way",
    "beacon of",
    "testament to",
    "tapestry of",
    "harness the power",
    "in order to facilitate",
    "paradigm shift",
    "game changer"
]


class VoiceEvaluator:
    def __init__(self, forbidden_patterns: list[str] | None = None):
        self.forbidden_patterns = list(set(DEFAULT_AI_PHRASES + (forbidden_patterns or [])))

    def evaluate(
        self,
        content: str,
        mode: str,
        audience: str = "general",
        format_type: str | None = None,
        custom_forbidden: list[str] | None = None
    ) -> dict[str, Any]:
        if not content or not content.strip():
            return {
                "naturalness": 0,
                "directness": 0,
                "simplicity": 0,
                "context_fit": 0,
                "conversational": 0,
                "ai_sounding": 0,
                "verbosity": 0,
                "mode_consistency": 0,
                "overall": 0,
                "word_count": 0,
                "sentence_count": 0,
                "avg_sentence_length": 0,
                "issues": ["Content is empty"],
                "flagged_phrases": [],
                "drift_details": [],
                "guide_fix_recommendations": []
            }

        text = content.strip()
        lowered = text.lower()
        words = text.split()
        word_count = len(words)
        
        # Split by sentence enders
        raw_sentences = [part.strip() for part in re.split(r"[.!?]+", text) if part.strip()]
        sentence_count = max(len(raw_sentences), 1)
        avg_sentence_length = round(word_count / sentence_count, 1)

        # Check forbidden AI and corporate jargon phrases
        forbidden_list = self.forbidden_patterns + (custom_forbidden or [])
        flagged_phrases: list[str] = []
        for phrase in forbidden_list:
            clean_phrase = phrase.strip().lower()
            if clean_phrase and clean_phrase in lowered:
                if clean_phrase not in [p.lower() for p in flagged_phrases]:
                    flagged_phrases.append(phrase)

        issues: list[str] = []
        drift_details: list[dict[str, Any]] = []
        recommendations: list[str] = []

        # 1. AI Phrasing check
        if flagged_phrases:
            issues.append(f"Detected {len(flagged_phrases)} generic AI / corporate jargon phrase(s)")
            for phrase in flagged_phrases:
                drift_details.append({
                    "type": "forbidden_phrase",
                    "severity": "high",
                    "phrase": phrase,
                    "reason": f"Uses forbidden or corporate cliché '{phrase}'. Real voice prefers natural, grounded vocabulary."
                })
                recommendations.append(f"Remove or replace '{phrase}' with a direct conversational alternative.")

        # 2. Sentence Length / Rhythm check
        long_sentences = [s for s in raw_sentences if len(s.split()) > 26]
        if len(long_sentences) > 0:
            pct_long = len(long_sentences) / sentence_count
            if pct_long > 0.3:
                issues.append("Multiple sentences are overly long and complex")
                drift_details.append({
                    "type": "sentence_length",
                    "severity": "medium",
                    "count": len(long_sentences),
                    "reason": f"{len(long_sentences)} sentences exceed 26 words. Tanmay's natural voice prefers short-to-medium cadence."
                })
                recommendations.append("Break down multi-clause sentences into 2 punchier sentences.")

        # 3. Natural Qualifiers Check
        natural_qualifiers = ["i think", "for me", "usually", "sometimes", "probably", "honestly", "at the same time", "in my experience", "you know", "i guess"]
        has_qualifier = any(q in lowered for q in natural_qualifiers)
        if mode in ["casual", "spoken"] and not has_qualifier and word_count > 40:
            drift_details.append({
                "type": "tone_rigidity",
                "severity": "low",
                "reason": "Missing authentic qualifiers (e.g., 'I think', 'For me', 'Honestly', 'Usually') typical of Tanmay's voice."
            })
            recommendations.append("Add a natural grounding qualifier like 'For me,' or 'I think' to soften robotic certainty.")

        # 4. Mode-specific checks
        if mode == "professional":
            if any(word in lowered for word in ["gonna", "wanna", "bro", "super cool"]):
                issues.append("Contains excessively informal slang for professional mode")
                recommendations.append("Polish slang terms while keeping tone human and direct.")
        elif mode == "technical":
            if not any(marker in lowered for marker in ["because", "why", "instead of", "means that", "focus", "tradeoff", "system", "build"]):
                recommendations.append("Ensure you explain 'why' a technical decision was made, not just 'what'.")

        # Score calculations (0 - 10)
        ai_sounding_penalty = min(len(flagged_phrases) * 2.5, 9)
        ai_sounding = max(1.0, round(10.0 - ai_sounding_penalty, 1))

        length_penalty = 1.5 if avg_sentence_length > 28 else (0.8 if avg_sentence_length > 24 else 0.0)
        naturalness = max(2.0, round(9.5 - (len(flagged_phrases) * 1.5) - length_penalty, 1))
        
        directness = 9.0 if (15 <= word_count <= 250 and avg_sentence_length <= 22) else 7.5
        simplicity = max(3.0, round(9.5 - (1.0 if any(len(w) > 15 for w in words) else 0) - (0.5 * len(flagged_phrases)), 1))
        
        conversational = 9.0 if (mode in ["casual", "spoken"] and has_qualifier) else (8.0 if mode == "professional" else 7.5)
        context_fit = 9.0 if (format_type or audience) else 8.5
        verbosity = 9.0 if avg_sentence_length <= 20 else (7.0 if avg_sentence_length <= 26 else 5.5)
        mode_consistency = max(4.0, round(9.0 - (1.5 if issues else 0), 1))

        values = [naturalness, directness, simplicity, context_fit, conversational, verbosity, mode_consistency]
        overall = round(sum(values) / len(values), 1)

        # Drift Status calculation
        drift_status = "aligned"
        if len(flagged_phrases) > 0 or len(long_sentences) >= 2 or overall < 7.0:
            drift_status = "drift_detected" if overall < 7.8 else "minor_drift"

        return {
            "naturalness": naturalness,
            "directness": directness,
            "simplicity": simplicity,
            "context_fit": context_fit,
            "conversational": conversational,
            "ai_sounding": ai_sounding,
            "verbosity": verbosity,
            "mode_consistency": mode_consistency,
            "overall": overall,
            "word_count": word_count,
            "sentence_count": sentence_count,
            "avg_sentence_length": avg_sentence_length,
            "drift_status": drift_status,
            "issues": issues,
            "flagged_phrases": flagged_phrases,
            "drift_details": drift_details,
            "guide_fix_recommendations": recommendations,
        }

