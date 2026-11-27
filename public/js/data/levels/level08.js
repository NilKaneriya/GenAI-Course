// Level 8 — AI Application Development, APIs, and Tool Use (Agent Harbor)
export default {
  id: 'l8',
  num: 8,
  title: 'AI Application Development, APIs, and Tool Use',
  region: 'Agent Harbor',
  tagline: 'Where models leave the playground and start doing real work inside your software.',
  overview:
    'So far you have mostly talked to models. This level turns them into components of real applications: calling them over HTTP, keeping API keys safe behind your own backend, streaming answers to users, letting the model call your functions as tools, and keeping the whole system affordable and reliable when traffic grows.',
  objectives: [
    'Build a model API request and interpret every important field of the response',
    'Design a backend proxy that keeps API keys off the client and controls who can use it',
    'Explain how streaming works and why it improves perceived latency',
    'Implement a tool-calling loop that validates arguments before executing anything',
    'Estimate cost and handle rate limits with backoff, timeouts, and agent step limits',
  ],
  skills: ['apis', 'tools', 'deployment'],
  missions: [
    {
      id: 'l8m1',
      title: 'Calling a model through an API',
      goal: 'Write a model API request and read the content, stop reason, and token usage of the response.',
      minutes: 14,
      skill: 'apis',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'A model is an HTTP endpoint',
          body:
            'Your application sends an HTTPS **POST** request with a JSON body to the provider’s endpoint and gets JSON back. Client libraries are thin wrappers around that same request, so anything that can make HTTP calls — Python’s `requests` (Level 2) or JavaScript’s `fetch` — can call a model.\n\n```javascript\nconst reply = await client.generate({\n  model: "general-chat-small",\n  messages: [{ role: "user", content: "Hi!" }],\n  maxTokens: 200,\n});\n```\n\nEach request is **stateless**: the server does not remember earlier calls. If the model should see the conversation so far, your app must send that history again every time.',
        },
        {
          h: 'Anatomy of a request',
          body:
            '- **model**: which model runs the request. Larger models are usually more capable but slower and more expensive.\n- **messages**: a list of `{ role, content }` objects. The `system` message sets rules and behaviour, `user` messages are what the person typed, and `assistant` messages hold the model’s earlier replies.\n- **max tokens**: a hard cap on output length, and therefore on output cost.\n- **temperature**: how random sampling is (Level 1).\n\nField names differ slightly between providers, but these four ideas appear everywhere.',
        },
        {
          h: 'Anatomy of a response',
          body:
            '- **content**: the generated text (or, as Mission 4 shows, a request to call a tool).\n- **stop reason**: why generation ended — a natural end, the max-token cap, a stop sequence, or a tool call.\n- **usage**: input and output token counts. Log them; they are your bill.\n\nAlways check the stop reason. An answer that stopped at the token cap is **truncated**: a summary ends mid-sentence, and JSON cut off mid-object will fail to parse.',
        },
      ],
      terms: [
        { term: 'API endpoint', def: 'A URL that accepts requests and returns responses; for a model, the place you POST messages to.' },
        { term: 'Message role', def: 'A label (system, user, assistant) that tells the model who wrote each message.' },
        { term: 'Stop reason', def: 'The field explaining why generation ended, such as a natural end or hitting the token cap.' },
        { term: 'Token usage', def: 'The input and output token counts reported with each response, used for billing.' },
        { term: 'Stateless', def: 'Keeping no memory between requests; all needed context must be sent each time.' },
      ],
      example: {
        title: 'One request and response as raw HTTP',
        lang: 'text',
        code:
          'POST https://api.example-ai.com/v1/generate\nAuthorization: Bearer <value of AI_API_KEY, added by your server>\nContent-Type: application/json\n\n{\n  "model": "general-chat-medium",\n  "messages": [\n    { "role": "system", "content": "You are a concise support assistant." },\n    { "role": "user", "content": "How do I reset my password?" }\n  ],\n  "max_tokens": 300,\n  "temperature": 0.2\n}\n\n--- response (200 OK) ---\n{\n  "content": "Open Settings, choose Security, then select Reset password.",\n  "stop_reason": "end",\n  "usage": { "input_tokens": 31, "output_tokens": 14 }\n}',
        note: 'The key travels in a header, never in the URL or the message text. Read stop_reason and usage on every response: one tells you whether the answer is complete, the other what it cost.',
      },
      check: [
        {
          id: 'l8m1-p1', type: 'mc',
          q: 'Where should a rule like "Always answer formally and never give legal advice" go in the request?',
          options: [
            'In an assistant message, so the model believes it already agreed',
            'In the max tokens field',
            'In the system message, which sets behaviour for the whole conversation',
            'Nowhere; models follow such rules by default',
          ],
          answer: 2,
          explain: 'The system message is designed for persistent instructions and rules. Assistant messages represent what the model said earlier, not instructions to it.',
          topic: 'l8m1',
        },
        {
          id: 'l8m1-p2', type: 'mc',
          q: 'A response arrives with stop reason "max_tokens", and your JSON parser throws an error. What happened?',
          options: [
            'The output hit the token cap and was cut off mid-object; raise the cap or ask for less output',
            'The API key expired halfway through the response',
            'The temperature was too high for JSON',
            'The model refused the request',
          ],
          answer: 0,
          explain: 'A max-token stop reason means generation was cut off, so the JSON is incomplete. Give the answer more room or request a smaller output.',
          topic: 'l8m1',
        },
        {
          id: 'l8m1-p3', type: 'short',
          q: 'Which part of the response would you log to track what each request costs, and why?',
          keywords: [['usage', 'token'], ['cost', 'bill', 'price', 'pay', 'charge', 'spend', 'money']],
          min: 2,
          sample: 'Log the usage field — input and output token counts — because providers bill per token, so those counts determine the cost of each request.',
          explain: 'The usage block reports input and output tokens, which is exactly what you are billed for.',
          topic: 'l8m1',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l8m2',
      title: 'Protecting API keys',
      goal: 'Design a backend proxy that keeps the API key secret and stops strangers from spending your budget.',
      minutes: 14,
      skill: 'deployment',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'A leaked key is an emergency',
          body:
            'An API key works like a password that is attached to your billing account. Anyone who has it can make requests as you: running up costs, using up your rate limits, or abusing the service in your name.\n\nAutomated bots constantly scan public code repositories and website bundles for strings that look like keys. A leaked key can be found and abused within minutes.',
        },
        {
          h: 'Keys live on the server',
          body:
            'Anything shipped to a browser or mobile app can be read by its user: minified JavaScript, network requests, app binaries. A "hidden" frontend variable is not hidden.\n\n- Store keys in **environment variables** (Level 2) or a **secret manager**, read by server code at runtime.\n- Keep `.env` files out of version control with `.gitignore`; commit a `.env.example` with placeholder values instead.\n- Use separate keys for development and production so one leak does not expose both.',
        },
        {
          h: 'The backend proxy pattern',
          body:
            'The browser calls **your** endpoint, such as `POST /api/chat`. Your server checks who the user is, adds the secret key, calls the model API, and returns only what the client needs.\n\nA good proxy also:\n- **authenticates** users, so strangers cannot use your endpoint as a free model;\n- applies **per-user rate limits** (for example 20 requests per minute) and a max-token cap;\n- fixes the model and system prompt on the server instead of accepting them from the client.',
        },
        {
          h: 'If a key leaks',
          body:
            '**Rotate** it at once: create a new key, deploy it, then revoke the old one. Deleting the commit is not enough — the key remains in the repository history and may already have been copied.\n\nAfterwards, check the usage dashboard for unexpected traffic, and set spending limits and alerts so the next incident is caught early.',
        },
      ],
      terms: [
        { term: 'API key', def: 'A secret string that identifies your account to a service and authorizes billable requests.' },
        { term: 'Secret manager', def: 'A service that stores secrets encrypted and hands them to authorized servers at runtime.' },
        { term: 'Backend proxy', def: 'Your own server endpoint that sits between the client and the model API, holding the key and enforcing rules.' },
        { term: 'Key rotation', def: 'Replacing a key with a new one and revoking the old key, especially after a suspected leak.' },
      ],
      example: {
        title: 'A minimal proxy endpoint',
        lang: 'javascript',
        code:
          '// server.js: runs on your server, never in the browser\nconst client = createClient({ apiKey: process.env.AI_API_KEY });\n\napp.post("/api/chat", requireLogin, rateLimit({ perMinute: 20 }), async (req, res) => {\n  const userText = String(req.body.message || "").slice(0, 4000);\n  const reply = await client.generate({\n    model: "general-chat-small",        // chosen by the server, not the client\n    messages: [\n      { role: "system", content: SYSTEM_PROMPT },\n      { role: "user", content: userText },\n    ],\n    maxTokens: 500,                     // caps cost per request\n  });\n  res.json({ text: reply.content });     // send back only what the UI needs\n});',
        note: 'The browser only ever sees /api/chat. The key, the model choice, the system prompt, and the token cap stay on the server, where users cannot read or change them.',
      },
      check: [
        {
          id: 'l8m2-p1', type: 'mc',
          q: 'A developer stores the API key in a frontend build variable that gets inlined into the JavaScript bundle. Is the key safe?',
          options: [
            'Yes, because the bundle is minified and hard to read',
            'Yes, because build variables are never sent to users',
            'No, because anyone can open the bundle or watch network requests and copy it',
            'Only if the site is served over HTTPS',
          ],
          answer: 2,
          explain: 'Everything in a frontend bundle is delivered to every visitor. Minification is not encryption, and HTTPS only protects data in transit, not from the user who receives it.',
          topic: 'l8m2',
        },
        {
          id: 'l8m2-p2', type: 'mc',
          q: 'You pushed a key to a public repository and deleted the commit ten minutes later. What is the right next step?',
          options: [
            'Nothing; the commit no longer exists',
            'Make the repository private and keep using the key',
            'Rename the environment variable so the key is harder to recognize',
            'Rotate the key: create a new one, deploy it, revoke the old one, then check usage for abuse',
          ],
          answer: 3,
          explain: 'The key may already have been copied by scanners, and it still exists in history and forks. Only revoking it makes it useless.',
          topic: 'l8m2',
        },
        {
          id: 'l8m2-p3', type: 'short',
          q: 'The key is safely on your server. Why should your proxy endpoint still require login and per-user rate limits?',
          keywords: [['anyone', 'stranger', 'abuse', 'attacker', 'free', 'misuse', 'public', 'bot', 'unauthori'], ['cost', 'bill', 'spend', 'quota', 'expens', 'money', 'charg', 'budget', 'usage']],
          min: 2,
          sample: 'Without login and limits, anyone who finds the endpoint can use it as a free model, running up your bill and exhausting your quota.',
          explain: 'Hiding the key is not enough: an open proxy lets anyone spend your money through it. Authentication and per-user limits close that hole.',
          topic: 'l8m2',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l8m3',
      title: 'Streaming responses',
      goal: 'Explain how streaming delivers output as it is generated and handle partial output and cancellation.',
      minutes: 13,
      skill: 'apis',
      visual: 'streaming',
      visualCaption:
        'Run the same prompt with streaming on and off. Compare time to first token with total time: the total barely changes, but the wait before anything appears drops sharply.',
      sections: [
        {
          h: 'Why waiting feels slow',
          body:
            'A model generates tokens one at a time, often a few dozen per second. A 600-token answer can take 10–20 seconds to finish. Without streaming, the user stares at a spinner the whole time and then receives a wall of text.\n\nWith **streaming**, the server forwards each piece of text as soon as it is generated, so words start appearing within a second or so and the user can begin reading immediately.',
        },
        {
          h: 'Two latency numbers',
          body:
            '- **Time to first token (TTFT)**: how long until the first piece arrives. Driven mostly by input length, model size, and queueing.\n- **Total latency**: how long until the last token. Driven mostly by how many output tokens are generated.\n\nStreaming improves the **perceived** wait; it does not make total generation faster. To cut total time, generate fewer tokens or use a faster model (Mission 5).',
        },
        {
          h: 'Streaming on the wire',
          body:
            'Most model APIs stream with **server-sent events (SSE)**: one HTTP response that stays open while the server writes small `data:` lines, one per event (simplified here):\n\n```text\ndata: {"type":"delta","text":"Open Settings"}\ndata: {"type":"delta","text":", then Security"}\ndata: {"type":"done","stop_reason":"end","usage":{"output_tokens":42}}\n```\n\nEach event carries a **delta** — only the new chunk, not the whole answer so far. Your code appends deltas to a buffer and re-renders. The final event carries the stop reason and token usage.',
        },
        {
          h: 'Partial output and cancellation',
          body:
            'With streaming you show text before you know how it ends. Plan for that:\n\n- Render partial text as plain text. Parse JSON or run output checks on the **complete** answer, or use a parser built for streams.\n- Offer a **Stop** button that aborts the HTTP request, so generation can end early instead of producing tokens nobody will read.\n- If the connection drops mid-answer, keep what arrived, mark it as incomplete, and offer a retry.',
        },
      ],
      terms: [
        { term: 'Streaming', def: 'Sending output to the client piece by piece while it is still being generated.' },
        { term: 'Server-sent events (SSE)', def: 'A standard way for a server to push a sequence of text events over one open HTTP response.' },
        { term: 'Delta', def: 'A streamed event containing only the newly generated chunk of output.' },
        { term: 'Time to first token (TTFT)', def: 'The delay between sending a request and receiving the first piece of output.' },
      ],
      example: {
        title: 'Consuming a stream with a Stop button',
        lang: 'javascript',
        code:
          'let answer = "";\nconst controller = new AbortController();\nstopButton.onclick = () => controller.abort();   // user can cancel\n\nconst stream = client.stream(\n  { model: "general-chat-small", messages, maxTokens: 600 },\n  { signal: controller.signal }\n);\n\nfor await (const event of stream) {\n  if (event.type === "delta") {\n    answer += event.text;      // append only the new chunk\n    render(answer);            // show the growing answer\n  } else if (event.type === "done") {\n    logUsage(event.usage);     // usage arrives at the end\n  }\n}',
        note: 'Each event adds a small delta to the buffer. The abort signal lets the user stop a long answer, and token usage only arrives in the final event, so log it there.',
      },
      check: [
        {
          id: 'l8m3-p1', type: 'mc',
          q: 'After you enable streaming, users say the app "feels much faster", yet logs show total response time is unchanged. What explains both?',
          options: [
            'Streaming silently switches to a smaller, faster model behind the scenes',
            'Streaming caches popular answers and replays them to other users',
            'The logs are wrong, because streaming always halves total generation time',
            'Streaming cuts the time to first token, so the wait feels shorter, while total generation time stays about the same',
          ],
          answer: 3,
          explain: 'Streaming changes when the user starts seeing output, not how long the model takes to generate all of it.',
          topic: 'l8m3',
        },
        {
          id: 'l8m3-p2', type: 'mc',
          q: 'Your app streams a JSON object and calls JSON.parse on every delta. It throws errors constantly. What is the fix?',
          options: [
            'Accumulate the deltas and parse once the final event arrives, or use a streaming-aware parser',
            'Lower the temperature so each delta is valid JSON on its own',
            'Parse only the first delta and ignore the rest',
            'Remove the max tokens limit',
          ],
          answer: 0,
          explain: 'A delta is a fragment such as {"na — never valid JSON on its own. Parse the accumulated text when the stream is complete.',
          topic: 'l8m3',
        },
        {
          id: 'l8m3-p3', type: 'short',
          q: 'Why should a Stop button abort the underlying request instead of just hiding the text on screen?',
          keywords: [['keep', 'continu', 'still', 'generat', 'running', 'background'], ['cost', 'pay', 'bill', 'waste', 'resource', 'compute', 'token', 'money']],
          min: 2,
          sample: 'If you only hide the text, the server keeps generating tokens in the background that you still pay for; aborting the request lets generation stop and avoids the waste.',
          explain: 'Hiding output does not stop generation. Aborting the request ends it, which saves tokens, cost, and server capacity.',
          topic: 'l8m3',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l8m4',
      title: 'Tool and function calling',
      goal: 'Define a tool, run the tool-calling loop, and validate every tool call before executing it.',
      minutes: 20,
      skill: 'tools',
      visual: 'toolCalling',
      visualCaption:
        'Step through a full round trip. At each step, notice who acts: the model only proposes a call; your code validates it, runs it, and sends the result back.',
      sections: [
        {
          h: 'Giving the model hands',
          body:
            'On its own a model can only produce text. **Tool calling** (also called function calling) lets it ask your application to do something: look up an order, search documents, run a calculation.\n\nYou describe the available tools in the request. When the model decides a tool would help, it responds with a **tool call** — a tool name plus arguments as JSON — instead of a final answer.\n\nThe model never runs anything itself. **Your code** decides whether and how to execute the call.',
        },
        {
          h: 'Defining a tool',
          body:
            'Each tool definition has:\n\n- a **name**, such as `get_order_status`;\n- a **description** of what it does and when to use it — the model reads this, so write it like a prompt;\n- **parameters** described with JSON Schema (Level 6): types, required fields, allowed values.\n\nClear descriptions and tight schemas are the biggest levers on whether the model picks the right tool with sensible arguments.',
        },
        {
          h: 'The tool loop',
          body:
            '1. Send the messages plus the tool definitions.\n2. If the response is a tool call, **validate** the arguments, run the matching function, and append the call and its result to the messages.\n3. Call the model again with the updated messages.\n4. Repeat until the model returns a final text answer, or a step limit is reached (Mission 5).\n\nOne user question can trigger several tool calls — for example, look up the order, then check the shipping carrier — before the final answer.',
        },
        {
          h: 'Trust nothing the model proposes',
          body:
            'Treat tool arguments like untrusted user input:\n\n- Check the tool exists and required arguments are present with the right types.\n- Enforce permissions: may **this user** see order 123?\n- Allowlist actions; never pass model output straight into a shell, `eval`, or raw SQL.\n- Require human confirmation before actions that spend money, delete data, or contact people.\n\nWhen validation fails, send the error back as the tool result so the model can correct itself.',
        },
      ],
      terms: [
        { term: 'Tool calling', def: 'A feature where the model returns a structured request for your code to run a named function with arguments.' },
        { term: 'Tool definition', def: 'A name, description, and JSON Schema for parameters that tells the model a tool exists and how to call it.' },
        { term: 'Tool call', def: 'The model’s structured output naming a tool and the arguments it wants to pass.' },
        { term: 'Tool result', def: 'The output of running the tool, sent back to the model so it can continue.' },
      ],
      example: {
        title: 'A tool definition and one round trip',
        lang: 'json',
        code:
          '{\n  "tools": [\n    {\n      "name": "get_order_status",\n      "description": "Look up the shipping status of one order. Use when the user asks where an order is.",\n      "parameters": {\n        "type": "object",\n        "properties": {\n          "order_id": { "type": "string", "description": "Order number such as A1234" }\n        },\n        "required": ["order_id"]\n      }\n    }\n  ],\n  "step_1_model_returns": {\n    "tool_call": { "id": "call_1", "name": "get_order_status", "arguments": { "order_id": "A1234" } }\n  },\n  "step_2_your_code_sends_back": {\n    "tool_result": { "call_id": "call_1", "content": { "status": "shipped", "eta_days": 2 } }\n  },\n  "step_3_model_answers": "Your order A1234 has shipped and should arrive in about 2 days."\n}',
        note: 'Field names differ between providers, but the shape is the same: definitions go in, a structured call comes out, your result goes back with a matching id, and the model writes the final answer.',
      },
      check: [
        {
          id: 'l8m4-p1', type: 'mc',
          q: 'In a tool-calling flow, who actually executes the get_order_status function?',
          options: [
            'The model, inside the provider’s servers',
            'The JSON Schema validator',
            'Your application code, after it receives and validates the tool call',
            'The user’s browser, automatically',
          ],
          answer: 2,
          explain: 'The model only proposes the call as structured output. Your application chooses whether to run it, runs it, and returns the result.',
          topic: 'l8m4',
        },
        {
          id: 'l8m4-p2', type: 'mc',
          q: 'User 17 is logged in. The model returns a tool call delete_account with { "user_id": "42" }. What should your code do?',
          options: [
            'Refuse it: check permissions against the logged-in user and require explicit confirmation for destructive actions',
            'Run it, because the model chose it',
            'Run it, but log a warning for later review',
            'Retry the request with a higher temperature',
          ],
          answer: 0,
          explain: 'Model output is untrusted. Authorization must be checked in code against the real user, and destructive actions need explicit human confirmation.',
          topic: 'l8m4',
        },
        {
          id: 'l8m4-p3', type: 'mc',
          q: 'The model keeps choosing search_docs when it should call get_order_status. Which change is most likely to help?',
          options: [
            'Increase max tokens',
            'Remove the required fields from both schemas',
            'Turn off streaming',
            'Rewrite the tool descriptions to state clearly what each tool does and when to use it',
          ],
          answer: 3,
          explain: 'The model picks tools largely from their names and descriptions. Specific "use this when…" guidance is the most direct fix.',
          topic: 'l8m4',
        },
      ],
      challengeId: 'c-l8-1',
    },
    {
      id: 'l8m5',
      title: 'Cost, latency, rate limits, and reliability',
      goal: 'Estimate request cost, handle HTTP 429 with backoff, and guard agent loops with timeouts and step limits.',
      minutes: 18,
      skill: 'deployment',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'Estimating and cutting cost',
          body:
            'Providers price **input** and **output** tokens separately, usually per million tokens, and output tokens typically cost several times more.\n\n`cost = input_tokens × input_price / 1,000,000 + output_tokens × output_price / 1,000,000`\n\nExample: 2,000 requests a day × 1,500 input tokens at $0.50 per million = $1.50 a day for input. Common savings:\n- **Shorter prompts**: trim instructions and retrieve fewer chunks.\n- **Caching**: reuse answers to repeated questions; some providers also discount repeated long prompt prefixes.\n- **Smaller models** for easy steps such as classification or routing.\n- **Batching**: cheaper asynchronous processing for jobs that are not urgent.',
        },
        {
          h: 'Rate limits and HTTP 429',
          body:
            'Providers cap requests and tokens per minute. Exceed the cap and you receive **HTTP 429 Too Many Requests**; an overloaded server returns 5xx errors. Both are usually temporary, so retry — carefully:\n\n- **Exponential backoff**: wait 0.5 s, 1 s, 2 s, 4 s… up to a maximum.\n- **Jitter**: randomize each wait so thousands of clients do not retry at the same instant and cause a new spike.\n- Honour a `Retry-After` header when the server sends one, and stop after a retry limit.\n- Do **not** retry errors like 400 (bad request) or 401 (invalid key); they will fail again.',
        },
        {
          h: 'Speeding things up',
          body:
            '- Use smaller, faster models for simple steps.\n- Generate fewer output tokens: ask for concise answers and set max tokens.\n- Run independent calls in parallel instead of one after another.\n- Cache results that do not change.\n- Stream long answers to improve the perceived wait (Mission 3).',
        },
        {
          h: 'Timeouts and step limits',
          body:
            'Every model call needs a **timeout**, so a hung connection fails cleanly instead of freezing your app.\n\nAgent-style tool loops need extra guards:\n- a **maximum number of steps**, such as 8 model calls per user request;\n- a **budget** for total tokens or cost per request;\n- detection of repeated identical tool calls.\n\nWhen a guard trips, stop and return a helpful partial answer or hand off to a human, instead of looping and spending forever.',
        },
      ],
      terms: [
        { term: 'Rate limit', def: 'A cap on how many requests or tokens a client may use per time window.' },
        { term: 'HTTP 429', def: 'The "Too Many Requests" status code returned when a rate limit is exceeded.' },
        { term: 'Exponential backoff', def: 'Retrying after waits that double each attempt, up to a maximum.' },
        { term: 'Jitter', def: 'Random variation added to retry delays so many clients do not retry at the same moment.' },
        { term: 'Step limit', def: 'A maximum number of model calls or tool iterations an agent may take for one request.' },
      ],
      example: {
        title: 'Retries with backoff and an agent loop with a step limit',
        lang: 'javascript',
        code:
          'async function callWithRetry(request, retries = 4) {\n  for (let attempt = 0; ; attempt++) {\n    try {\n      return await client.generate(request, { timeoutMs: 30000 });\n    } catch (err) {\n      const retryable = err.status === 429 || err.status >= 500;\n      if (!retryable || attempt >= retries) throw err;\n      const delay = Math.min(500 * 2 ** attempt, 8000);\n      await sleep(delay / 2 + Math.random() * (delay / 2));   // backoff + jitter\n    }\n  }\n}\n\nasync function runAgent(messages, toolDefs, registry, maxSteps = 8) {\n  for (let step = 0; step < maxSteps; step++) {\n    const reply = await callWithRetry({ model: "general-chat-small", messages, tools: toolDefs });\n    if (!reply.toolCall) return reply.content;                // final answer\n    const result = runToolCall(reply.toolCall, registry);     // validated: see the challenge\n    messages.push({ role: "assistant", toolCall: reply.toolCall });\n    messages.push({ role: "tool", content: JSON.stringify(result) });\n  }\n  return "Sorry, I could not finish this request. A teammate will follow up.";\n}',
        note: 'Only 429 and 5xx errors are retried, every attempt has a timeout, and the agent stops after maxSteps no matter what the model wants. These three guards prevent most runaway costs.',
      },
      check: [
        {
          id: 'l8m5-p1', type: 'mc',
          q: 'During a traffic spike, your app starts receiving HTTP 429 from the model API. Which response is best?',
          options: [
            'Retry immediately in a tight loop until it succeeds',
            'Retry with exponential backoff and jitter, honour Retry-After, and stop after a retry limit',
            'Treat it as a permanent failure and disable the feature for the day',
            'Switch to a fresh API key on every request to get around the limit',
          ],
          answer: 1,
          explain: '429 is temporary. Backing off with jitter lets the limit recover without causing synchronized retry spikes; a retry cap keeps failures bounded.',
          topic: 'l8m5',
        },
        {
          id: 'l8m5-p2', type: 'mc',
          q: 'Input costs $1 per million tokens and output costs $4 per million. One request uses 2,000 input and 500 output tokens. What does it cost?',
          options: ['$0.004', '$0.0025', '$0.01', '$4.00'],
          answer: 0,
          explain: 'Input: 2,000 × $1 / 1,000,000 = $0.002. Output: 500 × $4 / 1,000,000 = $0.002. Total: $0.004.',
          topic: 'l8m5',
        },
        {
          id: 'l8m5-p3', type: 'short',
          q: 'Why do retrying clients add random jitter to their backoff delays?',
          keywords: [['random', 'jitter', 'spread', 'vary', 'differ', 'stagger', 'desynchron'], ['same', 'simultaneous', 'at once', 'together', 'spike', 'synchron', 'stampede', 'herd', 'overload', 'burst', 'collid', 'lockstep']],
          min: 2,
          sample: 'Without jitter, many clients that failed together would all retry at the same moment and create a new spike; random delays spread the retries out.',
          explain: 'Jitter desynchronizes clients so their retries do not arrive as one burst that triggers the rate limit again.',
          topic: 'l8m5',
        },
      ],
      challengeId: 'c-l8-2',
    },
  ],
  challenges: [
    {
      id: 'c-l8-1', levelId: 'l8', missionId: 'l8m4', kind: 'code', lang: 'javascript',
      title: 'Safe tool-call runner', skill: 'tools',
      prompt:
        'Write `runToolCall(call, tools)`: the safety gate between a model’s tool call and your real functions.\n\n- `call` looks like `{ name: "add", arguments: { a: 2, b: 3 } }`. The `arguments` property may be missing; treat it as `{}`.\n- `tools` maps tool names to `{ required: [...argument names], fn }`, where `fn` receives the arguments object and returns a result.\n\nReturn `{ ok: false, error: "..." }` when:\n1. `call.name` is not one of the tool names in `tools` (tip: `Object.hasOwn(tools, call.name)` — a plain `tools[name]` lookup also finds built-in names like `toString`);\n2. any name in `required` is missing from the arguments (a value of `undefined` counts as missing; `0`, `""` and `false` are present);\n3. `fn` throws an error.\n\nOtherwise return `{ ok: true, result }` where `result` is `fn(arguments)`.\n\nThe error message wording is up to you; tests check only `ok` and `result`.',
      starter:
        'function runToolCall(call, tools) {\n  // 1. Is call.name really one of your tools?\n  // 2. Are all required arguments present (not undefined)?\n  // 3. Run the tool, catching any error\n}\n\nconst demoTools = {\n  add: { required: ["a", "b"], fn: (args) => args.a + args.b },\n};\nconsole.log(runToolCall({ name: "add", arguments: { a: 2, b: 3 } }, demoTools)); // { ok: true, result: 5 }\n',
      solution:
        'function runToolCall(call, tools) {\n  if (!call || !Object.hasOwn(tools, call.name)) {\n    return { ok: false, error: "Unknown tool: " + (call && call.name) };\n  }\n  const tool = tools[call.name];\n  const args = call.arguments || {};\n  for (const key of tool.required || []) {\n    if (args[key] === undefined) {\n      return { ok: false, error: "Missing required argument: " + key };\n    }\n  }\n  try {\n    return { ok: true, result: tool.fn(args) };\n  } catch (err) {\n    return { ok: false, error: String((err && err.message) || err) };\n  }\n}',
      hints: [
        'Work through three guards in order, returning `{ ok: false, error }` as soon as one fails: unknown tool, missing required argument, then run the function inside `try { ... } catch (err) { ... }`.',
        'Use `Object.hasOwn(tools, call.name)` and `const args = call.arguments || {}`. Loop over `tool.required` and check `args[key] === undefined` — not `!args[key]`, which wrongly rejects 0 and empty strings.',
      ],
      tests: [
        { call: '(r => [r.ok, r.result])(runToolCall({ name: "add", arguments: { a: 2, b: 3 } }, { add: { required: ["a", "b"], fn: (x) => x.a + x.b } }))', expect: [true, 5] },
        { call: 'runToolCall({ name: "delete_everything", arguments: {} }, { add: { required: [], fn: () => 1 } }).ok', expect: false },
        { call: 'runToolCall({ name: "get_weather", arguments: { unit: "C" } }, { get_weather: { required: ["city"], fn: (x) => x.city } }).ok', expect: false },
        { call: '(r => [r.ok, r.result])(runToolCall({ name: "ping" }, { ping: { required: [], fn: () => "pong" } }))', expect: [true, 'pong'] },
        { call: '(r => [r.ok, r.result])(runToolCall({ name: "double", arguments: { n: 0 } }, { double: { required: ["n"], fn: (x) => x.n * 2 } }))', expect: [true, 0] },
        { call: 'runToolCall({ name: "toString", arguments: {} }, { add: { required: [], fn: () => 1 } }).ok', expect: false },
        { call: 'runToolCall({ name: "boom", arguments: {} }, { boom: { required: [], fn: () => { throw new Error("database down"); } } }).ok', expect: false },
      ],
    },
    {
      id: 'c-l8-2', levelId: 'l8', missionId: 'l8m5', kind: 'code', lang: 'javascript',
      title: 'Exponential backoff schedule', skill: 'deployment',
      prompt:
        'When a model API returns HTTP 429 or a 5xx error, a client waits and retries, doubling the wait each time up to a cap.\n\nWrite `backoffDelays(retries, baseMs, maxMs)` that returns an array of `retries` delays in milliseconds, where delay `i` (starting at 0) is `min(baseMs × 2^i, maxMs)`.\n\nExample: `backoffDelays(5, 100, 1000)` → `[100, 200, 400, 800, 1000]`.\n\nIf `retries` is 0 or negative, return an empty array.\n\n**Note:** real systems also add random **jitter** to each delay so that many clients do not retry in lockstep. Jitter is deliberately left out here so your function is deterministic and can be tested; in production you would apply it afterwards, for example `delay / 2 + Math.random() * (delay / 2)`.',
      starter:
        'function backoffDelays(retries, baseMs, maxMs) {\n  // delay i = min(baseMs * 2^i, maxMs), for i = 0 .. retries - 1\n}\n\nconsole.log(backoffDelays(5, 100, 1000)); // [100, 200, 400, 800, 1000]\n',
      solution:
        'function backoffDelays(retries, baseMs, maxMs) {\n  const delays = [];\n  for (let i = 0; i < retries; i++) {\n    delays.push(Math.min(baseMs * 2 ** i, maxMs));\n  }\n  return delays;\n}',
      hints: [
        'Start with an empty array and loop `i` from 0 while `i < retries`. A loop that never runs naturally handles 0 or negative retries.',
        'Inside the loop push `Math.min(baseMs * 2 ** i, maxMs)`. `2 ** i` is 1, 2, 4, 8, …',
      ],
      tests: [
        { call: 'backoffDelays(5, 100, 1000)', expect: [100, 200, 400, 800, 1000] },
        { call: 'backoffDelays(0, 100, 1000)', expect: [] },
        { call: 'backoffDelays(1, 250, 10000)', expect: [250] },
        { call: 'backoffDelays(6, 1000, 30000)', expect: [1000, 2000, 4000, 8000, 16000, 30000] },
        { call: 'backoffDelays(4, 500, 500)', expect: [500, 500, 500, 500] },
        { call: 'backoffDelays(3, 300, 100)', expect: [100, 100, 100] },
        { call: 'backoffDelays(-2, 100, 1000)', expect: [] },
      ],
    },
  ],
  test: {
    title: 'Agent Harbor Checkpoint',
    intro: 'Eight questions on model APIs, key protection, streaming, tool calling, and running GenAI features reliably.',
    questions: [
      {
        id: 'l8t-q1', type: 'mc',
        q: 'Follow-up questions like "And what about the second one?" get confused answers. Your code sends only the newest user message on each call. Why?',
        options: [
          'The temperature is too high for follow-up questions',
          'The max tokens value is too low',
          'Each request is stateless, so without the earlier messages the model cannot know what "the second one" refers to',
          'The API key belongs to a different project',
        ],
        answer: 2,
        explain: 'Model APIs keep no memory between calls. The app must resend the relevant conversation history in the messages list.',
        topic: 'l8m1',
      },
      {
        id: 'l8t-q2', type: 'mc',
        q: 'A response reports usage of 3,200 input tokens and 150 output tokens. Where does most of the token volume come from, and where would you optimise first?',
        options: [
          'The input: trim the instructions, history, or retrieved context',
          'The output: lower max tokens',
          'Neither: token counts do not affect cost',
          'The stop reason: change it to "end"',
        ],
        answer: 0,
        explain: 'Input tokens outnumber output tokens about 20 to 1 here, so shortening the prompt has the biggest effect even if output tokens cost more each.',
        topic: 'l8m1',
      },
      {
        id: 'l8t-q3', type: 'mc',
        q: 'Which architecture both keeps the API key secret and stops strangers from running up your bill?',
        options: [
          'The browser calls the model API directly with the key in the bundle',
          'The browser calls the model API with the key saved in local storage',
          'The browser calls your backend proxy without any login; the proxy adds the key',
          'The browser calls your backend proxy, which authenticates the user, applies per-user rate limits, and adds the key from a server environment variable',
        ],
        answer: 3,
        explain: 'Only the authenticated, rate-limited proxy does both jobs. An open proxy hides the key but still lets anyone spend your money.',
        topic: 'l8m2',
      },
      {
        id: 'l8t-q4', type: 'mc',
        q: 'A 900-token answer takes 15 seconds to finish with or without streaming. With streaming, the first words appear after 0.7 seconds. What did streaming change?',
        options: [
          'Total latency dropped to 0.7 seconds',
          'Time to first token, and so the perceived wait, dropped; total generation time stayed about the same',
          'The model generated fewer output tokens',
          'The cost of the request dropped by half',
        ],
        answer: 1,
        explain: 'Streaming improves time to first token as the user experiences it. The model still needs roughly the same time to produce all 900 tokens.',
        topic: 'l8m3',
      },
      {
        id: 'l8t-q5', type: 'mc',
        q: 'The model returns a tool call search_flights with { "date": "next friday" }, but your schema requires a date in YYYY-MM-DD format. What should your code do?',
        options: [
          'Execute the call anyway and let the flights API sort it out',
          'Fail the whole request with a 500 error',
          'Return a validation error as the tool result so the model can retry with a corrected argument',
          'Silently replace the date with today’s date',
        ],
        answer: 2,
        explain: 'Validate before executing, and feed the error back as the tool result. Models usually correct the argument on the next step.',
        topic: 'l8m4',
      },
      {
        id: 'l8t-q6', type: 'mc',
        q: 'A step labels 50,000 short support tickets a day as "billing", "bug", or "other". Which change would cut cost the most while keeping the task feasible?',
        options: [
          'Use the largest available model for maximum accuracy',
          'Raise the temperature so the model answers faster',
          'Stream every response to the database',
          'Use a smaller model, cap output to a few tokens, and use batch processing if results are not urgent',
        ],
        answer: 3,
        explain: 'Simple classification rarely needs a large model. A small model, tiny outputs, and cheaper batch processing all reduce cost directly.',
        topic: 'l8m5',
      },
      {
        id: 'l8t-q7', type: 'short',
        q: 'Describe the steps of a tool-calling loop, from the user’s question to the final answer.',
        keywords: [['tool call', 'call', 'request', 'name', 'argument'], ['run', 'execut', 'invoke', 'perform'], ['result', 'output', 'send back', 'return'], ['final', 'answer', 'repeat', 'loop', 'until', 'again']],
        min: 3,
        sample: 'The app sends the messages plus tool definitions; the model replies with a tool call (name and arguments); the app validates and executes the function and sends the result back; this repeats until the model gives a final answer.',
        explain: 'A full answer covers: the model proposes a tool call, your code validates and runs it, the result goes back to the model, and the loop continues until a final answer.',
        topic: 'l8m4',
      },
      {
        id: 'l8t-q8', type: 'short',
        q: 'Your agent sometimes calls the same search tool over and over and never finishes, running up cost. Name two safeguards you would add.',
        keywords: [['step', 'iteration', 'max', 'limit', 'cap'], ['budget', 'cost', 'token', 'timeout', 'time', 'repeat', 'duplicate', 'identical', 'human', 'alert']],
        min: 2,
        sample: 'Add a maximum number of steps per request and a token or cost budget, and detect repeated identical tool calls so the loop stops or hands off to a human.',
        explain: 'Good answers name a step limit plus another guard such as a token/cost budget, a timeout, or repeated-call detection.',
        topic: 'l8m5',
      },
    ],
  },
  boss: {
    id: 'l8b',
    title: 'The Rate-Limit Leviathan',
    story:
      'Launch day at Agent Harbor: your support assistant just went live, and the Leviathan is rising from the logs. Each of its five heads is a real production incident — resolve them before the harbor floods.',
    minutes: 20,
    hp: 5,
    toWin: 4,
    questions: [
      {
        id: 'l8b-q1', type: 'mc',
        q: 'A security scan finds your live model API key inside the JavaScript bundle served to every visitor. Which plan is right?',
        options: [
          'Minify the bundle more aggressively so the key is harder to find',
          'Rotate the key now, move model calls behind a backend proxy that reads the key from server secrets, and review usage for abuse',
          'Rename the variable to something that does not look like a key',
          'Require HTTPS on the website',
        ],
        answer: 1,
        explain: 'The exposed key must be considered compromised: revoke it. The lasting fix is architectural — the key must never reach the client again.',
        topic: 'l8m2',
      },
      {
        id: 'l8b-q2', type: 'mc',
        q: 'Users abandon the chat because nothing appears for 12 seconds, although the answers are good. Logs show the time is spent generating long answers. Which fix targets the problem?',
        options: [
          'Stream the output so text appears as it is generated, and ask for more concise answers with a lower max tokens',
          'Raise the temperature',
          'Add more retrieved documents to each prompt',
          'Send each request three times in parallel and use the first reply',
        ],
        answer: 0,
        explain: 'Streaming fixes the perceived wait; fewer output tokens reduce the real total time. More context or duplicate requests make things slower or costlier.',
        topic: 'l8m3',
      },
      {
        id: 'l8b-q3', type: 'mc',
        q: 'The model calls refund_order with { "order_id": "A77", "amount": "all of it" }. Your schema says amount must be a number no larger than the order total. What should happen?',
        options: [
          'Refund the full order, since that is clearly what the model meant',
          'Pass the string to the payments API and let it decide',
          'Retry the same request until the model returns a number, then refund automatically',
          'Reject the call, return a validation error as the tool result, and require human approval before any refund executes',
        ],
        answer: 3,
        explain: 'Invalid arguments are rejected and reported back. Because refunds move money, a human should approve them even when the arguments are valid.',
        topic: 'l8m4',
      },
      {
        id: 'l8b-q4', type: 'mc',
        q: 'At 9:00 a.m. thousands of clients receive HTTP 429 and all retry exactly 1 second later, causing another spike, again and again. What breaks the pattern?',
        options: [
          'Retry immediately with no delay',
          'Keep the fixed 1-second delay but allow more retries',
          'Exponential backoff with random jitter, honouring Retry-After and capping the number of retries',
          'Create extra API keys to multiply the rate limit',
        ],
        answer: 2,
        explain: 'Growing delays reduce pressure and jitter desynchronizes clients, so retries no longer arrive as one burst. Extra keys to dodge limits typically break provider terms.',
        topic: 'l8m5',
      },
      {
        id: 'l8b-q5', type: 'short',
        q: 'An overnight agent job called the model 4,000 times for a single task because it kept re-running the same tool. Describe two guards you would add to the agent loop.',
        keywords: [['step', 'iteration', 'max', 'limit', 'cap'], ['budget', 'cost', 'token', 'timeout', 'repeat', 'duplicate', 'identical', 'alert', 'human']],
        min: 2,
        sample: 'Add a maximum step limit (for example 8 model calls per task) and a per-task token or cost budget; also detect repeated identical tool calls and stop or escalate to a human.',
        explain: 'A hard step limit plus a budget, timeout, or repeated-call detector stops runaway loops before they burn through your spend.',
        topic: 'l8m5',
      },
    ],
    project: null,
  },
  review: [
    { missionId: 'l8m1', tip: 'Re-read the raw HTTP example and label each field: which ones control the request, and which ones you must check in every response.' },
    { missionId: 'l8m2', tip: 'Sketch the proxy pattern from memory: browser, your endpoint, model API. Mark where the key lives and where login and rate limits run.' },
    { missionId: 'l8m3', tip: 'Replay the streaming visual and write down time to first token and total time for both modes. Explain why only one of them changes.' },
    { missionId: 'l8m4', tip: 'Step through the tool-calling visual and name who acts at each step, then redo the safe tool-call runner challenge.' },
    { missionId: 'l8m5', tip: 'Recompute the cost check question by hand, then redo the backoff challenge and explain where jitter would be added.' },
  ],
};
