import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://guardrail-ops-1.onrender.com/api").replace(/\/$/, "");

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("guardrail_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("guardrail_token");
      localStorage.removeItem("guardrail_user");
      if (!window.location.pathname.includes("login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export interface ChatStreamCallbacks {
  onToken: (token: string) => void;
  onBlocked: (data: { reply: string; riskBand: string }) => void;
  onCorrection: (data: { reply: string }) => void;
  onDone: (data: { riskBand: string }) => void;
  onError: (data: { reply: string }) => void;
}

/**
 * Streams a chat message via Server-Sent Events. axios doesn't expose a
 * readable-stream body, so this uses the fetch API directly (still routed
 * through the same base URL + JWT the axios client uses).
 */
export async function streamChat(
  payload: { message: string; sessionId: string },
  callbacks: ChatStreamCallbacks
): Promise<void> {
  const token = localStorage.getItem("guardrail_token");

  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    callbacks.onError({ reply: "Could not reach GuardBank AI Assistant. Please try again." });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";

    for (const block of blocks) {
      const lines = block.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));
      if (!eventLine || !dataLine) continue;

      const eventName = eventLine.replace("event:", "").trim();
      const data = JSON.parse(dataLine.replace("data:", "").trim());

      switch (eventName) {
        case "token":
          callbacks.onToken(data.token);
          break;
        case "blocked":
          callbacks.onBlocked(data);
          break;
        case "correction":
          callbacks.onCorrection(data);
          break;
        case "done":
          callbacks.onDone(data);
          break;
        case "error":
          callbacks.onError(data);
          break;
      }
    }
  }
}
