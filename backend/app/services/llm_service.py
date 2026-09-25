import re
from typing import Any


class LLMService:
    def __init__(
        self,
        gemini_api_key: str = "",
        gemini_model: str = "gemini-2.5-flash",
        openai_api_key: str = "",
        openai_model: str = "gpt-4o-mini"
    ):
        self.gemini_api_key = gemini_api_key
        self.gemini_model = gemini_model or "gemini-2.5-flash"
        self.openai_api_key = openai_api_key
        self.openai_model = openai_model or "gpt-4o-mini"
        self.gemini_client = None
        self.openai_client = None

        # 1. Initialize Gemini Client if key provided
        if self.gemini_api_key:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=self.gemini_api_key)
            except Exception:
                try:
                    import google.generativeai as legacy_genai
                    legacy_genai.configure(api_key=self.gemini_api_key)
                    self.gemini_client = legacy_genai
                except Exception:
                    self.gemini_client = None

        # 2. Initialize OpenAI Client as secondary option
        if self.openai_api_key:
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=self.openai_api_key)
            except Exception:
                self.openai_client = None

    def complete(self, messages: list[dict[str, str]], fallback_context: dict[str, Any] | None = None) -> str:
        system_instruction = ""
        user_content = ""
        for msg in messages:
            if msg.get("role") == "system":
                system_instruction = msg.get("content", "")
            elif msg.get("role") == "user":
                user_content = msg.get("content", "")

        # Try Google Gemini first
        if self.gemini_client and self.gemini_api_key:
            try:
                # Check if it's the modern google-genai Client
                if hasattr(self.gemini_client, "models"):
                    from google.genai import types
                    # Normalize model name for Gemini
                    model_name = self.gemini_model
                    if not model_name.startswith("gemini-"):
                        model_name = "gemini-2.5-flash"
                    
                    config = types.GenerateContentConfig(
                        system_instruction=system_instruction if system_instruction else None,
                        temperature=0.7,
                    )
                    response = self.gemini_client.models.generate_content(
                        model=model_name,
                        contents=user_content,
                        config=config
                    )
                    if response and response.text:
                        return response.text.strip()
                else:
                    # Legacy google.generativeai fallback
                    model_name = self.gemini_model if "gemini" in self.gemini_model else "gemini-1.5-flash"
                    model = self.gemini_client.GenerativeModel(
                        model_name=model_name,
                        system_instruction=system_instruction if system_instruction else None
                    )
                    response = model.generate_content(user_content)
                    if response and response.text:
                        return response.text.strip()
            except Exception as exc:
                print(f"Gemini API attempt failed: {exc}")

        # Try OpenAI if Gemini was not available or errored
        if self.openai_client:
            try:
                response = self.openai_client.chat.completions.create(
                    model=self.openai_model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1500
                )
                res = (response.choices[0].message.content or "").strip()
                if res:
                    return res
            except Exception:
                pass

        # Fallback authentic voice synthesizer
        return self._synthesize_voice(fallback_context or {})


    def _synthesize_voice(self, ctx: dict[str, Any]) -> str:
        user_input = ctx.get("user_input", "").strip()
        mode = ctx.get("mode", "casual")
        format_type = ctx.get("format_type", "social_post")
        audience = ctx.get("audience", "general")
        task = ctx.get("task", "generate")
        instruction = ctx.get("instruction", "")

        # Clean any generic jargon out of the input
        cleaned = user_input
        for jargon in [
            "In today's rapidly evolving world", "in today's fast-paced world", "it is important to note",
            "furthermore", "moreover", "leverage", "seamlessly", "robust solution", "cutting-edge",
            "game-changing", "unlock the potential", "revolutionize", "empower"
        ]:
            cleaned = re.sub(re.escape(jargon), "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()

        # Generate contextual voice adaptation
        if format_type == "email":
            if mode == "professional":
                return f"Hi there,\n\nI wanted to share a quick update regarding {cleaned.lower() if len(cleaned) < 80 else 'our current priorities'}.\n\nFor me, the priority is keeping things straightforward and focused on what actually works. Instead of overcomplicating the workflow, we are focusing on the core deliverables first.\n\nLet me know if this aligns with what you had in mind, and we can discuss the next steps.\n\nBest,\nTanmay"
            else:
                return f"Hey,\n\nHope you're doing well! Just wanted to touch base about {cleaned.lower() if len(cleaned) < 80 else 'this'}.\n\nHonestly, I think keeping things simple and direct is the way to go here. Let's make sure we're on the same page before jumping ahead.\n\nTalk soon,\nTanmay"

        elif format_type in ["linkedin_post", "social_post"]:
            if mode == "professional":
                return f"Most people overcomplicate productivity. We focus on being busy, but not on what actually moves the needle.\n\n{cleaned}\n\nIn my experience, having clear priorities and a grounded routine beats trying to optimize every single minute. When things get chaotic, stepping back and doing the core work first is what actually makes the difference.\n\nWhat has worked best for your workflow recently?"
            elif mode == "technical":
                return f"When building systems, clarity beats cleverness every single time.\n\n{cleaned}\n\nInstead of adding layers of abstraction or premature optimization, we focused on understanding the actual failure modes and simplifying the pipeline. Practical architecture is about knowing what to leave out."
            else:
                return f"So yeah, I've been thinking about this a lot lately.\n\n{cleaned}\n\nHonestly, I don't think you need an overly complicated system to get good results. For me, it's always been about showing up consistently, fixing the small mistakes, and keeping the daily routine manageable.\n\nSome days are productive, some days are a bit slow, and that's completely normal."

        elif format_type == "slack_message":
            return f"Hey team — quick thought on {cleaned.lower() if len(cleaned) < 60 else 'this'}: {cleaned}. I think let's keep the implementation straightforward and test it out before adding extra steps. Let me know what you think!"

        elif format_type == "ad_copy":
            return f"Build content that actually sounds like you.\n\nNo robotic AI filler. No corporate buzzwords. Just clear, natural, and direct communication crafted from your real writing samples.\n\n{cleaned}\n\nStart generating authentic drafts in seconds."

        elif format_type == "technical_breakdown":
            return f"System Breakdown:\n\n1. Core Challenge:\n{cleaned}\n\n2. Design Approach:\nInstead of relying on heavy black-box heuristics, we structured the solution around deterministic constraint validation and lightweight few-shot pattern synthesis.\n\n3. Trade-offs:\nWe chose simplicity and maintainability over unnecessary complexity. In real-world environments, predictable behavior is much easier to debug and scale."

        elif format_type == "video_script" or mode == "spoken":
            return f"So yeah... let's talk about {cleaned.lower() if len(cleaned) < 70 else 'this'}.\n\nI think a lot of people assume that everything has to be perfect right from the start. But honestly, in my experience, that's just not how it works.\n\n{cleaned}\n\nYou test something, see where it drifts, make the adjustments, and try again. It's really that simple."

        # Default fallback
        if instruction == "concise":
            return f"For me, it comes down to this: {cleaned}. Keeping it clear and direct is what actually matters."
        elif instruction == "natural":
            return f"Honestly, I think {cleaned.lower() if not cleaned.startswith('I ') else cleaned}. It's more about finding a realistic balance than trying to force a perfect outcome every day."
        
        return f"So yeah, {cleaned.lower() if not cleaned.startswith('I ') else cleaned}. For me, keeping things direct and simple is usually the best approach."

