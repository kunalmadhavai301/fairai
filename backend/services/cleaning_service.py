import os
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from backend.models.file import UploadedFile
from backend.services.version_service import create_version_snapshot

def clean_tabular_data(df: pd.DataFrame, options: Dict[str, Any] = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Performs data cleaning operations on a Pandas DataFrame.
    Returns cleaned DataFrame and detailed statistics of changes made.
    """
    if options is None:
        options = {
            "remove_duplicates": True,
            "fill_missing": True,
            "remove_outliers": True,
            "normalize_names": True
        }

    stats = {
        "initial_rows": len(df),
        "initial_cols": len(df.columns),
        "duplicates_removed": 0,
        "missing_filled": 0,
        "outliers_handled": 0,
        "columns_cleaned": []
    }

    df_cleaned = df.copy()

    # 1. Normalize Column Names
    if options.get("normalize_names", True):
        new_cols = []
        for col in df_cleaned.columns:
            clean_name = str(col).strip().lower().replace(" ", "_").replace("-", "_")
            new_cols.append(clean_name)
        df_cleaned.columns = new_cols
        stats["columns_cleaned"] = list(df_cleaned.columns)

    # 2. Remove Duplicate Rows
    if options.get("remove_duplicates", True):
        dup_count = df_cleaned.duplicated().sum()
        df_cleaned = df_cleaned.drop_duplicates().reset_index(drop=True)
        stats["duplicates_removed"] = int(dup_count)

    # 3. Handle Missing Values
    if options.get("fill_missing", True):
        missing_count = int(df_cleaned.isna().sum().sum())
        stats["missing_filled"] = missing_count
        
        for col in df_cleaned.columns:
            if pd.api.types.is_numeric_dtype(df_cleaned[col]):
                median_val = df_cleaned[col].median()
                df_cleaned[col] = df_cleaned[col].fillna(median_val if not pd.isna(median_val) else 0)
            else:
                mode_val = df_cleaned[col].mode()
                fill_str = mode_val[0] if len(mode_val) > 0 else "N/A"
                df_cleaned[col] = df_cleaned[col].fillna(fill_str)

    # 4. Handle Outliers in Numeric Columns using Z-score / IQR
    if options.get("remove_outliers", True):
        outliers_detected = 0
        for col in df_cleaned.select_dtypes(include=[np.number]).columns:
            q1 = df_cleaned[col].quantile(0.25)
            q3 = df_cleaned[col].quantile(0.75)
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            
            outliers = (df_cleaned[col] < lower_bound) | (df_cleaned[col] > upper_bound)
            outliers_detected += int(outliers.sum())
            
            # Clip outliers to bounds
            df_cleaned[col] = np.clip(df_cleaned[col], lower_bound, upper_bound)
            
        stats["outliers_handled"] = outliers_detected

    stats["final_rows"] = len(df_cleaned)
    stats["final_cols"] = len(df_cleaned.columns)

    return df_cleaned, stats

def auto_clean_dataset(db: Session, file_id: int) -> Dict[str, Any]:
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record or not os.path.exists(file_record.storage_location):
        return {"error": "File not found"}

    ext = file_record.file_type.lower()
    if ext in ['.csv', '.xlsx', '.xls']:
        if ext == '.csv':
            df = pd.read_csv(file_record.storage_location)
        else:
            df = pd.read_excel(file_record.storage_location)

        cleaned_df, stats = clean_tabular_data(df)
        if ext == '.csv':
            cleaned_df.to_csv(file_record.storage_location, index=False)
        else:
            cleaned_df.to_excel(file_record.storage_location, index=False)

        create_version_snapshot(db, file_id, "Automated Data Cleaning")
        return {"message": "Data cleaned successfully", "stats": stats}
    else:
        return {"message": "File format not applicable for tabular cleaning", "stats": {}}
