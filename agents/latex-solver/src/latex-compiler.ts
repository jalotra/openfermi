export interface CompilationResult {
  success: boolean;
  logs?: string;
}

export async function compileLatex(
  source: string,
  latexHttpUrl: string,
): Promise<CompilationResult> {
  const res = await fetch(`${latexHttpUrl}/builds/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      compiler: "pdflatex",
      resources: [{ main: true, content: source }],
      options: {
        compiler: { halt_on_error: true },
        response: { log_files_on_failure: true },
      },
    }),
  });

  if (res.headers.get("content-type")?.includes("application/pdf")) {
    return { success: true };
  }

  const errorData = await res.json();
  return { success: false, logs: JSON.stringify(errorData) };
}
