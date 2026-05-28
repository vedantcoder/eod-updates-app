from fastapi import FastAPI, HTTPException, Query, Path, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from datetime import date, datetime
import os
from dotenv import load_dotenv
from models import UserRegister, UserLogin, TokenResponse, UserResponse, EODLogCreate, EODLogResponse
from auth import hash_password, verify_password, create_access_token, get_current_user
from typing import List

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

# ============================================
# HEALTH & INFO ENDPOINTS
# ============================================

@app.get("/")
def hello():
    return {"message": "DevPulse API is running!"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# ============================================
# AUTH ENDPOINTS
# ============================================

@app.post("/auth/register", response_model=TokenResponse)
def register(user_data: UserRegister):
    try:
        response = supabase.table("users").select("id").eq("email", user_data.email).execute()
        if response.data:
            raise HTTPException(status_code=400, detail="User already exists")
        
        hashed_pwd = hash_password(user_data.password)
        insert_data = {
            "email": user_data.email,
            "name": user_data.name,
            "password_hash": hashed_pwd,
            "is_admin": False
        }
        
        if user_data.team_id:
            insert_data["team_id"] = user_data.team_id
        
        result = supabase.table("users").insert(insert_data).execute()
        
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

# ============================================
# 
# ============================================

# Helper function to get logs data
def get_logs_data(user_id: str, log_id: str = None, limit: int = 50, offset: int = 0):
    try:
        if log_id:
            response = supabase.table("eod_logs").select("*").eq("id", log_id).execute()
        else:
            response = supabase.table("eod_logs").select("*").eq("user_id", user_id).order("date", desc=True).range(offset, offset + limit - 1).execute()
        
        return response.data if response.data else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/logs/my-logs", response_model=List[EODLogResponse])
def get_my_logs(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(50, description="Number of logs to fetch", ge=1, le=100),
    offset: int = Query(0, description="Offset for pagination", ge=0)
):
    try:
        logs_data = get_logs_data(current_user["user_id"], limit=limit, offset=offset)
        
        logs = []
        for log in logs_data:
            logs.append(EODLogResponse(
                id=str(log["id"]),
                user_id=str(log["user_id"]),
                date=log["date"],
                done=log.get("done"),
                in_progress=log.get("in_progress"),
                blockers=log.get("blockers"),
                hours=log.get("hours", 0),
                tags=log.get("tags", []),
                created_at=log["created_at"]
            ))
        
        return logs
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/logs", response_model=EODLogResponse)
def create_eod_log(
    log_data: EODLogCreate,
    current_user: dict = Depends(get_current_user)
):
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
            done=log.get("done"),
            in_progress=log.get("in_progress"),
            blockers=log.get("blockers"),
            hours=log.get("hours", 0),
            tags=log.get("tags", []),
            created_at=log["created_at"]
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/logs/{log_id}", response_model=EODLogResponse)
def get_log(
    log_id: str = Path(..., description="ID of the EOD log", example="550e8400-e29b-41d4-a716-446655440000"),
    current_user: dict = Depends(get_current_user)
):
    try:
        logs_data = get_logs_data(current_user["user_id"], log_id=log_id)
        
        if not logs_data:
            raise HTTPException(status_code=404, detail="Log not found")
        
        log = logs_data[0]
        
        if str(log["user_id"]) != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return EODLogResponse(
            id=str(log["id"]),
            user_id=str(log["user_id"]),
            date=log["date"],
            done=log.get("done"),
            in_progress=log.get("in_progress"),
            blockers=log.get("blockers"),
            hours=log.get("hours", 0),
            tags=log.get("tags", []),
            created_at=log["created_at"]
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/logs/{log_id}", response_model=EODLogResponse)
def update_log(
    log_id: str = Path(..., description="ID of the EOD log to update", example="550e8400-e29b-41d4-a716-446655440000"),
    log_data: EODLogCreate = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Verify ownership
        logs_data = get_logs_data(current_user["user_id"], log_id=log_id)
        if not logs_data:
            raise HTTPException(status_code=404, detail="Log not found")
        
        if str(logs_data[0]["user_id"]) != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Prepare update data
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
        
        # Update in database
        result = supabase.table("eod_logs").update(update_data).eq("id", log_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update log")
        
        log = result.data[0]
        return EODLogResponse(
            id=str(log["id"]),
            user_id=str(log["user_id"]),
            date=log["date"],
            done=log.get("done"),
            in_progress=log.get("in_progress"),
            blockers=log.get("blockers"),
            hours=log.get("hours", 0),
            tags=log.get("tags", []),
            created_at=log["created_at"]
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/logs/{log_id}")
def delete_log(
    log_id: str = Path(..., description="ID of the EOD log to delete", example="550e8400-e29b-41d4-a716-446655440000"),
    current_user: dict = Depends(get_current_user)
):
    try:
        # Verify ownership
        logs_data = get_logs_data(current_user["user_id"], log_id=log_id)
        if not logs_data:
            raise HTTPException(status_code=404, detail="Log not found")
        
        if str(logs_data[0]["user_id"]) != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete from database
        supabase.table("eod_logs").delete().eq("id", log_id).execute()
        
        return {"message": "Log deleted successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ANALYTICS ENDPOINTS
# ============================================

def verify_admin(current_user: dict):
    """Helper to verify user is admin"""
    try:
        response = supabase.table("users").select("is_admin").eq("id", current_user["user_id"]).execute()
        if not response.data or not response.data[0]["is_admin"]:
            raise HTTPException(status_code=403, detail="Admin access required")
        return True
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=403, detail="Access denied")

@app.get("/analytics/my-stats")
def get_user_weekly_stats(
    current_user: dict = Depends(get_current_user),
    week_start: str = Query(None, description="Week start date (YYYY-MM-DD). Defaults to current week Monday")
):
    try:
        import datetime as dt
        
        # Calculate week start (Monday)
        if week_start:
            week_date = dt.datetime.strptime(week_start, "%Y-%m-%d").date()
        else:
            today = dt.date.today()
            week_date = today - dt.timedelta(days=today.weekday())
        
        week_end = week_date + dt.timedelta(days=6)
        
        # Get logs for the week
        response = supabase.table("eod_logs").select("*").eq("user_id", current_user["user_id"]).gte("date", str(week_date)).lte("date", str(week_end)).execute()
        
        logs = response.data or []
        
        total_hours = sum(log.get("hours", 0) for log in logs)
        log_count = len(logs)
        avg_hours = total_hours / log_count if log_count > 0 else 0
        
        return {
            "week_start": str(week_date),
            "week_end": str(week_end),
            "total_hours": total_hours,
            "avg_hours_per_day": round(avg_hours, 2),
            "log_count": log_count,
            "logs": logs
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/my-tags")
def get_user_tag_frequency(current_user: dict = Depends(get_current_user)):
    try:
        # Get all user's logs
        response = supabase.table("eod_logs").select("tags").eq("user_id", current_user["user_id"]).execute()
        
        logs = response.data or []
        tag_count = {}
        
        for log in logs:
            tags = log.get("tags", [])
            if tags:
                for tag in tags:
                    tag_count[tag] = tag_count.get(tag, 0) + 1
        
        # Sort by frequency
        sorted_tags = sorted(tag_count.items(), key=lambda x: x[1], reverse=True)
        
        return {
            "total_unique_tags": len(tag_count),
            "tags": [{"tag": tag, "count": count} for tag, count in sorted_tags]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ADMIN ENDPOINTS
# ============================================

@app.get("/admin/users")
def admin_list_users(current_user: dict = Depends(get_current_user)):
    try:
        verify_admin(current_user)
        
        response = supabase.table("users").select("id, email, name, team_id, is_admin, created_at").execute()
        return {"users": response.data or []}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/users/{user_id}/logs")
def admin_get_user_logs(
    user_id: str = Path(..., description="User ID"),
    current_user: dict = Depends(get_current_user),
    date_from: str = Query(None, description="Date from (YYYY-MM-DD)"),
    date_to: str = Query(None, description="Date to (YYYY-MM-DD)")
):
    try:
        verify_admin(current_user)
        
        query = supabase.table("eod_logs").select("*").eq("user_id", user_id)
        
        if date_from:
            query = query.gte("date", date_from)
        if date_to:
            query = query.lte("date", date_to)
        
        response = query.order("date", desc=True).execute()
        return {"logs": response.data or []}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/users/{user_id}/stats")
def admin_get_user_stats(
    user_id: str = Path(..., description="User ID"),
    current_user: dict = Depends(get_current_user),
    week_start: str = Query(None, description="Week start date (YYYY-MM-DD)")
):
    try:
        verify_admin(current_user)
        
        import datetime as dt
        
        if week_start:
            week_date = dt.datetime.strptime(week_start, "%Y-%m-%d").date()
        else:
            today = dt.date.today()
            week_date = today - dt.timedelta(days=today.weekday())
        
        week_end = week_date + dt.timedelta(days=6)
        
        response = supabase.table("eod_logs").select("*").eq("user_id", user_id).gte("date", str(week_date)).lte("date", str(week_end)).execute()
        
        logs = response.data or []
        total_hours = sum(log.get("hours", 0) for log in logs)
        log_count = len(logs)
        avg_hours = total_hours / log_count if log_count > 0 else 0
        
        return {
            "week_start": str(week_date),
            "week_end": str(week_end),
            "user_id": user_id,
            "total_hours": total_hours,
            "avg_hours_per_day": round(avg_hours, 2),
            "log_count": log_count,
            "logs": logs
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/stats")
def admin_get_collective_stats(
    current_user: dict = Depends(get_current_user),
    team_id: str = Query(None, description="Team ID for team-specific stats")
):
    try:
        verify_admin(current_user)
        
        # Get all users (or team users)
        if team_id:
            users_response = supabase.table("users").select("id").eq("team_id", team_id).execute()
        else:
            users_response = supabase.table("users").select("id").execute()
        
        user_ids = [u["id"] for u in users_response.data or []]
        
        # Get all logs
        total_hours = 0
        total_logs = 0
        
        for uid in user_ids:
            logs_response = supabase.table("eod_logs").select("hours").eq("user_id", uid).execute()
            logs = logs_response.data or []
            total_logs += len(logs)
            total_hours += sum(log.get("hours", 0) for log in logs)
        
        avg_hours_per_log = total_hours / total_logs if total_logs > 0 else 0
        
        return {
            "total_users": len(user_ids),
            "total_logs": total_logs,
            "total_hours_logged": total_hours,
            "avg_hours_per_log": round(avg_hours_per_log, 2),
            "team_id": team_id or "all"
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/admin/users/{user_id}/team")
def admin_assign_user_to_team(
    user_id: str = Path(..., description="User ID"),
    team_id: str = Query(..., description="Team ID to assign"),
    current_user: dict = Depends(get_current_user)
):
    try:
        verify_admin(current_user)
        
        result = supabase.table("users").update({"team_id": team_id}).eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User assigned to team", "user": result.data[0]}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# TEAMS ENDPOINTS (Admin Only)
# ============================================

@app.get("/teams")
def list_teams():
    try:
        response = supabase.table("teams").select("*").execute()
        return {"teams": response.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/teams")
def create_team(
    team_data: dict,
    current_user: dict = Depends(get_current_user)
):
    try:
        verify_admin(current_user)
        
        result = supabase.table("teams").insert({
            "name": team_data.get("name"),
            "description": team_data.get("description", "")
        }).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create team")
        
        return {"message": "Team created", "team": result.data[0]}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
