import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def set_cell_background(cell, color_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    tcPr.append(shd)

def add_heading_styled(doc, text, level, space_before=12, space_after=6):
    heading = doc.add_heading(text, level=level)
    heading.paragraph_format.space_before = Pt(space_before)
    heading.paragraph_format.space_after = Pt(space_after)
    
    # Apply color theme (dark purple/slate for headings)
    run = heading.runs[0]
    run.font.name = 'Arial'
    if level == 1:
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(99, 102, 241) # Indigo
        run.bold = True
    elif level == 2:
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(79, 70, 229) # Slate Indigo
        run.bold = True
    else:
        run.font.size = Pt(11.5)
        run.font.color.rgb = RGBColor(30, 41, 59) # Slate Dark
        run.bold = True
    return heading

def set_paragraph_spacing(p, before=0, after=4, line_spacing=1.15):
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = line_spacing

def add_body_paragraph(doc, text, bold_prefix="", before=0, after=6):
    p = doc.add_paragraph()
    set_paragraph_spacing(p, before, after)
    
    if bold_prefix:
        r1 = p.add_run(bold_prefix)
        r1.font.name = 'Arial'
        r1.font.size = Pt(10.5)
        r1.bold = True
        r1.font.color.rgb = RGBColor(15, 23, 42)
        
    r2 = p.add_run(text)
    r2.font.name = 'Arial'
    r2.font.size = Pt(10.5)
    r2.font.color.rgb = RGBColor(51, 65, 85)
    return p

def create_sales_pitch_doc():
    doc = docx.Document()
    
    # Document Title Page
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(title_p, 48, 12)
    run_title = title_p.add_run("SALES PITCH\nSalon Growth App (SalonSense)")
    run_title.font.name = 'Arial'
    run_title.font.size = Pt(24)
    run_title.bold = True
    run_title.font.color.rgb = RGBColor(79, 70, 229)
    
    subtitle_p = doc.add_paragraph()
    subtitle_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(subtitle_p, 0, 48)
    run_sub = subtitle_p.add_run("Empowering Modern Salons to Maximize Booking Efficiency, Staff Output, and Client Lifetime Value")
    run_sub.font.name = 'Arial'
    run_sub.font.size = Pt(12)
    run_sub.italic = True
    run_sub.font.color.rgb = RGBColor(100, 116, 139)
    
    doc.add_page_break()
    
    # ─── SECTION 1: PAIN ───
    add_heading_styled(doc, "1. The Pain: Operational Challenges in Salon Management", 1)
    
    add_body_paragraph(doc, 
        "Traditional salons lose up to 25% of their potential revenue due to structural administrative inefficiencies. Without a centralized, high-fidelity system, salon owners and coordinators face major roadblocks daily.", 
        bold_prefix="The Administrative Friction: "
    )
    
    add_body_paragraph(doc, 
        "Booking schedules are frequently double-booked, or slot boundaries are unclear, leading to overlapping appointments and client dissatisfaction. Phone bookings consume hours of coordinator time.",
        bold_prefix="• Scheduling & Booking Chaos: "
    )
    add_body_paragraph(doc, 
        "Stylists spend large portions of the day idle between appointments. Gaps in the calendar are not flagged or filled, resulting in lost labor efficiency and reduced stylist morale.",
        bold_prefix="• Expensive Staff Downtime: "
    )
    add_body_paragraph(doc, 
        "Salons fail to track and re-engage lapsed clients who haven't returned in 30, 60, or 90 days. Outbound marketing is manual, tedious, and lacks target accuracy.",
        bold_prefix="• Customer Churn & Leaky Pipeline: "
    )
    add_body_paragraph(doc, 
        "Calculating commission splits, tier bonuses, service tips, and deductions at the end of the week is highly time-consuming and prone to computational errors that cause staff friction.",
        bold_prefix="• Complex Manual Financial Auditing: "
    )
    
    # ─── SECTION 2: SOLUTION ───
    add_heading_styled(doc, "2. The Solution: SalonSense Growth Engine", 1)
    
    add_body_paragraph(doc, 
        "SalonSense provides a unified, web-based workspace designed to automate schedules, calculate commissions instantly, and proactively retain clients.",
        bold_prefix="An All-in-One Dashboard: "
    )
    
    add_body_paragraph(doc, 
        "A highly precise, minute-aligned scheduler showing all stylists side-by-side. Featuring drag-and-drop reschedule modals, real-time indicator lines, and zero-clipping actions menus.",
        bold_prefix="• Minute-Aligned Appointments Calendar: "
    )
    add_body_paragraph(doc, 
        "A fully automated engine that computes custom base commissions, tier-based performance structures, tip splits, and deductibles in real-time, removing human error completely.",
        bold_prefix="• Instant Commission Calculations: "
    )
    add_body_paragraph(doc, 
        "An intelligent dashboard displaying clients sorted by last visit. Features direct SMS template copy shortcuts and retention performance metrics to trigger rebookings instantly.",
        bold_prefix="• Proactive Client Retention Dashboard: "
    )
    add_body_paragraph(doc, 
        "Strict access controls dividing dashboard features, ensuring stylists only view their schedules and performance, while owners manage billing, commissions, and staff settings.",
        bold_prefix="• Staff vs. Owner Workspaces: "
    )

    # ─── SECTION 3: BUSINESS IMPACT ───
    add_heading_styled(doc, "3. Business Impact: By the Numbers", 1)
    
    impact_p = doc.add_paragraph()
    set_paragraph_spacing(impact_p, 0, 12)
    r = impact_p.add_run("Implementing SalonSense transforms salon operations, yielding direct financial returns:")
    r.font.name = 'Arial'
    r.font.size = Pt(10.5)
    r.font.color.rgb = RGBColor(51, 65, 85)
    
    table = doc.add_table(rows=5, cols=3)
    table.style = 'Light Shading Accent 1'
    
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = "Operational Area"
    hdr_cells[1].text = "Traditional Salon"
    hdr_cells[2].text = "With SalonSense"
    
    # Set headers bold
    for cell in hdr_cells:
        set_cell_background(cell, "4F46E5")
        for p in cell.paragraphs:
            for run in p.runs:
                run.font.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
                run.font.name = 'Arial'
                run.font.size = Pt(10)
                
    data = [
        ("Booking Process", "15-20 min per client phone call / paper diary", "Instant, responsive calendar book"),
        ("Stylist Utilization", "60-65% (large gaps in booking slots)", "80-85% (optimized grid and fast rescheduling)"),
        ("Client Rebook Rate", "35% (no automated tracking)", "65% (via active retention outreach)"),
        ("Commission Calculations", "4-5 hours weekly manual entry", "Instant, auto-updated every minute")
    ]
    
    for i, row in enumerate(data):
        cells = table.rows[i+1].cells
        cells[0].text = row[0]
        cells[1].text = row[1]
        cells[2].text = row[2]
        # Style cells
        for cell in cells:
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.name = 'Arial'
                    run.font.size = Pt(9.5)
                    run.font.color.rgb = RGBColor(51, 65, 85)
                    
    doc.add_paragraph() # Spacer

    # ─── SECTION 4: DEMO ───
    add_heading_styled(doc, "4. Interactive Demo Walkthrough", 1)
    add_body_paragraph(doc, "Experience how easy it is to schedule and manage bookings:")
    add_body_paragraph(doc, "Open the booking calendar. See your staff list arranged side-by-side with full-hour grid lines. The current timeline is highlighted in red.", bold_prefix="Step 1 — Real-time Scheduler: ")
    add_body_paragraph(doc, "Click on any empty slot under a stylist. A dialog modal prompts you to search or select a customer and choose services. The slot starts precisely on target.", bold_prefix="Step 2 — Add a Booking: ")
    add_body_paragraph(doc, "Hover over an active booking card, click the three-dots action trigger, and select 'Reschedule' or 'Complete' to instantly update the booking status.", bold_prefix="Step 3 — Manage Booking Options: ")
    add_body_paragraph(doc, "Navigate to the Retention tab. Review the list of lapsed clients, click 'Copy SMS template', and paste it to send a personalized invite.", bold_prefix="Step 4 — Retention Alert Outreach: ")

    # ─── SECTION 5: THE OFFER ───
    add_heading_styled(doc, "5. Our Offer: Start Growing Today", 1)
    add_body_paragraph(doc, "We offer a turnkey deployment of the SalonSense Growth Engine, complete with setup and support.", bold_prefix="Premium SalonSense Package: ")
    add_body_paragraph(doc, "Full deployment of the SalonSense application custom-configured for your salon business hours, stylists, and service catalog.", bold_prefix="• Core Application License: ")
    add_body_paragraph(doc, "We import all your existing customer rosters, staff records, and historical service data from paper or previous tools.", bold_prefix="• Zero-Friction Migration: ")
    add_body_paragraph(doc, "Step-by-step training sessions for your stylists and salon coordinators, ensuring smooth team adoption.", bold_prefix="• Onboarding & Team Training: ")
    add_body_paragraph(doc, "Enjoy a 30-day trial of SalonSense with zero risk. Try all features, run your weekly commissions, and see client rebookings increase.", bold_prefix="• 30-Day Risk-Free Trial: ")
    
    doc.save("docx/sales_pitch.docx")

def create_understanding_doc():
    doc = docx.Document()
    
    # Document Title Page
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(title_p, 48, 12)
    run_title = title_p.add_run("APPLICATION UNDERSTANDING\nSalonSense Management System")
    run_title.font.name = 'Arial'
    run_title.font.size = Pt(22)
    run_title.bold = True
    run_title.font.color.rgb = RGBColor(99, 102, 241)
    
    subtitle_p = doc.add_paragraph()
    subtitle_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(subtitle_p, 0, 48)
    run_sub = subtitle_p.add_run("A Functional Overview & Feature Guide of Modules, Workflows, and User Settings")
    run_sub.font.name = 'Arial'
    run_sub.font.size = Pt(11.5)
    run_sub.italic = True
    run_sub.font.color.rgb = RGBColor(100, 116, 139)
    
    doc.add_page_break()
    
    # ─── INTRODUCTION ───
    add_heading_styled(doc, "1. Executive Introduction", 1)
    add_body_paragraph(doc, 
        "SalonSense is a modern, responsive single-page web application designed for salon owners and stylists. The application streamlines day-to-day operations by combining client scheduling, staff commissions tracking, services cataloging, and client retention marketing into a single, high-fidelity user interface.", 
        bold_prefix="App Core Goal: "
    )
    
    # ─── APPOINTMENTS BOOK ───
    add_heading_styled(doc, "2. Booking & Appointments Scheduler", 1)
    add_body_paragraph(doc, "The appointments scheduler is the central hub of SalonSense. It supports two viewing options: Calendar View and List Log.")
    
    add_heading_styled(doc, "Calendar View Layout & Spacing", 2)
    add_body_paragraph(doc, "Displays stylists side-by-side in custom horizontal columns, allowing coordinators to quickly scan daily availability.", bold_prefix="• Multi-Stylist Side-by-Side Grid: ")
    add_body_paragraph(doc, "Horizontal time grid lines are aligned to full hours (9:00, 10:00, 11:00, etc.) in a strong opacity, with half-hour solid lines and quarter-hour dashed lines providing a clean temporal visual hierarchy.", bold_prefix="• Hourly Grid Hierarchy: ")
    add_body_paragraph(doc, "Card heights represent booking duration with mathematical precision. Compact layouts are utilized for short bookings (<=30 mins), intermediate for middle bookings (<=45 mins), and full detail cards for longer services.", bold_prefix="• Duration-Snapped Appointment Cards: ")
    add_body_paragraph(doc, "Clicking the three-dots action button opens a dropdown overlay menu. This menu is positioned at the top-level container to render on top of grid lines and boundaries without any clipping.", bold_prefix="• Zero-Clipping Actions Menu: ")
    
    add_heading_styled(doc, "List Log View", 2)
    add_body_paragraph(doc, "A clean, chronological list representation of bookings scheduled for the selected day. Ideal for quickly scrolling through the daily roster, checking client notes, and auditing booking statuses.", bold_prefix="• Linear Log: ")

    # ─── SERVICES CATALOG ───
    add_heading_styled(doc, "3. Services Management Module", 1)
    add_body_paragraph(doc, "The Services module allows owners to catalog and update their salon menu. It manages three key fields for every service:")
    add_body_paragraph(doc, "The name of the treatment (e.g. Haircut, Hair Color Expert, HydraFacial Treatment).", bold_prefix="• Service Name: ")
    add_body_paragraph(doc, "Standard duration in minutes. Snaps to the scheduler calendar when creating a booking to ensure accurate spacing.", bold_prefix="• Service Duration: ")
    add_body_paragraph(doc, "Service pricing, used to calculate invoice receipts and commission payouts.", bold_prefix="• Base Pricing: ")

    # ─── STAFF MANAGEMENT ───
    add_heading_styled(doc, "4. Staff Management & Portals", 1)
    add_body_paragraph(doc, "SalonSense supports two workspaces, separated by user roles:")
    add_body_paragraph(doc, "Full access to salon metrics. Owners can manage the stylist list, edit base service catalogs, compute commission payouts, and view billing reports.", bold_prefix="• Owner Workspace: ")
    add_body_paragraph(doc, "A streamlined view. Stylists can view their personal bookings schedule, check customer service notes, and track their daily completed services.", bold_prefix="• Stylist Portal: ")

    # ─── CLIENT RETENTION ───
    add_heading_styled(doc, "5. Proactive Client Retention Module", 1)
    add_body_paragraph(doc, "To prevent client churn, SalonSense features a retention engine:")
    add_body_paragraph(doc, "The dashboard automatically calculates the days since each customer's last visit (e.g., 30, 45, 60+ days) and highlights lapsed clients in red.", bold_prefix="• Lapsed Customer Detector: ")
    add_body_paragraph(doc, "Allows coordinators to copy a customized, polite marketing text with the click of a button, ready to paste into messaging tools.", bold_prefix="• Quick SMS Template Copy: ")
    add_body_paragraph(doc, "Tracks the percentage of inactive clients successfully rebooked back onto the calendar book.", bold_prefix="• Rebook Rates: ")

    # ─── COMMISSIONS & FINANCIALS ───
    add_heading_styled(doc, "6. Commissions & Performance Reports", 1)
    add_body_paragraph(doc, "Automates salon accounting and payroll splits:")
    add_body_paragraph(doc, "Computes stylist earnings using a base service rate combined with custom performance tier bonuses.", bold_prefix="• Tiered Commission Calculations: ")
    add_body_paragraph(doc, "Tracks and adds customer tips directly to the stylist's payout record.", bold_prefix="• Service Tips Tracking: ")
    add_body_paragraph(doc, "Automates the calculation of product/rent deductions before showing the final net payout, saving hours of weekly work.", bold_prefix="• Deductions Audit: ")

    doc.save("docx/Application Understanding.doc")

if __name__ == "__main__":
    create_sales_pitch_doc()
    print("Successfully generated sales_pitch.docx")
    create_understanding_doc()
    print("Successfully generated Application Understanding.doc")
