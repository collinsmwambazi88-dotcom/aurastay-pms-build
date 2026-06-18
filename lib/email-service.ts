import { Resend } from "resend"
import { render } from "@react-email/render"
import {
  StaffInvitationEmail,
  StaffInvitationPlainText,
} from "@/lib/email-templates/staff-invitation"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendStaffInvitationParams {
  to: string
  staffName: string
  hotelName: string
  invitationLink: string
  role: "admin" | "front_desk"
}

/**
 * Send a staff invitation email using Resend
 * Includes both HTML and plain text versions for maximum compatibility
 */
export async function sendStaffInvitationEmail({
  to,
  staffName,
  hotelName,
  invitationLink,
  role,
}: SendStaffInvitationParams): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("[email-service] RESEND_API_KEY not configured, skipping email send")
      return { success: true } // Return success for development without Resend key
    }

    // Generate HTML version
    const html = await render(
      StaffInvitationEmail({
        staffName,
        hotelName,
        invitationLink,
        role,
      }),
      { pretty: true },
    )

    // Generate plain text version
    const text = StaffInvitationPlainText({
      staffName,
      hotelName,
      invitationLink,
      role,
    })

    const result = await resend.emails.send({
      from: `${hotelName} via AuraStay <noreply@auratstay.com>`,
      to,
      subject: `You're invited to manage ${hotelName} on AuraStay`,
      html,
      text,
      replyTo: "support@auratstay.com",
    })

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    console.error("[email-service] Error sending invitation email:", errorMessage)
    return { success: false, error: errorMessage }
  }
}
