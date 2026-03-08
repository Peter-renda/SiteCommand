import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await getSession();
  const isSystemAdmin = session?.role === "admin";
  const isCompanyAdmin = session?.company_role === "admin" && !!session?.company_id;

  if (!session || (!isSystemAdmin && !isCompanyAdmin)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  let query = supabase
    .from("company_lessons")
    .select("id, company_id, filename, uploaded_by_name, uploaded_at, row_count, columns")
    .order("uploaded_at", { ascending: false });

  // Company admins only see their own company's lessons
  if (isCompanyAdmin) {
    query = query.eq("company_id", session.company_id!);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    lessons: data || [],
    myCompanyId: session.company_id ?? null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const isSystemAdmin = session?.role === "admin";
  const isCompanyAdmin = session?.company_role === "admin" && !!session?.company_id;

  if (!session || (!isSystemAdmin && !isCompanyAdmin)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  // Company admins always upload to their own company; system admin picks one
  const companyId = isCompanyAdmin
    ? session.company_id!
    : (formData.get("company_id") as string | null);

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!companyId) return NextResponse.json({ error: "No company selected" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
    return NextResponse.json({ error: "Only .xlsx, .xls, or .csv files are accepted." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (rawRows.length === 0) {
    return NextResponse.json({ error: "The file appears to be empty." }, { status: 400 });
  }

  const columns = Object.keys(rawRows[0]);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("company_lessons")
    .insert({
      company_id: companyId,
      filename: file.name,
      uploaded_by_name: session.username,
      row_count: rawRows.length,
      columns,
      rows: rawRows,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, row_count: rawRows.length });
}
