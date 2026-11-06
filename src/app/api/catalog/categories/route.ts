import { NextResponse } from "next/server";
import { listCategories } from "@/modules/catalog";

export async function GET() {
  try {
    const categories = await listCategories();
    return NextResponse.json({
      data: categories,
      total: categories.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil daftar kategori", details: (error as Error).message },
      { status: 500 }
    );
  }
}

