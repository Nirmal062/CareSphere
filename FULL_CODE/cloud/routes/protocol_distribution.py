"""FastAPI Protocol Distribution Routes for CareSphere Cloud API.

Provides versioned endpoints for manifests, streaming compressed packages,
version checking, differential update queries, and health verification.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse

from cloud.storage_adapters import get_storage_adapter, BaseStorageAdapter

router = APIRouter(prefix="/api/v1/protocols", tags=["Protocols Distribution"])
storage: BaseStorageAdapter = get_storage_adapter()


def _get_manifest() -> Dict[str, Any]:
    """Helper to retrieve and parse current manifest from storage."""
    if not storage.file_exists("manifest.json"):
        raise HTTPException(
            status_code=404,
            detail="Knowledge package manifest not found. Run package_builder.py first."
        )
    manifest_bytes = storage.read_bytes("manifest.json")
    return json.loads(manifest_bytes.decode("utf-8"))


@router.get("/health")
def get_protocols_health() -> Dict[str, Any]:
    """Health check verifying cloud protocol distribution storage readiness."""
    has_manifest = storage.file_exists("manifest.json")
    manifest = None
    package_exists = False
    if has_manifest:
        try:
            manifest = _get_manifest()
            package_filename = manifest.get("package_filename", "")
            package_exists = storage.file_exists(package_filename)
        except Exception:
            pass

    return {
        "status": "ok" if (has_manifest and package_exists) else "degraded",
        "service": "CareSphere Cloud Protocol Distribution API",
        "storage_backend": type(storage).__name__,
        "manifest_available": has_manifest,
        "package_available": package_exists,
        "active_version": manifest.get("dataset_version") if manifest else None,
        "total_sections": manifest.get("total_protocol_sections") if manifest else None
    }


@router.get("/manifest")
def get_protocols_manifest() -> Dict[str, Any]:
    """Retrieve cryptographic distribution manifest for the active protocol version."""
    return _get_manifest()


@router.get("/version")
def get_protocols_version() -> Dict[str, Any]:
    """Get concise active protocol version and checksum."""
    manifest = _get_manifest()
    return {
        "dataset_version": manifest.get("dataset_version"),
        "total_protocol_sections": manifest.get("total_protocol_sections"),
        "sha256_checksum": manifest.get("sha256_checksum"),
        "package_filename": manifest.get("package_filename"),
        "package_size_bytes": manifest.get("package_size_bytes"),
        "last_updated_timestamp": manifest.get("last_updated_timestamp")
    }


@router.get("/download")
def download_protocol_package():
    """Stream compressed knowledge package gzip with SHA-256 validation header."""
    manifest = _get_manifest()
    package_filename = manifest["package_filename"]
    sha256 = manifest["sha256_checksum"]
    size = manifest["package_size_bytes"]

    if not storage.file_exists(package_filename):
        raise HTTPException(status_code=404, detail=f"Package file {package_filename} not found.")

    local_path = storage.get_absolute_path(package_filename)
    if local_path and local_path.is_file():
        # Fast direct streaming using FileResponse
        return FileResponse(
            path=str(local_path),
            media_type="application/gzip",
            filename=package_filename,
            headers={
                "X-SHA256-Checksum": sha256,
                "Content-Length": str(size),
                "Cache-Control": "public, max-age=3600"
            }
        )

    # General streaming via stream generator
    stream = storage.open_stream(package_filename)

    def file_iterator():
        try:
            while chunk := stream.read(65536):
                yield chunk
        finally:
            stream.close()

    return StreamingResponse(
        file_iterator(),
        media_type="application/gzip",
        headers={
            "Content-Disposition": f'attachment; filename="{package_filename}"',
            "X-SHA256-Checksum": sha256,
            "Content-Length": str(size),
            "Cache-Control": "public, max-age=3600"
        }
    )


@router.get("/updates")
def check_protocol_updates(client_version: Optional[str] = Query(None, description="Installed client version")):
    """Check for protocol updates against installed mobile client version."""
    manifest = _get_manifest()
    latest_version = manifest["dataset_version"]

    update_available = bool(client_version != latest_version)
    return {
        "update_available": update_available,
        "client_version": client_version,
        "latest_version": latest_version,
        "total_protocol_sections": manifest["total_protocol_sections"],
        "package_filename": manifest["package_filename"],
        "package_size_bytes": manifest["package_size_bytes"],
        "sha256_checksum": manifest["sha256_checksum"],
        "download_url": "/api/v1/protocols/download",
        "last_updated_timestamp": manifest["last_updated_timestamp"]
    }
