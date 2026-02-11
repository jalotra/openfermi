# LaTeX Rendering Setup

## Recommended Library: KaTeX

We're using **KaTeX** via `katex` and `react-katex` for rendering LaTeX mathematical notation. KaTeX is:
- ⚡ **Fast**: Renders math synchronously without reflow
- 📦 **Lightweight**: Smaller bundle size than MathJax
- ✅ **Well-maintained**: Active development and good React support
- 🎯 **Perfect for JEE**: Handles all mathematical notation needed for JEE questions

## Installation

```bash
cd frontend
npm install katex react-katex
npm install --save-dev @types/katex
```

## Usage

### Basic Component

The `LatexRenderer` component automatically handles:
- Inline math: `$x^2 + y^2 = r^2$`
- Display math: `$$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$`
- Mixed content with text and math

### Example

```tsx
import { LatexRenderer } from "@/components/ui/latex-renderer"

// Inline math
<LatexRenderer content="The equation $E = mc^2$ is famous" />

// Display math
<LatexRenderer content="$$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$" displayMode={true} />

// Mixed content
<LatexRenderer content="Solve for $x$: $x^2 + 5x + 6 = 0$" />
```

### In QuestionPanel

The `QuestionPanel` component now automatically uses LaTeX if `latexQuestion` and `latexOptions` are provided:

```tsx
<QuestionPanel
  question="What is the derivative of f(x) = x² + 3x - 5?"
  latexQuestion="What is the derivative of $f(x) = x^2 + 3x - 5$?"
  options={{
    A: "2x + 3",
    B: "2x - 3",
    C: "x² + 3",
    D: "2x² + 3x"
  }}
  latexOptions={{
    A: "$2x + 3$",
    B: "$2x - 3$",
    C: "$x^2 + 3$",
    D: "$2x^2 + 3x$"
  }}
/>
```

## Alternative Libraries

If you need more features, consider:

1. **MathJax** (`react-mathjax` or `react-mathjax-preview`)
   - More comprehensive LaTeX support
   - Better for complex documents
   - Slower rendering
   - Larger bundle size

2. **react-latex**
   - Simple wrapper
   - Less maintained
   - Good for basic use cases

## KaTeX Features

KaTeX supports:
- ✅ Fractions: `$\frac{a}{b}$`
- ✅ Integrals: `$\int_0^\infty$`
- ✅ Summations: `$\sum_{i=1}^n$`
- ✅ Matrices: `$\begin{pmatrix} a & b \\ c & d \end{pmatrix}$`
- ✅ Greek letters: `$\alpha, \beta, \gamma$`
- ✅ Subscripts/superscripts: `$x_1^2$`
- ✅ And much more!

## Styling

KaTeX CSS is automatically imported. You can customize styles by:

1. Overriding KaTeX CSS variables
2. Wrapping in custom CSS classes
3. Using Tailwind classes on the container

Example:
```tsx
<LatexRenderer 
  content="$x^2$" 
  className="text-lg text-blue-600" 
/>
```
