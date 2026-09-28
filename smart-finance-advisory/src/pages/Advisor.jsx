import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const SUGGESTIONS = [
  "How can I reduce my food expenses?",
  "Where should I invest my savings?",
  "Give me a monthly budget plan",
  "Am I spending too much on shopping?",
  "How to build an emergency fund?",
  "What is my financial health score?",
];

// ... (Keep your getMockResponse function here, maybe update the text slightly if you want) ...
const getMockResponse = (msg) => {
  // ... your existing mock response logic ...
  return `Great question! Based on your financial profile:\n\nKey metrics this month:\n• Income: ₹63,000\n• Expenses: ₹33,000\n• Savings: ₹30,000 (47.6%)\n• Health Score: 78/100 — Good\n\nYou're performing above average in most categories. Your savings rate is excellent!\n\nWould you like specific advice on:\n• Reducing a specific expense category?\n• Investment strategies?\n• Building your emergency fund?\n• Creating a debt payoff plan?\n\nJust ask me anything!`;
};

function Message({ msg, onSpeak, activeSpeakingText }) {
  const isUser = msg.role === "user";
  const isSpeaking = activeSpeakingText === msg.content;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 16,
        animation: "fadeInUp 0.3s ease",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "linear-gradient(135deg,#00d4ff,#a78bfa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            marginRight: 10,
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          ◎
        </div>
      )}
      <div
        style={{
          maxWidth: "75%",
          padding: "13px 17px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser ? "var(--accent)" : "var(--bg-elevated)",
          color: isUser ? "var(--bg-base)" : "var(--text-primary)",
          border: isUser ? "none" : "1px solid var(--border)",
          fontSize: 14,
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          fontWeight: isUser ? 500 : 400,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <span>{msg.content}</span>
        {!isUser && (
          <button
            onClick={() => onSpeak(msg.content)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 0px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "flex-end",
              color: isSpeaking ? "var(--accent)" : "var(--text-muted)",
              transition: "all 0.2s ease",
              alignSelf: "flex-end",
              marginTop: 6,
              gap: 4,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
          >
            {isSpeaking ? (
              <>
                <span>Stop</span>
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              </>
            ) : (
              <>
                <span>Listen</span>
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
      {isUser && (
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            marginLeft: 10,
            flexShrink: 0,
            marginTop: 2,
            color: "var(--text-secondary)",
          }}
        >
          U
        </div>
      )}
    </div>
  );
}

export default function Advisor() {
  const [messages, setMessages] = useState([
    {
      // CHANGE 1: Updated the welcome message to remove Claude references
      role: "assistant", // Keep this as 'assistant' for your UI logic, the backend translates it to 'model' for Gemini
      content:
        "Hello! I'm your AI financial advisor.\n\nI can help you with:\n• Analyzing your spending patterns\n• Personalized budget recommendations\n• Investment strategies\n• Financial health assessment\n• Savings optimization\n\nWhat would you like to explore today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeSpeakingText, setActiveSpeakingText] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const wasVoiceInputRef = useRef(false);
  const shouldAutoSendRef = useRef(false);
  const accumulatedTranscriptRef = useRef("");
  const activeSpeakingTextRef = useRef(null);

  // Sync speak ref
  useEffect(() => {
    activeSpeakingTextRef.current = activeSpeakingText;
  }, [activeSpeakingText]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const speakText = (text) => {
    window.speechSynthesis.cancel();
    
    if (activeSpeakingTextRef.current === text) {
      setActiveSpeakingText(null);
      return;
    }

    const cleanText = text
      .replace(/[\*\#\`\•\-]/g, "") // Strip markdown
      .replace(/₹/g, " Rupees ")   // Clean currency symbols for natural speech
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const targetVoice =
      voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];

    if (targetVoice) {
      utterance.voice = targetVoice;
    }
    utterance.rate = 0.95;

    utterance.onend = () => {
      setActiveSpeakingText(null);
    };

    utterance.onerror = (e) => {
      console.error("Audio playback error:", e.error);
      setActiveSpeakingText(null);
    };

    setActiveSpeakingText(text);
    window.speechSynthesis.speak(utterance);
  };

  const toggleMic = () => {
    if (isListening) {
      shouldAutoSendRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome.");
      return;
    }

    // Stop active TTS when we start listening
    window.speechSynthesis.cancel();
    setActiveSpeakingText(null);

    wasVoiceInputRef.current = true;
    shouldAutoSendRef.current = true;
    accumulatedTranscriptRef.current = "";

    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.lang = "en-US";
    rec.continuous = false; // Auto-stop listening when user pauses
    rec.interimResults = true;

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const fullText = (finalTranscript + interimTranscript).trim();
      setInput(fullText);

      if (finalTranscript) {
        accumulatedTranscriptRef.current = finalTranscript;
      }
    };

    rec.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      setIsListening(false);
      shouldAutoSendRef.current = false;
    };

    rec.onend = () => {
      setIsListening(false);
      if (shouldAutoSendRef.current && accumulatedTranscriptRef.current.trim()) {
        const finalMsg = accumulatedTranscriptRef.current.trim();
        accumulatedTranscriptRef.current = "";
        shouldAutoSendRef.current = false;
        send(finalMsg);
      }
    };

    try {
      rec.start();
    } catch (err) {
      console.error("Error starting SpeechRecognition:", err);
      setIsListening(false);
      shouldAutoSendRef.current = false;
    }
  };

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    // Stop speaking old replies when a new message is sent
    window.speechSynthesis.cancel();
    setActiveSpeakingText(null);

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const token = localStorage.getItem("fin_token"); // Retrieve key matching AuthContext

      const res = await axios.post(
        "/api/ai/chat", // Use relative path for Vite dev proxy forwarding
        {
          message: msg + (wasVoiceInputRef.current ? " (Respond concisely as my voice assistant. Limit your answer to 2 short sentences max.)" : ""),
          history: messages,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}), // Attach token if it exists
          },
        },
      );

      const replyText = res.data.reply;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: replyText },
      ]);

      if (wasVoiceInputRef.current) {
        speakText(replyText);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      // Fallback to mock response
      await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));
      const mockReply = getMockResponse(msg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: mockReply },
      ]);
      
      if (wasVoiceInputRef.current) {
        speakText(mockReply);
      }
    }

    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "24px 32px",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div className="anim-up" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "linear-gradient(135deg,#00d4ff,#a78bfa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            ◎
          </div>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 20,
              }}
            >
              AI Financial Advisor
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="dot dot-green" style={{ width: 7, height: 7 }} />
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {/* CHANGE 3: Updated the subtext */}
                Powered by Google Gemini • Always available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ... (The rest of your JSX remains exactly the same) ... */}

      {/* Quick suggestions — only show when chat is fresh */}
      {messages.length <= 1 && (
        <div
          className="anim-up-1"
          style={{
            marginBottom: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => send(s)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12, borderRadius: 100 }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Chat window */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: 20,
          marginBottom: 16,
        }}
      >
        {messages.map((m, i) => (
          <Message key={i} msg={m} onSpeak={speakText} activeSpeakingText={activeSpeakingText} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg,#00d4ff,#a78bfa)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              ◎
            </div>
            <div
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "16px 16px 16px 4px",
                padding: "12px 16px",
                display: "flex",
                gap: 5,
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--text-muted)",
                    animation: `pulse 1.3s ${i * 0.22}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="card anim-up-2"
        style={{
          padding: "12px 16px",
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
        }}
      >
        <textarea
          ref={inputRef}
          placeholder="Ask about your finances... (Enter to send)"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            wasVoiceInputRef.current = false;
          }}
          onKeyDown={handleKey}
          rows={1}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            resize: "none",
            lineHeight: 1.6,
            padding: "4px 0",
            maxHeight: 100,
            overflow: "auto",
          }}
        />
        {SpeechRecognition && (
          <button
            type="button"
            onClick={toggleMic}
            className={`btn ${isListening ? "btn-danger" : "btn-ghost"}`}
            style={{
              flexShrink: 0,
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              background: isListening ? "rgba(239, 68, 68, 0.15)" : "transparent",
              border: isListening ? "1px solid rgb(239, 68, 68)" : "1px solid var(--border)",
              boxShadow: isListening ? "0 0 10px rgba(239, 68, 68, 0.4)" : "none",
              transition: "all 0.25s ease",
              position: "relative",
              cursor: "pointer"
            }}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening && (
              <div
                style={{
                  position: "absolute",
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  borderRadius: "50%",
                  border: "2px solid rgb(239, 68, 68)",
                  animation: "pulse 1.5s infinite ease-out"
                }}
              />
            )}
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              stroke={isListening ? "rgb(239, 68, 68)" : "var(--text-secondary)"}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: "stroke 0.25s ease" }}
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={() => send()}
          disabled={!input.trim() || loading}
          style={{ flexShrink: 0 }}
        >
          {loading ? (
            <span className="spinner" style={{ width: 16, height: 16 }} />
          ) : (
            "Send →"
          )}
        </button>
      </div>

      <p
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          textAlign: "center",
          marginTop: 8,
        }}
      >
        AI advice is for guidance only. Consult a certified financial advisor
        for major decisions.
      </p>
    </div>
  );
}
