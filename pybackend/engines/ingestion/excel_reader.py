from pathlib import Path
import pandas as pd

def read_excel_file(file_path, sheet_name=0, **kwargs):
    path=Path(file_path)
    if not path.is_file(): raise FileNotFoundError(path)
    return pd.read_excel(path, sheet_name=sheet_name, **kwargs)
