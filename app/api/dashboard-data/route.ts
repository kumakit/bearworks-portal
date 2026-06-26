import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const TARGET_API_URL = "https://apps.bearworks.uk/api/dashboard/data.json";

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
  // 本番環境（Cloudflare Pagesの本番デプロイ）では、Cloudflare Access経由であることを保証するため
  // JWTアサーションヘッダー (cf-access-jwt-assertion) の存在を強制します。
  // これにより、Cloudflare Accessの設定漏れやバイパスがあっても、未認証リクエストを確実に遮断します。
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
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
  }

  try {
    // 3. キャッシュ無効化ヘッダーを付けて upstream から取得
    const res = await fetch(TARGET_API_URL, {
      headers: {
        "X-Dashboard-Token": token,
      },
      cache: "no-store",
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
  } catch (error: any) {
    console.error("Error proxying dashboard data:", error);
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
