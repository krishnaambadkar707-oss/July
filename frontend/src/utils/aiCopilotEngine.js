// Client-Side AI Copilot Engine for Pharma QMS Complaint Intake & Triage
// Provides seamless failover if the FastAPI backend server is unreachable.

export function formatDateStr(rawDate) {
  if (!rawDate) return '';
  const str = rawDate.trim();
  const match = str.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}[-/]\d{4}|\d{4}[-/]\d{1,2}|[A-Za-z]+\s+\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
  if (match) {
    const val = match[1];
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const parts = val.split(/[-/\s,]+/);
    if (parts.length >= 3) {
      let y = parts.find(p => p.length === 4);
      let rest = parts.filter(p => p.length < 4);
      if (y && rest.length >= 2) {
        let m = rest[0].padStart(2, '0');
        let d = rest[1].padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    return val;
  }
  return str;
}

export function processClientAIChat(prompt, currentForm = {}) {
  const text = prompt.trim();
  const textLower = text.toLowerCase();

  const isEdit = anyMatch(textLower, [
    "sorry", "update", "change", "correct", "edit", "instead of",
    "batch number is", "customer is", "quantity is", "change batch",
    "change customer", "mfg date is", "expiry is"
  ]);

  const actionTaken = isEdit ? "EDITED" : "LOGGED";
  const baseData = (isEdit && currentForm) ? { ...currentForm } : {};

  const extracted = {
    complaint_source: baseData.complaint_source || "",
    customer_name: baseData.customer_name || "",
    product_name: baseData.product_name || "",
    product_strength: baseData.product_strength || "",
    batch_number: baseData.batch_number || "",
    mfg_date: baseData.mfg_date || "",
    expiry_date: baseData.expiry_date || "",
    quantity_affected: baseData.quantity_affected || "",
    complaint_type: baseData.complaint_type || "",
    complaint_date: baseData.complaint_date || new Date().toISOString().split('T')[0],
    description: isEdit ? (baseData.description || prompt) : prompt,
    initial_severity: baseData.initial_severity || "Major",
    priority: baseData.priority || "High"
  };

  // Structured Key-Value Extractions
  const kvMap = [
    ["customer_name", /(?:customer\s*name|customer|client)\s*[:=]\s*([^\n\r]+)/i],
    ["complaint_source", /(?:complaint\s*source|source|channel)\s*[:=]\s*([^\n\r]+)/i],
    ["product_name", /(?:product\s*name|product|drug)\s*[:=]\s*([^\n\r]+)/i],
    ["product_strength", /(?:product\s*strength|grade\s*\/?\s*strength|strength|grade)\s*[:=]\s*([^\n\r]+)/i],
    ["batch_number", /(?:batch\s*(?:\/\s*lot)?\s*(?:number|no|#)?|lot\s*(?:number|no|#)?)\s*[:=]\s*([^\n\r]+)/i],
    ["mfg_date", /(?:manufacturing\s*date|manufactured\s*date|mfg\s*date|mfd\s*date|mfg\s*dt|mfd\s*dt|mfg|mfd|date\s*of\s*manufacture|dom)\s*[:=]\s*([^\n\r]+)/i],
    ["expiry_date", /(?:expiry\s*date|exp\s*date|exp\s*dt|expiry\s*dt|date\s*of\s*expiry|exp|expiry|doe)\s*[:=]\s*([^\n\r]+)/i],
    ["quantity_affected", /(?:affected\s*quantity|quantity\s*affected|quantity|qty)\s*[:=]\s*([^\n\r]+)/i],
    ["complaint_type", /(?:complaint\s*type)\s*[:=]\s*([^\n\r]+)/i]
  ];

  kvMap.forEach(([key, regex]) => {
    const match = text.match(regex);
    if (match) {
      let val = match[1].trim();
      val = val.split(/\n|\r|\b(?:Detailed|Description|Product|Batch|Manufacturing|Expiry|Affected|Complaint)\b/i)[0].trim();
      if (key === 'mfg_date' || key === 'expiry_date') val = formatDateStr(val);
      if (val) extracted[key] = val;
    }
  });

  // Natural Language Pattern Extractions

  // 1. CUSTOMER NAME
  if (!extracted.customer_name || isEdit) {
    const custPatterns = [
      /(?:customer\s*name|customer|client|reported\s*by|complaint\s*from|from)\s*(?:is|to|:|=)?\s*([A-Z0-9][A-Za-z0-9\s&.-]{1,50}?(?:Pharmacy|Hospital|Distributor|Labs|Laboratories|Clinic|Pharma|Healthcare|Medicals|Store|Wholesaler|Chemists?|Inc|Ltd|LLC|Pvt|Corp)?)\b/i,
      /\b(Dr\.?\s*[A-Z][a-zA-Z0-9\s&.-]{1,40}(?:Labs|Laboratories|Pharma|Clinic)?)\b/i,
      /\b(Apollo\s+Pharmacy(?:\s+Ltd)?|MedPlus|Fortis\s+Hospital|Max\s+Healthcare|Sun\s+Pharma|Cipla|BioHealth\s+Laboratories(?:\s+Inc)?|Reddy'?s?\s+Labs?)\b/i,
      /^([A-Z][a-zA-Z0-9\s&.-]{2,35}\s+(?:Pharmacy|Hospital|Distributor|Labs|Clinic|Pharma))\b/i
    ];
    for (const pat of custPatterns) {
      const match = text.match(pat);
      if (match) {
        let val = match[1].trim();
        val = val.split(/\s+(?:and|regarding|about|batch|lot|product|quantity|with|for|reported|complained|found|received|sent|stated|noted|has|is)\b/i)[0].trim();
        if (val.length > 2 && !['the', 'this', 'a', 'an'].includes(val.toLowerCase())) {
          extracted.customer_name = titleCase(val);
          break;
        }
      }
    }
  }

  // 2. COMPLAINT SOURCE
  if (!extracted.complaint_source) {
    const srcMatch = text.match(/(?:source|received\s*via|channel)\s*(?:is|:|=)?\s*(Email(?:\s*Notification)?|Phone\s*Call|Customer\s*Portal|Distributor\s*Report|Letter|Field\s*Rep|Audit)/i);
    if (srcMatch) {
      extracted.complaint_source = titleCase(srcMatch[1].trim());
    } else if (extracted.customer_name) {
      extracted.complaint_source = extracted.customer_name;
    }
  }

  // 3. PRODUCT NAME
  if (!extracted.product_name || isEdit) {
    const prodPatterns = [
      /(?:product\s*name|product|drug)\s*(?:is|to|:|=)\s*([A-Za-z0-9\s.-]{2,40})/i,
      /\b(Amoxicillin(?:\s*Capsules|\s*Tablets)?|Metformin(?:\s*Hydrochloride)?(?:\s*API)?|Paracetamol|Ibuprofen|Ciprofloxacin|Atorvastatin|Omeprazole|Aspirin|Azithromycin|Ceftriaxone|Doxycycline|Augmentin|Cefalexin|Pantoprazole|Montelukast|Gabapentin|Lisinopril|Losartan)\b/i,
      /\b([A-Z][a-zA-Z0-9\-]{2,25}\s+(?:Capsules|Tablets|Injection|Syrup|API|Suspension|Ointment|Solution|Gel|Drops))\b/i
    ];
    for (const pat of prodPatterns) {
      const match = text.match(pat);
      if (match) {
        let val = match[1].trim();
        val = val.split(/\s+(?:and|batch|lot|quantity|reported|strength|\d+mg|\d+g)\b/i)[0].trim();
        if (val.length > 2) {
          extracted.product_name = titleCase(val);
          break;
        }
      }
    }
  }

  // Extract embedded strength from product name if empty
  if (extracted.product_name && !extracted.product_strength) {
    const strInProd = extracted.product_name.match(/(\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml|%|ip\/bp|usp|iu|mg\/ml))/i);
    if (strInProd) {
      extracted.product_strength = strInProd[1].toUpperCase();
      extracted.product_name = extracted.product_name.replace(/\s*\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml|%|ip\/bp|usp|iu|mg\/ml)/gi, '').trim();
    }
  }

  // 4. PRODUCT STRENGTH
  if (!extracted.product_strength || isEdit) {
    const strMatch = text.match(/(\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml|%|ip\/bp|usp|iu|mg\/ml)|(?:IP\s*\/?\s*BP|USP|EP)\s*(?:Grade)?)/i);
    if (strMatch) extracted.product_strength = strMatch[1].trim().toUpperCase();
  }

  // 5. BATCH NUMBER
  if (!extracted.batch_number || isEdit) {
    const batchPatterns = [
      /(?:batch|lot)(?:\s*number|\s*no|\s*#)?\s*(?:is|to|:|=|\s)\s*([A-Z0-9\-]{3,20})/i,
      /\b([A-Z]{2,4}\d{4,8}[A-Z0-9]?)\b/i,
      /\b(LOT-?[A-Z0-9]{4,12})\b/i
    ];
    for (const pat of batchPatterns) {
      const match = text.match(pat);
      if (match) {
        let bval = match[1].trim().toUpperCase();
        bval = bval.split(/\s+(?:and|quantity|mfg|exp|date)\b/i)[0].trim();
        if (!['TABLETS', 'CAPSULES', 'INJECTION', 'SYRUP', 'COMPLAINT'].includes(bval)) {
          extracted.batch_number = bval;
          break;
        }
      }
    }
  }

  // 6. QUANTITY AFFECTED
  if (!extracted.quantity_affected || isEdit) {
    const qtyPatterns = [
      /(?:quantity\s*affected|quantity|qty|amount)\s*(?:is|to|:|=)?\s*(\d+\s*[a-zA-Z\s()]+)/i,
      /(\d+\s*(?:capsules|tablets|vials|bottles|kg|drums|units|boxes|packs|pcs|pieces|strips|blisters|ampoules)(?:\s*\([^)]+\))?)/i
    ];
    for (const pat of qtyPatterns) {
      const match = text.match(pat);
      if (match) {
        let qval = match[1].trim();
        qval = qval.split(/\n|\r|\b(?:Complaint|Detailed|Batch)\b/i)[0].trim();
        extracted.quantity_affected = qval;
        break;
      }
    }
  }

  // 7. MANUFACTURING DATE
  if (!extracted.mfg_date || isEdit) {
    const mfgMatch = text.match(/(?:mfg|mfd|manufactur(?:ed|ing|e)?)(?:\s*date|\s*dt)?\s*(?:is|to|:|=|on|in|of|from|was)?\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}[-/]\d{4}|\d{4}[-/]\d{1,2}|[A-Za-z]+\s+\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
    if (mfgMatch) extracted.mfg_date = formatDateStr(mfgMatch[1]);
  }

  // 8. EXPIRY DATE
  if (!extracted.expiry_date || isEdit) {
    const expMatch = text.match(/(?:expir(?:y|e|ing|es)?|exp)(?:\s*date|\s*dt)?\s*(?:is|to|:|=|on|in|of|from|was)?\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}[-/]\d{4}|\d{4}[-/]\d{1,2}|[A-Za-z]+\s+\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
    if (expMatch) extracted.expiry_date = formatDateStr(expMatch[1]);
  }

  // Risk Assessment Rules Engine
  const riskAssessment = {
    initial_severity: "Major",
    priority: "High",
    suggested_next_action: "Route to QA investigation & issue replacement",
    risk_reasoning: "Product quality anomaly reported. Technical investigation required.",
    capa_recommendation: "Quarantine affected lot, initiate retention sample analysis.",
    health_hazard_level: "Moderate",
    precautions: "STANDARD QMS PRECAUTION: Place batch on temporary quarantine hold pending QA physical inspection."
  };

  if (anyMatch(textLower, ["discolor", "color", "colour", "appearance", "black spot", "yellowing", "spot"])) {
    extracted.complaint_type = "Discoloration / Appearance";
    riskAssessment.initial_severity = "Major";
    riskAssessment.priority = "High";
    riskAssessment.suggested_next_action = "Route to QA investigation & issue product replacement";
    riskAssessment.risk_reasoning = "Visual anomaly reported. Requires degradation and stability testing.";
    riskAssessment.capa_recommendation = "Initiate retention sample inspection, review packaging environment logs.";
    riskAssessment.precautions = "STORAGE & STABILITY CAUTION: Segregate affected lot into quarantine zone. Store samples in light-protected, moisture-barrier containers at 15-25°C. Inspect retention samples immediately.";
  } else if (anyMatch(textLower, ["particulate", "foreign", "impurity", "contamination", "glass", "hair", "metal", "inclusion", "dark spot"])) {
    extracted.complaint_type = "Foreign Matter / Contamination";
    riskAssessment.initial_severity = "Critical";
    riskAssessment.priority = "High";
    riskAssessment.suggested_next_action = "Immediate QA Quarantine, Batch Retention Audit & Health Hazard Evaluation";
    riskAssessment.risk_reasoning = "Extraneous material poses direct patient health and safety risk.";
    riskAssessment.capa_recommendation = "Quarantine batch inventory across supply chain, audit filtration lines.";
    riskAssessment.precautions = "IMMEDIATE BATCH QUARANTINE: Halt distribution immediately. Issue stock hold across warehouses. Isolate lot under lock-and-key. Instruct healthcare providers to halt administration.";
  } else if (anyMatch(textLower, ["broken", "seal", "leak", "packaging", "damaged", "cracked", "crushed", "moisture"])) {
    extracted.complaint_type = "Packaging / Seal Integrity";
    riskAssessment.initial_severity = "Minor";
    riskAssessment.priority = "Medium";
    riskAssessment.suggested_next_action = "Inspect packaging line seals & issue replacement credit";
    riskAssessment.risk_reasoning = "Container closure integrity compromise may lead to moisture ingress.";
    riskAssessment.capa_recommendation = "Calibrate blister/bottle sealing machinery and perform leak test on retention samples.";
    riskAssessment.precautions = "HANDLING & LEAKAGE CONTROL: Inspect shipper boxes for moisture or puncturing. Wear protective nitrile gloves if liquid leakage is suspected. Segregate damaged units.";
  } else if (anyMatch(textLower, ["potency", "efficacy", "dissolution", "assay", "out of spec", "oos", "substandard"])) {
    extracted.complaint_type = "Efficacy / Out of Specification";
    riskAssessment.initial_severity = "Critical";
    riskAssessment.priority = "High";
    riskAssessment.suggested_next_action = "Initiate OOS Technical Investigation & Notify Regulatory Affairs";
    riskAssessment.risk_reasoning = "Sub-potent or OOS active drug substance threatens therapeutic efficacy.";
    riskAssessment.capa_recommendation = "Re-analyze control samples, review batch manufacturing record (BMR) parameters.";
    riskAssessment.precautions = "REGULATORY STOCK HOLD: Freeze batch dispatch immediately. Quarantine raw materials & in-process samples. Initiate OOS protocol prior to sample handling.";
  } else if (anyMatch(textLower, ["label", "print", "mislabel", "barcode", "bar code", "typo"])) {
    extracted.complaint_type = "Labeling / Printing Error";
    riskAssessment.initial_severity = "Minor";
    riskAssessment.priority = "Medium";
    riskAssessment.suggested_next_action = "Review artwork approvals and line clearance logs";
    riskAssessment.risk_reasoning = "Labeling error may cause misidentification or dosage confusion.";
    riskAssessment.capa_recommendation = "Enforce optical vision inspection system on labeling line.";
    riskAssessment.precautions = "DISPENSING CONTROL: Pause dispensing of affected lot to prevent dosage/administration confusion. Flag inventory in ERP with 'Under QA Inspection' status.";
  } else if (anyMatch(textLower, ["shortage", "missing", "empty", "underfill", "quantity"])) {
    extracted.complaint_type = "Quantity / Shortage Defect";
    riskAssessment.initial_severity = "Minor";
    riskAssessment.priority = "Low";
    riskAssessment.suggested_next_action = "Verify check-weigher calibration logs";
    riskAssessment.risk_reasoning = "Underfill or missing unit count in secondary packaging.";
    riskAssessment.capa_recommendation = "Re-calibrate inline check-weighers and conduct line balance check.";
    riskAssessment.precautions = "INVENTORY AUDIT CAUTION: Hold remaining cases for check-weigher verification. Verify gross pack weight before releasing to distribution.";
  } else if (!extracted.complaint_type) {
    extracted.complaint_type = "Quality Issue / General Defect";
  }

  extracted.initial_severity = riskAssessment.initial_severity;
  extracted.priority = riskAssessment.priority;

  // Compute Completeness
  const reqFields = [
    ["customer_name", "Customer Name"],
    ["product_name", "Product Name"],
    ["product_strength", "Product Strength/Grade"],
    ["batch_number", "Batch/Lot Number"],
    ["quantity_affected", "Quantity Affected"],
    ["complaint_type", "Complaint Type"],
    ["description", "Detailed Description"]
  ];
  const missingFields = [];
  let filledCount = 0;
  reqFields.forEach(([key, label]) => {
    const val = extracted[key];
    if (val && String(val).trim() && String(val).trim() !== "Awaiting AI extraction...") {
      filledCount++;
    } else {
      missingFields.push(label);
    }
  });

  const score = Math.round((filledCount / reqFields.length) * 100);

  const replyText = isEdit
    ? "Updated complaint details based on your instructions. Modified fields have been reflected in the form."
    : `Logged complaint details successfully. Product: ${extracted.product_name || 'N/A'}, Batch: ${extracted.batch_number || 'N/A'}. The form on the left has been auto-populated.`;

  return {
    reply: replyText,
    extracted_form: extracted,
    risk_assessment: riskAssessment,
    completeness: {
      score,
      missing_fields: missingFields,
      is_complete: score >= 85
    },
    duplicate_found: false,
    duplicate_info: null,
    action_taken: actionTaken
  };
}

function anyMatch(text, keywords) {
  return keywords.some(k => text.includes(k));
}

function titleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
