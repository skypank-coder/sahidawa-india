from __future__ import annotations

import io
import ipaddress
import socket
import time
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

import cv2
import httpx
import numpy as np
from PIL import Image
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class CompareRequest(BaseModel):
    cloudinary_url: str
    medicine_name: Optional[str] = None


class CompareResponse(BaseModel):
    verdict: str
    confidence: float
    matched_reference: Optional[str] = None
    processing_time_ms: int
    error: Optional[str] = None


SEEDS_DIR = Path(__file__).resolve().parents[3] / "data" / "seeds" / "medicines"
_reference_cache: dict[str, tuple[list, np.ndarray]] = {}


def _is_public_host(hostname: str) -> bool:
    try:
        resolved = socket.getaddrinfo(hostname, None, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise ValueError(f"Could not resolve host: {hostname}") from exc

    for family, _, _, _, sockaddr in resolved:
        ip = ipaddress.ip_address(sockaddr[0])
        if ip.is_global and not ip.is_private and not ip.is_loopback and not ip.is_link_local:
            return True

    raise ValueError(f"Host resolves to a non-public address: {hostname}")


def _validate_cloudinary_url(url: str) -> httpx.URL:
    parsed = urlparse(url)

    if parsed.scheme != "https":
        raise ValueError("Only HTTPS Cloudinary URLs are allowed")

    if parsed.username or parsed.password:
        raise ValueError("Credentials are not allowed in Cloudinary URLs")

    host = parsed.hostname or ""
    if not host.endswith(".cloudinary.com"):
        raise ValueError("Only Cloudinary URLs are allowed")

    _is_public_host(host)

    normalized = httpx.URL(url)
    if not normalized.host:
        raise ValueError("Cloudinary URL must include a host")

    return normalized


def _load_reference_cache() -> None:
    global _reference_cache

    _reference_cache = {}

    if not SEEDS_DIR.exists():
        return

    orb = cv2.ORB_create(nfeatures=1000)

    for ref_path in SEEDS_DIR.iterdir():
        if ref_path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue

        img = cv2.imread(str(ref_path))
        if img is None:
            continue

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        keypoints, descriptors = orb.detectAndCompute(gray, None)

        if descriptors is not None:
            _reference_cache[ref_path.name] = (keypoints, descriptors)


def _download_image(url: str) -> np.ndarray:
    safe_url = _validate_cloudinary_url(url)

    with httpx.Client(timeout=10.0, follow_redirects=False) as client:
        response = client.get(safe_url)
        response.raise_for_status()

    image = Image.open(io.BytesIO(response.content)).convert("RGB")
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)


def _compare_with_cache(submitted_image: np.ndarray) -> tuple[float, Optional[str]]:
    if not _reference_cache:
        _load_reference_cache()

    orb = cv2.ORB_create(nfeatures=1000)
    gray = cv2.cvtColor(submitted_image, cv2.COLOR_BGR2GRAY)
    _, query_descriptors = orb.detectAndCompute(gray, None)

    if query_descriptors is None:
        return 0.0, None

    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    best_score = 0.0
    best_reference = None

    for filename, (_, reference_descriptors) in _reference_cache.items():
        if reference_descriptors is None:
            continue

        matches = matcher.match(query_descriptors, reference_descriptors)
        if not matches:
            continue

        good_matches = [match for match in matches if match.distance < 50]
        score = (len(good_matches) / len(matches)) * 100

        if score > best_score:
            best_score = score
            best_reference = filename

    return best_score, best_reference


@router.post("/compare", response_model=CompareResponse)
async def compare_medicine_image(request: CompareRequest):
    start_time = time.time()

    try:
        submitted_image = _download_image(request.cloudinary_url)
    except Exception as exc:
        return CompareResponse(
            verdict="SUSPICIOUS",
            confidence=0.0,
            processing_time_ms=int((time.time() - start_time) * 1000),
            error=f"Failed to download image: {str(exc)}",
        )

    if not _reference_cache:
        _load_reference_cache()

    if not _reference_cache:
        return CompareResponse(
            verdict="SUSPICIOUS",
            confidence=0.0,
            processing_time_ms=int((time.time() - start_time) * 1000),
            error="No reference images available",
        )

    best_score, best_reference = _compare_with_cache(submitted_image)

    if best_score >= 60:
        verdict = "GENUINE"
    elif best_score >= 30:
        verdict = "SUSPICIOUS"
    else:
        verdict = "LIKELY_FAKE"

    return CompareResponse(
        verdict=verdict,
        confidence=round(best_score, 2),
        matched_reference=best_reference,
        processing_time_ms=int((time.time() - start_time) * 1000),
    )


@router.get("/api/v1/cache/reload")
def reload_reference_cache():
    _load_reference_cache()

    return {"cached_references": len(_reference_cache), "status": "reloaded"}
