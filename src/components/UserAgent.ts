"use client";

import { useState, useEffect } from "react";

export function useAccessSource() {
  const [source, setSource] = useState<"browser" | "webview" | "unknown">(
    "unknown",
  );

  useEffect(() => {
    const ua = navigator.userAgent;

    const isWebView =
      /wv/.test(ua) || // Android WebView
      /WebView/.test(ua) ||
      /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua) || // iOS WebView (no Safari)
      /FB_IAB|FBAN|Instagram|Line\//.test(ua); // in-app browser sosmed

    setSource(isWebView ? "webview" : "browser");
  }, []);

  return source;
}
