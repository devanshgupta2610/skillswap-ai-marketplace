"""Cloudinary upload helpers with safe content-type checks."""

from __future__ import annotations

import logging
from typing import Optional

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_configured = False


def _ensure_cloudinary() -> bool:
    global _configured
    if _configured:
        return True
    if not (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET):
        return False
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    _configured = True
    return True


async def upload_file(file: UploadFile, resource_type: str = "image") -> Optional[str]:
    """Upload a file to Cloudinary. Returns URL or None if Cloudinary is not configured."""
    content_type = file.content_type or ""
    allowed = settings.allowed_image_types_list + settings.allowed_doc_types_list
    if content_type not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {content_type}",
        )

    data = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit",
        )

    if not _ensure_cloudinary():
        logger.warning("Cloudinary not configured — skipping upload for %s", file.filename)
        return None

    try:
        result = cloudinary.uploader.upload(
            data,
            folder=settings.CLOUDINARY_FOLDER,
            resource_type=resource_type if resource_type in {"image", "raw", "auto"} else "auto",
            filename_override=file.filename,
        )
        return result.get("secure_url")
    except Exception as exc:
        logger.exception("Cloudinary upload failed")
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}") from exc
