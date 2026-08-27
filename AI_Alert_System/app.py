import os
import cv2
import time
import math
import base64
import threading

import av
import numpy as np
import streamlit as st
from streamlit_webrtc import webrtc_streamer, WebRtcMode

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from ultralytics import YOLO


# ============================================================
# PAGE CONFIGURATION
# ============================================================

st.set_page_config(
    page_title="AI Eye & Phone Alert",
    page_icon="👁️📱",
    layout="wide"
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "face_landmarker.task"
)

YOLO_PATH = os.path.join(
    BASE_DIR,
    "yolo11n.pt"
)

EYE_AUDIO = os.path.join(
    BASE_DIR,
    "audio",
    "eye_alert.mp3"
)

PHONE_AUDIO = os.path.join(
    BASE_DIR,
    "audio",
    "phone_alert.mp3"
)


# ============================================================
# SETTINGS
# ============================================================

OPEN_THRESHOLD = 60

CLOSED_THRESHOLD = 30

DROWSINESS_TIME = 2.0

PHONE_CONFIDENCE = 0.50


# ============================================================
# EYE LANDMARKS
# ============================================================

LEFT_EYE = [
    33,
    160,
    158,
    133,
    153,
    144
]

RIGHT_EYE = [
    362,
    385,
    387,
    263,
    373,
    380
]


# ============================================================
# SHARED DETECTION STATE
# ============================================================

class DetectionState:

    def __init__(self):

        self.lock = threading.Lock()

        self.left_percentage = 0.0

        self.right_percentage = 0.0

        self.average_percentage = 0.0

        self.eye_status = "NO FACE"

        self.closed_duration = 0.0

        self.phone_detected = False

        self.phone_confidence = 0.0

        self.alert = "NONE"

        self.running = False

        self.last_timestamp = 0

        self.eyes_closed_start = None

    def snapshot(self):

        with self.lock:

            return {
                "left_percentage":
                    self.left_percentage,

                "right_percentage":
                    self.right_percentage,

                "average_percentage":
                    self.average_percentage,

                "eye_status":
                    self.eye_status,

                "closed_duration":
                    self.closed_duration,

                "phone_detected":
                    self.phone_detected,

                "phone_confidence":
                    self.phone_confidence,

                "alert":
                    self.alert,

                "running":
                    self.running
            }


# ============================================================
# CREATE PERSISTENT STATE
# ============================================================

@st.cache_resource
def get_state():

    return DetectionState()


state = get_state()


# ============================================================
# LOAD AI MODELS
# ============================================================

@st.cache_resource
def load_models():

    # --------------------------------------------------------
    # CHECK MEDIAPIPE MODEL
    # --------------------------------------------------------

    if not os.path.exists(MODEL_PATH):

        raise FileNotFoundError(
            "Missing models/face_landmarker.task"
        )

    # --------------------------------------------------------
    # MEDIAPIPE
    # --------------------------------------------------------

    base_options = python.BaseOptions(
        model_asset_path=MODEL_PATH
    )

    options = vision.FaceLandmarkerOptions(

        base_options=base_options,

        running_mode=vision.RunningMode.VIDEO,

        num_faces=1,

        min_face_detection_confidence=0.5,

        min_face_presence_confidence=0.5,

        min_tracking_confidence=0.5
    )

    face_detector = (
        vision.FaceLandmarker.create_from_options(
            options
        )
    )

    # --------------------------------------------------------
    # YOLO
    # --------------------------------------------------------

    if os.path.exists(YOLO_PATH):

        yolo_model = YOLO(
            YOLO_PATH
        )

    else:

        yolo_model = YOLO(
            "yolo11n.pt"
        )

    return face_detector, yolo_model


# ============================================================
# DISTANCE
# ============================================================

def distance(p1, p2):

    return math.hypot(
        p1[0] - p2[0],
        p1[1] - p2[1]
    )


# ============================================================
# EYE ASPECT RATIO
# ============================================================

def calculate_ear(points):

    p1, p2, p3, p4, p5, p6 = points

    vertical_1 = distance(
        p2,
        p6
    )

    vertical_2 = distance(
        p3,
        p5
    )

    horizontal = distance(
        p1,
        p4
    )

    if horizontal == 0:

        return 0.0

    return (
        vertical_1 +
        vertical_2
    ) / (
        2.0 * horizontal
    )


# ============================================================
# EAR TO PERCENTAGE
# ============================================================

