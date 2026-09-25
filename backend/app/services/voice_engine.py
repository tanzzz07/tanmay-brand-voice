from pathlib import Path
from typing import Any
import yaml


class VoiceEngine:
    def __init__(self, profile_dir: Path, samples_dir: Path):
        self.profile_dir, self.samples_dir = profile_dir, samples_dir
        self.profile_dir.mkdir(parents=True, exist_ok=True)
        self.samples_dir.mkdir(parents=True, exist_ok=True)

    def load_yaml(self, path: Path) -> dict[str, Any]:
        if not path.exists():
            return {}
        with path.open("r", encoding="utf-8") as handle:
            return yaml.safe_load(handle) or {}

    def save_yaml(self, path: Path, data: dict[str, Any]) -> None:
        with path.open("w", encoding="utf-8") as handle:
            yaml.safe_dump(data, handle, sort_keys=False, allow_unicode=True)

    def load_core(self) -> dict[str, Any]:
        return self.load_yaml(self.profile_dir / "core_voice.yaml")

    def save_core(self, data: dict[str, Any]) -> dict[str, Any]:
        self.save_yaml(self.profile_dir / "core_voice.yaml", data)
        return self.load_core()

    def load_mode(self, mode: str) -> dict[str, Any]:
        if mode not in {"casual", "professional", "technical", "spoken"}:
            raise ValueError(f"Unsupported voice mode: {mode}")
        return self.load_yaml(self.profile_dir / f"{mode}.yaml")

    def save_mode(self, mode: str, data: dict[str, Any]) -> dict[str, Any]:
        if mode not in {"casual", "professional", "technical", "spoken"}:
            raise ValueError(f"Unsupported voice mode: {mode}")
        self.save_yaml(self.profile_dir / f"{mode}.yaml", data)
        return self.load_mode(mode)

    def load_samples(self) -> list[dict[str, Any]]:
        samples = []
        titles = {
            "sample_01.txt": "Morning Routine & Screen/Life Balance",
            "sample_02.txt": "Hard Work, Failure & Learning from Mistakes",
            "sample_03.txt": "Busyness vs Real Productivity & Priorities"
        }
        for path in sorted(self.samples_dir.glob("*.txt")):
            text = path.read_text(encoding="utf-8").strip()
            filename = path.name
            samples.append({
                "id": path.stem,
                "filename": filename,
                "title": titles.get(filename, path.stem.replace("_", " ").title()),
                "content": text,
                "word_count": len(text.split()),
                "char_count": len(text)
            })
        return samples

    def add_sample(self, title: str, content: str) -> dict[str, Any]:
        existing = list(self.samples_dir.glob("sample_*.txt"))
        next_num = len(existing) + 1
        filename = f"sample_{next_num:02d}.txt"
        file_path = self.samples_dir / filename
        file_path.write_text(content.strip(), encoding="utf-8")
        return {
            "id": file_path.stem,
            "filename": filename,
            "title": title,
            "content": content.strip(),
            "word_count": len(content.split()),
            "char_count": len(content)
        }

    def add_forbidden_pattern(self, pattern: str, rule_note: str | None = None) -> dict[str, Any]:
        core = self.load_core()
        forbidden = core.get("forbidden_patterns", [])
        clean_pat = pattern.strip()
        if clean_pat and clean_pat not in forbidden:
            forbidden.append(clean_pat)
            core["forbidden_patterns"] = forbidden
            if rule_note:
                general_rules = core.get("general_rules", [])
                if rule_note not in general_rules:
                    general_rules.append(rule_note)
                    core["general_rules"] = general_rules
            self.save_core(core)
        return core

    def profile(self, mode: str) -> dict[str, Any]:
        raw_samples = [s["content"] for s in self.load_samples()]
        return {"core": self.load_core(), "mode": self.load_mode(mode), "samples": raw_samples}

