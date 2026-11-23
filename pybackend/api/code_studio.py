"""
AI Code Studio API for Vyapar Verse.
Provides Python code generation, AST-validated sandboxed execution, and execution history.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import ast
import io
import sys
import time
import uuid
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Business, Dataset
from auth.dependencies import get_current_user, get_current_business
from api.datasets import load_dataset_df
from ai_engine.orchestrator import CentralAIOrchestrator
from ai_engine.task_classifier import TaskIntent

router = APIRouter(prefix="/api/code-studio", tags=["AI Code Studio"])

# In-memory execution history: business_id -> list of execution records
_EXECUTION_HISTORY: Dict[str, List[Dict[str, Any]]] = {}

# Forbidden AST modules & calls for security
FORBIDDEN_MODULES = {
    "os", "sys", "subprocess", "shutil", "socket", "requests", "urllib",
    "http", "ftplib", "builtins", "posix", "nt", "pty", "commands",
    "importlib", "pickle", "shelve", "multiprocessing", "threading"
}

FORBIDDEN_CALLS = {
    "open", "eval", "exec", "__import__", "compile", "globals", "locals",
    "getattr", "setattr", "delattr", "system", "popen", "spawn"
}


class CodeGenerateRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=2000)
    task_type: Optional[str] = "exploratory"  # exploratory, cleaning, visualization, correlation, regression


class CodeExecuteRequest(BaseModel):
    code: str = Field(min_length=1, max_length=15000)


def validate_python_ast(code_str: str):
    """
    Validates that Python code contains no dangerous calls, OS commands, or file system access.
    Raises ValueError with details if security boundary is breached.
    """
    try:
        tree = ast.parse(code_str)
    except SyntaxError as e:
        raise ValueError(f"Syntax Error in Python code: {e}")

    for node in ast.walk(tree):
        # Check forbidden imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                root_pkg = alias.name.split(".")[0]
                if root_pkg in FORBIDDEN_MODULES:
                    raise ValueError(f"Security Restriction: Importing '{alias.name}' is strictly forbidden.")
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                root_pkg = node.module.split(".")[0]
                if root_pkg in FORBIDDEN_MODULES:
                    raise ValueError(f"Security Restriction: Importing from '{node.module}' is strictly forbidden.")

        # Check forbidden direct calls
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id in FORBIDDEN_CALLS:
                    raise ValueError(f"Security Restriction: Calling '{node.func.id}()' is strictly forbidden.")
            elif isinstance(node.func, ast.Attribute):
                if node.func.attr in {"system", "popen", "spawn", "execfile", "eval"}:
                    raise ValueError(f"Security Restriction: Calling method '.{node.func.attr}()' is strictly forbidden.")


@router.post("/{dataset_id}/generate")
async def generate_analysis_code(
    dataset_id: str,
    req: CodeGenerateRequest,
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """
    Synthesizes executable Python code tailored to the user's dataset and prompt.
    """
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.business_id == business.id
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found in this business workspace")

    df = load_dataset_df(dataset.file_path)
    cols = df.columns.tolist()
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    prompt = f"""Write an executable, clean Python script using Pandas and NumPy to analyze a dataset with columns: {cols}.
Specific User Request: {req.prompt}

Requirements:
- Assume the dataset is already loaded into variable `df`.
- Do NOT use `import os` or `open()`.
- Print meaningful analytical results and statistical insights to standard output using `print()`.
- Return only the Python code inside ```python ``` and a brief 2-sentence explanation."""

    ai_result = await CentralAIOrchestrator.process_user_query(
        user_query=prompt,
        df=df,
        dataset_name=dataset.name,
        preferred_model=None
    )

    content = ai_result.get("content", "")
    code_snippet = ""
    explanation = ""

    if "```python" in content:
        parts = content.split("```python")
        if len(parts) > 1:
            code_and_rest = parts[1].split("```")
            code_snippet = code_and_rest[0].strip()
            explanation = code_and_rest[1].strip() if len(code_and_rest) > 1 else ""
    elif "```" in content:
        parts = content.split("```")
        if len(parts) > 1:
            code_snippet = parts[1].strip()
            explanation = parts[2].strip() if len(parts) > 2 else ""
    else:
        # Fallback reliable Python code generator if model output format differed
        target_col = num_cols[0] if num_cols else cols[0]
        code_snippet = f"""# Analysis for: {req.prompt}
