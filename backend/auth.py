from fastapi import HTTPException, Depends, Header
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
import hashlib
import bcrypt

JWT_SECRET = os.getenv("JWT_SECRET", "devpulse_super_secret_key_change_this_in_production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", 24))

def _pre_hash_password(password: str) -> bytes:
    """Hash password with SHA256 first to handle passwords > 72 bytes for bcrypt"""
    return hashlib.sha256(password.encode()).digest()

def hash_password(password: str) -> str:
    pre_hashed = _pre_hash_password(password)
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pre_hashed, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pre_hashed = _pre_hash_password(plain_password)
    return bcrypt.checkpw(pre_hashed, hashed_password.encode('utf-8'))

def create_access_token(email: str, user_id: str) -> str:
    expires = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode = {"email": email, "user_id": user_id, "exp": expires}
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("email")
        user_id = payload.get("user_id")
        if email is None or user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"email": email, "user_id": user_id}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        scheme, token = authorization.split(" ")
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
        return verify_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

async def get_current_admin(current_user: dict = Depends(get_current_user), supabase_client = None) -> dict:
    """Verify user is admin. Supabase client will be injected from main.py"""
    if supabase_client is None:
        raise HTTPException(status_code=500, detail="Database client not configured")
    
    try:
        response = supabase_client.table("users").select("is_admin").eq("id", current_user["user_id"]).execute()
        if not response.data or not response.data[0]["is_admin"]:
            raise HTTPException(status_code=403, detail="Admin access required")
        return current_user
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=403, detail="Access denied")

