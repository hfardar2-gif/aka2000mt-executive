import { createFileRoute } from "@tanstack/react-router";

type JsonObject = Record<string, unknown>;
type PublishRequest = {
  action?: "verify" | "publish";
  password?: unknown;
  data?: unknown;
};

type GitHubFileResponse = {
  sha?: string;
  message?: string;
};

type GitHubUpdateResponse = {
  commit?: {
    sha?: string;
    html_url?: string;
  };
  content?: {
    sha?: string;
  };
  message?: string;
};

const REPORT_PATH = "src/data/report.json";
const MAX_BODY_BYTES = 2_000_000;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const jsonError = (message: string, status: number) =>
  Response.json({ ok: false, message }, { status });

const encodeBase64Utf8 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
};

const validateReport = (value: unknown): value is JsonObject => {
  if (!isObject(value)) return false;
  if (typeof value.reportDate !== "string") return false;
  if (!isObject(value.totals)) return false;

  const arrayKeys = [
    "coilInventory",
    "warehouse",
    "scrap",
    "materialBalance",
    "yields",
    "daily",
    "cumulative",
    "coating",
    "sales",
    "plan",
    "notes",
  ];

  return arrayKeys.every((key) => value[key] === undefined || Array.isArray(value[key]));
};

const githubHeaders = (token: string) => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "aka-project-report-worker",
});

export const Route = createFileRoute("/api/publish-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (origin && origin !== new URL(request.url).origin) {
          return jsonError("Cross-origin requests are not allowed.", 403);
        }

        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (contentLength > MAX_BODY_BYTES) {
          return jsonError("The report payload is too large.", 413);
        }

        let body: PublishRequest;
        try {
          body = (await request.json()) as PublishRequest;
        } catch {
          return jsonError("Invalid JSON request.", 400);
        }

        // Accept the dedicated data-entry password and the main application
        // password. This keeps existing installations working whether one or
        // both Cloudflare secrets are configured.
        const configuredPasswords = [
          process.env.DATA_ENTRY_PASSWORD,
          process.env.APP_ACCESS_PASSWORD,
        ].filter((value): value is string => Boolean(value));
        if (configuredPasswords.length === 0) {
          return jsonError(
            "Neither DATA_ENTRY_PASSWORD nor APP_ACCESS_PASSWORD is configured in Cloudflare.",
            500,
          );
        }

        if (
          typeof body.password !== "string" ||
          body.password.length === 0 ||
          !configuredPasswords.includes(body.password)
        ) {
          return jsonError("Incorrect password.", 401);
        }

        if (body.action === "verify") {
          return Response.json({ ok: true, message: "Password verified." });
        }

        if (body.action !== "publish") {
          return jsonError("Unsupported action.", 400);
        }

        if (!validateReport(body.data)) {
          return jsonError(
            "The report structure is invalid. Import the official Excel template again.",
            400,
          );
        }

        const token = process.env.GITHUB_TOKEN;
        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;
        const branch = process.env.GITHUB_BRANCH || "main";

        if (!token || !owner || !repo) {
          return jsonError("GitHub publishing variables are incomplete in Cloudflare.", 500);
        }

        const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${REPORT_PATH}`;
        const headers = githubHeaders(token);

        const currentResponse = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
          headers,
        });

        const current = (await currentResponse.json().catch(() => ({}))) as GitHubFileResponse;
        if (!currentResponse.ok || !current.sha) {
          const detail = current.message ? ` ${current.message}` : "";
          return jsonError(
            `GitHub could not read the current report file.${detail}`,
            currentResponse.status === 401 || currentResponse.status === 403
              ? 502
              : currentResponse.status,
          );
        }

        const reportJson = `${JSON.stringify(body.data, null, 2)}\n`;
        if (reportJson.length > MAX_BODY_BYTES) {
          return jsonError("The generated report file is too large.", 413);
        }

        const reportDate = String(body.data.reportDate || "updated report");
        const updateResponse = await fetch(apiUrl, {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Update AKA project report — ${reportDate}`,
            content: encodeBase64Utf8(reportJson),
            sha: current.sha,
            branch,
          }),
        });

        const updated = (await updateResponse.json().catch(() => ({}))) as GitHubUpdateResponse;
        if (!updateResponse.ok || !updated.commit?.sha) {
          const detail = updated.message ? ` ${updated.message}` : "";
          return jsonError(
            `GitHub could not save the report.${detail}`,
            updateResponse.status === 401 || updateResponse.status === 403
              ? 502
              : updateResponse.status,
          );
        }

        return Response.json({
          ok: true,
          message:
            "Report committed successfully. Cloudflare deployment should start automatically.",
          commitSha: updated.commit.sha,
          commitUrl:
            updated.commit.html_url ||
            `https://github.com/${owner}/${repo}/commit/${updated.commit.sha}`,
          branch,
        });
      },
    },
  },
});
