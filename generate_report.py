import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return

        self.saveState()
        
        # Running Header
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor('#1E293B'))
        self.drawString(54, 750, "DRIVIX - AI-POWERED SMART PARKING ECOSYSTEM")
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor('#64748B'))
        self.drawRightString(558, 750, "Comprehensive Project Report")
        
        # Header line separator
        self.setStrokeColor(colors.HexColor('#E2E8F0'))
        self.setLineWidth(0.75)
        self.line(54, 742, 558, 742)
        
        # Running Footer
        self.setStrokeColor(colors.HexColor('#E2E8F0'))
        self.setLineWidth(0.75)
        self.line(54, 50, 558, 50)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor('#64748B'))
        self.drawString(54, 38, "Confidential - For Internal Review Only")
        
        # Page Numbering
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 38, page_text)
        
        self.restoreState()

def draw_cover_background(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor('#0F172A'))
    canvas.rect(0, 0, 612, 792, fill=True, stroke=False)
    
    # Modern accents (blue & green bars)
    canvas.setFillColor(colors.HexColor('#3B82F6'))
    canvas.rect(0, 776, 612, 16, fill=True, stroke=False)
    canvas.setFillColor(colors.HexColor('#10B981'))
    canvas.rect(0, 0, 612, 16, fill=True, stroke=False)
    
    # Subtle background grid for sci-fi look
    canvas.setStrokeColor(colors.HexColor('#1E293B'))
    canvas.setLineWidth(0.5)
    for i in range(60, 600, 60):
        canvas.line(i, 0, i, 792)
    for j in range(60, 780, 60):
        canvas.line(0, j, 612, j)
    
    canvas.restoreState()

