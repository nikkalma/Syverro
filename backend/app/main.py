cat > /opt/syverro/backend/app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/books/")
async def get_books():
    return [
        {"id": "1", "title": "Дюна", "author": "Фрэнк Герберт"},
        {"id": "2", "title": "1984", "author": "Джордж Оруэлл"},
    ]

@app.get("/books/catalog/")
async def get_catalog():
    return [
        {"id": "3", "title": "Мастер и Маргарита", "author": "Михаил Булгаков"},
        {"id": "4", "title": "Преступление и наказание", "author": "Фёдор Достоевский"},
    ]
EOF