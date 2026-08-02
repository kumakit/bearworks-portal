import { NextRequest, NextResponse } from "next/server";

const TARGET_API_URL = "https://apps.bearworks.uk/api/dashboard/data.json";
const UPSTREAM_TIMEOUT_MS = 10_000;

// キャッシュ無効化のための共通ヘッダー
const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(request: NextRequest) {
  const token = process.env.DASHBOARD_API_TOKEN;

  // 1. Fail-Closed: トークンが未設定の場合は upstream を叩かずに 500 エラー
  if (!token || token.trim() === "") {
    console.error("DASHBOARD_API_TOKEN is not configured.");
    return new NextResponse(
      JSON.stringify({ error: "Configuration Error: Token is missing." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...NO_CACHE_HEADERS,
        },
      }
    );
  }

  // 2. 多層防御 (Defense in Depth):
  // Cloudflare Accessを適用したhostnameだけを公開し、workers.devとversion
  // preview URLはwrangler.jsoncで無効化する。環境名にかかわらず同じ条件を
  // 適用し、stagingで認証境界が弱くならないようにする。
  // このヘッダー確認はAccess通過の補助条件であり、JWTの署名検証そのものではない。
  const cfAccessJwt = request.headers.get("cf-access-jwt-assertion");
  if (!cfAccessJwt) {
    console.warn("Unauthorized request: Missing cf-access-jwt-assertion header.");
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized: Access restricted to authenticated sessions." }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...NO_CACHE_HEADERS,
        },
      }
    );
  }

  try {
    // 3. キャッシュ無効化ヘッダーを付けて upstream から取得
    const res = await fetch(TARGET_API_URL, {
      headers: {
        "X-Dashboard-Token": token,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`Upstream returned status ${res.status}`);
    }

    const data = await res.json();

    // 4. 成功時もキャッシュ無効化ヘッダーを付与して返却
    return NextResponse.json(data, {
      headers: {
        ...NO_CACHE_HEADERS,
      },
    });
  } catch (error: unknown) {
    console.error(
      "Error proxying dashboard data.",
      error instanceof Error ? error.name : "UnknownError"
    );
    return new NextResponse(
      JSON.stringify({ error: "Failed to retrieve dashboard data." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...NO_CACHE_HEADERS,
        },
      }
    );
  }
}

// GET以外のリクエストは405 Method Not Allowedを返す
export async function POST() { return methodNotAllowed(); }
export async function PUT() { return methodNotAllowed(); }
export async function DELETE() { return methodNotAllowed(); }
export async function PATCH() { return methodNotAllowed(); }

function methodNotAllowed() {
  return new NextResponse(
    JSON.stringify({ error: "Method Not Allowed" }),
    {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...NO_CACHE_HEADERS,
      },
    }
  );
}
