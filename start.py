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

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        app_dir=pybackend_dir
    )
