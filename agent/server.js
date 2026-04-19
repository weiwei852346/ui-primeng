const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.AGENT_PORT || 8787);
const HOST = process.env.AGENT_HOST || '127.0.0.1';
const GLM_API_KEY = process.env.GLM_API_KEY || '';
const GLM_MODEL = process.env.GLM_MODEL || 'glm-4.5';
const GLM_BASE_URL = process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

function writeJson(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON payload');
  }
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractJsonObject(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    const fromFence = safeJsonParse(fenced[1].trim());
    if (fromFence) return fromFence;
  }

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const candidate = text.slice(start, end + 1);
    return safeJsonParse(candidate);
  }

  return null;
}

function normalizeByOptions(value, options) {
  if (!value || !Array.isArray(options) || options.length === 0) {
    return value || null;
  }

  const lower = String(value).toLowerCase();
  const hit = options.find((item) => String(item).toLowerCase() === lower);
  return hit || null;
}

function parseByHeuristic(query, options) {
  const lower = String(query || '').toLowerCase();
  const filters = {
    platform: null,
    architectures: [],
    os: [],
    status: null,
    mustBeReservable: null,
    keywords: []
  };

  if (lower.includes('virtual') || lower.includes('虚拟')) filters.platform = 'Virtual';
  if (lower.includes('physical') || lower.includes('物理')) filters.platform = 'Physical';

  if (lower.includes('arm')) filters.architectures.push('ARM');
  if (lower.includes('x86')) filters.architectures.push('X86_64');
  if (lower.includes('aarch64')) filters.architectures.push('aarch64');
  if (lower.includes('riscv')) filters.architectures.push('riscv64');

  ['linux', 'ubuntu', 'debian', 'vxworks', 'harmony', 'android'].forEach((item) => {
    if (lower.includes(item)) {
      filters.os.push(item === 'vxworks' ? 'VxWorks' : item.charAt(0).toUpperCase() + item.slice(1));
    }
  });

  if (lower.includes('available') || lower.includes('空闲') || lower.includes('free')) {
    filters.status = 'available';
  }

  if (lower.includes('in use') || lower.includes('in_use') || lower.includes('占用') || lower.includes('busy')) {
    filters.status = 'in_use';
  }

  if (lower.includes('reservable') || lower.includes('可预约') || lower.includes('can reserve')) {
    filters.mustBeReservable = true;
  }

  if (lower.includes('not reservable') || lower.includes('不可预约')) {
    filters.mustBeReservable = false;
  }

  const words = lower
    .replace(/[^a-z0-9\u4e00-\u9fa5\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  filters.keywords = [...new Set(words)].slice(0, 6);

  const optionPlatforms = options?.platforms || [];
  const optionArchitectures = options?.architectures || [];
  const optionOs = options?.os || [];
  const optionStatuses = options?.statuses || [];

  filters.platform = normalizeByOptions(filters.platform, optionPlatforms);
  filters.architectures = filters.architectures.filter((item) =>
    optionArchitectures.length ? optionArchitectures.includes(item) : true
  );
  filters.os = filters.os.filter((item) => (optionOs.length ? optionOs.includes(item) : true));
  filters.status = normalizeByOptions(filters.status, optionStatuses);

  return {
    filters,
    reasoning: 'Heuristic parser was used because GLM is not configured or failed.'
  };
}

async function parseWithGlm(query, options) {
  const systemPrompt = [
    'You are a target-filter parser for a frontend demo.',
    'You must return JSON only, no markdown, no explanation outside JSON.',
    'Schema:',
    '{',
    '  "platform": "Physical" | "Virtual" | null,',
    '  "architectures": string[],',
    '  "os": string[],',
    '  "status": "available" | "in_use" | null,',
    '  "mustBeReservable": boolean | null,',
    '  "keywords": string[],',
    '  "reasoning": string',
    '}'
  ].join('\n');

  const userPayload = {
    userQuery: query,
    availablePlatforms: options?.platforms || ['Physical', 'Virtual'],
    availableArchitectures: options?.architectures || ['X86_64', 'ARM', 'aarch64', 'riscv64'],
    availableOs: options?.os || ['Linux', 'Ubuntu', 'Debian', 'VxWorks', 'Harmony', 'Android'],
    availableStatuses: options?.statuses || ['available', 'in_use']
  };

  const response = await fetch(GLM_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GLM_API_KEY}`
    },
    body: JSON.stringify({
      model: GLM_MODEL,
      temperature: 0.1,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(userPayload) }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GLM request failed: ${response.status} ${err}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('GLM did not return message content.');
  }

  const parsed = typeof content === 'string' ? extractJsonObject(content) : content;
  if (!parsed) {
    throw new Error('GLM returned invalid JSON content.');
  }

  const filters = {
    platform: normalizeByOptions(parsed.platform || null, options?.platforms || []),
    architectures: Array.isArray(parsed.architectures)
      ? parsed.architectures.filter((item) =>
          options?.architectures?.length ? options.architectures.includes(item) : true
        )
      : [],
    os: Array.isArray(parsed.os)
      ? parsed.os.filter((item) => (options?.os?.length ? options.os.includes(item) : true))
      : [],
    status: normalizeByOptions(parsed.status || null, options?.statuses || []),
    mustBeReservable: typeof parsed.mustBeReservable === 'boolean' ? parsed.mustBeReservable : null,
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 6) : []
  };

  return {
    filters,
    reasoning: parsed.reasoning || 'Parsed by GLM.'
  };
}

async function parseFilters(query, options) {
  if (!query) {
    return {
      filters: {
        platform: null,
        architectures: [],
        os: [],
        status: null,
        mustBeReservable: null,
        keywords: []
      },
      reasoning: 'No query provided.'
    };
  }

  if (!GLM_API_KEY) {
    return parseByHeuristic(query, options);
  }

  try {
    return await parseWithGlm(query, options);
  } catch (error) {
    const fallback = parseByHeuristic(query, options);
    return {
      ...fallback,
      reasoning: `${fallback.reasoning} GLM error: ${error.message || 'unknown error'}`
    };
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    writeJson(res, 400, { error: 'Bad request' });
    return;
  }

  if (req.method === 'OPTIONS') {
    writeJson(res, 204, {});
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    writeJson(res, 200, {
      ok: true,
      model: GLM_MODEL,
      glmConfigured: Boolean(GLM_API_KEY),
      mode: 'parse-only'
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/agent/parse') {
    try {
      const payload = await readBody(req);
      const query = String(payload.query || '').trim();
      const options = payload.options || {};

      const parsed = await parseFilters(query, options);

      writeJson(res, 200, {
        status: 'success',
        data: {
          parsedFilters: parsed.filters,
          reasoning: parsed.reasoning
        }
      });
    } catch (error) {
      writeJson(res, 500, {
        status: 'error',
        message: error.message || 'Unknown error'
      });
    }
    return;
  }

  writeJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`Agent service is running on http://${HOST}:${PORT}`);
  console.log('Mode: parse-only (no target data in agent)');
  if (!GLM_API_KEY) {
    console.log('GLM_API_KEY is not set. Heuristic parser will be used.');
  }
});
