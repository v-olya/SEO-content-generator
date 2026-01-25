import { z } from 'zod';

export const createResponseSchema = (original: string[]) => {
  const TrimmedString = z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val),
    z.string().min(1),
  );

  const ClusterSchema = z
    .object({ label: TrimmedString, items: z.array(TrimmedString).min(2) })
    .refine((c) => new Set(c.items).size === c.items.length, { message: 'items must be unique' });

  const ResponseSchema = z
    .object({ clusters: z.array(ClusterSchema), orphans: z.array(TrimmedString) })
    .superRefine((data, ctx) => {
      const allowed = new Set(original.map((s) => s.trim()));
      for (const c of data.clusters) {
        for (const it of c.items) {
          if (!allowed.has(it)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `item not in original suggestions: ${it}`,
            });
          }
        }
      }
      for (const o of data.orphans) {
        if (!allowed.has(o)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `orphan not in original suggestions: ${o}`,
          });
        }
      }
    });

  return ResponseSchema;
};
