import os
from fastapi import Body
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lex_rank import LexRankSummarizer
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from groq import Groq
import shutil
import tempfile
import pytesseract

if os.name == "nt":
    pytesseract.pytesseract.tesseract_cmd = (
        r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )

app = FastAPI(title="MediaHub AI API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://celo-hy32.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Load Whisper once when the backend starts
model = None

if not os.getenv("RENDER"):
    import whisper
    model = whisper.load_model("base")

@app.get("/")
def home():
    return {
        "message": "Welcome to MediaHub AI Backend!",
        "status": "Running successfully"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    is_render = bool(os.getenv("RENDER"))
    max_size = 25 * 1024 * 1024 if is_render else 100 * 1024 * 1024
    total_size = 0

    allowed_extensions = {
        ".mp3", ".wav", ".m4a", ".ogg", ".flac", ".mp4", ".webm"
    }

    extension = os.path.splitext(file.filename or "")[1].lower()

    if extension not in allowed_extensions:
        await file.close()
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio or video format."
        )

    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=extension
        ) as temp_file:
            temp_path = temp_file.name

            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                total_size += len(chunk)

                if total_size > max_size:
                    raise HTTPException(
                        status_code=413,
                        detail="File is too large."
                    )

                temp_file.write(chunk)

        if is_render:
            api_key = os.getenv("GROQ_API_KEY")

            if not api_key:
                raise HTTPException(
                    status_code=503,
                    detail="Transcription service is not configured."
                )

            client = Groq(api_key=api_key)

            with open(temp_path, "rb") as audio_file:
                result = client.audio.transcriptions.create(
                    file=(file.filename or f"audio{extension}", audio_file),
                    model="whisper-large-v3-turbo",
                    response_format="json"
                )

            transcript = result.text

        else:
            if model is None:
                raise HTTPException(
                    status_code=503,
                    detail="Local Whisper model is not available."
                )

            result = model.transcribe(temp_path)
            transcript = result["text"]

        return {
            "filename": file.filename,
            "transcript": transcript
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(error)}"
        )

    finally:
        await file.close()

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/summarize")
async def summarize_text(text: str = Body(..., embed=True)):
    if not text.strip():
        return {
            "summary": "",
            "key_points": [],
            "main_takeaway": ""
        }

    parser = PlaintextParser.from_string(
        text,
        Tokenizer("english")
    )

    summarizer = LexRankSummarizer()

    sentences = summarizer(parser.document, 3)

    key_points = [
        str(sentence) for sentence in sentences
    ]

    if not key_points:
        key_points = [text.strip()]

    summary = " ".join(key_points)

    main_takeaway = key_points[0]

    return {
        "summary": summary,
        "key_points": key_points,
        "main_takeaway": main_takeaway
    }


@app.post("/ocr")
async def extract_text_from_image(file: UploadFile = File(...)):
    allowed_extensions = {".png", ".jpg", ".jpeg"}

    extension = os.path.splitext(file.filename or "")[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format. Use PNG or JPG."
        )

    try:
        image_bytes = await file.read()

        from PIL import Image
        from io import BytesIO

        image = Image.open(BytesIO(image_bytes))

        extracted_text = pytesseract.image_to_string(image)

        return {
            "filename": file.filename,
            "extracted_text": extracted_text
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"OCR failed: {str(error)}"
        )

    finally:
        await file.close()