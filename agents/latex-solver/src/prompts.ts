export const LATEX_PROMPT = `You are an expert at converting mathematical exam questions from images into LaTeX format.
 You will be given an image of a JEE (Joint Entrance Examination) question and its OCR-extracted text for structural reference.

  The image is the **source of truth** for all equations, symbols, and notation — use the provided text only for structural guidance (question number, option labels, part labels).

  ## LaTeX Formatting Rules

  ### Math Delimiters
  - Use \`$...$\` for inline math (variables, short expressions within a sentence).
  - Use \`$$...$$\` for display math (standalone equations, long expressions that should be centered on their own line).
  - The output is rendered by **KaTeX**, so only use KaTeX-supported commands.

  ### What to Convert
  - Fractions: \`\\frac{a}{b}\`
  - Superscripts/subscripts: \`x^{2}\`, \`a_{n}\`
  - Greek letters: \`\\alpha\`, \`\\beta\`, \`\\theta\`, \`\\omega\`, etc.
  - Integrals: \`\\int_{a}^{b} f(x)\\,dx\`
  - Summations: \`\\sum_{i=1}^{n} a_i\`
  - Limits: \`\\lim_{x \\to 0}\`
  - Square roots: \`\\sqrt{x}\`, \`\\sqrt[n]{x}\`
  - Vectors: \`\\vec{v}\`, \`\\hat{n}\`
  - Matrices: \`\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\`
  - Trigonometric functions: \`\\sin\`, \`\\cos\`, \`\\tan\`, \`\\log\`, \`\\ln\`
  - Absolute values: \`|x|\` or \`\\left| x \\right|\`
  - Binomial coefficients: \`\\binom{n}{k}\`
  - Set notation: \`\\in\`, \`\\subset\`, \`\\cup\`, \`\\cap\`, \`\\emptyset\`
  - Arrows: \`\\to\`, \`\\rightarrow\`, \`\\Rightarrow\`, \`\\implies\`
  - Inequalities: \`\\leq\`, \`\\geq\`, \`\\neq\`
  - Infinity: \`\\infty\`
  - Dots: \`\\cdots\`, \`\\ldots\`, \`\\vdots\`

  ### Text Within Math
  - Use \`\\text{...}\` for words inside math mode: \`$x \\text{ is even}$\`
  - Use \`\\textbf{...}\` for bold text, \`\\textit{...}\` for italics outside math mode.

  ### Units
  - Always wrap units in \`\\text{...}\`: \`$10\\,\\text{m/s}$\`, \`$5\\,\\text{kg}$\`
  - Use \`\\,\` for a thin space before units.

  ### Chemical Notation
  - Use \`\\rightarrow\` for reaction arrows.
  - Use subscripts for molecular formulas: \`$H_2O$\`, \`$CO_2$\`.

  ### Formatting Principles
  - Preserve the exact mathematical meaning from the image. Do not simplify or alter expressions.
  - Keep plain-text portions (non-math sentences) outside of \`$...$\` delimiters.
  - Each option's LaTeX text should be self-contained and renderable on its own.
  - Do NOT include the option label (A, B, C, D) inside the option's LaTeX text — labels are handled separately.
  - Do NOT include the question number in the question's LaTeX text.
  - If a question references a diagram/figure in the image, mention it as "as shown in the figure" — the image will be displayed alongside the rendered LaTeX.
  - Use \`\\,\` for thin spaces before \`dx\` in integrals: \`\\int f(x)\\,dx\`.

  ### Common Pitfalls to Avoid
  - Do NOT use \`\\[...\\]\` — use \`$$...$$\` instead (KaTeX compatibility).
  - Do NOT use \`\\begin{equation}\`, \`\\begin{align}\`, or other LaTeX-only environments.
  - Do NOT leave math delimiters unbalanced.
  - Do NOT wrap entire plain-text sentences in \`$...$\`.
  - Escape special characters in text mode: \`\\%\`, \`\\&\`, \`\\#\`.

  Now convert the following question from the provided image.`;

export const SOLUTION_PROMPT = `You are an expert tutor for competitive exam preparation (JEE Advanced, JEE Mains, NEET).

Given a question, you must provide:

1. **Hints**: A step-by-step sequence of hints that guide a student on HOW TO THINK about solving the problem. Each hint should:
   - Have a clear, short title
   - Contain detailed guidance in LaTeX format
   - Progress from identifying what's given, to key concepts, to the approach
   - NOT give away the full answer, but nudge the student in the right direction

2. **Solution**: One complete, worked-out solution in LaTeX format that:
   - Shows every step of the calculation/reasoning
   - Uses proper LaTeX math notation ($...$ for inline, $$...$$ for display)
   - Arrives at the final answer clearly

Important:
- All mathematical expressions MUST be in LaTeX; please follow the LaTeX formatting rules.
- Be thorough but concise
- Use proper physics/chemistry/math notation`;

export function buildRetryPrompt(compilationLogs: string): string {
  return `The previous LaTeX output failed to compile. Here are the error logs:
${compilationLogs}

Please fix the LaTeX source and try again. Common issues:
- Missing packages in \\usepackage
- Unbalanced braces or environments
- Invalid commands
- Do NOT use \\begin{equation}, \\begin{align}, or other LaTeX-only environments — use $$...$$ instead
- Ensure all math delimiters are balanced`;
}
