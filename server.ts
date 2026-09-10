import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const app = express();
const PORT = 3000;

// Initialize Firebase Firestore for server-side persistence in Hufflepuff Hogworlds
let serverDb: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const fbConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const serverApp = getApps().length === 0 ? initializeApp(fbConfig) : getApps()[0];
    serverDb = getFirestore(serverApp, fbConfig.firestoreDatabaseId);
    console.log('Server connected to Firebase Firestore database:', fbConfig.firestoreDatabaseId);
  }
} catch (fbInitErr) {
  console.warn('Server Firebase Firestore initialization warning:', fbInitErr);
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Custom error handling for large payloads or malformed JSON
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.too.large' || err?.status === 413) {
    return res.status(413).json({
      message: 'ขนาดไฟล์รูปภาพหรือข้อมูลมีขนาดใหญ่เกินไป กรุณาใช้ไฟล์รูปภาพขนาดเล็กลง',
    });
  }
  next(err);
});

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

async function syncUserToFirestore(user: StoredUser) {
  if (!serverDb || !user || !user.discordId) return;
  try {
    const userDocRef = doc(serverDb, 'users', user.discordId);
    // Sanitize image payload if larger than 700KB to stay within Firestore limits
    const safeUser = { ...user };
    if (safeUser.characterPhoto && safeUser.characterPhoto.length > 700000) {
      safeUser.characterPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';
    }
    await setDoc(userDocRef, safeUser, { merge: true });
  } catch (syncErr) {
    console.warn(`[Firestore] Sync failed for ${user.discordId}:`, syncErr);
  }
}

