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
  const response = await fetch("https://api.adviceslip.com/advice", {
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Advice API failed: ${response.status}`);

  const data = await response.json();

  return AdviceResponseSchema.parse(data).slip;
}
