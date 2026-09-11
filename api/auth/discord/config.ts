const DEFAULT_DISCORD_CLIENT_ID = '1547653660845285406';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const clientId = process.env.DISCORD_CLIENT_ID || DEFAULT_DISCORD_CLIENT_ID;
  const isConfigured = Boolean(process.env.DISCORD_CLIENT_SECRET && process.env.DISCORD_CLIENT_SECRET.length > 5);

  res.status(200).json({
    configured: isConfigured,
    clientId,
    redirectUri: 'https://hufflepuffhogworlds.vercel.app/',
    appUrl: 'https://hufflepuffhogworlds.vercel.app',
    registeredUrls: [
      'https://discord.com/oauth2/authorize?client_id=1547653660845285406&response_type=code&redirect_uri=https%3A%2F%2Fhufflepuffhogworlds.vercel.app%2F&scope=identify',
      'https://discord.com/oauth2/authorize?client_id=1547653660845285406&response_type=code&redirect_uri=https%3A%2F%2Fais-dev-vckel7x5hodtyy6dib2j4d-759650935515.asia-southeast1.run.app%2Fauth%2Fdiscord%2Fcallback&scope=identify',
    ],
  });
}
