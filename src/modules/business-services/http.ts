import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AccessDeniedError, UnauthenticatedError } from "@/modules/identity/types";
import { BusinessServiceError } from "./workflow";

export function businessServiceErrorResponse(error: unknown) {
  if (error instanceof BusinessServiceError) {
    const status = error.code === "NOT_FOUND" ? 404
      : error.code === "FORBIDDEN" ? 403
      : error.code === "CONFLICT" ? 409 : 400;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
  if (error instanceof UnauthenticatedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof AccessDeniedError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Data yang dikirim belum valid.", issues: error.issues }, { status: 400 });
  }
  return NextResponse.json({ error: "Terjadi kesalahan saat memproses layanan bisnis." }, { status: 500 });
}
