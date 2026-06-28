import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { success, error } from "@/lib/response";
import { supabase } from "@/lib/supabase-db";

export async function GET(req: NextRequest) {
  try {
    // 1. Try connecting to MongoDB
    await connectDB();

    // 2. Ping Supabase to keep it active (prevents pausing on free tier)
    const { data, error: supabaseError } = await supabase
      .from('profiles') // any table works, we just need a network request
      .select('id')
      .limit(1);

    if (supabaseError) {
      console.warn("Supabase ping warning:", supabaseError.message);
    }

    return success({ 
      status: "ok", 
      message: "Backend, MongoDB & Supabase connected",
      supabaseStatus: supabaseError ? "error" : "ok"
    });
  } catch (err: any) {
    return error(err.message || "Backend or Database not connected");
  }
}
