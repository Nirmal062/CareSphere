"""Pluggable Storage Adapters for CareSphere Cloud Knowledge Distribution.

Provides abstract and concrete storage interfaces for local mock filesystem
and Google Cloud Storage (GCS), supporting seamless offline-first distribution
and cloud deployments.
"""
from __future__ import annotations

import os
import hashlib
from abc import ABC, abstractmethod
from pathlib import Path
from typing import BinaryIO, Dict, Any, Optional


class BaseStorageAdapter(ABC):
    """Abstract base class defining storage adapter operations."""

    @abstractmethod
    def file_exists(self, filename: str) -> bool:
        """Check if a file exists in the storage backend."""
        pass

    @abstractmethod
    def read_bytes(self, filename: str) -> bytes:
        """Read full binary contents of a file."""
        pass

    @abstractmethod
    def write_bytes(self, filename: str, data: bytes) -> int:
        """Write binary data to a file. Returns number of bytes written."""
        pass

    @abstractmethod
    def get_file_size(self, filename: str) -> int:
        """Return the size in bytes of a file."""
        pass

    @abstractmethod
    def get_sha256(self, filename: str) -> str:
        """Calculate and return hex SHA-256 digest of file."""
        pass

    @abstractmethod
    def get_absolute_path(self, filename: str) -> Optional[Path]:
        """Return local filesystem path if available, or None."""
        pass

    @abstractmethod
    def open_stream(self, filename: str) -> BinaryIO:
        """Open a binary stream for reading."""
        pass


class LocalFileSystemAdapter(BaseStorageAdapter):
    """Local file-system storage adapter for offline-first and test environments."""

    def __init__(self, root_dir: str | Path | None = None):
        if root_dir is None:
            # Default to cloud_storage_root under project directory
            project_root = Path(__file__).resolve().parent.parent
            self.root_dir = project_root / "cloud_storage_root"
        else:
            self.root_dir = Path(root_dir).resolve()
        
        self.root_dir.mkdir(parents=True, exist_ok=True)

    def _resolve(self, filename: str) -> Path:
        # Prevent directory traversal attacks
        clean_name = os.path.basename(filename)
        return self.root_dir / clean_name

    def file_exists(self, filename: str) -> bool:
        return self._resolve(filename).is_file()

    def read_bytes(self, filename: str) -> bytes:
        path = self._resolve(filename)
        if not path.is_file():
            raise FileNotFoundError(f"File not found in storage: {filename}")
        return path.read_bytes()

    def write_bytes(self, filename: str, data: bytes) -> int:
        path = self._resolve(filename)
        path.parent.mkdir(parents=True, exist_ok=True)
        return path.write_bytes(data)

    def get_file_size(self, filename: str) -> int:
        path = self._resolve(filename)
        if not path.is_file():
            raise FileNotFoundError(f"File not found in storage: {filename}")
        return path.stat().st_size

    def get_sha256(self, filename: str) -> str:
        path = self._resolve(filename)
        if not path.is_file():
            raise FileNotFoundError(f"File not found in storage: {filename}")
        h = hashlib.sha256()
        with open(path, "rb") as f:
            while chunk := f.read(65536):
                h.update(chunk)
        return h.hexdigest()

    def get_absolute_path(self, filename: str) -> Optional[Path]:
        return self._resolve(filename)

    def open_stream(self, filename: str) -> BinaryIO:
        path = self._resolve(filename)
        if not path.is_file():
            raise FileNotFoundError(f"File not found in storage: {filename}")
        return open(path, "rb")


class GCSStorageAdapter(BaseStorageAdapter):
    """Google Cloud Storage (GCS) adapter for cloud deployments.
    
    Falls back gracefully if google-cloud-storage is not configured or in mock mode.
    """

    def __init__(self, bucket_name: str = "caresphere-protocols-prod", project_id: Optional[str] = None):
        self.bucket_name = os.getenv("GCS_BUCKET_NAME", bucket_name)
        self.project_id = os.getenv("GCP_PROJECT_ID", project_id)
        self._client = None
        self._bucket = None
        self._fallback_local = LocalFileSystemAdapter()

    def _init_client(self):
        if self._client is None:
            try:
                # Check for gcp_credentials.json if GOOGLE_APPLICATION_CREDENTIALS is not explicitly set
                cred_path = Path(__file__).resolve().parent.parent / "gcp_credentials.json"
                if cred_path.is_file() and not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
                    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(cred_path)

                from google.cloud import storage
                self._client = storage.Client(project=self.project_id)
                self._bucket = self._client.bucket(self.bucket_name)
                # Verify bucket exists and is accessible
                if not self._bucket.exists():
                    self._bucket = None
            except Exception as e:
                # Fall back to local storage adapter when GCS credentials are not provided or inactive
                self._client = False
                self._bucket = None

    def file_exists(self, filename: str) -> bool:
        self._init_client()
        if self._bucket:
            blob = self._bucket.blob(filename)
            return blob.exists()
        return self._fallback_local.file_exists(filename)

    def read_bytes(self, filename: str) -> bytes:
        self._init_client()
        if self._bucket:
            blob = self._bucket.blob(filename)
            return blob.download_as_bytes()
        return self._fallback_local.read_bytes(filename)

    def write_bytes(self, filename: str, data: bytes) -> int:
        self._init_client()
        if self._bucket:
            blob = self._bucket.blob(filename)
            blob.upload_from_string(data)
            return len(data)
        return self._fallback_local.write_bytes(filename, data)

    def get_file_size(self, filename: str) -> int:
        self._init_client()
        if self._bucket:
            blob = self._bucket.get_blob(filename)
            if blob:
                return blob.size
        return self._fallback_local.get_file_size(filename)

    def get_sha256(self, filename: str) -> str:
        self._init_client()
        if self._bucket:
            data = self.read_bytes(filename)
            return hashlib.sha256(data).hexdigest()
        return self._fallback_local.get_sha256(filename)

    def get_absolute_path(self, filename: str) -> Optional[Path]:
        return self._fallback_local.get_absolute_path(filename)

    def open_stream(self, filename: str) -> BinaryIO:
        self._init_client()
        if self._bucket:
            import io
            data = self.read_bytes(filename)
            return io.BytesIO(data)
        return self._fallback_local.open_stream(filename)


def get_storage_adapter(adapter_type: Optional[str] = None, root_dir: Optional[str | Path] = None) -> BaseStorageAdapter:
    """Factory to create storage adapter based on environment configuration."""
    adapter_mode = (adapter_type or os.getenv("STORAGE_ADAPTER_TYPE", "local")).lower()
    if adapter_mode == "gcs":
        return GCSStorageAdapter()
    return LocalFileSystemAdapter(root_dir=root_dir)
