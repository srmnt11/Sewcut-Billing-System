from io import BytesIO
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.platypus import Image as RLImage
import os

BRAND_DARK = colors.HexColor('#0f172a')
BRAND_AMBER = colors.HexColor('#f59e0b')
HEADER_BG = colors.HexColor('#0f172a')
ROW_ALT = colors.HexColor('#f8fafc')
BORDER_CLR = colors.HexColor('#e2e8f0')
TEXT_MUTED = colors.HexColor('#64748b')
TEXT_NORMAL = colors.HexColor('#334155')

def _get_logo_image(width=0.65*inch, height=0.65*inch):
    """Return an RLImage of the Sewcut logo, or None if not found."""
    # Put your logo file in your Django project's root or a known static path
    candidates = [
        os.path.join(os.path.dirname(__file__), 'sewcut_logo.png'),   # same folder as this .py file
        os.path.join(os.path.dirname(__file__), '..', 'static', 'images', 'sewcut_logo.png'),
        os.path.join(os.path.dirname(__file__), '..', 'media', 'sewcut_logo.png'),
    ]
    for path in candidates:
        if os.path.exists(os.path.abspath(path)):
            img = RLImage(os.path.abspath(path), width=width, height=height)
            img.hAlign = 'LEFT'
            return img
    return None

