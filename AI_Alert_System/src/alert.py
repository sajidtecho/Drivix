import os
import time
import threading

from playsound3 import playsound


# ============================================================
# PATHS
# ============================================================

PROJECT_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

AUDIO_DIR = os.path.join(
    PROJECT_DIR,
    "audio"
)

EYE_AUDIO = os.path.join(
    AUDIO_DIR,
    "eye_alert.mp3"
)

PHONE_AUDIO = os.path.join(
    AUDIO_DIR,
    "phone_alert.mp3"
)


# ============================================================
# ALERT SETTINGS
# ============================================================

EYE_COOLDOWN = 5
PHONE_COOLDOWN = 5


# ============================================================
# AUDIO CONTROLLER
# ============================================================

audio_lock = threading.Lock()

current_sound = None
current_audio_name = None


# ============================================================
# STOP CURRENT AUDIO
# ============================================================

def stop_audio():

    global current_sound
    global current_audio_name

    with audio_lock:

        if current_sound is not None:

            try:
                current_sound.stop()

            except Exception:
                pass

            current_sound = None
            current_audio_name = None


# ============================================================
# PLAY AUDIO
# ============================================================

def play_alert(audio_file, audio_name):

    global current_sound
    global current_audio_name

    if not os.path.exists(audio_file):

        print(
            f"ERROR: Audio file not found:\n{audio_file}"
        )

        return

    # --------------------------------------------------------
    # STOP PREVIOUS AUDIO
    # --------------------------------------------------------

    stop_audio()

    print(f"🔊 Playing: {audio_name}")

    try:

        with audio_lock:

            current_audio_name = audio_name

            current_sound = playsound(
                audio_file,
                block=False
            )

        # Wait until this sound finishes
        current_sound.wait()

    except Exception as error:

        print(
            "Audio error:",
            error
        )

    finally:

        with audio_lock:

            current_sound = None
            current_audio_name = None


# ============================================================
# TRIGGER AUDIO
# ============================================================

def trigger_alert(audio_file, audio_name):

    # Stop currently playing sound immediately
    stop_audio()

    # Start new sound
    threading.Thread(
        target=play_alert,
        args=(
            audio_file,
            audio_name
        ),
        daemon=True
    ).start()


# ============================================================
# COOLDOWN VARIABLES
# ============================================================

last_eye_alert = 0
last_phone_alert = 0


# ============================================================
# EYE CLOSING ALERT
# ============================================================

def eye_closing_alert():

    global last_eye_alert

    current_time = time.time()

    if (
        current_time - last_eye_alert
        < EYE_COOLDOWN
    ):
        return

    last_eye_alert = current_time

    print("🚨 DROWSINESS ALERT!")

    trigger_alert(
        EYE_AUDIO,
        "EYE ALERT"
    )


# ============================================================
# PHONE ALERT
# ============================================================

def phone_alert():

    global last_phone_alert

    current_time = time.time()

    if (
        current_time - last_phone_alert
        < PHONE_COOLDOWN
    ):
        return

    last_phone_alert = current_time

    print("📱 PHONE DETECTED!")

    trigger_alert(
        PHONE_AUDIO,
        "PHONE ALERT"
    )


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("       AUDIO ALERT TEST")
    print("=" * 60)

    print("\n1. Playing EYE alert...")
    eye_closing_alert()

    time.sleep(2)

    print("\n2. Playing PHONE alert...")
    phone_alert()

    print(
        "\nPhone alert should immediately "
        "stop the eye alert."
    )

    time.sleep(10)

    print("\nTest completed.")