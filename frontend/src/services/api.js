
const API_URL = "https://celo-backend.onrender.com";

// Safely read server responses, including error responses.
async function readResponse(response) {
  const responseText = await response.text();

  let data = {};

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(
        `Server returned an invalid response (HTTP ${response.status}).`
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      data.detail || data.message || `Request failed (HTTP ${response.status}).`
    );
  }

  return data;
}

export async function checkBackend() {
  const response = await fetch(`${API_URL}/health`);
  return await readResponse(response);
}

export async function transcribeAudio(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/transcribe`, {
    method: "POST",
    body: formData,
  });

  return await readResponse(response);
}

export async function summarizeText(text) {
  const response = await fetch(`${API_URL}/summarize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  return await readResponse(response);
}

export async function extractTextFromImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/ocr`, {
    method: "POST",
    body: formData,
  });

  return await readResponse(response);
}
