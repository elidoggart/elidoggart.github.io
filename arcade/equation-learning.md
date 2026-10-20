# Equation graph variety

Teaching inspiration (reviewed October 20, 2026):

- [OpenStax: Transformation of Functions](https://openstax.org/books/college-algebra-corequisite-support/pages/3-5-transformation-of-functions) introduces a toolkit of parent functions, then shifts, reflections, and stretches. This inspired separating shape recognition from combining multiple terms.
- [OpenStax: Graphs of Exponential Functions](https://openstax.org/books/college-algebra/pages/6-2-graphs-of-exponential-functions) develops growth, decay, and transformed asymptotes. A Gaussian bell alone is not enough exposure to exponential behavior.

The generated exercises and hints are original; no textbook exercises or illustrations are copied.

## Difficulty

Easy has ten templates: line, parabola, absolute value, sine, cubic, cube root, square root, exponential growth, exponential decay, and logarithm. Each uses one parent function with small coefficients and simple transformations. Exponentials use fixed bases 2 and 1/2; cube roots work on both sides of zero. A new shape does not require combining functions.

Medium has sixteen templates. It revisits roots, logarithms, and exponentials with more transformations, and introduces cubic-plus-linear, cosine-plus-linear, quadratic-plus-sine, absolute-value-plus-linear, cube-root-plus-linear, quartics, Gaussian and rational bells, damped waves, and logistic curves. The logistic combines a reciprocal with an exponential; a damped wave multiplies exponential decay and a sine.

Hard retains its six 3D surface types. Sessions still contain three distinct randomly shuffled templates and five guesses per round, with the existing exact-match shape bonus.

## Windows and scoring

Each template owns its equation, hints, and domain in `equation-families.js`; counts are derived from the catalog. Root endpoints and logarithm domains are real throughout their window. Exponential windows scale with their rate so one very tall end does not flatten the useful part of the graph. Cubics, quartics, and logistic curves show their defining features.

`cbrt(...)` is a real cube root, including negative inputs. The help panel shows the supported notation and links to the lessons. Numeric-base exponentials receive exponential component credit; cube roots have their own component distinct from square roots. Existing exact-equivalence, fit, penalty, and bonus rules remain in effect.
