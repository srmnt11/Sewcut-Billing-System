from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
from reportlab.platypus import Image as RLImage
import os

# ---------- font helpers ----------
_FONT_REGISTERED = False
_FONT_FAMILY = 'Helvetica'
_FONT_BOLD = 'Helvetica-Bold'
PESO = 'PHP '

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

def _register_font():
    global _FONT_REGISTERED, _FONT_FAMILY, _FONT_BOLD, PESO
    if _FONT_REGISTERED:
        return
    _FONT_REGISTERED = True
    candidates = [
        (os.path.join(os.environ.get('WINDIR', r'C:\Windows'), 'Fonts', 'arial.ttf'),
         os.path.join(os.environ.get('WINDIR', r'C:\Windows'), 'Fonts', 'arialbd.ttf')),
        ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
         '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'),
    ]
    for regular, bold in candidates:
        if os.path.exists(regular):
            try:
                pdfmetrics.registerFont(TTFont('SewcutFont', regular))
                _FONT_FAMILY = 'SewcutFont'
                PESO = '\u20b1'
                if os.path.exists(bold):
                    pdfmetrics.registerFont(TTFont('SewcutFont-Bold', bold))
                    _FONT_BOLD = 'SewcutFont-Bold'
                else:
                    _FONT_BOLD = 'SewcutFont'
                break
            except Exception:
                pass


# ---------- colour palette ----------
BRAND_DARK  = colors.HexColor('#0f172a')
BRAND_AMBER = colors.HexColor('#f59e0b')
HEADER_BG   = colors.HexColor('#0f172a')
ROW_ALT     = colors.HexColor('#f8fafc')
BORDER_CLR  = colors.HexColor('#e2e8f0')
TEXT_MUTED   = colors.HexColor('#64748b')
TEXT_NORMAL  = colors.HexColor('#334155')


def generate_quotation_pdf(quotation):
    """Generate a polished, professional PDF quotation."""
    _register_font()

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        topMargin=0.5 * inch, bottomMargin=0.6 * inch,
        leftMargin=0.6 * inch, rightMargin=0.6 * inch,
    )
    elements = []
    styles = getSampleStyleSheet()
    W = letter[0] - 1.2 * inch

    def _s(name, size=10, clr=TEXT_NORMAL, bold=False, align=TA_LEFT, sa=4):
        return ParagraphStyle(name, parent=styles['Normal'], fontSize=size,
                              textColor=clr, spaceAfter=sa,
                              fontName=_FONT_BOLD if bold else _FONT_FAMILY,
                              alignment=align)

    st_label     = _s('L', 9, TEXT_MUTED, True, sa=2)
    st_value     = _s('V', 10, BRAND_DARK, sa=6)
    st_normal    = _s('N', 10, TEXT_NORMAL, sa=4)
    st_th        = _s('TH', 9, colors.white, True)
    st_td        = _s('TD', 9, TEXT_NORMAL)
    st_tdr       = _s('TDR', 9, TEXT_NORMAL, align=TA_RIGHT)
    st_tot_l     = _s('TL', 10, TEXT_NORMAL, True, TA_RIGHT)
    st_tot_v     = _s('TV', 10, BRAND_DARK, align=TA_RIGHT)
    st_grand_l   = _s('GL', 13, BRAND_DARK, True, TA_RIGHT)
    st_grand_v   = _s('GV', 13, BRAND_DARK, True, TA_RIGHT)
    st_section   = _s('SEC', 11, BRAND_DARK, True, sa=8)
    st_footer    = _s('FT', 8, TEXT_MUTED, align=TA_CENTER, sa=2)
    st_footer_red = _s('FTR', 8, colors.HexColor('#dc2626'), align=TA_CENTER, sa=2)
    st_sub       = _s('SUB', 10, TEXT_MUTED, sa=16)
    st_terms     = _s('TRM', 9, TEXT_NORMAL, sa=4)
    st_th_right = _s('THR', 9, colors.white, True, align=TA_RIGHT)

    # ==== COVER LETTER PAGE (if letter fields are filled) ====
    has_cover = bool(getattr(quotation, 'cover_letter_recipient', '') or
                     getattr(quotation, 'cover_letter_body', ''))
    if has_cover:
        q_date_str = quotation.quotation_date.strftime('%B %d, %Y') if quotation.quotation_date else datetime.now().strftime('%B %d, %Y')

        # Letter header
