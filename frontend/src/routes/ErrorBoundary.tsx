import { isRouteErrorResponse, useRouteError } from "react-router-dom";

function getErrorMessage(err: unknown): string {
  if (isRouteErrorResponse(err)) {
    // Prefer data if it's a string; otherwise fall back to statusText.
    const dataText = typeof err.data === "string" ? err.data : "";
    return dataText || err.statusText;
  }
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export default function ErrorBoundary() {
  const error = useRouteError();

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Something went wrong";

  const message = getErrorMessage(error);

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        <pre className="text-sm text-slate-600 whitespace-pre-wrap">
          {message}
        </pre>
      </div>
    </div>
  );
}
