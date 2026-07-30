import { FormEvent, useMemo, useState } from "react";
import { streamChat } from "../../api/client";
import { ChatMessage } from "../../types";

export default function BankingAssistant() {
  const sessionId = useMemo(() => crypto.randomUUID(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      message:
        "Hello! I'm the GuardBank AI Assistant. Ask me about accounts, loans, cards, deposits, or UPI/NEFT/RTGS/IMPS.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  function updateLastAssistantMessage(updater: (msg: ChatMessage) => ChatMessage) {
    setMessages((prev) => {
      const next = [...prev];
      const lastIndex = next.length - 1;
      next[lastIndex] = updater(next[lastIndex]);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg: ChatMessage = { role: "user", message: input };
    setInput("");
    setSending(true);

    // Add the user's message, then an empty assistant placeholder to stream into
    setMessages((prev) => [...prev, userMsg, { role: "assistant", message: "" }]);

    try {
      await streamChat(
        { message: userMsg.message, sessionId },
        {
          onToken: (token: string) => {
            updateLastAssistantMessage((msg) => ({ ...msg, message: msg.message + token }));
          },
          onBlocked: (data: { reply: string; riskBand?: string }) => {
            updateLastAssistantMessage(() => ({
              role: "assistant",
              message: data.reply,
              was_blocked: true,
              riskBand: data.riskBand,
            }));
          },
          onCorrection: (data: { reply: string }) => {
            // The AI response contained PII that was masked after streaming finished —
            // swap the accumulated text for the validated/masked version.
            updateLastAssistantMessage((msg) => ({ ...msg, message: data.reply }));
          },
          onDone: (data: { riskBand?: string }) => {
            updateLastAssistantMessage((msg) => ({ ...msg, riskBand: data.riskBand }));
          },
          onError: (data: { reply: string }) => {
            updateLastAssistantMessage(() => ({ role: "assistant", message: data.reply }));
          },
        }
      );
    } catch {
      updateLastAssistantMessage(() => ({
        role: "assistant",
        message: "Something went wrong reaching the assistant. Please try again.",
      }));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full max-h-[calc(100vh-8rem)] flex-col rounded-xl bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h1 className="text-lg font-semibold text-guard-navy">GuardBank AI Assistant</h1>
        <p className="text-xs text-guard-slate">Protected by the GuardRail-Ops security layer</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-md rounded-2xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "bg-guard-blue text-white"
                  : m.was_blocked
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-slate-100 text-guard-navy"
              }`}
            >
              <p>{m.message || (sending && i === messages.length - 1 ? "…" : "")}</p>
              {m.role === "assistant" && m.riskBand && (
                <p
                  className={`mt-1 text-[10px] uppercase tracking-wide ${
                    m.riskBand === "low"
                      ? "text-emerald-500"
                      : m.riskBand === "medium"
                      ? "text-amber-500"
                      : "text-red-500"
                  }`}
                >
                  Risk: {m.riskBand}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-100 px-6 py-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about accounts, loans, UPI, NEFT…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-guard-blue focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-md bg-guard-blue px-5 py-2 text-sm font-medium text-white hover:bg-guard-navy disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}