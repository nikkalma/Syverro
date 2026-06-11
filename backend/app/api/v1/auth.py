from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserLogin, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token, get_user_by_email

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    print(f"🔍 REGISTER ATTEMPT: {user_data.email}")
    
    try:
        # Проверка, существует ли пользователь
        result = await db.execute(select(User).where(User.email == user_data.email))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"❌ Email already registered: {user_data.email}")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Создание пользователя
        user = User(
            email=user_data.email,
            password_hash=hash_password(user_data.password)
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        print(f"✅ User created: {user.id} - {user.email}")
        
        return UserResponse(
            id=user.id,
            email=user.email,
            created_at=user.created_at.isoformat() if user.created_at else ""
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"🔥 UNEXPECTED ERROR: {type(e).__name__} - {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    print(f"🔍 LOGIN ATTEMPT: {user_data.email}")
    
    try:
        user = await get_user_by_email(db, user_data.email)
        if not user or not verify_password(user_data.password, user.password_hash):
            print(f"❌ Login failed: {user_data.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        access_token = create_access_token({"sub": str(user.id)})
        print(f"✅ Login success: {user.id} - {user.email}")
        
        return TokenResponse(access_token=access_token)
    except HTTPException:
        raise
    except Exception as e:
        print(f"🔥 LOGIN ERROR: {type(e).__name__} - {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")