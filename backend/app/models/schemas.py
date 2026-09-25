from typing import Literal, Any
from pydantic import BaseModel, Field, field_validator

Mode = Literal["casual", "professional", "technical", "spoken"]
Audience = Literal["general", "recruiter", "technical", "friend", "client", "custom"]
Length = Literal["short", "medium", "long"]
FormatType = Literal[
    "email",
    "social_post",
    "linkedin_post",
    "tweet_thread",
    "slack_message",
    "ad_copy",
    "video_script",
    "technical_breakdown"
]


class ContentRequest(BaseModel):
    input: str = Field(..., min_length=1, max_length=12000)
    mode: Mode = "casual"
    audience: Audience = "general"
    custom_audience: str | None = Field(default=None, max_length=200)
    length: Length = "medium"
    context: str | None = Field(default=None, max_length=1000)
    format_type: FormatType | None = "social_post"

    @field_validator("input")
    @classmethod
    def strip_input(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Input cannot be empty")
        return value


class DualDraftRequest(BaseModel):
    input: str = Field(..., min_length=1, max_length=12000)
    format_a: FormatType = "email"
    mode_a: Mode = "professional"
    audience_a: Audience = "recruiter"
    format_b: FormatType = "social_post"
    mode_b: Mode = "casual"
    audience_b: Audience = "general"
    length: Length = "medium"
    context: str | None = Field(default=None, max_length=1000)

    @field_validator("input")
    @classmethod
    def strip_input(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Input cannot be empty")
        return value


class RefineRequest(ContentRequest):
    instruction: Literal["natural", "concise", "punchy", "conversational", "regenerate"] = "natural"


class DraftItem(BaseModel):
    format_type: str
    mode: Mode
    audience: str
    content: str
    evaluation: dict[str, Any]


class DualDraftResponse(BaseModel):
    topic: str
    draft_a: DraftItem
    draft_b: DraftItem
    drift_comparison: dict[str, Any]


class ContentResponse(BaseModel):
    content: str
    mode: Mode
    format_type: str | None = None
    evaluation: dict[str, Any] | None = None


class VoiceProfileResponse(BaseModel):
    core: dict[str, Any]
    modes: dict[str, dict[str, Any]]
    samples: list[dict[str, Any]]
    chatgpt_project_instructions: str


class VoiceProfileUpdate(BaseModel):
    core: dict[str, Any]


class ModeProfileUpdate(BaseModel):
    mode: Mode
    data: dict[str, Any]


class SampleCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=10, max_length=12000)


class EvaluateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=12000)
    mode: Mode = "casual"
    audience: Audience = "general"
    format_type: str | None = None


class DriftFixRequest(BaseModel):
    forbidden_pattern: str = Field(..., min_length=2, max_length=150)
    rule_note: str | None = Field(default=None, max_length=300)


class SubmissionPackRequest(BaseModel):
    core_topic: str = Field(default="Balancing productivity and sustainable routines")
    draft_a_content: str | None = None
    draft_a_format: str = "Work Email / Announcement"
    draft_b_content: str | None = None
    draft_b_format: str = "Casual LinkedIn / Social Post"
    final_post_content: str | None = None
    final_post_format: str = "Real Post / Ad"
    drift_notes: str | None = None


class SubmissionPackResponse(BaseModel):
    project_title: str
    student_name: str
    chatgpt_project_instructions: str
    writing_samples: list[dict[str, Any]]
    draft_a: dict[str, Any]
    draft_b: dict[str, Any]
    drift_analysis_summary: dict[str, Any]
    final_post: dict[str, Any]
    markdown_report: str

