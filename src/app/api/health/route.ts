import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { success, error } from "@/lib/response";
import { pool } from "@/lib/supabase-db";

export async function GET(req: NextRequest) {
  try {
    // 1. Try connecting to MongoDB
    await connectDB();

    // 2. Ping Supabase (via Postgres) to keep it active
    let supabaseStatus = "ok";
    try {
      await pool.query('SELECT 1');
    } catch (supabaseError: any) {
      console.warn("Supabase ping warning:", supabaseError.message);
      supabaseStatus = "error";
    }

    return success({ 
      status: "ok", 
      message: "Backend, MongoDB & Supabase connected",
      supabaseStatus
    });
  } catch (err: any) {
    return error(err.message || "Backend or Database not connected");
  }
}
