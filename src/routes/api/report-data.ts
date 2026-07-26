import { createFileRoute } from "@tanstack/react-router";

const REPORT_PATH = "src/data/report.json";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });

const decodeBase64Utf8 = (value: string) => {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export const Route = createFileRoute("/api/report-data")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const origin = request.headers.get("Origin");
        if (origin && origin !== requestUrl.origin) {
          return jsonResponse({ ok: false, message: "Cross-origin access is not allowed." }, 403);
        }

        const token = process.env.GITHUB_TOKEN?.trim();
        const owner = process.env.GITHUB_OWNER?.trim();
        const repository = process.env.GITHUB_REPO?.trim();
        const branch = process.env.GITHUB_BRANCH?.trim() || "main";

        if (!token || !owner || !repository) {
          return jsonResponse(
            { ok: false, message: "GitHub publishing variables are incomplete in Cloudflare." },
            500,
          );
        }

        const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contents/${REPORT_PATH}?ref=${encodeURIComponent(branch)}`;
        const response = await fetch(endpoint, {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "aka2000mt-live-report",
          },
        });

        if (!response.ok) {
          const details = await response.text();
          return jsonResponse(
            {
              ok: false,
              message: `GitHub report read failed (${response.status}).`,
              details: details.slice(0, 500),
            },
            502,
          );
        }

        const payload = (await response.json()) as { content?: string; sha?: string };
        if (!payload.content) {
          return jsonResponse({ ok: false, message: "GitHub returned an empty report file." }, 502);
        }

        try {
          const data = JSON.parse(decodeBase64Utf8(payload.content));
          return jsonResponse({
            ok: true,
            data,
            sourceSha: payload.sha ?? null,
            branch,
            fetchedAt: new Date().toISOString(),
          });
        } catch {
          return jsonResponse({ ok: false, message: "The GitHub report file contains invalid JSON." }, 502);
        }
      },
    },
  },
});
