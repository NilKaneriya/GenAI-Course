// Free-play playground snippets. JavaScript runs for real; Python outputs are pre-recorded (simulated).
export const SNIPPETS = [
  {
    id: 'js-softmax', lang: 'javascript', title: 'Softmax with temperature',
    code: `// Turn model scores (logits) into probabilities.
function softmax(logits, temperature = 1) {
  const scaled = logits.map((l) => l / temperature);
  const max = Math.max(...scaled);
  const exps = scaled.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

const logits = [2.0, 1.0, 0.1];
for (const t of [0.5, 1, 2]) {
  const p = softmax(logits, t).map((x) => x.toFixed(3));
  console.log("T=" + t, p.join("  "));
}`,
  },
  {
    id: 'js-cosine', lang: 'javascript', title: 'Cosine similarity search',
    code: `function cosine(a, b) {
  const dot = a.reduce((s, x, i) => s + x * b[i], 0);
  const norm = (v) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return dot / (norm(a) * norm(b));
}

// Toy 3-dimensional "embeddings"
const docs = {
  "refund policy": [0.9, 0.1, 0.0],
  "shipping times": [0.1, 0.9, 0.1],
  "reset password": [0.0, 0.1, 0.95],
};
const query = [0.8, 0.3, 0.0]; // "can I get my money back?"

const ranked = Object.entries(docs)
  .map(([name, vec]) => ({ name, score: cosine(query, vec) }))
  .sort((a, b) => b.score - a.score);
console.table(ranked);
console.log("Best match:", ranked[0].name);`,
  },
  {
    id: 'js-template', lang: 'javascript', title: 'Prompt template + JSON validation',
    code: `const template = "You are a support assistant. Classify the ticket.\\nReturn JSON with keys: category, urgency.\\nTicket: {{ticket}}";

function fill(t, vars) {
  return t.replace(/{{(\\w+)}}/g, (_, k) => {
    if (!(k in vars)) throw new Error("Missing variable: " + k);
    return vars[k];
  });
}

const prompt = fill(template, { ticket: "My card was charged twice!" });
console.log(prompt);

// Pretend this came back from a model (simulated response):
const modelText = '{"category": "billing", "urgency": "high"}';
const data = JSON.parse(modelText);
const ok = ["category", "urgency"].every((k) => k in data);
console.log("Valid:", ok, data);`,
  },
  {
    id: 'js-tools', lang: 'javascript', title: 'Tool-call dispatcher (mock model)',
    code: `// A mock tool registry — your code, not the model, executes tools.
const tools = {
  get_weather: { required: ["city"], fn: ({ city }) => ({ city, tempC: 18, sky: "cloudy" }) },
  add: { required: ["a", "b"], fn: ({ a, b }) => a + b },
};

function run(call) {
  const tool = tools[call.name];
  if (!tool) return { ok: false, error: "Unknown tool " + call.name };
  const missing = tool.required.filter((k) => !(k in call.arguments));
  if (missing.length) return { ok: false, error: "Missing " + missing.join(", ") };
  return { ok: true, result: tool.fn(call.arguments) };
}

// Simulated tool calls a model might return:
console.log(run({ name: "get_weather", arguments: { city: "Lisbon" } }));
console.log(run({ name: "add", arguments: { a: 2 } }));
console.log(run({ name: "delete_db", arguments: {} }));`,
  },
  {
    id: 'py-tokens', lang: 'python', title: 'Estimate tokens and cost',
    code: `def estimate_tokens(text: str) -> int:
    return -(-len(text) // 4)  # ceiling division

prompt = "Summarize the following support ticket in two sentences."
doc = "x" * 6000
tokens_in = estimate_tokens(prompt + doc)
tokens_out = 150

price_in, price_out = 0.50, 1.50   # example prices per million tokens
cost = tokens_in / 1e6 * price_in + tokens_out / 1e6 * price_out
print(f"Input tokens: {tokens_in}")
print(f"Estimated cost per request: \${cost:.6f}")
print(f"Cost for 10,000 requests: \${cost * 10_000:.2f}")`,
    output: 'Input tokens: 1514\nEstimated cost per request: $0.000982\nCost for 10,000 requests: $9.82',
  },
  {
    id: 'py-api', lang: 'python', title: 'Call a model API safely (pattern)',
    code: `import os
import json

api_key = os.environ.get("AI_API_KEY")   # never hard-code keys
if not api_key:
    print("Set AI_API_KEY in your environment (or .env file) first.")

payload = {
    "model": "your-model-name",
    "max_tokens": 200,
    "messages": [
        {"role": "system", "content": "You are a concise tutor."},
        {"role": "user", "content": "Explain embeddings in one sentence."},
    ],
}
print(json.dumps(payload, indent=2)[:120] + " ...")
# response = requests.post(API_URL, headers={"Authorization": f"Bearer {api_key}"}, json=payload, timeout=30)`,
    output: 'Set AI_API_KEY in your environment (or .env file) first.\n{\n  "model": "your-model-name",\n  "max_tokens": 200,\n  "messages": [\n    {\n      "role": "system",\n      "content": "You ...',
  },
  {
    id: 'py-rag', lang: 'python', title: 'Tiny retrieval with NumPy',
    code: `import numpy as np

docs = ["Refunds within 30 days", "Track your parcel", "Reset your password"]
doc_vecs = np.array([[0.9, 0.1, 0.0], [0.1, 0.9, 0.1], [0.0, 0.1, 0.95]])
query = np.array([0.8, 0.3, 0.0])

sims = doc_vecs @ query / (np.linalg.norm(doc_vecs, axis=1) * np.linalg.norm(query))
best = np.argsort(-sims)[:2]
for i in best:
    print(f"{sims[i]:.3f}  {docs[i]}")

context = "\\n".join(docs[i] for i in best)
print("PROMPT CONTEXT:\\n" + context)`,
    output: '0.969  Refunds within 30 days\n0.450  Track your parcel\nPROMPT CONTEXT:\nRefunds within 30 days\nTrack your parcel',
  },
];
