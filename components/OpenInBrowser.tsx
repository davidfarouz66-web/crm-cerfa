"use client";

import { useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};

function isInAppBrowser() {
  const ua = navigator.userAgent || "";
  return ua.includes("FBAN") || ua.includes("FBAV") ||
    ua.includes("Instagram") ||
    ua.includes("WhatsApp") ||
    (ua.includes("wv") && ua.includes("Android")) ||
    (ua.includes("iPhone") && !ua.includes("Safari"));
}

export default function OpenInBrowser() {
  const isInApp = useSyncExternalStore(subscribe, isInAppBrowser, () => false);
  const [dismissed, setDismissed] = useState(false);

  if (!isInApp || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center space-y-4">
        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl">🌐</span>
        </div>
        <h2 className="text-lg font-bold text-slate-800">Ouvrir dans votre navigateur</h2>
        <p className="text-sm text-slate-500">
          Trouma Pro nécessite un navigateur complet (Safari ou Chrome) pour fonctionner correctement.
        </p>
        <a
          href={window.location.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          Ouvrir dans Safari / Chrome
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Continuer quand même
        </button>
      </div>
    </div>
  );
}
