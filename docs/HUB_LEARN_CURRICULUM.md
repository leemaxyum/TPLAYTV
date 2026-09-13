# Hub Learn: First-Year CS, AI, and ML Curriculum

Hub Learn is Fleavo's solo-learning track. It is separate from the Recreation Room: no host is required, no social ranking is required, and every topic follows a calm cycle of **learn -> retrieve -> practise -> explain -> review**.

## Learning contract

For every topic, Hub Learn should provide:

1. A plain-language definition and the essential technical vocabulary.
2. A visual or concrete mental model before formal notation.
3. One real-world application and one “when not to use this” warning.
4. Retrieval prompts before the learner rereads the answer.
5. A worked solution that explains decisions, not just final output.
6. Flashcards scheduled for spaced review and a short Pomodoro-sized practice task.
7. A bridge to a Codeforces/LeetCode-style problem once the prerequisite skills are ready.

## 120-topic map

### 1. Learning, tools, and computational thinking (1-12)

1. Growth mindset and productive debugging
2. Active recall versus passive rereading
3. Spaced repetition and interleaving
4. Pomodoro planning and energy management
5. How to read an error message
6. Command line navigation
7. Files, folders, paths, and permissions
8. Git snapshots, commits, branches, and remotes
9. Pseudocode and decomposition
10. Preconditions, postconditions, and invariants
11. Testing examples and edge cases
12. Complexity as a habit of thought

### 2. Programming logic with Python (13-32)

13. Source code, interpreters, and programs
14. Values, variables, names, and assignment
15. Integers, floats, strings, booleans, and None
16. Operators and expression evaluation
17. Input, output, formatting, and f-strings
18. Boolean logic and truth tables
19. Conditionals and guard clauses
20. Loops and loop tracing
21. Ranges, counters, and accumulators
22. Functions, parameters, return values
23. Scope and lifetime of names
24. Lists and indexing
25. Slicing, copying, and mutation
26. Tuples, sets, and dictionaries
27. Iteration patterns and comprehensions
28. String processing
29. Exceptions and defensive input handling
30. Reading and writing text files
31. Modules, packages, and virtual environments
32. Debugging with print, assertions, and a debugger

### 3. Discrete mathematics and proof (33-50)

33. Sets, membership, subsets, and power sets
34. Set operations and Venn diagrams
35. Cartesian products and relations
36. Functions: domain, codomain, injective, surjective
37. Propositional logic
38. Predicate logic and quantifiers
39. Direct proof
40. Contrapositive and contradiction
41. Mathematical induction
42. Recurrence relations
43. Counting principle and permutations
44. Combinations and binomial coefficients
45. Pigeonhole principle
46. Graph basics: vertices, edges, paths
47. Trees and rooted trees
48. Modular arithmetic
49. Boolean algebra and logic circuits
50. Proof writing and counterexamples

### 4. Algorithms and data structures (51-72)

51. Big-O, Big-Theta, and growth rates
52. Arrays and dynamic arrays
53. Linked lists
54. Stacks and queues
55. Hash tables and collision intuition
56. Sets and maps in practice
57. Recursion and call stacks
58. Binary search and sorted invariants
59. Sorting: selection, insertion, merge, quicksort
60. Divide and conquer
61. Trees, binary search trees, and traversals
62. Heaps and priority queues
63. Graph representations
64. Breadth-first search
65. Depth-first search
66. Shortest paths and Dijkstra intuition
67. Greedy algorithms
68. Dynamic programming foundations
69. Two pointers and sliding windows
70. Prefix sums and difference arrays
71. Amortised analysis
72. Interview/problem-solving patterns

### 5. Computer systems and software engineering (73-88)

73. Binary, hexadecimal, and two's complement
74. Bits, bytes, characters, and Unicode
75. CPU, memory, storage, and caches
76. Processes, threads, and scheduling
77. Memory allocation and pointers conceptually
78. Operating systems and system calls
79. Networks: packets, IP, DNS, HTTP
80. Client-server architecture
81. Databases and relational thinking
82. SQL: select, filter, join, group
83. Web foundations: HTML, CSS, JavaScript
84. APIs, JSON, and authentication basics
85. Security fundamentals: input validation, passwords, secrets
86. Version control workflows and code review
87. Unit, integration, and property-based testing
88. Design, readability, documentation, and refactoring

### 6. Calculus, linear algebra, probability, and statistics (89-106)

