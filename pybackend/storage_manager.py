from pathlib import Path
import os
import re
import io
import base64
import hashlib
import tempfile
import pandas as pd
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

from config import settings

# Initialize symmetric cipher derived from system secret (legacy Fernet + Streaming AES-256-CTR)
_AES_KEY = hashlib.sha256(settings.JWT_SECRET.encode()).digest()
_DERIVED_KEY = base64.urlsafe_b64encode(_AES_KEY)
_CIPHER = Fernet(_DERIVED_KEY)

STREAM_MAGIC = b"VSS_STREAM_V1"  # 13 bytes
STREAM_CHUNK_SIZE = 4 * 1024 * 1024  # 4 MB chunks for Zero-OOM 10GB+ processing
LARGE_FILE_THRESHOLD_BYTES = 60 * 1024 * 1024  # 60 MB
LARGE_FILE_SAMPLE_ROWS = 100000


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
    """Encrypts bytes using authenticated AES Fernet encryption (for small in-memory payloads)."""
    return _CIPHER.encrypt(raw_bytes)


def decrypt_bytes(encrypted_bytes: bytes) -> bytes:
    """Decrypts Fernet ciphertext bytes. If data is not Fernet-encrypted, returns raw bytes."""
    try:
        return _CIPHER.decrypt(encrypted_bytes)
    except (InvalidToken, Exception):
        return encrypted_bytes


def stream_encrypt_file(src_path: Path, dst_path: Path) -> int:
    """
    Zero-OOM streaming AES-256-CTR encryption from src_path to dst_path.
    Handles up to 10GB+ files using only ~4MB RAM.
    """
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    nonce = os.urandom(16)
    cipher = Cipher(algorithms.AES(_AES_KEY), modes.CTR(nonce))
    encryptor = cipher.encryptor()

    total_written = 0
    with open(src_path, "rb") as fin, open(dst_path, "wb") as fout:
        fout.write(STREAM_MAGIC)
        fout.write(nonce)
        total_written += len(STREAM_MAGIC) + len(nonce)

        while True:
            chunk = fin.read(STREAM_CHUNK_SIZE)
            if not chunk:
                break
            enc_chunk = encryptor.update(chunk)
            fout.write(enc_chunk)
            total_written += len(enc_chunk)

        final_chunk = encryptor.finalize()
        if final_chunk:
            fout.write(final_chunk)
            total_written += len(final_chunk)

    return total_written


def stream_encrypt_parts_and_count(part_paths: list[Path], dst_path: Path) -> tuple[int, int]:
    """
    Single-pass streaming AES-256-CTR encryption across ordered chunk part files.
    Counts newlines during the same pass and deletes each part file immediately after reading
    to minimize disk usage and eliminate extra passes for up to 10GB+ files.
    Returns (encrypted_bytes_written, estimated_line_count).
    """
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    nonce = os.urandom(16)
    cipher = Cipher(algorithms.AES(_AES_KEY), modes.CTR(nonce))
    encryptor = cipher.encryptor()

    total_written = 0
    newline_count = 0
    with open(dst_path, "wb") as fout:
        fout.write(STREAM_MAGIC)
        fout.write(nonce)
        total_written += len(STREAM_MAGIC) + len(nonce)

        for part_path in part_paths:
            with open(part_path, "rb") as fin:
                while True:
                    chunk = fin.read(STREAM_CHUNK_SIZE)
                    if not chunk:
                        break
                    newline_count += chunk.count(b"\n")
                    enc_chunk = encryptor.update(chunk)
                    fout.write(enc_chunk)
                    total_written += len(enc_chunk)
            try:
                part_path.unlink(missing_ok=True)
            except Exception:
                pass

        final_chunk = encryptor.finalize()
        if final_chunk:
            fout.write(final_chunk)
            total_written += len(final_chunk)

    return total_written, max(0, newline_count - 1)


def _stream_decrypt_prefix_bytes(src_path: Path, max_bytes: int | None = None) -> bytes:
    """
    Decrypts up to max_bytes from a VSS_STREAM_V1 file without loading the entire file into RAM.
    """
    with open(src_path, "rb") as fin:
        magic = fin.read(len(STREAM_MAGIC))
        if magic != STREAM_MAGIC:
            fin.seek(0)
            raw = fin.read(max_bytes) if max_bytes else fin.read()
            return decrypt_bytes(raw)

        nonce = fin.read(16)
        cipher = Cipher(algorithms.AES(_AES_KEY), modes.CTR(nonce))
        decryptor = cipher.decryptor()

        out = bytearray()
        remaining = max_bytes
        while True:
            to_read = STREAM_CHUNK_SIZE if remaining is None else min(STREAM_CHUNK_SIZE, remaining)
            if to_read <= 0:
                break
            chunk = fin.read(to_read)
            if not chunk:
                break
            out.extend(decryptor.update(chunk))
            if remaining is not None:
                remaining -= len(chunk)

        out.extend(decryptor.finalize())
        return bytes(out)


