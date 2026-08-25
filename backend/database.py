import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./qms_complaints.db")

# Ensure connect_args for SQLite
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)
    # Auto-migration check for SQLite schema additions
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(complaints)"))
            columns = [row[1] for row in result.fetchall()]
            if columns and "precautions" not in columns:
                conn.execute(text("ALTER TABLE complaints ADD COLUMN precautions TEXT"))
                conn.commit()
    except Exception as e:
        pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