def eye_percentage(ear):

    MIN_EAR = 0.08

    MAX_EAR = 0.32

    percentage = (
        (ear - MIN_EAR)
        /
        (MAX_EAR - MIN_EAR)
    ) * 100.0

    return max(
        0.0,
        min(
            100.0,
            percentage
        )
    )


# ============================================================
# PROCESS VIDEO FRAME
# ============================================================

def process_frame(
    frame: av.VideoFrame,
    state: DetectionState
):

    image = frame.to_ndarray(
        format="bgr24"
    )

    # ========================================================
    # MIRROR CAMERA
    # ========================================================

    image = cv2.flip(
        image,
        1
    )

    # ========================================================
    # RESIZE FOR CLOUD PERFORMANCE
    # ========================================================

    max_width = 960

    if image.shape[1] > max_width:

        scale = (
            max_width /
            image.shape[1]
        )

        image = cv2.resize(
            image,
            (
                int(
                    image.shape[1] *
                    scale
                ),
                int(
                    image.shape[0] *
                    scale
                )
            ),
            interpolation=cv2.INTER_AREA
        )

    height, width = image.shape[:2]

    try:

        # ====================================================
        # LOAD MODELS
        # ====================================================

        face_detector, yolo_model = load_models()

        # ====================================================
        # MEDIAPIPE
        # ====================================================

        rgb_frame = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2RGB
        )

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb_frame
        )

        # ====================================================
        # INCREASING TIMESTAMP
        # ====================================================

        now_ms = int(
            time.monotonic() * 1000
        )

        with state.lock:

            if now_ms <= state.last_timestamp:

                now_ms = (
                    state.last_timestamp +
                    1
                )

            state.last_timestamp = now_ms

        # ====================================================
        # FACE DETECTION
        # ====================================================

        result = face_detector.detect_for_video(
            mp_image,
            now_ms
        )

        # ====================================================
        # DEFAULT EYE VALUES
        # ====================================================

        left_percentage = 0.0

        right_percentage = 0.0

        average_percentage = 0.0

        eye_status = "NO FACE"

        # ====================================================
        # FACE DETECTED
        # ====================================================

        if result.face_landmarks:

            face = result.face_landmarks[0]

            def get_point(index):

                landmark = face[index]

                return (
                    int(
                        landmark.x *
                        width
                    ),
                    int(
                        landmark.y *
                        height
                    )
                )

            # ------------------------------------------------
            # LEFT EYE
            # ------------------------------------------------

            left_points = [
                get_point(i)
                for i in LEFT_EYE
            ]

            left_ear = calculate_ear(
                left_points
            )

            left_percentage = eye_percentage(
                left_ear
            )

            # ------------------------------------------------
            # RIGHT EYE
            # ------------------------------------------------

            right_points = [
                get_point(i)
                for i in RIGHT_EYE
            ]

            right_ear = calculate_ear(
                right_points
            )

            right_percentage = eye_percentage(
                right_ear
            )

            # ------------------------------------------------
            # AVERAGE
            # ------------------------------------------------

            average_percentage = (
                left_percentage +
                right_percentage
            ) / 2.0

            # ------------------------------------------------
            # EYE STATUS
            # ------------------------------------------------

            if average_percentage >= OPEN_THRESHOLD:

                eye_status = "OPEN"

            elif average_percentage <= CLOSED_THRESHOLD:

                eye_status = "CLOSED"

            else:

                eye_status = "PARTIALLY CLOSED"

            # ------------------------------------------------
            # DRAW LEFT EYE
            # ------------------------------------------------

            for point in left_points:

                cv2.circle(
                    image,
                    point,
                    3,
                    (0, 255, 0),
                    -1
                )

            # ------------------------------------------------
            # DRAW RIGHT EYE
            # ------------------------------------------------

            for point in right_points:

                cv2.circle(
                    image,
                    point,
                    3,
                    (0, 255, 0),
                    -1
                )

            # ------------------------------------------------
            # LEFT EYE OUTLINE
            # ------------------------------------------------

            cv2.polylines(
                image,
                [np.array(left_points)],
                True,
                (0, 255, 0),
                2
            )

            # ------------------------------------------------
            # RIGHT EYE OUTLINE
            # ------------------------------------------------

            cv2.polylines(
                image,
                [np.array(right_points)],
                True,
                (0, 255, 0),
                2
            )

        # ====================================================
        # DROWSINESS TIMER
        # ====================================================

        current_time = time.monotonic()

        with state.lock:

            if eye_status == "CLOSED":

                if state.eyes_closed_start is None:

                    state.eyes_closed_start = (
                        current_time
                    )

                closed_duration = (
                    current_time -
                    state.eyes_closed_start
                )

            else:

                state.eyes_closed_start = None

                closed_duration = 0.0

        # ====================================================
        # YOLO PHONE DETECTION
        # ====================================================

        phone_detected = False

        phone_confidence = 0.0

        yolo_results = yolo_model(
            image,
            conf=PHONE_CONFIDENCE,
            verbose=False,
            imgsz=640
        )

        # ====================================================
        # PROCESS YOLO DETECTIONS
        # ====================================================

        for detection in yolo_results:

            for box in detection.boxes:

                class_id = int(
                    box.cls[0]
                )

                confidence = float(
                    box.conf[0]
                )

                class_name = str(
                    yolo_model.names[class_id]
                ).lower()

                # ------------------------------------------------
                # CELL PHONE
                # ------------------------------------------------

                if class_name in [
                    "cell phone",
                    "mobile phone",
                    "phone"
                ]:

                    phone_detected = True

                    phone_confidence = max(
                        phone_confidence,
                        confidence
                    )

                    x1, y1, x2, y2 = map(
                        int,
                        box.xyxy[0].tolist()
                    )

                    # --------------------------------------------
                    # PHONE BOX
                    # --------------------------------------------

                    cv2.rectangle(
                        image,
                        (x1, y1),
                        (x2, y2),
                        (0, 0, 255),
                        3
                    )

                    # --------------------------------------------
                    # PHONE LABEL
                    # --------------------------------------------

                    cv2.putText(
                        image,
                        f"PHONE {confidence:.0%}",
                        (
                            x1,
                            max(
                                25,
                                y1 - 10
                            )
                        ),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (0, 0, 255),
                        2
                    )

        # ====================================================
        # ALERT PRIORITY
        # ====================================================
        #
        # PHONE = HIGH PRIORITY
        #
        # PHONE
        #   ↓
        # PHONE ALERT
        #
        # NO PHONE + DROWSINESS
        #   ↓
        # EYE ALERT
        #
        # ====================================================

        if phone_detected:

            alert = "PHONE"

        elif (
            eye_status == "CLOSED"
            and
            closed_duration >= DROWSINESS_TIME
        ):

            alert = "EYE"

        else:

            alert = "NONE"

        # ====================================================
        # DASHBOARD BACKGROUND
        # ====================================================

        cv2.rectangle(
            image,
            (10, 10),
            (490, 285),
            (20, 20, 20),
            -1
        )

        # ====================================================
        # DASHBOARD TITLE
        # ====================================================

        cv2.putText(
            image,
            "AI SAFETY MONITOR",
            (25, 42),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 255),
            2
        )

        # ====================================================
        # DASHBOARD DATA
        # ====================================================

        dashboard = [

            f"Left Eye   : "
            f"{left_percentage:.1f}%",

            f"Right Eye  : "
            f"{right_percentage:.1f}%",

            f"Average    : "
            f"{average_percentage:.1f}%",

            f"Eye Status : "
            f"{eye_status}",

            (
                f"Phone      : YES "
                f"({phone_confidence:.0%})"
                if phone_detected
                else
                "Phone      : NO"
            ),

            f"Closed Time: "
            f"{closed_duration:.1f}s",

            f"Alert      : "
            f"{alert}"
        ]

        # ====================================================
        # DRAW DASHBOARD DATA
        # ====================================================

        for i, text in enumerate(dashboard):

            y = 77 + (
                i * 30
            )

            if (
                "Phone      : YES" in text
                or
                "Alert      : PHONE" in text
            ):

                color = (
                    0,
                    0,
                    255
                )

            elif (
                "Alert      : EYE" in text
            ):

                color = (
                    0,
                    165,
                    255
                )

            elif (
                "Eye Status : OPEN" in text
                or
                "Phone      : NO" in text
            ):

                color = (
                    0,
                    255,
                    0
                )

            else:

                color = (
                    255,
                    255,
                    255
                )

            cv2.putText(
                image,
                text,
                (25, y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.62,
                color,
                2
            )

        # ====================================================
        # LARGE ALERT TEXT
        # ====================================================

        if alert == "PHONE":

            alert_text = "PHONE ALERT!"

            alert_color = (
                0,
                0,
                255
            )

        elif alert == "EYE":

            alert_text = "DROWSINESS ALERT!"

            alert_color = (
                0,
                165,
                255
            )

        else:

            alert_text = "STATUS: SAFE"

            alert_color = (
                0,
                255,
                0
            )

        cv2.putText(
            image,
            alert_text,
            (
                max(
                    10,
                    width - 350
                ),
                45
            ),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            alert_color,
            3
        )

        # ====================================================
        # UPDATE SHARED STATE
        # ====================================================

        with state.lock:

            state.left_percentage = (
                left_percentage
            )

            state.right_percentage = (
                right_percentage
            )

            state.average_percentage = (
                average_percentage
            )

            state.eye_status = (
                eye_status
            )

            state.closed_duration = (
                closed_duration
            )

            state.phone_detected = (
                phone_detected
            )

            state.phone_confidence = (
                phone_confidence
            )

            state.alert = (
                alert
            )

            state.running = True

    except Exception as error:

        # ====================================================
        # PROCESSING ERROR
        # ====================================================

        cv2.putText(
            image,
            "PROCESSING ERROR",
            (25, 45),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 0, 255),
            2
        )

        cv2.putText(
            image,
            str(error)[:80],
            (25, 80),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            (0, 0, 255),
            1
        )

    # ========================================================
    # RETURN FRAME
    # ========================================================

    return av.VideoFrame.from_ndarray(
        image,
        format="bgr24"
    )


