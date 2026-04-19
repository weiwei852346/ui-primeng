const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.AGENT_PORT || 8787);
const HOST = process.env.AGENT_HOST || '127.0.0.1';
const GLM_API_KEY = process.env.GLM_API_KEY || '';
const GLM_MODEL = process.env.GLM_MODEL || 'glm-4.5';
const GLM_BASE_URL = process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

function createBoards() {
  const architectures = ['X86_64', 'ARM', 'aarch64', 'riscv64'];
  const operatingSystems = ['Linux', 'Ubuntu', 'Debian', 'VxWorks', 'Harmony', 'Android'];
  const owners = ['admin', 'user1', 'user2', 'user3', 'qa', 'ops'];

  return Array.from({ length: 30 }, (_, i) => {
    const index = i + 1;
    const isVirtual = index % 2 === 0;
    const platform = isVirtual ? 'Virtual' : 'Physical';
    const architecture = architectures[i % architectures.length];
    const os = operatingSystems[i % operatingSystems.length];
    const status = index % 7 === 0 ? 'in_use' : 'available';
    const isReservable = index % 9 !== 0;
    const createdBy = index % 10 === 0 ? '' : owners[i % owners.length];

    return {
      id: String(index),
      name: `${platform}-Target-${String(index).padStart(3, '0')}`,
      barcode: `${isVirtual ? 'VT' : 'PT'}-${String(index).padStart(3, '0')}`,
      target_type: platform,
      createdBy,
      architecture,
      os,
      platform,
      version: isVirtual ? '7.2.0' : '6.0.185',
      favorite: index % 6 === 0,
      is_singleton: index % 5 === 0,
      isReservable,
      status,
      gateway: '127.0.0.1:3000',
      ip: `192.168.10.${index}`,
      user: isVirtual ? 'ubuntu' : 'root',
      pass: 'demo-pass'
    };
  });
}

const boards = createBoards();

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

function parseByHeuristic(query) {
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

  if (lower.includes('reservable') || lower.includes('可预约') || lower.includes('can reserve')) {
    filters.mustBeReservable = true;
  }

  const words = lower
    .replace(/[^a-z0-9\u4e00-\u9fa5\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  filters.keywords = [...new Set(words)].slice(0, 5);

  return {
    filters,
    reasoning: 'Heuristic parser was used because GLM is not configured or did not return valid JSON.'
  };
}

async function parseFiltersWithGlm(query, context) {
  if (!GLM_API_KEY) {
    return parseByHeuristic(query);
  }

  const systemPrompt = [
    'You are a board-filter parser for a target reservation dashboard.',
    'Return JSON only, no markdown.',
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

  const userPrompt = {
    userQuery: query,
    availablePlatforms: ['Physical', 'Virtual'],
    availableArchitectures: ['X86_64', 'ARM', 'aarch64', 'riscv64'],
    availableOs: ['Linux', 'Ubuntu', 'Debian', 'VxWorks', 'Harmony', 'Android'],
    boardCount: context.boardCount
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
        { role: 'user', content: JSON.stringify(userPrompt) }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GLM request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('GLM response did not include a message content.');
  }

  const parsed = typeof content === 'string' ? extractJsonObject(content) : content;
  if (!parsed) {
    throw new Error('GLM returned content that was not valid JSON.');
  }

  return {
    filters: {
      platform: parsed.platform || null,
      architectures: Array.isArray(parsed.architectures) ? parsed.architectures : [],
      os: Array.isArray(parsed.os) ? parsed.os : [],
      status: parsed.status || null,
      mustBeReservable: typeof parsed.mustBeReservable === 'boolean' ? parsed.mustBeReservable : null,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : []
    },
    reasoning: parsed.reasoning || 'Parsed by GLM.'
  };
}

function includesAnyKeyword(board, keywords) {
  if (!keywords.length) return true;
  const haystack = `${board.name} ${board.barcode} ${board.os || ''} ${board.architecture || ''}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(String(keyword).toLowerCase()));
}

function filterBoards({ baseFilters, aiFilters }) {
  return boards
    .filter((board) => {
      if (baseFilters.platformFilter && board.platform !== baseFilters.platformFilter) return false;

      if (baseFilters.searchText) {
        const search = baseFilters.searchText.toLowerCase();
        const hit = board.name.toLowerCase().includes(search) || board.barcode.toLowerCase().includes(search);
        if (!hit) return false;
      }

      if (baseFilters.showFavoritesOnly && !board.favorite) return false;

      if (aiFilters.platform && board.platform !== aiFilters.platform) return false;

      if (aiFilters.architectures.length && !aiFilters.architectures.includes(board.architecture)) return false;

      if (aiFilters.os.length && !aiFilters.os.includes(board.os)) return false;

      if (aiFilters.status && board.status !== aiFilters.status) return false;

      if (aiFilters.mustBeReservable === true && !board.isReservable) return false;

      if (!includesAnyKeyword(board, aiFilters.keywords)) return false;

      return true;
    })
    .sort((a, b) => {
      const score = (board) => {
        let value = 0;
        if (board.status === 'available') value += 3;
        if (board.isReservable) value += 2;
        if (board.createdBy) value += 1;
        if (board.favorite) value += 1;
        return value;
      };
      return score(b) - score(a);
    });
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
      boardCount: boards.length
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/agent/filter') {
    try {
      const payload = await readBody(req);
      const query = String(payload.query || '').trim();
      const baseFilters = {
        platformFilter: payload.platformFilter || null,
        searchText: payload.searchText || '',
        showFavoritesOnly: Boolean(payload.showFavoritesOnly)
      };

      const parseResult = query
        ? await parseFiltersWithGlm(query, { boardCount: boards.length })
        : {
            filters: {
              platform: null,
              architectures: [],
              os: [],
              status: null,
              mustBeReservable: null,
              keywords: []
            },
            reasoning: 'No natural language query provided, only base filters were applied.'
          };

      const targets = filterBoards({
        baseFilters,
        aiFilters: parseResult.filters
      });

      writeJson(res, 200, {
        status: 'success',
        data: {
          total: targets.length,
          reasoning: parseResult.reasoning,
          parsedFilters: parseResult.filters,
          targets
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
  console.log(`Loaded ${boards.length} built-in boards`);
  if (!GLM_API_KEY) {
    console.log('GLM_API_KEY is not set. Heuristic parser will be used.');
  }
});
