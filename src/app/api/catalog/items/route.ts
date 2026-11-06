import { NextRequest, NextResponse } from "next/server";
import { listCatalogItems } from "@/modules/catalog";
import { CatalogFilterSchema } from "@/modules/catalog/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());

    const parsedFilter = CatalogFilterSchema.safeParse({
      ...searchParams,
      isFeatured: searchParams.isFeatured === "true" ? true : undefined,
      minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    });

    if (!parsedFilter.success) {
      return NextResponse.json(
        { error: "Parameter filter tidak valid", details: parsedFilter.error.format() },
        { status: 400 }
      );
    }

    const result = await listCatalogItems(parsedFilter.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil daftar katalog", details: (error as Error).message },
      { status: 500 }
    );
  }
}

