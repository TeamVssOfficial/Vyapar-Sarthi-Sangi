from pathlib import Path
import os
import re
import io
import base64
import hashlib
import pandas as pd
from cryptography.fernet import Fernet, InvalidToken

from config import settings

# Initialize symmetric cipher derived from system secret
_DERIVED_KEY = base64.urlsafe_b64encode(hashlib.sha256(settings.JWT_SECRET.encode()).digest())
_CIPHER = Fernet(_DERIVED_KEY)


def get_user_storage_dirs(user_id: str, user_name: str | None = None) -> dict[str, Path]:
    """
    Creates and returns an isolated directory tree for the user:
    storage/users/<safe_username>_<user_id_prefix>/
        ├── uploads/     (Encrypted raw datasets, named by ID)
        ├── processed/   (Encrypted cleaned datasets)
        ├── reports/     (Generated PDF & Excel reports)
        └── models/      (Trained ML model artifacts)
    """
    raw_name = (user_name or "user").strip()
    safe_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", raw_name).strip("_")
    if not safe_name:
        safe_name = "user"

    id_short = str(user_id).replace("-", "")[:8]
    folder_name = f"{safe_name}_{id_short}"

    base_user_dir = settings.STORAGE_DIR / "users" / folder_name
    dirs = {
        "root": base_user_dir,
        "uploads": base_user_dir / "uploads",
        "processed": base_user_dir / "processed",
        "cleaned": base_user_dir / "processed",
        "reports": base_user_dir / "reports",
        "models": base_user_dir / "models"
    }

    for d in dirs.values():
        d.mkdir(parents=True, exist_ok=True)

    return dirs


def encrypt_bytes(raw_bytes: bytes) -> bytes:
    """Encrypts bytes using authenticated AES Fernet encryption."""
    return _CIPHER.encrypt(raw_bytes)


def decrypt_bytes(encrypted_bytes: bytes) -> bytes:
    """Decrypts Fernet ciphertext bytes. If data is not Fernet-encrypted, returns raw bytes."""
    try:
        return _CIPHER.decrypt(encrypted_bytes)
    except (InvalidToken, Exception):
        # Fallback for unencrypted legacy datasets
        return encrypted_bytes


def save_encrypted_dataset(data: bytes, target_path: Path) -> int:
    """
    Encrypts dataset bytes and writes to disk.
    Returns the written encrypted file size in bytes.
    """
    target_path.parent.mkdir(parents=True, exist_ok=True)
    encrypted_data = encrypt_bytes(data)
    with open(target_path, "wb") as f:
        f.write(encrypted_data)
    return len(encrypted_data)


def load_encrypted_dataframe(file_path: str | Path, original_filename: str | None = None) -> pd.DataFrame:
    """
    Reads an encrypted (or legacy plaintext) dataset from disk,
    decrypts it in memory, and parses it into a pandas DataFrame.
    The file name on disk is an obfuscated ID (.enc or .csv), never exposing plaintext data.
    """
    path = Path(file_path)
    if not path.is_file():
        raise FileNotFoundError(f"Dataset file not found at {path}")

    with open(path, "rb") as f:
        raw_content = f.read()

    # Transparent in-memory decryption
    plaintext_bytes = decrypt_bytes(raw_content)

    # Determine format: check original extension or file signature
    is_excel = False
    ref_name = (original_filename or path.name).lower()

    # Excel ZIP signature (PK..) or extension
    if ref_name.endswith((".xlsx", ".xls")) or plaintext_bytes[:4] == b"PK\x03\x04":
        is_excel = True

    if is_excel:
        return pd.read_excel(io.BytesIO(plaintext_bytes))

    # CSV reading with fallback encodings
    for encoding in ("utf-8", "utf-8-sig", "cp1252", "latin1"):
        try:
            return pd.read_csv(io.BytesIO(plaintext_bytes), encoding=encoding)
        except UnicodeDecodeError:
            continue
        except Exception:
            break

    # Final attempt
    return pd.read_csv(io.BytesIO(plaintext_bytes), encoding="latin1")
