from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from .database import Base

# SQLAlchemy Database Model
class ComplaintDB(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_number = Column(String(50), unique=True, index=True)
    
    # 1. Origin & Customer Details
    complaint_source = Column(String(200), nullable=True)
    customer_name = Column(String(200), nullable=True)
    
    # 2. Product & Batch Identification
    product_name = Column(String(200), nullable=True)
    product_strength = Column(String(100), nullable=True)
    batch_number = Column(String(100), nullable=True, index=True)
    mfg_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    quantity_affected = Column(String(100), nullable=True)
    
    # 3. Complaint Details
    complaint_type = Column(String(100), nullable=True)
    complaint_date = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    
    # 4. Initial Assessment & Priority (AI Copilot Risk Assessment)
    initial_severity = Column(String(50), nullable=True) # Critical, Major, Minor
    priority = Column(String(50), nullable=True) # High, Medium, Low
    suggested_next_action = Column(Text, nullable=True)
    risk_reasoning = Column(Text, nullable=True)
    capa_recommendation = Column(Text, nullable=True)
    precautions = Column(Text, nullable=True)
    completeness_score = Column(Integer, default=0)
    
    status = Column(String(50), default="Pending Triage")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Pydantic Schemas
class ComplaintFormSchema(BaseModel):
    complaint_source: Optional[str] = ""
    customer_name: Optional[str] = ""
    product_name: Optional[str] = ""
    product_strength: Optional[str] = ""
    batch_number: Optional[str] = ""
    mfg_date: Optional[str] = ""
    expiry_date: Optional[str] = ""
    quantity_affected: Optional[str] = ""
    complaint_type: Optional[str] = ""
    complaint_date: Optional[str] = ""
    description: Optional[str] = ""
    initial_severity: Optional[str] = "Pending"
    priority: Optional[str] = "Pending"

class RiskAssessmentSchema(BaseModel):
    initial_severity: str = "Major"
    priority: str = "High"
    suggested_next_action: str = "Route to QA investigation & issue replacement"
    risk_reasoning: str = ""
    capa_recommendation: str = ""
    health_hazard_level: str = "Moderate"
    precautions: str = ""

class CompletenessCheckSchema(BaseModel):
    score: int = 0
    missing_fields: List[str] = []
    is_complete: bool = False

class ChatRequest(BaseModel):
    prompt: str
    current_form_state: Optional[ComplaintFormSchema] = Field(default_factory=ComplaintFormSchema)

class ChatResponse(BaseModel):
    reply: str
    extracted_form: ComplaintFormSchema
    risk_assessment: RiskAssessmentSchema
    completeness: CompletenessCheckSchema
    duplicate_found: Optional[bool] = False
    duplicate_info: Optional[str] = None
    action_taken: str # "LOGGED", "EDITED", "EXTRACTED", "INFO"

class ComplaintSaveRequest(BaseModel):
    form_data: ComplaintFormSchema
    risk_assessment: RiskAssessmentSchema
    status: Optional[str] = "Pending Triage"
