import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent user database directory & file
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface StoredUser {
  discordId: string;
  name: string;
  studentId: string;
  year: number;
  houseRole: string;
  houseRoles: string[];
  characterPhoto: string;
  discordUsername: string;
  discordAvatar: string;
  joinedDate: string;
  bio: string;
  pointsContributed: number;
  possessedSpells: string[];
  updatedAt: string;
}

function loadUsers(): Record<string, StoredUser> {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read users.json:', err);
  }
  return {};
}

function saveUsers(users: Record<string, StoredUser>) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write users.json:', err);
  }
}

// -------------------------------------------------------------
// Discord OAuth Configuration & Endpoints
// -------------------------------------------------------------

function getBaseUrl(req: express.Request): string {
  // Use runtime APP_URL if configured, otherwise fallback to request headers or localhost:3000
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

// Config check endpoint
app.get('/api/auth/discord/config', (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID || '';
  const clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/auth/discord/callback`;

  res.json({
    configured: Boolean(clientId && clientSecret),
    clientId: clientId ? `${clientId.slice(0, 4)}...` : '',
    redirectUri,
    appUrl: baseUrl,
  });
});

// Generate Discord OAuth Authorization URL
app.get('/api/auth/discord/url', (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/auth/discord/callback`;

  if (!clientId) {
    return res.status(200).json({
      configured: false,
      redirectUri,
      message: 'DISCORD_CLIENT_ID not configured in environment variables.',
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email',
    prompt: 'consent',
  });

  const authUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;
  res.json({
    configured: true,
    url: authUrl,
    redirectUri,
  });
});

// Identify or verify Discord user (supports direct Discord verification and lookup)
app.post('/api/auth/discord/identify', (req, res) => {
  const { discordId, username, avatar } = req.body;
  if (!discordId) {
    return res.status(400).json({ message: 'Discord ID is required' });
  }
  const cleanId = String(discordId).trim();
  const users = loadUsers();
  const existing = users[cleanId];

  res.json({
    registered: Boolean(existing),
    user: existing || null,
    discordUser: {
      id: cleanId,
      username: username || (existing ? existing.discordUsername : 'HufflepuffStudent'),
      global_name: username || (existing ? existing.name : 'HufflepuffStudent'),
      avatar: avatar || (existing ? existing.discordAvatar : 'https://cdn.discordapp.com/embed/avatars/0.png'),
    },
  });
});

// Discord OAuth Callback Handler (Popup Flow)
app.get(['/auth/discord/callback', '/auth/discord/callback/'], async (req, res) => {
  const code = req.query.code as string;
  const error = req.query.error as string;

  if (error || !code) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Discord Login Failed</title></head>
        <body style="background:#0e0e12; color:#fff; font-family:sans-serif; text-align:center; padding:40px;">
          <h2 style="color:#ef4444;">เข้าสู่ระบบ Discord ไม่สำเร็จ</h2>
          <p>${error || 'ไม่พบ Authorization Code'}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'DISCORD_AUTH_ERROR', error: '${error || 'canceled'}' }, '*');
              setTimeout(() => window.close(), 1500);
            }
          </script>
        </body>
      </html>
    `);
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/auth/discord/callback`;

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error('Discord Token Exchange Failed:', errBody);
      throw new Error(`Token exchange failed with status ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile from Discord API
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch Discord user profile');
    }

    const discordUser = await userResponse.json();

    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.discriminator || '0', 10) % 5}.png`;

    const userPayload = {
      id: discordUser.id,
      username: discordUser.username,
      global_name: discordUser.global_name || discordUser.username,
      avatar: avatarUrl,
      email: discordUser.email || '',
    };

    // 3. Render HTML snippet to send postMessage to opener and close popup
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>เข้าสู่ระบบ Discord สำเร็จ</title>
          <style>
            body {
              background: #0e0e12;
              color: #FEE101;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              background: #181820;
              border: 1px solid rgba(254, 225, 1, 0.3);
              padding: 24px 32px;
              border-radius: 16px;
              text-align: center;
              box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h3>เข้าสู่ระบบ Discord สำเร็จ!</h3>
            <p style="color:#d1d5db; font-size:14px;">กำลังนำส่งข้อมูลกลับสู่ระบบฮัฟเฟิลพัฟ...</p>
          </div>
          <script>
            const payload = ${JSON.stringify(userPayload)};
            if (window.opener) {
              window.opener.postMessage({ type: 'DISCORD_AUTH_SUCCESS', discordUser: payload }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Discord OAuth Error:', err);
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Error</title></head>
        <body style="background:#0e0e12; color:#fff; font-family:sans-serif; text-align:center; padding:40px;">
          <h2 style="color:#ef4444;">เกิดข้อผิดพลาดในการเชื่อมต่อ Discord</h2>
          <p>${err.message || 'Error occurred'}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'DISCORD_AUTH_ERROR', error: '${err.message || 'error'}' }, '*');
              setTimeout(() => window.close(), 3000);
            }
          </script>
        </body>
      </html>
    `);
  }
});

// -------------------------------------------------------------
// User Management & Persistence Endpoints
// Constraint: 1 Discord account = 1 registration.
// User can update data anytime.
// -------------------------------------------------------------

// Get single user by discordId
app.get('/api/users/:discordId', (req, res) => {
  const { discordId } = req.params;
  const users = loadUsers();
  const user = users[discordId];

  if (!user) {
    return res.status(404).json({ message: 'User not registered yet' });
  }

  res.json({ user });
});

// Register new user (Enforces 1 Discord Account = 1 Registration)
app.post('/api/users', (req, res) => {
  const {
    discordId,
    name,
    studentId,
    year,
    houseRole,
    houseRoles,
    characterPhoto,
    discordUsername,
    discordAvatar,
    bio,
    possessedSpells,
  } = req.body;

  if (!discordId || !name || !studentId) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูล Discord ID, ชื่อตัวละคร และรหัสนักศึกษาให้ครบถ้วน' });
  }

  const users = loadUsers();

  // Strict Rule: Discordบัญชีนึงสมัครได้ครั้งเดียว
  if (users[discordId]) {
    return res.status(409).json({
      message: 'บัญชี Discord นี้ถูกใช้ลงทะเบียนตัวละครไปแล้ว (1 บัญชี Discord สมัครได้เพียง 1 ครั้งเท่านั้น)',
      existingUser: users[discordId],
    });
  }

  const newUser: StoredUser = {
    discordId,
    name: name.trim(),
    studentId: studentId.trim(),
    year: Number(year) || 1,
    houseRole: houseRole || 'นักเรียนทั่วไป',
    houseRoles: Array.isArray(houseRoles) && houseRoles.length > 0 ? houseRoles : [houseRole || 'นักเรียนทั่วไป'],
    characterPhoto: characterPhoto || discordAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    discordUsername: discordUsername || 'Discord User',
    discordAvatar: discordAvatar || '',
    joinedDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }),
    bio: bio || 'นักเรียนบ้านฮัฟเฟิลพัฟ FiveM SRP',
    pointsContributed: 0,
    possessedSpells: Array.isArray(possessedSpells) ? possessedSpells : [],
    updatedAt: new Date().toISOString(),
  };

  users[discordId] = newUser;
  saveUsers(users);

  res.status(201).json({
    message: 'ลงทะเบียนสำเร็จ',
    user: newUser,
  });
});

// Update user profile (Can edit anytime: "ผู้ใช้สามารถที่จะแก้ไขข้อมูลได้ตลอด")
app.put('/api/users/:discordId', (req, res) => {
  const { discordId } = req.params;
  const users = loadUsers();

  if (!users[discordId]) {
    return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้ที่ลงทะเบียนด้วย Discord ID นี้' });
  }

  const existing = users[discordId];
  const {
    name,
    studentId,
    year,
    houseRole,
    houseRoles,
    characterPhoto,
    bio,
    possessedSpells,
  } = req.body;

  const updatedUser: StoredUser = {
    ...existing,
    name: name ? name.trim() : existing.name,
    studentId: studentId ? studentId.trim() : existing.studentId,
    year: year !== undefined ? Number(year) : existing.year,
    houseRole: houseRole || existing.houseRole,
    houseRoles: Array.isArray(houseRoles) && houseRoles.length > 0 ? houseRoles : existing.houseRoles,
    characterPhoto: characterPhoto !== undefined ? characterPhoto : existing.characterPhoto,
    bio: bio !== undefined ? bio : existing.bio,
    possessedSpells: Array.isArray(possessedSpells) ? possessedSpells : existing.possessedSpells,
    updatedAt: new Date().toISOString(),
  };

  users[discordId] = updatedUser;
  saveUsers(users);

  res.json({
    message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ',
    user: updatedUser,
  });
});

// Get all registered house members (Only real registered members!)
app.get('/api/members', (req, res) => {
  const users = loadUsers();
  const membersList = Object.values(users).map((u) => ({
    id: `mem-${u.discordId}`,
    name: u.name,
    studentId: u.studentId,
    year: u.year,
    role: u.houseRole,
    roles: u.houseRoles,
    avatar: u.characterPhoto,
    status: 'online' as const,
    specialty: u.bio || 'สมาชิกบ้านฮัฟเฟิลพัฟ',
    possessedSpells: u.possessedSpells || [],
  }));

  res.json({ members: membersList });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// -------------------------------------------------------------
// Vite Middleware / Static Asset Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
