// Level 1 — Generative AI Foundations (Spark Plains)
export default {
  id: 'l1',
  num: 1,
  title: 'AI Basics & GenAI Foundations',
  region: 'Spark Plains',
  tagline: 'Start from zero: what AI, GenAI and agentic AI are, then what a model really does when it "writes".',
  overview:
    'No experience needed. You start with the big picture (how AI, machine learning, generative AI and agentic AI differ), then build a precise mental model of how language models turn a prompt into text one token at a time, why context windows matter, how training differs from inference, and where GenAI careers fit.',
  objectives: [
    'Tell AI, machine learning, generative AI and agentic AI apart with everyday examples',
    'Explain next-token prediction in plain language',
    'Estimate token counts and reason about context-window limits',
    'Distinguish training from inference and name what happens in each',
    'Describe common GenAI model families, their limits, and the roles that build with them',
  ],
  skills: ['foundations', 'llms', 'career'],
  missions: [
    // The two beginner missions come first in the array (their ids are new, so existing progress is untouched).
    {
      id: 'l1m5',
      title: 'What is AI? The AI family tree',
      goal: 'Tell AI, machine learning, deep learning and generative AI apart with one everyday example each.',
      minutes: 8,
      skill: 'foundations',
      visual: 'aiFamily',
      visualCaption: 'Tap each ring to see what lives there, then play the sorting game: put each everyday app in the right family.',
      keyIdea: 'AI is the big umbrella. Machine learning sits inside it, deep learning inside that, and generative AI is the part of deep learning that **creates** new things.',
      analogy: 'Think of nesting dolls. AI is the biggest doll. Machine learning fits inside it, deep learning inside that, and generative AI is the smallest doll — the one that can write, draw and compose.',
      sections: [
        {
          h: 'AI: the big umbrella',
          body:
            '**Artificial intelligence (AI)** is any computer system doing something that normally needs human smarts: recognising faces, recommending songs, playing chess.\n\nOld-school AI followed **hand-written rules** ("if temperature < 18, turn on heat"). Most modern AI **learns** instead.',
        },
        {
          h: 'Machine learning: learning from examples',
          body:
            'With **machine learning (ML)** you do not write the rules. You show the computer thousands of examples — emails labelled *spam* or *not spam* — and it finds the pattern itself.\n\nMost ML **predicts or sorts**: spam or not, fraud or not, which show you will like next.',
        },
        {
          h: 'Deep learning and generative AI',
          body:
            '**Deep learning** is ML with many-layered neural networks. It is great at messy data like photos, speech and language.\n\n**Generative AI** is deep learning that **creates new content**: text (ChatGPT, Claude), images, music, code. Instead of choosing between labels, it produces something that did not exist before.',
        },
      ],
      terms: [
        { term: 'Artificial intelligence (AI)', def: 'Computer systems that perform tasks that normally need human intelligence.' },
        { term: 'Rule-based system', def: 'AI that follows rules written by people, not patterns learned from data.' },
        { term: 'Machine learning (ML)', def: 'AI that learns patterns from examples instead of following hand-written rules.' },
        { term: 'Deep learning', def: 'Machine learning that uses neural networks with many layers; strong on images, audio and language.' },
        { term: 'Generative AI', def: 'AI that creates new content — text, images, audio or code — rather than only predicting a label.' },
      ],
      example: null,
      check: [
        {
          id: 'l1m5-p1', type: 'mc',
          q: 'Your email app moves junk mail into a Spam folder by itself. Which describes it best?',
          options: ['Generative AI writing new emails', 'Machine learning sorting emails based on learned patterns', 'An AI agent replying for you', 'Not AI at all'],
          answer: 1,
          explain: 'A spam filter learned from many labelled emails and now sorts new ones — classic machine learning. It predicts a label; it does not create content.',
          topic: 'l1m5',
        },
        {
          id: 'l1m5-p2', type: 'mc',
          q: 'Which of these is generative AI?',
          options: [
            'A thermostat that switches on below 18°C',
            'A model that writes a birthday poem from a one-line request',
            'A bank system that flags an unusual card payment',
            'A spreadsheet that adds up a column',
          ],
          answer: 1,
          explain: 'Writing a brand-new poem is creating content — that is generative AI. The fraud flag is predictive ML, the thermostat is a simple rule, and the spreadsheet is ordinary software.',
          topic: 'l1m5',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l1m6',
      title: 'GenAI vs agentic AI: from answering to doing',
      goal: 'Explain the difference between traditional AI, generative AI and agentic AI, and describe the agent loop.',
      minutes: 9,
      skill: 'foundations',
      visual: 'aiCompare',
      visualCaption: 'Pick a task and compare how each kind of AI handles it. Then press "Next step" to watch an agent loop: think, act with a tool, observe, repeat.',
      keyIdea: 'Generative AI **answers**. Agentic AI **acts**: it plans steps, uses tools, checks the results and keeps going until the goal is done.',
      analogy: 'Generative AI is a brilliant friend who tells you how to book a flight. Agentic AI is an assistant who opens the airline site, compares prices, books the seat and emails you the ticket — checking with you before paying.',
      sections: [
        {
          h: 'Three kinds of AI, one task',
          body:
            'Task: *"Sort out dinner on Friday."*\n\n- **Traditional (predictive) AI** ranks restaurants you will probably like.\n- **Generative AI** writes a friendly message to invite your friends.\n- **Agentic AI** checks your calendar, finds a free table, books it and sends the invites.',
        },
        {
          h: 'The agent loop',
          body:
            'An agent repeats a simple loop until the goal is met:\n\n1. **Goal** — what you asked for.\n2. **Think** — the LLM plans the next step.\n3. **Act** — it calls a tool (search, calendar, email).\n4. **Observe** — it reads the tool result.\n5. **Repeat or finish.**\n\nThe LLM is the *brain*; tools are its *hands*.',
        },
        {
          h: 'Power comes with risk',
          body:
            'Agents save lots of work, but they can also take the **wrong action**. Good agents have limits: they ask a human before risky steps (paying, deleting, sending), and they log what they did. You will build a safe agent yourself in Level 8.',
        },
      ],
      terms: [
        { term: 'Predictive AI', def: 'AI that predicts or classifies — a score, a label, a ranking — without creating new content.' },
        { term: 'Agentic AI', def: 'AI that pursues a goal by planning steps and taking actions with tools, not just answering.' },
        { term: 'AI agent', def: 'A system where an LLM decides which tool to use next, observes the result, and loops until done.' },
        { term: 'Tool', def: 'An action an agent can call, such as web search, a calculator, a calendar or sending an email.' },
        { term: 'Human in the loop', def: 'A person reviews or approves important steps before the AI carries them out.' },
      ],
      example: {
        title: 'An agent loop, step by step',
        lang: 'text',
        code:
          'Goal:    Book dinner for 4 on Friday\nThink:   I need to know when everyone is free\nAct:     calendar.find_free_time("Friday")   -> 19:00\nThink:   Now find an Italian place with a table\nAct:     restaurants.search("italian", 4, "19:00") -> Luigi\'s\nThink:   Booking costs a deposit — ask the human first\nAsk:     "Book Luigi\'s at 19:00 for a 10 deposit?"  -> yes\nAct:     restaurants.book("Luigi\'s", 4, "19:00")  -> confirmed\nFinish:  "Booked! Invites sent to your 3 friends."',
        note: 'Notice the loop: think → act → observe, again and again. And notice the agent pauses for approval before spending money.',
      },
      check: [
        {
          id: 'l1m6-p1', type: 'mc',
          q: 'You paste an article and ask the AI "Summarize this in 3 bullets." It writes the bullets. What kind of AI is that?',
          options: ['Traditional predictive AI', 'Generative AI', 'Agentic AI', 'A rule-based system'],
          answer: 1,
          explain: 'It created new text in response to a request, and took no actions in the world — that is generative AI.',
          topic: 'l1m6',
        },
        {
          id: 'l1m6-p2', type: 'mc',
          q: 'Which is the clearest sign that a system is agentic?',
          options: [
            'It writes very fluent text',
            'It plans steps and uses tools to complete a goal on its own',
            'It was trained on a huge amount of data',
            'It answers in many languages',
          ],
          answer: 1,
          explain: 'Fluency and big training data describe any modern LLM. Being agentic means planning and acting with tools in a loop until the goal is reached.',
          topic: 'l1m6',
        },
        {
          id: 'l1m6-p3', type: 'short',
          q: 'In one sentence: what is the difference between generative AI and agentic AI?',
          keywords: [['create', 'generate', 'write', 'answer', 'content', 'text'], ['act', 'action', 'tool', 'task', 'plan', 'step', 'does', 'doing']],
          min: 2,
          sample: 'Generative AI creates content like text when you ask, while agentic AI takes actions, planning steps and using tools to finish a task.',
          explain: 'A good answer contrasts creating/answering (GenAI) with acting/using tools/planning (agentic AI).',
          topic: 'l1m6',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l1m1',
      title: 'What generative AI actually does',
      goal: 'Explain in one sentence how a language model produces text.',
      minutes: 12,
      skill: 'foundations',
      visual: 'promptFlow',
      visualCaption:
        'Pick a prompt, then move the temperature slider. Watch how the probability of each candidate next token changes and how often the "safe" choice wins.',
      sections: [
        {
          h: 'Generate vs. classify',
          body:
            'Traditional ML models usually **classify** or **predict a number**: spam or not spam, price of a house. Generative models **produce new content** — text, images, audio, code — that resembles the data they learned from.\n\nA large language model (LLM) is a generative model for text. It does not look answers up in a database. It produces each piece of output based on patterns it learned.',
        },
        {
          h: 'One token at a time',
          body:
            'An LLM repeatedly answers one question: **"Given everything so far, what token is likely to come next?"**\n\n1. Your prompt is split into tokens.\n2. The model outputs a probability for every token in its vocabulary.\n3. One token is picked (sampled) from those probabilities.\n4. That token is appended, and the loop repeats until a stop condition.\n\nLong, fluent answers emerge from this simple loop running hundreds of times.',
        },
        {
          h: 'Temperature: how adventurous the pick is',
          body:
            '**Temperature** reshapes the probabilities before sampling. Low temperature (near 0) makes the model almost always pick the top token — predictable, good for extraction and code. Higher temperature flattens the distribution so less likely tokens get picked more often — more varied, good for brainstorming, but also more likely to drift.',
        },
      ],
      terms: [
        { term: 'Generative model', def: 'A model that produces new data (text, images, audio) resembling its training data.' },
        { term: 'LLM', def: 'Large language model: a neural network trained on large amounts of text to predict the next token.' },
        { term: 'Sampling', def: 'Choosing the next token from the model’s probability distribution instead of always taking the top one.' },
        { term: 'Temperature', def: 'A setting that sharpens (low) or flattens (high) the next-token probabilities before sampling.' },
      ],
      example: {
        title: 'The generation loop in pseudocode',
        lang: 'python',
        code:
          'tokens = tokenize("The capital of France is")\nwhile not done:\n    probs = model.next_token_probabilities(tokens)\n    next_tok = sample(probs, temperature=0.2)\n    tokens.append(next_tok)\n    done = next_tok == END or len(tokens) > max_tokens\nprint(detokenize(tokens))',
        note: 'Every chat answer you have ever seen from an LLM came from a loop like this. The "intelligence" lives in how good the probabilities are.',
      },
      check: [
        {
          id: 'l1m1-p1', type: 'mc',
          q: 'A teammate says "the model searched its memory and found the answer." What is a more accurate description?',
          options: [
            'The model looked up the answer in an internal database of facts',
            'The model generated the answer token by token from learned probabilities',
            'The model copied the closest matching document from its training set',
            'The model asked a search engine and summarized the results',
          ],
          answer: 1,
          explain: 'A plain LLM has no lookup table. It predicts likely next tokens from patterns learned in training. (Retrieval systems that add search are covered in Level 7.)',
          topic: 'l1m1',
        },
        {
          id: 'l1m1-p2', type: 'mc',
          q: 'You need the model to extract invoice totals in exactly the same way every time. Which temperature is the better starting point?',
          options: ['0 or close to 0', '1.0', '1.5', 'Temperature does not affect consistency'],
          answer: 0,
          explain: 'Low temperature makes the most likely token win almost every time, which gives consistent, predictable output for extraction tasks.',
          topic: 'l1m1',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l1m2',
      title: 'Tokens and context windows',
      goal: 'Estimate token counts and predict when a prompt will not fit.',
      minutes: 14,
      skill: 'llms',
      visual: 'tokens',
      visualCaption:
        'Type or paste text. Notice that common words are one token while rare words and numbers split into pieces, then shrink the context window to see what gets cut off.',
      sections: [
        {
          h: 'What a token is',
          body:
            'Models do not read characters or whole words. They read **tokens**: frequent chunks of text from a fixed vocabulary. Common words are often one token (`the`, `model`), while rare words, names, and long numbers split into several (`tokenization` → `token` + `ization`).\n\nRule of thumb for English: **1 token ≈ 4 characters ≈ ¾ of a word**. Code, other languages, and numbers usually use more tokens per character.',
        },
        {
          h: 'The context window',
          body:
            'The **context window** is the maximum number of tokens a model can consider at once — the prompt **plus** the response it generates. If your instructions, documents, and chat history exceed it, something must be cut, summarized, or retrieved selectively.\n\n- Input tokens and output tokens both count toward the window.\n- Providers usually bill per token, so tokens also drive **cost**.\n- More tokens also means more **latency**.',
        },
        {
          h: 'Why this matters in real apps',
          body:
            'A support bot that pastes an entire 300-page manual into every prompt will be slow, expensive, and may overflow the window. Good GenAI engineers budget tokens: concise instructions, only the relevant documents (Level 7), and a reserved space for the answer.',
        },
      ],
      terms: [
        { term: 'Token', def: 'A chunk of text from the model’s vocabulary; the unit models read, write, and bill by.' },
        { term: 'Tokenizer', def: 'The component that converts text to token IDs and back.' },
        { term: 'Context window', def: 'The maximum number of tokens (input + output) a model can handle in one request.' },
        { term: 'Max output tokens', def: 'A request setting that caps how many tokens the model may generate.' },
      ],
      example: {
        title: 'Budgeting a request',
        lang: 'text',
        code:
          'Context window:          16,000 tokens\nSystem instructions:        400\nChat history:             2,100\nRetrieved documents:      9,000\nUser question:               60\nReserved for the answer:  1,500\n--------------------------------\nTotal:                   13,060  ✓ fits (2,940 spare)',
        note: 'Always reserve room for the answer. If the input alone fills the window, the model has no space to respond.',
      },
      check: [
        {
          id: 'l1m2-p1', type: 'mc',
          q: 'Roughly how many tokens is a 2,000-character English paragraph?',
          options: ['About 50', 'About 500', 'About 2,000', 'About 8,000'],
          answer: 1,
          explain: 'Using ≈4 characters per token, 2,000 ÷ 4 ≈ 500 tokens.',
          topic: 'l1m2',
        },
        {
          id: 'l1m2-p2', type: 'short',
          q: 'A model has an 8,000-token window. Your prompt is 7,900 tokens. What problem will you hit, and why?',
          keywords: [['answer', 'output', 'response', 'generate'], ['window', 'limit', 'space', 'room', 'fit', 'exceed']],
          min: 2,
          sample: 'The response will be cut off (or the request rejected) because input and output share the 8,000-token window, leaving only ~100 tokens for the answer.',
          explain: 'The key idea: the window covers input plus output, so a near-full prompt leaves almost no room to generate.',
          topic: 'l1m2',
        },
      ],
      challengeId: 'c-l1-1',
    },
    {
      id: 'l1m3',
      title: 'Training versus inference',
      goal: 'Describe what changes in a model during training and what happens when you call it.',
      minutes: 12,
      skill: 'foundations',
      visual: 'trainInfer',
      visualCaption:
        'Toggle between Training and Inference. Watch which arrows light up: in training the error flows backward and weights change; in inference data only flows forward.',
      sections: [
        {
          h: 'Training: learning the weights',
          body:
            'During **training**, the model sees huge amounts of example text. For each example it predicts the next token, compares the prediction with the real next token, and nudges its internal numbers — **weights** or **parameters** — to be a little less wrong next time.\n\nTraining is slow and expensive: many GPUs for weeks. It happens **before** you ever use the model.',
        },
        {
          h: 'Inference: using the weights',
          body:
            '**Inference** is what happens when you send a prompt. The weights are **frozen**; the model just runs the generation loop. Nothing it reads in your prompt permanently changes the model.\n\nThat is why a model does not "remember" yesterday’s conversation unless your application sends that history again in the prompt.',
        },
        {
          h: 'Pre-training, fine-tuning, and the knowledge cutoff',
          body:
            '- **Pre-training** builds general language ability from broad text.\n- **Fine-tuning** continues training on smaller, targeted data (e.g. following instructions, a company’s style).\n- The **knowledge cutoff** is the date the training data ends. Facts after it are unknown to the model unless you provide them in the prompt.',
        },
      ],
      terms: [
        { term: 'Weights / parameters', def: 'The learned numbers inside a model that determine its outputs.' },
        { term: 'Training', def: 'Adjusting weights to reduce prediction error on example data.' },
        { term: 'Inference', def: 'Running a trained model with frozen weights to produce outputs.' },
        { term: 'Fine-tuning', def: 'Additional training of a pre-trained model on specialized data.' },
        { term: 'Knowledge cutoff', def: 'The date after which the model’s training data has no information.' },
      ],
      example: null,
      check: [
        {
          id: 'l1m3-p1', type: 'mc',
          q: 'You tell a chatbot your name, close the app, and next week it does not know your name. Why?',
          options: [
            'The model forgot because its weights decayed',
            'Inference does not update weights, and the app did not resend the earlier conversation',
            'The model was retrained overnight',
            'Your name used too many tokens',
          ],
          answer: 1,
          explain: 'Prompts do not change weights. Memory across sessions only exists if the application stores it and sends it back as context.',
          topic: 'l1m3',
        },
        {
          id: 'l1m3-p2', type: 'mc',
          q: 'Which activity is the most compute-intensive, usually done once by the model provider?',
          options: ['Pre-training', 'A single inference call', 'Writing a prompt template', 'Counting tokens'],
          answer: 0,
          explain: 'Pre-training processes enormous datasets across many accelerators for weeks; inference calls are comparatively cheap.',
          topic: 'l1m3',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l1m4',
      title: 'The GenAI landscape and careers',
      goal: 'Name the main model families, their key limitation, and the role that builds GenAI apps.',
      minutes: 10,
      skill: 'career',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'Model families you will meet',
          body:
            '- **LLMs** — text and code generation, reasoning over documents, tool use.\n- **Diffusion models** — images and video, generated by gradually removing noise.\n- **Speech models** — speech-to-text and text-to-speech.\n- **Embedding models** — turn text into vectors for search (Level 7).\n- **Multimodal models** — accept several input types, e.g. text plus images.',
        },
        {
          h: 'The limitation you must design around',
          body:
            'Generative models optimize for **plausible** output, not **verified truth**. When they produce confident but false statements, it is called a **hallucination**.\n\nGood GenAI applications reduce this with grounding (giving the model trusted sources), structured outputs, evaluation, and human review for high-stakes decisions. You will build all of these in Levels 6–9.',
        },
        {
          h: 'Where you fit',
          body:
            'An **AI engineer / GenAI engineer** builds products on top of models: prompts, retrieval pipelines, tool integrations, evaluations, and deployment. This differs from an **ML research scientist**, who designs and trains new models.\n\nEmployers look for evidence: working projects, clear write-ups, and evaluation results. That is exactly what the Launch Summit capstone produces.',
        },
      ],
      terms: [
        { term: 'Hallucination', def: 'A fluent, confident model output that is false or unsupported by sources.' },
        { term: 'Diffusion model', def: 'A generative model that creates images by iteratively removing noise.' },
        { term: 'Multimodal', def: 'Able to process more than one type of input, such as text and images.' },
        { term: 'AI engineer', def: 'A developer who builds applications on top of AI models.' },
      ],
      example: null,
      check: [
        {
          id: 'l1m4-p1', type: 'mc',
          q: 'A model confidently cites a research paper that does not exist. What is this called?',
          options: ['Overfitting', 'Hallucination', 'Tokenization error', 'Rate limiting'],
          answer: 1,
          explain: 'A fabricated but fluent claim is a hallucination. It comes from optimizing for plausible text rather than verified facts.',
          topic: 'l1m4',
        },
        {
          id: 'l1m4-p2', type: 'mc',
          q: 'Which task is most typical of a GenAI/AI engineer rather than a research scientist?',
          options: [
            'Inventing a new attention mechanism',
            'Building a retrieval pipeline and evaluation suite for a support assistant',
            'Pre-training a model from scratch on a new architecture',
            'Proving theoretical bounds on generalization',
          ],
          answer: 1,
          explain: 'AI engineers integrate models into products: retrieval, prompts, tools, evaluation, deployment.',
          topic: 'l1m4',
        },
      ],
      challengeId: null,
    },
  ],
  challenges: [
    {
      id: 'c-l1-1', levelId: 'l1', missionId: 'l1m2', kind: 'code', lang: 'javascript',
      title: 'Token budget calculator', skill: 'llms',
      prompt:
        'Write two functions.\n\n1. `estimateTokens(text)` returns an estimate using **1 token per 4 characters**, rounded **up**. An empty string is 0 tokens.\n2. `fitsInWindow(promptText, maxOutputTokens, windowSize)` returns `true` if the estimated prompt tokens **plus** `maxOutputTokens` is **less than or equal to** `windowSize`.',
      starter:
        'function estimateTokens(text) {\n  // 1 token ≈ 4 characters, round up\n}\n\nfunction fitsInWindow(promptText, maxOutputTokens, windowSize) {\n  // input + output must fit in the window\n}\n\nconsole.log(estimateTokens("Hello, world!")); // try it\n',
      solution:
        'function estimateTokens(text) {\n  return Math.ceil(text.length / 4);\n}\n\nfunction fitsInWindow(promptText, maxOutputTokens, windowSize) {\n  return estimateTokens(promptText) + maxOutputTokens <= windowSize;\n}',
      hints: [
        '`text.length` gives the number of characters. Which Math function rounds up?',
        'estimateTokens is `Math.ceil(text.length / 4)`. fitsInWindow compares a sum with `<=`.',
      ],
      tests: [
        { call: 'estimateTokens("")', expect: 0 },
        { call: 'estimateTokens("abcd")', expect: 1 },
        { call: 'estimateTokens("abcde")', expect: 2 },
        { call: 'estimateTokens("x".repeat(2000))', expect: 500 },
        { call: 'fitsInWindow("x".repeat(400), 100, 200)', expect: true },
        { call: 'fitsInWindow("x".repeat(404), 100, 200)', expect: false },
      ],
    },
  ],
  test: {
    title: 'Spark Plains Checkpoint',
    intro: 'Eight questions on next-token prediction, tokens, training vs inference, and the GenAI landscape.',
    questions: [
      {
        id: 'l1t-q1', type: 'mc',
        q: 'Which description best matches how an LLM writes a paragraph?',
        options: [
          'It plans the whole paragraph, then prints it at once',
          'It repeatedly predicts a probability distribution over next tokens and samples one',
          'It retrieves a stored paragraph that matches the prompt',
          'It translates the prompt into a database query',
        ],
        answer: 1,
        explain: 'Generation is an autoregressive loop: predict the next-token distribution, sample, append, repeat.',
        topic: 'l1m1',
      },
      {
        id: 'l1t-q2', type: 'mc',
        q: 'You raise temperature from 0.2 to 1.2 on a brainstorming prompt. What should you expect?',
        options: [
          'Identical outputs, but faster',
          'More varied outputs, with a higher chance of off-topic or odd tokens',
          'Shorter outputs only',
          'The model gains access to newer knowledge',
        ],
        answer: 1,
        explain: 'Higher temperature flattens the distribution, so less likely tokens are sampled more often — more variety, less predictability.',
        topic: 'l1m1',
      },
      {
        id: 'l1t-q3', type: 'mc',
        q: 'A 12,000-character English document is roughly how many tokens?',
        options: ['300', '3,000', '12,000', '48,000'],
        answer: 1,
        explain: '12,000 characters ÷ ~4 characters per token ≈ 3,000 tokens.',
        topic: 'l1m2',
      },
      {
        id: 'l1t-q4', type: 'mc',
        q: 'Which change would most directly reduce the cost of each request in a chat app?',
        options: [
          'Sending only relevant documents instead of the whole knowledge base',
          'Raising the temperature',
          'Using a longer system prompt',
          'Increasing max output tokens',
        ],
        answer: 0,
        explain: 'Cost scales with tokens. Fewer input tokens (only the relevant documents) lowers cost and latency.',
        topic: 'l1m2',
      },
      {
        id: 'l1t-q5', type: 'mc',
        q: 'During inference, what happens to the model’s weights?',
        options: [
          'They are updated after every user message',
          'They stay frozen; only the prompt and generated tokens change',
          'They are reset to random values',
          'They are copied into the context window',
        ],
        answer: 1,
        explain: 'Inference runs a fixed model. Weights only change during training or fine-tuning.',
        topic: 'l1m3',
      },
      {
        id: 'l1t-q6', type: 'mc',
        q: 'A user asks about an event that happened after the model’s knowledge cutoff. What is the most reliable fix?',
        options: [
          'Lower the temperature to 0',
          'Ask the model to "think harder"',
          'Provide up-to-date information in the prompt (e.g. via retrieval)',
          'Increase the context window',
        ],
        answer: 2,
        explain: 'The model cannot know post-cutoff facts. Supplying trusted, current sources in the prompt is how apps handle this.',
        topic: 'l1m3',
      },
      {
        id: 'l1t-q7', type: 'short',
        q: 'Explain the difference between training and inference in one or two sentences.',
        keywords: [['weight', 'parameter'], ['learn', 'adjust', 'update', 'change'], ['frozen', 'fixed', 'use', 'run', 'prompt', 'generate', 'predict']],
        min: 2,
        sample: 'Training adjusts the model’s weights to reduce prediction error on example data; inference runs the trained model with frozen weights to generate outputs for a prompt.',
        explain: 'A complete answer mentions that training changes/learns weights, while inference uses the fixed weights to generate.',
        topic: 'l1m3',
      },
      {
        id: 'l1t-q8', type: 'short',
        q: 'What is a hallucination, and name one way an application can reduce it?',
        keywords: [['false', 'incorrect', 'made up', 'fabricat', 'wrong', 'unsupported', 'not true'], ['source', 'ground', 'retriev', 'evaluat', 'review', 'verif', 'check', 'cite', 'context']],
        min: 2,
        sample: 'A hallucination is a confident but false or unsupported output. Grounding the model in retrieved trusted sources (and checking answers against them) reduces it.',
        explain: 'Define it as plausible-but-false output, then name a mitigation such as grounding/retrieval, evaluation, citations, or human review.',
        topic: 'l1m4',
      },
    ],
  },
  boss: null,
  review: [
    { missionId: 'l1m5', tip: 'Replay the sorting game until you can place every app in its AI family on the first try.' },
    { missionId: 'l1m6', tip: 'Step through the agent loop visual and name the tool used in each "Act" step.' },
    { missionId: 'l1m1', tip: 'Replay the prompt-flow visual at temperatures 0, 0.7 and 1.5 and describe what changes.' },
    { missionId: 'l1m2', tip: 'Re-read the token budget example and redo the token budget challenge.' },
    { missionId: 'l1m3', tip: 'Toggle the training/inference visual and say aloud which arrows exist in each mode.' },
    { missionId: 'l1m4', tip: 'List the five model families and one realistic use for each.' },
  ],
};
