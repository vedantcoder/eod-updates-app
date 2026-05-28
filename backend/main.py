from fastapi import FastAPI, HTTPException, Query, Path, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from datetime import date, datetime
import os
from dotenv import load_dotenv
from models import UserRegister, UserLogin, TokenResponse, UserResponse, EODLogCreate, EODLogResponse
from auth import hash_password, verify_password, create_access_token, get_current_user
from typing import Dict

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="DevPulse API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def hello():
    return {"message": "DevPulse API is running!"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/auth/register", response_model=TokenResponse)
def register(user_data: UserRegister):
    try:
        response = supabase.table("users").select("id").eq("email", user_data.email).execute()
        if response.data:
            raise HTTPException(status_code=400, detail="User already exists")
        
        hashed_pwd = hash_password(user_data.password)
        result = supabase.table("users").insert({
            "email": user_data.email,
            "name": user_data.name,
            "password_hash": hashed_pwd,
            "is_admin": False
        }).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        user = result.data[0]
        token = create_access_token(user["email"], str(user["id"]))
        return {"access_token": token, "token_type": "bearer"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login", response_model=TokenResponse)
def login(user_data: UserLogin):
    try:
        response = supabase.table("users").select("*").eq("email", user_data.email).execute()
        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user = response.data[0]
        if not verify_password(user_data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_access_token(user["email"], str(user["id"]))
        return {"access_token": token, "token_type": "bearer"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("users").select("*").eq("id", current_user["user_id"]).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = response.data[0]
        return UserResponse(
            id=str(user["id"]),
            email=user["email"],
            name=user.get("name", "User"),
            is_admin=user.get("is_admin", False),
            team_id=user.get("team_id"),
            created_at=user["created_at"]
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/logs", response_model=EODLogResponse)
def create_eod_log(log_data: EODLogCreate, current_user: dict = Depends(get_current_user)):
    try:
        result = supabase.table("eod_logs").insert({
            "user_id": current_user["user_id"],
            "date": str(date.today()),
            "done": log_data.done,
            "in_progress": log_data.in_progress,
            "blockers": log_data.blockers,
            "hours": log_data.hours,
            "tags": log_data.tags or []
        }).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create log")
        
        log = result.data[0]
        return EODLogResponse(
            id=str(log["id"]),
            user_id=str(log["user_id"]),
            date=log["date"],
            done=log["done"],
            in_progress=log["in_progress"],
            blockers=log["blockers"],
            hours=log["hours"],
            tags=log.get("tags", []),
            created_at=log["created_at"]
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/logs/my-logs")
def get_my_logs(current_user: dict = Depends(get_current_user), limit: int = Query(50), offset: int = Query(0)):
    try:
        response = supabase.table("eod_logs").select("*").eq("user_id", current_user["user_id"]).order("date", desc=True).range(offset, offset + limit - 1).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/logs/{log_id}", response_model=EODLogResponse)
def get_log(log_id: str = Path(...), current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("eod_logs").select("*").eq("id", log_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Log not found")
        
        log = response.data[0]
        if str(log["user_id"]) != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return EODLogResponse(
            id=str(log["id"]),
            user_id=str(log["user_id"]),
            date=log["date"],
            done=log["done"],
            in_progress=log["in_progress"],
            blockers=log["blockers"],
            hours=log["hours"],
            tags=log.get("tags", []),
            created_at=log["created_at"]
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/logs/{log_id}", response_model=EODLogResponse)
def update_log(log_id: str = Path(...), log_data: EODLogCreate = None, current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("eod_logs").select("user_id").eq("id", log_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Log not found")
        
        if str(response.data[0]["user_id"]) != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        update_data = {}
        if log_data.done is not None:
            update_data["done"] = log_data.done
        if log_data.in_progress is not None:
            update_data["in_progress"] = log_data.in_progress
        if log_data.blockers is not None:
            update_data["blockers"] = log_data.blockers
        if log_data.hours is not None:
            update_data["hours"] = log_data.hours
        if log_data.tags is not None:
            update_data["tags"] = log_data.tags
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        result = supabase.table("eod_logs").update(update_data).eq("id", log_id).execute()
        
        log = result.data[0]
        return EODLogResponse(
            id=str(log["id"]),
            user_id=str(log["user_id"]),
            date=log["date"],
            done=log["done"],
            in_progress=log["in_progress"],
            blockers=log["blockers"],
            hours=log["hours"],
            tags=log.get("tags", []),
            created_at=log["created_at"]
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/logs/{log_id}")
def delete_log(log_id: str = Path(...), current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("eod_logs").select("user_id").eq("id", log_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Log not found")
        
        if str(response.data[0]["user_id"]) != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        supabase.table("eod_logs").delete().eq("id", log_id).execute()
        return {"message": "Log deleted successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
