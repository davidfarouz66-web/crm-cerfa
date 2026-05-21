import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Trouma-Pro — Gestion des dons & CERFA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Cercles décoratifs */}
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 400, height: 400, borderRadius: "50%",
          background: "rgba(255,255,255,0.05)", display: "flex",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: -60,
          width: 300, height: 300, borderRadius: "50%",
          background: "rgba(255,255,255,0.05)", display: "flex",
        }} />

        {/* Icône */}
        <div style={{
          width: 120, height: 120, borderRadius: 28,
          background: "rgba(255,255,255,0.15)",
          border: "2px solid rgba(255,255,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 32, fontSize: 64,
        }}>
          📋
        </div>

        {/* Titre */}
        <div style={{
          fontSize: 72, fontWeight: 800, color: "white",
          letterSpacing: "-2px", marginBottom: 16,
        }}>
          Trouma-Pro
        </div>

        {/* Sous-titre */}
        <div style={{
          fontSize: 32, color: "rgba(255,255,255,0.8)",
          fontWeight: 400, textAlign: "center",
          maxWidth: 700,
        }}>
          Gestion des donateurs & reçus fiscaux CERFA
        </div>

        {/* Badge */}
        <div style={{
          marginTop: 48, background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 999, padding: "10px 28px",
          color: "white", fontSize: 22, fontWeight: 500,
        }}>
          trouma-pro.fr
        </div>
      </div>
    ),
    { ...size }
  );
}
