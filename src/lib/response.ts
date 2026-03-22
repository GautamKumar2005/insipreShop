import { NextResponse } from "next/server";

export function success(data: any, messageOrStatus: string | number = "Success") {
  const status = typeof messageOrStatus === "number" ? messageOrStatus : 200;
  const message = typeof messageOrStatus === "string" ? messageOrStatus : "Success";

  return NextResponse.json(
    { success: true, message, data },
    { status }
  );
}

export function error(message = "Error", status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}
