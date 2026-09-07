import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.login_history import LoginHistory
from backend.models.activity_log import ActivityLog
from backend.security.password import hash_password, verify_password
from backend.security.jwt import create_access_token, create_refresh_token, get_current_user_optional
from backend.schemas.auth import RegisterPayload, LoginPayload, RefreshTokenPayload, ForgotPasswordPayload, ResetPasswordPayload
from backend.utils.device_parser import parse_user_agent

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterPayload, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_count = db.query(User).count()
    role = "admin" if user_count == 0 else "user"

    pwd_hash = hash_password(payload.password)
    user = User(
        full_name=payload.full_name,
        username=payload.username or payload.email.split('@')[0],
        email=payload.email,
        phone_number=payload.phone_number,
        country=payload.country,
        password_hash=pwd_hash,
        role=role,
        status="active",
        email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Issue tokens
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    refresh_tok = create_refresh_token({"sub": str(user.id)})

    # Log Activity
    log = ActivityLog(user_id=user.id, action="User Registered", details=f"New user registered: {user.email}")
    db.add(log)
    db.commit()

    return {
        "access_token": token,
        "refresh_token": refresh_tok,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.post("/login")
def login(payload: LoginPayload, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    ip_addr = request.client.host if request.client else "127.0.0.1"
    ua_string = request.headers.get("user-agent", "")
    device_info = parse_user_agent(ua_string)

    if not user or not verify_password(payload.password, user.password_hash):
        # Record failed login history
        lh = LoginHistory(
            user_id=user.id if user else None,
            email=payload.email,
            ip_address=ip_addr,
            browser=device_info["browser"],
            operating_system=device_info["os"],
            device_type=device_info["device"],
            status="failed",
            failed_attempts=1
        )
        db.add(lh)
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.status == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended. Please contact Administrator.")

    # Update User login stats
    user.login_count += 1
    user.last_login = datetime.datetime.utcnow()
    db.commit()

    # Record successful login history
    lh = LoginHistory(
        user_id=user.id,
        email=user.email,
        ip_address=ip_addr,
        browser=device_info["browser"],
        operating_system=device_info["os"],
        device_type=device_info["device"],
        status="success"
    )
    db.add(lh)

    # Activity Log
    act = ActivityLog(user_id=user.id, action="Login", details=f"User logged in from {ip_addr}", ip_address=ip_addr)
    db.add(act)
    db.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    refresh_tok = create_refresh_token({"sub": str(user.id)})

    return {
        "access_token": token,
        "refresh_token": refresh_tok,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "status": user.status
        }
    }

@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user_optional)):
    if current_user:
        # Update latest login history logout time
        lh = db.query(LoginHistory).filter(LoginHistory.user_id == current_user.id).order_by(LoginHistory.id.desc()).first()
        if lh:
            lh.logout_time = datetime.datetime.utcnow()
            db.commit()

        act = ActivityLog(user_id=current_user.id, action="Logout", details=f"User logged out")
        db.add(act)
        db.commit()

    return {"message": "Logged out successfully"}

@router.post("/refresh")
def refresh_token_endpoint(payload: RefreshTokenPayload, db: Session = Depends(get_db)):
    import jwt
    from backend.config import REFRESH_SECRET_KEY, ALGORITHM
    try:
        data = jwt.decode(payload.refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(data.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.status == "suspended":
            raise HTTPException(status_code=401, detail="Invalid token or account suspended")

        new_access_token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
        return {"access_token": new_access_token, "token_type": "bearer"}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        return {"message": "If the email is registered, password reset instructions have been generated."}

    reset_token = create_access_token({"sub": str(user.id), "purpose": "reset_password"}, expires_delta=datetime.timedelta(minutes=15))
    return {
        "message": "Password reset token generated.",
        "reset_token": reset_token
    }

@router.post("/reset-password")
def reset_password(payload: ResetPasswordPayload, db: Session = Depends(get_db)):
    import jwt
    from backend.config import SECRET_KEY, ALGORITHM
    try:
        data = jwt.decode(payload.token, SECRET_KEY, algorithms=[ALGORITHM])
        if data.get("purpose") != "reset_password":
            raise HTTPException(status_code=400, detail="Invalid reset token purpose")
        user_id = int(data.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.password_hash = hash_password(payload.new_password)
        db.commit()
        return {"message": "Password reset successfully. You can now login with your new password."}
    except Exception:
        raise HTTPException(status_code=400, detail="Expired or invalid reset token")
