import { NextRequest } from "next/server";
import { pool } from "@/lib/supabase-db";
import { success, error } from "@/lib/response";
import { verifyAccessToken } from "@/lib/jwt";

export const runtime = "nodejs";

// GET all contact IDs with whom the current user has had a conversation
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader) return error("Unauthorized", 401);
        
        const token = authHeader.split(" ")[1];
        if (!token) return error("Token missing", 401);

        const decoded = verifyAccessToken(token) as any;
        if (!decoded || !decoded.id) return error("Unauthorized", 401);

        const res = await pool.query(
            `SELECT
               CASE 
                 WHEN sender_id = $1 THEN receiver_id 
                 ELSE sender_id 
               END as contact_id,
               MAX(created_at) as last_message_time
             FROM social_messages
             WHERE sender_id = $1 OR receiver_id = $1
             GROUP BY CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END
             ORDER BY last_message_time DESC`,
            [decoded.id]
        );

        return success(res.rows);

    } catch (err: any) {
        return error(err.message || "Internal server error", 500);
    }
}
