import cv2
import math
import time
import mediapipe as mp

from mediapipe.tasks import python
from mediapipe.tasks.python import vision


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_PATH = "models/face_landmarker.task"

# Eye percentage thresholds
OPEN_THRESHOLD = 60
CLOSED_THRESHOLD = 30


# MediaPipe Face Landmarker
base_options = python.BaseOptions(
    model_asset_path=MODEL_PATH
)

options = vision.FaceLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO,
    num_faces=1,
    min_face_detection_confidence=0.5,
    min_face_presence_confidence=0.5,
    min_tracking_confidence=0.5,
)

detector = vision.FaceLandmarker.create_from_options(options)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def distance(p1, p2):
    """Calculate distance between two points."""
    return math.sqrt(
        (p1[0] - p2[0]) ** 2 +
        (p1[1] - p2[1]) ** 2
    )


def calculate_ear(points):
    """
    Calculate Eye Aspect Ratio.

    Points:
        P1 = left corner
        P2 = upper-left
        P3 = upper-right
        P4 = right corner
        P5 = lower-right
        P6 = lower-left
    """

    p1, p2, p3, p4, p5, p6 = points

    vertical_1 = distance(p2, p6)
    vertical_2 = distance(p3, p5)

    horizontal = distance(p1, p4)

    if horizontal == 0:
        return 0.0

    return (vertical_1 + vertical_2) / (2 * horizontal)


def eye_percentage(ear):
    """
    Convert EAR into an approximate 0-100 eye opening percentage.

    These values should eventually be calibrated for your eyes.
    """

    MIN_EAR = 0.08
    MAX_EAR = 0.32

    percentage = (
        (ear - MIN_EAR)
        / (MAX_EAR - MIN_EAR)
    ) * 100

    percentage = max(0, min(100, percentage))

    return percentage


def eye_status(percentage):

    if percentage >= OPEN_THRESHOLD:
        return "OPEN"

    elif percentage <= CLOSED_THRESHOLD:
        return "CLOSED"

    else:
        return "PARTIALLY CLOSED"


# ============================================================
# MEDIA PIPE EYE LANDMARKS
# ============================================================

# MediaPipe Face Mesh landmark indices
#
# Left eye
LEFT_EYE = [
    33,     # P1
    160,    # P2
    158,    # P3
    133,    # P4
    153,    # P5
    144     # P6
]

# Right eye
RIGHT_EYE = [
    362,    # P1
    385,    # P2
    387,    # P3
    263,    # P4
    373,    # P5
    380     # P6
]


# ============================================================
# WEBCAM
# ============================================================

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("ERROR: Could not open webcam.")
    exit()

print("=" * 50)
print("YOLO EYE & PHONE PROJECT")
print("Eye Detector Started")
print("Press Q to exit")
print("=" * 50)


timestamp = 0


# ============================================================
# MAIN LOOP
# ============================================================

while True:

    ret, frame = cap.read()

    if not ret:
        print("ERROR: Could not read webcam.")
        break

    # Mirror camera
    frame = cv2.flip(frame, 1)

    height, width, _ = frame.shape

    # BGR -> RGB
    rgb_frame = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )

    # Create MediaPipe image
    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=rgb_frame
    )

    # Timestamp
    timestamp += 33

    # Detect face landmarks
    result = detector.detect_for_video(
        mp_image,
        timestamp
    )

    # Default values
    left_percentage = 0
    right_percentage = 0

    left_status = "NO FACE"
    right_status = "NO FACE"

    # ========================================================
    # FACE DETECTED
    # ========================================================

    if result.face_landmarks:

        face = result.face_landmarks[0]

        # ----------------------------------------------------
        # Convert normalized coordinates to pixels
        # ----------------------------------------------------

        def get_point(index):

            landmark = face[index]

            return (
                int(landmark.x * width),
                int(landmark.y * height)
            )

        # ----------------------------------------------------
        # LEFT EYE
        # ----------------------------------------------------

        left_points = [
            get_point(index)
            for index in LEFT_EYE
        ]

        left_ear = calculate_ear(left_points)

        left_percentage = eye_percentage(
            left_ear
        )

        left_status = eye_status(
            left_percentage
        )

        # ----------------------------------------------------
        # RIGHT EYE
        # ----------------------------------------------------

        right_points = [
            get_point(index)
            for index in RIGHT_EYE
        ]

        right_ear = calculate_ear(right_points)

        right_percentage = eye_percentage(
            right_ear
        )

        right_status = eye_status(
            right_percentage
        )

        # ----------------------------------------------------
        # DRAW EYE LANDMARKS
        # ----------------------------------------------------

        for point in left_points:

            cv2.circle(
                frame,
                point,
                3,
                (0, 255, 0),
                -1
            )

        for point in right_points:

            cv2.circle(
                frame,
                point,
                3,
                (0, 255, 0),
                -1
            )

        # ----------------------------------------------------
        # DRAW EYE LINES
        # ----------------------------------------------------

        cv2.polylines(
            frame,
            [__import__("numpy").array(left_points)],
            True,
            (0, 255, 0),
            2
        )

        cv2.polylines(
            frame,
            [__import__("numpy").array(right_points)],
            True,
            (0, 255, 0),
            2
        )


    # ========================================================
    # AVERAGE EYE OPENING
    # ========================================================

    if result.face_landmarks:

        average_percentage = (
            left_percentage +
            right_percentage
        ) / 2

        if average_percentage >= OPEN_THRESHOLD:

            overall_status = "OPEN"

        elif average_percentage <= CLOSED_THRESHOLD:

            overall_status = "CLOSED"

        else:

            overall_status = "PARTIALLY CLOSED"

    else:

        average_percentage = 0
        overall_status = "NO FACE"


    # ========================================================
    # DISPLAY INFORMATION
    # ========================================================

    # Background panel
    cv2.rectangle(
        frame,
        (10, 10),
        (420, 190),
        (20, 20, 20),
        -1
    )

    # Title
    cv2.putText(
        frame,
        "AI EYE MONITOR",
        (25, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 255, 255),
        2
    )

    # Left eye
    cv2.putText(
        frame,
        f"Left Eye  : {left_percentage:.1f}%",
        (25, 75),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (255, 255, 255),
        2
    )

    # Right eye
    cv2.putText(
        frame,
        f"Right Eye : {right_percentage:.1f}%",
        (25, 105),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (255, 255, 255),
        2
    )

    # Average
    cv2.putText(
        frame,
        f"Average   : {average_percentage:.1f}%",
        (25, 135),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (255, 255, 255),
        2
    )

    # Status
    cv2.putText(
        frame,
        f"Status    : {overall_status}",
        (25, 170),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (0, 255, 0),
        2
    )

    # Quit information
    cv2.putText(
        frame,
        "Press Q to Exit",
        (width - 200, height - 20),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (255, 255, 255),
        1
    )

    # Show frame
    cv2.imshow(
        "YOLO Eye Phone Alert - Eye Detector",
        frame
    )

    # Q to exit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


# ============================================================
# CLEANUP
# ============================================================

cap.release()
cv2.destroyAllWindows()
detector.close()

print("Eye detector stopped.")