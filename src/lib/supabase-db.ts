import { Pool } from 'pg';

const globalForPg = global as unknown as { pgPool: Pool };

export const pool = globalForPg.pgPool || new Pool({
  connectionString: process.env.SUPABASE_URI,
  ssl: { rejectUnauthorized: false }
});

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

// Debug log to check the connection host (masks password)
const connectionInfo = process.env.SUPABASE_URI?.split('@')[1] || "NOT SET";
console.log("🔌 Attempting Supabase Connection to:", connectionInfo);

const initDb = async () => {
  if (!process.env.SUPABASE_URI) {
    console.error("❌ SUPABASE_URI is missing in .env");
    return;
  }
  
  try {
    // 1. Heartbeat check
    await pool.query('SELECT 1');
    console.log("✅ Supabase Database connection verified!");

    // 2. Table initialization
    await pool.query(`
      CREATE TABLE IF NOT EXISTS temp_otps (
        email VARCHAR(255) PRIMARY KEY,
        otp VARCHAR(10) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        media_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_follows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        follower_id VARCHAR(255) NOT NULL,
        following_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(follower_id, following_id)
      );
    `);

    // Add Likes, Comments and Views tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(post_id, user_id)
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_views (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        UNIQUE(post_id, user_id)
      );
    `);

    // MESSAGE TABLE for direct chats
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id VARCHAR(255) NOT NULL,
        receiver_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        reaction VARCHAR(10),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Attempt to add missing columns
    try {
      await pool.query('ALTER TABLE social_posts ADD COLUMN media_url TEXT');
    } catch(e) { }
    try {
        await pool.query('ALTER TABLE social_messages ADD COLUMN reaction VARCHAR(10)');
    } catch(e) { }
    
    console.log("✅ Tables ready (temp_otps, social_posts, social_follows, messaging, interactions)");
  } catch (err: any) {
    console.error("❌ Supabase Initialization Error:", {
      message: err.message,
      code: err.code,
      host: connectionInfo
    });
  }
};

initDb();

export async function setOTP(email: string, otp: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
  await pool.query(`DELETE FROM temp_otps WHERE expires_at <= NOW()`);
  await pool.query(`
    INSERT INTO temp_otps (email, otp, expires_at)
    VALUES ($1, $2, $3)
    ON CONFLICT (email)
    DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at;
  `, [email, otp, expiresAt]);
}

export async function getOTP(email: string): Promise<string | null> {
  await pool.query(`DELETE FROM temp_otps WHERE expires_at <= NOW()`);
  const res = await pool.query(`
    SELECT otp FROM temp_otps WHERE email = $1;
  `, [email]);
  return res.rows.length > 0 ? res.rows[0].otp : null;
}

export async function deleteOTP(email: string): Promise<void> {
  await pool.query(`DELETE FROM temp_otps WHERE email = $1`, [email]);
}