function saveUsers(users: Record<string, StoredUser>, modifiedUser?: StoredUser) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write users.json:', err);
  }
  if (modifiedUser) {
    syncUserToFirestore(modifiedUser).catch(() => {});
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

const DEFAULT_DISCORD_CLIENT_ID = '1547653660845285406';

function getDiscordClientId(): string {
  const envId = (process.env.DISCORD_CLIENT_ID || '').trim();
  if (/^\d{17,20}$/.test(envId)) {
    return envId;
  }
  return DEFAULT_DISCORD_CLIENT_ID;
}

// Helper to check if real Discord OAuth credentials exist
function isDiscordOAuthConfigured(): boolean {
  const clientId = getDiscordClientId();
  const clientSecret = (process.env.DISCORD_CLIENT_SECRET || '').trim();
  const isValidClientId = /^\d{17,20}$/.test(clientId);
  const isValidSecret = clientSecret.length >= 16 && clientSecret !== '1' && clientSecret !== 'MY_DISCORD_CLIENT_SECRET';
  return isValidClientId && isValidSecret;
}

// Config check endpoint
app.get('/api/auth/discord/config', (req, res) => {
  const clientId = getDiscordClientId();
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/auth/discord/callback`;
  const isConfigured = isDiscordOAuthConfigured();

  res.json({
    configured: isConfigured,
    clientId,
    redirectUri,
    appUrl: baseUrl,
    officialOAuthUrl: `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=identify`,
  });
});

// Generate Discord OAuth Authorization URL
app.get('/api/auth/discord/url', (req, res) => {
  const clientId = getDiscordClientId();
  const baseUrl = getBaseUrl(req);
  const reqRedirectUri = req.query.redirect_uri ? String(req.query.redirect_uri) : null;
  const redirectUri = reqRedirectUri || `${baseUrl}/auth/discord/callback`;

  const isConfigured = isDiscordOAuthConfigured();
  // When no valid client secret is configured, use 'token' (Implicit flow) so no client secret is required at all!
  const responseType = isConfigured ? 'code' : 'token';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: responseType,
    scope: 'identify',
    prompt: 'consent',
  });

  const authUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;

  res.json({
    configured: isConfigured,
    clientId,
    url: authUrl,
    redirectUri,
    responseType,
    isSecretValid: isConfigured,
  });
});

// Helper to render successful authentication HTML in popup
function renderSuccessHtml(userPayload: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
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
            max-width: 400px;
          }
          .avatar {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            border: 2px solid #FEE101;
            margin-bottom: 12px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <img class="avatar" src="${userPayload.avatar}" alt="${userPayload.username}" />
          <h3 style="margin: 0 0 8px 0;">เข้าสู่ระบบ Discord สำเร็จ!</h3>
          <p style="color:#d1d5db; font-size:14px; margin:0;">ยินดีต้อนรับ ${userPayload.global_name || userPayload.username}</p>
          <p style="color:#9ca3af; font-size:12px; margin-top:12px;">กำลังนำส่งข้อมูลกลับสู่ปราสาทฮัฟเฟิลพัฟ...</p>
        </div>
        <script>
          const payload = ${JSON.stringify(userPayload)};
          if (window.opener) {
            window.opener.postMessage({ type: 'DISCORD_AUTH_SUCCESS', discordUser: payload }, '*');
            setTimeout(() => window.close(), 600);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `;
}

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

// Discord OAuth Callback Handler (Handles both Implicit 'token' flow and Server 'code' flow)
app.get(['/auth/discord/callback', '/auth/discord/callback/'], async (req, res) => {
  const code = req.query.code as string;
  const error = req.query.error as string;
  const clientId = getDiscordClientId();
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/auth/discord/callback`;

  // If user arrived with a server code and we have valid credentials, attempt server-side token exchange
  if (code && isDiscordOAuthConfigured()) {
    try {
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret!,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (userResponse.ok) {
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

          return res.send(renderSuccessHtml(userPayload));
        }
      } else {
        console.warn('Server-side token exchange rejected with status', tokenResponse.status, 'switching to seamless client flow');
      }
    } catch (tokenErr) {
      console.warn('Server token exchange error:', tokenErr);
    }
  }

  // Universal HTML response:
  // 1) Parses #access_token from window.location.hash
  // 2) If found, fetches https://discord.com/api/users/@me and posts message to opener!
  // 3) If user had an error or cancellation, notifies opener
  // 4) If arriving via code without valid secret, seamlessly switches to token flow so user never encounters 400
  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>กำลังเชื่อมต่อ Discord • Hufflepuff House</title>
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
            padding: 28px 36px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            max-width: 420px;
          }
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(254, 225, 1, 0.2);
            border-top-color: #FEE101;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px auto;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="spinner"></div>
          <h3 id="title-text" style="margin:0 0 8px 0;">กำลังเชื่อมต่อกับ Discord...</h3>
          <p id="status-text" style="color:#d1d5db; font-size:14px; margin:0;">
            กำลังตรวจสอบสิทธิ์และรับข้อมูลนักเรียน...
          </p>
        </div>
        <script>
          (async function() {
            const statusEl = document.getElementById('status-text');
            const titleEl = document.getElementById('title-text');

            // 1. Check URL Fragment (#access_token=...) and Query (?error=...)
            const hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : '';
            const hashParams = new URLSearchParams(hash);
            const searchParams = new URLSearchParams(window.location.search);

            const err = hashParams.get('error') || searchParams.get('error');
            if (err) {
              titleEl.textContent = 'การเข้าสู่ระบบถูกยกเลิก';
              statusEl.textContent = err;
              if (window.opener) {
                window.opener.postMessage({ type: 'DISCORD_AUTH_ERROR', error: err }, '*');
                setTimeout(() => window.close(), 1500);
              }
              return;
            }

            const accessToken = hashParams.get('access_token');

            // If we have an access token from Discord Implicit grant:
            if (accessToken) {
              statusEl.textContent = 'ดึงข้อมูลโปรไฟล์ Discord สำเร็จ กำลังส่งข้อมูล...';
              try {
                const userRes = await fetch('https://discord.com/api/users/@me', {
                  headers: { Authorization: 'Bearer ' + accessToken }
                });
                if (!userRes.ok) {
                  throw new Error('Failed to fetch Discord user profile: ' + userRes.status);
                }
                const discordUser = await userRes.json();
                const avatarUrl = discordUser.avatar
                  ? 'https://cdn.discordapp.com/avatars/' + discordUser.id + '/' + discordUser.avatar + '.png?size=256'
                  : 'https://cdn.discordapp.com/embed/avatars/' + (parseInt(discordUser.discriminator || '0', 10) % 5) + '.png';

                const userPayload = {
                  id: discordUser.id,
                  username: discordUser.username,
                  global_name: discordUser.global_name || discordUser.username,
                  avatar: avatarUrl,
                  email: discordUser.email || '',
                };

                titleEl.textContent = 'เข้าสู่ระบบสำเร็จ!';
                statusEl.textContent = 'ยินดีต้อนรับ ' + (userPayload.global_name || userPayload.username);

                if (window.opener) {
                  window.opener.postMessage({ type: 'DISCORD_AUTH_SUCCESS', discordUser: userPayload }, '*');
                  setTimeout(() => window.close(), 500);
                } else {
                  window.location.href = '/';
                }
                return;
              } catch (fetchErr) {
                console.error('Error fetching Discord user with token:', fetchErr);
                statusEl.textContent = 'ไม่สามารถดึงข้อมูล Discord ได้';
                if (window.opener) {
                  window.opener.postMessage({ type: 'DISCORD_AUTH_ERROR', error: fetchErr.message }, '*');
                  setTimeout(() => window.close(), 2000);
                }
                return;
              }
            }

            // 2. If code exchange failed or arrived without code/token,
            // seamlessly redirect to Discord with response_type=token.
            // Since the user already authorized the app, Discord auto-approves and redirects back in milliseconds!
            const clientId = ${JSON.stringify(clientId)};
            const redirectUri = encodeURIComponent(${JSON.stringify(redirectUri)});
            const seamlessTokenUrl = 'https://discord.com/oauth2/authorize?client_id=' + clientId + '&response_type=token&redirect_uri=' + redirectUri + '&scope=identify';

            window.location.replace(seamlessTokenUrl);
          })();
        </script>
      </body>
    </html>
  `);
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

// Register new user (Enforces 1 Discord Account = 1 Registration, supports /api/users and /api/register)
app.post(['/api/users', '/api/register'], (req, res) => {
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

  const cleanDiscordId = String(discordId).trim();
  const users = loadUsers();

  // If already registered, update and return updated user smoothly
  if (users[cleanDiscordId]) {
    const existing = users[cleanDiscordId];
    const updatedUser: StoredUser = {
      ...existing,
      name: name ? String(name).trim() : existing.name,
      studentId: studentId ? String(studentId).trim() : existing.studentId,
      year: year !== undefined ? Number(year) : existing.year,
      houseRole: houseRole || existing.houseRole,
      houseRoles: Array.isArray(houseRoles) && houseRoles.length > 0 ? houseRoles : existing.houseRoles,
      characterPhoto: characterPhoto || existing.characterPhoto,
      discordUsername: discordUsername || existing.discordUsername,
      discordAvatar: discordAvatar || existing.discordAvatar,
      bio: bio !== undefined ? String(bio) : existing.bio,
      possessedSpells: Array.isArray(possessedSpells) ? possessedSpells : existing.possessedSpells,
      updatedAt: new Date().toISOString(),
    };
    users[cleanDiscordId] = updatedUser;
    saveUsers(users, updatedUser);
    return res.status(200).json({
      message: 'อัปเดตข้อมูลตัวละครสำเร็จ',
      user: updatedUser,
    });
  }

  const newUser: StoredUser = {
    discordId: cleanDiscordId,
    name: String(name).trim(),
    studentId: String(studentId).trim(),
    year: Number(year) || 1,
    houseRole: houseRole || 'นักเรียนทั่วไป',
    houseRoles: Array.isArray(houseRoles) && houseRoles.length > 0 ? houseRoles : [houseRole || 'นักเรียนทั่วไป'],
    characterPhoto: characterPhoto || discordAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    discordUsername: discordUsername || 'Discord User',
    discordAvatar: discordAvatar || '',
    joinedDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }),
    bio: bio || 'นักเรียนบ้านฮัฟเฟิลพัฟ Hogworlds Wizardry Project',
    pointsContributed: 0,
    possessedSpells: Array.isArray(possessedSpells) ? possessedSpells : ['Lumos', 'Nox', 'Alohomora', 'Wingardium Leviosa'],
    updatedAt: new Date().toISOString(),
  };

  users[cleanDiscordId] = newUser;
  saveUsers(users, newUser);

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
  saveUsers(users, updatedUser);

  res.json({
    message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ',
    user: updatedUser,
  });
});

// Update member roles endpoint (Owner authorized action)
app.post('/api/users/:discordId/roles', (req, res) => {
  const { discordId } = req.params;
  const { houseRoles, houseRole } = req.body;
  const cleanId = String(discordId).trim();
  const users = loadUsers();

  if (!users[cleanId]) {
    return res.status(404).json({ message: 'ไม่พบข้อมูลสมาชิกนี้ในระบบ' });
  }

  const existing = users[cleanId];
  const updatedRoles = Array.isArray(houseRoles) ? houseRoles : existing.houseRoles;
  const updatedPrimary = houseRole || (updatedRoles.length > 0 ? updatedRoles[0] : 'นักเรียนทั่วไป');

  const updatedUser: StoredUser = {
    ...existing,
    houseRoles: updatedRoles,
    houseRole: updatedPrimary,
    updatedAt: new Date().toISOString(),
  };

  users[cleanId] = updatedUser;
  saveUsers(users, updatedUser);

  res.json({
    message: 'อัปเดตยศสมาชิกสำเร็จ',
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
