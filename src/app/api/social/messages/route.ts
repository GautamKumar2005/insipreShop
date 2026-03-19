import { NextRequest } from "next/server";
import { pool } from "@/lib/supabase-db";
import { success, error } from "@/lib/response";
import { verifyAccessToken } from "@/lib/jwt";
import { encryptMessage, decryptMessage } from "@/lib/crypto";

export const runtime = "nodejs";

// GET chat history between current user and specified recipient
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader) return error("Unauthorized", 401);
        
        const token = authHeader.split(" ")[1];
        if (!token) return error("Token missing", 401);

        const decoded = verifyAccessToken(token) as any;
        if (!decoded || !decoded.id) return error("Unauthorized", 401);
        
        const { searchParams } = new URL(req.url);
        const otherId = searchParams.get("otherId");
        
        if (!otherId) return error("Recipient ID required", 400);

        // Fetch messages
        const res = await pool.query(
            `SELECT * FROM social_messages 
             WHERE (sender_id = $1 AND receiver_id = $2) 
                OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY created_at ASC`,
            [decoded.id, otherId]
        );

        // DECRYPT messages for the client
        const decryptedMessages = res.rows.map(m => ({
            ...m,
            content: decryptMessage(m.content)
        }));

        return success(decryptedMessages);

    } catch (err: any) {
                return error(err.message || "Internal server error", 500);
    }
}

// POST: Send an ENCRYPTED message
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader) return error("Unauthorized", 401);
        
        const token = authHeader.split(" ")[1];
        if (!token) return error("Token missing", 401);

        const decoded = verifyAccessToken(token) as any;
        if (!decoded || !decoded.id) return error("Unauthorized", 401);

        const { receiverId, content } = await req.json();
        
        if (!receiverId || !content) {
            return error("Recipient and content required", 400);
        }

        // ENCRYPT before storing in DB
        const encryptedContent = encryptMessage(content);

        const res = await pool.query(
            "INSERT INTO social_messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *",
            [decoded.id, receiverId, encryptedContent]
        );

        return success({
            ...res.rows[0],
            content: content // Return original plain text for immediate UI update
        });

    } catch (err: any) {
                return error(err.message || "Internal server error", 500);
    }
}
