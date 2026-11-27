// Level 10 — Capstone Project and Career Portfolio (Launch Summit)
export default {
  id: 'l10',
  num: 10,
  title: 'Capstone Project and Career Portfolio',
  region: 'Launch Summit',
  tagline: 'The final climb: build one real thing, prove it works, and tell its story.',
  overview:
    'Everything from the previous nine levels comes together here. You will scope a capstone that solves a real problem, design and document its architecture, build it with an evaluation-first loop, deploy it safely, and turn it into portfolio evidence that helps you land an AI engineering role.',
  objectives: [
    'Scope a capstone around a real user problem with measurable success criteria',
    'Design an architecture with a backend proxy, model API, retrieval, and an eval harness, and document its risks',
    'Iterate with an eval set, a baseline, and one change at a time while tracking cost and latency',
    'Deploy with managed secrets, monitoring, and rate limits using a launch checklist',
    'Present your project in a README and explain its trade-offs in interviews',
  ],
  skills: ['deployment', 'career', 'evaluation'],
  missions: [
    {
      id: 'l10m1',
      title: 'Choosing and scoping your capstone',
      goal: 'Turn a vague idea into a narrow capstone scope with a named user and measurable success criteria.',
      minutes: 15,
      skill: 'career',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'Start from a real problem',
          body:
            'A strong capstone solves a problem for a specific person, not "a chatbot that does everything". Good sources are repetitive tasks you or people around you already do: answering the same questions, copying data out of documents, sorting incoming requests.\n\nWrite the problem as **who** struggles, with **what**, and **how they cope today**. If you cannot name the user, the scope is not ready.',
        },
        {
          h: 'Narrow beats broad',
          body:
            'Reviewers remember one finished, measured project far better than five half-built demos. Narrow ruthlessly:\n\n- one type of user;\n- one core task;\n- one data source to start with.\n\nYou can widen it later. Aim for something you can build, evaluate, and deploy in three to six weeks of part-time work, and write down what is explicitly **out of scope** for the first version.',
        },
        {
          h: 'Define success before building',
          body:
            'Write two to four **success criteria** you can measure:\n\n- quality: "at least 85% of eval questions answered correctly with valid citations";\n- safety: "declines every out-of-scope question in the eval set";\n- speed and cost: "median response under 4 seconds and under $0.01 per request".\n\nThese become your eval plan (Mission 3) and the headline numbers in your README (Mission 5).',
        },
        {
          h: 'Three proven capstone shapes',
          body:
            '- **Cited-docs RAG assistant**: answers questions about a document set, such as a course handbook or product manuals, with citations, and abstains when unsure. Shows retrieval, grounding, and evaluation.\n- **Structured-data extraction pipeline**: turns messy documents such as invoices or job posts into validated JSON, with accuracy measured per field. Shows structured output and code-based graders.\n- **Tool-using workflow assistant**: completes a multi-step task, such as triaging support tickets, by calling real tools with validation, step limits, and human approval for risky actions.',
        },
      ],
      terms: [
        { term: 'Scope', def: 'The boundaries of a project: which users, tasks, and data are included, and which are not.' },
        { term: 'Success criteria', def: 'Measurable targets that define when the project works well enough.' },
        { term: 'MVP', def: 'Minimum viable product: the smallest version that delivers the core value and can be tested with users.' },
        { term: 'Non-goal', def: 'Something deliberately excluded from scope so effort stays focused.' },
      ],
      example: {
        title: 'A one-page project scope',
        lang: 'text',
        code:
          'Problem:   Students email staff the same handbook questions (deadlines,\n           extensions, grading rules) and wait 2-3 days for replies.\nUser:      Current students, on desktop or phone.\nCore task: Answer handbook questions with a citation to the exact section,\n           or say "not covered, please contact the office".\nData:      The 60-page student handbook (PDF), updated each term.\nOut of scope (v1): personal records, grades, any action beyond answering.\nSuccess:   >= 85% correct with valid citations on a 60-question eval set\n           100% abstention on 15 questions the handbook does not cover\n           median latency < 4 s, cost < $0.01 per question',
        note: 'The scope names one user, one task, one data source, and what is explicitly excluded. Every success criterion is a number you can measure later.',
      },
      check: [
        {
          id: 'l10m1-p1', type: 'mc',
          q: 'Which capstone idea is best scoped?',
          options: [
            'An AI assistant that helps anyone with anything',
            'A pipeline that extracts vendor, date, and total from small-business invoices into validated JSON, measured on 100 labelled invoices',
            'A new foundation model trained from scratch on public data',
            'A chatbot that serves every department of a large company',
          ],
          answer: 1,
          explain: 'It names a user, a single task, a data source, and a way to measure success. The others are too broad or far beyond a capstone’s budget.',
          topic: 'l10m1',
        },
        {
          id: 'l10m1-p2', type: 'short',
          q: 'Rewrite the goal "make the bot accurate" as a measurable success criterion.',
          keywords: [['%', 'percent', 'rate', 'out of', '/', 'score', 'accuracy', 'at least'], ['eval', 'test', 'dataset', 'question', 'case', 'labelled', 'labeled', 'golden', 'benchmark', 'sample']],
          min: 2,
          sample: 'At least 85% of the 60 questions in our eval set are answered correctly with a valid citation.',
          explain: 'A measurable criterion has a number or threshold and says what it is measured on, such as a specific eval set.',
          topic: 'l10m1',
        },
        {
          id: 'l10m1-p3', type: 'mc',
          q: 'Which project shape best demonstrates retrieval, grounding, and abstention?',
          options: [
            'A cited-docs RAG assistant',
            'A structured-data extraction pipeline',
            'An image style-transfer app',
            'A static FAQ web page',
          ],
          answer: 0,
          explain: 'A cited-docs assistant must retrieve passages, ground answers in them, cite them, and decline when they lack the answer.',
          topic: 'l10m1',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l10m2',
      title: 'Designing the architecture',
      goal: 'Draw the components and data flow of a GenAI app and write a short design doc with risks.',
      minutes: 18,
      skill: 'deployment',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'The standard building blocks',
          body:
            'Most capstones combine the same components:\n\n- **Frontend**: the user interface; holds no secrets.\n- **Backend proxy**: authenticates users, rate-limits, builds prompts, and holds the API key (Level 8).\n- **Model API**: the language model, plus an embedding model if you retrieve.\n- **Vector store**: chunks and embeddings for retrieval (Level 7).\n- **Tools**: functions or APIs the model may call, behind validation.\n- **Eval harness**: a script that runs your eval set and reports scores (Level 9).\n- **Logs and traces**: observability for every request.',
        },
        {
          h: 'Trace the data flow',
          body:
            'Draw the path of one request and number the steps:\n\n1. The browser sends the question to `POST /api/ask`.\n2. The backend checks login and the rate limit.\n3. It embeds the question and retrieves the top 5 chunks.\n4. It sends the system prompt, chunks, and question to the model.\n5. It validates the answer (do the citations exist?) and logs a trace.\n6. The answer streams back to the browser.\n\nAlso draw the **offline** paths: document ingestion (chunk, embed, store) and the eval harness.',
        },
        {
          h: 'A one-page design doc',
          body:
            'Before coding, write a short design doc:\n\n- **Goal and non-goals**, taken from your scope.\n- **Architecture diagram** and data flow.\n- **Key decisions** and rejected alternatives, such as "RAG rather than fine-tuning because the handbook changes every term".\n- **Risks and mitigations**: hallucination, prompt injection, cost overruns, PII, rate limits.\n- **Eval plan**: dataset, metrics, and targets.\n\nReviewers and interviewers read this. It shows engineering judgement, not just code.',
        },
      ],
      terms: [
        { term: 'Architecture diagram', def: 'A picture of the system’s components and how they connect.' },
        { term: 'Data flow', def: 'The ordered path data takes through the components for one request or job.' },
        { term: 'Design doc', def: 'A short document describing goals, architecture, decisions, risks, and how success is measured.' },
        { term: 'Eval harness', def: 'A script or service that runs the eval set against the system and reports scores.' },
      ],
      example: {
        title: 'Architecture sketch for a cited-docs assistant',
        lang: 'text',
        code:
          'OFFLINE: ingestion (runs when the handbook changes)\n  handbook.pdf -> chunk -> embed -> [ Vector store ]\n\nONLINE: one question\n  [ Browser ] --1. question--> [ Backend proxy ]   login, rate limit, key from env\n                                     |\n                                     +--2. embed + search--> [ Vector store ]\n                                     +--3. prompt + top-5 chunks--> [ Model API ]\n                                     +--4. check citations, log trace (PII redacted)\n  [ Browser ] <--5. streamed answer--+\n\nQUALITY LOOP\n  [ Eval harness ] --60 questions--> [ Backend proxy ]\n       -> scores: correctness, citation validity, abstention, latency, cost',
        note: 'The browser never touches the model API or the vector store directly, and the eval harness calls the same backend that users do, so it tests the real system.',
      },
      check: [
        {
          id: 'l10m2-p1', type: 'mc',
          q: 'In your architecture, where should the system prompt and the model choice be set?',
          options: [
            'In the frontend, so power users can tweak them',
            'In the vector store, next to the chunks',
            'In the backend proxy, where the client cannot change them',
            'Only in the eval harness',
          ],
          answer: 2,
          explain: 'Anything set in the client can be changed by the client. The backend is where you control prompts, models, and limits.',
          topic: 'l10m2',
        },
        {
          id: 'l10m2-p2', type: 'mc',
          q: 'Which design-doc entry is a well-formed risk?',
          options: [
            '"The AI might be bad sometimes."',
            '"We will use the best model, so risk is low."',
            '"Risks: none identified yet."',
            '"Injected text in uploaded PDFs could make the assistant reveal other users’ data. Mitigation: per-user retrieval filters, no cross-user tools, and injection cases in the eval set."',
          ],
          answer: 3,
          explain: 'A useful risk names a concrete failure, how it could happen, and specific mitigations you can test.',
          topic: 'l10m2',
        },
        {
          id: 'l10m2-p3', type: 'short',
          q: 'Why should the eval harness call your real backend endpoint rather than calling the model API directly?',
          keywords: [['real', 'actual', 'same', 'whole', 'end-to-end', 'end to end', 'full', 'entire', 'production'], ['retriev', 'prompt', 'pipeline', 'system', 'validation', 'component', 'step', 'chunk']],
          min: 2,
          sample: 'Because users experience the whole pipeline — retrieval, prompt building, validation — not just the model. Testing the real endpoint measures the actual system end to end.',
          explain: 'Most failures come from retrieval, prompts, or glue code. Only an end-to-end eval through the real backend catches them.',
          topic: 'l10m2',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l10m3',
      title: 'Build, evaluate, iterate',
      goal: 'Improve a GenAI app with an eval set, a baseline, and one controlled change at a time, while tracking cost and latency.',
      minutes: 18,
      skill: 'evaluation',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'Eval set first, then a baseline',
          body:
            'Before polishing prompts, write the eval set from your success criteria: 30–60 realistic inputs with expected facts, labels, or fields, plus edge cases and out-of-scope cases.\n\nThen build the simplest pipeline that works end to end, even if it is ugly, and run the eval. That first score is your **baseline**. Every later change is judged against it.',
        },
        {
          h: 'Change one thing at a time',
          body:
            'Iterate like an experiment:\n\n1. Read the failing cases and group them by cause: retrieval missed it, the model ignored context, the format broke.\n2. Pick the biggest group and form a hypothesis.\n3. Change **one** thing: chunk size, top-k, a prompt instruction, or the model.\n4. Re-run the full eval and compare with the previous best.\n5. Keep the change only if it helps without new regressions.\n\nChange three things at once and you will not know which one helped, or which one hurt.',
        },
        {
          h: 'Track cost and latency too',
          body:
            'Quality is not the only axis. For every run, record the pass rate **and** the average tokens, cost per request, and median and p95 latency.\n\nA larger model might add 3 points of accuracy at five times the cost; a reranker might improve retrieval but add a second of latency. Writing these trade-offs into an **experiment log** gives you the story for your README and your interviews.',
        },
      ],
      terms: [
        { term: 'Baseline', def: 'The score of the first simple working version, used as the reference for every later change.' },
        { term: 'Error analysis', def: 'Reading and grouping failing cases by cause to decide what to fix next.' },
        { term: 'Controlled change', def: 'Changing exactly one variable between runs so its effect can be measured.' },
        { term: 'Experiment log', def: 'A table of runs recording each change and its effect on quality, cost, and latency.' },
      ],
      example: {
        title: 'An experiment log',
        lang: 'text',
        code:
          'Run  Change                          Pass   Valid cites  p50 latency  $/request\n 0   baseline: top-3, small model    71%    88%          2.1 s        $0.0021\n 1   top-3 -> top-6                  79%    90%          2.4 s        $0.0034\n 2   + "answer only from sources"    84%    97%          2.4 s        $0.0035\n 3   small -> large model            87%    97%          4.9 s        $0.0160\n\nDecision: keep run 2. Run 3 adds 3 points but costs 4.6x as much and\ndoubles latency, which breaks the "< $0.01 and < 4 s" success criteria.',
        note: 'Each row changes one thing and records quality, cost, and latency together, so the final decision is easy to justify — exactly what an interviewer wants to hear.',
      },
      check: [
        {
          id: 'l10m3-p1', type: 'mc',
          q: 'You change chunk size, the prompt, and the model in one go, and the pass rate rises from 70% to 76%. What is the problem?',
          options: [
            'You cannot tell which change helped, and one of them may have hurt; test them one at a time',
            'Nothing; the score went up, so all three changes are good',
            'Pass rates above 75% are unrealistic and suggest a bug',
            'You should also have changed the temperature in the same run',
          ],
          answer: 0,
          explain: 'With three simultaneous changes, the effects are mixed together. One change might be worth +10 points and another −4.',
          topic: 'l10m3',
        },
        {
          id: 'l10m3-p2', type: 'mc',
          q: 'Why build the simplest end-to-end pipeline before optimising any single part?',
          options: [
            'Simple pipelines are always good enough to ship',
            'It means you can skip writing an eval set',
            'It gives you a measured baseline and shows which stage actually fails',
            'It lets you choose the most expensive model from the start',
          ],
          answer: 2,
          explain: 'An end-to-end baseline tells you where you stand and where failures come from, so you optimise the stage that matters.',
          topic: 'l10m3',
        },
        {
          id: 'l10m3-p3', type: 'short',
          q: 'A larger model raises your pass rate by 2 points but triples the cost. How would you decide whether to switch?',
          keywords: [['success criteria', 'criteria', 'target', 'budget', 'requirement', 'goal', 'threshold', 'user', 'matter', 'need', 'important', 'critical'], ['cost', 'latency', 'trade', 'price', 'worth', 'afford', 'benefit']],
          min: 2,
          sample: 'Compare it against the success criteria and budget: if the 2 points fix failures that matter to users and the tripled cost still fits the target, switch; otherwise keep the cheaper model and improve retrieval or prompts.',
          explain: 'A good answer weighs the quality gain against cost and latency using the success criteria or user impact, not quality alone.',
          topic: 'l10m3',
        },
      ],
      challengeId: 'c-l10-1',
    },
    {
      id: 'l10m4',
      title: 'Deploying a GenAI app',
      goal: 'Deploy a GenAI app with managed configuration and secrets, monitoring, rate limits, and a launch checklist.',
      minutes: 18,
      skill: 'deployment',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'Configuration and secrets',
          body:
            'The code is the same everywhere; **configuration** changes per environment (development, staging, production): API keys, model names, database URLs, rate limits.\n\nRead configuration from environment variables, and keep secrets in your host’s secret settings or a secret manager — never in the repository. Commit a `.env.example` listing every variable with placeholder values, and make the app **fail fast** with a clear error at startup if a required variable is missing.',
        },
        {
          h: 'Containers and hosting, in brief',
          body:
            'A **container** packages your app with its exact runtime and dependencies, so what works on your machine also works on the server. You describe it in a small recipe file, build an image, and run that image anywhere.\n\nCommon hosting shapes:\n- **Platform as a service**: push code or a container and the platform runs and scales it. Simplest for a capstone.\n- **Serverless functions**: good for a small proxy endpoint; check time limits for long streams.\n- **Virtual machines**: the most control and the most maintenance.',
        },
        {
          h: 'Monitor and protect',
          body:
            'From the first day in production:\n\n- per-user **rate limits** and a max-token cap on your proxy;\n- a **spending limit** and cost alerts with your model provider;\n- structured logs and traces with PII redacted (Level 9);\n- a health endpoint with an uptime check, and alerts on error-rate and latency spikes;\n- a **kill switch**: a configuration flag that turns the AI feature off gracefully during an incident.',
        },
        {
          h: 'Launch checklist',
          body:
            'Before sharing the link:\n\n1. No secrets in the repository or the frontend bundle — search for them.\n2. Login, rate limits, timeouts, and retries with backoff are in place.\n3. The deployed version meets your success criteria on the eval set.\n4. Prompt-injection and out-of-scope cases have been tested.\n5. The UI discloses that answers are AI-generated and includes a feedback button.\n6. Logs, cost alerts, and a rollback plan are ready.',
        },
      ],
      terms: [
        { term: 'Environment configuration', def: 'Settings such as keys, URLs, and limits that differ between development, staging, and production.' },
        { term: 'Container', def: 'A packaged, portable unit containing an app and everything it needs to run.' },
        { term: 'Platform as a service', def: 'Hosting where you provide code or a container and the platform handles servers and scaling.' },
        { term: 'Kill switch', def: 'A configuration flag that disables a feature quickly without redeploying code.' },
      ],
      example: {
        title: 'Fail-fast configuration',
        lang: 'javascript',
        code:
          '// config.js: loaded once when the server starts\nconst required = ["AI_API_KEY", "AI_MODEL", "DATABASE_URL"];\nfor (const name of required) {\n  if (!process.env[name]) {\n    throw new Error("Missing required environment variable: " + name);\n  }\n}\n\nexport const config = {\n  apiKey: process.env.AI_API_KEY,                  // set in the host secret settings\n  model: process.env.AI_MODEL,                     // can differ per environment\n  maxTokens: Number(process.env.AI_MAX_TOKENS || 500),\n  rateLimitPerMinute: Number(process.env.RATE_LIMIT_RPM || 20),\n  aiEnabled: process.env.AI_ENABLED !== "false",   // kill switch\n};',
        note: 'The server refuses to start without its secrets instead of failing on the first user request, and limits and the kill switch can change without a code deploy.',
      },
      check: [
        {
          id: 'l10m4-p1', type: 'mc',
          q: 'Your app works locally but fails in production with "Missing required environment variable: AI_API_KEY". What is the most likely cause?',
          options: [
            'The model provider is down',
            'The variable was never set in the production host’s secret settings',
            'The frontend bundle is too large',
            'The eval set failed during deployment',
          ],
          answer: 1,
          explain: 'Your local .env file is not deployed (and should not be). Production needs its own secret configured on the host.',
          topic: 'l10m4',
        },
        {
          id: 'l10m4-p2', type: 'mc',
          q: 'Why add a kill switch flag for the AI feature?',
          options: [
            'To turn the feature off quickly during an incident — runaway cost, harmful outputs, or a provider outage — without a redeploy',
            'To make the model generate faster',
            'To hide the API key from users',
            'To make the eval set pass',
          ],
          answer: 0,
          explain: 'Incidents need a fast, low-risk response. Flipping a flag is quicker and safer than writing, reviewing, and deploying a code change.',
          topic: 'l10m4',
        },
        {
          id: 'l10m4-p3', type: 'short',
          q: 'Name three items you would check on a launch checklist for a GenAI app.',
          keywords: [['secret', 'key'], ['rate limit', 'limit', 'auth', 'login'], ['eval', 'test'], ['log', 'monitor', 'alert', 'cost'], ['disclos', 'feedback', 'rollback', 'kill switch', 'timeout', 'retr']],
          min: 3,
          sample: 'No API keys in the repo or frontend; per-user rate limits and login on the proxy; the eval set passes on the deployed version; logging and cost alerts are set up.',
          explain: 'Strong answers cover secrets, access control and limits, evaluation, and monitoring, plus items like disclosure, feedback, or a rollback plan.',
          topic: 'l10m4',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l10m5',
      title: 'Portfolio and job search',
      goal: 'Present your capstone as convincing evidence and explain its trade-offs in an AI engineer interview.',
      minutes: 16,
      skill: 'career',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'A README that proves it works',
          body:
            'Reviewers often spend only a few minutes on a repository, so put the evidence at the top:\n\n- a one-sentence pitch: who it helps and how;\n- a **demo**: live link, short video, or animated screenshot;\n- an **architecture** diagram and a paragraph on data flow;\n- **eval results**: dataset size, metrics, and a baseline-to-final table;\n- **trade-offs and limitations**: what you chose and what you would do next;\n- how to run it locally, with a `.env.example`.',
        },
        {
          h: 'Write-ups multiply your work',
          body:
            'A short write-up — a blog post or project page — turns one project into a conversation starter. A strong structure: the problem, the naive first version and its baseline score, the two or three changes that mattered and why, one failure you discovered and fixed, and what it costs to run.\n\nConcrete numbers ("abstention rose from 40% to 100% after…") convince far more than adjectives like "robust" or "powerful".',
        },
        {
          h: 'Talking about trade-offs',
          body:
            'Interviewers for AI engineer roles probe judgement more than buzzwords. Practise explaining decisions as **"I chose X over Y because Z, at the cost of W"**:\n\n- RAG versus fine-tuning;\n- a small versus a large model: quality against cost and latency;\n- streaming or not, and why;\n- what you log, and what you deliberately do not.\n\nAdmitting a limitation and explaining how you would measure a fix is a strength, not a weakness.',
        },
        {
          h: 'Typical interview questions',
          body:
            'Prepare answers grounded in your capstone:\n\n- How do you reduce hallucinations in a RAG system?\n- How would you evaluate an LLM feature before launch?\n- How do you keep API keys and user data safe?\n- What would you do if costs doubled overnight?\n- How do you handle rate limits and failed tool calls?\n- Design a document Q&A system for 10,000 users.\n\nAlso expect coding exercises in Python or JavaScript and detailed questions about your past projects.',
        },
      ],
      terms: [
        { term: 'Portfolio', def: 'A curated set of projects that shows employers what you can build and how you think.' },
        { term: 'README', def: 'The front page of a repository explaining what the project does, how it works, and how to run it.' },
        { term: 'Write-up', def: 'A short article explaining a project’s problem, decisions, results, and lessons.' },
        { term: 'Trade-off', def: 'A decision where gaining one quality, such as accuracy, costs another, such as speed or money.' },
      ],
      example: {
        title: 'README skeleton',
        lang: 'text',
        code:
          '# Handbook Helper: cited answers to student handbook questions\n\nDemo: <live link>   90-second video: <link>\n\n## What it does\nAnswers questions about the student handbook with section citations,\nand says "not covered" when the handbook has no answer.\n\n## Architecture\n<diagram>  Browser -> backend proxy (login, rate limit, key) -> retrieval -> model\n\n## Results (60-question eval set + 15 out-of-scope questions)\n| Version  | Correct | Valid citations | Abstention | p50   | $/question |\n| Baseline | 71%     | 88%             | 40%        | 2.1 s | $0.0021    |\n| Final    | 84%     | 97%             | 100%       | 2.4 s | $0.0035    |\n\n## Trade-offs and limitations\n- RAG instead of fine-tuning: the handbook changes every term.\n- Kept the small model: the large one added 3 points at 4.6x the cost.\n- Known gap: tables in the PDF are chunked poorly.\n\n## Run locally\ncp .env.example .env    # then add your own key\nnpm install && npm start',
        note: 'Pitch, demo, architecture, measured results, honest limitations, and run instructions: a reviewer can judge the project in two minutes.',
      },
      check: [
        {
          id: 'l10m5-p1', type: 'mc',
          q: 'Which README opening is strongest for a reviewer who has two minutes?',
          options: [
            'A long story about how you became interested in AI',
            'A list of every library you installed',
            'A paragraph explaining how transformers work',
            'A one-line pitch, a demo link, and a results table with eval scores before and after',
          ],
          answer: 3,
          explain: 'Reviewers want evidence fast: what it does, that it runs, and that it was measured.',
          topic: 'l10m5',
        },
        {
          id: 'l10m5-p2', type: 'mc',
          q: 'An interviewer asks why you did not use the largest model. Which answer best shows engineering judgement?',
          options: [
            '"Bigger models are not always better, so I avoided them."',
            '"I could not afford it, so I picked the cheapest option."',
            '"I tested it: 3 points better at 4.6 times the cost and double the latency, which broke my targets, so I kept the small model and improved retrieval instead."',
            '"The tutorial I followed used the small one."',
          ],
          answer: 2,
          explain: 'It shows a measured experiment, explicit criteria, and a reasoned decision — the "chose X over Y because Z, at the cost of W" pattern.',
          topic: 'l10m5',
        },
        {
          id: 'l10m5-p3', type: 'short',
          q: 'Name two things a strong project write-up should include besides the code.',
          keywords: [['problem', 'user', 'goal', 'why', 'motivation'], ['result', 'eval', 'metric', 'number', 'score', 'baseline', 'measure'], ['trade', 'limitation', 'decision', 'lesson', 'failure', 'cost', 'next', 'mistake']],
          min: 2,
          sample: 'The problem and who it is for, measured results such as baseline versus final eval scores, and the trade-offs or failures you hit and what you learned.',
          explain: 'Good write-ups cover the problem, measured results, and decisions or lessons, ideally with concrete numbers.',
          topic: 'l10m5',
        },
      ],
      challengeId: null,
    },
  ],
  challenges: [
    {
      id: 'c-l10-1', levelId: 'l10', missionId: 'l10m3', kind: 'code', lang: 'javascript',
      title: 'Monthly cost estimator', skill: 'deployment',
      prompt:
        'Before launch you need a monthly budget for the model API.\n\nWrite `estimateMonthlyCost({ requestsPerDay, inputTokens, outputTokens, inputPricePerMillion, outputPricePerMillion, days = 30 })`. It takes **one object**; use destructuring with a default of 30 for `days`.\n\n- `inputTokens` and `outputTokens` are averages **per request**.\n- Prices are in dollars per **one million** tokens.\n\nCost of one request = `inputTokens × inputPricePerMillion / 1,000,000 + outputTokens × outputPricePerMillion / 1,000,000`.\n\nReturn the total for all requests over `days` days, **rounded to 2 decimals** (whole cents) with `Math.round(x * 100) / 100`.\n\nExample: 2,000 requests a day, 1,500 input and 300 output tokens, $0.50 and $2.00 per million, 30 days → `81`.',
      starter:
        'function estimateMonthlyCost({ requestsPerDay, inputTokens, outputTokens, inputPricePerMillion, outputPricePerMillion, days = 30 }) {\n  // cost of one request = input part + output part (prices are per 1,000,000 tokens)\n  // multiply by requests per day and by days, then round to cents\n}\n\nconsole.log(estimateMonthlyCost({\n  requestsPerDay: 2000, inputTokens: 1500, outputTokens: 300,\n  inputPricePerMillion: 0.5, outputPricePerMillion: 2,\n})); // 81\n',
      solution:
        'function estimateMonthlyCost({ requestsPerDay, inputTokens, outputTokens, inputPricePerMillion, outputPricePerMillion, days = 30 }) {\n  const perRequest =\n    (inputTokens * inputPricePerMillion) / 1000000 +\n    (outputTokens * outputPricePerMillion) / 1000000;\n  const total = perRequest * requestsPerDay * days;\n  return Math.round(total * 100) / 100;\n}',
      hints: [
        'Work out the cost of a single request first: each token count times its price, divided by 1,000,000. Then scale up by requests per day and by days.',
        '`const total = perRequest * requestsPerDay * days;` then `return Math.round(total * 100) / 100;`. The `days = 30` default in the parameter list handles calls that leave days out.',
      ],
      tests: [
        { call: 'estimateMonthlyCost({ requestsPerDay: 2000, inputTokens: 1500, outputTokens: 300, inputPricePerMillion: 0.5, outputPricePerMillion: 2 })', expect: 81 },
        { call: 'estimateMonthlyCost({ requestsPerDay: 2000, inputTokens: 1500, outputTokens: 300, inputPricePerMillion: 0.5, outputPricePerMillion: 2, days: 7 })', expect: 18.9 },
        { call: 'estimateMonthlyCost({ requestsPerDay: 0, inputTokens: 1500, outputTokens: 300, inputPricePerMillion: 0.5, outputPricePerMillion: 2 })', expect: 0 },
        { call: 'estimateMonthlyCost({ requestsPerDay: 100, inputTokens: 1234, outputTokens: 567, inputPricePerMillion: 3, outputPricePerMillion: 15 })', expect: 36.62 },
        { call: 'estimateMonthlyCost({ requestsPerDay: 10, inputTokens: 200, outputTokens: 50, inputPricePerMillion: 0.1, outputPricePerMillion: 0.4 })', expect: 0.01 },
        { call: 'estimateMonthlyCost({ requestsPerDay: 1000, inputTokens: 0, outputTokens: 1000, inputPricePerMillion: 5, outputPricePerMillion: 10, days: 31 })', expect: 310 },
        { call: 'estimateMonthlyCost({ requestsPerDay: 50000, inputTokens: 3000, outputTokens: 800, inputPricePerMillion: 1.25, outputPricePerMillion: 10 })', expect: 17625 },
      ],
    },
  ],
  test: {
    title: 'Launch Summit Checkpoint',
    intro: 'Eight questions on scoping, architecture, evaluation-driven iteration, deployment, and presenting your work.',
    questions: [
      {
        id: 'l10t-q1', type: 'mc',
        q: 'A learner proposes "an AI that manages my whole life" as a capstone. What is the best first step?',
        options: [
          'Start building the chat interface right away',
          'Pick one user, one recurring task, and one data source, and write measurable success criteria',
          'Train a custom model before deciding on features',
          'Add as many tools as possible so it can handle anything',
        ],
        answer: 1,
        explain: 'Scoping comes first: a narrow user, task, and data source with measurable criteria makes the project buildable and evaluable.',
        topic: 'l10m1',
      },
      {
        id: 'l10t-q2', type: 'mc',
        q: 'Your design has the browser call the vector store and the model API directly "to reduce latency". What is the main problem?',
        options: [
          'Vector stores cannot be reached over HTTP',
          'Latency would actually go up, not down',
          'Model APIs always reject requests that come from browsers',
          'Secrets end up in the client, and you lose central login, rate limits, validation, and logging',
        ],
        answer: 3,
        explain: 'Direct calls require shipping credentials to the browser and bypass every control the backend proxy provides.',
        topic: 'l10m2',
      },
      {
        id: 'l10t-q3', type: 'mc',
        q: 'Your baseline scores 68%. Switching retrieval to top-8 raises the pass rate to 75%, but p95 latency doubles and cost rises 60%. What should you do next?',
        options: [
          'Check the result against your success criteria; if latency or cost now break them, try a cheaper variant such as top-5 or a reranker and measure again',
          'Keep it, because quality is the only thing that matters',
          'Revert it and stop experimenting with retrieval',
          'Change the model and the prompt as well, then re-run everything together',
        ],
        answer: 0,
        explain: 'Every change is judged on quality, cost, and latency against the success criteria, and the next experiment is still one change at a time.',
        topic: 'l10m3',
      },
      {
        id: 'l10t-q4', type: 'mc',
        q: 'Two days after launch, your model bill is ten times higher than expected. Logs show one account sending thousands of requests per hour. Which pre-launch control was missing?',
        options: [
          'A larger context window',
          'Streaming responses',
          'Per-user rate limits on the proxy, plus a provider spending limit and cost alerts',
          'A longer system prompt',
        ],
        answer: 2,
        explain: 'Per-user limits stop a single account from dominating usage, and spending limits with alerts catch anything that slips through.',
        topic: 'l10m4',
      },
      {
        id: 'l10t-q5', type: 'mc',
        q: 'Which configuration practice is correct?',
        options: [
          'Commit the production .env file so teammates can deploy quickly',
          'Commit a .env.example with placeholder values and set real values in the host’s secret settings',
          'Put the model name and API key in the frontend so the browser can call the model directly',
          'Use one shared API key for development, staging, and production',
        ],
        answer: 1,
        explain: 'The example file documents what is needed without exposing secrets; real values live in the host’s secret store, separately per environment.',
        topic: 'l10m4',
      },
      {
        id: 'l10t-q6', type: 'mc',
        q: 'In an interview you are asked, "Why did you use RAG instead of fine-tuning for your handbook assistant?" Which answer is strongest?',
        options: [
          '"RAG is newer than fine-tuning, and modern teams always choose the newest technique for every project."',
          '"Fine-tuning always produces worse answers than RAG, so there was no real decision to make."',
          '"I did not have time to learn fine-tuning, and RAG tutorials were easier to find online."',
          '"The handbook changes every term and answers need citations. RAG lets me update documents without retraining and show sources; the trade-off is depending on retrieval quality, which I measured with citation validity."',
        ],
        answer: 3,
        explain: 'The strong answer ties the choice to the project’s needs, names the trade-off, and shows it was measured.',
        topic: 'l10m5',
      },
      {
        id: 'l10t-q7', type: 'short',
        q: 'Describe an evaluation-first workflow for improving your capstone.',
        keywords: [['eval set', 'eval', 'test set', 'dataset', 'golden', 'question', 'test case'], ['baseline', 'first score', 'starting point', 'simplest'], ['one change', 'one thing', 'single change', 'one at a time', 'one variable', 'isolat'], ['compare', 'measure', 're-run', 'rerun', 'track', 'score']],
        min: 3,
        sample: 'Write an eval set from the success criteria, build the simplest end-to-end version and record its baseline score, then change one thing at a time, re-run the eval, and compare quality, cost, and latency before keeping a change.',
        explain: 'Key ideas: eval set first, a measured baseline, one change at a time, and re-measuring after every change.',
        topic: 'l10m3',
      },
      {
        id: 'l10t-q8', type: 'short',
        q: 'What should your capstone README contain so that a reviewer believes it works? Name at least three things.',
        keywords: [['demo', 'video', 'live', 'screenshot', 'gif', 'link'], ['architect', 'diagram', 'design', 'data flow'], ['eval', 'result', 'metric', 'score', 'accuracy', 'pass rate', 'number'], ['trade', 'limitation', 'decision', 'next step', 'future'], ['run', 'install', 'setup', 'set up', '.env']],
        min: 3,
        sample: 'A demo link or video, an architecture diagram with the data flow, an eval results table from baseline to final, the main trade-offs and limitations, and instructions to run it locally.',
        explain: 'Evidence beats description: demo, architecture, measured results, honest trade-offs, and setup instructions.',
        topic: 'l10m5',
      },
    ],
  },
  boss: {
    id: 'l10b',
    title: 'The Launch Summit Trial',
    story:
      'At the peak of Launch Summit, a panel of senior engineers reviews your capstone before it goes live and into your portfolio. Five questions span the whole journey; land four to plant your flag, then submit your project plan.',
    minutes: 30,
    hp: 5,
    toWin: 4,
    questions: [
      {
        id: 'l10b-q1', type: 'mc',
        q: 'You have four weeks of part-time work. Which capstone plan is most likely to impress the panel?',
        options: [
          'A general assistant for every department of a company, with ten tools',
          'A cited-docs assistant for one team’s 200-page policy manual, with a 50-question eval set, abstention tests, and a deployed demo',
          'Pre-training a small language model from scratch',
          'Five unrelated notebooks, each showing a different API call',
        ],
        answer: 1,
        explain: 'A narrow, finished, evaluated, deployed project demonstrates far more skill than broad or unfinished ones.',
        topic: 'l10m1',
      },
      {
        id: 'l10b-q2', type: 'mc',
        q: 'Which architecture would the panel approve for a public demo?',
        options: [
          'A static site calling the model API with a key that only allows small requests',
          'A mobile app with the key obfuscated inside the binary',
          'A static site with the key stored in a hidden form field',
          'A static frontend calling a backend proxy (key from server secrets, login, per-user rate limits, max-token cap) that calls the model API and vector store, with traces logged and PII redacted',
        ],
        answer: 3,
        explain: 'Any key shipped to a client can be extracted, however it is hidden. The proxy keeps secrets server-side and enforces limits and logging.',
        topic: 'l10m2',
      },
      {
        id: 'l10b-q3', type: 'mc',
        q: 'Your capstone extracts { vendor, date, total } from invoices into JSON. Which evaluation plan fits?',
        options: [
          'Per-field exact match, with dates and amounts normalized, on a labelled set of invoices, plus the schema-validity rate',
          'A single LLM-judge "quality" score from 1 to 10',
          'Counting how many words each output contains',
          'Asking two friends whether the output looks right',
        ],
        answer: 0,
        explain: 'Extraction has exact right answers per field, so code-based per-field accuracy and schema validity are precise and repeatable.',
        topic: 'l10m3',
      },
      {
        id: 'l10b-q4', type: 'mc',
        q: 'In testing, your assistant confidently answers questions the documents do not cover. Which combination addresses this?',
        options: [
          'Raise the temperature so the model explores more possible answers',
          'Add more general knowledge to the system prompt',
          'Instruct it to answer only from sources and otherwise abstain, require and verify citations, and add unanswerable questions to the eval set',
          'Remove retrieval so the model relies on its training data',
        ],
        answer: 2,
        explain: 'Grounding instructions, citation checks, and abstention tests together reduce and measure hallucinations.',
        topic: 'l10m3',
      },
      {
        id: 'l10b-q5', type: 'short',
        q: 'An interviewer asks: "What was the hardest trade-off in your capstone, and how did you decide?" Write a strong two- or three-sentence answer about any trade-off, for example quality versus cost or model size versus latency.',
        keywords: [['chose', 'choose', 'picked', 'kept', 'decided', 'went with', 'instead', 'over', 'switch', 'select', 'prefer', 'stuck with'], ['cost', 'latency', 'speed', 'quality', 'accuracy', 'price', 'time', 'slow'], ['measur', 'eval', 'test', 'data', 'number', '%', 'percent', 'score', 'result', 'criteria', 'target']],
        min: 3,
        sample: 'I tested a larger model: it improved accuracy by 3 points but cost 4.6 times as much and doubled latency, breaking my targets. So I kept the small model and improved retrieval instead, which got most of the gain at a fraction of the cost.',
        explain: 'A strong answer names the options, the competing qualities (such as cost and accuracy), and the measurement or criteria that decided it.',
        topic: 'l10m5',
      },
    ],
    project: {
      brief:
        'Plan your capstone project. Write each part as if it were the first page of your design doc, and be specific: name the user, the data, the components, and the numbers you will measure. You can reuse this plan in your README and in interviews.',
      fields: [
        { id: 'problem', label: 'Problem statement', minWords: 15, hint: 'Who struggles with what today, and how do they cope now? Describe one concrete problem, not a platform.' },
        { id: 'users', label: 'Target users', minWords: 10, hint: 'Describe the one primary type of user, their context (device, expertise), and how often they would use your app.' },
        { id: 'architecture', label: 'Architecture and data flow', minWords: 25, hint: 'List the components (frontend, backend proxy, model API, vector store, tools, eval harness, logging) and number the steps of one request. Say where the API key lives.' },
        { id: 'data', label: 'Data sources', minWords: 10, hint: 'Which documents, APIs, or datasets will you use? Are you allowed to use them, how often do they change, and do they contain personal data?' },
        { id: 'evaluation', label: 'Evaluation plan', minWords: 20, hint: 'Eval set size and how you will build it, the metrics (for example exact match, groundedness, abstention, latency, cost), and a target for each.' },
        { id: 'risks', label: 'Risks and mitigations', minWords: 15, hint: 'Name at least three risks such as hallucination, prompt injection, PII exposure, cost overruns, or rate limits, each with a concrete mitigation.' },
        { id: 'portfolio', label: 'Portfolio presentation', minWords: 10, hint: 'How will you show it: demo link or video, README sections, a write-up, and the one trade-off you will discuss in interviews.' },
      ],
    },
  },
  review: [
    { missionId: 'l10m1', tip: 'Rewrite your capstone idea using the scope template: problem, user, core task, data, out of scope, and three measurable success criteria.' },
    { missionId: 'l10m2', tip: 'Redraw the architecture sketch for your own project, number the steps of one request, and add one risk with its mitigation.' },
    { missionId: 'l10m3', tip: 'Start an experiment log with a baseline row, plan the next single change, and redo the monthly cost estimator challenge with your own numbers.' },
    { missionId: 'l10m4', tip: 'Walk through the launch checklist for your project and mark each item as done, planned, or missing.' },
    { missionId: 'l10m5', tip: 'Draft your README skeleton and practise answering two of the typical interview questions out loud using "I chose X over Y because Z, at the cost of W".' },
  ],
};