def generate_delivery_receipt_pdf(receipt):
    """Generate a polished delivery receipt PDF."""

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        topMargin=0.5 * inch,
        bottomMargin=0.6 * inch,
        leftMargin=0.6 * inch,
        rightMargin=0.6 * inch,
    )
    styles = getSampleStyleSheet()
    W = letter[0] - 1.2 * inch
    elements = []

    def _s(name, size=10, clr=TEXT_NORMAL, bold=False, align=TA_LEFT, sa=4):
        return ParagraphStyle(
            name,
            parent=styles['Normal'],
            fontName='Helvetica-Bold' if bold else 'Helvetica',
            fontSize=size,
            textColor=clr,
            alignment=align,
            spaceAfter=sa,
        )

    st_label = _s('LBL', 9, TEXT_MUTED, True, sa=2)
    st_value = _s('VAL', 10, BRAND_DARK, sa=6)
    st_normal = _s('NOR', 10, TEXT_NORMAL, sa=4)
    st_th = _s('TH', 9, colors.white, True)
    st_td = _s('TD', 9, TEXT_NORMAL)
    st_tdr = _s('TDR', 9, TEXT_NORMAL, align=TA_RIGHT)
    st_section = _s('SEC', 11, BRAND_DARK, True, sa=8)
    st_footer = _s('FT', 8, TEXT_MUTED, align=TA_CENTER, sa=2)
    st_sub = _s('SUB', 10, TEXT_MUTED, sa=16)

    # ==== HEADER with logo ====
    logo = _get_logo_image(width=0.65*inch, height=0.65*inch)

    company_info_col = Table([
        [Paragraph('<b>SEW-CUT WEARING APPAREL MANUFACTURING</b>',
                _s('H1', 12, BRAND_DARK, True, sa=2))],
        [Paragraph('# 13 Delaware St. Phase 2, Greenland Newtown Subd., Brgy. Banaba, San Mateo, Rizal 1850',
                _s('H1a', 8, TEXT_MUTED, sa=1))],
        [Paragraph('Mobile: 0927-9183718 / 0917-1171998',
                _s('H1b', 8, TEXT_MUTED, sa=1))],
        [Paragraph('E-mail: sewcut.garmentsmanufacturing@gmail.com',
                _s('H1c', 8, TEXT_MUTED, sa=1))],
    ], colWidths=[W * 0.6])
    company_info_col.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))

    # ---- right side: doc type label ----
    doc_type_label = 'DELIVERY'   # 👈 change to 'QUOTATION' or 'DELIVERY RECEIPT' per file

    right_col = Table([
        [Paragraph(doc_type_label,
                _s('H2', 20, BRAND_AMBER, True, TA_RIGHT, sa=0))],
    ], colWidths=[W * 0.3])
    right_col.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))

    # ---- assemble: [logo | company info | doc type] ----
    if logo:
        logo_col = Table([[logo]], colWidths=[W * 0.1])
        logo_col.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))
        ht = Table(
            [[logo_col, company_info_col, right_col]],
            colWidths=[W * 0.1, W * 0.6, W * 0.3]
        )
    else:
        # Fallback: no logo, keep text brand name
        ht = Table(
            [[company_info_col, right_col]],
            colWidths=[W * 0.7, W * 0.3]
        )

    ht.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (0, -1), 0),
        ('RIGHTPADDING', (-1, 0), (-1, -1), 0),
    ]))
    elements.append(ht)
    elements.append(Spacer(1, 0.1 * inch))
    elements.append(HRFlowable(width='100%', thickness=2, color=BRAND_AMBER, spaceAfter=16))

    delivery_date = receipt.delivery_date.strftime('%B %d, %Y') if receipt.delivery_date else datetime.now().strftime('%B %d, %Y')

    left = Table([
        [Paragraph('DELIVERY DETAILS', st_label)],
        [Paragraph(f'<b>Receipt No:</b>  {receipt.receipt_number}', st_value)],
        [Paragraph(f'<b>Date:</b>  {delivery_date}', st_value)],
        [Paragraph(f'<b>Status:</b>  {receipt.status}', st_value)],
        [Paragraph(f'<b>Reference:</b>  {receipt.reference_number or "-"}', st_value)],
    ], colWidths=[W * 0.45])

    right = Table([
        [Paragraph('DELIVER TO', st_label)],
        [Paragraph(f'<b>{receipt.client_name}</b>', st_value)],
        [Paragraph(receipt.address or '', st_normal)],
        [Paragraph(f'Attention: {receipt.contact_person or "-"}', st_normal)],
    ], colWidths=[W * 0.45])

    meta = Table([[left, right]], colWidths=[W * 0.5, W * 0.5])
    meta.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    elements.append(meta)
    elements.append(Spacer(1, 0.35 * inch))

    rows = [[
        Paragraph('DESCRIPTION', st_th),
        Paragraph('QTY', st_th),
        Paragraph('UNIT', st_th),
        Paragraph('REMARKS', st_th),
    ]]

    for item in receipt.items.all():
        rows.append([
            Paragraph(str(item.description), st_td),
            Paragraph(str(item.quantity), st_tdr),
            Paragraph(str(item.unit or '-'), st_td),
            Paragraph(str(item.remarks or '-'), st_td),
        ])

    table = Table(rows, colWidths=[W * 0.45, W * 0.1, W * 0.15, W * 0.3], repeatRows=1)
    styles_table = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('LINEBELOW', (0, -1), (-1, -1), 1, BORDER_CLR),
    ]
    for i in range(1, len(rows)):
        if i % 2 == 0:
            styles_table.append(('BACKGROUND', (0, i), (-1, i), ROW_ALT))
        styles_table.append(('LINEBELOW', (0, i), (-1, i), 0.5, BORDER_CLR))
    table.setStyle(TableStyle(styles_table))
    elements.append(table)

    if receipt.notes:
        elements.append(Spacer(1, 0.35 * inch))
        elements.append(Paragraph('NOTES', st_section))
        elements.append(Paragraph(receipt.notes, st_normal))

    elements.append(Spacer(1, 0.35 * inch))
    elements.append(HRFlowable(width='100%', thickness=0.5, color=BORDER_CLR, spaceBefore=4, spaceAfter=14))
    elements.append(Paragraph('Received in good order and condition.', st_footer))
    elements.append(Paragraph('Sewcut Wearing Apparel Manufacturing', st_footer))

    doc.build(elements)
    buffer.seek(0)
    return buffer
