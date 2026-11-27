// Level 5 — Transformers and Large Language Models (Transformer Tower)
export default {
  id: 'l5',
  num: 5,
  title: 'Transformers and Large Language Models',
  region: 'Transformer Tower',
  tagline: 'Climb inside the architecture behind every modern language model.',
  overview:
    'Every LLM you will build with is a transformer. This level opens the box: why attention replaced older step-by-step models, how self-attention lets every token look at every other token, how a decoder-only model turns a prompt into next-token probabilities, and how a raw text predictor becomes an assistant you can choose wisely for a product.',
  objectives: [
    'Explain why attention-based models replaced sequential recurrent models',
    'Describe self-attention using queries, keys, values, and softmax weights',
    'Trace a prompt through a decoder-only transformer to a next-token distribution',
    'Compare models by capability, latency, cost, context length, and deployment option',
    'Implement a numerically stable softmax with temperature',
  ],
  skills: ['llms'],
  missions: [
    {
      id: 'l5m1',
      title: 'Why attention changed everything',
      goal: 'Explain why recurrent models struggled with long text and how attention fixes it.',
      minutes: 12,
      skill: 'llms',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'Reading one token at a time',
          body:
            'Before transformers, the standard model for text was the **recurrent neural network (RNN)**. It reads tokens in order, one per step, and carries a **hidden state**: a fixed-size vector meant to summarize everything read so far.\n\nTo understand token 500, an RNN must first process tokens 1 to 499, updating that single summary each time. Details from early tokens have to survive hundreds of updates, and in practice they fade. Training made this worse: the learning signal also had to travel back through every step, and it tended to shrink along the way.',
        },
        {
          h: 'Two bottlenecks: memory and speed',
          body:
            '- **Memory bottleneck**: the whole past is squeezed into one fixed-size vector, so long documents lose detail.\n- **Speed bottleneck**: step 500 cannot start until step 499 finishes. GPUs are built to run thousands of operations at once, but a strictly sequential chain leaves most of that power idle.\n\nThe second problem mattered enormously. Training on internet-scale text means processing billions of tokens, and a model that cannot be parallelized cannot be trained at that scale in reasonable time.',
        },
        {
          h: 'The attention idea',
          body:
            '**Attention** drops the chain. Every token looks directly at every other token and decides how much each one matters for its own meaning. Token 1 and token 500 are now one step apart instead of 499.\n\nBecause the comparisons are independent, all positions can be computed at once as large matrix multiplications, which is exactly what GPUs do best. The transformer architecture, introduced in 2017, was built entirely around this idea.\n\nThe price: comparing every token with every other token grows with the **square** of the sequence length. That is one reason context windows have limits and long prompts cost more.',
        },
      ],
      terms: [
        { term: 'Recurrent neural network (RNN)', def: 'A model that processes a sequence one step at a time, passing a hidden state from step to step.' },
        { term: 'Hidden state', def: 'The fixed-size vector an RNN carries forward as its running summary of the sequence.' },
        { term: 'Attention', def: 'A mechanism that lets each token weigh and combine information from other tokens directly.' },
        { term: 'Parallelism', def: 'Doing many computations at the same time, which GPUs are designed for.' },
        { term: 'Quadratic cost', def: 'Work that grows with the square of the input size; full attention over n tokens makes about n × n comparisons.' },
      ],
      example: {
        title: 'One long-range dependency, two ways',
        lang: 'text',
        code:
          'Sentence: "The keys that the chef left on the counter are missing"\n\nRNN (sequential):\n  The → keys → that → the → chef → left → on → the → counter → are\n  To choose "are" (not "is"), the model must recover "keys" from a\n  summary that has been updated seven more times since it was read.\n\nAttention (direct):\n  "are" compares itself with every earlier token in one step.\n  Illustrative weights:  keys 0.58 | counter 0.14 | chef 0.11 | others 0.17\n  "keys" is one hop away, no matter how far back it appears.',
        note: 'Agreement between a subject and a distant verb is a classic test of long-range memory. Attention makes the path between any two tokens a single step.',
      },
      check: [
        {
          id: 'l5m1-p1', type: 'mc',
          q: 'Why was training recurrent models on huge datasets slow, even on powerful GPUs?',
          options: [
            'Each step depended on the previous step’s hidden state, so positions could not be processed in parallel',
            'RNNs required a much larger vocabulary than transformers',
            'RNNs cannot run on GPUs at all',
            'RNNs ran attention in every layer',
          ],
          answer: 0,
          explain: 'The hidden state at step t needs the result of step t − 1, which forces sequential computation. GPUs excel at parallel work, so most of their capacity went unused.',
          topic: 'l5m1',
        },
        {
          id: 'l5m1-p2', type: 'mc',
          q: 'With full self-attention, roughly what happens to the attention work when you double the prompt length?',
          options: ['It halves', 'It stays the same', 'It roughly doubles', 'It roughly quadruples'],
          answer: 3,
          explain: 'Every token is compared with every other token, so work scales with n × n. Doubling n gives (2n) × (2n) = 4n², about four times the work.',
          topic: 'l5m1',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l5m2',
      title: 'Self-attention: queries, keys, and values',
      goal: 'Describe how a token computes attention weights and mixes information from other tokens.',
      minutes: 16,
      skill: 'llms',
      visual: 'attention',
      visualCaption:
        'Click a word such as "it" to see which other words it attends to most strongly. Then click a noun and a verb and compare: each word spreads its attention differently.',
      sections: [
        {
          h: 'Queries, keys, and values',
          body:
            'Each token’s vector is multiplied by three learned weight matrices, giving it three new vectors:\n\n- **Query**: what this token is looking for.\n- **Key**: what this token offers; other tokens compare their queries against it.\n- **Value**: the information this token passes along when attended to.\n\nThink of a library: your query is the search request, keys are the labels on the shelves, and values are the contents of the books. The matrices are learned in training, so the model discovers for itself which questions and labels are useful.',
        },
        {
          h: 'From scores to weights',
          body:
            'For one token, attention runs four steps:\n\n1. **Score**: take the dot product of its query with every token’s key. Aligned vectors give high scores.\n2. **Scale**: divide by √d, where d is the key length, so scores do not explode as vectors get longer.\n3. **Softmax**: turn the scores into weights that are positive and sum to 1.\n4. **Mix**: the output is the weighted sum of all value vectors.\n\nFor all tokens at once: `softmax(QKᵀ / √d) V`. The result is **contextual**: the same word gets a different vector in a different sentence.',
        },
        {
          h: 'Multi-head attention',
          body:
            'One set of queries, keys, and values captures one kind of relationship at a time. Transformers therefore run several **attention heads** in parallel, each with its own learned matrices and smaller vectors. Their outputs are concatenated and projected back to the model’s width.\n\nHeads tend to specialize: one may link pronouns to the nouns they refer to, another may focus on the previous word, another on matching brackets in code. Nobody assigns these roles; they emerge from training, and many heads have no neat human-readable job.',
        },
      ],
      terms: [
        { term: 'Query', def: 'A learned vector representing what a token is looking for in other tokens.' },
        { term: 'Key', def: 'A learned vector that other tokens’ queries are compared against.' },
        { term: 'Value', def: 'A learned vector holding the information a token contributes when it is attended to.' },
        { term: 'Attention weights', def: 'Softmax-normalized scores saying how much each token contributes to another token’s output; they sum to 1.' },
        { term: 'Attention head', def: 'One independent set of query, key, and value projections; multi-head attention runs several in parallel.' },
      ],
      example: {
        title: 'Attention for one token, by hand',
        lang: 'javascript',
        code:
          '// Toy self-attention for the token "it" in\n// "The animal did not cross the street because it was too tired"\nconst dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);\n\nconst queryIt = [2.0, 0.0];\nconst keys = { animal: [2.0, 0.2], street: [0.1, 1.5], tired: [0.6, 1.0] };\nconst names = Object.keys(keys);\n\nconst d = queryIt.length;\nconst scores = names.map(n => dot(queryIt, keys[n]) / Math.sqrt(d)); // score + scale\nconst exps = scores.map(s => Math.exp(s));\nconst total = exps.reduce((a, b) => a + b, 0);\nconst weights = exps.map(e => e / total);                            // softmax\n\nconsole.log(names.map((n, i) => n + ": " + weights[i].toFixed(2)).join(", "));\n// animal: 0.83, street: 0.06, tired: 0.11',
        note: 'The query for "it" aligns best with the key for "animal", so 83% of the output for "it" will come from the animal’s value vector. Real models use hundreds of dimensions, and training shapes the vectors so useful pairs score high.',
      },
      check: [
        {
          id: 'l5m2-p1', type: 'mc',
          q: 'In "The animal did not cross the street because it was too tired", the query for "it" has a much larger dot product with the key for "animal" than with any other key. What follows?',
          options: [
            '"animal" is removed from the sequence',
            'The output vector for "it" is built mostly from the value vector of "animal"',
            'The token "it" is replaced by "animal" in the text',
            'The softmax step is skipped for "it"',
          ],
          answer: 1,
          explain: 'A high score becomes a large softmax weight, so the value of "animal" dominates the weighted sum that forms the new representation of "it". Nothing is removed or replaced.',
          topic: 'l5m2',
        },
        {
          id: 'l5m2-p2', type: 'mc',
          q: 'Why are attention scores divided by √d before the softmax?',
          options: [
            'To make the vocabulary smaller',
            'To make all weights equal',
            'To turn the scores into probabilities',
            'To stop large dot products from pushing softmax into extreme, near all-or-nothing weights that train poorly',
          ],
          answer: 3,
          explain: 'Dot products grow with vector length. Scaling keeps them in a range where softmax still spreads weight and gradients flow. Turning scores into probabilities is the softmax’s job, not the scaling’s.',
          topic: 'l5m2',
        },
        {
          id: 'l5m2-p3', type: 'mc',
          q: 'Why do transformers use several attention heads instead of one?',
          options: [
            'Each head serves a different user',
            'Heads replace the feed-forward layers',
            'Each head can learn to track a different kind of relationship in parallel',
            'More heads make the context window longer',
          ],
          answer: 2,
          explain: 'Each head has its own query, key, and value matrices, so different heads can capture different patterns, such as coreference or word order, at the same time.',
          topic: 'l5m2',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l5m3',
      title: 'Inside a decoder-only LLM',
      goal: 'Trace a prompt through embeddings, transformer blocks, and the output layer to a next-token choice.',
      minutes: 18,
      skill: 'llms',
      visual: 'promptFlow',
      visualCaption:
        'Focus on the last stage this time: the bars are the softmax of the model’s logits. Move the temperature slider and predict how the bars will change before you look. Then build the same function in the challenge.',
      sections: [
        {
          h: 'From tokens to vectors',
          body:
            'A decoder-only LLM starts by looking up each token ID in an **embedding table**: a learned matrix with one vector per vocabulary entry, often thousands of numbers wide.\n\nAttention on its own has no sense of order. It would treat "dog bites man" and "man bites dog" as the same bag of tokens. So the model adds **positional information**. Older designs add a position vector to each embedding; many current models instead rotate query and key vectors by an angle that depends on position. Either way, each token now carries both what it is and where it sits.',
        },
        {
          h: 'The transformer block',
          body:
            'The core of the model is a stack of identically shaped **blocks**, often dozens deep. Each block has two sub-layers:\n\n- **Self-attention**: tokens exchange information with each other.\n- **Feed-forward network**: each token’s vector is transformed on its own by a small neural network. Much of the model’s factual knowledge is thought to live here.\n\nTwo helpers wrap each sub-layer. A **residual connection** adds the sub-layer’s output to its input instead of replacing it, so information and training signals flow through deep stacks. **Normalization** rescales vectors to keep the numbers in a stable range.',
        },
        {
          h: 'Causal masking: no peeking ahead',
          body:
            'An LLM is trained to predict the next token at **every** position of a training text at the same time. If position 5 could attend to position 6, it would simply copy the answer.\n\nThe **causal mask** prevents this: before the softmax, scores for all later positions are set to minus infinity, so their weights become exactly 0. Each token can attend only to itself and earlier tokens. One forward pass over a 1,000-token text therefore yields 1,000 training predictions, and training matches generation, where future tokens do not exist yet.',
        },
        {
          h: 'From logits to the next token',
          body:
            'After the last block, the vector at the final position is multiplied by an output matrix, giving one **logit** (a raw, unbounded score) for every token in the vocabulary. **Softmax** turns the logits into probabilities; temperature divides the logits first. A token is sampled, appended, and the stack runs again.\n\nTo avoid recomputing the whole prompt for each new token, the model stores earlier tokens’ keys and values in a **KV cache**. That is why a long prompt causes a pause before the first token, while later tokens stream out quickly.',
        },
      ],
      terms: [
        { term: 'Embedding table', def: 'A learned matrix that maps each token ID to a vector.' },
        { term: 'Positional information', def: 'Signals added to token vectors so the model knows the order of tokens.' },
        { term: 'Residual connection', def: 'A shortcut that adds a sub-layer’s output to its input, keeping information and gradients flowing.' },
        { term: 'Causal mask', def: 'A mask that blocks each position from attending to later positions.' },
        { term: 'Logit', def: 'A raw, unnormalized score for one vocabulary token; softmax turns logits into probabilities.' },
      ],
      example: {
        title: 'One forward pass in pseudocode',
        lang: 'python',
        code:
          'def next_token_distribution(token_ids, temperature=1.0):\n    x = embed(token_ids)                         # one vector per token\n    x = add_positions(x)                         # where each token sits\n    for block in blocks:                         # e.g. 32 blocks\n        x = x + self_attention(norm(x), causal=True)   # mix in earlier tokens\n        x = x + feed_forward(norm(x))                  # transform each token\n    logits = output_layer(norm(x[-1]))           # last position only\n    return softmax(logits / temperature)         # probabilities over the vocabulary',
        note: 'Notice the `x = x + ...` pattern: those are the residual connections. Only the last position’s vector is used to predict the next token, even though every position was processed.',
      },
      check: [
        {
          id: 'l5m3-p1', type: 'mc',
          q: 'Without positional information, what would a transformer struggle with?',
          options: [
            'Counting how many tokens are in the prompt',
            'Producing logits',
            'Telling "dog bites man" apart from "man bites dog"',
            'Running more than one attention head',
          ],
          answer: 2,
          explain: 'Attention compares tokens by content only. Without position signals, the two sentences contain the same tokens and would look identical in order-sensitive ways.',
          topic: 'l5m3',
        },
        {
          id: 'l5m3-p2', type: 'mc',
          q: 'During training on "the cat sat", when the model predicts the token after "the cat", the causal mask ensures it…',
          options: [
            'can look at "sat" to check its answer',
            'attends only to "the" and "cat"',
            'ignores all previous tokens',
            'attends only to the final token of the text',
          ],
          answer: 1,
          explain: 'The mask hides later positions, so the prediction at "cat" can use "the" and "cat" but not "sat", which is exactly the token it must predict.',
          topic: 'l5m3',
        },
        {
          id: 'l5m3-p3', type: 'short',
          q: 'A model outputs the logits [2.0, 1.0, 0.1] for three candidate tokens. What turns these into probabilities, and what property do the results have?',
          keywords: [
            ['softmax', 'soft max', 'exponen'],
            ['sum to 1', 'add up to 1', 'sum to one', 'add up to one', 'add to 1', 'total of 1', 'totals 1', 'sum of 1', '100%', '100 percent', 'positive', 'between 0 and 1', 'normaliz'],
          ],
          min: 2,
          sample: 'Softmax: exponentiate each logit and divide by the total. The results are positive and sum to 1, here roughly 0.66, 0.24, and 0.10.',
          explain: 'Name softmax and the key property: the outputs are positive probabilities that add up to 1, preserving the order of the logits.',
          topic: 'l5m3',
        },
      ],
      challengeId: 'c-l5-1',
    },
    {
      id: 'l5m4',
      title: 'From text predictor to assistant, and choosing a model',
      goal: 'Explain how assistants are trained and pick a model that fits a product’s constraints.',
      minutes: 15,
      skill: 'llms',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'Three stages of training',
          body:
            '1. **Pre-training**: next-token prediction on a vast text corpus. The result is a **base model** that continues text in the style of what it read. Ask it a question and it may continue with more questions.\n2. **Instruction tuning** (supervised fine-tuning): training on curated prompts paired with ideal responses, so the model learns to follow instructions and use a chat format.\n3. **Preference tuning**: people (or AI judges) compare pairs of responses and pick the better one. The model is then optimized toward preferred answers, for example with **RLHF** (reinforcement learning from human feedback) or direct preference optimization.',
        },
        {
          h: 'What tuning changes, and what it does not',
          body:
            'Tuning mostly shapes **behavior**: following instructions, tone, format, declining harmful requests. Most knowledge still comes from pre-training, so tuning does not move the knowledge cutoff and does not remove hallucinations.\n\nIt can add quirks. Raters often prefer confident, agreeable, longer answers, so tuned models may be wordy or tell users what they want to hear. Some models get extra training to write out longer reasoning before answering; they handle multi-step problems better but are slower and use more tokens.',
        },
        {
          h: 'Choosing a model: the trade-offs',
          body:
            '- **Capability vs latency and cost**: larger models usually reason better but respond more slowly and cost more per token. Start with the smallest model that passes your evaluation.\n- **Context length**: long documents need a large window, but long prompts are slower and pricier, and details buried in the middle can be missed.\n- **Modality**: does the task involve images or audio, or only text?\n- **Throughput**: rate limits or your hardware must handle peak traffic.\n\nNo model is best at everything. The right choice depends on the task, the volume, and the budget.',
        },
        {
          h: 'Hosted API or open weights?',
          body:
            '- **Hosted API**: you send requests over HTTP and pay per token. No infrastructure and quick access to strong models, but your data travels to the provider (check its data policies), and model versions may change or be retired.\n- **Open-weight model**: you download the weights and run them on your own hardware or cloud. Data can stay inside your network, you control versions and can fine-tune, but you own the GPUs, scaling, and updates. Check the license: open weights do not always mean unrestricted use.\n\nMany teams prototype with a hosted API, then evaluate alternatives once quality, cost, and privacy needs are clear.',
        },
      ],
      terms: [
        { term: 'Base model', def: 'A model after pre-training only; it continues text rather than following instructions.' },
        { term: 'Instruction tuning', def: 'Fine-tuning on prompts paired with ideal responses so a model follows instructions.' },
        { term: 'Preference tuning', def: 'Training a model toward responses that people or judges prefer.' },
        { term: 'RLHF', def: 'Reinforcement learning from human feedback: optimizing a model using human comparisons of its outputs.' },
        { term: 'Open-weight model', def: 'A model whose trained weights are published so you can run it on your own infrastructure.' },
      ],
      example: {
        title: 'From requirements to a shortlist',
        lang: 'text',
        code:
          'Requirement                                -> Leaning\n--------------------------------------------------------------------------\nTag 2 million support tickets per day      -> small, fast, cheap model\nPatient data must stay on-premises         -> open-weight model, self-hosted\nRead 300-page contracts in one request     -> long context window\nAnswer questions about photos of receipts  -> multimodal model\nPrototype in one week with a small team    -> hosted API\nHard multi-step reasoning, low volume      -> larger or reasoning-tuned model',
        note: 'Write the requirements first, then shortlist models, then let an evaluation on your own examples make the final call. A requirement like data residency can rule out options before quality is even compared.',
      },
      check: [
        {
          id: 'l5m4-p1', type: 'mc',
          q: 'You prompt a base model (pre-trained only) with "What is the capital of Peru?" It replies "What is the capital of Chile? What is the capital of Bolivia?" Why?',
          options: [
            'Its temperature is too low',
            'Its context window is full',
            'It was preference-tuned to avoid geography',
            'It was trained only to continue text, and a list of quiz questions is a plausible continuation',
          ],
          answer: 3,
          explain: 'Base models continue text. Instruction tuning and preference tuning are what teach a model to answer the question instead of extending the pattern.',
          topic: 'l5m4',
        },
        {
          id: 'l5m4-p2', type: 'mc',
          q: 'A hospital needs a summarizer, and patient records may not leave its own servers. Which option fits best?',
          options: [
            'The largest hosted API model available',
            'An open-weight model run on the hospital’s own infrastructure',
            'A base model with a high temperature',
            'Whichever model has the longest context window',
          ],
          answer: 1,
          explain: 'The hard constraint is data residency. Self-hosting an open-weight model keeps records inside the hospital’s network; quality is then checked by evaluation.',
          topic: 'l5m4',
        },
        {
          id: 'l5m4-p3', type: 'mc',
          q: 'A tagging task runs 5 million times a day. A small model and a large model both score 97% on your evaluation set. What should you choose?',
          options: [
            'The large model, because bigger is always safer',
            'Neither; use a base model instead',
            'The small model: equal measured quality at lower cost and latency',
            'Whichever model has the newest knowledge cutoff',
          ],
          answer: 2,
          explain: 'When measured quality is equal, cost and latency decide. At millions of calls per day, the smaller model saves a great deal.',
          topic: 'l5m4',
        },
      ],
      challengeId: null,
    },
  ],
  challenges: [
    {
      id: 'c-l5-1', levelId: 'l5', missionId: 'l5m3', kind: 'code', lang: 'javascript',
      title: 'Softmax with temperature', skill: 'llms',
      prompt:
        'Write `softmax(logits, temperature = 1)` that turns an array of logits into probabilities.\n\n1. Divide every logit by `temperature`.\n2. Subtract the **largest** scaled value from each one. This keeps `Math.exp` from overflowing and does not change the result.\n3. Exponentiate each value and divide by the sum, so the results are positive and add up to 1.\n\nA lower temperature should make the largest probability bigger; a higher temperature should flatten the distribution. You may assume `temperature > 0` and that `logits` is not empty.',
      starter:
        'function softmax(logits, temperature = 1) {\n  // 1. scale by temperature\n  // 2. subtract the max for numeric stability\n  // 3. exponentiate and normalize\n}\n\nconsole.log(softmax([2, 1, 0.1])); // roughly [0.66, 0.24, 0.10]\n',
      solution:
        'function softmax(logits, temperature = 1) {\n  const scaled = logits.map(x => x / temperature);\n  const max = Math.max(...scaled);\n  const exps = scaled.map(x => Math.exp(x - max));\n  const sum = exps.reduce((a, b) => a + b, 0);\n  return exps.map(e => e / sum);\n}',
      hints: [
        '`Math.max(...arr)` finds the largest value and `Math.exp(x)` computes e to the power x. Why would `Math.exp(1000)` be a problem?',
        'Map to `x / temperature`, subtract the max, map through `Math.exp`, add the results with `reduce`, then divide every value by that sum.',
      ],
      tests: [
        { call: 'softmax([1, 2, 3]).map(p => +p.toFixed(4))', expect: [0.09, 0.2447, 0.6652] },
        { call: 'softmax([5, 5, 5, 5])', expect: [0.25, 0.25, 0.25, 0.25] },
        { call: 'softmax([42])', expect: [1] },
        { call: 'softmax([1000, 1001]).map(p => +p.toFixed(4))', expect: [0.2689, 0.7311] },
        { call: 'softmax([1, 2, 3], 0.5).map(p => +p.toFixed(4))', expect: [0.0159, 0.1173, 0.8668] },
        { call: 'softmax([1, 2, 3], 2)[2] < softmax([1, 2, 3])[2]', expect: true },
        { call: '+softmax([3.2, -1, 0.5, 7], 0.7).reduce((a, b) => a + b, 0).toFixed(6)', expect: 1 },
      ],
    },
  ],
  test: {
    title: 'Transformer Tower Checkpoint',
    intro: 'Eight questions on attention, the transformer block, next-token prediction, and how LLMs are tuned and chosen.',
    questions: [
      {
        id: 'l5t-q1', type: 'mc',
        q: 'A recurrent model handles short sentences well but loses track of a subject introduced 400 tokens earlier. What is the core reason?',
        options: [
          'Information must survive hundreds of sequential updates to a fixed-size hidden state',
          'Its vocabulary is too small',
          'It processes all tokens in parallel',
          'It uses too many attention heads',
        ],
        answer: 0,
        explain: 'An RNN compresses the past into one fixed-size vector that is overwritten step by step, so early details fade over long distances.',
        topic: 'l5m1',
      },
      {
        id: 'l5t-q2', type: 'mc',
        q: 'Which property of transformers most directly made training on internet-scale text practical?',
        options: [
          'They need no training data',
          'They store documents word for word',
          'All positions in a sequence can be processed in parallel with matrix operations',
          'They use smaller vocabularies than older models',
        ],
        answer: 2,
        explain: 'Removing the sequential dependency lets GPUs process every position at once, which made training on billions of tokens feasible.',
        topic: 'l5m1',
      },
      {
        id: 'l5t-q3', type: 'mc',
        q: 'In "The dog chased the ball because it was excited", what decides how strongly "it" draws on "dog" versus "ball"?',
        options: [
          'The tokenizer',
          'The softmax of the scaled dot products between the query for "it" and each token’s key',
          'Positional information alone',
          'The sampling temperature',
        ],
        answer: 1,
        explain: 'Query–key dot products, scaled and passed through softmax, produce the attention weights. Positions help but do not decide relevance alone; temperature only affects the final sampling.',
        topic: 'l5m2',
      },
      {
        id: 'l5t-q4', type: 'mc',
        q: 'The attention scores for one query over four tokens are [3, 3, 3, 3]. What are the attention weights?',
        options: ['[1, 0, 0, 0]', '[3, 3, 3, 3]', '[0.75, 0.75, 0.75, 0.75]', '[0.25, 0.25, 0.25, 0.25]'],
        answer: 3,
        explain: 'Softmax of equal scores gives equal weights, and the weights must sum to 1, so each is 1 ÷ 4 = 0.25.',
        topic: 'l5m2',
      },
      {
        id: 'l5t-q5', type: 'mc',
        q: 'Why does a decoder-only LLM apply a causal mask during training?',
        options: [
          'So each position cannot attend to later tokens, matching generation where future tokens do not exist yet',
          'To reduce the size of the vocabulary',
          'To make some attention weights negative',
          'To skip the feed-forward layer for short prompts',
        ],
        answer: 0,
        explain: 'Without the mask, each position could see the very token it is supposed to predict. The mask keeps training honest and consistent with left-to-right generation.',
        topic: 'l5m3',
      },
      {
        id: 'l5t-q6', type: 'mc',
        q: 'After instruction tuning and preference tuning, which problem is still most likely to remain?',
        options: [
          'The model cannot follow instructions',
          'The model only continues text like a base model',
          'The model can still state false facts confidently',
          'The model can no longer generate text token by token',
        ],
        answer: 2,
        explain: 'Tuning shapes behavior and format, but the model still generates plausible text rather than verified facts, so hallucinations remain.',
        topic: 'l5m4',
      },
      {
        id: 'l5t-q7', type: 'short',
        q: 'Describe what happens between the output of the last transformer block and the choice of the next token.',
        keywords: [
          ['logit', 'score', 'output layer', 'output matrix', 'project', 'vocabulary'],
          ['softmax', 'probabilit', 'distribution'],
          ['sampl', 'pick', 'choose', 'select', 'highest', 'most likely', 'argmax', 'top'],
        ],
        min: 2,
        sample: 'The last position’s vector is projected to a logit for every vocabulary token. Softmax (after dividing by the temperature) turns the logits into probabilities, and a token is sampled or the most likely one is picked.',
        explain: 'A complete answer mentions logits over the vocabulary, softmax turning them into probabilities (with temperature), and sampling or picking a token.',
        topic: 'l5m3',
      },
      {
        id: 'l5t-q8', type: 'short',
        q: 'Your team must choose between a hosted API model and an open-weight model you run yourself. Name one advantage of each.',
        keywords: [
          ['infrastructure', 'no server', 'managed', 'easy', 'easier', 'quick', 'fast to start', 'no gpu', 'maintenance', 'simple', 'setup', 'set up', 'strong model', 'best model', 'scal'],
          ['privacy', 'private', 'control', 'data stays', 'on-prem', 'on prem', 'own server', 'own hardware', 'own infrastructure', 'fine-tun', 'fine tun', 'custom', 'offline', 'lock-in', 'lock in', 'cheaper at scale', 'version'],
        ],
        min: 2,
        sample: 'A hosted API needs no infrastructure and gives quick access to strong models. An open-weight model gives control: data stays on your own servers, you pin versions, and you can fine-tune it.',
        explain: 'For the API, mention convenience (no infrastructure, quick start, strong models). For open weights, mention control (privacy, data residency, versions, fine-tuning).',
        topic: 'l5m4',
      },
    ],
  },
  boss: null,
  review: [
    { missionId: 'l5m1', tip: 'Using the keys-and-chef example, explain aloud why two distant tokens are one step apart with attention but many steps apart in an RNN.' },
    { missionId: 'l5m2', tip: 'Click through the attention visual again and, for one word, write out the four steps: dot product, scale by √d, softmax, weighted sum of values.' },
    { missionId: 'l5m3', tip: 'Redo the softmax challenge, then trace the forward-pass pseudocode line by line and name what each line contributes.' },
    { missionId: 'l5m4', tip: 'List the three training stages, then pick hosted API or open weights for a product idea of your own and justify it with two requirements.' },
  ],
};
