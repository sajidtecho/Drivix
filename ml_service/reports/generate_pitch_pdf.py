import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, KeepTogether
)
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
            self.draw_header_footer(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        if self._pageNumber > 1:
            self.drawString(54, 752, "DRIVIX AI — JUDGE PRESENTATION & DEFENSE SCRIPT")
            self.setFont("Helvetica", 8)
            self.drawRightString(558, 752, "SMART PARKING & FAIR DYNAMIC PRICING")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 746, 558, 746)

        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "DRIVIX SMART MOBILITY ECOSYSTEM — COMPETITION & JUDGING HANDBOOK")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 46, 558, 46)

        self.restoreState()

def build_judge_script_pdf(output_path: str):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#334155'),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
    )

    script_spoken = ParagraphStyle(
        'ScriptSpoken',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10,
        leading=15,
        textColor=colors.HexColor('#0f172a'),
        leftIndent=14,
        rightIndent=14,
        spaceBefore=4,
        spaceAfter=8
    )

    cue_style = ParagraphStyle(
        'CueStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#b91c1c'),
        spaceBefore=8,
        spaceAfter=2
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1e293b')
    )

    story = []

    # Title Block
    story.append(Paragraph("DRIVIX AI: Judge Presentation & Defense Script", title_style))
    story.append(Paragraph("A Comprehensive Speaking Script, Model Architecture Walkthrough & Q&A Defense Guide", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563eb'), spaceAfter=14))

    # Metadata Card
    meta_data = [
        [
            Paragraph("<b>Project:</b> Drivix Smart Mobility & Parking", callout_style),
            Paragraph("<b>Target Audience:</b> Hackathon & Project Judges", callout_style)
        ],
        [
            Paragraph("<b>ML Core:</b> Two-Stage AI Occupancy & Pricing Engine", callout_style),
            Paragraph("<b>Stage 1 Test Accuracy:</b> R² = 96.2% | MAE = 3.3%", callout_style)
        ],
        [
            Paragraph("<b>Dynamic Pricing Policy:</b> Fair Bounded Surge (+3% to +5%)", callout_style),
            Paragraph("<b>Backend Tech:</b> FastAPI, Express.js, MongoDB, React", callout_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[250, 254])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # SECTION 1
    story.append(Paragraph("1. Executive Summary & Core Narrative", h1_style))
    story.append(Paragraph(
        "When explaining Drivix to judges, lead with the <b>real-world tension</b>: Conventional dynamic pricing (like ride-hailing 2x-3x surge) causes severe customer churn and backlash in municipal and mall parking. On the other hand, static pricing causes parking lot gridlock during rush hours and lost revenue during lulls.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Drivix's Breakthrough:</b> A mathematically bounded <b>Two-Stage AI Pipeline</b>. Stage 1 forecasts physical lot occupancy 30-60 minutes ahead with <b>96.2% R² accuracy</b> using 35,000+ real sensor observations. Stage 2 applies a <b>fair dynamic pricing policy capped strictly between +3% and +5%</b> (e.g. ₹50 base price increases to only ₹51.50 or ₹52.50). This micro-adjustment incentivizes turnover without alienating drivers.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # SECTION 2: 3-MINUTE PITCH SCRIPT
    story.append(Paragraph("2. The 3-Minute Elevator Pitch (Word-for-Word Script)", h1_style))
    story.append(Paragraph("Use this script when you have 3 minutes to present your project to the jury:", body_style))

    story.append(Paragraph("[0:00 - 0:45] The Hook & The Real-World Problem", cue_style))
    story.append(Paragraph(
        "\"Good morning / afternoon respected judges. How many times have you driven into a busy shopping mall, university campus, or IT hub, only to circle around for 25 minutes looking for a parking spot? Or worse, arriving at a parking bay only to find predatory 2x or 3x surge pricing that feels like extortion? Today, urban parking facilities face a massive dilemma: static pricing causes parking congestion and lost revenue, while aggressive surge pricing destroys customer trust. With Drivix, we set out to build an intelligent, predictive, and consumer-fair dynamic pricing ecosystem for smart cities.\"",
        script_spoken
    ))

    story.append(Paragraph("[0:45 - 1:45] The Core AI Innovation: Two-Stage Architecture", cue_style))
    story.append(Paragraph(
        "\"Instead of guessing demand using ad-hoc rules, Drivix implements a clean, decoupled Two-Stage AI Pipeline grounded in recent peer-reviewed transportation research:<br/><br/>"
        "<b>Stage 1 is our Predictive Occupancy Forecaster:</b> Using 35,000+ real-world IoT sensor records across 30 parking hubs, we trained a high-performance Gradient Boosting model with cyclical time features, 3-step time-series lags, and rolling velocity. On completely unseen future test data, our model achieves a stellar <b>96.2% R² score</b> and predicts parking occupancy within <b>3.3% of actual ground truth</b>.<br/><br/>"
        "<b>Stage 2 is our Fair Dynamic Pricing Engine:</b> Unlike ride-hailing algorithms that double or triple prices, our pricing policy is mathematically capped. If our base hourly parking rate is ₹50, high peak demand increases the rate by only <b>3% to 5%</b>—meaning the price moves to ₹51.50 or ₹52.50. This subtle, predictable nudge optimizes slot yield and smooths traffic flow without penalizing regular commuters.\"",
        script_spoken
    ))

    story.append(Paragraph("[1:45 - 2:30] Production Engineering & Fault Tolerance", cue_style))
    story.append(Paragraph(
        "\"From an engineering standpoint, Drivix is built for production resilience. We operate a microservices architecture where our Python <b>FastAPI engine</b> serves real-time forecasts and quotes in under 15 milliseconds. Simultaneously, our Node.js and Express backend features an automated <b>synchronous fallback engine</b>. If the ML service ever goes offline, our backend immediately switches to calibrated heuristic rules with zero downtime and zero latency penalty for the end user. Everything is connected to our live React and mobile booking workflows.\"",
        script_spoken
    ))

    story.append(Paragraph("[2:30 - 3:00] Business Impact & Closing", cue_style))
    story.append(Paragraph(
        "\"In conclusion, Drivix proves that AI in urban mobility does not need to be exploitative to be effective. By combining high-precision time-series forecasting with transparent, consumer-friendly 3-5% rate boundaries, Drivix delivers a win-win: parking operators maximize slot turnover, while drivers get predictable, hassle-free parking. Thank you, and we welcome your questions!\"",
        script_spoken
    ))

    story.append(PageBreak())

    # SECTION 3: KEY METRICS CHEAT SHEET
    story.append(Paragraph("3. Numbers to Memorize (Quick Facts Table)", h1_style))
    story.append(Paragraph("Keep these exact figures in mind during your demo and Q&A:", body_style))

    metrics_table_data = [
        ["Metric / Dimension", "Value Achieved", "Why It Matters"],
        ["Stage 1 Model Architecture", "HistGradientBoosting Regressor", "Fast, handles non-linear time dynamics & sensor noise"],
        ["Dataset Size", "35,717 sensor events (30 hubs)", "UCI Birmingham benchmark spanning 2.5 months"],
        ["Test Set Accuracy (R²)", "96.18% (0.9618)", "Explains 96.2% of future occupancy variance"],
        ["Test MAE (Mean Absolute Error)", "0.0334 (3.3%)", "Forecasts occupancy within 3.3 slots per 100 capacity"],
        ["Persistence Baseline MAE", "0.0969 (9.7%)", "Our model is 3x more accurate than assuming status-quo"],
        ["Fair Surge Policy (Peak)", "+5% maximum (1.05x)", "e.g., ₹50 base price increases to only ₹52.50"],
        ["Fair Surge Policy (Busy)", "+3% (1.03x)", "e.g., ₹50 base price increases to only ₹51.50"],
        ["Off-Peak Incentive", "-3% discount (0.97x)", "e.g., ₹50 base price discounted to ₹48.50"],
        ["Inference Latency", "< 15 ms", "FastAPI microservice response time"]
    ]
    t = Table(metrics_table_data, colWidths=[150, 160, 194])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,1), (-1,-1), 5),
        ('BOTTOMPADDING', (0,1), (-1,-1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))

    # SECTION 4: JUDGE DEFENSE & TOUGH Q&A MATRIX
    story.append(Paragraph("4. Judge Q&A Defense Matrix (Top 7 Tough Questions)", h1_style))
    story.append(Paragraph("Judges love to probe potential weaknesses. Here are bulletproof answers to the most common questions:", body_style))

    qa_list = [
        (
            "Q1: Why did you limit the surge to only 3% to 5%? Isn't dynamic pricing supposed to be aggressive (like Uber 2x-3x) to balance demand?",
            "\"Excellent question. Aggressive 2x or 3x surge pricing works in private ride-hailing because drivers can decline trips or choose other areas. But in physical urban parking and municipal hubs, aggressive price gouging leads to public outcry, regulatory scrutiny, and severe customer churn. Academic studies (such as Sarker et al., 2020) prove that parking demand responds to minor price signals. By implementing a 3% to 5% bounded margin (e.g., +₹2.50 on a ₹50 base), we introduce a fair, transparent rate adjustment that optimizes turnover without antagonizing everyday commuters.\""
        ),
        (
            "Q2: How do you guarantee there is no data leakage or look-ahead bias in your time-series model?",
            "\"We enforced strict chronological splitting instead of random shuffling. Random K-fold shuffling in time-series allows future timestamps to leak into training data, artificially inflating accuracy. Our 35,600+ records were split strictly by time: the first 70% for training (Oct 4 to Nov 25), the next 15% for validation, and the final 15% (Dec 8 to Dec 19) for test evaluation. Furthermore, all rolling statistics (rolling mean and standard deviation) use past-shifted windows only.\""
        ),
        (
            "Q3: What happens if your Python ML microservice crashes during live peak hours?",
            "\"We built Drivix with a Hybrid Resilient Architecture. In our Node.js/Express backend (`utils/pricingEngine.js`), we maintain a synchronous deterministic rule-based fallback. If the FastAPI server experiences network timeout (>1500ms) or is completely offline, the Express backend automatically falls back to our internal heuristic rules with zero error thrown to the user. Once the ML service recovers, it automatically resumes AI inference seamlessly.\""
        ),
        (
            "Q4: Your training dataset is from Birmingham, UK. How does this model generalize to Indian locations like Noida or Chennai?",
            "\"Our model is not hardcoding street names; it is learning the fundamental physics of parking dynamics: arrival patterns, diurnal human routines, capacity constraints, and momentum velocity. Regardless of whether a parking lot is in Birmingham or Greater Noida, human arrival curves spike during morning commute and lunch, and taper in late afternoon. Furthermore, we implemented an Online Learning subsystem (`online_learner.py`) with SGD regression that continuously updates weights based on real local booking feedback in Noida without requiring full retraining.\""
        ),
        (
            "Q5: Why use HistGradientBoosting over Deep Learning architectures like LSTMs or Transformers?",
            "\"For tabular time-series forecasting with continuous sensor telemetry, gradient boosted decision trees consistently outperform LSTMs in latency, sample efficiency, and interpretability. HistGradientBoosting evaluates inference in under 2 milliseconds on standard CPU hardware with an R² of 96.2%, whereas an LSTM would require GPU acceleration, significant inference latency, and high memory overhead for marginal gain.\""
        ),
        (
            "Q6: How did you clean sensor noise and anomalies in the raw dataset?",
            "\"In real-world IoT sensor deployments, physical hardware introduces glitches. Our preprocessing pipeline identified and cleaned 12 negative occupancy counts (caused by inductive loop counter drift) by clamping them to zero. We also handled 373 overflow occurrences where occupancy exceeded 100% capacity due to illegal aisle parking or entry queueing by clipping values to physical lot limits.\""
        ),
        (
            "Q7: How does this model connect with the end user in the Drivix app?",
            "\"When a user selects a parking hub or car spa slot in the Drivix app, the app requests a quote. Our backend calls `/api/v1/predict`, which returns the projected occupancy percentage, recommended price, and a user-friendly badge like '[Peak Demand (+5% Fair Adjustment)]' or '[Off-Peak Discount (3% Off)]'. The user sees upfront, transparent pricing before confirming their reservation.\""
        )
    ]

    for q, a in qa_list:
        card_content = [
            [Paragraph(f"<b>{q}</b>", ParagraphStyle('QStyle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9.5, leading=13.5, textColor=colors.HexColor('#1e40af')))],
            [Paragraph(a, ParagraphStyle('AStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=13, textColor=colors.HexColor('#334155')))]
        ]
        q_table = Table(card_content, colWidths=[504])
        q_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#eff6ff')),
            ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#ffffff')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#bfdbfe')),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(q_table)
        story.append(Spacer(1, 8))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {output_path}")

if __name__ == "__main__":
    report_dir = os.path.dirname(os.path.abspath(__file__))
    output_pdf = os.path.join(report_dir, "Drivix_Judge_Pitch_and_Presentation_Script.pdf")
    build_judge_script_pdf(output_pdf)

    # Also save a copy in root workspace for easy access
    root_pdf = r"d:\DrivixApps\Drivix_Judge_Pitch_and_Presentation_Script.pdf"
    build_judge_script_pdf(root_pdf)
