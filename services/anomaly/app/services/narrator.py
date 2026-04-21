"""Gemini-powered narrator that turns raw anomaly flags into a friendly,
attention-grabbing statement for the worker.

Uses urllib (stdlib only) to avoid adding new runtime dependencies.
Falls back gracefully to a deterministic message if the API is missing
or fails so the UI never breaks.
"""

import json
import os
import urllib.request
import urllib.error
from typing import Optional


GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)


def _build_prompt(detection: dict) -> str:
    flags = detection.get("flags", []) or []
    summary = detection.get("summary", "")

    if not flags:
        return (
            "You are a supportive financial coach for gig workers in Pakistan. "
            "Our statistical analysis found NO anomalies in this worker's recent "
            "shifts. Write a short (2-3 sentences), warm and encouraging message "
            "in plain English celebrating that their earnings look stable and "
            "healthy. Do not invent numbers. Do not use markdown. "
            f"Statistical summary: {summary}"
        )

    flag_lines = []
    for i, f in enumerate(flags, 1):
        flag_lines.append(
            f"{i}. type={f.get('type')} severity={f.get('severity')} "
            f"-> {f.get('explanation')}"
        )

    return (
        "You are a supportive financial coach for gig workers in Pakistan. "
        "Our statistical engine detected the following anomalies in this "
        "worker's recent earnings. Write a short (3-5 sentences), clear and "
        "human report that:\n"
        "  - opens with a one-line headline of what's going on,\n"
        "  - explains the impact in plain English (no jargon, no z-scores),\n"
        "  - ends with 1-2 concrete, practical next steps the worker can take.\n"
        "Be empathetic but direct. Use the numbers from the explanations as-is "
        "(do not invent new figures). No markdown, no bullet symbols, just "
        "natural prose paragraphs separated by blank lines.\n\n"
        f"Statistical summary: {summary}\n\n"
        "Detected anomalies:\n" + "\n".join(flag_lines)
    )


def _fallback_statement(detection: dict) -> str:
    flags = detection.get("flags", []) or []
    if not flags:
        return (
            "Good news — your recent shifts look healthy. We didn't find any "
            "unusual deductions, sudden income drops, or below-zone earnings. "
            "Keep logging shifts so we can keep an eye on things for you."
        )
    parts = [detection.get("summary", "We found a few things worth your attention.")]
    for f in flags:
        parts.append(f.get("explanation", ""))
    return " ".join(p for p in parts if p)


def narrate(detection: dict) -> dict:
    """Return {statement, model, source} for a detection result.

    `source` is "ai" if Gemini answered, "fallback" otherwise.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"

    if not api_key:
        return {
            "statement": _fallback_statement(detection),
            "model": None,
            "source": "fallback",
        }

    prompt = _build_prompt(detection)
    url = GEMINI_ENDPOINT.format(model=model) + f"?key={api_key}"
    # gemini-2.5-flash uses an internal "thinking" budget that consumes
    # output tokens before any text is emitted. We disable thinking and
    # give plenty of headroom so the statement is never truncated.
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 2048,
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"[anomaly.narrator] Gemini HTTP {e.code}: {e.read()[:300]!r}")
        return {
            "statement": _fallback_statement(detection),
            "model": model,
            "source": "fallback",
        }
    except Exception as e:
        print(f"[anomaly.narrator] Gemini call failed: {e!r}")
        return {
            "statement": _fallback_statement(detection),
            "model": model,
            "source": "fallback",
        }

    text = _extract_text(payload)
    finish = _finish_reason(payload)
    if not text:
        print(f"[anomaly.narrator] empty Gemini response (finish={finish})")
        return {
            "statement": _fallback_statement(detection),
            "model": model,
            "source": "fallback",
        }
    if finish == "MAX_TOKENS":
        # Got partial text but Gemini was cut off — log it so we notice.
        print(f"[anomaly.narrator] Gemini truncated (MAX_TOKENS), len={len(text)}")
    return {"statement": text.strip(), "model": model, "source": "ai"}


def _finish_reason(payload: dict) -> Optional[str]:
    try:
        candidates = payload.get("candidates") or []
        if not candidates:
            return None
        return candidates[0].get("finishReason")
    except Exception:
        return None


def _extract_text(payload: dict) -> Optional[str]:
    try:
        candidates = payload.get("candidates") or []
        if not candidates:
            return None
        parts = candidates[0].get("content", {}).get("parts", []) or []
        chunks = [p.get("text", "") for p in parts if isinstance(p, dict)]
        joined = "".join(chunks).strip()
        return joined or None
    except Exception:
        return None