# Letter header with logo
        cover_logo = _get_logo_image(width=0.55*inch, height=0.55*inch)

        cover_company_col = Table([
            [Paragraph('<b>SEW-CUT WEARING APPAREL MANUFACTURING</b>',
                       _s('LH1', 11, BRAND_DARK, True, sa=2))],
            [Paragraph('# 13 Delaware St. Phase 2, Greenland Newtown Subd., Brgy. Banaba, San Mateo, Rizal 1850',
                       _s('LH1a', 8, TEXT_MUTED, sa=1))],
            [Paragraph('Mobile: 0927-9183718 / 0917-1171998',
                       _s('LH1b', 8, TEXT_MUTED, sa=1))],
            [Paragraph('E-mail: sewcut.garmentsmanufacturing@gmail.com',
                       _s('LH1c', 8, TEXT_MUTED, sa=1))],
        ], colWidths=[W * 0.55])
        cover_company_col.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))

        cover_date_col = Table([
            [Paragraph(q_date_str, _s('LH2', 10, TEXT_NORMAL, align=TA_RIGHT, sa=0))],
        ], colWidths=[W * 0.35])
        cover_date_col.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))

        if cover_logo:
            cover_logo_col = Table([[cover_logo]], colWidths=[W * 0.1])
            cover_logo_col.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))
            lh = Table(
                [[cover_logo_col, cover_company_col, cover_date_col]],
                colWidths=[W * 0.1, W * 0.55, W * 0.35]
            )
        else:
            lh = Table(
                [[cover_company_col, cover_date_col]],
                colWidths=[W * 0.65, W * 0.35]
            )

        lh.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (0, -1), 0),
            ('RIGHTPADDING', (-1, 0), (-1, -1), 0),
        ]))
        elements.append(lh)
        elements.append(Spacer(1, 0.08 * inch))
        elements.append(HRFlowable(width='100%', thickness=2, color=BRAND_AMBER, spaceAfter=20))

        # Recipient block
        recipient_name = getattr(quotation, 'cover_letter_recipient', '') or ''
        recipient_title = getattr(quotation, 'cover_letter_recipient_title', '') or ''
        recipient_company = getattr(quotation, 'cover_letter_company', '') or quotation.company_name or ''
        recipient_address = getattr(quotation, 'cover_letter_address', '') or ''

        if recipient_name:
            elements.append(Paragraph(f'<b>{recipient_name}</b>', _s('RN', 11, BRAND_DARK, True, sa=2)))
        if recipient_title:
            elements.append(Paragraph(recipient_title, _s('RT', 10, TEXT_NORMAL, sa=2)))
        if recipient_company:
            elements.append(Paragraph(recipient_company, _s('RC', 10, TEXT_NORMAL, sa=2)))
        if recipient_address:
            for addr_line in recipient_address.split('\n'):
                elements.append(Paragraph(addr_line.strip(), _s('RA', 10, TEXT_NORMAL, sa=1)))

        elements.append(Spacer(1, 0.3 * inch))

        # Salutation
        dear_name = recipient_name.split()[0] if recipient_name else 'Sir/Madam'
        elements.append(Paragraph(f'Dear {dear_name},', _s('SAL', 11, BRAND_DARK, sa=12)))

        # Body
        letter_body = getattr(quotation, 'cover_letter_body', '') or ''
        if letter_body:
            for para in letter_body.split('\n'):
                if para.strip():
                    elements.append(Paragraph(para.strip(), _s('LB', 10, TEXT_NORMAL, sa=8)))
        else:
            elements.append(Paragraph(
                'As requested, I am pleased to enclose our quotation for the below goods. '
                'Should you have any questions or require further information, please do not hesitate to contact us.',
                _s('LB', 10, TEXT_NORMAL, sa=8)))

        elements.append(Spacer(1, 0.1 * inch))

        # Sign-off
        elements.append(Paragraph('Thank you for your time and consideration.', _s('SO1', 10, TEXT_NORMAL, sa=20)))
        elements.append(Paragraph('Sincerely,', _s('SO2', 10, TEXT_NORMAL, sa=24)))
        elements.append(Paragraph('<b>Josallyn J. Sarmiento</b>', _s('SIG1', 11, BRAND_DARK, True, sa=2)))
        elements.append(Paragraph('Operations Manager', _s('SIG2', 10, TEXT_MUTED, sa=2)))
        elements.append(Paragraph('Sew-Cut Wearing Apparel Manufacturing', _s('SIG3', 10, TEXT_MUTED, sa=2)))

        # Page break before pricing page
        elements.append(PageBreak())

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
    doc_type_label = 'QUOTATION'   # 👈 change to 'QUOTATION' or 'DELIVERY RECEIPT' per file

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

    # ==== META + QUOTE TO ====
    q_date = quotation.quotation_date.strftime('%B %d, %Y') if quotation.quotation_date else datetime.now().strftime('%B %d, %Y')
    valid_until = quotation.valid_until.strftime('%B %d, %Y') if quotation.valid_until else 'N/A'

    left = Table([
        [Paragraph('QUOTATION DETAILS', st_label)],
        [Paragraph(f'<b>Number:</b>  {quotation.quotation_number}', st_value)],
        [Paragraph(f'<b>Date:</b>  {q_date}', st_value)],
        [Paragraph(f'<b>Valid Until:</b>  {valid_until}', st_value)],
    ], colWidths=[W * 0.45])
    right = Table([
        [Paragraph('QUOTE TO', st_label)],
        [Paragraph(f'<b>{quotation.company_name}</b>', st_value)],
    ], colWidths=[W * 0.45])
    meta = Table([[left, right]], colWidths=[W * 0.5, W * 0.5])
    meta.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    elements.append(meta)
    elements.append(Spacer(1, 0.35 * inch))

    # ==== LINE ITEMS ====
    cw = [W * 0.44, W * 0.12, W * 0.22, W * 0.22]
    rows = [[Paragraph('DESCRIPTION', st_th), Paragraph('QTY', st_th),
             Paragraph('UNIT PRICE', st_th_right), Paragraph('TOTAL', st_th_right)]]
    for item in quotation.items.all():
        qty_val = float(item.quantity)
        qty_str = str(int(qty_val)) if qty_val == int(qty_val) else f'{qty_val:g}'
        rows.append([
            Paragraph(str(item.description), st_td),
            Paragraph(qty_str, st_td),
            Paragraph(f'{PESO}{float(item.unit_price):,.2f}', st_tdr),
            Paragraph(f'{PESO}{float(item.total):,.2f}', st_tdr),
        ])
    it = Table(rows, colWidths=cw, repeatRows=1)
    sty = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
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
            sty.append(('BACKGROUND', (0, i), (-1, i), ROW_ALT))
        sty.append(('LINEBELOW', (0, i), (-1, i), 0.5, BORDER_CLR))
    it.setStyle(TableStyle(sty))
    elements.append(it)
    elements.append(Spacer(1, 0.25 * inch))

    # ==== TOTALS ====
    tc = [W * 0.56, W * 0.22, W * 0.22]
    totals = [
        ['', Paragraph('Subtotal', st_tot_l), Paragraph(f'{PESO}{float(quotation.subtotal):,.2f}', st_tot_v)],
    ]
    totals.append(['', Paragraph('Grand Total', st_grand_l), Paragraph(f'{PESO}{float(quotation.grand_total):,.2f}', st_grand_v)])
    tt = Table(totals, colWidths=tc)
    tt.setStyle(TableStyle([
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LINEABOVE', (1, -1), (-1, -1), 2, BRAND_AMBER),
        ('TOPPADDING', (1, -1), (-1, -1), 10),
    ]))
    elements.append(tt)

    # ==== NOTES ====
    if quotation.notes:
        elements.append(Spacer(1, 0.35 * inch))
        elements.append(Paragraph('NOTES', st_section))
        elements.append(Paragraph(quotation.notes, st_normal))

    # ==== TERMS & CONDITIONS ====
    st_terms_item = _s('TI', 9, TEXT_NORMAL, sa=3)
    elements.append(Spacer(1, 0.35 * inch))
    elements.append(HRFlowable(width='100%', thickness=0.5, color=BORDER_CLR, spaceBefore=4, spaceAfter=10))
    elements.append(Paragraph('TERMS:', _s('TH2', 9, TEXT_MUTED, True, sa=6)))
    elements.append(Paragraph('1. 50% Down Payment upon confirmation of order (through bank deposit)', st_terms_item))
    elements.append(Paragraph('2. 50% Full payment after 5 working days upon completion of orders (through bank deposit)', st_terms_item))
    elements.append(Spacer(1, 0.1 * inch))
    elements.append(Paragraph('<b>*Deposit all payments to:</b>', _s('DEP', 9, TEXT_NORMAL, sa=4)))
    deposit = Table([
        [Paragraph('<font color="#dc2626"><b>BDO Account Name:</b></font>', _s('BN', 9, TEXT_NORMAL, sa=2)),
         Paragraph('<b>SEW-CUT WEARING APPAREL MANUFACTURING</b>', _s('BV', 9, TEXT_NORMAL, sa=2))],
        [Paragraph('<b>Account Number:</b>', _s('AN', 9, TEXT_NORMAL, sa=2)),
         Paragraph('012258002502', _s('AV', 9, TEXT_NORMAL, sa=2))],
    ], colWidths=[W * 0.28, W * 0.72])
    deposit.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 2), ('BOTTOMPADDING', (0, 0), (-1, -1), 2)]))
    elements.append(deposit)

    # ==== FOOTER ====
    elements.append(Spacer(1, 0.3 * inch))
    elements.append(HRFlowable(width='100%', thickness=0.5, color=BORDER_CLR, spaceBefore=4, spaceAfter=12))
    elements.append(Paragraph(f'This quotation is valid until {valid_until}.', st_footer_red))
    elements.append(Paragraph('Sew-cut Wearing Apparel Manufacturing', st_footer))

    doc.build(elements)
    buffer.seek(0)
    return buffer
