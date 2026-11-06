import { getCloudflareContext } from '@opennextjs/cloudflare';
import { clientNetwork } from '@/lib/clientNetwork';

interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

type RateLimitBindingName =
  | 'SCOOTER_API_RATE_LIMITER'
  | 'GEOCODE_API_RATE_LIMITER'
  | 'WALK_API_RATE_LIMITER'
  | 'WALK_UPSTREAM_RATE_LIMITER';

// An IPv6 client counts by its /64 (clientNetwork), so that changing addresses within it does not reset its count.
function clientKey(request: Request): string {
  const address = request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return address ? clientNetwork(address) : 'local-development';
}

function failOpenInLocalDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/** Counts the request against its client, or against `key` when one is given: a limit for all clients together. */
export async function rateLimitAllows(
  request: Request,
  bindingName: RateLimitBindingName,
  key?: string
): Promise<boolean> {
  try {
    const context = await getCloudflareContext({ async: true });
    const binding = (context.env as CloudflareEnv & Record<string, unknown>)[bindingName] as
      RateLimitBinding | undefined;
    if (!binding) return failOpenInLocalDevelopment();

    const result = await binding.limit({ key: key ?? clientKey(request) });
    return result.success;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(JSON.stringify({ event: 'rate_limit_unavailable', bindingName, message }));
    return failOpenInLocalDevelopment();
  }
}
