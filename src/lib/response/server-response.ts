import { NextResponse } from "next/server";

interface ServerResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json<ServerResponse<T>>(
    { success: true, data },
    { status }
  );
}

export function errorResponse(error: string, status = 500) {
  return NextResponse.json<ServerResponse>(
    { success: false, error },
    { status }
  );
}

