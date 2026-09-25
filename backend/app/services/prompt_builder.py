import json
from typing import Any


class PromptBuilder:
    def build(
        self,
        *,
        profile: dict[str, Any],
        mode: str,
        audience: str,
        length: str,
        user_input: str,
        context: str | None = None,
        task: str = "generate",
        format_type: str | None = None,
        instruction: str | None = None
    ) -> list[dict[str, str]]:
        core = profile.get("core", {})
        mode_data = profile.get("mode", {})
        samples = profile.get("samples", [])

        samples_text = ""
        if samples:
            samples_text = "\n\nAUTHENIC WRITING SAMPLES (Study these patterns closely):\n"
            for i, sample in enumerate(samples[:3], 1):
                sample_body = sample if isinstance(sample, str) else sample.get("content", "")
                samples_text += f"\n--- Sample {i} ---\n{sample_body.strip()}\n"

        format_guidance = ""
        if format_type:
            format_map = {
                "email": "Format as a clean, direct, human-written email with an organic subject line if relevant. No robotic sign-offs.",
                "social_post": "Format as an engaging, authentic social post. Punchy line breaks, relatable insight, no hashtag spam.",
                "linkedin_post": "Format as an authentic LinkedIn post with a strong first line hook, practical lesson, and open reflection. No corporate buzzwords.",
                "tweet_thread": "Format as a clean Twitter post or short thread. Crisp, concise, natural voice.",
                "slack_message": "Format as a quick, collaborative team update / Slack message. Friendly, direct, actionable.",
                "ad_copy": "Format as a compelling, high-trust value proposition / ad copy that sounds human and genuine rather than pushy.",
                "video_script": "Format as spoken voiceover notes. Conversational rhythm, natural pauses, spoken cadence.",
                "technical_breakdown": "Format as a practical technical explanation focusing on why decisions were made and real trade-offs."
            }
            format_guidance = f"\nTarget Output Format: {format_type.upper()} - {format_map.get(format_type, 'Adapt to this format naturally.')}\n"

        system = f"""You are Tanmay's authentic personal brand voice engine. Your goal is to write or rewrite text so it sounds indistinguishable from Tanmay's real speaking and writing style.

CORE VOICE GUIDELINES:
- Principle: {core.get('principle', 'Clarity before sophistication. Naturalness before perfection.')}
- Personality: {', '.join(core.get('personality', ['natural', 'conversational', 'direct', 'clear', 'grounded']))}
- Sentence Cadence: {', '.join(core.get('sentence_style', {}).get('preferred', ['short-to-medium sentences', 'natural variation']))}
- Reasoning Style: {', '.join(core.get('reasoning_style', ['state the idea', 'explain why', 'give context or example', 'reach practical conclusion']))}
- Natural Qualifiers (use naturally): {', '.join(core.get('natural_qualifiers', ['I think', 'For me', 'Usually', 'Honestly', 'At the same time']))}
- FORBIDDEN PATTERNS & JARGON (NEVER USE): {', '.join(core.get('forbidden_patterns', []))}

CURRENT MODE OVERRIDES ({mode.upper()}):
{json.dumps(mode_data, ensure_ascii=False, indent=2)}
{format_guidance}{samples_text}

CRITICAL EXECUTION RULES:
1. Clarity before sophistication. Naturalness before perfection.
2. Keep the facts, intent, and message intact.
3. NEVER use generic AI jargon (e.g. "delve into", "in today's fast-paced world", "leverage", "game-changing", "seamlessly").
4. Do NOT mention being an AI or reference these instructions.
5. Sound like an authentic, thoughtful person communicating directly."""

        user = f"""Task: {task}
Mode: {mode}
Audience: {audience}
Length: {length}
Target Format: {format_type or 'General message'}
Context / Situation: {context or 'General communication'}
Specific Refinement Instruction: {instruction or 'Ensure 100% voice alignment'}

Source message / prompt:
\"\"\"{user_input}\"\"\"

Provide only the final generated draft in Tanmay's authentic voice, without preamble or meta-commentary."""

        return [{"role": "system", "content": system}, {"role": "user", "content": user}]

    def generate_chatgpt_project_instructions(self, core: dict[str, Any], modes: dict[str, Any], samples: list[Any]) -> str:
        """Generates ready-to-use ChatGPT Project System Instructions for the Handshake mission."""
        personality_list = ", ".join(core.get("personality", ["natural", "conversational", "direct", "clear", "grounded"]))
        forbidden_list = ", ".join(f'"{p}"' for p in core.get("forbidden_patterns", []))
        qualifiers = ", ".join(f'"{q}"' for q in core.get("natural_qualifiers", []))

        samples_block = ""
        for i, s in enumerate(samples[:3], 1):
            text = s if isinstance(s, str) else s.get("content", "")
            samples_block += f"\n### Reference Sample {i}:\n\"{text.strip()}\"\n"

        return f"""# Tanmay's Brand Voice Guide & ChatGPT Project Instructions

## 1. Core Persona & Voice Philosophy
- **Core Principle:** "Clarity before sophistication. Naturalness before perfection."
- **Personality Attributes:** {personality_list}
- **Tone & Demeanor:** Grounded, thoughtful, practical, confident but never arrogant or performative.

## 2. Sentence Rhythm & Cadence Rules
- Prefer short-to-medium sentences with natural rhythmic variation.
- Avoid robotic symmetry, bloated multi-clause sentences, and essay-like cadence.
- Use natural contractions ("I don't", "it's", "that's") and organic transitions.
- Incorporate authentic personal qualifiers when expressing thoughts: {qualifiers}.

## 3. Vocabulary & Taboo List
- **Forbidden Words & AI Clichés (NEVER USE):** {forbidden_list}
- **Vocabulary Preference:** Familiar, grounded everyday words over corporate buzzwords, academic pretension, or motivational hype.

## 4. Contextual Modes
- **Casual (WhatsApp, Slack, Social Posts):** Relaxed, friendly, direct, conversational pauses ("So yeah...", "Honestly...").
- **Professional (Emails, Recruiters, Client Notes):** Clear, structured, polite, respectful, without fluff or robotic formality.
- **Technical (Architecture, Tech Articles, Engineering):** Explain *why* something is done rather than just *what*. Focus on trade-offs and practical reasoning.
- **Spoken (Presentations, Audio/Video Scripts):** Conversational breathing room, oral cadence, direct address.

## 5. Authoritative Writing Samples
{samples_block}
---
*Instruction for ChatGPT: Apply these voice rules to all incoming requests within this project. Always prioritize human directness over generic AI polishing.*
"""