def stream_decrypt_to_file(src_path: Path, dst_path: Path) -> None:
    """
    Streams decrypted bytes from src_path to dst_path using ~4MB RAM.
    """
    with open(src_path, "rb") as fin:
        magic = fin.read(len(STREAM_MAGIC))
        if magic != STREAM_MAGIC:
            fin.seek(0)
            raw = fin.read()
            plaintext = decrypt_bytes(raw)
            with open(dst_path, "wb") as fout:
                fout.write(plaintext)
            return

        nonce = fin.read(16)
        cipher = Cipher(algorithms.AES(_AES_KEY), modes.CTR(nonce))
        decryptor = cipher.decryptor()

        with open(dst_path, "wb") as fout:
            while True:
                chunk = fin.read(STREAM_CHUNK_SIZE)
                if not chunk:
                    break
                fout.write(decryptor.update(chunk))
            final_chunk = decryptor.finalize()
            if final_chunk:
                fout.write(final_chunk)


def count_csv_rows_fast(file_path: Path) -> int:
    """
    Counts total lines in a plain CSV/TSV file in 4MB chunks (handles 10GB in seconds).
    """
    count = 0
    with open(file_path, "rb") as f:
        while chunk := f.read(STREAM_CHUNK_SIZE):
            count += chunk.count(b"\n")
    return max(0, count - 1)


def save_encrypted_dataset(data: bytes, target_path: Path) -> int:
    """
    Encrypts dataset bytes and writes to disk.
    Uses streaming AES-256-CTR for payloads > 20MB to prevent memory blowup.
    """
    target_path.parent.mkdir(parents=True, exist_ok=True)
    if len(data) > 20 * 1024 * 1024:
        nonce = os.urandom(16)
        cipher = Cipher(algorithms.AES(_AES_KEY), modes.CTR(nonce))
        encryptor = cipher.encryptor()
        total_written = 0
        with open(target_path, "wb") as fout:
            fout.write(STREAM_MAGIC)
            fout.write(nonce)
            total_written += len(STREAM_MAGIC) + len(nonce)
            for i in range(0, len(data), STREAM_CHUNK_SIZE):
                enc_chunk = encryptor.update(data[i:i + STREAM_CHUNK_SIZE])
                fout.write(enc_chunk)
                total_written += len(enc_chunk)
            fin = encryptor.finalize()
            if fin:
                fout.write(fin)
                total_written += len(fin)
        return total_written

    encrypted_data = encrypt_bytes(data)
    with open(target_path, "wb") as f:
        f.write(encrypted_data)
    return len(encrypted_data)


def _read_dataframe_from_path_or_bytes(
    source_path: Path | None = None,
    raw_bytes: bytes | None = None,
    ref_name: str = "",
    nrows: int | None = None
) -> pd.DataFrame:
    """Helper to parse CSV/TSV/Excel/JSON from disk path or memory bytes."""
    ref_lower = ref_name.lower()
    is_excel = ref_lower.endswith((".xlsx", ".xls"))
    is_tsv = ref_lower.endswith(".tsv")
    is_json = ref_lower.endswith(".json")

    if raw_bytes is not None and raw_bytes[:4] == b"PK\x03\x04":
        is_excel = True

    if is_excel:
        target = source_path if source_path is not None else io.BytesIO(raw_bytes)
        return pd.read_excel(target, nrows=nrows)

    if is_json:
        target = source_path if source_path is not None else io.BytesIO(raw_bytes)
        try:
            return pd.read_json(target, lines=True, nrows=nrows)
        except Exception:
            if source_path is None:
                target = io.BytesIO(raw_bytes)
            df = pd.read_json(target)
            return df.head(nrows) if nrows else df

    sep = "\t" if is_tsv else ","
    for encoding in ("utf-8", "utf-8-sig", "cp1252", "latin1"):
        try:
            target = source_path if source_path is not None else io.BytesIO(raw_bytes)
            return pd.read_csv(
                target,
                encoding=encoding,
                sep=sep,
                nrows=nrows,
                low_memory=False,
                on_bad_lines="skip"
            )
        except UnicodeDecodeError:
            continue
        except Exception:
            break

    target = source_path if source_path is not None else io.BytesIO(raw_bytes)
    return pd.read_csv(target, encoding="latin1", sep=sep, nrows=nrows, low_memory=False, on_bad_lines="skip")


