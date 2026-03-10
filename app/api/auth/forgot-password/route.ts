import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPasswordResetEmail } from "@/lib/email";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data: linkData, error: linkError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${appUrl}/auth/callback?next=/auth/reset-password`,
      },
    });

  if (linkError || !linkData?.properties?.action_link) {
    console.error("Recovery link error:", linkError?.message);
    // Return success anyway to avoid email enumeration
    return NextResponse.json({ success: true });
  }

  // Get user's name from metadata if available
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
    linkData.user.id
  );
  const name = (userData?.user?.user_metadata?.full_name as string) ?? "";

  await sendPasswordResetEmail(email, name, linkData.properties.action_link);

  return NextResponse.json({ success: true });
}
