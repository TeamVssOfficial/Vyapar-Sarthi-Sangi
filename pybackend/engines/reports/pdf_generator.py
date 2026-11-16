from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from pathlib import Path
from datetime import datetime


def generate_executive_pdf(
    output_path: Path,
    dataset_name: str,
    business_name: str,
    overview_data: dict,
    kpis_data: dict,
    quality_data: dict
) -> Path:
    """
    Builds an executive PDF report using ReportLab.
    """
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    primary_color = colors.HexColor("#14233D")
    accent_color = colors.HexColor("#E99A3A")
    text_dark = colors.HexColor("#0C1729")
    bg_light = colors.HexColor("#F7F6F2")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        textColor=primary_color,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=colors.HexColor("#748197"),
        spaceAfter=14
    )

    h2_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=text_dark,
        leading=13
    )

    story = []

    # Title & Header
    story.append(Paragraph(f"VYAPAR SARTHI SANGI (VSS AI)", title_style))
    story.append(Paragraph(f"Executive Intelligence & Analytics Report — {business_name}", subtitle_style))
    story.append(Spacer(1, 6))

    # Meta Table
    meta_table_data = [
        [
            Paragraph("<b>Target Dataset:</b>", body_style),
            Paragraph(dataset_name, body_style),
            Paragraph("<b>Generated Date:</b>", body_style),
            Paragraph(datetime.utcnow().strftime("%B %d, %Y"), body_style)
        ],
        [
            Paragraph("<b>Total Records:</b>", body_style),
            Paragraph(f"{overview_data.get('total_rows', 0):,} rows", body_style),
            Paragraph("<b>Total Features:</b>", body_style),
            Paragraph(f"{overview_data.get('total_columns', 0)} columns", body_style)
        ]
    ]
    t_meta = Table(meta_table_data, colWidths=[110, 160, 110, 160])
    t_meta.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg_light),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE")
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))

    # Section 1: Business Performance & KPIs
    story.append(Paragraph("1. Commercial KPIs & Performance Summary", h2_style))
    headline = kpis_data.get("headline_metrics", {})
    if headline:
        kpi_table_data = [
            ["Primary Metric", "Total Volume", "Transactions", "Avg Order Value (AOV)"],
            [
                headline.get("primary_metric_name", "Sales"),
                f"₹{headline.get('total_revenue', 0):,.2f}",
                f"{headline.get('total_transactions', 0):,}",
                f"₹{headline.get('average_order_value', 0):,.2f}"
            ]
        ]
        t_kpi = Table(kpi_table_data, colWidths=[135, 135, 135, 135])
        t_kpi.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), primary_color),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("PADDING", (0, 0), (-1, -1), 6),
            ("ALIGN", (1, 0), (-1, -1), "CENTER"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("BACKGROUND", (0, 1), (-1, 1), colors.white)
        ]))
        story.append(t_kpi)
    else:
        story.append(Paragraph("No business metrics were available for automatic KPI calculation.", body_style))

    story.append(Spacer(1, 14))

    # Section 2: Top Categories / Revenue Drivers
    cats = kpis_data.get("category_breakdown", [])
    if cats:
        story.append(Paragraph("2. Revenue Breakdown by Category", h2_style))
        cat_table_data = [["Category", "Total Revenue", "Transactions", "Share %"]]
        for c in cats[:6]:
            cat_table_data.append([
                c.get("category", "N/A"),
                f"₹{c.get('revenue', 0):,.2f}",
                f"{c.get('transactions', 0):,}",
                f"{c.get('share_pct', 0)}%"
            ])
        t_cat = Table(cat_table_data, colWidths=[180, 120, 120, 120])
        t_cat.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("PADDING", (0, 0), (-1, -1), 5),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, bg_light])
        ]))
        story.append(t_cat)
        story.append(Spacer(1, 14))

    # Section 3: Data Quality & Governance
    story.append(Paragraph("3. Data Quality & Health Score", h2_style))
    q_score = quality_data.get("quality_score", 100)
    q_rating = quality_data.get("quality_rating", "Good")
    story.append(Paragraph(
        f"<b>Overall Data Quality Rating:</b> {q_rating} (Score: <b>{q_score}/100</b>). "
        f"Total missing cells: {quality_data.get('missing_cells', 0):,} ({quality_data.get('missing_percentage', 0)}%). "
        f"Duplicate records: {quality_data.get('duplicate_rows', 0):,}.",
        body_style
    ))

    alerts = quality_data.get("alerts", [])
    if alerts:
        story.append(Spacer(1, 6))
        story.append(Paragraph("<b>Quality Alerts:</b>", body_style))
        for a in alerts[:4]:
            story.append(Paragraph(f"• [{a.get('severity', 'info').upper()}] {a.get('message')}", body_style))

    story.append(Spacer(1, 20))

    # Footer note
    story.append(Paragraph(
        "<i>CONFIDENTIAL & PROPRIETARY — Generated automatically by Vyapar Sarthi Sangi (VSS AI). "
        "Strict business data isolation maintained.</i>",
        subtitle_style
    ))

    doc.build(story)
    return output_path
