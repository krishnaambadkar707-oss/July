import os
import re
import json
from datetime import datetime
from typing import Dict, Any, TypedDict, Optional, List

try:
    import dotenv
    dotenv.load_dotenv()
except Exception:
    pass

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, END

from ..models import ComplaintFormSchema, RiskAssessmentSchema, CompletenessCheckSchema
from .prompts import QMS_EXTRACTION_PROMPT, QMS_EDIT_PROMPT, QMS_INTENT_SYSTEM_PROMPT


class AgentState(TypedDict):
    prompt: str
    current_form: Dict[str, Any]
    intent: str
    extracted_data: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    reply_text: str
    action_taken: str


def get_llm():
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        try:
            return ChatGroq(model_name=model_name, groq_api_key=groq_key, temperature=0.1)
        except Exception:
            try:
                return ChatGroq(model_name="gemma2-9b-it", groq_api_key=groq_key, temperature=0.1)
            except Exception:
                pass

    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=gemini_key, temperature=0.1)
        except Exception:
            pass
    return None


def format_date_str(raw_date: str) -> str:
    if not raw_date:
        return ""
    raw_date = raw_date.strip()
    match = re.search(r"(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}[-/]\d{4}|\d{4}[-/]\d{1,2}|[A-Za-z]+\s+\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})", raw_date)
    if match:
        raw_date = match.group(1)
    if re.match(r"^\d{4}-\d{2}-\d{2}$", raw_date):
        return raw_date
    for fmt in (
        "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d", "%d-%m-%Y", "%m-%d-%Y",
        "%b %Y", "%B %Y", "%m/%Y", "%Y-%m", "%d %b %Y", "%d %B %Y"
    ):
        try:
            dt = datetime.strptime(raw_date, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass
    return raw_date


def fallback_extract(prompt: str, current_form: Dict[str, Any] = None) -> Dict[str, Any]:
    text = prompt.strip()
    text_lower = text.lower()
    
    is_edit = bool(
        current_form and (
            any(k in text_lower for k in ["sorry", "update", "change", "correct", "edit", "instead of", "batch number is", "customer is", "quantity is", "change batch", "change customer", "mfg date is", "expiry is"])
            or "edit complaint" in text_lower
        )
    )

    data = current_form.copy() if (is_edit and current_form) else {
        "complaint_source": "",
        "customer_name": "",
        "product_name": "",
        "product_strength": "",
        "batch_number": "",
        "mfg_date": "",
        "expiry_date": "",
        "quantity_affected": "",
        "complaint_type": "",
        "complaint_date": datetime.today().strftime("%Y-%m-%d"),
        "description": prompt,
        "initial_severity": "Major",
        "priority": "High",
        "suggested_next_action": "Route to QA investigation & issue replacement",
        "risk_reasoning": "Product quality anomaly reported. Potential batch contamination or formulation defect.",
        "capa_recommendation": "Initiate batch retention test, quarantine affected inventory, notify QA Lead.",
        "precautions": "STANDARD QMS PRECAUTION: Place batch on temporary quarantine hold pending QA physical inspection and retention sample review."
    }

    # A. Structured Key-Value Extraction (Ideal for PDFs/Emails/Formatted Text)
    kv_map = [
        ("customer_name", r"(?:customer\s*name|customer)\s*[:=]\s*([^\n\r]+)"),
        ("complaint_source", r"(?:complaint\s*source|source)\s*[:=]\s*([^\n\r]+)"),
        ("product_name", r"(?:product\s*name|product)\s*[:=]\s*([^\n\r]+)"),
        ("product_strength", r"(?:product\s*strength|strength)\s*[:=]\s*([^\n\r]+)"),
        ("batch_number", r"(?:batch\s*(?:/\s*lot)?\s*(?:number|no|#)?|lot\s*(?:number|no|#)?)\s*[:=]\s*([^\n\r]+)"),
        ("mfg_date", r"(?:manufacturing\s*date|manufactured\s*date|mfg\s*date|mfd\s*date|mfg\s*dt|mfd\s*dt|mfg|mfd|date\s*of\s*manufacture|dom)\s*[:=]\s*([^\n\r]+)"),
        ("expiry_date", r"(?:expiry\s*date|exp\s*date|exp\s*dt|expiry\s*dt|date\s*of\s*expiry|exp|expiry|doe)\s*[:=]\s*([^\n\r]+)"),
        ("quantity_affected", r"(?:affected\s*quantity|quantity\s*affected|quantity)\s*[:=]\s*([^\n\r]+)"),
        ("complaint_type", r"(?:complaint\s*type)\s*[:=]\s*([^\n\r]+)"),
    ]
    for key, pattern in kv_map:
        match = re.search(pattern, text, re.I)
        if match:
            val = match.group(1).strip()
            val = re.split(r"\n|\r|Detailed|Product|Batch|Manufacturing|Expiry|Affected|Complaint", val, flags=re.I)[0].strip()
            if key in ["mfg_date", "expiry_date"]:
                val = format_date_str(val)
            if val and (not is_edit or not data.get(key)):
                data[key] = val

    # B. Natural Language Patterns (For Chat Prompts & Informal Sentences)

    # 1. CUSTOMER NAME EXTRACTION
    if not data.get("customer_name") or is_edit:
        cust_patterns = [
            r"(?:customer\s*name|customer|client|reported\s*by|complaint\s*from|from)\s*(?:is|to|:|=)?\s*([A-Z0-9][A-Za-z0-9\s&.-]{1,50}?(?:Pharmacy|Hospital|Distributor|Labs|Laboratories|Clinic|Pharma|Healthcare|Medicals|Store|Wholesaler|Chemists?|Inc|Ltd|LLC|Pvt|Corp)?)\b",
            r"\b(Dr\.?\s*[A-Z][a-zA-Z0-9\s&.-]{1,40}(?:Labs|Laboratories|Pharma|Clinic)?)\b",
            r"\b(Apollo\s+Pharmacy(?:\s+Ltd)?|MedPlus|Fortis\s+Hospital|Max\s+Healthcare|Sun\s+Pharma|Cipla|Reddy'?s?\s+Labs?)\b",
            r"^([A-Z][a-zA-Z0-9\s&.-]{2,35}\s+(?:Pharmacy|Hospital|Distributor|Labs|Clinic|Pharma))\b"
        ]
        for pattern in cust_patterns:
            match = re.search(pattern, text, re.I)
            if match:
                found_cust = match.group(1).strip()
                found_cust = re.split(r"\s+(?:and|regarding|about|batch|lot|product|quantity|with|for|reported|complained|found|received|sent|stated|noted|has|is)\b", found_cust, flags=re.I)[0].strip()
                if len(found_cust) > 2 and found_cust.lower() not in ["the", "this", "a", "an"]:
                    data["customer_name"] = found_cust.title()
                    break

    # 2. COMPLAINT SOURCE EXTRACTION
    if not data.get("complaint_source"):
        source_match = re.search(r"(?:source|received\s*via|channel)\s*(?:is|:|=)?\s*(Email|Phone\s*Call|Customer\s*Portal|Distributor\s*Report|Letter|Field\s*Rep|Audit)", text, re.I)
        if source_match:
            data["complaint_source"] = source_match.group(1).strip().title()
        elif data.get("customer_name"):
            data["complaint_source"] = data["customer_name"]

    # 3. PRODUCT NAME EXTRACTION
    if not data.get("product_name") or is_edit:
        prod_patterns = [
            r"(?:product\s*name|product|drug)\s*(?:is|to|:|=)\s*([A-Za-z0-9\s.-]{2,40})",
            r"\b(Amoxicillin|Metformin(?:\s*Hydrochloride)?|Paracetamol|Ibuprofen|Ciprofloxacin|Atorvastatin|Omeprazole|Aspirin|Azithromycin|Ceftriaxone|Doxycycline|Augmentin|Cefalexin|Pantoprazole|Montelukast|Gabapentin|Lisinopril|Losartan)\b",
            r"\b([A-Z][a-zA-Z0-9\-]{2,25}\s+(?:Capsules|Tablets|Injection|Syrup|API|Suspension|Ointment|Solution|Gel|Drops))\b"
        ]
        for pattern in prod_patterns:
            match = re.search(pattern, text, re.I)
            if match:
                found_prod = match.group(1).strip()
                found_prod = re.split(r"\s+(?:and|batch|lot|quantity|reported|strength|\d+mg|\d+g)\b", found_prod, flags=re.I)[0].strip()
                if len(found_prod) > 2:
                    data["product_name"] = found_prod.title()
                    break

    # 4. PRODUCT STRENGTH EXTRACTION
    if not data.get("product_strength") or is_edit:
        strength_match = re.search(r"(\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml|%|ip/bp|usp|iu|mg/ml))", text, re.I)
        if strength_match:
            data["product_strength"] = strength_match.group(1).strip().upper()

    # 5. BATCH / LOT NUMBER EXTRACTION
    if not data.get("batch_number") or is_edit:
        batch_patterns = [
            r"(?:batch|lot)(?:\s*number|\s*no|\s*#)?\s*(?:is|to|:|=|\s)\s*([A-Z0-9\-]{3,20})",
            r"\b([A-Z]{2,4}\d{4,8}[A-Z0-9]?)\b",
            r"\b(LOT-?[A-Z0-9]{4,12})\b"
        ]
        for pattern in batch_patterns:
            match = re.search(pattern, text, re.I)
            if match:
                bval = match.group(1).strip().upper()
                bval = re.split(r"\s+(?:and|quantity|mfg|exp|date)\b", bval, flags=re.I)[0].strip()
                if bval not in ["TABLETS", "CAPSULES", "INJECTION", "SYRUP", "COMPLAINT"]:
                    data["batch_number"] = bval
                    break

    # 6. QUANTITY AFFECTED EXTRACTION
    if not data.get("quantity_affected") or is_edit:
        qty_patterns = [
            r"(?:quantity\s*affected|quantity|qty|amount)\s*(?:is|to|:|=)?\s*(\d+\s*[a-zA-Z\s]+)",
            r"(\d+\s*(?:capsules|tablets|vials|bottles|kg|drums|units|boxes|packs|pcs|pieces|strips|blisters|ampoules))"
        ]
        for pattern in qty_patterns:
            match = re.search(pattern, text, re.I)
            if match:
                found_qty = match.group(1).strip()
                found_qty = re.split(r"\n|\r|Complaint|Detailed|Batch", found_qty, flags=re.I)[0].strip()
                data["quantity_affected"] = found_qty
                break

    # 7. MANUFACTURING DATE EXTRACTION
    if not data.get("mfg_date") or is_edit:
        mfg_patterns = [
            r"(?:mfg|mfd|manufactur(?:ed|ing|e)?)(?:\s*date|\s*dt)?\s*(?:is|to|:|=|on|in|of|from|was)?\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}[-/]\d{4}|\d{4}[-/]\d{1,2}|[A-Za-z]+\s+\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})",
            r"(?:date\s*of\s*manufactur(?:e|ing)|dom)\s*(?:is|to|:|=|on|in|of|from|was)?\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}[-/]\d{4}|\d{4}[-/]\d{1,2}|[A-Za-z]+\s+\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})"
        ]
        for pattern in mfg_patterns:
            mfg_match = re.search(pattern, text, re.I)
            if mfg_match:
                formatted_mfg = format_date_str(mfg_match.group(1))
                if formatted_mfg:
                    data["mfg_date"] = formatted_mfg
                    break

    # 8. EXPIRY DATE EXTRACTION
    if not data.get("expiry_date") or is_edit:
        exp_patterns = [
            r"(?:expir(?:y|e|ing|es)?|exp)(?:\s*date|\s*dt)?\s*(?:is|to|:|=|on|in|of|from|was)?\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}[-/]\d{4}|\d{4}[-/]\d{1,2}|[A-Za-z]+\s+\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})",
            r"(?:date\s*of\s*expiry|doe)\s*(?:is|to|:|=|on|in|of|from|was)?\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}[-/]\d{4}|\d{4}[-/]\d{1,2}|[A-Za-z]+\s+\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})"
        ]
        for pattern in exp_patterns:
            exp_match = re.search(pattern, text, re.I)
            if exp_match:
                formatted_exp = format_date_str(exp_match.group(1))
                if formatted_exp:
                    data["expiry_date"] = formatted_exp
                    break

    # 9. COMPLAINT TYPE & RISK ASSESSMENT & PRECAUTIONS
    if any(k in text_lower for k in ["discolor", "color", "colour", "appearance", "black spot", "yellowing"]):
        data["complaint_type"] = "Discoloration / Appearance"
        data["initial_severity"] = "Major"
        data["priority"] = "High"
        data["suggested_next_action"] = "Route to QA investigation & issue product replacement"
        data["risk_reasoning"] = "Visual anomaly reported. Requires degradation and stability testing."
        data["capa_recommendation"] = "Initiate retention sample inspection, review packaging environment logs."
        data["precautions"] = "STORAGE & STABILITY CAUTION: Segregate affected lot into quarantine zone. Store samples in light-protected, moisture-barrier containers at 15-25°C. Inspect retention samples immediately."

    elif any(k in text_lower for k in ["particulate", "foreign", "impurity", "contamination", "glass", "hair", "metal"]):
        data["complaint_type"] = "Foreign Matter / Contamination"
        data["initial_severity"] = "Critical"
        data["priority"] = "High"
        data["suggested_next_action"] = "Immediate QA Quarantine, Batch Retention Audit & Health Hazard Evaluation"
        data["risk_reasoning"] = "Extraneous material poses direct patient health and safety risk."
        data["capa_recommendation"] = "Quarantine batch inventory across supply chain, audit filtration lines."
        data["precautions"] = "IMMEDIATE BATCH QUARANTINE: Halt distribution immediately. Issue stock hold across warehouses. Isolate lot under lock-and-key. Instruct healthcare providers to halt administration."

    elif any(k in text_lower for k in ["broken", "seal", "leak", "packaging", "damaged", "cracked", "crushed", "moisture"]):
        data["complaint_type"] = "Packaging / Seal Integrity"
        data["initial_severity"] = "Minor"
        data["priority"] = "Medium"
        data["suggested_next_action"] = "Inspect packaging line seals & issue replacement credit"
        data["risk_reasoning"] = "Container closure integrity compromise may lead to moisture ingress."
        data["capa_recommendation"] = "Calibrate blister/bottle sealing machinery and perform leak test on retention samples."
        data["precautions"] = "HANDLING & LEAKAGE CONTROL: Inspect shipper boxes for moisture or puncturing. Wear protective nitrile gloves if liquid leakage is suspected. Segregate damaged units."

    elif any(k in text_lower for k in ["potency", "efficacy", "dissolution", "assay", "out of spec", "oos", "substandard"]):
        data["complaint_type"] = "Efficacy / Out of Specification"
        data["initial_severity"] = "Critical"
        data["priority"] = "High"
        data["suggested_next_action"] = "Initiate OOS Technical Investigation & Notify Regulatory Affairs"
        data["risk_reasoning"] = "Sub-potent or OOS active drug substance threatens therapeutic efficacy."
        data["capa_recommendation"] = "Re-analyze control samples, review batch manufacturing record (BMR) parameters."
        data["precautions"] = "REGULATORY STOCK HOLD: Freeze batch dispatch immediately. Quarantine raw materials & in-process samples. Initiate OOS protocol prior to sample handling."

    elif any(k in text_lower for k in ["label", "print", "mislabel", "barcode", "bar code", "typo"]):
        data["complaint_type"] = "Labeling / Printing Error"
        data["initial_severity"] = "Minor"
        data["priority"] = "Medium"
        data["suggested_next_action"] = "Review artwork approvals and line clearance logs"
        data["risk_reasoning"] = "Labeling error may cause misidentification or dosage confusion."
        data["capa_recommendation"] = "Enforce optical vision inspection system on labeling line."
        data["precautions"] = "DISPENSING CONTROL: Pause dispensing of affected lot to prevent dosage/administration confusion. Flag inventory in ERP with 'Under QA Inspection' status."

    elif any(k in text_lower for k in ["shortage", "missing", "empty", "underfill", "quantity"]):
        data["complaint_type"] = "Quantity / Shortage Defect"
        data["initial_severity"] = "Minor"
        data["priority"] = "Low"
        data["suggested_next_action"] = "Verify check-weigher calibration logs"
        data["risk_reasoning"] = "Underfill or missing unit count in secondary packaging."
        data["capa_recommendation"] = "Re-calibrate inline check-weighers and conduct line balance check."
        data["precautions"] = "INVENTORY AUDIT CAUTION: Hold remaining cases for check-weigher verification. Verify gross pack weight before releasing to distribution."

    elif not data.get("complaint_type"):
        data["complaint_type"] = "Quality Issue / General Defect"

    if not is_edit:
        data["description"] = prompt

    return data


# Graph Nodes
def classify_intent_node(state: AgentState) -> AgentState:
    prompt = state["prompt"].lower()
    if any(k in prompt for k in ["sorry", "update", "change", "correct", "edit", "instead of", "batch number is", "customer is", "mfg date is", "expiry date is"]):
        state["intent"] = "EDIT_COMPLAINT"
    else:
        state["intent"] = "LOG_COMPLAINT"
    return state


def extract_or_edit_node(state: AgentState) -> AgentState:
    llm = get_llm()
    prompt = state["prompt"]
    current_form = state.get("current_form", {})
    intent = state.get("intent", "LOG_COMPLAINT")

    parsed_res = None
    if llm:
        try:
            if intent == "EDIT_COMPLAINT":
                sys_msg = SystemMessage(content=QMS_EDIT_PROMPT.format(
                    current_form_json=json.dumps(current_form),
                    user_instruction=prompt
                ))
            else:
                sys_msg = SystemMessage(content=QMS_EXTRACTION_PROMPT)
            
            response = llm.invoke([sys_msg, HumanMessage(content=prompt)])
            txt = response.content.strip()
            # Extract JSON block
            jmatch = re.search(r"\{.*\}", txt, re.DOTALL)
            if jmatch:
                parsed_res = json.loads(jmatch.group(0))
        except Exception:
            parsed_res = None

    if not parsed_res:
        parsed_res = fallback_extract(prompt, current_form if intent == "EDIT_COMPLAINT" else None)

    state["extracted_data"] = parsed_res
    state["action_taken"] = "EDITED" if intent == "EDIT_COMPLAINT" else "LOGGED"
    
    if intent == "EDIT_COMPLAINT":
        state["reply_text"] = f"Updated complaint details based on your instructions. Modified fields have been reflected in the form."
    else:
        prod = parsed_res.get('product_name') or 'N/A'
        batch = parsed_res.get('batch_number') or 'N/A'
        state["reply_text"] = f"Logged complaint details successfully. Product: {prod}, Batch: {batch}. The form on the left has been auto-populated."
    
    return state


# Completeness Scoring
def calculate_completeness(form_data: Dict[str, Any]) -> CompletenessCheckSchema:
    required_fields = [
        ("customer_name", "Customer Name"),
        ("product_name", "Product Name"),
        ("product_strength", "Product Strength/Grade"),
        ("batch_number", "Batch/Lot Number"),
        ("quantity_affected", "Quantity Affected"),
        ("complaint_type", "Complaint Type"),
        ("description", "Detailed Description")
    ]
    missing = []
    filled_count = 0
    for key, label in required_fields:
        val = form_data.get(key)
        if val and str(val).strip() and str(val).strip() != "Awaiting AI extraction...":
            filled_count += 1
        else:
            missing.append(label)

    score = int((filled_count / len(required_fields)) * 100)
    return CompletenessCheckSchema(
        score=score,
        missing_fields=missing,
        is_complete=(score >= 85)
    )


# Build LangGraph workflow
def build_qms_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("classify_intent", classify_intent_node)
    workflow.add_node("extract_or_edit", extract_or_edit_node)
    
    workflow.set_entry_point("classify_intent")
    workflow.add_edge("classify_intent", "extract_or_edit")
    workflow.add_edge("extract_or_edit", END)
    
    return workflow.compile()

qms_graph_app = build_qms_graph()


def process_qms_prompt(prompt: str, current_form: Dict[str, Any]) -> Dict[str, Any]:
    initial_state: AgentState = {
        "prompt": prompt,
        "current_form": current_form or {},
        "intent": "",
        "extracted_data": {},
        "risk_assessment": {},
        "reply_text": "",
        "action_taken": ""
    }
    
    final_state = qms_graph_app.invoke(initial_state)
    data = final_state["extracted_data"]

    form_obj = ComplaintFormSchema(
        complaint_source=data.get("complaint_source", "") or (current_form.get("complaint_source", "") if current_form else ""),
        customer_name=data.get("customer_name", "") or (current_form.get("customer_name", "") if current_form else ""),
        product_name=data.get("product_name", "") or (current_form.get("product_name", "") if current_form else ""),
        product_strength=data.get("product_strength", "") or (current_form.get("product_strength", "") if current_form else ""),
        batch_number=data.get("batch_number", "") or (current_form.get("batch_number", "") if current_form else ""),
        mfg_date=data.get("mfg_date", "") or (current_form.get("mfg_date", "") if current_form else ""),
        expiry_date=data.get("expiry_date", "") or (current_form.get("expiry_date", "") if current_form else ""),
        quantity_affected=data.get("quantity_affected", "") or (current_form.get("quantity_affected", "") if current_form else ""),
        complaint_type=data.get("complaint_type", "") or (current_form.get("complaint_type", "") if current_form else ""),
        complaint_date=data.get("complaint_date", "") or datetime.today().strftime("%Y-%m-%d"),
        description=data.get("description", "") or (current_form.get("description", "") if current_form else ""),
        initial_severity=data.get("initial_severity", "Major"),
        priority=data.get("priority", "High")
    )

    risk_obj = RiskAssessmentSchema(
        initial_severity=data.get("initial_severity", "Major"),
        priority=data.get("priority", "High"),
        suggested_next_action=data.get("suggested_next_action", "Route to QA investigation & issue replacement"),
        risk_reasoning=data.get("risk_reasoning", "Product quality anomaly reported. Technical investigation required."),
        capa_recommendation=data.get("capa_recommendation", "Quarantine affected lot, initiate retention sample analysis."),
        precautions=data.get("precautions", "STANDARD QMS PRECAUTION: Place batch on temporary quarantine hold pending QA physical inspection.")
    )

    completeness_obj = calculate_completeness(form_obj.model_dump())

    return {
        "reply": final_state["reply_text"],
        "extracted_form": form_obj,
        "risk_assessment": risk_obj,
        "completeness": completeness_obj,
        "action_taken": final_state["action_taken"]
    }
