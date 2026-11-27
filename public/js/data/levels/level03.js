// Level 3 — Machine Learning Essentials (Data Delta)
export default {
  id: 'l3',
  num: 3,
  title: 'Machine Learning Essentials',
  region: 'Data Delta',
  tagline: 'How machines learn from examples, and how to tell when they have not.',
  overview:
    'Generative models are machine learning models, so the core ideas carry straight over: data, features, loss, optimization, and honest evaluation. This level gives you the vocabulary and the diagnostic instincts to split data correctly, read training results, and choose metrics that reflect what really matters.',
  objectives: [
    'Classify a problem as supervised, unsupervised, or reinforcement learning and identify its features and label',
    'Split data into training, validation, and test sets and diagnose overfitting and underfitting',
    'Explain how a loss function and gradient descent train a model, and how the learning rate changes the outcome',
    'Compute accuracy, precision, recall, and F1 from a confusion matrix and choose the metric that fits the problem',
  ],
  skills: ['ml'],
  missions: [
    {
      id: 'l3m1',
      title: 'What machine learning is',
      goal: 'Identify the learning type, the features, and the label for a real problem.',
      minutes: 12,
      skill: 'ml',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'Rules from examples',
          body:
            'In traditional programming you write the rules yourself: `if "free money" in email: mark_spam()`. In **machine learning** you supply many examples with the right answers, and an algorithm finds the rules for you. The result is a **model**: a function whose parameters were learned from data.\n\nA model is only as good as its examples. Biased, noisy, or unrepresentative data produces a model with the same problems, no matter how clever the algorithm.',
        },
        {
          h: 'Three ways to learn',
          body:
            '- **Supervised learning** — every example has a known answer, the **label**. Predicting a category is **classification** (spam or not); predicting a number is **regression** (a house price).\n- **Unsupervised learning** — no labels; the algorithm finds structure on its own, such as **clustering** customers into groups.\n- **Reinforcement learning** — an agent takes actions in an environment and learns from **rewards**, like a program that learns a game by playing it.\n\nLLM pre-training is **self-supervised**: the label at each position is simply the next token of the text, so no human labeling is needed.',
        },
        {
          h: 'Features and labels',
          body:
            '**Features** are the inputs the model sees; the **label** (or target) is what it must predict. For a loan-default model:\n\n- Features: income, existing debt, years employed, loan amount.\n- Label: defaulted, yes or no.\n\nEach row of data is one **example**. Choosing informative features and cleaning them often matters more than choosing a fancier algorithm. Deep learning (Level 4) goes further and learns useful features by itself from raw inputs such as pixels or tokens.',
        },
      ],
      terms: [
        { term: 'Model', def: 'A function with learned parameters that maps inputs to predictions.' },
        { term: 'Feature', def: 'An input variable the model uses, such as word count or price.' },
        { term: 'Label', def: 'The correct answer for an example, which a supervised model learns to predict.' },
        { term: 'Classification', def: 'Supervised learning that predicts a category.' },
        { term: 'Regression', def: 'Supervised learning that predicts a continuous number.' },
      ],
      example: {
        title: 'A tiny labeled dataset',
        lang: 'text',
        code:
          'features ------------------------------------------   label\nword_count  has_link  exclamations  known_sender       is_spam\n       120         0             0             1       0\n        35         1             4             0       1\n        80         1             0             1       0\n        22         1             6             0       1',
        note: 'Each row is one example. A supervised classifier learns how the four feature columns relate to the label, then predicts the label for new emails it has never seen.',
      },
      check: [
        {
          id: 'l3m1-p1', type: 'mc',
          q: 'A store wants to group its customers by purchase behavior but has no predefined groups. Which approach fits?',
          options: ['Supervised classification', 'Supervised regression', 'Unsupervised clustering', 'Reinforcement learning'],
          answer: 2,
          explain: 'With no labels to learn from, the task is to discover structure, which is unsupervised learning. Clustering groups similar customers together.',
          topic: 'l3m1',
        },
        {
          id: 'l3m1-p2', type: 'mc',
          q: 'You predict how many minutes a food delivery will take from distance, time of day, and weather. What is the label, and what type of task is this?',
          options: ['Delivery minutes; regression', 'Weather; classification', 'Distance; regression', 'There is no label; clustering'],
          answer: 0,
          explain: 'The value you want to predict, delivery minutes, is the label, and because it is a continuous number the task is regression. Distance, time of day, and weather are features.',
          topic: 'l3m1',
        },
        {
          id: 'l3m1-p3', type: 'mc',
          q: 'Why does LLM pre-training not need humans to label billions of examples?',
          options: [
            'It uses reinforcement learning only',
            'The next token in the text serves as the label (self-supervised learning)',
            'It does not use any labels or loss function',
            'It copies labels from search results',
          ],
          answer: 1,
          explain: 'In self-supervised learning the data provides its own labels: for every position in a text, the true next token is the answer the model is trained to predict.',
          topic: 'l3m1',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l3m2',
      title: 'Data splits and generalization',
      goal: 'Split a dataset correctly and diagnose overfitting or underfitting from training and validation results.',
      minutes: 15,
      skill: 'ml',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'Generalization is the goal',
          body:
            'A model is useful only if it performs well on **new** data: this is **generalization**. Scoring it on the examples it trained on is like grading students with the exact questions they memorized.\n\nSo split the data before training:\n\n- **Training set** (e.g. 70–80%) — used to fit the parameters.\n- **Validation set** (e.g. 10–15%) — used to compare models and tune **hyperparameters** such as the learning rate or model size.\n- **Test set** (e.g. 10–15%) — used **once**, at the end, for an honest final score.',
        },
        {
          h: 'Underfitting and overfitting',
          body:
            'Compare training and validation performance:\n\n- **Underfitting** — poor on both. The model is too simple or undertrained to capture the pattern.\n- **Overfitting** — excellent on training, clearly worse on validation. The model memorized noise and quirks of its training examples.\n- **Good fit** — strong on both, with a small gap.\n\nDuring training, overfitting often appears as training loss still falling while validation loss starts to **rise**.',
        },
        {
          h: 'What to do about it',
          body:
            '**Overfitting fixes:** get more or more varied data, use a simpler model, add regularization (a penalty on complexity), or stop training when validation loss stops improving (**early stopping**).\n\n**Underfitting fixes:** use a more capable model, add better features, or train longer.\n\nIf you keep tuning against the test set, it quietly becomes a second validation set and the final score turns optimistic. Keep the test set locked away until the end.',
        },
        {
          h: 'Data leakage',
          body:
            '**Leakage** happens when information the model would not have in real use sneaks into training: duplicate rows in both training and test sets, a feature computed from the label, or future data used to predict the past. Scores look amazing, then collapse in production.\n\nSplit by time for forecasting, and by user or document when the same source appears many times, so the test set truly represents unseen cases.',
        },
      ],
      terms: [
        { term: 'Validation set', def: 'Held-out data used to compare models and tune hyperparameters during development.' },
        { term: 'Test set', def: 'Held-out data used once, at the end, to estimate real-world performance.' },
        { term: 'Overfitting', def: 'Fitting the training data so closely, noise included, that performance on new data suffers.' },
        { term: 'Underfitting', def: 'Being too simple or undertrained to capture the pattern, so performance is poor even on training data.' },
        { term: 'Data leakage', def: 'Information unavailable at prediction time slipping into training, inflating evaluation scores.' },
      ],
      example: {
        title: 'Reading train and validation scores',
        lang: 'text',
        code:
          'Model            Train acc   Val acc   Diagnosis\n---------------  ---------   -------   ---------------------------\nLinear model        71%        70%     underfitting (both low)\nSmall network       90%        88%     good fit (small gap)\nHuge network      99.8%        76%     overfitting (large gap)',
        note: 'The diagnosis comes from comparing the two columns. A training score on its own tells you almost nothing about real-world performance.',
      },
      check: [
        {
          id: 'l3m2-p1', type: 'mc',
          q: 'A model scores 99% accuracy on its training data and 68% on validation data. What is the most likely diagnosis?',
          options: ['Underfitting', 'A good fit', 'The validation set is too easy', 'Overfitting'],
          answer: 3,
          explain: 'A large gap between excellent training and much weaker validation performance is the signature of overfitting: the model memorized the training examples instead of learning the general pattern.',
          topic: 'l3m2',
        },
        {
          id: 'l3m2-p2', type: 'mc',
          q: 'A teammate tried 50 hyperparameter settings and reports the best test-set accuracy among them as the final result. What is wrong?',
          options: [
            'Nothing; the test set is the most accurate measure',
            'Choosing by test score makes it optimistic; tune on the validation set and use the test set once at the end',
            'They should have reported training accuracy instead',
            'Fifty settings is too few to find a good model',
          ],
          answer: 1,
          explain: 'Picking the best of 50 runs by test score fits the choice to the test set, so the number overstates real performance. The validation set exists for exactly this selection step.',
          topic: 'l3m2',
        },
        {
          id: 'l3m2-p3', type: 'short',
          q: 'A model scores 55% on training data and 54% on validation data for a task where 90% is achievable. What is the problem, and what would you try?',
          keywords: [
            ['underfit', 'too simple', 'not complex', 'high bias', 'not learn', 'capacity', 'too small', 'too weak'],
            ['bigger', 'larger', 'more complex', 'more powerful', 'more capable', 'features', 'train longer', 'longer', 'more epochs', 'deeper', 'more layers', 'more parameters'],
          ],
          min: 2,
          sample: 'The model is underfitting: it is poor on both training and validation data. I would try a more capable model, better features, or training for longer.',
          explain: 'Low scores on both sets with no gap point to underfitting. Fixes add capacity or information: a larger model, better features, or more training.',
          topic: 'l3m2',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l3m3',
      title: 'Loss functions and gradient descent',
      goal: 'Explain how a loss function and gradient descent adjust parameters, and predict the effect of the learning rate.',
      minutes: 16,
      skill: 'ml',
      visual: 'gradient',
      visualCaption:
        'Start with a small learning rate and watch the point creep downhill. Then try a medium rate that settles quickly, and finally a rate that is too large: the steps overshoot the minimum, bounce from side to side, and may fly off entirely.',
      sections: [
        {
          h: 'Loss: one number for "how wrong"',
          body:
            'A **loss function** turns a model’s errors into a single number that training tries to make as small as possible.\n\n- **Mean squared error (MSE)** for regression: the average of `(prediction − target)²`. Squaring makes large misses count much more than small ones.\n- **Cross-entropy** (log loss) for classification: small when the model gives the correct class high probability, very large when it is confidently wrong.\n\nLLMs are trained with cross-entropy on the next token: the loss is low when the model gave high probability to the token that actually came next.',
        },
        {
          h: 'Gradient descent: walk downhill',
          body:
            'Picture the loss as a landscape over all possible parameter values. The **gradient** is the slope at your current position: it points in the direction where the loss increases fastest. Gradient descent repeatedly steps the other way:\n\n```text\nw_new = w − learning_rate × gradient\n```\n\nEach step makes the loss a little smaller. Repeat thousands of times and the parameters settle near a minimum. In practice the gradient is computed on a small random **mini-batch** of examples rather than the whole dataset: cheaper, slightly noisy, and it works well.',
        },
        {
          h: 'The learning rate',
          body:
            'The **learning rate** sets the step size, and it is the most important training setting to get right:\n\n- **Too small** — the loss falls very slowly; training wastes time and may stall.\n- **About right** — the loss drops quickly, then levels off smoothly.\n- **Too large** — steps overshoot the minimum, the loss bounces or climbs, and values can blow up to `NaN`.\n\nA common workflow is to try values spaced by factors of 10 (0.1, 0.01, 0.001) and compare validation loss.',
        },
      ],
      terms: [
        { term: 'Loss function', def: 'A formula that scores how wrong a model’s predictions are; training minimizes it.' },
        { term: 'Mean squared error', def: 'The average of squared differences between predictions and targets, used for regression.' },
        { term: 'Cross-entropy', def: 'A classification loss that heavily penalizes giving low probability to the correct class.' },
        { term: 'Gradient', def: 'The direction and rate of steepest increase of the loss with respect to the parameters.' },
        { term: 'Learning rate', def: 'The step size used when updating parameters against the gradient.' },
      ],
      example: {
        title: 'One parameter, three learning rates',
        lang: 'python',
        code:
          '# Fit y = w * x by gradient descent on mean squared error\nxs = [1, 2, 3, 4]\nys = [2, 4, 6, 8]          # the true w is 2\n\ndef train(lr, steps=20):\n    w = 0.0\n    for _ in range(steps):\n        grad = sum(2 * (w * x - y) * x for x, y in zip(xs, ys)) / len(xs)\n        w = w - lr * grad\n    return w\n\nfor lr in [0.001, 0.05, 0.2]:\n    print(lr, round(train(lr), 3))\n# 0.001 0.522         too small: barely moved\n# 0.05 2.0            good: converged to the true value\n# 0.2 -2097150.0      too large: every step overshoots further',
        note: 'Same data, same model, same number of steps. Only the learning rate changed, and it decided between crawling, converging, and exploding.',
      },
      check: [
        {
          id: 'l3m3-p1', type: 'mc',
          q: 'In the first few steps, training loss goes 2.3, 4.8, 19.6, then NaN. What is the most likely cause?',
          options: ['The learning rate is too small', 'The learning rate is too large', 'The model is underfitting', 'The test set leaked into training'],
          answer: 1,
          explain: 'A loss that grows rapidly and then becomes NaN means each update overshoots the minimum by more than the last. Lowering the learning rate is the first fix to try.',
          topic: 'l3m3',
        },
        {
          id: 'l3m3-p2', type: 'mc',
          q: 'Predictions are [3, 5] and targets are [1, 5]. What is the mean squared error?',
          options: ['1', '4', '2', '0.5'],
          answer: 2,
          explain: 'The errors are 2 and 0, the squared errors are 4 and 0, and their mean is (4 + 0) / 2 = 2.',
          topic: 'l3m3',
        },
        {
          id: 'l3m3-p3', type: 'mc',
          q: 'In the update w_new = w − learning_rate × gradient, why is the gradient subtracted?',
          options: [
            'The gradient points toward increasing loss, so moving against it reduces the loss',
            'Subtracting keeps the weights positive',
            'It makes the learning rate shrink over time',
            'The gradient is always negative',
          ],
          answer: 0,
          explain: 'The gradient points uphill on the loss surface. Stepping in the opposite direction is what makes the loss go down.',
          topic: 'l3m3',
        },
      ],
      challengeId: null,
    },
    {
      id: 'l3m4',
      title: 'Evaluating models honestly',
      goal: 'Compute accuracy, precision, recall, and F1 from a confusion matrix and choose the metric that fits the cost of errors.',
      minutes: 18,
      skill: 'ml',
      visual: null,
      visualCaption: '',
      sections: [
        {
          h: 'The confusion matrix',
          body:
            'For a binary classifier, every prediction lands in one of four cells:\n\n- **True positive (TP)** — predicted positive, actually positive.\n- **False positive (FP)** — predicted positive, actually negative: a false alarm.\n- **False negative (FN)** — predicted negative, actually positive: a miss.\n- **True negative (TN)** — predicted negative, actually negative.\n\n**Accuracy** = (TP + TN) / total: the share of all predictions that were right.',
        },
        {
          h: 'Precision, recall, and F1',
          body:
            '- **Precision** = TP / (TP + FP): of everything flagged positive, how much was right?\n- **Recall** = TP / (TP + FN): of all real positives, how many did we catch?\n- **F1** = 2 × P × R / (P + R): their harmonic mean, high only when both are high.\n\nMost classifiers output a score, and a **threshold** turns it into yes or no. Raising the threshold usually raises precision and lowers recall; lowering it does the opposite. Pick the trade-off based on which mistake costs more.',
        },
        {
          h: 'Why accuracy can mislead',
          body:
            'If 1% of transactions are fraud, a model that **always** says "not fraud" scores 99% accuracy and catches zero fraud: recall 0. On **imbalanced** data, accuracy mostly reflects the majority class.\n\nChoose metrics from the cost of errors:\n\n- Missing a disease is worse than an extra follow-up test → prioritize **recall**.\n- Sending a real customer’s email to spam is costly → prioritize **precision**.\n- Need one balanced number → report **F1** alongside the full confusion matrix.',
        },
      ],
      terms: [
        { term: 'Confusion matrix', def: 'A table counting true positives, false positives, false negatives, and true negatives.' },
        { term: 'Precision', def: 'The fraction of positive predictions that are actually positive: TP / (TP + FP).' },
        { term: 'Recall', def: 'The fraction of actual positives the model finds: TP / (TP + FN).' },
        { term: 'F1 score', def: 'The harmonic mean of precision and recall.' },
        { term: 'Class imbalance', def: 'When one class is much rarer than another, which makes accuracy a weak metric.' },
      ],
      example: {
        title: 'A fraud detector, scored four ways',
        lang: 'text',
        code:
          '1,000 transactions, 50 of them fraud\n\n                    actual fraud   actual legit\npredicted fraud        TP = 40        FP = 20\npredicted legit        FN = 10        TN = 930\n\nAccuracy  = (40 + 930) / 1000 = 0.970\nPrecision = 40 / (40 + 20)    = 0.667\nRecall    = 40 / (40 + 10)    = 0.800\nF1        = 2 × 0.667 × 0.800 / (0.667 + 0.800) ≈ 0.727\n\nBaseline that always says "legit": accuracy 0.950, recall 0.000',
        note: 'The detector beats the lazy baseline by only 2 points of accuracy, yet it catches 80% of fraud instead of none. Precision and recall reveal what accuracy hides.',
      },
      check: [
        {
          id: 'l3m4-p1', type: 'mc',
          q: 'A screening model for a serious but treatable disease flags patients for a cheap follow-up test. Which metric should you prioritize?',
          options: ['Precision', 'Recall', 'Accuracy', 'Training loss'],
          answer: 1,
          explain: 'A missed case (false negative) is far more costly than an unnecessary cheap test (false positive), so you want to catch as many real cases as possible: high recall.',
          topic: 'l3m4',
        },
        {
          id: 'l3m4-p2', type: 'mc',
          q: 'A spam filter flags 50 emails, and 45 of them really are spam. There were 90 spam emails in total. What are its precision and recall?',
          options: ['Precision 0.50, recall 0.90', 'Precision 0.90, recall 0.90', 'Precision 0.45, recall 0.50', 'Precision 0.90, recall 0.50'],
          answer: 3,
          explain: 'TP = 45 and FP = 5, so precision = 45 / 50 = 0.90. FN = 90 − 45 = 45, so recall = 45 / 90 = 0.50. The filter is usually right when it flags, but misses half the spam.',
          topic: 'l3m4',
        },
        {
          id: 'l3m4-p3', type: 'short',
          q: 'A fraud model reports 98% accuracy on data where 2% of transactions are fraud. Why might this model be useless?',
          keywords: [
            ['imbalanc', '2%', 'rare', 'minority', 'majority', 'most transactions', 'few', 'skew', 'uncommon', '98%'],
            ['always', 'every', 'never', 'predict', 'catch', 'miss', 'recall', 'precision', 'f1', 'no fraud', 'zero fraud'],
          ],
          min: 2,
          sample: 'Because fraud is so rare, a model that always predicts "not fraud" already gets 98% accuracy while catching no fraud at all. You need recall and precision to see whether it actually finds fraud.',
          explain: 'The key idea: with a 2% positive class, the trivial "always negative" model scores 98%, so accuracy says nothing about whether fraud is caught. Check recall, precision, or F1.',
          topic: 'l3m4',
        },
      ],
      challengeId: 'c-l3-1',
    },
  ],
  challenges: [
    {
      id: 'c-l3-1', levelId: 'l3', missionId: 'l3m4', kind: 'code', lang: 'javascript',
      title: 'Precision and recall from scratch', skill: 'ml',
      prompt:
        'Write `classificationMetrics(preds, labels)` for a binary classifier. Both arguments are arrays of the same non-zero length containing only `0` and `1`, where `1` means positive.\n\nReturn an object `{ accuracy, precision, recall }`:\n\n- **accuracy** = (TP + TN) / total\n- **precision** = TP / (TP + FP), or `0` if the model predicted no positives\n- **recall** = TP / (TP + FN), or `0` if there are no actual positives\n\nReturn plain numbers; do not round.',
      starter:
        'function classificationMetrics(preds, labels) {\n  let tp = 0, fp = 0, fn = 0, tn = 0;\n  // 1. count the four confusion-matrix cells\n\n  // 2. compute the metrics (watch out for division by zero)\n  return { accuracy: 0, precision: 0, recall: 0 };\n}\n\nconsole.log(classificationMetrics([1, 0, 1, 1], [1, 0, 0, 1])); // try it\n',
      solution:
        'function classificationMetrics(preds, labels) {\n  let tp = 0, fp = 0, fn = 0, tn = 0;\n  for (let i = 0; i < preds.length; i++) {\n    if (preds[i] === 1 && labels[i] === 1) tp++;\n    else if (preds[i] === 1 && labels[i] === 0) fp++;\n    else if (preds[i] === 0 && labels[i] === 1) fn++;\n    else tn++;\n  }\n  const accuracy = (tp + tn) / preds.length;\n  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);\n  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);\n  return { accuracy, precision, recall };\n}',
      hints: [
        'Loop once over the arrays and compare `preds[i]` with `labels[i]` to increment exactly one of tp, fp, fn, or tn.',
        'Guard each division: `const precision = tp + fp === 0 ? 0 : tp / (tp + fp);` and use the same pattern for recall with `tp + fn`.',
      ],
      tests: [
        { call: 'classificationMetrics([1, 0, 1, 1], [1, 0, 0, 1])', expect: { accuracy: 0.75, precision: 2 / 3, recall: 1 } },
        { call: 'classificationMetrics([1, 0, 1], [1, 0, 1])', expect: { accuracy: 1, precision: 1, recall: 1 } },
        { call: 'classificationMetrics([1, 1, 0, 0, 1, 0], [1, 0, 1, 0, 1, 1])', expect: { accuracy: 0.5, precision: 2 / 3, recall: 0.5 } },
        { call: 'classificationMetrics([0, 0, 0, 0], [1, 0, 0, 1])', expect: { accuracy: 0.5, precision: 0, recall: 0 } },
        { call: 'classificationMetrics([1, 0, 0], [0, 0, 0])', expect: { accuracy: 2 / 3, precision: 0, recall: 0 } },
        { call: 'classificationMetrics([0, 1], [1, 0])', expect: { accuracy: 0, precision: 0, recall: 0 } },
        { call: 'classificationMetrics(Array(100).fill(0), [1].concat(Array(99).fill(0)))', expect: { accuracy: 0.99, precision: 0, recall: 0 } },
      ],
    },
  ],
  test: {
    title: 'Data Delta Checkpoint',
    intro: 'Eight questions on learning types, data splits, gradient descent, and choosing the right evaluation metric.',
    questions: [
      {
        id: 'l3t-q1', type: 'mc',
        q: 'A program learns to control a warehouse robot by trying moves and receiving +1 for each delivered package and −1 for each collision. Which type of learning is this?',
        options: ['Supervised classification', 'Unsupervised clustering', 'Supervised regression', 'Reinforcement learning'],
        answer: 3,
        explain: 'There are no labeled examples, only rewards and penalties for actions taken in an environment. Learning from rewards is reinforcement learning.',
        topic: 'l3m1',
      },
      {
        id: 'l3t-q2', type: 'mc',
        q: 'A model predicts whether a support ticket is urgent from its text length, the customer’s plan, and keywords in the subject line. Which statement is correct?',
        options: [
          'Urgent or not is the label, the other three are features, and it is a classification task',
          'Text length is the label because it is a number',
          'It is a regression task because one feature is numeric',
          'There are no labels, so it is unsupervised learning',
        ],
        answer: 0,
        explain: 'The label is what you predict (urgent or not), and because it is a category the task is classification. Whether features are numeric does not decide the task type; the label does.',
        topic: 'l3m1',
      },
      {
        id: 'l3t-q3', type: 'mc',
        q: 'Training loss keeps falling, but validation loss reached its lowest point at epoch 6 and has risen ever since. What should you do?',
        options: [
          'Keep training; validation loss will come back down',
          'Use the checkpoint from around epoch 6 (early stopping) and consider regularization or more data',
          'Make the model larger to fix underfitting',
          'Merge the validation set into the training set and keep going',
        ],
        answer: 1,
        explain: 'Rising validation loss while training loss falls is overfitting. Early stopping keeps the best checkpoint, and regularization or more data reduces the tendency to memorize.',
        topic: 'l3m2',
      },
      {
        id: 'l3t-q4', type: 'mc',
        q: 'A customer-churn model scores 97% on its test set but performs poorly in production. You discover it used a feature called days_since_cancellation. What went wrong?',
        options: [
          'The learning rate was too high',
          'The model underfit the data',
          'Data leakage: that feature only exists after a customer has already churned',
          'The test set was too large',
        ],
        answer: 2,
        explain: 'The feature encodes the answer and is unavailable when a real prediction must be made. That is leakage: test scores look excellent, then collapse in production.',
        topic: 'l3m2',
      },
      {
        id: 'l3t-q5', type: 'mc',
        q: 'Loss decreases smoothly but extremely slowly; after many hours it is still dropping by tiny amounts each epoch. What adjustment should you try first?',
        options: [
          'Increase the learning rate, for example by a factor of 10',
          'Decrease the learning rate further',
          'Use accuracy as the loss function',
          'Shuffle the test set',
        ],
        answer: 0,
        explain: 'Smooth but very slow progress means each step is too small. A larger learning rate takes bigger steps; just watch for bouncing or rising loss, the sign of going too far.',
        topic: 'l3m3',
      },
      {
        id: 'l3t-q6', type: 'mc',
        q: 'A classifier’s confusion matrix shows TP = 30, FP = 10, FN = 20, TN = 940. What are its precision and recall?',
        options: ['Precision 0.60, recall 0.75', 'Precision 0.97, recall 0.60', 'Precision 0.75, recall 0.97', 'Precision 0.75, recall 0.60'],
        answer: 3,
        explain: 'Precision = 30 / (30 + 10) = 0.75. Recall = 30 / (30 + 20) = 0.60. The 0.97 is the accuracy, (30 + 940) / 1000, inflated by the many true negatives.',
        topic: 'l3m4',
      },
      {
        id: 'l3t-q7', type: 'short',
        q: 'Explain why accuracy can be misleading on a dataset where only 1% of examples are positive, and name a better metric to look at.',
        keywords: [
          ['imbalanc', '1%', '99%', 'rare', 'minority', 'majority', 'most examples', 'few', 'skew', 'uncommon'],
          ['always', 'every', 'never', 'all negative', 'predict', 'miss', 'catch'],
          ['recall', 'precision', 'f1', 'confusion'],
        ],
        min: 2,
        sample: 'With only 1% positives, a model that always predicts negative gets 99% accuracy while missing every positive. Recall, precision, and F1 show whether it actually finds the rare class.',
        explain: 'A good answer explains that the majority class dominates accuracy (an always-negative model scores 99%) and names recall, precision, F1, or the confusion matrix.',
        topic: 'l3m4',
      },
      {
        id: 'l3t-q8', type: 'short',
        q: 'In one or two sentences, describe what one step of gradient descent does to a model’s parameters.',
        keywords: [
          ['gradient', 'slope', 'derivative', 'direction', 'downhill'],
          ['loss', 'error', 'cost', 'wrong'],
          ['step', 'update', 'adjust', 'move', 'nudge', 'change', 'shift', 'subtract'],
        ],
        min: 2,
        sample: 'It computes the gradient of the loss with respect to each parameter and moves every parameter a small step, scaled by the learning rate, in the opposite direction so the loss decreases.',
        explain: 'Mention the gradient (slope of the loss) and that parameters are moved a small step against it to reduce the loss, with the learning rate setting the step size.',
        topic: 'l3m3',
      },
    ],
  },
  boss: null,
  review: [
    { missionId: 'l3m1', tip: 'For three apps you use daily, name the learning type, one feature, and the label each one would need.' },
    { missionId: 'l3m2', tip: 'Redraw the train-versus-validation table and write the fix you would apply to each row.' },
    { missionId: 'l3m3', tip: 'Replay the gradient visual at a small, a good, and a too-large learning rate, and describe how the loss behaves in each.' },
    { missionId: 'l3m4', tip: 'Recompute the fraud example’s precision, recall, and F1 by hand, then redo the metrics challenge.' },
  ],
};
