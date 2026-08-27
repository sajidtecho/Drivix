import cv2
import math
import time
import os

import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from ultralytics import YOLO
from playsound3 import playsound


# ============================================================
# PATHS
# ============================================================

MODEL_PATH = "models/face_landmarker.task"

PROJECT_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

EYE_AUDIO = os.path.join(
    PROJECT_DIR,
    "audio",
    "eye_alert.mp3"
)

PHONE_AUDIO = os.path.join(
    PROJECT_DIR,
    "audio",
    "phone_alert.mp3"
)


# ============================================================
# SETTINGS
# ============================================================

OPEN_THRESHOLD = 60
CLOSED_THRESHOLD = 30

# Eyes must remain closed for this long
DROWSINESS_TIME = 2.0

# YOLO phone confidence
PHONE_CONFIDENCE = 0.50


# ============================================================
# VARIABLES
# ============================================================

eyes_closed_start = None

closed_duration = 0

phone_detected = False
phone_confidence = 0

current_audio = None
current_sound = None


# ============================================================
# AUDIO FUNCTIONS
# ============================================================

def stop_audio():

    global current_audio
    global current_sound

    if current_sound is not None:

        try:
            current_sound.stop()
        except Exception:
            pass

    current_sound = None
    current_audio = None


def play_audio(audio_file, audio_name):

    global current_audio
    global current_sound

    # --------------------------------------------------------
    # If same audio is already playing, do nothing
    # --------------------------------------------------------

    if current_audio == audio_name:
        return

    # --------------------------------------------------------
    # Stop previous audio
    # --------------------------------------------------------

    stop_audio()

    # --------------------------------------------------------
    # Check file
    # --------------------------------------------------------

    if not os.path.exists(audio_file):

        print(
            f"ERROR: Audio file not found:\n{audio_file}"
        )

        return

    # --------------------------------------------------------
    # Start new audio
    # --------------------------------------------------------

    try:

        print(
            f"🔊 PLAYING: {audio_name}"
        )

        current_sound = playsound(
            audio_file,
            block=False
        )

        current_audio = audio_name

    except Exception as error:

        print(
            "Audio error:",
            error
        )

        current_sound = None
        current_audio = None


# ============================================================
# EYE AUDIO
# ============================================================

def start_eye_audio():

    play_audio(
        EYE_AUDIO,
        "EYE ALERT"
    )


def stop_eye_audio():

    global current_audio

    if current_audio == "EYE ALERT":

        print(
            "🔇 EYE AUDIO STOPPED"
        )

        stop_audio()


# ============================================================
# PHONE AUDIO
# ============================================================

def start_phone_audio():

    play_audio(
        PHONE_AUDIO,
        "PHONE ALERT"
    )


def stop_phone_audio():

    global current_audio

    if current_audio == "PHONE ALERT":

        print(
            "🔇 PHONE AUDIO STOPPED"
        )

        stop_audio()


# ============================================================
# CHECK AUDIO FILES
# ============================================================

print("=" * 60)
print("          CHECKING AUDIO FILES")
print("=" * 60)

if os.path.exists(EYE_AUDIO):

    print(
        "Eye audio   : FOUND"
    )

else:

    print(
        "Eye audio   : NOT FOUND"
    )

    print(
        EYE_AUDIO
    )


if os.path.exists(PHONE_AUDIO):

    print(
        "Phone audio : FOUND"
    )

else:

    print(
        "Phone audio : NOT FOUND"
    )

    print(
        PHONE_AUDIO
    )

print("=" * 60)


# ============================================================
# MEDIAPIPE FACE LANDMARKER
# ============================================================

print(
    "Loading MediaPipe face model..."
)

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

face_detector = vision.FaceLandmarker.create_from_options(
    options
)

print(
    "MediaPipe loaded."
)


# ============================================================
# YOLO PHONE DETECTOR
# ============================================================

print(
    "Loading YOLO model..."
)

yolo_model = YOLO(
    "yolo11n.pt"
)

print(
    "YOLO loaded."
)


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
# DISTANCE
# ============================================================

def distance(p1, p2):

    return math.sqrt(
        (p1[0] - p2[0]) ** 2 +
        (p1[1] - p2[1]) ** 2
    )


# ============================================================
# EAR
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

        return 0

    return (
        vertical_1 +
        vertical_2
    ) / (
        2 * horizontal
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
    ) * 100

    return max(
        0,
        min(
            100,
            percentage
        )
    )


# ============================================================
# CAMERA
# ============================================================

cap = cv2.VideoCapture(0)

if not cap.isOpened():

    print(
        "ERROR: Could not open camera."
    )

    exit()


cap.set(
    cv2.CAP_PROP_FRAME_WIDTH,
    1280
)

