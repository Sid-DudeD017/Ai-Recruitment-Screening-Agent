import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { resendEmailService } from "@/infrastructure/email/resend.adapter";
import { prisma } from "@/infrastructure/database/prisma.client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { subject, body } = await req.json();

    if (!subject || !body) {
      return NextResponse.json(
        { success: false, error: "Subject and body are required." },
        { status: 400 }
      );
    }

    const resolvedParams = await params;
    const application = await prisma.application.findUnique({
      where: { id: resolvedParams.id },
      include: { candidate: true },
    });

    if (!application || !application.candidate || !application.candidate.email) {
      return NextResponse.json(
        { success: false, error: "Application or candidate email not found." },
        { status: 404 }
      );
    }

    const candidateEmail = application.candidate.email;

    await resendEmailService.send({
      to: "vanshtibrewal2005@gmail.com", // Overridden for Resend free tier
      subject: subject,
      html: body,
    });

    return NextResponse.json({ success: true, message: "Email sent successfully." });
  } catch (error: any) {
    console.error("Failed to send email:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
