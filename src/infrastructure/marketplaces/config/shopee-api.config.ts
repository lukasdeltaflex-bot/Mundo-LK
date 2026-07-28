/**
 * Centralized Configuration for Shopee Open API / Affiliate API Credentials.
 * Reads exclusively from process.env with runtime validation and safe logging.
 */

export interface ShopeeApiConfig {
  appId: string;      // Partner ID / App ID / App Key
  secretKey: string;  // Partner Key / App Secret / Secret Key
  isEnabled: boolean; // Enable/Disable API Provider
}

/**
 * Reads Shopee API credentials exclusively from environment variables.
 */
export function getShopeeApiConfig(): ShopeeApiConfig {
  const appId =
    process.env.SHOPEE_APP_ID ||
    process.env.SHOPEE_PARTNER_ID ||
    process.env.SHOPEE_APP_KEY;

  const secretKey =
    process.env.SHOPEE_APP_SECRET ||
    process.env.SHOPEE_PARTNER_KEY ||
    process.env.SHOPEE_SECRET_KEY;

  const isEnabled = process.env.SHOPEE_ENABLED !== 'false' && Boolean(appId && secretKey);

  return {
    appId: appId?.trim() || '',
    secretKey: secretKey?.trim() || '',
    isEnabled,
  };
}

/**
 * Validates mandatory environment variables for Shopee API.
 * Throws a clear error if any required variable is missing.
 */
export function validateShopeeApiConfig(): ShopeeApiConfig {
  const config = getShopeeApiConfig();

  if (!config.appId) {
    throw new Error(
      '[Shopee API Config Error] Variável de ambiente ausente: SHOPEE_APP_ID (ou SHOPEE_PARTNER_ID). Verifique a configuração no painel do Vercel.'
    );
  }

  if (!config.secretKey) {
    throw new Error(
      '[Shopee API Config Error] Variável de ambiente ausente: SHOPEE_APP_SECRET (ou SHOPEE_PARTNER_KEY). Verifique a configuração no painel do Vercel.'
    );
  }

  return config;
}

/**
 * Provides a safe configuration log object without exposing the secret key.
 * Example secret "L7T2CLBUHGM67QSGTEGQUHGKKGT35DMB" -> "L7T2***5DMB"
 */
export function getSafeShopeeConfigLog(): { appId: string; isEnabled: boolean; secretMasked: string } {
  const config = getShopeeApiConfig();
  const secret = config.secretKey;
  let secretMasked = '[NÃO CONFIGURADO]';

  if (secret) {
    if (secret.length > 8) {
      secretMasked = `${secret.slice(0, 4)}***${secret.slice(-4)}`;
    } else {
      secretMasked = '****';
    }
  }

  return {
    appId: config.appId || '[NÃO CONFIGURADO]',
    isEnabled: config.isEnabled,
    secretMasked,
  };
}
