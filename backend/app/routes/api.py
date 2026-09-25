from fastapi import APIRouter, HTTPException
from ..config import get_settings
from ..models.schemas import (
    ContentRequest,
    ContentResponse,
    DualDraftRequest,
    DualDraftResponse,
    EvaluateRequest,
    RefineRequest,
    VoiceProfileResponse,
    VoiceProfileUpdate,
    ModeProfileUpdate,
    SampleCreateRequest,
    DriftFixRequest,
    SubmissionPackRequest,
    SubmissionPackResponse,
)
from ..services.content_service import ContentService
from ..services.evaluator import VoiceEvaluator
from ..services.llm_service import LLMService
from ..services.voice_engine import VoiceEngine

router = APIRouter(prefix="/api")


def get_service() -> ContentService:
    settings = get_settings()
    return ContentService(
        VoiceEngine(settings.voice_profile_dir, settings.voice_samples_dir),
        LLMService(settings.openai_api_key, settings.openai_model)
    )


def execute(request: ContentRequest, task: str, instruction: str | None = None) -> ContentResponse:
    try:
        service = get_service()
        content, evaluation = service.run(
            input=request.input,
            mode=request.mode,
            audience=request.audience,
            length=request.length,
            context=request.context,
            task=task,
            format_type=request.format_type or "social_post",
            instruction=instruction
        )
        return ContentResponse(
            content=content,
            mode=request.mode,
            format_type=request.format_type,
            evaluation=evaluation
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Generation failed: {exc}") from exc


@router.post("/generate", response_model=ContentResponse)
def generate(request: ContentRequest) -> ContentResponse:
    return execute(request, "generate")


@router.post("/dual-draft", response_model=DualDraftResponse)
def dual_draft(request: DualDraftRequest) -> DualDraftResponse:
    try:
        service = get_service()
        result = service.run_dual_draft(
            input=request.input,
            format_a=request.format_a,
            mode_a=request.mode_a,
            audience_a=request.audience_a,
            format_b=request.format_b,
            mode_b=request.mode_b,
            audience_b=request.audience_b,
            length=request.length,
            context=request.context
        )
        return DualDraftResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Dual draft generation failed: {exc}") from exc


@router.post("/rewrite", response_model=ContentResponse)
def rewrite(request: ContentRequest) -> ContentResponse:
    return execute(request, "rewrite")


@router.post("/refine", response_model=ContentResponse)
def refine(request: RefineRequest) -> ContentResponse:
    return execute(request, "refine", request.instruction)


@router.post("/evaluate")
def evaluate(request: EvaluateRequest) -> dict:
    service = get_service()
    evaluator = service.get_evaluator()
    return evaluator.evaluate(
        request.content,
        mode=request.mode,
        audience=request.audience,
        format_type=request.format_type
    )


@router.post("/fix-drift-in-guide")
def fix_drift_in_guide(request: DriftFixRequest) -> dict:
    settings = get_settings()
    engine = VoiceEngine(settings.voice_profile_dir, settings.voice_samples_dir)
    updated_core = engine.add_forbidden_pattern(request.forbidden_pattern, request.rule_note)
    return {"status": "success", "message": f"Added '{request.forbidden_pattern}' to forbidden voice patterns.", "core": updated_core}


@router.get("/voice-profile", response_model=VoiceProfileResponse)
def voice_profile() -> VoiceProfileResponse:
    settings = get_settings()
    engine = VoiceEngine(settings.voice_profile_dir, settings.voice_samples_dir)
    service = ContentService(engine, LLMService(settings.openai_api_key, settings.openai_model))
    core = engine.load_core()
    modes = {mode: engine.load_mode(mode) for mode in ("casual", "professional", "technical", "spoken")}
    samples = engine.load_samples()
    instructions = service.export_chatgpt_instructions()
    return VoiceProfileResponse(
        core=core,
        modes=modes,
        samples=samples,
        chatgpt_project_instructions=instructions
    )


@router.post("/voice-profile", response_model=VoiceProfileResponse)
def update_voice_profile(request: VoiceProfileUpdate) -> VoiceProfileResponse:
    settings = get_settings()
    engine = VoiceEngine(settings.voice_profile_dir, settings.voice_samples_dir)
    engine.save_core(request.core)
    return voice_profile()


@router.put("/voice-profile/mode")
def update_mode_profile(request: ModeProfileUpdate) -> dict:
    settings = get_settings()
    engine = VoiceEngine(settings.voice_profile_dir, settings.voice_samples_dir)
    updated = engine.save_mode(request.mode, request.data)
    return {"status": "success", "mode": request.mode, "data": updated}


@router.get("/samples")
def get_samples() -> list[dict]:
    settings = get_settings()
    engine = VoiceEngine(settings.voice_profile_dir, settings.voice_samples_dir)
    return engine.load_samples()


@router.post("/samples")
def add_sample(request: SampleCreateRequest) -> dict:
    settings = get_settings()
    engine = VoiceEngine(settings.voice_profile_dir, settings.voice_samples_dir)
    new_sample = engine.add_sample(request.title, request.content)
    return {"status": "success", "sample": new_sample}


@router.get("/export-project-instructions")
def export_instructions() -> dict[str, str]:
    service = get_service()
    return {"instructions": service.export_chatgpt_instructions()}


@router.post("/submission-pack", response_model=SubmissionPackResponse)
def generate_submission_pack(request: SubmissionPackRequest) -> SubmissionPackResponse:
    try:
        service = get_service()
        pack = service.build_submission_pack(
            core_topic=request.core_topic,
            draft_a_content=request.draft_a_content,
            draft_a_format=request.draft_a_format,
            draft_b_content=request.draft_b_content,
            draft_b_format=request.draft_b_format,
            final_post_content=request.final_post_content,
            final_post_format=request.final_post_format,
            drift_notes=request.drift_notes
        )
        return SubmissionPackResponse(**pack)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate submission pack: {exc}") from exc

