from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from pydantic import EmailStr
import os

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "devpulse_super_secret_key_change_this_in_production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", 24))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer scheme
security = HTTPBearer()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(email: str, user_id: str) -> str:
    expires = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode = {
        "email": email,
        "user_id": user_id,
        "exp": expires
    }
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("email")
        user_id: str = payload.get("user_id")
        
        if email is None or user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return {"email": email, "user_id": user_id}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    return verify_token(token)

async def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    # This will be enhanced in main.py with DB check
    return current_user
