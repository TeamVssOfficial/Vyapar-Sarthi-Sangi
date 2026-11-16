from pathlib import Path
import pandas as pd

def read_csv_file(file_path, **kwargs):
    path=Path(file_path)
    if not path.is_file(): raise FileNotFoundError(path)
    for enc in ('utf-8','utf-8-sig','cp1252','latin1'):
        try: return pd.read_csv(path, encoding=enc, **kwargs)
        except UnicodeDecodeError: pass
    raise ValueError('Unable to decode CSV file')
