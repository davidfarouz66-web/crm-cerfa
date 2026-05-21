"use client";

import { useEffect, useState } from "react";

export default function OpenInBrowser() {
  const [show, setShow] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isInApp =
      ua.includes("FBAN") || ua.includes("FBAV") ||   // Facebook
      ua.includes("Instagram") ||
      ua.includes("WhatsApp") ||
      (ua.includes("wv") && ua.includes("Android")) || // Android WebView
      (ua.includes("iPhone") && !ua.includes("Safari")); // iOS in-app (pas Safari)

    if (isInApp) {
      setShow(true);
      setUrl(window.location.href);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center space-y-4">
        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl">🌐</span>
        </div>
        <h2 className="text-lg font-bold text-slate-800">Ouvrir dans votre navigateur</h2>
        <p className="text-sm text-slate-500">
          Trouma-Pro nécessite un navigateur complet (Safari ou Chrome) pour fonctionner correctement.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          Ouvrir dans Safari / Chrome
        </a>
        <button
          onClick={() => setShow(false)}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Continuer quand même
        </button>
      </div>
    </div>
  );
}
