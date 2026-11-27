// Level 2 — Python for AI (Python Grove)
export default {
  id: 'l2',
  num: 2,
  title: 'Python for AI',
  region: 'Python Grove',
  tagline: 'The slice of Python that AI engineers reach for every single day.',
  overview:
    'Almost every GenAI library, tutorial, and job posting assumes Python. This level covers the parts you will actually use: core data types, functions and error handling, packages and virtual environments, JSON and tabular data, and calling web APIs safely with keys kept out of your code.',
  objectives: [
    'Use lists, dicts, comprehensions, and f-strings to clean data and build prompts',
    'Write functions that handle errors deliberately and set up an isolated project environment with pip',
    'Load JSON and JSON Lines files and inspect data with NumPy arrays and pandas DataFrames',
    'Call a web API with requests, check the response, and keep API keys out of source code',
  ],
  skills: ['python', 'apis'],
  missions: [
    {
      id: 'l2m1',
      title: 'Core Python for AI work',
      goal: 'Clean a list of texts and turn it into a prompt using lists, dicts, comprehensions, and f-strings.',
      minutes: 15,
      skill: 'python',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'The values you handle all day',
          body:
            'Python values have types, and you rarely need to declare them:\n\n- `str` — text: prompts, model responses, documents.\n- `int` and `float` — counts and scores, such as `3` and `0.92`.\n- `bool` — `True` or `False`.\n- `None` — "no value", often returned when something is missing.\n- `list` — an ordered collection: `["cat", "dog"]`.\n- `dict` — key-value pairs: `{"role": "user", "content": "Hi"}`.\n\nChat messages, API payloads, and model settings are almost always lists of dicts, so these two types matter most.',
        },
        {
          h: 'Indexing, slicing, and safe lookups',
          body:
            'Lists start at index 0, and negative indexes count from the end: `items[-1]` is the last item. A **slice** `items[a:b]` returns a new list from index `a` up to, but not including, `b`. So `history[-3:]` keeps the last three chat messages.\n\nFor dicts, `d["key"]` raises a **KeyError** if the key is missing. When a key is optional, use `d.get("key", default)`, which returns the default instead of crashing. Keys are case-sensitive: `"Label"` and `"label"` are different keys.',
        },
        {
          h: 'Comprehensions and f-strings',
          body:
            'A **list comprehension** builds a new list in one readable line:\n\n```python\nclean = [t.strip().lower() for t in texts if t.strip()]\n```\n\nRead it as "for each `t` in `texts`, keep it if it is not blank, and store its cleaned form." Dict comprehensions work the same way: `{w: len(w) for w in words}`.\n\nAn **f-string** inserts values into text: `f"Score: {score:.2f}"` shows a float with two decimals. Most prompt templates in real apps are just f-strings filled with data.',
        },
      ],
      terms: [
        { term: 'List', def: 'An ordered, changeable collection of values, indexed from 0.' },
        { term: 'Dictionary (dict)', def: 'A collection of key-value pairs; looking up a missing key with square brackets raises KeyError.' },
        { term: 'Slice', def: 'A sub-list taken with [start:stop], where the stop index is excluded.' },
        { term: 'List comprehension', def: 'A compact expression that builds a list by transforming and optionally filtering another collection.' },
        { term: 'f-string', def: 'A string prefixed with f in which expressions inside braces are evaluated and inserted.' },
      ],
      example: {
        title: 'From messy reviews to a prompt',
        lang: 'python',
        code:
          'reviews = ["Great battery life", "   ", "Screen cracked within a week", ""]\nclean = [r.strip() for r in reviews if r.strip()]\n\nlines = [f"{i}. {r}" for i, r in enumerate(clean, start=1)]\nprompt = "Label each review as positive or negative:\\n" + "\\n".join(lines)\nprint(prompt)\n# Label each review as positive or negative:\n# 1. Great battery life\n# 2. Screen cracked within a week',
        note: 'Blank entries are filtered out before they waste tokens, and `enumerate` numbers the items. The same three lines work for four reviews or four thousand.',
      },
      check: [
        {
          id: 'l2m1-p1', type: 'mc',
          q: 'Your settings dict may or may not contain the key "max_tokens". Which expression reads it with a fallback of 256 and never crashes?',
          options: [
            'settings["max_tokens"]',
            'settings.max_tokens or 256',
            'settings["max_tokens", 256]',
            'settings.get("max_tokens", 256)',
          ],
          answer: 3,
          explain: '`.get(key, default)` returns the default when the key is missing. Square brackets raise KeyError for a missing key, and dicts do not support attribute access like `settings.max_tokens`.',
          topic: 'l2m1',
        },
        {
          id: 'l2m1-p2', type: 'mc',
          q: 'What does [w.lower() for w in ["Cat", "DOG", "bird"] if len(w) == 3] evaluate to?',
          options: ['[\'cat\', \'dog\']', '[\'Cat\', \'DOG\']', '[\'cat\', \'dog\', \'bird\']', '[\'bird\']'],
          answer: 0,
          explain: 'The `if` filter keeps only the 3-letter words ("Cat" and "DOG"), and the expression before `for` lowercases each kept word. "bird" has 4 letters, so it is dropped.',
          topic: 'l2m1',
        },
        {
          id: 'l2m1-p3', type: 'mc',
          q: 'With score = 0.8765, what does print(f"Score: {score:.2f}") show?',
          options: ['Score: 0.87', 'Score: 0.88', 'Score: {score:.2f}', 'Score: 0.8765'],
          answer: 1,
          explain: '`:.2f` formats the float with two decimals, rounding 0.8765 to 0.88. Without the `f` prefix, the braces would be printed literally.',
          topic: 'l2m1',
        },
      ],
      challengeId: 'c-l2-1',
    },
    {
      id: 'l2m2',
      title: 'Functions, environments, and errors',
      goal: 'Write a reusable function that handles bad input, and set up a project with its own virtual environment.',
      minutes: 16,
      skill: 'python',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'Functions: name a step, reuse it',
          body:
            'A function packages a step you will repeat:\n\n```python\ndef build_prompt(question, context="", max_chars=2000):\n    text = f"Context:\\n{context}\\n\\nQuestion: {question}"\n    return text[:max_chars]\n```\n\n- **Parameters** can have defaults (`context=""`), so callers pass only what changes.\n- `return` sends a value back. A function that never reaches `return` gives back `None` — a common source of "NoneType has no attribute" errors.\n- Keep functions small and focused: one cleans, one builds the prompt, one calls the model.',
        },
        {
          h: 'Modules, pip, and virtual environments',
          body:
            'A **module** is a Python file you can import; a **package** is a collection of modules. The standard library ships with Python (`json`, `os`, `pathlib`). Third-party packages such as `requests`, `numpy`, and `pandas` are installed with **pip**.\n\nInstall them into a **virtual environment** — a per-project folder with its own packages — so projects that need different versions never clash:\n\n```bash\npython -m venv .venv\nsource .venv/bin/activate      # Windows: .venv\\Scripts\\activate\npip install requests pandas\npip freeze > requirements.txt  # record exact versions\n```\n\nTeammates recreate your setup with `pip install -r requirements.txt`.',
        },
        {
          h: 'Handling errors with try/except',
          body:
            'When something goes wrong, Python raises an **exception**: `KeyError` (missing dict key), `ValueError` (bad value, e.g. `int("ten")`), `TypeError` (wrong type), `FileNotFoundError`. Unhandled, it stops the program.\n\n```python\ntry:\n    count = int(user_value)\nexcept ValueError:\n    count = 0  # fall back and keep going\n```\n\nCatch the **specific** exceptions you expect and can handle. A bare `except:` that silently passes hides real bugs and makes failures impossible to trace. AI apps hit expected failures constantly — timeouts, malformed model output, missing fields — so deliberate error handling is a core skill.',
        },
      ],
      terms: [
        { term: 'Function', def: 'A named, reusable block of code that takes parameters and can return a value.' },
        { term: 'Module', def: 'A Python file whose functions and variables can be imported into other code.' },
        { term: 'pip', def: 'Python’s package installer, used to add third-party libraries to an environment.' },
        { term: 'Virtual environment', def: 'An isolated, per-project set of installed Python packages, usually in a .venv folder.' },
        { term: 'Exception', def: 'An error raised at runtime that stops the program unless it is caught with try/except.' },
      ],
      example: {
        title: 'A defensive helper',
        lang: 'python',
        code:
          'def to_score(value, default=None):\n    """Convert model output like " 0.87 " to a float, or return default."""\n    try:\n        score = float(value)\n    except (ValueError, TypeError):\n        return default\n    if not 0.0 <= score <= 1.0:\n        raise ValueError(f"score out of range: {score}")\n    return score\n\nprint(to_score(" 0.87 "))   # 0.87\nprint(to_score("high"))     # None\nprint(to_score(None, 0.0))  # 0.0',
        note: 'Expected bad input returns a default, while an impossible value raises a clear error instead of slipping through. Deciding which failures to absorb and which to surface is the real skill.',
      },
      check: [
        {
          id: 'l2m2-p1', type: 'mc',
          q: 'A function build_prompt(q) computes text = f"Answer briefly: {q}" but has no return statement. After p = build_prompt("Hi"), what is p?',
          options: ['"Answer briefly: Hi"', 'None', 'An empty string', 'It raises a SyntaxError'],
          answer: 1,
          explain: 'A function that ends without `return` gives back `None`. The f-string was built and then thrown away, so a later `p.upper()` would fail with an AttributeError about NoneType.',
          topic: 'l2m2',
        },
        {
          id: 'l2m2-p2', type: 'mc',
          q: 'A teammate’s script runs on their laptop, but on yours it fails with ModuleNotFoundError: No module named \'pandas\'. What is the best fix?',
          options: [
            'Create and activate a virtual environment for the project, then run pip install -r requirements.txt',
            'Wrap the import in try/except and continue without it',
            'Rename the import to import panda',
            'Copy the pandas folder from their computer into yours',
          ],
          answer: 0,
          explain: 'The package is simply not installed in your environment. Recreating the project environment from `requirements.txt` installs the same versions your teammate uses.',
          topic: 'l2m2',
        },
        {
          id: 'l2m2-p3', type: 'short',
          q: 'Why is wrapping a whole script in try with a bare except: pass a bad idea?',
          keywords: [
            ['hide', 'hidden', 'hiding', 'mask', 'swallow', 'silen', 'ignor', 'unnoticed', 'invisible', 'never see', 'not see', 'disappear', 'suppress'],
            ['bug', 'error', 'problem', 'mistake', 'exception', 'failure', 'crash', 'wrong'],
            ['debug', 'trace', 'find', 'fix', 'diagnos', 'cause', 'track', 'know'],
          ],
          min: 2,
          sample: 'It silently swallows every error, including real bugs, so the program carries on with bad data and you cannot see or trace what actually failed.',
          explain: 'A good answer says a catch-all hides errors (including unexpected bugs) and makes them hard to find and fix. Catch only the specific exceptions you know how to handle.',
          topic: 'l2m2',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l2m3',
      title: 'Working with data: JSON, files, NumPy, pandas',
      goal: 'Load JSON and JSON Lines files, and inspect numbers and tables with NumPy and pandas.',
      minutes: 18,
      skill: 'python',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'JSON: the format APIs speak',
          body:
            '**JSON** is text that represents nested data. Python’s built-in `json` module converts both ways:\n\n- `json.loads(text)` parses a JSON string into Python objects.\n- `json.dumps(obj)` turns Python objects into a JSON string.\n- `json.load(f)` and `json.dump(obj, f)` do the same with files.\n\nObjects become dicts, arrays become lists, `true`/`false` become `True`/`False`, and `null` becomes `None`. A model asked to "reply in JSON" still returns a **string**: you must parse it, and parsing fails with `json.JSONDecodeError` if the text is not valid JSON.',
        },
        {
          h: 'Files and JSON Lines',
          body:
            'Open files in a `with` block so they close automatically, and state the encoding:\n\n```python\nimport json\nrecords = []\nwith open("data.jsonl", encoding="utf-8") as f:\n    for line in f:\n        records.append(json.loads(line))\n```\n\n**JSON Lines** (`.jsonl`) stores one JSON object per line. It is a common format for training datasets, evaluation results, and logs because you can append and stream records one line at a time instead of loading one giant document.',
        },
        {
          h: 'NumPy: fast math on arrays',
          body:
            'A **NumPy array** stores numbers of one type in a compact block and applies an operation to every element at once (**vectorized**):\n\n```python\nimport numpy as np\nv = np.array([1.0, 2.0, 2.0])\nprint(v * 2)     # [2. 4. 4.]\nprint(v.shape)   # (3,)\nprint(v @ v)     # dot product: 9.0\n```\n\nCompare a list: `[1, 2] * 2` repeats it to `[1, 2, 1, 2]`. Embeddings (Level 7) and model weights are arrays, and a batch of them is a 2-D array with shape `(rows, columns)`.',
        },
        {
          h: 'pandas: tables you can query',
          body:
            'A **DataFrame** is a table with named columns — a spreadsheet in code. A few calls cover most dataset inspection:\n\n- `df = pd.read_csv("reviews.csv")` loads a table.\n- `df.head()` shows the first rows; `df.shape` gives `(rows, columns)`.\n- `df["label"].value_counts()` counts each class, revealing imbalance.\n- `df[df["score"] > 0.8]` keeps rows that match a condition.\n- `df.isna().sum()` counts missing values per column.\n\nLook at your data before feeding it to a model: duplicates, blanks, and odd labels are far cheaper to fix early.',
        },
      ],
      terms: [
        { term: 'JSON', def: 'A text format for nested data (objects, arrays, strings, numbers, true/false, null) used by almost every web API.' },
        { term: 'JSON Lines', def: 'A file format with one complete JSON object per line, common for datasets and logs.' },
        { term: 'NumPy array', def: 'A grid of same-typed numbers with a shape, supporting fast element-wise and matrix math.' },
        { term: 'DataFrame', def: 'A pandas table with labeled columns that supports filtering, grouping, and summaries.' },
        { term: 'Vectorized operation', def: 'An operation applied to a whole array at once instead of looping over elements in Python.' },
      ],
      example: {
        title: 'Summarizing evaluation results',
        lang: 'python',
        code:
          'import json\nimport pandas as pd\n\nrows = []\nwith open("eval_results.jsonl", encoding="utf-8") as f:\n    for line in f:\n        rows.append(json.loads(line))  # {"question": ..., "correct": true, ...}\n\ndf = pd.DataFrame(rows)\nprint(df.shape)                   # (number of rows, number of columns)\nprint(df["correct"].mean())       # share of correct answers\nprint(df[~df["correct"]].head())  # inspect the failures',
        note: 'True counts as 1 and False as 0, so the mean of a boolean column is the accuracy. pandas can also load this file in one call with `pd.read_json("eval_results.jsonl", lines=True)`.',
      },
      check: [
        {
          id: 'l2m3-p1', type: 'mc',
          q: 'a = [1, 2, 3] is a list and b = np.array([1, 2, 3]) is a NumPy array. What are a * 2 and b * 2?',
          options: [
            'Both are [2, 4, 6]',
            'a * 2 is [2, 4, 6]; b * 2 is array([1, 2, 3, 1, 2, 3])',
            'a * 2 is [1, 2, 3, 1, 2, 3]; b * 2 is array([2, 4, 6])',
            'Both raise a TypeError',
          ],
          answer: 2,
          explain: 'Multiplying a list by an integer repeats it. A NumPy array applies the multiplication to every element, which is exactly what you want for numeric data.',
          topic: 'l2m3',
        },
        {
          id: 'l2m3-p2', type: 'mc',
          q: 'A model returned the text {"sentiment": "positive", "confidence": 0.92}, stored in the variable reply. What must happen before you can read the confidence value?',
          options: [
            'Nothing; reply already behaves like a dict',
            'Call float(reply)',
            'Call reply.strip()',
            'Parse it with data = json.loads(reply), then read data["confidence"]',
          ],
          answer: 3,
          explain: 'The response is a `str`. Indexing a string with "confidence" raises a TypeError. `json.loads` converts the text into a dict first.',
          topic: 'l2m3',
        },
        {
          id: 'l2m3-p3', type: 'mc',
          q: 'Which pandas expression keeps only the rows whose score column is above 0.8?',
          options: ['df[df["score"] > 0.8]', 'df["score" > 0.8]', 'df.score.filter(0.8)', 'df.drop(0.8)'],
          answer: 0,
          explain: 'The inner `df["score"] > 0.8` produces True/False for each row, and indexing the DataFrame with that boolean mask keeps the True rows. `"score" > 0.8` compares a string with a number, which raises a TypeError.',
          topic: 'l2m3',
        },
      ],
      challengeId: 'c-l2-2',
    },
    {
      id: 'l2m4',
      title: 'Calling web APIs from Python',
      goal: 'Send an authenticated API request with requests, handle the response, and keep the key out of your code.',
      minutes: 16,
      skill: 'apis',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'HTTP in one minute',
          body:
            'A web API call is an HTTP **request**: a method (`GET` to read, `POST` to send data), a URL, **headers** (such as your API key), and often a JSON **body**. The server answers with a **status code** and a body, usually JSON.\n\n- `200` — success.\n- `400` — bad request: your payload is malformed.\n- `401` / `403` — missing or invalid key, or no permission.\n- `404` — wrong URL.\n- `429` — too many requests: you hit a rate limit.\n- `5xx` — a server-side problem, often temporary.',
        },
        {
          h: 'Making the call with requests',
          body:
            'The `requests` library keeps calls short. Three habits make them reliable:\n\n- Always pass a `timeout`, or one stuck connection can freeze your program indefinitely.\n- Call `resp.raise_for_status()` so 4xx/5xx responses raise an error instead of being parsed as if they succeeded.\n- Parse with `resp.json()`, then read fields defensively with `.get()`.\n\nFor `429` and `5xx` errors, **retry with exponential backoff**: wait 1 s, then 2 s, then 4 s, up to a limit. Never retry a `400` or `401` unchanged — the request itself is wrong.',
        },
        {
          h: 'Secrets belong in the environment',
          body:
            'An **API key** is a password that can spend your money. Never write it in source code, notebooks, or front-end code, and never commit it.\n\n- Read it from an **environment variable**: `os.environ["MODEL_API_KEY"]` (fails loudly if missing) or `os.getenv("MODEL_API_KEY")`.\n- For local development, keep keys in a `.env` file loaded by a library such as `python-dotenv`, and add `.env` to `.gitignore`.\n- If a key leaks, **revoke and rotate it immediately**. Deleting the line is not enough: the key stays in git history and may already have been copied.',
        },
      ],
      terms: [
        { term: 'HTTP status code', def: 'A three-digit number in a response that says whether the request succeeded and, if not, roughly why.' },
        { term: 'API key', def: 'A secret token that identifies and bills your account when you call an API.' },
        { term: 'Environment variable', def: 'A named value set outside the program (in the shell or a .env file) that code reads at runtime.' },
        { term: 'Rate limit', def: 'A cap on how many requests or tokens you may send per time window; exceeding it returns status 429.' },
        { term: 'Exponential backoff', def: 'A retry strategy that roughly doubles the wait after each failed attempt.' },
      ],
      example: {
        title: 'A safe API call',
        lang: 'python',
        code:
          'import os\nimport requests\n\nAPI_URL = "https://api.example.com/v1/generate"   # placeholder endpoint\napi_key = os.environ["MODEL_API_KEY"]             # set outside the code\n\npayload = {"prompt": "Summarize in one line: ...", "max_tokens": 60}\nheaders = {"Authorization": f"Bearer {api_key}"}\n\nresp = requests.post(API_URL, json=payload, headers=headers, timeout=30)\nresp.raise_for_status()   # stop here on 4xx/5xx\ndata = resp.json()        # JSON body -> dict\nprint(data.get("text", "<no text field>"))',
        note: 'The endpoint and field names are placeholders; every provider documents its own. The shape is universal: key from the environment, JSON payload, timeout, status check, parse.',
      },
      check: [
        {
          id: 'l2m4-p1', type: 'mc',
          q: 'Your first API call returns status 401. What is the most likely cause?',
          options: [
            'The server is temporarily overloaded',
            'You sent requests too quickly',
            'The API key is missing, wrong, or not being sent in the header',
            'The JSON response could not be parsed',
          ],
          answer: 2,
          explain: '401 means the server could not authenticate you. Check that the environment variable is set and that the header name and format match the provider’s docs. Overload shows up as 5xx, and sending too fast as 429.',
          topic: 'l2m4',
        },
        {
          id: 'l2m4-p2', type: 'mc',
          q: 'A batch job sends 1,000 requests in a tight loop and starts receiving 429 responses. What is the best fix?',
          options: [
            'Retry failed calls after increasing waits (exponential backoff) and lower the request rate',
            'Retry immediately in a loop until it works',
            'Switch from POST to GET',
            'Create a new API key for every request',
          ],
          answer: 0,
          explain: '429 means you exceeded a rate limit. Backing off and pacing requests lets the job finish. Retrying instantly makes the problem worse, and rotating keys to dodge limits violates most terms of service.',
          topic: 'l2m4',
        },
        {
          id: 'l2m4-p3', type: 'short',
          q: 'You accidentally pushed a commit containing an API key to a public repository. What should you do now, and how do you prevent it next time?',
          keywords: [
            ['revoke', 'rotate', 'regenerat', 'new key', 'replace', 'disable', 'invalidat', 'deactivat', 'cancel', 'delete the key', 'reset'],
            ['environment', 'env', 'getenv', 'secret', 'gitignore', 'vault', 'outside the code', 'out of the code', 'not in the code', 'config'],
          ],
          min: 2,
          sample: 'Revoke the key and create a new one right away, because it stays in git history. From now on, load keys from environment variables or a git-ignored .env file instead of the code.',
          explain: 'Two parts: immediately revoke or rotate the leaked key (removing the commit is not enough), and keep keys outside source code, for example in environment variables with `.env` listed in `.gitignore`.',
          topic: 'l2m4',
        },
      ],
      challengeId: null,
    },
  ],
  challenges: [
    {
      id: 'c-l2-1', levelId: 'l2', missionId: 'l2m1', kind: 'predict', lang: 'python',
      title: 'Predict the word counts', skill: 'python',
      prompt: 'Counting words is the first step of many text pipelines. What exactly does this code print?',
      code:
        'tokens = ["the", "cat", "sat", "on", "the", "mat"]\ncounts = {}\nfor t in tokens:\n    counts[t] = counts.get(t, 0) + 1\n\nprint(counts["the"], len(counts), tokens[-2:])',
      options: ['2 6 [\'the\', \'mat\']', '1 5 [\'mat\']', '2 5 [\'the\', \'mat\']', '2 5 [\'on\', \'the\']'],
      answer: 2,
      explain:
        '`counts.get(t, 0)` returns 0 for a word not seen yet, so the first "the" becomes 1 and the second becomes 2. A dict holds each key once, so it has 5 keys (the, cat, sat, on, mat), not 6. `tokens[-2:]` slices from the second-to-last item to the end and always returns a list. `print` separates its arguments with spaces.',
      hints: [
        'A dictionary can hold each key only once. How many different words are in the list?',
        '`tokens[-2:]` means "from the second-to-last item to the end", and a slice is always a list.',
      ],
    },
    {
      id: 'c-l2-2', levelId: 'l2', missionId: 'l2m3', kind: 'predict', lang: 'python',
      title: 'Predict the parser', skill: 'python',
      prompt: 'This helper reads a label from model output and handles two kinds of failure. What exactly does the last line print?',
      code:
        'import json\n\ndef get_label(raw):\n    try:\n        return json.loads(raw)["label"]\n    except json.JSONDecodeError:\n        return "bad json"\n    except KeyError:\n        return "missing label"\n\nprint(get_label(\'{"label": "spam"}\'), get_label(\'{"Label": "spam"}\'), get_label("label: spam"), sep=" | ")',
      options: [
        'spam | spam | bad json',
        'spam | missing label | missing label',
        'The program stops with KeyError: \'label\'',
        'spam | missing label | bad json',
      ],
      answer: 3,
      explain:
        'The first string is valid JSON with a "label" key, so it returns spam. The second parses fine, but keys are case-sensitive: "Label" is not "label", so `KeyError` is raised and caught. The third is not valid JSON at all (no braces, unquoted text), so `json.loads` raises `JSONDecodeError` before any key lookup. `sep=" | "` places the separator between the printed values.',
      hints: [
        'Work through each call separately: does json.loads succeed, and if so, does the exact key "label" exist?',
        'Dict keys are case-sensitive, and "label: spam" is not valid JSON because it has no braces or quotes.',
      ],
    },
  ],
  test: {
    title: 'Python Grove Checkpoint',
    intro: 'Eight questions on core Python, functions and environments, data handling, and calling APIs safely.',
    questions: [
      {
        id: 'l2t-q1', type: 'mc',
        q: 'What does print({w: len(w) for w in ["ai", "model", "ai"]}) output?',
        options: ['{\'ai\': 2, \'model\': 5, \'ai\': 2}', '{\'ai\': 2, \'model\': 5}', '[2, 5, 2]', '{2: \'ai\', 5: \'model\'}'],
        answer: 1,
        explain: 'A dict comprehension builds `key: value` pairs. Keys are unique, so the second "ai" overwrites the first entry with the same value, leaving two entries.',
        topic: 'l2m1',
      },
      {
        id: 'l2t-q2', type: 'mc',
        q: 'The list messages holds 12 chat turns, oldest first. To fit the context window you keep only the 5 most recent. Which expression does that?',
        options: ['messages[5:]', 'messages[:5]', 'messages[-5]', 'messages[-5:]'],
        answer: 3,
        explain: '`messages[-5:]` slices from the fifth-from-last item to the end. `[:5]` keeps the oldest five, `[5:]` keeps seven, and `[-5]` is a single message, not a list.',
        topic: 'l2m1',
      },
      {
        id: 'l2t-q3', type: 'mc',
        q: 'get_label(d) returns d["label"] inside a try block and returns "unknown" in an except KeyError block. What does get_label({"Label": "spam"}) return?',
        options: ['"unknown"', '"spam"', 'It crashes with KeyError', 'None'],
        answer: 0,
        explain: 'Dict keys are case-sensitive: "Label" is not "label", so `d["label"]` raises KeyError, which the except block turns into "unknown". Silent key mismatches like this are a common bug when parsing model output.',
        topic: 'l2m2',
      },
      {
        id: 'l2t-q4', type: 'mc',
        q: 'Project A needs version 1 of a library and Project B needs version 2, both on the same laptop. What is the standard solution?',
        options: [
          'Install version 2 globally and hope Project A still works',
          'Uninstall and reinstall the right version every time you switch projects',
          'Give each project its own virtual environment with its own requirements.txt',
          'Copy the library source code into each project by hand',
        ],
        answer: 2,
        explain: 'Virtual environments isolate packages per project, and `requirements.txt` records exactly which versions each one needs, so both projects work side by side.',
        topic: 'l2m2',
      },
      {
        id: 'l2t-q5', type: 'mc',
        q: 'A DataFrame df of evaluation results has a True/False column named correct. Which expression gives the fraction of answers that were correct?',
        options: ['df["correct"].count()', 'len(df["correct"])', 'df["correct"].max()', 'df["correct"].mean()'],
        answer: 3,
        explain: 'True counts as 1 and False as 0, so the mean is the share of correct answers. `count()` and `len()` return the number of rows, and `max()` only tells you whether any answer was correct.',
        topic: 'l2m3',
      },
      {
        id: 'l2t-q6', type: 'mc',
        q: 'A script summarizes 2,000 documents through a model API. Around document 300 it starts receiving status 429. What should you change?',
        options: [
          'Remove the Authorization header',
          'Add retries with exponential backoff and slow down the request rate',
          'Increase max_tokens on every request',
          'Switch the request method to GET',
        ],
        answer: 1,
        explain: '429 means you are being rate limited. Waiting progressively longer before retrying, and pacing requests, lets the job finish. Removing the key would only turn 429s into 401s.',
        topic: 'l2m4',
      },
      {
        id: 'l2t-q7', type: 'short',
        q: 'A model returned the text {"score": 0.9}. Your code runs result["score"] and gets TypeError: string indices must be integers, not \'str\'. What went wrong, and how do you fix it?',
        keywords: [
          ['string', 'str', 'text', 'json', 'not a dict', 'unparsed', 'raw', 'forgot', 'never'],
          ['json.loads', 'loads', 'pars', 'convert', 'decode', 'deserializ', 'into a dict', 'to a dict'],
        ],
        min: 2,
        sample: 'The response is still a JSON string, not a dict, so indexing it with "score" fails. Parse it first with data = json.loads(result), then read data["score"].',
        explain: 'Name the cause (the value is a string, not a parsed dict) and the fix (parse it with `json.loads`, ideally inside `try/except json.JSONDecodeError`).',
        topic: 'l2m3',
      },
      {
        id: 'l2t-q8', type: 'short',
        q: 'Why should an API key be read from an environment variable instead of being written into your Python file?',
        keywords: [
          ['leak', 'expos', 'commit', 'git', 'repo', 'share', 'public', 'steal', 'stolen', 'visible', 'see it', 'see the', 'anyone', 'secur', 'safe', 'push', 'upload'],
          ['key', 'secret', 'credential', 'password', 'code', 'environment', 'env', 'outside', 'separate'],
        ],
        min: 2,
        sample: 'Code gets committed, shared, and pushed to repositories, so a hard-coded key can leak and be abused. An environment variable keeps the secret out of the code and lets each machine or deployment use its own key.',
        explain: 'A good answer says that keys in code end up in commits and shared files where they can leak, while environment variables keep the secret outside the code.',
        topic: 'l2m4',
      },
    ],
  },
  boss: {
    id: 'l2b',
    title: 'The Data Wrangler',
    story:
      'A teammate’s pipeline turns raw model responses into a clean dataset, and it keeps crashing the night before a demo. The Data Wrangler has tied five knots into the script; untangle at least four to get the data through.',
    minutes: 20,
    hp: 5,
    toWin: 4,
    questions: [
      {
        id: 'l2b-q1', type: 'mc',
        q: 'The script runs label = data["choices"][0]["label"] and crashes with KeyError: \'label\'. Printing data shows {\'choices\': [{\'text\': \'{"label": "spam"}\'}]}. What is the fix?',
        options: [
          'Change the key to "Label" with a capital L',
          'Wrap the line in try/except KeyError and continue',
          'Call resp.json() a second time on data',
          'The label sits inside a JSON string: parse data["choices"][0]["text"] with json.loads, then read ["label"]',
        ],
        answer: 3,
        explain: 'The "text" field holds a **string** that happens to contain JSON. The outer response was parsed, but the inner payload was not. Parse it with `json.loads`, inside `try/except json.JSONDecodeError`, because model text is not always valid JSON.',
        topic: 'l2m3',
      },
      {
        id: 'l2b-q2', type: 'mc',
        q: 'Line 3 of the script reads API_KEY = "a9f3c1..." and the repository is about to become public. The key has been in the git history for a month. What is the right move?',
        options: [
          'Read the key with os.environ, keep it in a git-ignored .env file locally, and revoke and rotate the old key',
          'Delete line 3 and push a new commit',
          'Base64-encode the key so it is not readable',
          'Rename the variable to something less obvious',
        ],
        answer: 0,
        explain: 'Once committed, a key lives in history and must be treated as compromised: revoke and rotate it, then load secrets from the environment. Encoding or renaming hides nothing — base64 is trivially reversible.',
        topic: 'l2m4',
      },
      {
        id: 'l2b-q3', type: 'mc',
        q: 'A loop adds up r["confidence"] over 5,000 parsed records and crashes on record 37, which has no "confidence" field. What is the best fix?',
        options: [
          'Wrap the whole loop in try/except: pass',
          'Delete record 37 by hand and rerun',
          'Use r.get("confidence"), skip records where it is None, and count how many were skipped',
          'Set every missing confidence to 1.0',
        ],
        answer: 2,
        explain: '`.get()` avoids the crash, and counting the skipped records keeps the data problem visible. A bare except around the loop stops at the first error and hides it, hand edits do not scale, and inventing 1.0 corrupts the average.',
        topic: 'l2m2',
      },
      {
        id: 'l2b-q4', type: 'mc',
        q: 'df["score"].mean() raises a TypeError. Inspecting the column shows strings such as "0.91", "0.78", and "n/a". Which fix gives a correct average?',
        options: [
          'df["score"].astype(str).mean()',
          'pd.to_numeric(df["score"], errors="coerce").mean(), which turns "n/a" into NaN and skips it',
          'Replace "n/a" with 0, then take the mean',
          'Sort the column first, then take the mean',
        ],
        answer: 1,
        explain: '`pd.to_numeric(..., errors="coerce")` converts valid numbers and turns unparseable values into NaN, and `.mean()` skips NaN by default. Replacing "n/a" with 0 silently drags the average down. Also report how many values were missing.',
        topic: 'l2m3',
      },
      {
        id: 'l2b-q5', type: 'short',
        q: 'The final step calls the model API 2,000 times. Sometimes a single call hangs forever, and sometimes the run dies on a 429 response. Name two changes that make this loop robust.',
        keywords: [
          ['timeout', 'time out', 'time-out', 'time limit'],
          ['retry', 'retries', 'backoff', 'back off', 'back-off', 'wait', 'sleep', 'delay', 'slow', 'pause', 'throttl', 'rate'],
        ],
        min: 2,
        sample: 'Pass a timeout to every request so a stuck call fails instead of hanging, and catch 429 (and 5xx) responses and retry them with exponential backoff while pacing the request rate.',
        explain: 'The two fixes are a request `timeout` (so hangs become catchable errors) and retries with exponential backoff plus rate pacing (so rate limits are survived instead of fatal).',
        topic: 'l2m4',
      },
    ],
    project: null,
  },
  review: [
    { missionId: 'l2m1', tip: 'Rewrite the review-cleaning example from memory, then predict the word-count challenge output again without looking.' },
    { missionId: 'l2m2', tip: 'Create a fresh virtual environment, install one package, and write a function that converts text to a float using try/except ValueError.' },
    { missionId: 'l2m3', tip: 'Parse a small JSON string with json.loads, then practice head, shape, value_counts, filtering, and isna on any CSV file.' },
    { missionId: 'l2m4', tip: 'Write down what 200, 400, 401, 429, and 5xx each tell you, and move any hard-coded key in your own projects into an environment variable.' },
  ],
};
