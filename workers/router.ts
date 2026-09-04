// @ts-ignore: OpenNext built worker
import openNextWorker from "../.open-next/worker.js";

// Re-export any exports from OpenNext worker (Durable Objects, etc.)
// @ts-ignore: OpenNext built worker
export * from "../.open-next/worker.js";

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
  [key: string]: any;
}

interface Env {
  TOUKEI_ORIGIN?: string;
  ASSETS?: any;
  [key: string]: any;
}

const TOUKEI_DEFAULT_ORIGIN = "https://099741b3.bearworks-toukei.pages.dev";

/**
 * 判定: リクエストパスが Toukei アプリ（Pages）へプロキシすべき対象かどうか
 * ※ Portal側が担当する /toukei (案内トップ), /toukei/guides*, /toukei/problems* 等は除外
 */
export function isToukeiProxyPath(pathname: string): boolean {
  // Portal側が担当するパスは除外（Portalへフォールスルー）
  if (
    pathname === "/toukei" ||
    pathname === "/toukei/" ||
    pathname.startsWith("/toukei/guides") ||
    pathname.startsWith("/toukei/problems") ||
    pathname.startsWith("/toukei/methodology")
  ) {
    return false;
  }

  // Toukeiアプリが担当するパス
  if (
    pathname === "/toukei/drill" ||
    pathname.startsWith("/toukei/drill/") ||
    pathname === "/toukei/exam" ||
    pathname.startsWith("/toukei/exam/") ||
    pathname === "/toukei/cheatsheet" ||
    pathname.startsWith("/toukei/cheatsheet/") ||
    pathname.startsWith("/toukei/concepts/") ||
    pathname === "/toukei/dashboard" ||
    pathname.startsWith("/toukei/dashboard/") ||
    pathname.startsWith("/toukei/_next/") ||
    pathname === "/toukei/favicon.ico"
  ) {
    return true;
  }

  return false;
}

/**
 * フォールバック 503 画面の HTML 生成
 */
