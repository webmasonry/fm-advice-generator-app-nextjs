import { z } from "zod";

const SlipSchema = z.object({
  advice: z.string(),
  id: z.number(),
});

const AdviceResponseSchema = z.object({
  slip: SlipSchema,
});

export type Slip = z.infer<typeof SlipSchema>;

export async function getAdvice(): Promise<Slip> {
  // Fetch from api advice for a slip
  const response = await fetch("https://api.adviceslip.com/advice", {
    cache: "no-store",
  });

  // Check if response is okay, otherwise throw error message
  if (!response.ok) throw new Error(`Advice API failed: ${response.status}`);

  // Awaits data
  const data = await response.json();

  // Validates and returns data
  return AdviceResponseSchema.parse(data).slip;
}
