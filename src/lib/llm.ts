/*
 * ═══════════════════════════════════════════════
 * TO SWITCH FROM LOCAL TO CLOUD AI:
 *
 * 1. Change: const AI_MODE = 'local'
 *    To:     const AI_MODE = 'cloud'
 *
 * 2. Replace: const CLOUD_API_KEY = 'PASTE_API_KEY_HERE'
 *    With:    const CLOUD_API_KEY = 'your-actual-api-key'
 *
 * 3. Run: npm run build
 * 4. Deploy to GitHub
 *
 * That's it. Everything else works automatically.
 * ═══════════════════════════════════════════════
 */

// ─── AI MODE SWITCH ──────────────────────────────────────────
// CURRENT: 'local' (Ollama for testing)
// FUTURE:  'cloud' (paste API key when manager approves)
// TO SWITCH: change AI_MODE to 'cloud' and add CLOUD_API_KEY
// ─────────────────────────────────────────────────────────────

const AI_MODE: 'local' | 'cloud' = 'local';

const LOCAL_URL = 'http://localhost:11434/api/generate';
const LOCAL_MODEL = 'llama3';

const CLOUD_API_KEY = 'PASTE_API_KEY_HERE'; // replace when approved
const CLOUD_MODEL = 'claude-sonnet-4-20250514'; // or gemini/openai

// ─── TIMEOUT HELPER ──────────────────────────────────────────
const withTimeout = (promise: Promise<any>, ms: number) => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('LLM_TIMEOUT')), ms)
  );
  return Promise.race([promise, timeout]);
};

// ─── RESPONSE SHAPE ──────────────────────────────────────────
export interface LLMResult {
  data: any;
  fromCache: boolean;
  error?: 'timeout' | 'offline' | 'parse' | 'unknown';
  message?: string;
}

// ─── MAIN LLM CALL ───────────────────────────────────────────
export const callLLM = async (
  prompt: string,
  _cacheKeyArg?: string   // kept for backwards-compat; ignored — key is auto-derived
): Promise<LLMResult> => {

  // Check cache first
  const cacheKey = `llmCache_${btoa(unescape(encodeURIComponent(prompt))).slice(0, 40)}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      return { data: JSON.parse(cached), fromCache: true };
    } catch {
      localStorage.removeItem(cacheKey);
    }
  }

  try {
    let rawText = '';

    if (AI_MODE === 'local') {
      // ── LOCAL OLLAMA ────────────────────────────────────────
      const res = await withTimeout(
        fetch(LOCAL_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: LOCAL_MODEL,
            prompt: prompt,
            stream: false,
            format: 'json',
          }),
        }),
        15000 // 15-second timeout
      ) as Response;

      if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
      const json = await res.json();
      rawText = json.response;

    } else {
      // ── CLOUD API (Anthropic Claude) ─────────────────────────
      const res = await withTimeout(
        fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLOUD_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: CLOUD_MODEL,
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
          }),
        }),
        30000 // 30-second timeout for cloud
      ) as Response;

      if (!res.ok) throw new Error(`Cloud API error: ${res.status}`);
      const json = await res.json();
      rawText = json.content[0].text;
    }

    // ── PARSE JSON RESPONSE ───────────────────────────────────
    const clean = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(clean);

    // ── SAVE TO CACHE ─────────────────────────────────────────
    localStorage.setItem(cacheKey, JSON.stringify(parsed));

    return { data: parsed, fromCache: false };

  } catch (err: any) {

    // ── ERROR HANDLING ────────────────────────────────────────
    if (err.message === 'LLM_TIMEOUT') {
      return {
        data: null,
        fromCache: false,
        error: 'timeout',
        message: 'AI took too long to respond. Click Regenerate.',
      };
    }

    if (err.message?.includes('fetch') || err.name === 'TypeError') {
      return {
        data: null,
        fromCache: false,
        error: 'offline',
        message: AI_MODE === 'local'
          ? 'Ollama offline. Run: OLLAMA_ORIGINS=* ollama serve'
          : 'Cloud AI unreachable. Check API key or network.',
      };
    }

    if (err instanceof SyntaxError) {
      return {
        data: null,
        fromCache: false,
        error: 'parse',
        message: 'AI returned unexpected format. Click Regenerate.',
      };
    }

    return {
      data: null,
      fromCache: false,
      error: 'unknown',
      message: 'AI error. Click Regenerate to try again.',
    };
  }
};

// ─── LLM STATUS CHECK ────────────────────────────────────────
export const checkLLMStatus = async (): Promise<{
  online: boolean;
  mode: string;
  message: string;
}> => {
  if (AI_MODE === 'local') {
    try {
      const res = await withTimeout(
        fetch('http://localhost:11434/api/tags'),
        3000
      ) as Response;
      return {
        online: res.ok,
        mode: 'Local Ollama',
        message: res.ok ? 'Local AI Online' : 'Ollama Offline',
      };
    } catch {
      return {
        online: false,
        mode: 'Local Ollama',
        message: 'Ollama Offline — Run: OLLAMA_ORIGINS=* ollama serve',
      };
    }
  } else {
    const configured = CLOUD_API_KEY !== 'PASTE_API_KEY_HERE';
    return {
      online: configured,
      mode: 'Cloud AI',
      message: configured ? 'Cloud AI Connected' : 'API Key not configured',
    };
  }
};

// ─── CACHE UTILITIES ──────────────────────────────────────────
export const clearLLMCache = () => {
  Object.keys(localStorage)
    .filter(k => k.startsWith('llmCache_'))
    .forEach(k => localStorage.removeItem(k));
};

export const getLLMMode = () => AI_MODE;

// ─── BACKWARDS COMPAT: pingLLM (used in AppHeader) ──────────
/** @deprecated Use checkLLMStatus() */
export const pingLLM = async (): Promise<boolean> => {
  const status = await checkLLMStatus();
  return status.online;
};
