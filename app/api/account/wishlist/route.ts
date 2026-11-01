import { NextResponse } from "next/server";
import { getRequestCustomer } from "@/lib/server-auth";
import { isSameOrigin } from "@/lib/request-security";
import { getServerSupabase } from "@/lib/server-supabase";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function requireCustomer(request: Request) {
  const customer = await getRequestCustomer(request);
  if (!customer.userId) {
    return {
      userId: null,
      response: NextResponse.json(
        { error: customer.error ?? "Sign in to use your wishlist." },
        { status: customer.status ?? 401, headers: { "Cache-Control": "no-store" } }
      ),
    };
  }
  return { userId: customer.userId, response: null };
}

export async function GET(request: Request) {
  const auth = await requireCustomer(request);
  if (auth.response) return auth.response;

  const { client } = await getServerSupabase();
  if (!client) {
    return NextResponse.json({ error: "Wishlist is temporarily unavailable." }, { status: 503 });
  }

  const { data: saved, error: wishlistError } = await client
    .schema("storefront")
    .from("storefront_customer_wishlist")
    .select("product_id, created_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });
  if (wishlistError) {
    return NextResponse.json({ error: "Could not load your wishlist. Please try again." }, { status: 503 });
  }

  const productIds = saved.map((row) => row.product_id as string);
  if (productIds.length === 0) {
    return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data: products, error: productsError } = await client
    .schema("storefront")
    .from("product_catalog_view")
    .select("id, name, unit_code, price_paisa, on_sale, discounted_price_paisa, image_path")
    .in("id", productIds);
  if (productsError) {
    return NextResponse.json({ error: "Could not load wishlist product details. Please try again." }, { status: 503 });
  }

  const savedAt = new Map(saved.map((row) => [row.product_id as string, row.created_at as string]));
  const items = products.map((product) => ({
    productId: product.id as string,
    name: product.name as string,
    unitCode: product.unit_code as string,
    pricePaisa: Number(product.price_paisa),
    onSale: Boolean(product.on_sale),
    salePricePaisa:
      product.discounted_price_paisa === null ? null : Number(product.discounted_price_paisa),
    imagePath: product.image_path as string | null,
    createdAt: savedAt.get(product.id as string) ?? "",
  }));

  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  const auth = await requireCustomer(request);
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Wishlist details are invalid." }, { status: 400 });
  }
  const productId =
    typeof body === "object" && body !== null && "productId" in body && typeof body.productId === "string"
      ? body.productId
      : "";
  if (!UUID_PATTERN.test(productId)) {
    return NextResponse.json({ error: "Choose a valid product." }, { status: 400 });
  }

  const { client } = await getServerSupabase();
  if (!client) {
    return NextResponse.json({ error: "Wishlist is temporarily unavailable." }, { status: 503 });
  }

  const { data: product, error: productError } = await client
    .schema("storefront")
    .from("product_catalog_view")
    .select("id")
    .eq("id", productId)
    .maybeSingle();
  if (productError) {
    return NextResponse.json({ error: "Could not verify this product. Please try again." }, { status: 503 });
  }
  if (!product) {
    return NextResponse.json({ error: "This product is no longer available." }, { status: 404 });
  }

  const { error } = await client
    .schema("storefront")
    .from("storefront_customer_wishlist")
    .upsert(
      { user_id: auth.userId, product_id: productId },
      { onConflict: "user_id,product_id", ignoreDuplicates: true }
    );
  if (error) {
    return NextResponse.json({ error: "Could not save this product to your wishlist." }, { status: 503 });
  }

  return NextResponse.json({ productId }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  const auth = await requireCustomer(request);
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Wishlist details are invalid." }, { status: 400 });
  }
  const productId =
    typeof body === "object" && body !== null && "productId" in body && typeof body.productId === "string"
      ? body.productId
      : "";
  if (!UUID_PATTERN.test(productId)) {
    return NextResponse.json({ error: "Choose a valid product." }, { status: 400 });
  }

  const { client } = await getServerSupabase();
  if (!client) {
    return NextResponse.json({ error: "Wishlist is temporarily unavailable." }, { status: 503 });
  }

  const { error } = await client
    .schema("storefront")
    .from("storefront_customer_wishlist")
    .delete()
    .eq("user_id", auth.userId)
    .eq("product_id", productId);
  if (error) {
    return NextResponse.json({ error: "Could not remove this product from your wishlist." }, { status: 503 });
  }

  return NextResponse.json({ productId }, { headers: { "Cache-Control": "no-store" } });
}