def build_pdf(filename="Drivix_Project_Detailed_Report.pdf"):
    # Target page width = 612, height = 792 (Letter)
    # Margins: Left=54pt, Right=54pt, Top=72pt, Bottom=72pt
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    style_h1 = ParagraphStyle(
        name='SectionH1',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=18,
        spaceAfter=10,
        keepWithNext=True
    )
    
    style_h2 = ParagraphStyle(
        name='SectionH2',
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )
    
    style_body = ParagraphStyle(
        name='CustomBody',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        alignment=TA_LEFT,
        spaceAfter=10
    )
    
    style_body_justify = ParagraphStyle(
        name='CustomBodyJustify',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        alignment=TA_JUSTIFY,
        spaceAfter=10
    )

    style_bullet = ParagraphStyle(
        name='CustomBullet',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        leftIndent=20,
        firstLineIndent=-10,
        spaceAfter=6
    )
    
    style_callout = ParagraphStyle(
        name='CustomCallout',
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1E3A8A'),
        backColor=colors.HexColor('#EFF6FF'),
        borderColor=colors.HexColor('#3B82F6'),
        borderWidth=0.5,
        borderPadding=10,
        spaceAfter=12,
        borderRadius=4
    )

    style_code = ParagraphStyle(
        name='CustomCode',
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#1F2937'),
        backColor=colors.HexColor('#F3F4F6'),
        borderPadding=8,
        spaceAfter=10,
        borderRadius=2
    )

    story = []
    
    # ------------------ COVER PAGE ------------------
    story.append(Spacer(1, 130))
    story.append(Paragraph("DRIVIX", ParagraphStyle(
        name='CoverTitleBrand',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#3B82F6'),
        spaceAfter=8
    )))
    story.append(Paragraph("AI-POWERED SMART PARKING ECOSYSTEM", ParagraphStyle(
        name='CoverTitleTag',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        textColor=colors.HexColor('#10B981'),
        spaceAfter=25
    )))
    story.append(Paragraph("Comprehensive Project Report", ParagraphStyle(
        name='CoverMainTitle',
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=colors.HexColor('#FFFFFF'),
        spaceAfter=15
    )))
    story.append(Paragraph(
        "A deep dive into urban parking challenges, dynamic space allocation, "
        "and real-time machine learning pricing modeling for next-generation smart cities.",
        ParagraphStyle(
            name='CoverDesc',
            fontName='Helvetica',
            fontSize=11,
            leading=15,
            textColor=colors.HexColor('#94A3B8'),
            spaceAfter=40
        )
    ))
    story.append(Spacer(1, 120))
    
    meta_info = """
    <b>Document Type:</b> Systems Engineering &amp; AI Integration Blueprint<br/>
    <b>Author:</b> Antigravity AI Systems Design<br/>
    <b>Date:</b> August 24, 2026<br/>
    <b>Status:</b> Ready for Deployment (Production-Grade)<br/>
    <b>Target Audience:</b> Technical Advisory Board, Parking Lot Operators, Smart City Investors
    """
    story.append(Paragraph(meta_info, ParagraphStyle(
        name='CoverMetaText',
        fontName='Helvetica',
        fontSize=9.5,
        leading=14.5,
        textColor=colors.HexColor('#64748B')
    )))
    
    story.append(PageBreak())
    
    # ------------------ SECTION 1: EXECUTIVE SUMMARY ------------------
    story.append(Paragraph("1. Executive Summary", style_h1))
    story.append(Paragraph(
        "Modern urban environments face critical transportation challenges, key among which is parking availability. "
        "<b>Drivix</b> is a high-fidelity, end-to-end smart parking ecosystem designed to eliminate congestion, reduce carbon emissions, "
        "and optimize parking operations. It integrates real-time occupancy tracking, cross-platform client interfaces (web and mobile), "
        "an automated entry/exit simulator powered by Automatic Number Plate Recognition (ANPR), and a sophisticated, "
        "hybrid machine learning dynamic pricing engine. By transforming the parking experience into a digital-first solution, "
        "Drivix resolves the classic mismatch of parking supply and demand.",
        style_body_justify
    ))
    story.append(Paragraph(
        "This report details the project's vision, core problem statements, full architectural implementation, slot allocation algorithms, "
        "and explains the exact machine learning models (Random Forest / XGBoost / ONNX) driving the dynamic pricing system.",
        style_body
    ))
    
    # ------------------ SECTION 2: VISION & MISSION ------------------
    story.append(Paragraph("2. Vision &amp; Mission", style_h1))
    
    story.append(Paragraph("2.1 The Vision", style_h2))
    story.append(Paragraph(
        "To establish a seamless, congestion-free, digital-first parking infrastructure for the smart cities of tomorrow. "
        "We envision a world where drivers never waste time cruising for parking spaces, reducing urban gridlock, "
        "fuel waste, and vehicular carbon emissions, thereby creating a greener and more efficient urban ecosystem.",
        style_body_justify
    ))
    
    story.append(Paragraph("2.2 The Mission", style_h2))
    story.append(Paragraph(
        "To leverage state-of-the-art technologies—including real-time web sockets, atomic transactions, ANPR computer vision simulation, "
        "and regression-based explainable machine learning models—to connect drivers to guaranteed parking slots dynamically. "
        "Drivix empowers parking facility owners with tools to maximize space utilization and revenue, while ensuring drivers enjoy "
        "a stress-free booking and entry-to-exit flow.",
        style_body_justify
    ))
    
    # ------------------ SECTION 3: THE PARKING CRISIS (PROBLEM) ------------------
    story.append(Paragraph("3. The Problem Statement", style_h1))
    story.append(Paragraph(
        "Cruising for parking is a major, often overlooked contributor to urban congestion. Drivix addresses several distinct "
        "inefficiencies in traditional parking systems:",
        style_body_justify
    ))
    
    story.append(Paragraph(
        "• <b>Urban Congestion &amp; Cruising:</b> Studies show that drivers cruising for a parking space account for up to 30% of traffic in downtown urban areas. "
        "This results in millions of wasted hours and billions of dollars in lost productivity and fuel.",
        style_bullet
    ))
    story.append(Paragraph(
        "• <b>Environmental Toll:</b> The constant stop-and-go driving of vehicles searching for parking releases excessive greenhouse gases. "
        "Eliminating the search phase directly shrinks a city's transport carbon footprint.",
        style_bullet
    ))
    story.append(Paragraph(
        "• <b>Static and Inefficient Pricing:</b> Traditional parking structures charge flat, static rates regardless of time, weather, or occupancy. "
        "This leaves garages empty during off-peak times (losing potential revenue) and excessively congested during peak events (causing blockages).",
        style_bullet
    ))
    story.append(Paragraph(
        "• <b>Booking Race Conditions:</b> Without strict concurrency protection, two users heading towards the same slot can attempt "
        "to reserve it at the same moment, resulting in double bookings, operator errors, and frustrated customers.",
        style_bullet
    ))
    story.append(Paragraph(
        "• <b>Entry/Exit Bottlenecks:</b> Physical ticketing booths and manual card-swiping systems create lengthy queues at gate entrances and exits, "
        "spilling traffic onto public roadways.",
        style_bullet
    ))
    
    story.append(PageBreak())
    
    # ------------------ SECTION 4: THE DRIVIX SOLUTION ------------------
    story.append(Paragraph("4. The Drivix Solution (How It Works)", style_h1))
    story.append(Paragraph(
        "Drivix resolves these challenges through a unified smart system that tracks, locks, scores, and allocates parking slots dynamically:",
        style_body_justify
    ))
    
    story.append(Paragraph(
        "1. <b>Real-Time Visual Mapping:</b> A premium, glassmorphism-based web dashboard and a sci-fi radar-based mobile application (Expo + React Native) "
        "provide drivers with real-time occupancy updates. Users can view exact layouts, floors, and slot availability.",
        style_bullet
    ))
    story.append(Paragraph(
        "2. <b>Atomic Concurrency Protection:</b> Drivix implements a server-side <i>atomic soft-locking algorithm</i>. When a driver clicks "
        "a slot, the server attempts to acquire a 5-minute database hold using MongoDB's atomic <code>findOneAndUpdate</code>. "
        "If another request arrives a millisecond later, it is rejected, preventing race conditions.",
        style_bullet
    ))
    story.append(Paragraph(
        "3. <b>Reactive ANPR Gate Operations:</b> Cameras simulate Automatic Number Plate Recognition (ANPR) at gates. "
        "Upon vehicle arrival, the plate is scanned and validated against reservations. The gate opens automatically, and the system "
        "reactively assigns the optimal slot in real-time, eliminating physical tickets.",
        style_bullet
    ))
    story.append(Paragraph(
        "4. <b>Multi-Criteria Slot Allocation:</b> Slots are assigned via a configurable weighting system. The engine scores available slots "
        "based on: floor matching (30%), walking distance (25%), zone preferences (15%), vehicle compatibility (10%), EV charging availability (10%), "
        "accessibility (5%), and proximity to elevators/exits (5%).",
        style_bullet
    ))
    story.append(Paragraph(
        "5. <b>AI-Powered Hybrid Dynamic Pricing:</b> Integrates machine learning (Random Forest / XGBoost) to predict demand and adjust prices. "
        "To protect billing auditability, the AI outputs a 0-100 demand score, which is then mapped to deterministic surge/discount multipliers.",
        style_bullet
    ))
    
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "<b>Did You Know?</b> By running a serverless-friendly Focus-Aware Polling mechanism, the Drivix client automatically pauses "
        "network traffic when the user's tab goes to the background. This saves up to 80% in database reads and prevents API rate-limiting.",
        style_callout
    ))
    
    # ------------------ SECTION 5: TECHNICAL IMPLEMENTATION ------------------
    story.append(Paragraph("5. Technical Implementation &amp; Architecture", style_h1))
    story.append(Paragraph(
        "Drivix is built as a modular monorepo, decoupling interfaces from core business logic:",
        style_body_justify
    ))
    
    # Tech Stack Table
    tech_data = [
        [Paragraph("<b>Layer</b>", style_h2), Paragraph("<b>Technology Stack</b>", style_h2), Paragraph("<b>Key Responsibilities</b>", style_h2)],
        [
            Paragraph("<b>Frontend Web</b>", style_body),
            Paragraph("React, Vite, custom Vanilla CSS", style_body),
            Paragraph("High-fidelity dashboard, HUD slot visualizer, partner portal", style_body)
        ],
        [
            Paragraph("<b>Mobile App</b>", style_body),
            Paragraph("Expo, React Native", style_body),
            Paragraph("Sci-Fi Radar mapping, GPS-based tracking, digital boarding passes", style_body)
        ],
        [
            Paragraph("<b>Backend Server</b>", style_body),
            Paragraph("Node.js, Express.js, Socket.IO", style_body),
            Paragraph("Atomic slot locking, ANPR simulation, REST APIs, real-time broadcasts", style_body)
        ],
        [
            Paragraph("<b>Database</b>", style_body),
            Paragraph("MongoDB Atlas", style_body),
            Paragraph("Mongoose schemas, virtual populates, transaction records", style_body)
        ],
        [
            Paragraph("<b>Machine Learning</b>", style_body),
            Paragraph("Python, Scikit-Learn, ONNX Runtime", style_body),
            Paragraph("Regression training, feature scaling, high-speed inference execution", style_body)
        ]
    ]
    
    tech_table = Table(tech_data, colWidths=[100, 160, 244])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('BOTTOMPADDING', (0,1), (-1,-1), 6),
        ('TOPPADDING', (0,1), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(tech_table)
    
    story.append(PageBreak())
    
    # ------------------ SECTION 6: MACHINE LEARNING & DYNAMIC PRICING ------------------
    story.append(Paragraph("6. Machine Learning Subsystem &amp; Dynamic Pricing", style_h1))
    story.append(Paragraph(
        "Dynamic pricing is critical to balancing parking supply and demand. If prices are static, demand surges during events, "
        "leading to gridlock at the gates. During off-peak periods, facilities sit empty. Drivix implements a <b>predictive dynamic pricing pipeline</b>.",
        style_body_justify
    ))
    
    story.append(Paragraph("6.1 Features Fed into the ML Regressor", style_h2))
    story.append(Paragraph(
        "The machine learning models ingest multiple real-time context variables to forecast demand:",
        style_body_justify
    ))
    
    # Feature Schema Table
    feature_data = [
        [Paragraph("<b>Feature Name</b>", style_h2), Paragraph("<b>Type</b>", style_h2), Paragraph("<b>Range</b>", style_h2), Paragraph("<b>Significance</b>", style_h2)],
        [Paragraph("<code>occupancy_rate</code>", style_body), Paragraph("Float", style_body), Paragraph("0.0 - 1.0", style_body), Paragraph("Current occupancy ratio of the garage.", style_body)],
        [Paragraph("<code>hour</code>", style_body), Paragraph("Integer", style_body), Paragraph("0 - 23", style_body), Paragraph("Hour of day (surges during 9-12 and 17-20).", style_body)],
        [Paragraph("<code>day_of_week</code>", style_body), Paragraph("Integer", style_body), Paragraph("0 - 6", style_body), Paragraph("Day of the week (weekends push demand up).", style_body)],
        [Paragraph("<code>weather_code</code>", style_body), Paragraph("Integer", style_body), Paragraph("0 - 2", style_body), Paragraph("0: Clear, 1: Rainy, 2: Stormy (rain boosts indoor demand).", style_body)],
        [Paragraph("<code>is_holiday</code>", style_body), Paragraph("Binary", style_body), Paragraph("0 or 1", style_body), Paragraph("Flag indicating public holidays.", style_body)],
        [Paragraph("<code>nearby_event</code>", style_body), Paragraph("Binary", style_body), Paragraph("0 or 1", style_body), Paragraph("Flag for concerts/sports events in the area.", style_body)],
        [Paragraph("<code>base_price</code>", style_body), Paragraph("Float", style_body), Paragraph("40.0 - 100.0", style_body), Paragraph("Standard baseline rate of the garage.", style_body)]
    ]
    
    feature_table = Table(feature_data, colWidths=[110, 50, 80, 264])
    feature_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(feature_table)
    
    story.append(Spacer(1, 10))
    story.append(Paragraph("6.2 Machine Learning Model Selection", style_h2))
    story.append(Paragraph(
        "Drivix evaluates transaction datasets to train regression estimators. The pipeline supports two principal architectures:",
        style_body_justify
    ))
    story.append(Paragraph(
        "• <b>Random Forest Regressor:</b> Highly effective at handling non-linear interactions between variables (such as weather code, "
        "hour, and events). It trains an ensemble of decision trees, reducing overfitting and providing high stability.",
        style_bullet
    ))
    story.append(Paragraph(
        "• <b>XGBoost Regressor:</b> Used for maximum performance and gradient boosted decision tree execution. "
        "XGBoost minimizes loss functions iteratively to deliver rapid convergence and precision.",
        style_bullet
    ))
    
    story.append(Paragraph("6.3 The Hybrid AI &amp; Business Rules Pricing Engine", style_h2))
    story.append(Paragraph(
        "Instead of allowing a black-box ML model to output currency values directly (which risks pricing instability and "
        "legal/compliance issues), Drivix operates a <b>Hybrid AI &amp; Business Rules Engine</b>. The regressor predicts "
        "a normalized <b>Demand Score (0 to 100)</b>. Safe, deterministic business logic then applies the multiplier:",
        style_body_justify
    ))
    
    story.append(Paragraph(
        "• <b>Score &gt;= 85 (Critical Peak):</b> Surge Multiplier = <b>1.50x</b>. (Active during storms + events, or high congestion).<br/>"
        "• <b>Score &gt;= 70 (High Demand):</b> Surge Multiplier = <b>1.25x</b>. (Active during normal peak hours or weekends).<br/>"
        "• <b>Score &lt; 30 (Low Demand):</b> Discount Multiplier = <b>0.85x</b> (15% off). (Triggers late nights to encourage occupancy).<br/>"
        "• <b>Standard (30 - 69):</b> Base Multiplier = <b>1.00x</b>.",
        style_callout
    ))
    
    story.append(Paragraph("6.4 High-Speed Production Deployment Models", style_h2))
    story.append(Paragraph(
        "In production, Drivix offers two deployment choices depending on hosting constraints:",
        style_body_justify
    ))
    story.append(Paragraph(
        "1. <b>FastAPI Python Microservice:</b> The trained Random Forest model is serialized into a <code>.pkl</code> file using <code>joblib</code>. "
        "A lightweight Python FastAPI server hosts the endpoint, receiving JSON contexts from the Node backend and returning predictions.",
        style_bullet
    ))
    story.append(Paragraph(
        "2. <b>Native Node.js ONNX Execution:</b> The model is converted from Scikit-Learn to ONNX format (<code>pricing_model.onnx</code>). "
        "The Node.js backend uses <code>onnxruntime-node</code> to load the model directly and run tensor inference locally in sub-milliseconds, "
        "removing the need for a secondary Python server.",
        style_bullet
    ))
    
    story.append(PageBreak())
    
    # ------------------ SECTION 7: FLOWCHARTS & ALGORITHMS ------------------
    story.append(Paragraph("7. Algorithmic and Data Flow Diagrams", style_h1))
    story.append(Paragraph(
        "Below is an overview of the Drivix Gate Entry &amp; Slot Allocation sequence, demonstrating how physical "
        "vehicle arrivals interact with virtual database locks and dynamic slot metrics:",
        style_body_justify
    ))
    
    story.append(Spacer(1, 10))
    
    # Simulated Sequence Box
    sequence_content = """
    <b>ANPR Gate Simulator Execution Flow:</b><br/><br/>
    <b>1. Vehicle Approaches:</b> ANPR Camera scans plate DL03GATE and hits <code>POST /simulate-entry</code>.<br/>
    <b>2. Booking Verification:</b> Backend searches database for active, paid bookings matching DL03GATE.<br/>
    <b>3. Reactive Slot Assignment:</b> If slot not pre-allocated, <code>SlotAllocationService</code> runs the multi-criteria scoring algorithm:<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;- Filter slots matching vehicle size, accessibility constraints, and EV requirements.<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;- Calculate weights: Floor Match (30%), Walking Distance (25%), Zone Preference (15%), Exits (5%).<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;- Select slot with the highest numerical score.<br/>
    <b>4. Atomic State Change:</b> Update slot to 'Occupied' and booking status to 'Checked In'.<br/>
    <b>5. Real-Time Broadcast:</b> Socket.IO emits updates to all clients, dynamically updating visual map layouts.<br/>
    <b>6. Access Granted:</b> Gate simulator confirms entry; terminal screen guides driver to assigned slot.
    """
    story.append(Paragraph(sequence_content, style_callout))
    
    # Code snippet illustration
    story.append(Paragraph("Representative Slot Allocation Weight Matrix Configuration:", style_h2))
    code_text = """
const SLOT_ALLOCATION_WEIGHTS = {
  SAME_FLOOR_MATCH: 0.30,   // Prioritizes requested floor
  WALKING_DISTANCE: 0.25,   // Distance from elevator/mall entrance
  ZONE_COMPATIBILITY: 0.15, // Ranks rows based on preference
  VEHICLE_TYPE_MATCH: 0.10, // Avoids parking compacts in truck spots
  EV_CHARGING_MATCH: 0.10,  // Allocates charging ports to EV profiles
  ACCESSIBILITY: 0.05,      // Strictly reserves disabled slots
  EXIT_PROXIMITY: 0.05      // Proximity to exit toll gates
};
"""
    story.append(Paragraph(code_text.replace("\n", "<br/>").replace(" ", "&nbsp;"), style_code))
    
    # ------------------ SECTION 8: ROADMAP & CONCLUSION ------------------
    story.append(Paragraph("8. Conclusion &amp; Roadmap", style_h1))
    story.append(Paragraph(
        "The Drivix Smart Parking Ecosystem presents a robust, scalable, and highly performant solution to one of urban mobility's "
        "most stubborn obstacles. By combining high-fidelity user experiences with backend atomic concurrency, AI dynamic pricing, "
        "and ANPR validation, Drivix provides a complete blueprint for future-proof smart cities.",
        style_body_justify
    ))
    story.append(Paragraph(
        "<b>Next Steps on the Roadmap:</b>",
        style_h2
    ))
    story.append(Paragraph(
        "• <b>Edge-AI ANPR:</b> Shifting number plate detection from software simulators to real hardware Edge-AI cameras.",
        style_bullet
    ))
    story.append(Paragraph(
        "• <b>Federated ML Model Training:</b> Training the pricing model on local edge gateway devices within parking structures, "
        "allowing nodes to learn localized city-specific traffic behaviors and upload model weights privately to a global registry.",
        style_bullet
    ))
    story.append(Paragraph(
        "• <b>Blockchain Wallet Integration:</b> Enabling connected autonomous vehicles to negotiate and pay for parking slots "
        "directly using machine-to-machine wallet interactions.",
        style_bullet
    ))
    
    doc.build(story, onFirstPage=draw_cover_background, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated: {filename}")

if __name__ == "__main__":
    output_pdf = "Drivix_Project_Detailed_Report.pdf"
    if len(sys.argv) > 1:
        output_pdf = sys.argv[1]
    build_pdf(output_pdf)
