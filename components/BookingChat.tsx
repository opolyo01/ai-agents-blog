"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function getSessionId(): string {
  const key = "booking_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const WELCOME_CONTENT =
  "Hi! I'm Oleg's scheduling assistant. I can help you book a meeting, answer questions about Oleg, or help with cancellations. What can I do for you?";

export default function BookingChat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: WELCOME_CONTENT, timestamp: new Date(0) },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [serviceReady, setServiceReady] = useState<boolean | null>(null);
  const sessionId = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    sessionId.current = getSessionId();
    setMessages((prev) =>
      prev.map((m) => (m.id === "welcome" ? { ...m, timestamp: new Date() } : m))
    );
    fetch("/api/chat")
      .then((res) => setServiceReady(res.ok))
      .catch(() => setServiceReady(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId.current,
          message: text,
          channel: "web",
          timezone: tz,
        }),
      });

      const data = await res.json();
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.ok ? data.message : (data.error ?? "Something went wrong. Please try again."),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (data.booking_confirmed) setBookingConfirmed(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const doSubmit = useCallback(() => {
    const text = input.trim();
    if (!text || loading || serviceReady === false) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "38px";
    sendMessage(text);
  }, [input, loading, sendMessage, serviceReady]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSubmit();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111] rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-white/10">
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ backgroundColor: "var(--accent)" }}
      >
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
          O
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Oleg Polyakov</p>
          <p className="text-white/70 text-xs">Scheduling Assistant</p>
        </div>
        {bookingConfirmed && (
          <span className="ml-auto bg-green-400 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            Booked!
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
            >
              {!isUser && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  O
                </div>
              )}
              <div className="max-w-[75%]">
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "text-white rounded-tr-sm"
                      : "bg-gray-100 dark:bg-white/8 text-gray-800 dark:text-gray-200 rounded-tl-sm"
                  }`}
                  style={isUser ? { backgroundColor: "var(--accent)" } : undefined}
                >
                  {msg.content}
                </div>
                <p
                  className={`text-xs text-gray-400 dark:text-gray-500 mt-1 ${
                    isUser ? "text-right" : "text-left"
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        {serviceReady === false && (
          <div className="mx-1 mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300">
            The booking service is currently offline.
            Please try again later or{" "}
            <a
              href="mailto:opolyo01@gmail.com"
              className="underline underline-offset-2 hover:no-underline"
            >
              email me directly
            </a>
            .
          </div>
        )}
        {loading && (
          <div className="flex justify-start mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1"
              style={{ backgroundColor: "var(--accent)" }}
            >
              O
            </div>
            <div className="bg-gray-100 dark:bg-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 border-t border-gray-100 dark:border-white/10 flex gap-2 items-end"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              doSubmit();
            }
          }}
          placeholder="Type a message… (Shift+Enter for new line)"
          disabled={loading || serviceReady === false}
          rows={1}
          className="flex-1 rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 px-4 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 disabled:opacity-50 resize-none overflow-hidden leading-5 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          style={{ minHeight: "38px", maxHeight: "120px" }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading || serviceReady === false}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
          style={{ backgroundColor: "var(--accent)" }}
          aria-label="Send"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
