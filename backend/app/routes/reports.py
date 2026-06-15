from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER
from app.database import get_db
from app.models import User, Transaction, FinancialSummary
from app.dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])

INDIGO = colors.HexColor('#6366F1')
DARK   = colors.HexColor('#0F172A')
MUTED  = colors.HexColor('#94A3B8')
GREEN  = colors.HexColor('#10B981')
RED    = colors.HexColor('#EF4444')
LIGHT  = colors.HexColor('#F1F5F9')

@router.get("/download")
def download_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txs = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    summary = db.query(FinancialSummary).filter(FinancialSummary.user_id == current_user.id).first()

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                             leftMargin=2*cm, rightMargin=2*cm,
                             topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    title_style   = ParagraphStyle('Title',   fontSize=22, textColor=INDIGO,  spaceAfter=4,  fontName='Helvetica-Bold', alignment=TA_CENTER)
    sub_style     = ParagraphStyle('Sub',     fontSize=11, textColor=MUTED,   spaceAfter=16, fontName='Helvetica',      alignment=TA_CENTER)
    heading_style = ParagraphStyle('Heading', fontSize=13, textColor=DARK,    spaceAfter=8,  fontName='Helvetica-Bold', spaceBefore=16)

    income = sum(t.amount for t in txs if t.transaction_type == 'credit')
    spend  = sum(t.amount for t in txs if t.transaction_type == 'debit')
    savings = income - spend
    savings_rate = round(savings / income * 100, 1) if income > 0 else 0
    anomalies = [t for t in txs if t.is_anomaly]
    categories = {}
    for t in txs:
        if t.category and t.transaction_type == 'debit':
            categories[t.category] = categories.get(t.category, 0) + t.amount
    top_cats = sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5]

    def inr(v):
        return f"\u20b9{v:,.0f}"

    story = []

    story.append(Paragraph("FinWise AI", title_style))
    story.append(Paragraph("Personal Financial Intelligence Report", sub_style))
    story.append(Paragraph(f"Generated for: {current_user.email}  |  Date: {datetime.now().strftime('%d %B %Y')}", sub_style))
    story.append(HRFlowable(width="100%", thickness=1, color=INDIGO, spaceAfter=16))

    story.append(Paragraph("Financial Summary", heading_style))
    summary_data = [
        ["Metric", "Amount"],
        ["Total Income", inr(income)],
        ["Total Spend", inr(spend)],
        ["Net Savings", inr(savings)],
        ["Savings Rate", f"{savings_rate}%"],
        ["Total Transactions", str(len(txs))],
        ["Anomalies Detected", str(len(anomalies))],
        ["Credit Score", str(summary.credit_score) if summary and summary.credit_score else "N/A"],
    ]
    t1 = Table(summary_data, colWidths=[10*cm, 6*cm])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), INDIGO),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT, colors.white]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
    ]))
    story.append(t1)

    if top_cats:
        story.append(Paragraph("Spend by Category", heading_style))
        cat_data = [["Category", "Amount", "% of Spend"]] + [
            [cat, inr(amt), f"{round(amt/spend*100,1)}%"] for cat, amt in top_cats
        ]
        t2 = Table(cat_data, colWidths=[8*cm, 5*cm, 3*cm])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), INDIGO),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT, colors.white]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ]))
        story.append(t2)

    if anomalies:
        story.append(Paragraph("Flagged Transactions", heading_style))
        anom_data = [["Date", "Description", "Amount", "Risk Score"]] + [
            [t.date, t.description[:40], inr(t.amount), f"{round((t.anomaly_score or 0)*100)}%"]
            for t in anomalies[:10]
        ]
        t3 = Table(anom_data, colWidths=[3*cm, 8*cm, 3*cm, 2.5*cm])
        t3.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), RED),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FEF2F2'), colors.white]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#FCA5A5')),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(t3)

    story.append(Spacer(1, 24))
    story.append(HRFlowable(width="100%", thickness=0.5, color=MUTED))
    story.append(Paragraph("Generated by FinWise AI · All amounts in Indian Rupees (INR) · For personal use only", sub_style))

    doc.build(story)
    buffer.seek(0)

    filename = f"finwise-report-{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
