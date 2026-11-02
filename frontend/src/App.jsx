
import React, { useState } from "react";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Sparkles,
  ScanText,
  Search,
  Bell,
  Menu,
  X,
  ArrowUpRight,
  CheckCircle,
  FileAudio,
  Plus,
  WandSparkles,
  Image as ImageIcon,
  AudioWaveform,
  Settings,
  Info,
  Headphones,
  ChevronRight,
  Clock,
  Download,
  Copy,
  Volume2,
  Square,
  Trash2
} from "lucide-react";

import "./styles/global.css";

import {
  transcribeAudio,
  summarizeText,
  extractTextFromImage
} from "./services/api";

function App() {
  const [active, setActive] = useState("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [result, setResult] = useState("");

  const [summary, setSummary] = useState("");
  const [keyPoints, setKeyPoints] = useState([]);
  const [mainTakeaway, setMainTakeaway] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  const menu = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Upload Media", icon: Upload },
    { name: "Transcripts", icon: FileText },
    { name: "AI Summaries", icon: Sparkles },
    { name: "OCR Studio", icon: ScanText },
  ];

  function navigateTo(page) {
    setActive(page);
    setMobileMenuOpen(false);
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      setFile(selectedFile);
      setResult("");
      setSummary("");
      setKeyPoints([]);
      setMainTakeaway("");
    }
  }
  function handleDrop(event) {
  event.preventDefault();
  setIsDragging(false);

  const droppedFile = event.dataTransfer.files?.[0];

  if (droppedFile) {
    setFile(droppedFile);
    setResult("");
    setSummary("");
    setKeyPoints([]);
    setMainTakeaway("");
  }
}

  async function processFile() {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const maxSize = 100 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("File too large! Maximum allowed size is 100 MB.");
      return;
    }

    setProcessing(true);