# ============================================================
# TITLE
# ============================================================

st.title(
    "👁️📱 AI Eye & Phone Alert System"
)

st.caption(
    "Real-time AI monitoring using "
    "MediaPipe Face Landmarker + YOLO11"
)


# ============================================================
# CHECK REQUIRED FILES
# ============================================================

if not os.path.exists(MODEL_PATH):

    st.error(
        "❌ Missing `models/face_landmarker.task`"
    )

    st.stop()


# ============================================================
# SIDEBAR
# ============================================================

with st.sidebar:

    st.header(
        "⚙️ Settings"
    )

    st.write(
        f"Eye alert delay: "
        f"**{DROWSINESS_TIME:.1f}s**"
    )

    st.write(
        f"Phone confidence: "
        f"**{PHONE_CONFIDENCE:.0%}**"
    )

    st.info(
        "📱 Phone alert has priority "
        "over eye alert."
    )

    st.markdown(
        "---"
    )

    st.write(
        "### 🧠 AI Models"
    )

    st.write(
        "👁️ MediaPipe Face Landmarker"
    )

    st.write(
        "📱 YOLO11 Phone Detection"
    )

    st.write(
        "🎥 Browser Webcam"
    )


# ============================================================
# WEBRTC CONFIGURATION
# ============================================================