def normalize_indian_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Real-life Indian business normalizer (Tally / Busy / Zoho / Marketplace CSVs):
    - Strips accidental whitespace in column headers
    - Converts Indian currency strings ('₹1,25,000.50', 'Rs. 4,500', '45,000/-') to numeric floats
      when >= 80% of sampled non-null values represent currency/numbers.
    """
    if df is None or df.empty:
        return df

    df.columns = [str(c).strip() for c in df.columns]
    currency_re = re.compile(r"^\s*(?:₹|rs\.?|inr)?\s*[-+]?[\d,]+(?:\.\d+)?\s*(?:/-)?\s*$", re.IGNORECASE)

    for col in df.select_dtypes(include=["object", "string"]).columns:
        sample = df[col].dropna().astype(str).head(200)
        if sample.empty:
            continue
        # Only convert if at least some values look like formatted currency/comma-numbers
        has_format = sample.str.contains(r"₹|rs\.|inr|,|/-", case=False, regex=True).any()
        if not has_format:
            continue
        matches = sample.apply(lambda v: bool(currency_re.match(v)))
        if matches.mean() >= 0.8:
            cleaned = (
                df[col]
                .astype(str)
                .str.replace(r"(?i)₹|rs\.?|inr|/-|,", "", regex=True)
                .str.strip()
            )
            df[col] = pd.to_numeric(cleaned, errors="coerce")

    return df


def load_encrypted_dataframe(
    file_path: str | Path,
    original_filename: str | None = None,
    max_rows: int | None = None,
    full_load: bool = False
) -> pd.DataFrame:
    """
    Reads an encrypted (or legacy plaintext) dataset from disk,
    decrypts it via Zero-OOM streaming, and parses it into a pandas DataFrame.
    For multi-GB datasets (>60MB), automatically uses smart representative sampling
    unless full_load=True is explicitly requested.
    """
    path = Path(file_path)
    if not path.is_file():
        raise FileNotFoundError(f"Dataset file not found at {path}")

    file_size = path.stat().st_size
    ref_name = (original_filename or path.name).lower()

    # Check if stream-encrypted
    with open(path, "rb") as f:
        header = f.read(len(STREAM_MAGIC))
    is_stream_enc = (header == STREAM_MAGIC)

    effective_nrows = max_rows
    if effective_nrows is None and not full_load and file_size > LARGE_FILE_THRESHOLD_BYTES:
        effective_nrows = LARGE_FILE_SAMPLE_ROWS

    # Fast path for huge CSV/TSV files: decrypt only prefix bytes if sampling
    if is_stream_enc and effective_nrows is not None and not ref_name.endswith((".xlsx", ".xls")):
        prefix_bytes = _stream_decrypt_prefix_bytes(path, max_bytes=35 * 1024 * 1024)
        if file_size > 35 * 1024 * 1024:
            last_nl = prefix_bytes.rfind(b"\n")
            if last_nl > 0:
                prefix_bytes = prefix_bytes[:last_nl]
        df = _read_dataframe_from_path_or_bytes(raw_bytes=prefix_bytes, ref_name=ref_name, nrows=effective_nrows)
        return normalize_indian_dataframe(df)

    # For larger files that need full file decryption (e.g. Excel or full_load), stream to temp file
    if is_stream_enc or file_size > 25 * 1024 * 1024:
        fd, tmp_name = tempfile.mkstemp(suffix=Path(ref_name).suffix or ".csv")
        os.close(fd)
        tmp_path = Path(tmp_name)
        try:
            stream_decrypt_to_file(path, tmp_path)
            df = _read_dataframe_from_path_or_bytes(source_path=tmp_path, ref_name=ref_name, nrows=effective_nrows)
            return normalize_indian_dataframe(df)
        finally:
            try:
                if tmp_path.exists():
                    tmp_path.unlink()
            except Exception:
                pass

    # Standard path for small/medium files (<25MB)
    with open(path, "rb") as f:
        raw_content = f.read()
    plaintext_bytes = decrypt_bytes(raw_content)
    df = _read_dataframe_from_path_or_bytes(raw_bytes=plaintext_bytes, ref_name=ref_name, nrows=effective_nrows)
    return normalize_indian_dataframe(df)
