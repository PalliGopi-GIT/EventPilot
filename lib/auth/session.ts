import { prisma } from "../db/prisma";
import { cookies } from "next/headers";

const DEFAULT_USER_ID = "usr_pilot_main";
const DEFAULT_USER_EMAIL = "organizer@eventpilot.ai";

/**
 * Gets or creates the current active user.
 * In a hackathon / demo context, provides a persistent active user session
 * linked to their GoogleConnection when they authenticate via Google OAuth.
 */
export async function getCurrentUser() {
  let userId = DEFAULT_USER_ID;

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("eventpilot_user_id");
    if (sessionCookie?.value) {
      userId = sessionCookie.value;
    }
  } catch {
    // Context where cookies() might not be available
  }

  // Ensure user exists in database
  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      googleConnection: true,
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        email: DEFAULT_USER_EMAIL,
        name: "Event Organizer",
      },
      include: {
        googleConnection: true,
      },
    });
  }

  return user;
}

/**
 * Audit log helper
 */
export async function recordAuditLog(options: {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        resourceType: options.resourceType,
        resourceId: options.resourceId,
        detailsJson: options.details ? JSON.stringify(options.details) : null,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    });
  } catch (err) {
    console.error("Audit log write error:", err);
  }
}
