import sys
import os

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.database import SessionLocal
from backend.models.user import User
from backend.models.login_history import LoginHistory
from backend.models.file import UploadedFile
from backend.models.activity_log import ActivityLog
from backend.database import ContactSubmission

def print_separator(title):
    print("\n" + "=" * 80)
    print(f"  [DB] {title.upper()}")
    print("=" * 80)

def view_database_records():
    db = SessionLocal()
    try:
        # 1. Registered Users Table
        print_separator("1. REGISTERED USER ACCOUNTS (USERS TABLE)")
        users = db.query(User).order_by(User.id.asc()).all()
        print(f"{'ID':<4} | {'Full Name':<22} | {'Email Address':<34} | {'Role':<7} | {'Status':<7}")
        print("-" * 80)
        for u in users:
            print(f"{u.id:<4} | {u.full_name[:22]:<22} | {u.email[:34]:<34} | {u.role:<7} | {u.status:<7}")

        # 2. Contact Submissions Table
        print_separator("2. SUBMITTED CONTACT MESSAGES (CONTACT_SUBMISSIONS TABLE)")
        contacts = db.query(ContactSubmission).order_by(ContactSubmission.id.asc()).all()
        if not contacts:
            print("No contact messages received yet.")
        else:
            print(f"{'ID':<4} | {'Name':<20} | {'Email':<30} | {'Subject':<20}")
            print("-" * 80)
            for c in contacts:
                print(f"{c.id:<4} | {c.name[:20]:<20} | {c.email[:30]:<30} | {c.subject[:20]:<20}")

        # 3. Uploaded Files Table
        print_separator("3. UPLOADED WORKSPACE FILES (UPLOADED_FILES TABLE)")
        files = db.query(UploadedFile).order_by(UploadedFile.id.asc()).all()
        if not files:
            print("No files uploaded yet.")
        else:
            print(f"{'ID':<4} | {'Original Name':<30} | {'Type':<8} | {'Size (KB)':<10} | {'Status':<10}")
            print("-" * 80)
            for f in files:
                fname = getattr(f, 'original_filename', getattr(f, 'filename', 'File'))
                ftype = getattr(f, 'file_type', '.bin')
                fsize = getattr(f, 'file_size', 0)
                fstatus = getattr(f, 'status', 'active')
                size_kb = round(fsize / 1024.0, 1) if fsize else 0
                print(f"{f.id:<4} | {fname[:30]:<30} | {ftype:<8} | {size_kb:<10} | {fstatus:<10}")

        # 4. Recent Activity Log Table
        print_separator("4. SYSTEM ACTIVITY LOGS (ACTIVITY_LOGS TABLE)")
        logs = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(10).all()
        for l in logs:
            ts = l.timestamp.strftime("%Y-%m-%d %H:%M:%S") if l.timestamp else "N/A"
            print(f"[{ts}] Action: {l.action} | Details: {l.details}")

    finally:
        db.close()

if __name__ == "__main__":
    view_database_records()
