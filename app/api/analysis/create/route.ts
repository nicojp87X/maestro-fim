import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { runAnalysisPipeline } from "@/lib/analysis/pipeline";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/webp",
  "application/pdf",
];
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check active subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, plan")
    .eq("user_id", user.id)
    .single();

  if (!subscription || subscription.status !== "active") {
    return NextResponse.json(
      { error: "Active subscription required" },
      { status: 403 }
    );
  }

  // Free plan: only 1 analysis allowed
  if (subscription.plan === "free") {
    const { count } = await supabase
      .from("analysis_jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed");

    if ((count ?? 0) >= 1) {
      return NextResponse.json(
        { error: "upgrade_required" },
        { status: 403 }
      );
    }
  }

  // Parse multipart form
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed. Use PDF, JPG, PNG or WEBP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum 20MB." },
      { status: 400 }
    );
  }

  // Upload to Supabase Storage
  const fileExt = file.name.split(".").pop() ?? "bin";
  const jobId = crypto.randomUUID();
  const storagePath = `${user.id}/${jobId}/${file.name}`;

  const fileBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabaseAdmin.storage
    .from("analytics")
    .upload(storagePath, fileBuffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Create analysis job
  const inputType = file.type === "application/pdf" ? "pdf" : "image";

  const { data: job, error: jobError } = await supabaseAdmin
    .from("analysis_jobs")
    .insert({
      id: jobId,
      user_id: user.id,
      status: "pending",
      input_type: inputType,
      storage_path: storagePath,
      original_filename: file.name,
      file_size_bytes: file.size,
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Failed to create analysis job" },
      { status: 500 }
    );
  }

  // Run pipeline asynchronously (fire and forget)
  runAnalysisPipeline(job.id, user.id, storagePath, inputType).catch(
    (err) => console.error("Pipeline launch error:", err)
  );

  return NextResponse.json({ jobId: job.id });
}
