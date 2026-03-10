import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendConfirmationEmail } from "@/lib/email";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const { email, password, name, autoConfirm } = await request.json();

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400 }
    );
  }

  // Create user without sending Supabase's default email
  const { data: userData, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: name },
      email_confirm: autoConfirm === true ? true : false, // we send the confirmation ourselves unless autoConfirm is true
    });

  if (createError) {
    if (createError.message.toLowerCase().includes("already registered")) {
      return NextResponse.json(
        { error: "Este email ya está registrado" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  // Generate confirmation link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data: linkData, error: linkError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        redirectTo: `${appUrl}/auth/callback`,
      },
    });

  if (linkError || !linkData?.properties?.action_link) {
    // User created but link generation failed — still a success, advise manual confirmation
    console.error("Link generation failed:", linkError?.message);
    return NextResponse.json({ success: true, emailSent: false });
  }

  // Send branded confirmation email via Resend
  const { error: emailError } = await sendConfirmationEmail(
    email,
    name,
    linkData.properties.action_link
  );

  if (emailError) {
    console.error("Resend email error:", emailError);
    // User exists, link generated — return success even if email failed
    return NextResponse.json({ success: true, emailSent: false });
  }

  return NextResponse.json({ success: true, emailSent: true });
}
