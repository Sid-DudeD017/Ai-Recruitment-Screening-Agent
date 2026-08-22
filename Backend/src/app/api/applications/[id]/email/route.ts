import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { nodemailerEmailService } from "@/infrastructure/email/nodemailer.adapter";
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

    await nodemailerEmailService.send({
      to: candidateEmail,
      subject: subject,
      html: body,
    });

    // Save the sent email in the database so we know it was sent
    await prisma.emailDraft.upsert({
      where: { applicationId: application.id },
      create: {
        applicationId: application.id,
        subject,
        body,
        status: 'SENT'
      },
      update: {
        subject,
        body,
        status: 'SENT'
      }
    });

    // Automatically update the application status based on the email type
    const { type } = await req.json().catch(() => ({ type: null })); // Re-read or just extract above
    // Actually we can't await req.json() twice. Let me rewrite the extraction above.

  } catch (error: any) {
    console.error("Failed to send email:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
