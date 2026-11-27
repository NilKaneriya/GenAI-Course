// Level 7 — Embeddings, Vector Search, and RAG (Vector Archipelago)
export default {
  id: 'l7',
  num: 7,
  title: 'Embeddings, Vector Search, and RAG',
  region: 'Vector Archipelago',
  tagline: 'Navigate by meaning: find the right passage, then answer from it.',
  overview:
    'Models do not know your organization’s documents, and they guess when asked about them. Retrieval-augmented generation (RAG) fixes this by finding relevant passages and putting them in the prompt. This level covers embeddings and similarity, vector search, chunking, the full RAG pipeline, and the techniques that make retrieval reliable: the most common pattern in real GenAI products.',
  objectives: [
    'Explain embeddings and compute cosine similarity between vectors',
    'Describe how a vector index finds nearest neighbors with top-k and metadata filters',
    'Choose a chunking strategy and justify its size and overlap',
    'Build the RAG pipeline end to end, from ingestion to cited answers',
    'Diagnose retrieval problems and improve them with hybrid search, reranking, query rewriting, and recall@k',
  ],
  skills: ['embeddings', 'rag'],
  missions: [
    {
      id: 'l7m1',
      title: 'Embeddings and semantic similarity',
      goal: 'Explain what an embedding is and compare texts with cosine similarity.',
      minutes: 14,
      skill: 'embeddings',
      visual: 'embeddings',
      visualCaption:
        'Choose a word and read its cosine similarity to the others. Words with related meanings should sit close together and score higher; check whether an unrelated word scores near 0.',
      sections: [
        {
          h: 'Meaning as coordinates',
          body:
            'An **embedding model** turns a piece of text (a word, a sentence, or a passage) into a fixed-length list of numbers: a vector, often a few hundred to a few thousand numbers long. It is trained so that texts with similar meaning get vectors that point in similar directions.\n\n"How do I reset my password?" and "I forgot my login credentials" share almost no words, yet their vectors land close together. This is **semantic similarity**: closeness in meaning, not in spelling. It is what lets search find answers phrased differently from the question.',
        },
        {
          h: 'What the dimensions mean',
          body:
            'Loosely, each dimension captures some learned feature of meaning, but single dimensions rarely match a clean human concept such as "is about food". Meaning lives in the overall direction of the vector. The 2-D maps in visualizations are compressions of hundreds of dimensions, so treat them as rough sketches.\n\nTwo practical rules follow:\n\n- Vectors from different embedding models live in different spaces and **cannot be compared**. Embed queries and documents with the same model.\n- If you switch embedding models, re-embed every document.',
        },
        {
          h: 'Measuring similarity',
          body:
            '- **Dot product**: multiply matching components and add them up: a·b = a₁b₁ + a₂b₂ + …\n- **Cosine similarity**: the dot product divided by the product of the two vector lengths. It is the cosine of the angle between them: 1 means same direction, 0 means unrelated, −1 means opposite.\n\nCosine ignores vector length, so only direction matters. Many embedding models return **normalized** vectors of length 1. For those, dot product and cosine give the same number, and the dot product is cheaper to compute.',
        },
      ],
      terms: [
        { term: 'Embedding', def: 'A vector of numbers that represents the meaning of a piece of text, an image, or audio.' },
        { term: 'Embedding model', def: 'A model trained to map inputs to vectors so that similar meanings get nearby vectors.' },
        { term: 'Dot product', def: 'The sum of the products of matching components of two vectors.' },
        { term: 'Cosine similarity', def: 'The cosine of the angle between two vectors: their dot product divided by the product of their lengths.' },
        { term: 'Normalized vector', def: 'A vector scaled to length 1; dot products between normalized vectors equal their cosine similarity.' },
      ],
      example: {
        title: 'Comparing three sentences',
        lang: 'python',
        code:
          'import numpy as np\n\ntexts = [\n    "How do I reset my password?",\n    "I forgot my login credentials",\n    "Best pizza dough recipe",\n]\nvectors = np.array(client.embed(texts))        # shape (3, 768) for a 768-d model\n\nunit = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)  # length 1\nsimilarity = unit @ unit.T                      # cosine for every pair\nprint(similarity.round(2))\n# [[1.   0.83 0.12]\n#  [0.83 1.   0.1 ]\n#  [0.12 0.1  1.  ]]',
        note: 'After normalizing, one matrix multiplication gives the cosine similarity of every pair. The two password questions score high despite sharing almost no words. Exact numbers depend on the embedding model.',
      },
      check: [
        {
          id: 'l7m1-p1', type: 'mc',
          q: 'Vectors a = [1, 0] and b = [0, 1]. What is their cosine similarity, and what does it suggest?',
          options: ['1: identical meaning', '0: unrelated directions', '−1: opposite meaning', '0.5: somewhat related'],
          answer: 1,
          explain: 'The dot product is 1×0 + 0×1 = 0, so the cosine is 0: the vectors are at a right angle, which signals no similarity.',
          topic: 'l7m1',
        },
        {
          id: 'l7m1-p2', type: 'mc',
          q: 'You embedded your documents with model A and now embed user queries with model B. Search results are nonsense. Why?',
          options: [
            'Vectors from different embedding models live in different spaces and cannot be compared',
            'Model B has a smaller context window',
            'Cosine similarity only works on whole numbers',
            'Queries must be longer than documents',
          ],
          answer: 0,
          explain: 'Each embedding model learns its own coordinate system. Comparing vectors across models is like comparing map coordinates from two unrelated maps.',
          topic: 'l7m1',
        },
        {
          id: 'l7m1-p3', type: 'mc',
          q: 'Why is cosine similarity a good fit for comparing a short query with a long passage?',
          options: [
            'It counts the keywords the two texts share',
            'It always returns 1 for long passages',
            'It works without an embedding model',
            'It compares direction, not vector length, so length differences matter less',
          ],
          answer: 3,
          explain: 'Cosine normalizes away vector length and compares only direction, which is where embedding models encode meaning.',
          topic: 'l7m1',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l7m2',
      title: 'Vector databases and nearest-neighbor search',
      goal: 'Describe how vector search returns the top-k most similar items, quickly and with filters.',
      minutes: 15,
      skill: 'embeddings',
      visual: 'vectorSearch',
      visualCaption:
        'Run a few queries and read the similarity scores of the top results. Notice how quickly the scores fall after the best matches, and decide what k you would choose.',
      sections: [
        {
          h: 'Nearest-neighbor search',
          body:
            'A vector search stores one vector per item, usually one per document chunk. At query time it embeds the query with the same model and returns the **k** stored vectors most similar to it: the **top-k**.\n\nThe simplest method, **brute force**, compares the query with every stored vector. It is exact and perfectly fine for a few thousand items. For millions of vectors and answers in milliseconds, it becomes too slow.',
        },
        {
          h: 'Approximate nearest neighbor (ANN)',
          body:
            '**Vector databases**, and vector indexes inside regular databases, build an **index** so a search checks only a small fraction of vectors:\n\n- **Graph-based** indexes, such as HNSW, hop between neighboring vectors toward the query.\n- **Cluster-based** indexes, such as IVF, search only the clusters closest to the query.\n- **Compression** shrinks vectors to save memory.\n\nThis is **approximate nearest neighbor** search: far faster, at the cost of occasionally missing a true nearest neighbor. Index settings let you trade speed for recall.',
        },
        {
          h: 'Metadata and filters',
          body:
            'Store **metadata** next to each vector: source, title, section, date, product, language, and who may read it. Filters then restrict a search, for example to "invoicing docs updated this year that this user is allowed to see".\n\nPermission filters are not optional: retrieval must never put text into a prompt that the user could not open themselves. Also store each chunk’s text and id, so results can be displayed and cited.',
        },
        {
          h: 'Choosing k',
          body:
            '- **Small k** (3–5): focused prompts, but the answer may sit at rank 6.\n- **Large k** (20+): better chance of including the answer, but more tokens, cost, and distracting text.\n\nA common pattern is to retrieve generously, say 20 to 50 candidates, then rerank and keep the best few (see the last mission). Some teams also drop results below a similarity threshold, but tune it on real queries: raw scores vary between models and queries.',
        },
      ],
      terms: [
        { term: 'Vector database', def: 'A store that indexes vectors for fast similarity search, usually with metadata and filtering.' },
        { term: 'Top-k', def: 'The k results most similar to the query.' },
        { term: 'Approximate nearest neighbor (ANN)', def: 'Search that uses an index to find very close matches quickly, accepting a small chance of missing the exact best.' },
        { term: 'Metadata filter', def: 'A condition on stored attributes, such as product or permissions, that restricts which vectors can be returned.' },
      ],
      example: {
        title: 'Indexing and searching with filters',
        lang: 'python',
        code:
          'store = VectorStore(dimensions=768, metric="cosine")\n\nfor chunk in chunks:\n    store.add(\n        id=chunk.id,\n        vector=client.embed([chunk.text])[0],\n        text=chunk.text,\n        metadata={"source": chunk.source, "product": chunk.product,\n                  "updated": chunk.updated, "groups": chunk.allowed_groups},\n    )\n\nquery_vec = client.embed(["How do I export invoices to CSV?"])[0]\nhits = store.search(\n    vector=query_vec,\n    top_k=5,\n    filter={"product": "invoicing", "groups": {"contains": user.group}},\n)\nfor hit in hits:\n    print(round(hit.score, 2), hit.metadata["source"])',
        note: 'The filter runs together with the similarity search, so the user only gets chunks for the right product that they are allowed to see. Each hit carries its source, ready for citations.',
      },
      check: [
        {
          id: 'l7m2-p1', type: 'mc',
          q: 'Your index holds 50 million chunks and searches must return in under 100 ms. Which approach fits?',
          options: [
            'Brute-force comparison with every vector',
            'An approximate nearest neighbor index, accepting a small loss in recall',
            'Embedding every document again at query time',
            'Sorting all documents alphabetically',
          ],
          answer: 1,
          explain: 'At that scale, brute force is too slow. ANN indexes examine a small fraction of vectors and return near-perfect results quickly.',
          topic: 'l7m2',
        },
        {
          id: 'l7m2-p2', type: 'mc',
          q: 'An employee’s query retrieves a chunk from a confidential HR document they are not allowed to see. What was missing?',
          options: [
            'A larger k',
            'A higher temperature',
            'A metadata filter on access permissions, applied at retrieval time',
            'Longer embedding vectors',
          ],
          answer: 2,
          explain: 'Retrieval must enforce the same permissions as the source system. Filtering on access metadata keeps forbidden text out of the prompt entirely.',
          topic: 'l7m2',
        },
        {
          id: 'l7m2-p3', type: 'mc',
          q: 'You retrieve the top 3, but the answer is often at rank 6 or 7. What is a good next step?',
          options: [
            'Retrieve more candidates, such as the top 20, and rerank them down to the best few',
            'Lower the generation temperature',
            'Shorten every query',
            'Switch to brute force so the ranking changes',
          ],
          answer: 0,
          explain: 'The evidence is being found but ranked too low. Retrieving more and reranking with a stronger relevance model brings it into the final context without flooding the prompt.',
          topic: 'l7m2',
        },
      ],
      challengeId: 'c-l7-1',
    },
    {
      id: 'l7m3',
      title: 'Chunking documents',
      goal: 'Choose a chunk size, overlap, and splitting strategy, and explain the trade-offs.',
      minutes: 13,
      skill: 'rag',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'Why split at all?',
          body:
            'Whole documents are usually too long to embed or to paste into a prompt, and a single vector for a 40-page manual blurs every topic into one average. **Chunking** splits documents into passages that each focus on one idea, so retrieval can return exactly the relevant part.\n\nEach chunk gets its own embedding, its own text, and metadata pointing back to its source: document, section, page.',
        },
        {
          h: 'Size and overlap',
          body:
            '- **Too small**, such as a single sentence: precise matches, but chunks lose context. "It must be filed within 30 days": what is "it"?\n- **Too big**, such as whole chapters: plenty of context, but the embedding blurs several topics, retrieval gets less precise, and prompts fill with irrelevant text.\n\nA typical starting point is a few hundred tokens per chunk with 10–20% **overlap**, so a sentence cut at a boundary still appears whole in a neighboring chunk. Then tune size and overlap on your own questions.',
        },
        {
          h: 'Structure-aware splitting',
          body:
            'Fixed-size splits are simple but cut through words, sentences, and tables. Better splitters follow the document’s structure: headings, then paragraphs, then sentences, falling back to a size limit only for very long sections. This is often called **recursive splitting**.\n\nKeep tables, list items, and code blocks intact. Prefix each chunk with its context, such as "Refund policy > Digital goods:", so it still makes sense on its own when retrieved.',
        },
      ],
      terms: [
        { term: 'Chunk', def: 'A passage of a document that is embedded, stored, and retrieved as one unit.' },
        { term: 'Chunk size', def: 'The maximum length of a chunk, measured in characters or tokens.' },
        { term: 'Overlap', def: 'Text shared between consecutive chunks so content at a boundary is not lost.' },
        { term: 'Recursive splitting', def: 'Splitting on the largest natural boundary first (sections, paragraphs, sentences) and only cutting by size when needed.' },
      ],
      example: {
        title: 'Fixed-size versus structure-aware chunks',
        lang: 'text',
        code:
          'Source section: "Refund policy > Digital goods"\n\nFixed 80-character chunks, no overlap:\n[1] "Digital purchases can be refunded within 14 days if the product has not been dow"\n[2] "nloaded. After download, refunds require proof of a technical fault."\n\nSentence-aware chunks with a heading prefix:\n[1] "Refund policy > Digital goods: Digital purchases can be refunded within\n     14 days if the product has not been downloaded."\n[2] "Refund policy > Digital goods: After download, refunds require proof of\n     a technical fault."',
        note: 'The fixed split cuts a word in half and separates a rule from its condition. Sentence boundaries plus a heading prefix make each chunk self-contained, easier to retrieve, and easier to cite.',
      },
      check: [
        {
          id: 'l7m3-p1', type: 'mc',
          q: 'With 3,000-token chunks, retrieval finds the right document, but answers are vague and miss details. What is the likely cause?',
          options: [
            'The chunks are too small',
            'The temperature is set to 0',
            'Each chunk mixes many topics, so its embedding is blurry and the prompt fills with irrelevant text',
            'The overlap is too small',
          ],
          answer: 2,
          explain: 'Oversized chunks average many ideas into one vector and drown the relevant sentences in noise. Smaller, structure-aware chunks fix both problems.',
          topic: 'l7m3',
        },
        {
          id: 'l7m3-p2', type: 'mc',
          q: 'Why add overlap between consecutive chunks?',
          options: [
            'To reduce storage costs',
            'So information that straddles a boundary still appears intact in at least one chunk',
            'To make the embeddings shorter',
            'Because vector databases require it',
          ],
          answer: 1,
          explain: 'Without overlap, a sentence or idea split across a boundary may be incomplete in both chunks. Overlap costs a little extra storage but protects boundary content.',
          topic: 'l7m3',
        },
        {
          id: 'l7m3-p3', type: 'short',
          q: 'A chunk reads only "It must be filed within 30 days." Why is this a poor chunk, and how could you fix it?',
          keywords: [
            ['context', 'what it', 'what "it"', 'refers', 'unclear', 'ambigu', 'missing', 'stand alone', 'standalone', 'on its own', 'meaning', 'too small', 'too short'],
            ['heading', 'title', 'larger', 'bigger', 'merge', 'overlap', 'prefix', 'section', 'surrounding', 'neighbo', 'more text', 'paragraph', 'combine'],
          ],
          min: 2,
          sample: 'It lacks context: nobody can tell what "it" refers to, so it will not match the right questions. Use larger, paragraph-level chunks, add overlap, or prefix each chunk with its document and section heading.',
          explain: 'Identify the missing context, then fix it with bigger or merged chunks, overlap, or a heading prefix.',
          topic: 'l7m3',
        },
      ],
      challengeId: 'c-l7-2',
    },
    {
      id: 'l7m4',
      title: 'The RAG pipeline end to end',
      goal: 'Walk through every stage of RAG, from ingestion to a cited answer.',
      minutes: 16,
      skill: 'rag',
      visual: 'ragPipeline',
      visualCaption:
        'Step through the pipeline one stage at a time. For each stage, say whether it runs once when documents are indexed or on every user question.',
      sections: [
        {
          h: 'Two phases',
          body:
            '**Indexing** runs whenever documents change:\n\n1. **Ingest**: load documents (PDFs, web pages, tickets) and extract clean text.\n2. **Chunk**: split them into passages with metadata.\n3. **Embed**: turn each chunk into a vector.\n4. **Store**: save vectors, text, and metadata in a vector index.\n\n**Querying** runs on every question: retrieve, augment, generate. Keeping the phases separate lets you re-index documents without touching the question-answering code.',
        },
        {
          h: 'Retrieve and augment',
          body:
            'At query time, embed the question with the same model used for the chunks, search for the top-k (with filters), and **augment** the prompt: insert the retrieved chunks, each labeled with an id and source, inside delimiters, followed by the question.\n\nThe instructions tell the model to answer only from the provided sources and to cite them. This is open-book answering: the model’s job shifts from recalling facts to reading and synthesizing the evidence in front of it.',
        },
        {
          h: 'Generate with citations',
          body:
            'Ask the model to cite chunk ids after each claim, such as [refund-2]. Your app maps ids back to titles and links, so users can verify the answer. Citations also make evaluation easier, because you can check whether each cited chunk actually supports its claim.\n\nKeep the index fresh: re-ingest changed documents and delete removed ones. Otherwise the assistant will confidently cite outdated policies.',
        },
        {
          h: 'Why RAG instead of fine-tuning?',
          body:
            'For knowledge that changes or must be cited, RAG is usually the first choice:\n\n- Updating a document updates answers as soon as it is re-indexed; no training run is needed.\n- Answers are traceable to sources.\n- Access control can be enforced per user at retrieval time.\n\nFine-tuning is better suited to teaching a style, a format, or a specialized skill, not to keeping facts current.',
        },
      ],
      terms: [
        { term: 'RAG', def: 'Retrieval-augmented generation: retrieving relevant passages and adding them to the prompt before generating.' },
        { term: 'Ingestion', def: 'Loading source documents and extracting clean text and metadata for indexing.' },
        { term: 'Augmentation', def: 'Inserting retrieved passages into the prompt as context for the model.' },
        { term: 'Grounding', def: 'Tying a model’s answer to provided sources rather than to its internal memory.' },
        { term: 'Citation', def: 'A reference from a claim in the answer to the source chunk that supports it.' },
      ],
      example: {
        title: 'A minimal RAG pipeline',
        lang: 'python',
        code:
          '# Indexing: run whenever documents change\nfor doc in load_documents("policies/"):\n    for i, chunk in enumerate(split(doc.text, max_tokens=300, overlap=40)):\n        store.add(id=f"{doc.id}-{i}", vector=client.embed([chunk])[0],\n                  text=chunk, metadata={"title": doc.title, "url": doc.url})\n\n# Querying: run for every question\ndef answer(question):\n    hits = store.search(vector=client.embed([question])[0], top_k=5)\n    sources = "\\n\\n".join(f"[{h.id}] {h.text}" for h in hits)\n    prompt = (\n        "Answer the question using only the sources below. "\n        "Cite source ids in square brackets after each claim. "\n        "If the sources do not contain the answer, say you do not know.\\n\\n"\n        f"<sources>\\n{sources}\\n</sources>\\n\\nQuestion: {question}"\n    )\n    reply = client.generate(prompt=prompt, temperature=0)\n    return reply.text, [h.metadata for h in hits]',
        note: 'Indexing and querying are separate code paths. The prompt labels every source with an id, demands citations, and gives the model an explicit way out when the answer is missing.',
      },
      check: [
        {
          id: 'l7m4-p1', type: 'mc',
          q: 'Which steps run on every user question, rather than at indexing time?',
          options: [
            'Ingest, chunk, and embed the documents',
            'Embed the question, retrieve the top-k chunks, augment the prompt, and generate',
            'Retrain the embedding model',
            'Rebuild the entire index',
          ],
          answer: 1,
          explain: 'Documents are processed when they change. Each question only needs embedding, retrieval, prompt assembly, and generation.',
          topic: 'l7m4',
        },
        {
          id: 'l7m4-p2', type: 'mc',
          q: 'The refund policy changed yesterday, but the assistant still quotes the old one, with a citation. What is most likely wrong?',
          options: [
            'The temperature is too high',
            'The model’s knowledge cutoff is too old',
            'The index still holds the old chunks because the changed document was not re-ingested',
            'Top-k is too large',
          ],
          answer: 2,
          explain: 'The citation shows the answer came from retrieved text, so the index is stale. Re-ingesting on change, and deleting old chunks, fixes it.',
          topic: 'l7m4',
        },
        {
          id: 'l7m4-p3', type: 'mc',
          q: 'An assistant must answer from a product catalog that changes weekly and link to its sources. What is the best approach?',
          options: [
            'RAG over the catalog, re-indexed whenever it changes',
            'Fine-tune the model on the catalog every week',
            'Rely on the model’s training data',
            'Raise the temperature so answers stay fresh',
          ],
          answer: 0,
          explain: 'RAG keeps answers current without retraining and provides citations. Weekly fine-tuning is slow and costly, and it gives no source links.',
          topic: 'l7m4',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l7m5',
      title: 'Improving RAG quality',
      goal: 'Diagnose whether a failure comes from retrieval or generation, and apply the right fix.',
      minutes: 16,
      skill: 'rag',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'Diagnose first: retrieval or generation?',
          body:
            'When an answer is wrong, look at the retrieved chunks before touching the prompt:\n\n- The right chunk was **not retrieved**: a retrieval problem (chunking, query, embeddings, k).\n- The right chunk **was retrieved** but the answer is still wrong or unsupported: a generation problem (prompt, model, too much noise).\n\nMeasure retrieval with **recall@k**: for each test question, the share of its relevant chunks that appear in the top k results, averaged over the test set. If recall@k is low, no prompt can save the answer.',
        },
        {
          h: 'Hybrid search and reranking',
          body:
            'Vector search captures meaning but can miss exact strings: error codes such as "ERR-4012", product names, rare terms. **Keyword search** (for example BM25) excels at those. **Hybrid search** runs both and merges the ranked lists.\n\nA **reranker** then reads the query together with each candidate and scores relevance directly. It is more accurate than comparing embeddings but too slow to run over the whole collection, so it reorders the top 20 to 50 candidates and keeps the best few.',
        },
        {
          h: 'Fix the query',
          body:
            'Real questions are short, vague, or depend on the conversation: "And what about the Pro plan?" **Query rewriting** uses a model to turn them into standalone search queries using the chat history, such as "What is the refund policy for the Pro plan?". It can also generate several variants and merge their results.\n\nCheaper fixes help too: expand acronyms, correct obvious typos, and add filters inferred from the question, such as the product name.',
        },
        {
          h: 'Keep the model grounded',
          body:
            'Instruct the model to answer only from the provided sources, cite them, and say "I don’t know" when the sources do not contain the answer. Offering a way out reduces made-up answers.\n\nPut fewer, better chunks in the prompt; irrelevant context distracts the model. Then evaluate **faithfulness**: is every claim supported by a cited chunk? Track retrieval and answer quality on a fixed test set every time you change chunking, models, or prompts.',
        },
      ],
      terms: [
        { term: 'Recall@k', def: 'The share of relevant chunks that appear in the top k results, averaged over test questions.' },
        { term: 'Hybrid search', def: 'Combining keyword search and vector search results into one ranking.' },
        { term: 'Reranker', def: 'A model that scores each query–candidate pair directly to reorder a short list more accurately.' },
        { term: 'Query rewriting', def: 'Transforming a user’s question into a clearer, standalone search query before retrieval.' },
        { term: 'Faithfulness', def: 'Whether every claim in an answer is supported by the provided sources.' },
      ],
      example: {
        title: 'Measuring recall@k',
        lang: 'javascript',
        code:
          '// Each test question lists the chunk ids that truly answer it\nconst testSet = [\n  { q: "refund window for digital goods", relevant: ["refund-2"] },\n  { q: "export invoices as CSV",          relevant: ["export-1", "export-3"] },\n  { q: "error ERR-4012 on login",         relevant: ["errors-7"] },\n];\n\n// What the retriever returned, best first\nconst retrieved = {\n  "refund window for digital goods": ["refund-2", "refund-1", "billing-4"],\n  "export invoices as CSV":          ["export-1", "pricing-2", "export-3"],\n  "error ERR-4012 on login":         ["login-1", "login-2", "errors-9"],\n};\n\nfunction recallAtK(results, relevant, k) {\n  const top = results.slice(0, k);\n  return relevant.filter(id => top.includes(id)).length / relevant.length;\n}\n\nconst scores = testSet.map(t => recallAtK(retrieved[t.q], t.relevant, 3));\nconsole.log(scores);                                            // [1, 1, 0]\nconsole.log(scores.reduce((a, b) => a + b) / scores.length);    // about 0.67',
        note: 'The error-code question scores 0: vector search missed an exact code, a classic sign that hybrid search would help. Recall@k tells you whether the evidence was found before you blame the model.',
      },
      check: [
        {
          id: 'l7m5-p1', type: 'mc',
          q: 'Users search for part numbers such as "XK-2291-B", and vector search returns similar-looking but wrong parts. What helps most?',
          options: [
            'A higher generation temperature',
            'Hybrid search that adds keyword matching for exact terms',
            'Larger chunks',
            'Removing metadata from the index',
          ],
          answer: 1,
          explain: 'Exact identifiers are where keyword search shines and embeddings struggle. Hybrid search gets both exact matches and semantic matches.',
          topic: 'l7m5',
        },
        {
          id: 'l7m5-p2', type: 'mc',
          q: 'Each of 100 test questions has exactly one relevant chunk. It appears in the top 5 for 72 of them. What is recall@5?',
          options: ['0.05', '0.28', '0.72', '5'],
          answer: 2,
          explain: 'Recall@5 is the share of relevant chunks found in the top 5: 72 out of 100, or 0.72.',
          topic: 'l7m5',
        },
        {
          id: 'l7m5-p3', type: 'mc',
          q: 'The correct chunk is retrieved, but the model adds a policy detail that appears in no source. Which fix targets this?',
          options: [
            'Increase k to 50',
            'Rewrite the query',
            'Switch to a different embedding model',
            'Tighten grounding: answer only from the sources, cite each claim, allow "I don’t know", and check faithfulness',
          ],
          answer: 3,
          explain: 'Retrieval already worked, so this is a generation problem. Grounding instructions and faithfulness checks target unsupported claims; retrieval changes do not.',
          topic: 'l7m5',
        },
      ],
      challengeId: null,
    },
  ],
  challenges: [
    {
      id: 'c-l7-1', levelId: 'l7', missionId: 'l7m2', kind: 'code', lang: 'javascript',
      title: 'Cosine similarity and top-k search', skill: 'embeddings',
      prompt:
        'Build the core of a vector search.\n\n1. `cosineSimilarity(a, b)` returns the dot product of `a` and `b` divided by the product of their lengths. Both arrays have the same length. If either vector has length 0 (all zeros), return `0`.\n2. `topK(queryVec, docs, k)` takes `docs` shaped like `{ id, vector }` and returns an **array of ids** for the `k` documents most similar to `queryVec`, sorted from most to least similar. If `k` is larger than the number of docs, return all of them.',
      starter:
        'function cosineSimilarity(a, b) {\n  // dot(a, b) / (length(a) * length(b))\n}\n\nfunction topK(queryVec, docs, k) {\n  // score every doc, sort by score descending, keep k ids\n}\n\nconsole.log(cosineSimilarity([1, 2], [2, 4])); // should be 1\n',
      solution:
        'function cosineSimilarity(a, b) {\n  let dot = 0, normA = 0, normB = 0;\n  for (let i = 0; i < a.length; i++) {\n    dot += a[i] * b[i];\n    normA += a[i] * a[i];\n    normB += b[i] * b[i];\n  }\n  if (normA === 0 || normB === 0) return 0;\n  return dot / (Math.sqrt(normA) * Math.sqrt(normB));\n}\n\nfunction topK(queryVec, docs, k) {\n  return docs\n    .map(doc => ({ id: doc.id, score: cosineSimilarity(queryVec, doc.vector) }))\n    .sort((x, y) => y.score - x.score)\n    .slice(0, k)\n    .map(r => r.id);\n}',
      hints: [
        'Loop once over the indices and keep three running sums: `a[i] * b[i]`, `a[i] * a[i]`, and `b[i] * b[i]`. The vector lengths are the square roots of the last two.',
        'For topK: map each doc to `{ id, score }`, then `.sort((x, y) => y.score - x.score)`, `.slice(0, k)`, and `.map(r => r.id)`.',
      ],
      tests: [
        { call: 'cosineSimilarity([1, 0], [0, 1])', expect: 0 },
        { call: 'cosineSimilarity([1, 2, 3], [2, 4, 6])', expect: 1 },
        { call: 'cosineSimilarity([3, 4], [4, 3])', expect: 0.96 },
        { call: 'cosineSimilarity([1, 1], [-1, -1])', expect: -1 },
        { call: 'cosineSimilarity([0, 0], [1, 2])', expect: 0 },
        { call: 'topK([1, 0], [{ id: "a", vector: [0.9, 0.1] }, { id: "b", vector: [0, 1] }, { id: "c", vector: [0.7, 0.7] }, { id: "d", vector: [-1, 0] }], 2)', expect: ['a', 'c'] },
        { call: 'topK([1, 1], [{ id: "long", vector: [10, 0] }, { id: "short", vector: [1, 1.2] }, { id: "mid", vector: [2, 1] }], 5)', expect: ['short', 'mid', 'long'] },
      ],
    },
    {
      id: 'c-l7-2', levelId: 'l7', missionId: 'l7m3', kind: 'code', lang: 'javascript',
      title: 'Sliding-window chunker', skill: 'rag',
      prompt:
        'Write `chunkText(text, size, overlap)` that splits text by **characters**.\n\n- If `overlap >= size`, throw an Error.\n- The first chunk starts at index 0, and each next chunk starts `size - overlap` characters after the previous one.\n- Each chunk is `text.slice(start, start + size)`, so the last one may be shorter.\n- Stop as soon as a chunk reaches the end of the text, that is when `start + size >= text.length`. An empty string returns `[]`.\n\nExample: `chunkText("abcdefghij", 4, 2)` returns `["abcd", "cdef", "efgh", "ghij"]`.',
      starter:
        'function chunkText(text, size, overlap) {\n  // step = size - overlap\n}\n\nconsole.log(chunkText("abcdefghij", 4, 2)); // ["abcd", "cdef", "efgh", "ghij"]\n',
      solution:
        'function chunkText(text, size, overlap) {\n  if (overlap >= size) {\n    throw new Error("overlap must be smaller than size");\n  }\n  const step = size - overlap;\n  const chunks = [];\n  for (let start = 0; start < text.length; start += step) {\n    chunks.push(text.slice(start, start + size));\n    if (start + size >= text.length) break;\n  }\n  return chunks;\n}',
      hints: [
        'Compute `const step = size - overlap;` and loop with `for (let start = 0; start < text.length; start += step)`.',
        'Push `text.slice(start, start + size)` on each pass, then `break` when `start + size >= text.length`, so you never add a final chunk that is already fully contained in the previous one.',
      ],
      tests: [
        { call: 'chunkText("abcdefghij", 4, 0)', expect: ['abcd', 'efgh', 'ij'] },
        { call: 'chunkText("abcdefghij", 4, 2)', expect: ['abcd', 'cdef', 'efgh', 'ghij'] },
        { call: 'chunkText("abcdefghij", 5, 1)', expect: ['abcde', 'efghi', 'ij'] },
        { call: 'chunkText("short", 10, 3)', expect: ['short'] },
        { call: 'chunkText("", 4, 1)', expect: [] },
        { call: 'chunkText("x".repeat(1000), 200, 50).length', expect: 7 },
        { call: '(() => { try { chunkText("abc", 3, 3); return "no error"; } catch (e) { return e instanceof Error; } })()', expect: true },
      ],
    },
  ],
  test: {
    title: 'Vector Archipelago Checkpoint',
    intro: 'Eight questions on embeddings, vector search, chunking, the RAG pipeline, and retrieval quality.',
    questions: [
      {
        id: 'l7t-q1', type: 'mc',
        q: 'The query vector is q = [2, 0]. Document A is [1, 0] and document B is [10, 10]. Which ranks higher by cosine similarity?',
        options: [
          'B, because its vector is longer',
          'They tie',
          'Neither; cosine needs normalized inputs',
          'A, because it points in exactly the same direction as q',
        ],
        answer: 3,
        explain: 'Cosine compares direction only. A has cosine 1 with q; B is at 45 degrees, giving about 0.71. Vector length does not matter.',
        topic: 'l7m1',
      },
      {
        id: 'l7t-q2', type: 'mc',
        q: 'Why can "cheap flights to Rome" retrieve a document titled "Budget airfare for Italy trips" even though they share no words?',
        options: [
          'The vector database stores a list of synonyms',
          'The embedding model places texts with similar meaning close together',
          'Cosine similarity compares letters',
          'The documents were fine-tuned into the model',
        ],
        answer: 1,
        explain: 'Embeddings encode meaning, so paraphrases end up with similar vectors. That is the core advantage of semantic search over keyword matching.',
        topic: 'l7m1',
      },
      {
        id: 'l7t-q3', type: 'mc',
        q: 'Which statement about approximate nearest neighbor (ANN) indexes is true?',
        options: [
          'They trade a small chance of missing a true nearest neighbor for much faster search',
          'They always return exactly the same results as brute force',
          'They only work with keyword queries',
          'They remove the need for embeddings',
        ],
        answer: 0,
        explain: 'ANN indexes examine only part of the collection, which makes them fast at scale but occasionally imperfect. Index settings trade speed against recall.',
        topic: 'l7m2',
      },
      {
        id: 'l7t-q4', type: 'mc',
        q: 'You use 100-token chunks with no overlap. Many answers need two sentences that sit on either side of a chunk boundary. What is the most direct improvement?',
        options: [
          'Lower the temperature',
          'Use keyword search only',
          'Add overlap and split on sentence or paragraph boundaries',
          'Reduce top-k to 1',
        ],
        answer: 2,
        explain: 'Overlap and structure-aware splitting keep related sentences together, so boundary content survives intact in at least one chunk.',
        topic: 'l7m3',
      },
      {
        id: 'l7t-q5', type: 'mc',
        q: 'Put these query-time steps in order: (a) generate the answer, (b) embed the question, (c) insert the retrieved chunks into the prompt, (d) search the index.',
        options: ['b, d, c, a', 'd, b, c, a', 'b, c, d, a', 'c, b, d, a'],
        answer: 0,
        explain: 'You need the question vector before you can search, the search results before you can augment the prompt, and the augmented prompt before you can generate.',
        topic: 'l7m4',
      },
      {
        id: 'l7t-q6', type: 'mc',
        q: 'For 40% of your test questions, the relevant chunk is not in the top 10 results. What should you work on first?',
        options: [
          'The answer-generation prompt',
          'The final output formatting',
          'Retrieval: chunking, query rewriting, or hybrid search',
          'A lower generation temperature',
        ],
        answer: 2,
        explain: 'Low recall@10 means the evidence never reaches the model. No generation change can fix missing context, so improve retrieval first.',
        topic: 'l7m5',
      },
      {
        id: 'l7t-q7', type: 'short',
        q: 'Explain why RAG is usually preferred over fine-tuning for answering questions about frequently changing company documents.',
        keywords: [
          ['update', 'fresh', 'current', 'up to date', 'up-to-date', 'new document', 'reindex', 're-index', 'retrain', 're-train', 'without training', 'no training'],
          ['cite', 'citation', 'source', 'trace', 'verif', 'ground', 'evidence'],
          ['cost', 'cheap', 'fast', 'quick', 'permission', 'access'],
        ],
        min: 2,
        sample: 'With RAG, updating a document updates answers as soon as it is re-indexed, with no retraining, and answers can cite their sources so users can verify them. Fine-tuning would need a new training run for every change and gives no citations.',
        explain: 'Mention that RAG stays current without retraining, and that it provides sources or citations (or enforces access control).',
        topic: 'l7m4',
      },
      {
        id: 'l7t-q8', type: 'short',
        q: 'Define recall@k and explain what a low value tells you.',
        keywords: [
          ['relevant', 'correct chunk', 'right chunk', 'correct document', 'right document', 'ground truth', 'gold', 'answer chunk', 'should be found'],
          ['top k', 'top-k', 'top', 'first k', 'k results', 'returned'],
          ['retriev', 'search', 'miss', 'not found', 'not finding', 'fail', 'chunking', 'query'],
        ],
        min: 2,
        sample: 'Recall@k is the share of relevant chunks that appear in the top k retrieved results, averaged over test questions. A low value means the retriever is missing the evidence, so retrieval needs fixing before the prompt or model.',
        explain: 'Define it as the share of relevant items found in the top k, then say a low value points to a retrieval problem.',
        topic: 'l7m5',
      },
    ],
  },
  boss: {
    id: 'l7b',
    title: 'The Retrieval Kraken',
    story:
      'The Kraken has wrapped its tentacles around the archipelago’s knowledge base: answers drift off topic, cite stale policies, and invent facts. Trace each failure to its root cause in the RAG pipeline to break its grip.',
    minutes: 20,
    hp: 5,
    toWin: 4,
    questions: [
      {
        id: 'l7b-q1', type: 'mc',
        q: 'Users ask "How do I cancel my subscription?" The top results are chunks about subscription pricing and plan comparisons, while the cancellation guide ranks 9th. Which change most directly addresses this?',
        options: [
          'Raise the generation temperature',
          'Retrieve a larger candidate set and rerank it with a model that scores each chunk against the full question',
          'Shrink the context window',
          'Delete the metadata from the cancellation guide',
        ],
        answer: 1,
        explain: 'The right chunk is retrieved but ranked too low. A reranker reads the question and each candidate together and recognizes that "cancel" is the point, not "subscription".',
        topic: 'l7m5',
      },
      {
        id: 'l7b-q2', type: 'mc',
        q: 'Logs show the correct warranty chunk was in the prompt, yet the answer states a 3-year warranty when the source says 2 years. Where should you focus first?',
        options: [
          'Re-chunking all documents',
          'Switching the embedding model',
          'Increasing top-k',
          'The generation step: grounding instructions, a citation for each claim, low temperature, and a faithfulness check',
        ],
        answer: 3,
        explain: 'Retrieval succeeded, so changing chunking, embeddings, or k targets the wrong stage. The model is not sticking to its sources, which is a generation and grounding problem.',
        topic: 'l7m4',
      },
      {
        id: 'l7b-q3', type: 'mc',
        q: 'Each chunk is an entire 20-page chapter. Retrieval usually finds the right chapter, but answers are vague and prompts reach 40,000 tokens. Which fix do you choose?',
        options: [
          'Split chapters into smaller, structure-aware chunks (sections or paragraphs with heading prefixes) and re-embed them',
          'Increase top-k to 20 chapters',
          'Keep the chunks and use a model with a larger context window',
          'Raise the temperature to encourage more detail',
        ],
        answer: 0,
        explain: 'Oversized chunks blur embeddings and flood the prompt with irrelevant text. Smaller, self-contained chunks make retrieval precise and prompts lean.',
        topic: 'l7m3',
      },
      {
        id: 'l7b-q4', type: 'short',
        q: 'An assistant keeps citing a price list that was replaced last month, even though the new file is in the shared drive. Explain the cause and how to prevent it.',
        keywords: [
          ['index', 'stale', 'old', 'outdated', 're-index', 'reindex', 'ingest', 'not updated', 'embedding', 'vector store', 'database'],
          ['schedul', 'automat', 'pipeline', 'sync', 'update', 'refresh', 'delete', 'remove', 'on change', 'whenever', 'trigger', 'regular', 'webhook', 'monitor'],
        ],
        min: 2,
        sample: 'The index still holds chunks from the old price list because the new file was never re-ingested. Automate re-indexing whenever a document changes, and delete chunks for replaced or removed files.',
        explain: 'The cause is a stale index; prevention is automated re-ingestion on change plus removal of outdated chunks.',
        topic: 'l7m4',
      },
      {
        id: 'l7b-q5', type: 'mc',
        q: 'Two queries hit your help-center search: (1) "ERR_SSL_PROTOCOL_ERROR when uploading" and (2) "my files won’t go through when I send them". Which retrieval setup handles both best?',
        options: [
          'Keyword search only',
          'Vector search only',
          'Hybrid search: keyword matching for the exact error code plus vector search for the paraphrased question',
          'No retrieval; rely on the model’s training data',
        ],
        answer: 2,
        explain: 'Keyword search nails exact codes, and vector search handles paraphrases. Hybrid search covers both kinds of query.',
        topic: 'l7m5',
      },
    ],
    project: null,
  },
  review: [
    { missionId: 'l7m1', tip: 'Compute the cosine similarity of [1, 2] and [2, 1] by hand (it is 0.8), then use the embeddings visual to compare related and unrelated words.' },
    { missionId: 'l7m2', tip: 'Explain top-k, approximate nearest neighbor search, and metadata filters in one sentence each, then redo the top-k challenge.' },
    { missionId: 'l7m3', tip: 'Redo the chunking challenge with other sizes and overlaps, predicting the number of chunks before you run it.' },
    { missionId: 'l7m4', tip: 'Step through the RAG pipeline visual and label each stage as indexing time or query time.' },
    { missionId: 'l7m5', tip: 'For a failing answer, first ask whether the right chunk was retrieved, then choose between hybrid search, reranking, query rewriting, and grounding instructions.' },
  ],
};
