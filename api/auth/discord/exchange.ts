const DEFAULT_DISCORD_CLIENT_ID = '1547653660845285406';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const body = req.body || {};
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  const clientId = process.env.DISCORD_CLIENT_ID || DEFAULT_DISCORD_CLIENT_ID;
  const clientSecret = (process.env.DISCORD_CLIENT_SECRET || '').trim();

  if (!clientSecret) {
    return res.status(500).json({
      message: 'ยังไม่ได้ตั้งค่า DISCORD_CLIENT_SECRET ใน Environment Variables บน Vercel',
    });
  }

  if (!code) {
    return res.status(400).json({ message: 'Discord authorization code is required' });
  }

  let redirectUri = 'https://hufflepuffhogworlds.vercel.app/';
  if (body.redirect_uri && typeof body.redirect_uri === 'string') {
    if (body.redirect_uri.includes('hufflepuffhogworlds.vercel.app')) {
      redirectUri = 'https://hufflepuffhogworlds.vercel.app/';
    } else if (body.redirect_uri.includes('/auth/discord/callback')) {
      redirectUri = body.redirect_uri;
    }
  }

  try {
    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok || !tokenData?.access_token) {
      console.error('[Vercel Discord OAuth] Token exchange failed:', tokenResponse.status, tokenData);
      return res.status(401).json({
        message: 'ไม่สามารถยืนยันตัวตนกับ Discord ได้ กรุณาลองเข้าสู่ระบบใหม่อีกครั้ง',
        details: tokenData?.error_description || tokenData?.error || 'Token exchange failed',
      });
    }

    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const discordUser = await userResponse.json().catch(() => null);

    if (!userResponse.ok || !discordUser?.id) {
      return res.status(401).json({
        message: 'ไม่สามารถอ่านข้อมูลบัญชี Discord ได้ กรุณาลองเข้าสู่ระบบใหม่อีกครั้ง',
      });
    }

    const avatar = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`
      : `https://cdn.discordapp.com/embed/avatars/${
          Number.parseInt(discordUser.discriminator || '0', 10) % 5
        }.png`;

    return res.status(200).json({
      user: {
        id: discordUser.id,
        username: discordUser.username,
        global_name: discordUser.global_name || discordUser.username,
        avatar,
        email: discordUser.email || '',
      },
    });
  } catch (error: any) {
    console.error('[Vercel Discord OAuth] Error:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Discord' });
  }
}
