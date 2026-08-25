import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

os.makedirs("sample_documents", exist_ok=True)

# 1. Create Sample PDF
pdf_path = os.path.join("sample_documents", "amoxicillin_discoloration_complaint.pdf")
doc = SimpleDocTemplate(pdf_path, pagesize=letter)
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    'DocTitle',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=18,
    textColor=colors.HexColor("#1e3a8a"),
    spaceAfter=12
)

normal = styles['Normal']

story = []
story.append(Paragraph("APOLLO PHARMACY NETWORK - QUALITY COMPLAINT REPORT", title_style))
story.append(Paragraph("<b>Date:</b> August 12, 2026", normal))
story.append(Paragraph("<b>Source:</b> Apollo Pharmacy Central Distribution Center", normal))
story.append(Paragraph("<b>Customer Name:</b> Apollo Pharmacy Ltd", normal))
story.append(Spacer(1, 10))

data = [
    ["Product Name", "Amoxicillin Capsules"],
    ["Product Strength", "500 mg"],
    ["Batch / Lot Number", "BMX24602"],
    ["Manufacturing Date", "2026-01-15"],
    ["Expiry Date", "2028-01-14"],
    ["Affected Quantity", "48 capsules"],
    ["Complaint Type", "Discoloration / Appearance Defect"]
]

t = Table(data, colWidths=[150, 300])
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#f1f5f9")),
    ('TEXTCOLOR', (0,0), (-1,-1), colors.black),
    ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
    ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
    ('PADDING', (0,0), (-1,-1), 6),
]))
story.append(t)
story.append(Spacer(1, 15))

story.append(Paragraph("<b>Detailed Complaint Description:</b>", styles['Heading3']))
story.append(Paragraph("Apollo Pharmacy reported discolored capsules in Amoxicillin capsules 500 mg (Batch BMX24602). Upon opening blister packs, 48 capsules exhibited yellowish-brown spots on outer gelatin shells. Store manager requested immediate QA investigation and stock replacement.", normal))

doc.build(story)
print(f"Created {pdf_path}")

# 2. Create Sample EML Email
eml_path = os.path.join("sample_documents", "metformin_api_impurity_email.eml")
eml_content = """From: quality@biohealthlabs.com
To: qms-complaints@aivoa-pharma.com
Subject: Customer Complaint: Foreign Particulate Impurity in Metformin Hydrochloride API
Date: Wed, 12 Aug 2026 14:00:00 +0000

Dear Quality Assurance Team,

This is to formally notify you regarding a quality complaint for our recent shipment.

Details:
- Customer Name: BioHealth Laboratories Inc
- Complaint Source: Email Notification
- Product Name: Metformin Hydrochloride API
- Grade / Strength: IP / BP Grade
- Batch / Lot Number: MFH260712A
- Manufacturing Date: 2026-06-10
- Expiry Date: 2029-06-09
- Affected Quantity: 50 kg (2 HDP drums)
- Complaint Type: Foreign Contamination / Impurity

Description:
During raw material receiving inspection at BioHealth Labs, dark particulate inclusions were observed inside 2 HDP drums of Metformin Hydrochloride API (Batch MFH260712A). Drums are currently quarantined. Please initiate QA investigation and issue CAPA.

Best regards,
Sarah Jenkins
Quality Assurance Manager
BioHealth Laboratories
"""

with open(eml_path, "w") as f:
    f.write(eml_content)
print(f"Created {eml_path}")
