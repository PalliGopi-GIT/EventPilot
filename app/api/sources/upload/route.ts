import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, recordAuditLog } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rateLimit";
import { sanitizeSafeText } from "@/lib/security/sanitize";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const rate = rateLimit(`upload_${user.id}`, 20, 60000);
    if (!rate.success) {
      return NextResponse.json({ error: "Rate limit exceeded. Please wait." }, { status: 429 });
    }

    const contentType = req.headers.get("content-type") || "";

    let fileName = "pasted_event_text.txt";
    let fileType = "text/plain";
    let fileSize = 0;
    let rawContent = "";
    let extractedText = "";
    let sourceType = "raw_text";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const textInput = (formData.get("text") as string) || "";

      if (!file && !textInput) {
        return NextResponse.json(
          { error: "Please upload a valid file (Image, PDF, PPT) or enter event text." },
          { status: 400 }
        );
      }

      if (file) {
        fileName = file.name;
        fileType = file.type || "application/octet-stream";
        fileSize = file.size;

        if (fileSize > 15 * 1024 * 1024) {
          return NextResponse.json(
            { error: "File size exceeds 15MB limit." },
            { status: 400 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (fileType.startsWith("image/")) {
          sourceType = "event_poster";
          rawContent = buffer.toString("base64");
        } else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
          sourceType = "document";
          try {
            // Attempt PDF text extraction
            const pdfParse = require("pdf-parse");
            const parsed = await pdfParse(buffer);
            extractedText = parsed.text || "";
          } catch (pdfErr) {
            console.warn("PDF text parse fallback:", pdfErr);
            extractedText = "";
          }
          rawContent = buffer.toString("base64");
        } else if (
          fileType.includes("presentation") ||
          fileName.endsWith(".ppt") ||
          fileName.endsWith(".pptx")
        ) {
          sourceType = "schedule";
          rawContent = buffer.toString("base64");
        } else {
          // Plain text / markdown
          sourceType = "raw_text";
          extractedText = buffer.toString("utf-8");
          rawContent = extractedText;
        }
      }

      if (textInput) {
        extractedText = (extractedText ? extractedText + "\n\n" : "") + textInput;
        if (!rawContent) {
          rawContent = textInput;
          fileSize = Buffer.byteLength(textInput);
        }
      }
    } else {
      // JSON payload
      const body = await req.json();
      fileName = body.fileName || "event_source.txt";
      fileType = body.fileType || "text/plain";
      rawContent = body.rawContent || body.text || "";
      extractedText = body.extractedText || body.text || "";
      fileSize = body.fileSize || Buffer.byteLength(rawContent);
      sourceType = body.sourceType || "raw_text";
    }

    // Save Source record in database
    const source = await prisma.source.create({
      data: {
        userId: user.id,
        fileName: sanitizeSafeText(fileName, 255),
        fileType,
        fileSize,
        rawContent: rawContent.length > 500000 ? rawContent.slice(0, 500000) : rawContent,
        extractedText: sanitizeSafeText(extractedText, 50000),
        sourceType,
        status: "PENDING",
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "SOURCE_UPLOAD",
      resourceType: "source",
      resourceId: source.id,
      details: { fileName, fileType, fileSize },
    });

    return NextResponse.json({
      success: true,
      source: {
        id: source.id,
        fileName: source.fileName,
        fileType: source.fileType,
        fileSize: source.fileSize,
        sourceType: source.sourceType,
        hasText: !!extractedText,
        hasImage: fileType.startsWith("image/"),
        createdAt: source.createdAt,
      },
    });
  } catch (err: any) {
    console.error("Source upload error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process source upload" },
      { status: 500 }
    );
  }
}
