import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: job, error } = await supabase
    .from("analysis_jobs")
    .select("id, status, error_message, created_at, completed_at")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // If completed, fetch the report ID
  let reportId: string | null = null;
  if (job.status === "completed") {
    const { data: report } = await supabase
      .from("fim_reports")
      .select("id")
      .eq("job_id", jobId)
      .single();
    reportId = report?.id ?? null;
  }

  const progressMap: Record<string, number> = {
    pending: 5,
    extracting: 25,
    analyzing: 60,
    generating: 85,
    completed: 100,
    failed: 0,
  };

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    progress: progressMap[job.status] ?? 0,
    errorMessage: job.error_message,
    reportId,
  });
}