cap.set(
    cv2.CAP_PROP_FRAME_HEIGHT,
    720
)


print("=" * 60)
print("       YOLO EYE + PHONE MONITOR")
print("=" * 60)
print("Camera started.")
print()
print("Eye closed > 2 sec  = Eye alert")
print("Eye opened           = Stop eye alert")
print()
print("Phone detected       = Phone alert")
print("Phone removed        = Stop phone alert")
print()
print("Phone has priority.")
print("Press Q to exit.")
print("=" * 60)


# ============================================================
# MEDIAPIPE TIMESTAMP
# ============================================================

timestamp = 0


# ============================================================
# MAIN LOOP
# ============================================================

while True:

    ret, frame = cap.read()

    if not ret:

        print(
            "Could not read camera."
        )

        break


    # ========================================================
    # MIRROR CAMERA
    # ========================================================

    frame = cv2.flip(
        frame,
        1
    )

    height, width, _ = frame.shape


    # ========================================================
    # MEDIAPIPE
    # ========================================================

    rgb_frame = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )

    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=rgb_frame
    )

    timestamp += 33

    result = face_detector.detect_for_video(
        mp_image,
        timestamp
    )


    # ========================================================
    # DEFAULT EYE VALUES
    # ========================================================

    left_percentage = 0

    right_percentage = 0

    average_percentage = 0

    eye_status = "NO FACE"


    # ========================================================
    # FACE DETECTED
    # ========================================================

    if result.face_landmarks:

        face = result.face_landmarks[0]


        def get_point(index):

            landmark = face[index]

            return (
                int(landmark.x * width),
                int(landmark.y * height)
            )


        # ====================================================
        # LEFT EYE
        # ====================================================

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


        # ====================================================
        # RIGHT EYE
        # ====================================================

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


        # ====================================================
        # AVERAGE
        # ====================================================

        average_percentage = (
            left_percentage +
            right_percentage
        ) / 2


        # ====================================================
        # EYE STATUS
        # ====================================================

        if average_percentage >= OPEN_THRESHOLD:

            eye_status = "OPEN"

        elif average_percentage <= CLOSED_THRESHOLD:

            eye_status = "CLOSED"

        else:

            eye_status = "PARTIALLY CLOSED"


        # ====================================================
        # DRAW LEFT EYE
        # ====================================================

        for point in left_points:

            cv2.circle(
                frame,
                point,
                3,
                (0, 255, 0),
                -1
            )


        # ====================================================
        # DRAW RIGHT EYE
        # ====================================================

        for point in right_points:

            cv2.circle(
                frame,
                point,
                3,
                (0, 255, 0),
                -1
            )


        # ====================================================
        # EYE OUTLINES
        # ====================================================

        cv2.polylines(
            frame,
            [np.array(left_points)],
            True,
            (0, 255, 0),
            2
        )

        cv2.polylines(
            frame,
            [np.array(right_points)],
            True,
            (0, 255, 0),
            2
        )


    # ========================================================
    # DROWSINESS TIMER
    # ========================================================

    if eye_status == "CLOSED":

        if eyes_closed_start is None:

            eyes_closed_start = time.time()

        closed_duration = (
            time.time()
            -
            eyes_closed_start
        )

    else:

        eyes_closed_start = None

        closed_duration = 0


    # ========================================================
    # YOLO PHONE DETECTION
    # ========================================================

    yolo_results = yolo_model(
        frame,
        conf=PHONE_CONFIDENCE,
        verbose=False
    )


    phone_detected = False

    phone_confidence = 0


    # ========================================================
    # PROCESS YOLO
    # ========================================================

    for detection in yolo_results:

        boxes = detection.boxes

        for box in boxes:

            class_id = int(
                box.cls[0]
            )

            confidence = float(
                box.conf[0]
            )

            class_name = (
                yolo_model.names[class_id]
            )


            # =================================================
            # CELL PHONE
            # =================================================

            if class_name.lower() in [
                "cell phone",
                "mobile phone",
                "phone"
            ]:

                phone_detected = True

                phone_confidence = max(
                    phone_confidence,
                    confidence
                )


                # Bounding box
                x1, y1, x2, y2 = map(
                    int,
                    box.xyxy[0]
                )


                cv2.rectangle(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    (0, 0, 255),
                    3
                )


                cv2.putText(
                    frame,
                    f"PHONE {confidence:.0%}",
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 0, 255),
                    2
                )


    # ========================================================
    # SMART AUDIO CONTROL
    # ========================================================
    #
    # PHONE = HIGH PRIORITY
    #
    # --------------------------------------------------------
    # Phone detected:
    #     Phone audio ON
    #     Eye audio OFF
    #
    # Phone removed:
    #     Phone audio OFF
    #
    #     If eyes closed > 2 sec:
    #         Eye audio ON
    #
    #     Otherwise:
    #         Eye audio OFF
    #
    # ========================================================

    if phone_detected:

        # -----------------------------------------------
        # PHONE DETECTED
        # -----------------------------------------------

        if current_audio != "PHONE ALERT":

            start_phone_audio()


        # -----------------------------------------------
        # NEVER ALLOW EYE AUDIO WITH PHONE AUDIO
        # -----------------------------------------------

        # If somehow eye audio is active,
        # phone audio has priority.

        if current_audio == "EYE ALERT":

            stop_eye_audio()


    else:

        # -----------------------------------------------
        # PHONE REMOVED
        # -----------------------------------------------

        if current_audio == "PHONE ALERT":

            stop_phone_audio()


        # -----------------------------------------------
        # EYE ALERT
        # -----------------------------------------------

        if (
            eye_status == "CLOSED"
            and
            closed_duration >= DROWSINESS_TIME
        ):

            if current_audio != "EYE ALERT":

                start_eye_audio()


        # -----------------------------------------------
        # EYES OPEN
        # -----------------------------------------------

        else:

            if current_audio == "EYE ALERT":

                stop_eye_audio()


    # ========================================================
    # DASHBOARD
    # ========================================================

    cv2.rectangle(
        frame,
        (10, 10),
        (470, 280),
        (20, 20, 20),
        -1
    )


    # ========================================================
    # TITLE
    # ========================================================

    cv2.putText(
        frame,
        "AI SAFETY MONITOR",
        (25, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 255, 255),
        2
    )


    # ========================================================
    # EYE DATA
    # ========================================================

    cv2.putText(
        frame,
        f"Left Eye   : {left_percentage:.1f}%",
        (25, 75),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (255, 255, 255),
        2
    )


    cv2.putText(
        frame,
        f"Right Eye  : {right_percentage:.1f}%",
        (25, 105),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (255, 255, 255),
        2
    )


    cv2.putText(
        frame,
        f"Average    : {average_percentage:.1f}%",
        (25, 135),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (255, 255, 255),
        2
    )


    cv2.putText(
        frame,
        f"Eye Status : {eye_status}",
        (25, 165),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (0, 255, 0),
        2
    )


    # ========================================================
    # PHONE STATUS
    # ========================================================

    if phone_detected:

        phone_text = (
            f"Phone      : YES "
            f"({phone_confidence:.0%})"
        )

        phone_color = (
            0,
            0,
            255
        )

    else:

        phone_text = (
            "Phone      : NO"
        )

        phone_color = (
            0,
            255,
            0
        )


    cv2.putText(
        frame,
        phone_text,
        (25, 195),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        phone_color,
        2
    )


    # ========================================================
    # CLOSED TIME
    # ========================================================

    cv2.putText(
        frame,
        f"Closed Time: {closed_duration:.1f}s",
        (25, 225),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (0, 165, 255),
        2
    )


    # ========================================================
    # AUDIO STATUS
    # ========================================================

    if current_audio is not None:

        audio_text = (
            f"Audio      : {current_audio}"
        )

        audio_color = (
            0,
            255,
            255
        )

    else:

        audio_text = (
            "Audio      : NONE"
        )

        audio_color = (
            0,
            255,
            0
        )


    cv2.putText(
        frame,
        audio_text,
        (25, 255),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        audio_color,
        2
    )


    # ========================================================
    # ALERT STATUS
    # ========================================================

    if phone_detected:

        cv2.putText(
            frame,
            "PHONE ALERT!",
            (width - 280, 45),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 0, 255),
            3
        )

    elif (
        eye_status == "CLOSED"
        and
        closed_duration >= DROWSINESS_TIME
    ):

        cv2.putText(
            frame,
            "DROWSINESS ALERT!",
            (width - 350, 45),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 0, 255),
            3
        )

    else:

        cv2.putText(
            frame,
            "STATUS: SAFE",
            (width - 220, 45),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            3
        )


    # ========================================================
    # EXIT
    # ========================================================

    cv2.putText(
        frame,
        "Press Q to Exit",
        (width - 180, height - 20),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (255, 255, 255),
        1
    )


    # ========================================================
    # SHOW CAMERA
    # ========================================================

    cv2.imshow(
        "YOLO Eye + Phone Detection",
        frame
    )


    # ========================================================
    # QUIT
    # ========================================================

    if cv2.waitKey(1) & 0xFF == ord("q"):

        break


# ============================================================
# CLEANUP
# ============================================================

print(
    "\nStopping audio..."
)

stop_audio()

print(
    "Stopping camera..."
)

cap.release()

cv2.destroyAllWindows()

face_detector.close()

print(
    "\nSystem stopped successfully."
)