setProcessingStatus("Getting your file ready...");
setResult("");

    try {
      if (file.type.startsWith("image/")) {
        setActive("OCR Studio");

        const data = await extractTextFromImage(file);
        setProcessingStatus("Extracting text from your image...");

        setResult(
          data.extracted_text || "No text found in this image."
        );
      } else {
        const allowedExtensions = [
          "mp3", "wav", "m4a", "ogg", "flac",
          "mp4", "webm"
        ];

        const fileExtension = file.name
          .split(".")
          .pop()
          .toLowerCase();

        if (!allowedExtensions.includes(fileExtension)) {
          alert("Unsupported file type. Please select an audio, video or image file.");
          return;
        }

        const data = await transcribeAudio(file);
        setProcessingStatus("Transcribing your audio or video...");

        setResult(data.transcript || "No speech detected.");
        setActive("Transcripts");
      }
    } catch (error) {
      console.error("Processing error:", error);
      setResult("Processing failed: " + error.message);
    } finally {
      setProcessing(false);
setProcessingStatus("");
    }
  }

  function clearFile() {
    setFile(null);
    setResult("");
    setSummary("");
    setKeyPoints([]);
    setMainTakeaway("");
  }

  async function generateSummary() {
    if (!result.trim()) {
      alert("Please transcribe an audio or video file first!");
      return;
    }

    setSummaryLoading(true);
    setSummary("");
    setKeyPoints([]);
    setMainTakeaway("");

    try {
      const data = await summarizeText(result);

      setSummary(data.summary || "");
      setKeyPoints(data.key_points || []);
      setMainTakeaway(data.main_takeaway || "");
    } catch (error) {
      console.error("Summary error:", error);
      setSummary("Summary failed: " + error.message);
    } finally {
      setSummaryLoading(false);
    }
  }

  function downloadText(text, filename) {
    if (!text.trim()) {
      alert("There is no text available to download!");
      return;
    }

    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  async function copyText(text) {
    if (!text.trim()) {
      alert("There is no text available to copy!");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      alert("Copied successfully!");
    } catch (error) {
      console.error("Copy error:", error);
      alert("Could not copy the text. Please try again.");
    }
  }

  function downloadSummary() {
    const content = `
CELO - SUMMARY

OVERVIEW
${summary}

KEY POINTS
${keyPoints.map((point, index) => `${index + 1}. ${point}`).join("\n")}

MAIN TAKEAWAY
${mainTakeaway}
`;

    downloadText(content, "Celo-Summary.txt");
  }

  function speakExtractedText() {
    if (!result.trim()) {
      alert("No text available to read!");
      return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(result);
    speech.lang = "en-IN";
    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
  }

  const stats = [
    {
      title: "Selected Files",
      value: file ? "1" : "0",
      icon: Headphones,
      color: "purple"
    },
    {
      title: "Transcript Ready",
      value: result.trim() && !file?.type.startsWith("image/") ? "Yes" : "No",
      icon: FileText,
      color: "blue"
    },
    {
      title: "Summary Ready",
      value: summary.trim() ? "Yes" : "No",
      icon: Sparkles,
      color: "pink"
    }
  ];

  const quickActions = [
    {
      name: "Upload Media",
      icon: Upload,
      desc: "Upload audio, video and images",
      color: "purple"
    },
    {
      name: "Transcripts",
      icon: FileText,
      desc: "Convert speech into text",
      color: "blue"
    },
    {
      name: "AI Summaries",
      icon: Sparkles,
      desc: "Get key insights instantly",
      color: "pink"
    },
    {
      name: "OCR Studio",
      icon: ScanText,
      desc: "Extract text from images",
      color: "blue"
    }
  ];

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileMenuOpen ? "open" : ""}`}>

        <div className="brand">
          <div className="brand-icon">
            <AudioWaveform size={27} strokeWidth={2.4} />
          </div>
          <h2>Celo</h2>

          <button
            className="sidebar-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-search">
          <Search size={17} />
          <input placeholder="Search..." />
          <span>⌘ K</span>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav className="navigation">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${active === item.name ? "active" : ""}`}
                onClick={() => navigateTo(item.name)}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-divider" />

        <p className="menu-label">SETTINGS</p>

        <button className="nav-item">
          <Settings size={19} />
          <span>Settings</span>
        </button>

        <button className="nav-item">
          <Info size={19} />
          <span>About</span>
        </button>

        <div className="sidebar-brand-card">
          <AudioWaveform size={42} />
          <h3>Celo</h3>
          <p>Your AI media companion</p>
          <div className="brand-card-glow" />
        </div>

      </aside>

      {mobileMenuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* MAIN AREA */}
      <main className="main">

        <header className="topbar">

          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div className="topbar-title">
            <AudioWaveform size={17} />
            <span>{active}</span>
          </div>

          <div className="topbar-actions">
            <button className="icon-button" aria-label="Help">
              <Info size={18} />
            </button>

            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>

            <div className="profile">
              <div className="avatar">U</div>
              <span>User</span>
            </div>
          </div>

        </header>

        <div className="content">

          {/* DASHBOARD */}
          {active === "Dashboard" && (
            <>
              <section className="welcome">
                <div className="welcome-content">
                  <p className="eyebrow">WELCOME TO CELO</p>

                  <h1>
                    Your Smart <span>Media Studio</span>
                  </h1>

                  <p>
                    Transcribe, summarize and extract text with AI.
                  </p>

                  <button
                    className="primary"
                    onClick={() => navigateTo("Upload Media")}
                  >
                    <Upload size={19} />
                    Upload Media
                    <ChevronRight size={19} />
                  </button>
                </div>

                <div className="welcome-visual">
                  <div className="visual-orbit">
                    <div className="visual-card visual-play">
                      <span>▶</span>
                    </div>

                    <AudioWaveform
                      className="visual-wave"
                      size={76}
                    />

                    <div className="visual-card visual-text">
                      <FileText size={45} />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </section>

              <section className="stats">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div className="card stat-card" key={stat.title}>
                      <div className={`stat-icon ${stat.color}`}>
                        <Icon size={26} />
                      </div>

                      <div>
                        <p>{stat.title}</p>
                        <h2>{stat.value}</h2>
                      </div>
                    </div>
                  );
                })}
              </section>

              <section className="section-heading">
                <div>
                  <h2>Quick Actions</h2>
                  <p>Choose what you want to do.</p>
                </div>

                <button
                  className="text-button"
                  onClick={() => navigateTo("Upload Media")}
                >
                  Explore all <ArrowUpRight size={17} />
                </button>
              </section>

              <section className="quick-grid">
                {quickActions.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      className="card action-card"
                      key={item.name}
                      onClick={() => navigateTo(item.name)}
                    >
                      <div className={`action-icon ${item.color}`}>
                        <Icon size={24} />
                      </div>

                      <h3>{item.name}</h3>
                      <p>{item.desc}</p>

                      <span className="action-arrow">
                        <ArrowUpRight size={19} />
                      </span>
                    </button>
                  );
                })}
              </section>

              <section className="section-heading">
                <div>
                  <h2>Recent Activity</h2>
                  <p>Your latest media file.</p>
                </div>
              </section>

              <div className="card activity">
                {file ? (
                  <div className="activity-row">
                    <div className="activity-icon">
                      <FileAudio size={22} />
                    </div>

                    <div className="activity-info">
                      <strong>{file.name}</strong>
                      <small>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </small>
                    </div>

                    <span className="completed">
                      <CheckCircle size={15} />
                      {result ? "Processed" : "Selected"}
                    </span>
                  </div>
                ) : (
                  <div className="empty-activity">
                    <Clock size={19} />
                    <p>No recent files yet. Upload a file to get started.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* UPLOAD MEDIA */}
          {active === "Upload Media" && (
            <div className="page">
              <p className="eyebrow">MEDIA WORKSPACE</p>
              <h1>Upload Media</h1>
              <p className="subtitle">
                Select a file and let Celo process it for you.
              </p>

              <div className="card upload-card">
                <label
  className={`dropzone ${isDragging ? "dragging" : ""}`}
  onDragOver={(event) => {
    event.preventDefault();
    setIsDragging(true);
  }}
  onDragLeave={() => setIsDragging(false)}
  onDrop={handleDrop}
>
                  <div className="upload-icon">
                    <Upload size={30} />
                  </div>

                  <h3>Drag or upload your files</h3>
                  <p>Choose audio, video or image files from your computer.</p>

                  <span className="primary">
                    <Plus size={17} /> Choose Files
                  </span>

                  <input
                    type="file"
                    accept="audio/*,video/*,image/*"
                    onChange={handleFileChange}
                  />

                  <small>Maximum file size: 100 MB</small>
                </label>

                {file && (
                  <div className="card file-info">
                    <div className="activity-icon">
                      {file.type.startsWith("image/") ? (
                        <ImageIcon size={22} />
                      ) : (
                        <FileAudio size={22} />
                      )}
                    </div>

                    <div className="activity-info">
                      <strong>{file.name}</strong>
                      <small>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </small>
                    </div>

                    <button
                      className="icon-button"
                      onClick={clearFile}
                      aria-label="Remove file"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}

                <div className="upload-actions">
                  <button
  className="primary"
  onClick={processFile}
  disabled={processing || !file}
>
  {processing ? (
    <span className="processing-spinner" />
  ) : (
    <WandSparkles size={18} />
  )}
  {processing ? "Processing..." : "Start Processing"}
</button>

                  <button
                    className="secondary"
                    onClick={clearFile}
                    disabled={!file || processing}
                  >
                    Clear
                  </button>
                </div>

                {processing && (
                  <p className="processing-message">
                    Celo is processing your file. Please wait...
                    {processing && (
  <p className="processing-status">{processingStatus}</p>
)}
                  </p>
                  
                )}

                {result && (
                  <div className="card result-card">
                    <h3>Processing Result</h3>
                    <p className="transcript">{result}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TRANSCRIPTS */}
          {active === "Transcripts" && (
            <div className="page">
              <p className="eyebrow">SPEECH TO TEXT</p>
              <h1>Transcripts</h1>
              <p className="subtitle">
                Convert your audio and video into readable text.
              </p>

              <div className="card result-card">
                <div className="result-header">
                  <div>
                    <h3>{file?.name || "Latest Transcript"}</h3>
                    <p className="muted">
                      Generated using Whisper
                    </p>
                  </div>

                  <span className="completed">
                    {result && !file?.type.startsWith("image/")
                      ? "Ready"
                      : "Waiting"}
                  </span>
                </div>

                <hr />

                <p className="transcript">
                  {result && !file?.type.startsWith("image/")
                    ? result
                    : "Upload an audio or video file to create a transcript."}
                </p>

                {result && !file?.type.startsWith("image/") && (
                  <div className="transcript-actions">
                    <button
                      className="secondary"
                      onClick={() => copyText(result)}
                    >
                      <Copy size={17} /> Copy
                    </button>

                    <button
                      className="primary"
                      onClick={() =>
                        downloadText(result, "Celo-Transcript.txt")
                      }
                    >
                      <Download size={17} /> Download
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI SUMMARIES */}
          {active === "AI Summaries" && (
            <div className="page">
              <p className="eyebrow">INTELLIGENT INSIGHTS</p>
              <h1>AI Summaries</h1>
              <p className="subtitle">
                Turn long transcripts into useful key points.
              </p>

              <div className="card result-card">
                <div className="result-header">
                  <div>
                    <h3>Generate Summary</h3>
                    <p className="muted">
                      Create a concise overview of your transcript.
                    </p>
                  </div>

                  <Sparkles size={25} />
                </div>

                <button
                  className="primary"
                  onClick={generateSummary}
                  disabled={summaryLoading}
                >
                  <WandSparkles size={18} />
                  {summaryLoading ? "Generating..." : "Generate Summary"}
                </button>

                <hr />

                <h4>Overview</h4>
                <p>{summary || "Your summary will appear here."}</p>

                <hr />

                <h4>Key Points</h4>

                {keyPoints.length > 0 ? (
                  <ul>
                    {keyPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">
                    Your important points will appear here.
                  </p>
                )}

                <hr />

                <div className="highlight">
                  <strong>
                    <Sparkles size={17} /> Main Takeaway
                  </strong>
                  <p>
                    {mainTakeaway || "Your main takeaway will appear here."}
                  </p>
                </div>

                {summary && (
                  <div className="transcript-actions">
                    <button
                      className="secondary"
                      onClick={() => copyText(summary)}
                    >
                      <Copy size={17} /> Copy Summary
                    </button>

                    <button
                      className="primary"
                      onClick={downloadSummary}
                    >
                      <Download size={17} /> Download Summary
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OCR STUDIO */}
          {active === "OCR Studio" && (
            <div className="page">
              <p className="eyebrow">IMAGE INTELLIGENCE</p>
              <h1>OCR Studio</h1>
              <p className="subtitle">
                Extract text from images with Celo.
              </p>

              <div className="card upload-card">
                <label
  className={`dropzone ${isDragging ? "dragging" : ""}`}
  onDragOver={(event) => {
    event.preventDefault();
    setIsDragging(true);
  }}
  onDragLeave={() => setIsDragging(false)}
  onDrop={handleDrop}
>
                  <div className="upload-icon">
                    <ScanText size={31} />
                  </div>

                  <h3>Select an image</h3>
                  <p>Choose a JPG, JPEG or PNG image.</p>

                  <span className="primary">
                    <ImageIcon size={17} /> Browse Images
                  </span>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileChange}
                  />

                  <small>Maximum file size: 100 MB</small>
                </label>

                {file && (
                  <div className="card file-info">
                    <div className="activity-icon">
                      <ImageIcon size={22} />
                    </div>

                    <div className="activity-info">
                      <strong>{file.name}</strong>
                      <small>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </small>
                    </div>
                  </div>
                )}

                <button
                  className="primary process-btn"
                  onClick={processFile}
                  disabled={processing || !file}
                >
                  <WandSparkles size={18} />
                  {processing ? "Extracting Text..." : "Extract Text"}
                </button>

                <h3 className="ocr-title">Extracted Text</h3>

                <textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="Your extracted text will appear here..."
                  rows={10}
                />

                <div className="transcript-actions">
                  <button
                    className="secondary"
                    onClick={() => copyText(result)}
                    disabled={!result.trim()}
                  >
                    <Copy size={17} /> Copy Text
                  </button>

                  <button
                    className="primary"
                    onClick={() =>
                      downloadText(result, "Celo-Extracted-Text.txt")
                    }
                    disabled={!result.trim()}
                  >
                    <Download size={17} /> Download
                  </button>
                </div>

                <div className="transcript-actions speech-actions">
                  <button
                    className="secondary"
                    onClick={speakExtractedText}
                    disabled={!result.trim()}
                  >
                    <Volume2 size={17} /> Read Aloud
                  </button>

                  <button
                    className="secondary"
                    onClick={stopSpeaking}
                  >
                    <Square size={15} /> Stop
                  </button>
                </div>
              </div>
            </div>
          )}

          <footer>© 2026 Celo · Your AI Media Studio</footer>

        </div>
      </main>
    </div>
  );
}

export default App;
