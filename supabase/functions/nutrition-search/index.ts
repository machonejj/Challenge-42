// nutrition-search — Edge Function STUB (Phase 3).
//
// Purpose: proxy nutrition lookups to the verified provider (USDA FoodData Central) so the API key
// stays server-side. The client calls THIS function, never the provider directly.
//
// Phase One ships the contract only. The real implementation will read USDA_FDC_API_KEY from the
// function environment and map results into the `FoodItem` shape defined in
// `packages/domain/src/nutrition/provider.ts`. AI is never involved in producing these numbers.
//
// deno-lint-ignore-file
// @ts-nocheck  (Deno runtime types are not part of the Node/TS workspace typecheck)

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  // TODO(phase-3): authenticate caller, read query, call USDA with server-side key, map to FoodItem.
  return new Response(
    JSON.stringify({
      error: 'not_implemented',
      message:
        'nutrition-search is a Phase One stub. Verified-provider integration lands in Phase 3.',
    }),
    { status: 501, headers: { 'content-type': 'application/json' } },
  );
});
