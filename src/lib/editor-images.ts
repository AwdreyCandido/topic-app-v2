import { getSupabase } from "@/src/lib/supabase/client";

const bucket = "topic-images";
const prefix = "topic-image://";
const maxImageSize = 5 * 1024 * 1024;
const supportedTypes: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export async function uploadEditorImage(file: File): Promise<string> {
  const extension = supportedTypes[file.type];
  if (!extension) {
    throw new Error("Use uma imagem PNG, JPG, WebP, GIF ou AVIF.");
  }
  if (file.size > maxImageSize) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }

  const client = getSupabase();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) {
    throw new Error("Entre na sua conta para adicionar imagens.");
  }

  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    throw new Error(`Não foi possível enviar a imagem: ${error.message}`);
  }
  return `${prefix}${path}`;
}

export async function resolveEditorImage(url: string): Promise<string> {
  if (!url.startsWith(prefix)) return url;

  const path = url.slice(prefix.length);
  if (!/^[\da-f-]{36}\/[\da-f-]{36}\.(png|jpg|webp|gif|avif)$/i.test(path)) {
    throw new Error("Endereço da imagem inválido.");
  }

  const client = getSupabase();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user || path.split("/")[0] !== user.id) {
    throw new Error("Você não tem acesso a esta imagem.");
  }

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (error || !data?.signedUrl) {
    throw new Error("Não foi possível carregar a imagem.");
  }
  return data.signedUrl;
}