89. Algebraic manipulation and functions
90. Limits and continuity intuition
91. Derivatives as rate of change
92. Optimisation and gradient intuition
93. Integrals and accumulation
94. Vectors, dot products, and norms
95. Matrices and matrix multiplication
96. Linear transformations
97. Eigenvalues and eigenvectors intuition
98. Probability spaces and conditional probability
99. Bayes' rule
100. Random variables and distributions
101. Expectation, variance, covariance
102. Sampling and the central limit intuition
103. Confidence intervals and hypothesis tests
104. Correlation versus causation
105. Data visualisation and misleading charts
106. Numerical stability and floating-point error

### 7. AI, machine learning, and responsible practice (107-120)

107. AI, ML, and data science vocabulary
108. Problem framing and target variables
109. Features, labels, and data quality
110. Train, validation, and test splits
111. Regression
112. Classification
113. Loss functions and gradient descent
114. Overfitting, underfitting, and regularisation
115. Evaluation: accuracy, precision, recall, F1
116. Confusion matrices and class imbalance
117. Decision trees and ensembles intuition
118. Neural networks and representation learning intuition
119. Ethics, bias, privacy, and model limits
120. End-to-end ML project: question, data, baseline, evaluation, communication

## Recommended first 12-week path

| Weeks | Focus | Build outcome |
| --- | --- | --- |
| 1-2 | Topics 1-20 | A small Python command-line tool and a reliable study routine |
| 3-4 | Topics 21-32, 33-41 | Text/file project plus clear reasoning about functions and proof |
| 5-6 | Topics 42-59 | Problem-solving notebook and sorting/search practice |
| 7-8 | Topics 60-72 | Data-structure drills and first timed contest practice |
| 9 | Topics 73-88 | Tiny web/API/database project with Git history |
| 10-11 | Topics 89-106 | Math notebook connecting vectors, probability, and data |
| 12 | Topics 107-120 | Responsible mini-ML project and reflective write-up |

## Pedagogy and source policy

The sequence is informed by openly accessible introductory pathways from MIT OpenCourseWare and CS50, plus official language documentation. Hub Learn writes original summaries, examples, questions, and solutions; it links out to source material instead of copying lectures, problem sets, or textbooks wholesale. Before any external module is bundled, record its license and attribution in `THIRD_PARTY_NOTICES.md`.

Recommended companion sources:

- MIT OpenCourseWare, Introductory Programming collection: https://ocw.mit.edu/collections/introductory-programming/
- CS50x, Introduction to Computer Science: https://cs50.harvard.edu/x/
- Python official tutorial: https://docs.python.org/3/tutorial/

## Hub Learn product boundary

Solo learning owns private progress, flashcards, Pomodoro sessions, personal notes, and course modules. The Recreation Room owns social games and host-led shared activity. A learner can optionally bring a solo module into a Fleavo room, but the social room must never be required to access personal learning.

## Implemented library snapshot — September 2026

The first live curriculum tranche is authored locally in `hub/catalog.ts`. It currently includes 42 **Programming Languages Library** lessons, in addition to the wider cross-discipline starter curriculum. Each live lesson has a dedicated reader view with:

- a plain-language explanation and real-world use case;
- a retrieval prompt with an original worked solution;
- one flashcard and a topic-matched self-check quiz;
- completion tracking saved in the learner's browser.

### Programming Languages Library sequence

1. Why languages exist, source code, runtimes, syntax/semantics, types, values/references, and ownership.
2. Programming paradigms plus API contracts and compatibility.
3. C++ toolchain, program I/O, flow control, functions, classes, templates, iterators, move semantics, RAII, ownership, smart pointers, standard containers, debugging, and failure modelling.
4. Python/C++ trade-offs, cross-language testing, a deliberate interview-practice loop, and two-sum with a hash map.
5. JavaScript host environments, values/coercion, objects and immutability, closures, asynchronous work, TypeScript types/generics, UI state, and a local study-tracker project.
6. Python problem-solving: input contracts, collection complexity, key sorting, recursion, generators, decorators, tests, and valid parentheses with a stack.

The visible lesson count is deliberately kept equal to the actual authored lesson count; planned subjects are documented in the 120-topic map rather than presented as already available content.

## Current interaction model

- **Today** presents one next concept, local completion count, and a 25/45/50-minute focus session.
- **Library** is searchable and opens a topic in a separate reader rather than expanding a dense scrolling card.
- **Lesson reader** keeps Library highlighted, supports returning to the catalogue, starting a focus block for the active topic, and opening the active topic's review.
- **Review** binds flashcards, quiz, and spaced-review scheduling to the lesson the learner opened.
- **Focus player** is a compact, draggable screen-right control with play/pause/reset status synced to the main timer.

All of this is local-first. Browser storage is intentionally device-local; clearing browser data clears the learner's local progress. Cloud sync is not claimed or implied yet.


