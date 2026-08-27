"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Heart } from "lucide-react";

interface Gala { titre: string; couleurPrimaire: string; }

function MerciContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [gala, setGala] = useState<Gala | null>(null);
  const provider = searchParams.get("provider");

  useEffect(() => {
    fetch(`/api/gala/${id}`).then(r => r.json()).then(setGala);
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: gala?.couleurPrimaire || "#1e3a8a" }}>
          <Heart size={36} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Merci pour votre don !</h1>
        <p className="text-slate-500 text-sm">
          {provider === "gocardless" ? (
            <>
              Votre paiement bancaire est en cours de validation pour{" "}
              <strong>{gala?.titre || "cet événement"}</strong>.
              Le reçu fiscal sera envoyé après confirmation GoCardless.
            </>
          ) : (
            <>
              Votre généreux geste va contribuer au succès de{" "}
              <strong>{gala?.titre || "cet événement"}</strong>.
              Il apparaît maintenant sur l&apos;écran en direct.
            </>
          )}
        </p>
        {gala && (
          <a href={`/gala/${id}/don`}
            className="mt-6 inline-block px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: gala.couleurPrimaire }}>
            Faire un autre don
          </a>
        )}
      </div>
    </div>
  );
}

export default function MerciPage() {
  return (
    <Suspense fallback={null}>
      <MerciContent />
    </Suspense>
  );
}