import pandas as pd
import numpy as np

print("=== DATASET SHAPE & ATTRIBUTES ===")
print(f"Total Rows: {{len(df):,}} | Total Columns: {{len(df.columns)}}")

print("\\n=== COLUMN STATISTICAL SUMMARY ===")
if '{target_col}' in df.columns:
    print(df['{target_col}'].describe())

print("\\n=== TOP 5 RECORDS ===")
print(df.head(5))
"""
        explanation = f"Generated baseline Pandas exploratory code inspecting row counts, schema distribution, and descriptive summary for '{target_col}'."

    return {
        "code": code_snippet,
        "explanation": explanation or "Python analytical script generated for dataset exploration.",
        "model_used": ai_result.get("model", "central-brain"),
        "dataset_name": dataset.name,
        "columns": cols
    }


@router.post("/{dataset_id}/execute")
def execute_analysis_code(
    dataset_id: str,
    req: CodeExecuteRequest,
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """
    Executes Python code in a safe, sandboxed in-memory environment with AST security checks.
    """
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.business_id == business.id
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found in this business workspace")

    df = load_dataset_df(dataset.file_path)

    # 1. AST Security Validation
    try:
        validate_python_ast(req.code)
    except ValueError as ve:
        return {
            "success": False,
            "stdout": "",
            "stderr": str(ve),
            "execution_time_ms": 0.0,
            "security_blocked": True
        }

    # 2. Setup Sandboxed Scope with pre-injected libraries
    safe_globals = {
        "__builtins__": {
            "print": print,
            "range": range,
            "len": len,
            "int": int,
            "float": float,
            "str": str,
            "bool": bool,
            "list": list,
            "dict": dict,
            "set": set,
            "tuple": tuple,
            "min": min,
            "max": max,
            "sum": sum,
            "round": round,
            "abs": abs,
            "sorted": sorted,
            "enumerate": enumerate,
            "zip": zip,
            "isinstance": isinstance,
            "type": type,
            "True": True,
            "False": False,
            "None": None
        },
        "pd": pd,
        "np": np,
        "df": df.copy(deep=True)  # Never mutate original dataset
    }

    # 3. Capture Standard Output & Standard Error
    stdout_buf = io.StringIO()
    stderr_buf = io.StringIO()
    old_stdout = sys.stdout
    old_stderr = sys.stderr

    start_t = time.time()
    success = False
    err_msg = ""

    try:
        sys.stdout = stdout_buf
        sys.stderr = stderr_buf

        # Compile and execute within restricted namespace
        compiled = compile(req.code, "<ai_sandbox>", "exec")
        exec(compiled, safe_globals)
        success = True
    except Exception as e:
        err_msg = f"{type(e).__name__}: {str(e)}"
    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    exec_duration_ms = round((time.time() - start_t) * 1000, 2)
    captured_stdout = stdout_buf.getvalue()
    captured_stderr = stderr_buf.getvalue() or err_msg

    # 4. Save to Execution History
    entry = {
        "id": str(uuid.uuid4()),
        "dataset_id": dataset_id,
        "dataset_name": dataset.name,
        "timestamp": time.time(),
        "code": req.code,
        "success": success,
        "stdout": captured_stdout[:8000],  # Bound buffer size
        "stderr": captured_stderr[:2000],
        "duration_ms": exec_duration_ms
    }

    if business.id not in _EXECUTION_HISTORY:
        _EXECUTION_HISTORY[business.id] = []
    _EXECUTION_HISTORY[business.id].insert(0, entry)
    if len(_EXECUTION_HISTORY[business.id]) > 50:
        _EXECUTION_HISTORY[business.id] = _EXECUTION_HISTORY[business.id][:50]

    return {
        "success": success,
        "stdout": captured_stdout,
        "stderr": captured_stderr,
        "execution_time_ms": exec_duration_ms,
        "history_id": entry["id"]
    }


@router.get("/{dataset_id}/history")
def get_execution_history(
    dataset_id: str,
    business: Business = Depends(get_current_business)
):
    """Returns execution records for the active dataset."""
    history = _EXECUTION_HISTORY.get(business.id, [])
    filtered = [h for h in history if h.get("dataset_id") == dataset_id]
    return filtered
