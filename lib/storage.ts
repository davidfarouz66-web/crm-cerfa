import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const CERFA_BUCKET = "cerfa-pdfs";
const IMAGES_BUCKET = "crm-images";

export async function uploadPDF(filename: string, bytes: Uint8Array): Promise<void> {
  const { error } = await supabase.storage
    .from(CERFA_BUCKET)
    .upload(filename, bytes, { contentType: "application/pdf", upsert: true });
  if (error) throw new Error(`Erreur upload PDF: ${error.message}`);
}

export async function downloadPDF(filename: string): Promise<Uint8Array> {
  const { data, error } = await supabase.storage
    .from(CERFA_BUCKET)
    .download(filename);
  if (error) throw new Error(`PDF introuvable: ${error.message}`);
  const buf = await data.arrayBuffer();
  return new Uint8Array(buf);
}

export async function uploadImage(filename: string, bytes: Buffer, mimeType: string): Promise<string> {
  const { error } = await supabase.storage
    .from(IMAGES_BUCKET)
    .upload(filename, bytes, { contentType: mimeType, upsert: true });
  if (error) throw new Error(`Erreur upload image: ${error.message}`);
  const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}
