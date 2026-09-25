from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .config import get_settings, ROOT_DIR
from .routes.api import router

app = FastAPI(title="Tanmay Brand Voice Generator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
def health() -> dict[str, str]:
    settings = get_settings()
    engine = "gemini" if settings.active_gemini_key else ("openai" if settings.openai_api_key else "offline_synthesizer")
    model = settings.gemini_model if engine == "gemini" else settings.openai_model
    return {"status": "ok", "engine": engine, "model": model}



# Serve built frontend in production if dist directory exists
DIST_DIR = ROOT_DIR / "frontend" / "dist"
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = DIST_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")

