import { NextRequest } from "next/server";
import { pool } from "@/lib/supabase-db";
import { success, error } from "@/lib/response";
import { verifyAccessToken } from "@/lib/jwt";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader) return error("Unauthorized", 401);
        
        const decoded = verifyAccessToken(authHeader.split(" ")[1]) as any;
        if (!decoded || !decoded.id) return error("Unauthorized", 401);

        const { messageId, reaction } = await req.json();
        
        if (!messageId) return error("Message ID required", 400);

        // Update reaction
        const res = await pool.query(
            "UPDATE social_messages SET reaction = $1 WHERE id = $2 RETURNING *",
            [reaction, messageId]
        );

        if (res.rows.length === 0) return error("Message not found", 404);

        return success(res.rows[0]);

    } catch (err: any) {
        return error(err.message);
    }
}