function generateFallbackHtml(requestedPath: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>統計演習アプリ 一時停止中 - BearWorks</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f9fafb; color: #111827; }
    .card { background: #ffffff; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); max-width: 480px; width: 90%; text-align: center; border: 1px solid #e5e7eb; }
    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem; color: #1f2937; }
    p { font-size: 0.875rem; color: #4b5563; line-height: 1.6; margin-bottom: 1.5rem; }
    .btn { display: inline-block; background-color: #0284c7; color: #ffffff; padding: 0.625rem 1.25rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 0.875rem; transition: background-color 0.2s; }
    .btn:hover { background-color: #0369a1; }
    .subtext { display: block; margin-top: 1.25rem; font-size: 0.75rem; color: #6b7280; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <h1>統計演習アプリは現在一時停止中です</h1>
    <p>統計検定アプリの通信遅延または一時メンテナンスが発生しています。<br>しばらく待ってから再読み込みをお試しください。</p>
    <a href="${requestedPath}" class="btn">再読み込み</a>
    <a href="https://toukei.bearworks.uk" class="subtext">旧URL（toukei.bearworks.uk）で利用を継続する</a>
  </div>
</body>
</html>`;
}

/**
 * Toukei Pages オリジンへのプロキシハンドラー
 */
async function handleToukeiProxy(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const rawOrigin = env.TOUKEI_ORIGIN || TOUKEI_DEFAULT_ORIGIN;
  const toukeiOrigin = rawOrigin.replace(/\/+$/, "");

  // 1. 末尾スラッシュの 301 正規化（例: /toukei/drill/ -> /toukei/drill）
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    const normalizedPath = url.pathname.replace(/\/+$/, "");
    const redirectUrl = new URL(url.toString());
    redirectUrl.pathname = normalizedPath;
    return new Response(null, {
      status: 301,
      headers: {
        Location: redirectUrl.pathname + redirectUrl.search,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  // 2. オリジンターゲット URL の構築
  const targetUrl = new URL(url.pathname + url.search, toukeiOrigin);

  // 3. 転送ヘッダーの選定とサニタイズ
  const forwardHeaders = new Headers();
  const hopByHopHeaders = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
  ]);

  for (const [key, value] of request.headers.entries()) {
    const lowerKey = key.toLowerCase();
    if (hopByHopHeaders.has(lowerKey)) continue;
    if (lowerKey.startsWith("cf-access-")) continue; // Cloudflare Access内部トークン漏洩防止
    if (lowerKey === "x-dashboard-api-token") continue; // Portal内部APIトークン漏洩防止
    forwardHeaders.set(key, value);
  }

  forwardHeaders.set("Host", targetUrl.host);
  forwardHeaders.set("X-Forwarded-Host", url.host);
  forwardHeaders.set("X-Forwarded-Proto", url.protocol.replace(":", ""));

  // 4. ステータス別エッジキャッシュとフェッチオプションの構築
  const isStaticAsset = url.pathname.startsWith("/toukei/_next/static/");

  const fetchOptions: RequestInit & { cf?: any } = {
    method: request.method,
    headers: forwardHeaders,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "manual", // リダイレクトを自動追従せず手動検査
    signal: AbortSignal.timeout(8000), // 8秒タイムアウト
  };

  if (isStaticAsset) {
    fetchOptions.cf = {
      cacheEverything: true,
      cacheTtlByStatus: {
        "200-299": 31536000, // 成功した静的アセットのみ1年エッジキャッシュ
        "400-499": 0,        // 404等はキャッシュ禁止
        "500-599": 0,        // 5xxエラーはキャッシュ禁止
      },
    };
  }

  // 5. フェッチ実行とエラーハンドリング（障害注入・タイムアウト耐性）
  let originResponse: Response;
  try {
    originResponse = await fetch(targetUrl.toString(), fetchOptions);
  } catch (error) {
    console.error("[Toukei Proxy Fetch Error]:", error);
    return new Response(generateFallbackHtml(url.pathname), {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Retry-After": "30",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  // 6. リダイレクト (301, 302, 307, 308) の Location ヘッダーサニタイズ
  if ([301, 302, 307, 308].includes(originResponse.status)) {
    const originalLocation = originResponse.headers.get("Location");
    if (originalLocation) {
      let sanitizedLocation = originalLocation;
      try {
        // オリジンの絶対URL（https://*.pages.dev/...）をプロキシホストへ書き換え
        if (sanitizedLocation.startsWith("http://") || sanitizedLocation.startsWith("https://")) {
          const locUrl = new URL(sanitizedLocation);
          sanitizedLocation = locUrl.pathname + locUrl.search + locUrl.hash;
        }
      } catch (_) {}

      // basePath の二重付与防止: /toukei/toukei/... -> /toukei/...
      sanitizedLocation = sanitizedLocation.replace(/^\/toukei\/toukei\//, "/toukei/");

      // 相対パスかつ /toukei で始まっていない場合は付与
      if (sanitizedLocation.startsWith("/") && !sanitizedLocation.startsWith("/toukei/")) {
        sanitizedLocation = "/toukei" + sanitizedLocation;
      }

      const redirectHeaders = new Headers(originResponse.headers);
      redirectHeaders.set("Location", sanitizedLocation);
      redirectHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");

      return new Response(originResponse.body, {
        status: originResponse.status,
        statusText: originResponse.statusText,
        headers: redirectHeaders,
      });
    }
  }

  // 7. レスポンスヘッダーのサニタイズとSEO境界制御
  const responseHeaders = new Headers(originResponse.headers);

  // 4xx / 5xx エラーレスポンスはキャッシュを完全禁止
  if (originResponse.status >= 400) {
    responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  // SEO / X-Robots-Tag 境界制御:
  // staging環境では常に noindex
  const isStaging =
    url.hostname.includes("staging") ||
    url.hostname.includes("localhost") ||
    url.hostname.includes("127.0.0.1");

  if (isStaging) {
    responseHeaders.set("X-Robots-Tag", "noindex, nofollow");
  } else {
    // 本番環境の場合:
    // 個人ダッシュボード、試験中画面、404画面は意図的noindexを保持
    const isPrivatePath =
      url.pathname.startsWith("/toukei/dashboard") ||
      url.pathname.includes("/exam/session") ||
      originResponse.status === 404;

    if (!isPrivatePath && originResponse.status === 200) {
      // Pagesプレビュー由来のnoindexをサニタイズ除去
      responseHeaders.delete("X-Robots-Tag");
    }
  }

  // 静的アセット以外の HTML / RSC ではエッジキャッシュを防止
  if (!isStaticAsset) {
    const existingCc = responseHeaders.get("Cache-Control") || "";
    if (!existingCc.includes("no-store") && !existingCc.includes("no-cache")) {
      responseHeaders.set("Cache-Control", "public, max-age=0, must-revalidate");
    }
  }

  return new Response(originResponse.body, {
    status: originResponse.status,
    statusText: originResponse.statusText,
    headers: responseHeaders,
  });
}

/**
 * Worker メインエントリポイント
 */
const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Toukei プロキシ対象パスの場合はプロキシハンドラーを実行
    if (isToukeiProxyPath(url.pathname)) {
      return handleToukeiProxy(request, env, ctx);
    }

    // それ以外はすべて既存の OpenNext Worker ハンドラーへ委譲
    return openNextWorker.fetch(request, env, ctx);
  },
};

export default worker;