rtc_configuration = {

    "iceServers": [

        {
            "urls": [
                "stun:stun.l.google.com:19302"
            ]
        }

    ]

}


# ============================================================
# WEBRTC CAMERA
# ============================================================

webrtc_ctx = webrtc_streamer(

    key="ai-eye-phone-monitor",

    mode=WebRtcMode.SENDRECV,

    rtc_configuration=rtc_configuration,

    media_stream_constraints={

        "video": True,

        "audio": False
    },

    video_frame_callback=lambda frame:
        process_frame(
            frame,
            state
        ),

    async_processing=True,

    media_toggle_controls=False
)


# ============================================================
# LIVE STATUS
# ============================================================

st.divider()


@st.fragment(
    run_every=0.5
)
def live_status():

    data = state.snapshot()

    # ========================================================
    # METRICS
    # ========================================================

    col1, col2, col3, col4 = st.columns(4)

    col1.metric(
        "Left Eye",
        f"{data['left_percentage']:.1f}%"
    )

    col2.metric(
        "Right Eye",
        f"{data['right_percentage']:.1f}%"
    )

    col3.metric(
        "Average",
        f"{data['average_percentage']:.1f}%"
    )

    col4.metric(
        "Phone",
        (
            "DETECTED"
            if data["phone_detected"]
            else "NO"
        )
    )

    # ========================================================
    # EYE STATUS
    # ========================================================

    if data["eye_status"] == "OPEN":

        st.success(
            "👁️ Eyes OPEN"
        )

    elif data["eye_status"] == "CLOSED":

        st.warning(
            f"👁️ Eyes CLOSED — "
            f"{data['closed_duration']:.1f}s"
        )

    elif data["eye_status"] == "PARTIALLY CLOSED":

        st.warning(
            "👁️ Eyes PARTIALLY CLOSED"
        )

    else:

        st.info(
            "👤 No face detected"
        )

    # ========================================================
    # ALERT
    # ========================================================

    if data["alert"] == "PHONE":

        st.error(
            f"📱 PHONE ALERT — "
            f"confidence "
            f"{data['phone_confidence']:.0%}"
        )

    elif data["alert"] == "EYE":

        st.warning(
            f"😴 DROWSINESS ALERT — "
            f"eyes closed for "
            f"{data['closed_duration']:.1f}s"
        )

    else:

        st.success(
            "✅ STATUS: SAFE"
        )

    # ========================================================
    # BROWSER AUDIO
    # ========================================================

    alert = data["alert"]

    audio_html = (
        "<div>Alert sounds unavailable.</div>"
    )

    # ========================================================
    # CHECK AUDIO FILES
    # ========================================================

    if (
        os.path.exists(EYE_AUDIO)
        and
        os.path.exists(PHONE_AUDIO)
    ):

        try:

            # ------------------------------------------------
            # EYE AUDIO
            # ------------------------------------------------

            with open(
                EYE_AUDIO,
                "rb"
            ) as f:

                eye_b64 = (
                    base64
                    .b64encode(
                        f.read()
                    )
                    .decode(
                        "ascii"
                    )
                )

            # ------------------------------------------------
            # PHONE AUDIO
            # ------------------------------------------------

            with open(
                PHONE_AUDIO,
                "rb"
            ) as f:

                phone_b64 = (
                    base64
                    .b64encode(
                        f.read()
                    )
                    .decode(
                        "ascii"
                    )
                )

            # ------------------------------------------------
            # AUDIO HTML
            # ------------------------------------------------

            audio_html = f"""

            <div style="
                padding:10px 0;
                font-family:sans-serif;
            ">

                <button
                    id="enable-alerts"
                    style="
                        padding:8px 14px;
                        border:0;
                        border-radius:8px;
                        cursor:pointer;
                        font-weight:600;
                    "
                >
                    🔊 Enable Alert Sounds
                </button>

                <span
                    id="sound-status"
                    style="margin-left:10px;"
                >
                    Sound locked until enabled
                </span>

            </div>

            <script>

            (() => {{

                const eyeSrc =
                    "data:audio/mpeg;base64,{eye_b64}";

                const phoneSrc =
                    "data:audio/mpeg;base64,{phone_b64}";

                const alert =
                    "{alert}";

                window.__aiAlertAudio =
                    window.__aiAlertAudio ||
                    new Audio();

                const audio =
                    window.__aiAlertAudio;

                audio.loop = true;

                const button =
                    document.getElementById(
                        "enable-alerts"
                    );

                const status =
                    document.getElementById(
                        "sound-status"
                    );

                if (
                    button &&
                    !button.dataset.bound
                ) {{

                    button.dataset.bound = "1";

                    button.onclick =
                        async () => {{

                        window.__aiAlertsEnabled =
                            true;

                        try {{

                            audio.src =
                                eyeSrc;

                            await audio.play();

                            audio.pause();

                            audio.currentTime =
                                0;

                            status.textContent =
                                "🔊 Sounds enabled";

                        }}

                        catch (error) {{

                            status.textContent =
                                "Click again to enable sound";

                        }}

                    }};

                }}

                if (
                    window.__aiAlertsEnabled
                ) {{

                    let wantedSrc = "";

                    if (
                        alert === "PHONE"
                    ) {{

                        wantedSrc =
                            phoneSrc;

                    }}

                    else if (
                        alert === "EYE"
                    ) {{

                        wantedSrc =
                            eyeSrc;

                    }}

                    if (!wantedSrc) {{

                        audio.pause();

                        audio.currentTime =
                            0;

                        audio.removeAttribute(
                            "src"
                        );

                        audio.load();

                        audio.dataset.alert =
                            "";

                    }}

                    else {{

                        if (
                            audio.dataset.alert
                            !== alert
                        ) {{

                            audio.src =
                                wantedSrc;

                            audio.dataset.alert =
                                alert;

                            audio.loop =
                                true;

                        }}

                        audio.play()
                            .catch(
                                () => {{}}
                            );

                    }}

                }}

            }})();

            </script>

            """

        except Exception:

            audio_html = (
                "<div>"
                "⚠️ Alert audio files "
                "could not be loaded."
                "</div>"
            )

    st.html(
        audio_html,
        unsafe_allow_javascript=True
    )


live_status()


# ============================================================
# CAMERA STATUS
# ============================================================

if webrtc_ctx.state.playing:

    st.info(
        "🟢 Camera stream is running. "
        "Keep your face visible and "
        "show a phone to test detection."
    )

else:

    st.info(
        "▶️ Click START above and "
        "allow camera permission."
    )


# ============================================================
# FOOTER
# ============================================================

st.divider()

st.caption(
    "Developed by Ajeet Kumar | "
    "AI Eye & Phone Alert System"
)
