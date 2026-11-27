// Level 4 — Neural Networks and Deep Learning (Neuron Peaks)
export default {
  id: 'l4',
  num: 4,
  title: 'Neural Networks and Deep Learning',
  region: 'Neuron Peaks',
  tagline: 'Climb from a single artificial neuron to the deep networks behind modern AI.',
  overview:
    'Every modern generative model is a deep neural network. This level builds one up from a single neuron: weighted sums and activations, layers and the forward pass, the training loop driven by backpropagation, and the main architectures that led to the transformer. By the end you can read a training loop and diagnose a run that is going wrong.',
  objectives: [
    'Compute a neuron’s output from its inputs, weights, bias, and activation function',
    'Trace a forward pass through dense layers and count a network’s parameters',
    'Describe the training loop of forward pass, loss, backpropagation, and optimizer step over batches and epochs',
    'Match CNNs, RNNs, and transformers to the data they suit and explain why GPUs matter',
  ],
  skills: ['deep-learning'],
  missions: [
    {
      id: 'l4m1',
      title: 'The artificial neuron',
      goal: 'Compute a neuron’s output by hand and explain why activation functions are needed.',
      minutes: 12,
      skill: 'deep-learning',
      visual: 'nnLayers',
      visualCaption:
        'Drag the input sliders and watch values flow forward through the network. Look for neurons whose output drops to exactly zero (ReLU switching them off) and notice how a small input change ripples through to the output.',
      sections: [
        {
          h: 'A weighted sum plus a bias',
          body:
            'An artificial neuron takes several numeric inputs, multiplies each by a **weight**, adds the results, and adds a **bias**:\n\n```text\nz = w1·x1 + w2·x2 + … + wn·xn + b\n```\n\nA large positive weight means "this input pushes the output up", a negative weight pushes it down, and a weight near zero means "mostly ignore this input". The bias shifts the result, so the neuron can be active even when every input is zero. Weights and biases are the **parameters** that training adjusts.',
        },
        {
          h: 'Activation functions',
          body:
            'The neuron then passes `z` through an **activation function**:\n\n- **ReLU**: `max(0, z)` — keeps positive values and outputs 0 for negatives. Simple, fast, and the usual default in hidden layers.\n- **Sigmoid**: `1 / (1 + e^(−z))` — squashes any number into the range 0 to 1, handy for a yes/no probability at the output.\n- **Tanh** — squashes into the range −1 to 1.\n\nWhy bother? Without a non-linear activation, stacking layers just produces another linear function, so even a deep network could never model curved boundaries or complex patterns.',
        },
        {
          h: 'One neuron, worked by hand',
          body:
            'Inputs `x = [2, 3]`, weights `w = [0.5, −1]`, bias `b = 1`:\n\n1. Weighted sum: 0.5 × 2 + (−1) × 3 = 1 − 3 = −2\n2. Add the bias: z = −2 + 1 = −1\n3. ReLU(−1) = **0**, so the neuron stays silent.\n4. Sigmoid(−1) ≈ **0.269**, a "probably not" signal.\n\nSame weighted sum, different activation, different meaning. Raise the bias to 4 and z becomes 2: ReLU outputs 2 and sigmoid about 0.881.',
        },
      ],
      terms: [
        { term: 'Neuron', def: 'A unit that computes a weighted sum of its inputs plus a bias, then applies an activation function.' },
        { term: 'Weight', def: 'A learned number that scales how strongly one input influences a neuron.' },
        { term: 'Bias', def: 'A learned number added to the weighted sum, shifting when the neuron activates.' },
        { term: 'Activation function', def: 'A non-linear function, such as ReLU or sigmoid, applied to a neuron’s weighted sum.' },
        { term: 'ReLU', def: 'Rectified linear unit: outputs the input if it is positive, otherwise 0.' },
      ],
      example: {
        title: 'A neuron in a few lines of Python',
        lang: 'python',
        code:
          'import math\n\ndef relu(z):\n    return max(0.0, z)\n\ndef sigmoid(z):\n    return 1 / (1 + math.exp(-z))\n\ninputs = [2.0, 3.0]\nweights = [0.5, -1.0]\nbias = 1.0\n\nz = sum(x * w for x, w in zip(inputs, weights)) + bias   # -1.0\nprint(relu(z), round(sigmoid(z), 3))                     # 0.0 0.269',
        note: 'Everything a neural network does is built from this pattern: multiply, add, apply an activation. Networks repeat it millions or billions of times.',
      },
      check: [
        {
          id: 'l4m1-p1', type: 'mc',
          q: 'A ReLU neuron has inputs [1, 2], weights [3, −1], and bias 0.5. What does it output?',
          options: ['0', '2.5', '1.5', '5.5'],
          answer: 2,
          explain: 'Weighted sum: 3 × 1 + (−1) × 2 = 1. Adding the bias gives z = 1.5, and ReLU keeps positive values unchanged, so the output is 1.5.',
          topic: 'l4m1',
        },
        {
          id: 'l4m1-p2', type: 'mc',
          q: 'A developer removes every activation function from a 6-layer network. What happens to what it can represent?',
          options: [
            'It becomes equivalent to a single linear layer and cannot model non-linear patterns',
            'It becomes more powerful because nothing is clipped',
            'Nothing changes; activations only speed up training',
            'It can only output zeros',
          ],
          answer: 0,
          explain: 'A chain of linear functions is itself a linear function, so six linear layers collapse into one. Non-linear activations are what let depth add expressive power.',
          topic: 'l4m1',
        },
        {
          id: 'l4m1-p3', type: 'mc',
          q: 'The output neuron of a model must give the probability that a transaction is fraud. Which activation fits best?',
          options: [
            'ReLU, because it is the default',
            'No activation, because probabilities are linear',
            'Tanh, because it is centered on zero',
            'Sigmoid, because it maps any value into the range 0 to 1',
          ],
          answer: 3,
          explain: 'A probability must lie between 0 and 1. Sigmoid guarantees that, while ReLU is unbounded above and tanh produces negative values.',
          topic: 'l4m1',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l4m2',
      title: 'Layers and the forward pass',
      goal: 'Trace data through a small network and count its parameters.',
      minutes: 15,
      skill: 'deep-learning',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'From neurons to layers',
          body:
            'Neurons are organized in **layers**:\n\n- **Input layer** — just the raw numbers: pixel values, features, or token embeddings. It has no weights.\n- **Hidden layers** — in a **dense** (fully connected) layer, each neuron reads every output of the previous layer and applies its own weights, bias, and activation.\n- **Output layer** — produces the final answer: one number for regression, or one score per class for classification.\n\nA whole dense layer is a single matrix operation: `outputs = activation(W · inputs + b)`.',
        },
        {
          h: 'The forward pass',
          body:
            'Running inputs through the network layer by layer until the output appears is the **forward pass**. Each layer’s output becomes the next layer’s input.\n\nFor classification, the final raw scores (called **logits**) go through **softmax**, which turns them into probabilities that are positive and sum to 1. If the outputs for [cat, dog, fox] are [0.10, 0.75, 0.15], the model predicts "dog" with 75% confidence. That is a statement about this one input, not about the model’s accuracy.',
        },
        {
          h: 'Counting parameters',
          body:
            'A dense layer from `n` inputs to `m` neurons has `n × m` weights plus `m` biases. For a 4 → 8 → 3 network:\n\n- Hidden layer: 4 × 8 + 8 = 40\n- Output layer: 8 × 3 + 3 = 27\n- **Total: 67 parameters**\n\nParameter count drives memory use and compute cost. Language models apply exactly the same arithmetic at a vastly larger scale: billions of parameters.',
        },
        {
          h: 'Why depth helps',
          body:
            'Each layer builds new features out of the previous layer’s features. In an image model, early layers respond to edges, middle layers to textures and parts, and later layers to whole objects. Composing simple pieces this way lets deep networks represent complex functions far more efficiently than one very wide layer.\n\nDepth has a cost: signals and gradients must travel through many layers. Very deep networks became practical once ReLU, careful initialization, normalization layers, and **residual (skip) connections** became standard.',
        },
      ],
      terms: [
        { term: 'Hidden layer', def: 'A layer between input and output whose neurons learn intermediate features.' },
        { term: 'Dense layer', def: 'A fully connected layer in which every neuron receives every output of the previous layer.' },
        { term: 'Forward pass', def: 'Computing the network’s output by passing inputs through each layer in order.' },
        { term: 'Softmax', def: 'A function that converts a list of scores into probabilities that are positive and sum to 1.' },
        { term: 'Residual connection', def: 'A shortcut that adds a layer’s input to its output, making very deep networks easier to train.' },
      ],
      example: {
        title: 'Counting parameters in a digit classifier',
        lang: 'text',
        code:
          '784 inputs (28 × 28 pixels) → 128 hidden (ReLU) → 10 outputs (softmax)\n\nHidden layer:  784 × 128 weights + 128 biases = 100,480\nOutput layer:  128 × 10  weights +  10 biases =   1,290\n-----------------------------------------------------\nTotal parameters                              = 101,770',
        note: 'The input layer adds no parameters. Almost all of them sit in the first dense layer because it connects every pixel to every hidden neuron, which is one reason image models use convolutions instead (Mission 4).',
      },
      check: [
        {
          id: 'l4m2-p1', type: 'mc',
          q: 'How many parameters (weights plus biases) does a dense network with layer sizes 3 → 5 → 2 have?',
          options: ['25', '32', '10', '30'],
          answer: 1,
          explain: 'Hidden layer: 3 × 5 + 5 = 20. Output layer: 5 × 2 + 2 = 12. Total: 32. The answer 25 counts only the weights and forgets the biases.',
          topic: 'l4m2',
        },
        {
          id: 'l4m2-p2', type: 'mc',
          q: 'An image model with one huge hidden layer underperforms a deeper network that has fewer parameters in total. What best explains this?',
          options: [
            'Deeper networks always have more parameters',
            'Wide layers cannot use activation functions',
            'Each layer builds on the previous layer’s features, so depth composes simple patterns into complex ones efficiently',
            'Deeper networks do not need training data',
          ],
          answer: 2,
          explain: 'Depth lets the network reuse and combine features (edges into shapes into objects). A single wide layer has to learn every complex pattern directly, which takes far more units and data.',
          topic: 'l4m2',
        },
        {
          id: 'l4m2-p3', type: 'mc',
          q: 'What happens during a forward pass through a trained network?',
          options: [
            'The weights are updated to reduce the loss',
            'Gradients flow from the output back to the input',
            'The training data is split into batches',
            'Each layer transforms the previous layer’s output until the final prediction is produced',
          ],
          answer: 3,
          explain: 'The forward pass only computes outputs, layer by layer. Updating weights and sending gradients backward belong to training (Mission 3).',
          topic: 'l4m2',
        },
      ],
      challengeId: 'c-l4-1',
    },
    {
      id: 'l4m3',
      title: 'How networks learn',
      goal: 'Describe the training loop and how backpropagation, batches, epochs, and the learning rate fit together.',
      minutes: 16,
      skill: 'deep-learning',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'Backpropagation: assigning blame',
          body:
            'After a forward pass, the loss says how wrong the network was. But which of its thousands of weights should change, and by how much? **Backpropagation** answers this. Using the chain rule from calculus, it works backward from the loss through each layer and computes the **gradient** of the loss with respect to every weight: how much the loss would change if that weight changed slightly.\n\nAn **optimizer** then applies gradient descent (Level 3) to all weights at once. Frameworks compute these gradients automatically, so you never derive them by hand.',
        },
        {
          h: 'Batches, steps, and epochs',
          body:
            '- A **batch** (mini-batch) is a small group of examples, such as 32 or 64, processed together for one update.\n- A **step** (iteration) is one forward pass, backward pass, and weight update on one batch.\n- An **epoch** is one full pass through the training set.\n\nWith 10,000 examples and a batch size of 100, one epoch is 100 steps. Larger batches give smoother gradients but need more memory. **Adam**, a popular optimizer, adapts the step size for each parameter, but the learning rate still matters most.',
        },
        {
          h: 'Watching a training run',
          body:
            'Log training and validation loss every epoch and read the curves:\n\n- Both falling — keep going.\n- Training falling, validation rising — overfitting: stop early and keep the best saved checkpoint.\n- Flat from the very start — suspect a bug: weights not updating, broken labels, or a learning rate far too small.\n- Jumping up to `NaN` — the learning rate is too high.\n\n**Dropout**, which randomly switches off neurons during training, is a common regularizer for networks that overfit.',
        },
      ],
      terms: [
        { term: 'Backpropagation', def: 'The algorithm that computes the gradient of the loss with respect to every weight by working backward through the layers.' },
        { term: 'Batch', def: 'A small group of training examples processed together for one weight update.' },
        { term: 'Epoch', def: 'One complete pass through the entire training set.' },
        { term: 'Optimizer', def: 'The algorithm, such as SGD or Adam, that uses gradients to update the weights.' },
        { term: 'Dropout', def: 'A regularization technique that randomly disables neurons during training to reduce overfitting.' },
      ],
      example: {
        title: 'The training loop (PyTorch-style)',
        lang: 'python',
        code:
          'model = MyNetwork()\noptimizer = torch.optim.Adam(model.parameters(), lr=1e-3)\nloss_fn = torch.nn.CrossEntropyLoss()\n\nfor epoch in range(10):\n    model.train()\n    for inputs, targets in train_loader:     # one mini-batch at a time\n        optimizer.zero_grad()                # clear old gradients\n        outputs = model(inputs)              # forward pass\n        loss = loss_fn(outputs, targets)     # how wrong?\n        loss.backward()                      # backpropagation: compute gradients\n        optimizer.step()                     # update the weights\n    val_loss = evaluate(model, val_loader)   # check generalization\n    print(f"epoch {epoch}: val_loss={val_loss:.3f}")',
        note: 'The five lines inside the inner loop are the heart of nearly all deep learning: zero the gradients, forward, loss, backward, step. Forgetting `zero_grad()` makes gradients pile up across batches.',
      },
      check: [
        {
          id: 'l4m3-p1', type: 'mc',
          q: 'You have 50,000 training examples and a batch size of 250. How many weight-update steps make up one epoch?',
          options: ['250', '50', '12,500,000', '200'],
          answer: 3,
          explain: 'One epoch covers every example once: 50,000 ÷ 250 = 200 batches, and each batch produces one update step.',
          topic: 'l4m3',
        },
        {
          id: 'l4m3-p2', type: 'mc',
          q: 'Which order matches one training step on a batch?',
          options: [
            'Backward pass → forward pass → compute loss → update weights',
            'Forward pass → compute loss → backward pass → update weights',
            'Update weights → forward pass → compute loss → backward pass',
            'Compute loss → update weights → forward pass → backward pass',
          ],
          answer: 1,
          explain: 'You need predictions (forward pass) before you can measure the loss, the loss before you can compute gradients (backward pass), and gradients before the optimizer can update the weights.',
          topic: 'l4m3',
        },
        {
          id: 'l4m3-p3', type: 'short',
          q: 'In your own words, what does backpropagation compute?',
          keywords: [
            ['gradient', 'derivative', 'slope', 'how much', 'contribut', 'blame', 'responsib', 'effect', 'sensitiv'],
            ['weight', 'parameter'],
            ['loss', 'error'],
          ],
          min: 2,
          sample: 'It computes the gradient of the loss with respect to every weight, working backward from the output, so the optimizer knows how much and in which direction to change each weight.',
          explain: 'A good answer says backpropagation finds the gradient (how much each weight contributed) of the loss for every weight, which the optimizer then uses to update them.',
          topic: 'l4m3',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l4m4',
      title: 'A tour of deep learning architectures',
      goal: 'Match CNNs, RNNs, and transformers to the data they suit, and explain why GPUs are essential.',
      minutes: 15,
      skill: 'deep-learning',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'CNNs: pattern detectors for images',
          body:
            'A **convolutional neural network (CNN)** slides small filters, for example 3 × 3 pixels, across an image. Each filter detects one local pattern (an edge, a corner, a texture) wherever it appears, using the **same weights** at every position. This weight sharing needs far fewer parameters than a dense layer wired to every pixel, and it builds in a useful assumption: an ear is an ear anywhere in the frame.\n\nStacked convolution layers build up from edges to parts to whole objects. CNNs dominated computer vision for about a decade.',
        },
        {
          h: 'RNNs: reading one step at a time',
          body:
            'A **recurrent neural network (RNN)** processes a sequence one element at a time, carrying a **hidden state**, a running summary, from step to step. That suits text, audio, and time series.\n\nTwo problems limited RNNs:\n\n- **Long-range memory**: information from early tokens must survive hundreds of updates, and gradients flowing back through many steps tend to vanish or explode. Gated variants (LSTM, GRU) helped but did not solve it.\n- **No parallelism over time**: step 500 must wait for step 499, which leaves most of a GPU idle.',
        },
        {
          h: 'Attention and transformers: next level',
          body:
            '**Attention** lets every position in a sequence look directly at every other position and decide what is relevant, instead of passing information along a chain. The **transformer** architecture is built around attention. It processes all positions in parallel during training and handles long-range relationships far better than RNNs.\n\nTransformers power today’s LLMs and are increasingly used for images and audio as well. Level 5 opens them up.',
        },
        {
          h: 'Why GPUs',
          body:
            'Neural networks are mostly huge matrix multiplications: millions of independent multiply-and-add operations. A **GPU** has thousands of simple cores that run these in parallel, often making training many times faster than on a CPU. Specialized AI accelerators follow the same idea.\n\nGPU memory is often the real limit: parameters, intermediate activations, and the optimizer’s extra state must all fit, which constrains both model size and batch size.',
        },
      ],
      terms: [
        { term: 'CNN', def: 'Convolutional neural network: slides shared filters over an input to detect local patterns, mainly used for images.' },
        { term: 'RNN', def: 'Recurrent neural network: processes a sequence step by step while carrying a hidden state.' },
        { term: 'Hidden state', def: 'The running summary an RNN passes from one step of a sequence to the next.' },
        { term: 'Vanishing gradient', def: 'Gradients shrinking toward zero as they flow back through many layers or steps, which stalls learning.' },
        { term: 'GPU', def: 'A processor with thousands of parallel cores, well suited to the matrix math of neural networks.' },
      ],
      example: {
        title: 'Picking a starting architecture',
        lang: 'text',
        code:
          'Data and task                        Common starting architecture\n-----------------------------------  -----------------------------------\nPhotos, scans, video frames          CNN or vision transformer\nText, code, long documents           Transformer (Level 5)\nSpeech and audio                     Transformer, or CNN over spectrograms\nShort sensor time series             1-D CNN, LSTM, or small transformer\nTabular rows (age, price, region)    Gradient-boosted trees; small MLP',
        note: 'Architecture follows the structure of the data. For plain tables of features, tree-based models often beat neural networks, so deep learning is not automatically the answer. (An MLP, multilayer perceptron, is a stack of dense layers.)',
      },
      check: [
        {
          id: 'l4m4-p1', type: 'mc',
          q: 'Why does a CNN need far fewer parameters than a dense network on 256 × 256 pixel images?',
          options: [
            'It reuses the same small filters at every position in the image (weight sharing)',
            'It converts images to text first',
            'It has no activation functions',
            'It only looks at the center of each image',
          ],
          answer: 0,
          explain: 'A 3 × 3 filter has only 9 weights per input channel, reused across the whole image. A dense neuron would need a separate weight for each of the 65,536 pixels.',
          topic: 'l4m4',
        },
        {
          id: 'l4m4-p2', type: 'mc',
          q: 'An RNN summarizer handles short reviews well but loses details from the opening of long reports. What is the main cause?',
          options: [
            'Its vocabulary is too small',
            'The learning rate is too low',
            'Information and gradients must pass through many sequential steps and fade along the way',
            'RNNs cannot process text',
          ],
          answer: 2,
          explain: 'Early information must survive every step of the hidden state, and gradients that link the end back to the beginning vanish over long sequences. Attention removes that long chain.',
          topic: 'l4m4',
        },
        {
          id: 'l4m4-p3', type: 'mc',
          q: 'Why are GPUs, rather than CPUs, the standard hardware for training neural networks?',
          options: [
            'GPUs have more disk storage for datasets',
            'GPUs run thousands of multiply-add operations in parallel, which is exactly what matrix math needs',
            'GPUs use a different programming language',
            'CPUs cannot do floating-point math',
          ],
          answer: 1,
          explain: 'Training is dominated by large matrix multiplications made of independent multiply-adds, which GPUs execute in parallel across thousands of cores.',
          topic: 'l4m4',
        },
      ],
      challengeId: null,
    },
  ],
  challenges: [
    {
      id: 'c-l4-1', levelId: 'l4', missionId: 'l4m2', kind: 'code', lang: 'javascript',
      title: 'Build a layer from neurons', skill: 'deep-learning',
      prompt:
        'Implement a dense layer from scratch, one function at a time.\n\n1. `relu(x)` returns `x` if it is greater than 0, otherwise `0`.\n2. `neuron(inputs, weights, bias)` returns `relu(dot + bias)`, where `dot` is the sum of `inputs[i] * weights[i]` over all positions.\n3. `layer(inputs, weightRows, biases)` returns an **array** with one output per neuron. Neuron `i` uses `weightRows[i]` and `biases[i]`, and every neuron receives the same `inputs`.',
      starter:
        'function relu(x) {\n  // return x when it is positive, otherwise 0\n}\n\nfunction neuron(inputs, weights, bias) {\n  // weighted sum of the inputs, plus the bias, then relu\n}\n\nfunction layer(inputs, weightRows, biases) {\n  // one neuron per row of weights; return an array of outputs\n}\n\nconsole.log(neuron([2, 3], [0.5, -1], 1)); // try it\n',
      solution:
        'function relu(x) {\n  return x > 0 ? x : 0;\n}\n\nfunction neuron(inputs, weights, bias) {\n  let z = bias;\n  for (let i = 0; i < inputs.length; i++) {\n    z += inputs[i] * weights[i];\n  }\n  return relu(z);\n}\n\nfunction layer(inputs, weightRows, biases) {\n  return weightRows.map((weights, i) => neuron(inputs, weights, biases[i]));\n}',
      hints: [
        'Start `z` at the bias, then loop over the inputs adding `inputs[i] * weights[i]`. Return `relu(z)`.',
        'For `layer`, use `weightRows.map((w, i) => neuron(inputs, w, biases[i]))` so each row becomes one neuron output.',
      ],
      tests: [
        { call: 'relu(3.5)', expect: 3.5 },
        { call: 'relu(-2)', expect: 0 },
        { call: 'neuron([2, 3], [0.5, -1], 1)', expect: 0 },
        { call: 'neuron([1, 2], [3, -1], 0.5)', expect: 1.5 },
        { call: 'layer([1, 2], [[1, 1], [-1, 0.5], [0.5, -2]], [0, 1, 0])', expect: [3, 1, 0] },
        { call: 'layer([0.5, -1, 2], [[0.2, 0.4, 0.1], [1, 1, 1]], [0.3, -1])', expect: [0.2, 0.5] },
        { call: 'layer([4], [[0.5]], [-1])', expect: [1] },
      ],
    },
  ],
  test: {
    title: 'Neuron Peaks Checkpoint',
    intro: 'Eight questions on neurons, layers and parameters, the training loop, and choosing an architecture.',
    questions: [
      {
        id: 'l4t-q1', type: 'mc',
        q: 'A ReLU neuron has inputs [2, −1], weights [0.5, 2], and bias −0.5. What does it output?',
        options: ['0', '−1.5', '1.5', '3.5'],
        answer: 0,
        explain: 'Weighted sum: 0.5 × 2 + 2 × (−1) = 1 − 2 = −1. Adding the bias gives z = −1.5, and ReLU turns any negative value into 0.',
        topic: 'l4m1',
      },
      {
        id: 'l4t-q2', type: 'mc',
        q: 'A ReLU neuron receives inputs that are all 0. What determines its output?',
        options: [
          'Its largest weight',
          'Its bias: the output equals the bias if it is positive, otherwise 0',
          'Nothing; it always outputs 1',
          'The learning rate',
        ],
        answer: 1,
        explain: 'With every input at 0, all the weight terms vanish, so z equals the bias. ReLU then passes it through if positive or outputs 0 if not.',
        topic: 'l4m1',
      },
      {
        id: 'l4t-q3', type: 'mc',
        q: 'A dense network has layer sizes 10 → 16 → 16 → 1. How many parameters (weights plus biases) does it have?',
        options: ['43', '432', '2,560', '465'],
        answer: 3,
        explain: '(10 × 16 + 16) + (16 × 16 + 16) + (16 × 1 + 1) = 176 + 272 + 17 = 465. The answer 432 counts the weights but forgets the 33 biases.',
        topic: 'l4m2',
      },
      {
        id: 'l4t-q4', type: 'mc',
        q: 'An image classifier’s softmax output for the classes [cat, dog, fox] is [0.10, 0.75, 0.15]. Which statement is correct?',
        options: [
          'The model is 75% accurate on its test set',
          'The model predicts fox because it is the last class',
          'The model predicts dog for this image, and the three values sum to 1',
          'These numbers are the output layer’s weights',
        ],
        answer: 2,
        explain: 'Softmax turns scores into probabilities for this one input; the highest is dog at 0.75. It says nothing about accuracy across a test set.',
        topic: 'l4m2',
      },
      {
        id: 'l4t-q5', type: 'mc',
        q: 'You train on 12,800 examples with a batch size of 64 for 5 epochs. How many weight updates happen in total?',
        options: ['200', '1,000', '64,000', '12,800'],
        answer: 1,
        explain: 'Each epoch has 12,800 ÷ 64 = 200 steps, and 5 epochs give 200 × 5 = 1,000 updates. 200 is just a single epoch.',
        topic: 'l4m3',
      },
      {
        id: 'l4t-q6', type: 'mc',
        q: 'An RNN that summarizes documents misses facts stated in the first paragraph of long reports. What explains this, and which idea addresses it?',
        options: [
          'The vocabulary is too small, so add more tokens',
          'RNNs cannot read text, so convert it to images for a CNN',
          'The learning rate is too high, so lower it',
          'Information and gradients fade across many sequential steps; attention lets every position look directly at every other',
        ],
        answer: 3,
        explain: 'RNNs pass everything through a chain of hidden states, so early details fade and gradients vanish over long distances. Attention, the core of the transformer, connects any two positions directly.',
        topic: 'l4m4',
      },
      {
        id: 'l4t-q7', type: 'short',
        q: 'List, in order, what happens to one batch inside a training loop.',
        keywords: [
          ['forward', 'predict', 'output', 'run the model', 'feed', 'pass the input'],
          ['loss', 'error', 'compare'],
          ['backward', 'backprop', 'gradient'],
          ['step', 'update', 'adjust', 'optimiz', 'change the weight'],
        ],
        min: 3,
        sample: 'Run a forward pass to get predictions, compute the loss against the targets, backpropagate to get the gradient for every weight, then let the optimizer update the weights (clearing old gradients first).',
        explain: 'The four steps are forward pass, loss computation, backward pass (gradients), and an optimizer step that updates the weights. Naming at least three of them in order counts.',
        topic: 'l4m3',
      },
      {
        id: 'l4t-q8', type: 'short',
        q: 'Why are neural networks trained on GPUs rather than ordinary CPUs?',
        keywords: [
          ['parallel', 'simultaneous', 'at once', 'same time', 'many cores', 'thousands', 'concurrent'],
          ['matri', 'multipl', 'linear algebra', 'tensor', 'arithmetic', 'math', 'calculation', 'comput', 'dot product', 'operation'],
        ],
        min: 2,
        sample: 'Training is dominated by huge matrix multiplications made of independent multiply-adds, and a GPU runs thousands of them in parallel, so it is far faster than a CPU.',
        explain: 'Connect the workload (matrix multiplication, many independent multiply-adds) to the hardware strength (thousands of cores working in parallel).',
        topic: 'l4m4',
      },
    ],
  },
  boss: {
    id: 'l4b',
    title: 'The Gradient Golem',
    story:
      'The Gradient Golem guards the summit of Neuron Peaks, built from the logs of five failed training runs. Diagnose each run correctly to crack its stone layers; four direct hits bring it down.',
    minutes: 20,
    hp: 5,
    toWin: 4,
    questions: [
      {
        id: 'l4b-q1', type: 'mc',
        q: 'Run 1: training loss is identical to four decimal places for 30 epochs. The loop runs the forward pass, computes the loss, and calls loss.backward(). Which bug best explains it?',
        options: [
          'optimizer.step() is never called, so the weights never change',
          'The batch size is 32 instead of 64',
          'The validation set is too small',
          'The network uses ReLU activations',
        ],
        answer: 0,
        explain: '`backward()` only computes gradients. Without `optimizer.step()` the weights are never updated, so every epoch produces exactly the same loss.',
        topic: 'l4m3',
      },
      {
        id: 'l4b-q2', type: 'mc',
        q: 'Run 2: training loss falls steadily to 0.02. Validation loss reached its lowest value, 0.41, at epoch 8 and has climbed to 0.78 by epoch 30. What should you do?',
        options: [
          'Train for 100 more epochs',
          'Raise the learning rate',
          'Restore the epoch-8 checkpoint (early stopping) and add regularization such as dropout or more data',
          'Report the training loss as the final result',
        ],
        answer: 2,
        explain: 'Diverging training and validation curves mean overfitting. Keep the best validation checkpoint and reduce memorization with dropout, augmentation, or more data.',
        topic: 'l4m3',
      },
      {
        id: 'l4b-q3', type: 'mc',
        q: 'Run 3: loss goes 2.30, 5.10, 48.7, then NaN within the first 20 steps. The learning rate is set to 5.0. What is the first fix to try?',
        options: [
          'Add more hidden layers',
          'Train for more epochs',
          'Use a larger batch and keep the learning rate',
          'Lower the learning rate, for example to between 0.001 and 0.01, and rerun',
        ],
        answer: 3,
        explain: 'A loss that explodes to NaN in a few steps is the classic sign of a learning rate that is far too large: every update overshoots. Cut it by orders of magnitude.',
        topic: 'l4m3',
      },
      {
        id: 'l4b-q4', type: 'mc',
        q: 'Run 4 crashed with an out-of-memory error, so you need its size. It takes 20 inputs, has one hidden layer of 32 neurons, and outputs 4 class scores. How many parameters does it have?',
        options: ['768', '804', '672', '56'],
        answer: 1,
        explain: 'Hidden: 20 × 32 + 32 = 672. Output: 32 × 4 + 4 = 132. Total: 804. The answer 768 counts only the weights, and 672 stops after the hidden layer.',
        topic: 'l4m2',
      },
      {
        id: 'l4b-q5', type: 'short',
        q: 'Run 5 needs a plan: one model must sort 50,000 product photos into 12 categories, and another must answer questions about 30-page contracts. Which architecture would you start with for each, and why?',
        keywords: [
          ['cnn', 'convolution', 'vision transformer'],
          ['transformer', 'attention', 'llm', 'language model'],
          ['image', 'photo', 'pixel', 'local', 'pattern', 'long', 'context', 'sequence', 'text', 'document'],
        ],
        min: 2,
        sample: 'A CNN (or vision transformer) for the photos, because convolutions detect local visual patterns with shared weights; a transformer-based language model for the contracts, because attention handles long text and long-range references.',
        explain: 'Images suit CNNs or vision transformers; long documents suit transformers, whose attention connects distant parts of the text. A strong answer also says why.',
        topic: 'l4m4',
      },
    ],
    project: null,
  },
  review: [
    { missionId: 'l4m1', tip: 'Recompute the worked neuron with a bias of 4, check your ReLU and sigmoid results, then replay the network visual.' },
    { missionId: 'l4m2', tip: 'Count the parameters of a 784 → 128 → 10 network without looking, then redo the layer challenge.' },
    { missionId: 'l4m3', tip: 'Write the five lines of the inner training loop from memory and label each as forward, loss, backward, or update.' },
    { missionId: 'l4m4', tip: 'For images, text, audio, and tables, name a starting architecture and one reason it fits that data.' },
  ],
};
