import os
import uvicorn
from pathlib import Path

if __name__ == "__main__":
    raw_port = os.environ.get("PORT", "8000")
    try:
        port = int(raw_port)
    except (ValueError, TypeError):
        port = 8000

    base_dir = Path(__file__).resolve().parent
    pybackend_dir = str((base_dir / "pybackend").resolve())

    print(f"==================================================")
    print(f" Starting Vyapar Sarthi Sangi Server on port {port}")
    print(f"==================================================")

    host = "0.0.0.0" if os.environ.get("PORT") else "127.0.0.1"
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        app_dir=pybackend_dir
    )
