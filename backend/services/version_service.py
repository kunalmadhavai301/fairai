import os
import shutil
import difflib
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from backend.config import VERSIONS_DIR
from backend.models.file import UploadedFile, FileVersion
from backend.models.activity_log import ActivityLog

def create_version_snapshot(db: Session, file_id: int, change_summary: str = "AI Live Modification") -> FileVersion:
    """
    Creates a historical snapshot (v1, v2, v3...) of the file before or after an edit.
    """
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record or not os.path.exists(file_record.storage_location):
        return None

    current_ver_num = getattr(file_record, 'version', 1) or 1
    new_version_num = current_ver_num + 1

    base_name = os.path.basename(file_record.storage_location)
    version_filename = f"v{new_version_num}_{base_name}"
    version_path = os.path.join(VERSIONS_DIR, version_filename)

    # Save copy to versions directory
    shutil.copy2(file_record.storage_location, version_path)

    version_record = FileVersion(
        file_id=file_record.id,
        version_number=new_version_num,
        storage_path=version_path,
        change_summary=change_summary
    )
    db.add(version_record)

    file_record.version = new_version_num
    db.commit()
    db.refresh(version_record)

    return version_record

def compute_text_diff(original_text: str, edited_text: str) -> Dict[str, Any]:
    """
    Computes precise additions, deletions, and line-by-line diff between original and edited text.
    """
    orig_lines = original_text.splitlines()
    edit_lines = edited_text.splitlines()

    matcher = difflib.SequenceMatcher(None, orig_lines, edit_lines)
    diff_html_lines = []
    additions_count = 0
    deletions_count = 0

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            for line in orig_lines[i1:i2]:
                diff_html_lines.append(f"<div>  {line}</div>")
        elif tag == 'replace':
            for line in orig_lines[i1:i2]:
                deletions_count += 1
                diff_html_lines.append(f"<div class='diff-del'>- {line}</div>")
            for line in edit_lines[j1:j2]:
                additions_count += 1
                diff_html_lines.append(f"<div class='diff-add'>+ {line}</div>")
        elif tag == 'delete':
            for line in orig_lines[i1:i2]:
                deletions_count += 1
                diff_html_lines.append(f"<div class='diff-del'>- {line}</div>")
        elif tag == 'insert':
            for line in edit_lines[j1:j2]:
                additions_count += 1
                diff_html_lines.append(f"<div class='diff-add'>+ {line}</div>")

    return {
        "diff_html": "\n".join(diff_html_lines),
        "additions": additions_count,
        "deletions": deletions_count,
        "ratio": round(matcher.ratio() * 100, 1)
    }

def restore_version(db: Session, file_id: int, version_number: int) -> Tuple[bool, str]:
    """
    Restores the file to a specific historical version (v1, v2...).
    """
    file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not file_record:
        return False, "File record not found"

    target_ver = db.query(FileVersion).filter(
        FileVersion.file_id == file_id,
        FileVersion.version_number == version_number
    ).first()

    if not target_ver or not os.path.exists(target_ver.storage_path):
        return False, "Version snapshot file missing on disk"

    # Restore physical copy
    shutil.copy2(target_ver.storage_path, file_record.storage_location)
    file_record.file_size = os.path.getsize(file_record.storage_location)
    file_record.version = version_number
    db.commit()

    return True, f"Restored file to Version v{version_number}"
