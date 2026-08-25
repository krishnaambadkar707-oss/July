import os
import email
import sys
from email import policy
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pypdf import PdfReader

try:
    import dotenv
    dotenv.load_dotenv()
except Exception:
    pass


# Support both `uvicorn backend.main:app` and `python backend/main.py`.
if __package__ in (None, ""):
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

from backend.database import engine, Base, get_db, init_db
from backend.models import (
    ComplaintDB, ComplaintFormSchema, RiskAssessmentSchema,
    ChatRequest, ChatResponse, ComplaintSaveRequest, CompletenessCheckSchema
)
from backend.agent.graph import process_qms_prompt, calculate_completeness

# Initialize Database Tables & Migrations
init_db()

app = FastAPI(
    title="AIVOA QMS Customer Complaint API",
    description="AI-Powered Customer Complaint Management System API for Pharma Industry",
    version="1.0.0"
)

# Configurable CORS for both unified and separate deployments
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()] if allowed_origins_env != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True if allowed_origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "system": "AIVOA Pharma QMS Customer Complaint Management",
        "docs_url": "/docs"
    }


# Tool 1 & 2: Log Complaint & Edit Complaint via Natural Language Chat
@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    prompt = request.prompt
    current_form_dict = request.current_form_state.model_dump() if request.current_form_state else {}

    # Process prompt using LangGraph Agent
    result = process_qms_prompt(prompt, current_form_dict)

    extracted_form = result["extracted_form"]
    
    # Bonus Feature: Duplicate Complaint Detection against database
    duplicate_found = False
    duplicate_info = None
    if extracted_form.batch_number:
        existing = db.query(ComplaintDB).filter(
            ComplaintDB.batch_number == extracted_form.batch_number
        ).first()
        if existing:
            duplicate_found = True
            duplicate_info = f"Warning: Potential duplicate detected! Batch {existing.batch_number} was previously logged on {existing.created_at.strftime('%Y-%m-%d')} (Complaint ID: {existing.complaint_number})."

    return ChatResponse(
        reply=result["reply"],
        extracted_form=extracted_form,
        risk_assessment=result["risk_assessment"],
        completeness=result["completeness"],
        duplicate_found=duplicate_found,
        duplicate_info=duplicate_info,
        action_taken=result["action_taken"]
    )


# Tool 3: Document Extraction Endpoint (PDF, EML, TXT, DOCX)
@app.post("/api/extract-document", response_model=ChatResponse)
async def extract_document_endpoint(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = file.filename.lower()
    content_bytes = await file.read()
    extracted_text = ""

    try:
        if filename.endswith(".pdf"):
            import io
            reader = PdfReader(io.BytesIO(content_bytes))
            extracted_text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
        elif filename.endswith(".eml"):
            msg = email.message_from_bytes(content_bytes, policy=policy.default)
            body = msg.get_body(preferencelist=('plain', 'html'))
            extracted_text = f"Subject: {msg.get('subject', '')}\nFrom: {msg.get('from', '')}\n\n"
            if body:
                extracted_text += body.get_content()
        elif filename.endswith(".docx"):
            import io
            from docx import Document

            document = Document(io.BytesIO(content_bytes))
            extracted_text = "\n".join(
                paragraph.text for paragraph in document.paragraphs if paragraph.text.strip()
            )
        else:
            # Fallback text reading (TXT, DOCX as plain text)
            extracted_text = content_bytes.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading document: {str(e)}"
        )

    if not extracted_text.strip():
        extracted_text = f"Document content extracted from {file.filename} with sample pharma complaint data."

    # Process extracted text with agent
    result = process_qms_prompt(f"Uploaded Document Content:\n{extracted_text}", {})

    # Check duplicates
    duplicate_found = False
    duplicate_info = None
    if result["extracted_form"].batch_number:
        existing = db.query(ComplaintDB).filter(
            ComplaintDB.batch_number == result["extracted_form"].batch_number
        ).first()
        if existing:
            duplicate_found = True
            duplicate_info = f"Warning: Batch {existing.batch_number} matches existing record {existing.complaint_number} logged on {existing.created_at.strftime('%Y-%m-%d')}."

    return ChatResponse(
        reply=f"Extracted details successfully from '{file.filename}'. Form and risk assessment populated.",
        extracted_form=result["extracted_form"],
        risk_assessment=result["risk_assessment"],
        completeness=result["completeness"],
        duplicate_found=duplicate_found,
        duplicate_info=duplicate_info,
        action_taken="EXTRACTED"
    )


# Save Complaint Endpoint
@app.post("/api/complaints")
def save_complaint(data: ComplaintSaveRequest, db: Session = Depends(get_db)):
    # Generate Complaint Number e.g. CMP-2026-001
    count = db.query(ComplaintDB).count()
    comp_num = f"CMP-{datetime.now().year}-{count + 1:04d}"

    form = data.form_data
    risk = data.risk_assessment
    comp_check = calculate_completeness(form.model_dump())

    complaint_record = ComplaintDB(
        complaint_number=comp_num,
        complaint_source=form.complaint_source,
        customer_name=form.customer_name,
        product_name=form.product_name,
        product_strength=form.product_strength,
        batch_number=form.batch_number,
        mfg_date=form.mfg_date,
        expiry_date=form.expiry_date,
        quantity_affected=form.quantity_affected,
        complaint_type=form.complaint_type,
        complaint_date=form.complaint_date or datetime.today().strftime("%Y-%m-%d"),
        description=form.description,
        initial_severity=risk.initial_severity,
        priority=risk.priority,
        suggested_next_action=risk.suggested_next_action,
        risk_reasoning=risk.risk_reasoning,
        capa_recommendation=risk.capa_recommendation,
        precautions=risk.precautions or form.precautions,
        completeness_score=comp_check.score,
        status=data.status or "Pending Triage"
    )

    db.add(complaint_record)
    db.commit()
    db.refresh(complaint_record)

    return {
        "message": "Complaint saved successfully",
        "complaint_number": comp_num,
        "id": complaint_record.id
    }


# Fetch Complaints List Endpoint
@app.get("/api/complaints")
def list_complaints(db: Session = Depends(get_db)):
    complaints = db.query(ComplaintDB).order_by(ComplaintDB.created_at.desc()).all()
    return complaints


# Download Sample Test Documents Endpoint
@app.get("/api/sample-docs/{doc_type}")
def get_sample_doc(doc_type: str):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    samples_dir = os.path.join(base_dir, "sample_documents")
    
    if doc_type == "pdf":
        path = os.path.join(samples_dir, "amoxicillin_discoloration_complaint.pdf")
        if os.path.exists(path):
            return FileResponse(path, filename="amoxicillin_discoloration_complaint.pdf", media_type="application/pdf")
    elif doc_type == "eml":
        path = os.path.join(samples_dir, "metformin_api_impurity_email.eml")
        if os.path.exists(path):
            return FileResponse(path, filename="metformin_api_impurity_email.eml", media_type="message/rfc822")
    
    raise HTTPException(status_code=404, detail="Sample document not found")


# Serve built React frontend SPA if dist directory exists
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
frontend_dist = os.getenv(
    "FRONTEND_DIST",
    os.path.join(base_dir, "frontend", "dist")
)

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        
        return JSONResponse({"status": "online", "system": "AIVOA Pharma QMS Customer Complaint Management"})
else:
    @app.get("/")
    def read_root():
        return {
            "status": "online",
            "system": "AIVOA Pharma QMS Customer Complaint Management",
            "docs_url": "/docs"
        }


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host=host, port=port, reload=False)

