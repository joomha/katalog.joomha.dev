import { NextRequest, NextResponse } from "next/server";
import { getCatalogItemBySlug, checkCatalogItemPurchasability } from "@/modules/catalog";

interface RouteProps {
  params: Promise<{ slug: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteProps
) {
  try {
    const { slug } = await params;
    const item = await getCatalogItemBySlug(slug);

    if (!item) {
      return NextResponse.json(
        { error: `Item katalog dengan slug '${slug}' tidak ditemukan` },
        { status: 404 }
      );
    }

    const purchasability = await checkCatalogItemPurchasability(slug);

    return NextResponse.json({
      item,
      purchasability,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data detail katalog", details: (error as Error).message },
      { status: 500 }
    );
  }
}

