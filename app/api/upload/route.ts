import { NextResponse } from "next/server";
import { uploadImage } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

    const validTypes = ["logo", "signature"];
    if (!validTypes.includes(type)) return NextResponse.json({ error: "Type invalide" }, { status: 400 });

    const validMime = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validMime.includes(file.type)) {
      return NextResponse.json({ error: "Format non supporté (JPG ou PNG uniquement)" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop grand (max 5 MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const filename = `${type}.${ext}`;
    const url = await uploadImage(filename, Buffer.from(bytes), file.type);

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
