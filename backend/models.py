from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    name: str
    password: str
    team_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    is_admin: bool
    team_id: Optional[str] = None
    created_at: datetime

# Team Models
class Team(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_at: datetime

# EOD Log Models
class EODLogCreate(BaseModel):
    done: Optional[str] = None
    in_progress: Optional[str] = None
    blockers: Optional[str] = None
    hours: int = 0
    tags: Optional[List[str]] = []

class EODLogUpdate(BaseModel):
    done: Optional[str] = None
    in_progress: Optional[str] = None
    blockers: Optional[str] = None
    hours: Optional[int] = None
    tags: Optional[List[str]] = None

class EODLogResponse(BaseModel):
    id: str
    user_id: str
    date: date
    done: Optional[str]
    in_progress: Optional[str]
    blockers: Optional[str]
    hours: int
    tags: List[str]
    created_at: datetime

# Analytics Models
class WeeklyStats(BaseModel):
    week_start: str
    week_end: str
    total_hours: int
    avg_hours_per_day: float
    log_count: int

class TagFrequency(BaseModel):
    tag: str
    count: int

class CollectiveStats(BaseModel):
    total_users: int
    total_logs: int
    total_hours_logged: int
    avg_hours_per_log: float

class UserBasicInfo(BaseModel):
    id: str
    email: str
    name: str
    is_admin: bool
    team_id: Optional[str]
    created_at: datetime

class UserWithStats(BaseModel):
    user: UserBasicInfo
    total_hours: int
    log_count: int
