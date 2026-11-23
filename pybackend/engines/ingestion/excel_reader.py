"""
Multi-Worksheet Excel Reader for Vyapar Verse.
Provides robust sheet discovery, multi-sheet inspection, and streaming dataframe loads.
"""

from pathlib import Path
from typing import List, Dict, Any, Optional
import pandas as pd
import openpyxl


def list_excel_sheets(file_path: str) -> List[str]:
    """Inspects Excel workbook without loading entire data to list sheet names."""
    path = Path(file_path)
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {path}")

    try:
        wb = openpyxl.load_workbook(path, read_only=True, keep_links=False)
        sheets = wb.sheetnames
        wb.close()
        return sheets
    except Exception:
        # Fallback to xlrd or pandas ExcelFile
        xl = pd.ExcelFile(path)
        return xl.sheet_names


def inspect_excel_workbook(file_path: str) -> Dict[str, Any]:
    """Inspects all sheets in an Excel workbook with row/col counts and header preview."""
    path = Path(file_path)
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {path}")

    sheets_meta = []
    xl = pd.ExcelFile(path)
    for sheet in xl.sheet_names:
        try:
            # Read top 5 rows just for headers and column types
            preview_df = xl.parse(sheet, nrows=5)
            sheets_meta.append({
                "sheet_name": sheet,
                "columns": [str(c) for c in preview_df.columns.tolist()],
                "sample_count": len(preview_df)
            })
        except Exception as e:
            sheets_meta.append({
                "sheet_name": sheet,
                "error": str(e)
            })

    return {
        "file_name": path.name,
        "total_sheets": len(xl.sheet_names),
        "sheets": sheets_meta
    }


def read_excel_file(file_path: str, sheet_name: Any = 0, **kwargs) -> pd.DataFrame:
    """Reads a designated worksheet from Excel workbook into pandas DataFrame."""
    path = Path(file_path)
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {path}")
    return pd.read_excel(path, sheet_name=sheet_name, **kwargs)
