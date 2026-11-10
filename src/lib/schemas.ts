import { z } from "zod";
const name = z
  .string()
  .trim()
  .min(1, "Informe um nome.")
  .max(120, "Use até 120 caracteres.");
export const entitySchema = z.object({
  name,
  description: z.string().trim().max(2000, "Use até 2000 caracteres."),
});
export const tagSchema = z.object({
  name,
  color: z.string().regex(/^#[a-f0-9]{6}$/i, "Escolha uma cor válida."),
});
export const destinationSchema = z.object({
  topicId: z.string().min(1, "Escolha um tópico."),
});
export const searchSchema = z.object({
  query: z.string().max(500, "Use até 500 caracteres."),
});
const email = z.string().trim().email("Informe um e-mail válido.");
const password = z
  .string()
  .min(8, "Use pelo menos 8 caracteres.")
  .max(72, "Use até 72 caracteres.");
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Informe sua senha."),
});
export const registerSchema = z
  .object({ name, email, password, confirmation: z.string() })
  .refine((v) => v.password === v.confirmation, {
    path: ["confirmation"],
    message: "As senhas não coincidem.",
  });
export const emailSchema = z.object({ email });
export const passwordSchema = z
  .object({ password, confirmation: z.string() })
  .refine((v) => v.password === v.confirmation, {
    path: ["confirmation"],
    message: "As senhas não coincidem.",
  });

export const studySchema = z.object({
  subject: z.string(),
  topic: z.string(),
  limit: z.enum(["10", "20", "all"]),
  shuffle: z.boolean(),
});
