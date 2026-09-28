"use client";

import { createClient } from "@/lib/supabase/client";

// Uploads straight from the browser to Supabase Storage (permitted by the
// bucket's per-user-folder policy), skipping our server — so there's no
// server body-size limit in the way and it's one hop faster.
export async function uploadToBucket(
  bucket: string,
  path: string,
  body: Blob,
  contentType: string
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType, cacheControl: "3600" });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}
