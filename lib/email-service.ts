import { Resend } from "resend"
import { render } from "@react-email/render"
import {
  StaffInvitationEmail,
  StaffInvitationPlainText,
} from "@/lib/email-templates/staff-invitation"
import {
  GuestWelcomeEmail,
  GuestWelcomePlainText,
} from "@/lib/email-templates/guest-welcome"
import {
  GuestFarewellEmail,
  GuestFarewellPlainText,
} from "@/lib/email-templates/guest-farewell"

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
      // Use Resend sandbox for testing until custom domain is verified
      // For production: from: `${hotelName} via AuraStay <noreply@auratstay.com>`
      from: "AuraStay Onboarding <onboarding@resend.dev>",
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

export interface SendGuestWelcomeParams {
  to: string
  guestName: string
  hotelName: string
  checkInDate: string
  checkOutDate: string
  ratingLink: string
}

/**
 * Send a welcome email to guest upon check-in
 * Includes a link to rate their check-in experience
 */
export async function sendGuestWelcomeEmail({
  to,
  guestName,
  hotelName,
  checkInDate,
  checkOutDate,
  ratingLink,
}: SendGuestWelcomeParams): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("[email-service] RESEND_API_KEY not configured, skipping email send")
      return { success: true }
    }

    const html = await render(
      GuestWelcomeEmail({
        guestName,
        hotelName,
        checkInDate,
        checkOutDate,
        ratingLink,
      }),
      { pretty: true },
    )

    const text = GuestWelcomePlainText({
      guestName,
      hotelName,
      checkInDate,
      checkOutDate,
      ratingLink,
    })

    const result = await resend.emails.send({
      from: "AuraStay Onboarding <onboarding@resend.dev>",
      to,
      subject: `Welcome to ${hotelName}! Rate your check-in`,
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
    console.error("[email-service] Error sending welcome email:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

export interface SendGuestFarewellParams {
  to: string
  guestName: string
  hotelName: string
  checkOutDate: string
  ratingLink: string
}

/**
 * Send a farewell email to guest after check-out
 * Includes a link to rate their overall stay experience
 */
export async function sendGuestFarewellEmail({
  to,
  guestName,
  hotelName,
  checkOutDate,
  ratingLink,
}: SendGuestFarewellParams): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("[email-service] RESEND_API_KEY not configured, skipping email send")
      return { success: true }
    }

    const html = await render(
      GuestFarewellEmail({
        guestName,
        hotelName,
        checkOutDate,
        ratingLink,
      }),
      { pretty: true },
    )

    const text = GuestFarewellPlainText({
      guestName,
      hotelName,
      checkOutDate,
      ratingLink,
    })

    const result = await resend.emails.send({
      from: "AuraStay Onboarding <onboarding@resend.dev>",
      to,
      subject: `Thank you for staying at ${hotelName}! Share your feedback`,
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
    console.error("[email-service] Error sending farewell email:", errorMessage)
    return { success: false, error: errorMessage }
  }
}
