def prepare_features(df, target, drop_columns=None):
    if target not in df.columns: raise KeyError(f'Target not found: {target}')
    drop=set(drop_columns or []); drop.add(target)
    return df.drop(columns=[c for c in drop if c in df.columns]).copy(), df[target].copy()
