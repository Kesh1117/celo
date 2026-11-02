from fastapi import Body
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lex_rank import LexRankSummarizer
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
import whisper
import os
import shutil
import tempfile
import pytesseract
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

app = FastAPI(title="MediaHub AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper once when the backend starts
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
    max_size = 100 * 1024 * 1024
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
                        detail="File too large. Maximum allowed size is 100 MB."
                    )

                temp_file.write(chunk)

        result = model.transcribe(temp_path)

        return {
            "filename": file.filename,
            "transcript": result["text"]
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