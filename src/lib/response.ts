import { NextResponse } from "next/server";

export function success(data: any, message = "Success") {
  return NextResponse.json(
    { success: true, message, data },
    { status: 200 }
  );
}

export function error(message = "Error", status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}
