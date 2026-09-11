const DEFAULT_DISCORD_CLIENT_ID = '1547653660845285406';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientId = process.env.DISCORD_CLIENT_ID || DEFAULT_DISCORD_CLIENT_ID;
  const host = (req.headers?.host || '').toLowerCase();

  let redirectUri = 'https://hufflepuffhogworlds.vercel.app/';
  const explicitUri = req.query?.redirect_uri || req.query?.origin;

  if (explicitUri && typeof explicitUri === 'string') {
    if (explicitUri.includes('hufflepuffhogworlds.vercel.app')) {
      redirectUri = 'https://hufflepuffhogworlds.vercel.app/';
    } else if (explicitUri.includes('/auth/discord/callback')) {
      redirectUri = explicitUri;
    } else if (explicitUri.includes('run.app')) {
      redirectUri = `${explicitUri.replace(/\/+$/, '')}/auth/discord/callback`;
    }
  } else if (host.includes('ais-dev-vckel7x5hodtyy6dib2j4d-759650935515.asia-southeast1.run.app')) {
    redirectUri = 'https://ais-dev-vckel7x5hodtyy6dib2j4d-759650935515.asia-southeast1.run.app/auth/discord/callback';
  }

  const state = req.query?.state ? String(req.query.state) : '';
  const isConfigured = Boolean(
    process.env.DISCORD_CLIENT_SECRET &&
    process.env.DISCORD_CLIENT_SECRET.length >= 16 &&
    process.env.DISCORD_CLIENT_SECRET !== '1'
  );
  const responseType = isConfigured ? 'code' : 'token';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: responseType,
    scope: 'identify',
  });
  if (state) params.set('state', state);

  const authUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;

  res.status(200).json({
    configured: isConfigured,
    clientId,
    url: authUrl,
    redirectUri,
    responseType,
  });
}
