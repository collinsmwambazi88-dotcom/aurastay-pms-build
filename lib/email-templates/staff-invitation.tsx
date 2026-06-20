import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Column,
} from "@react-email/components"
import * as React from "react"

interface StaffInvitationEmailProps {
  staffName: string
  hotelName: string
  invitationLink: string
  role: string
}

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"

export const StaffInvitationEmail = ({
  staffName,
  hotelName,
  invitationLink,
  role,
}: StaffInvitationEmailProps) => {
  const ROLE_LABELS: Record<string, string> = {
    admin: "Administrator",
    manager: "Manager",
    front_desk: "Front Desk Staff",
    housekeeping: "Housekeeping",
    maintenance: "Maintenance",
    revenue_manager: "Revenue Manager",
    accounting: "Accounting",
  }
  const roleLabel = ROLE_LABELS[role] ?? "Staff Member"

  return (
    <Html lang="en">
      <Head>
        <style>{`
          body { margin: 0; padding: 0; min-width: 100% !important; }
          img { height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
          table { border-collapse: collapse; width: 100%; }
          .btn { border-radius: 6px; text-align: center; }
          .text-center { text-align: center; }
        `}</style>
      </Head>
      <Preview>You&apos;ve been invited to manage {hotelName} on AuraStay</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Branding */}
          <Section style={headerSection}>
            <Row>
              <Column style={{ padding: "32px 24px", textAlign: "center" }}>
                <Text style={logoText}>AuraStay</Text>
                <Text style={sectionSubtext}>Property Management Platform</Text>
              </Column>
            </Row>
          </Section>

          {/* Hero Banner */}
          <Section style={heroBanner}>
            <Row>
              <Column style={{ padding: "48px 24px", textAlign: "center" }}>
                <Text style={heroHeading}>You&apos;re Invited</Text>
                <Text style={heroSubheading}>to join {hotelName} on AuraStay</Text>
              </Column>
            </Row>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            {/* Personal greeting */}
            <Row>
              <Column style={columnStyle}>
                <Text style={greeting}>Hi {staffName},</Text>
                <Text style={bodyText}>
                  {hotelName}&apos;s management team has invited you to AuraStay, an advanced property management system designed for modern hospitality teams.
                </Text>
              </Column>
            </Row>

            {/* Spacer */}
            <Row>
              <Column style={{ height: "16px" }} />
            </Row>

            {/* Role & Access Info */}
            <Row>
              <Column style={columnStyle}>
                <Text style={labelText}>Your Role: <strong>{roleLabel}</strong></Text>
                <Text style={bodyText}>
                  {role === "admin" 
                    ? "You have full administrative access to all features including staff management, revenue analytics, and system settings."
                    : "You have access to Front Desk operations including guest check-ins, reservations, and room status management."}
                </Text>
              </Column>
            </Row>

            {/* Spacer */}
            <Row>
              <Column style={{ height: "32px" }} />
            </Row>

            {/* Primary CTA Button */}
            <Row>
              <Column align="center">
                <Button style={button} href={invitationLink}>
                  Set Up Account
                </Button>
              </Column>
            </Row>

            {/* Spacer */}
            <Row>
              <Column style={{ height: "40px" }} />
            </Row>

            {/* Features Cards */}
            <Row>
              <Column style={columnStyle}>
                <Text style={featureHeading}>What You Can Do</Text>
              </Column>
            </Row>

            <Row>
              <Column style={featureCard}>
                <Text style={featureIcon}>📅</Text>
                <Text style={featureTitle}>Reservations</Text>
                <Text style={featureDescription}>Manage bookings and guest check-ins with ease</Text>
              </Column>
              <Column style={featureCard}>
                <Text style={featureIcon}>🧹</Text>
                <Text style={featureTitle}>Housekeeping</Text>
                <Text style={featureDescription}>Track tasks and room status in real-time</Text>
              </Column>
            </Row>

            <Row>
              <Column style={featureCard}>
                <Text style={featureIcon}>💰</Text>
                <Text style={featureTitle}>Billing</Text>
                <Text style={featureDescription}>Generate invoices and track payments</Text>
              </Column>
              <Column style={featureCard}>
                <Text style={featureIcon}>📊</Text>
                <Text style={featureTitle}>Analytics</Text>
                <Text style={featureDescription}>View occupancy and revenue insights</Text>
              </Column>
            </Row>

            {/* Spacer */}
            <Row>
              <Column style={{ height: "24px" }} />
            </Row>

            {/* Link Version */}
            <Row>
              <Column style={columnStyle}>
                <Text style={helpText}>
                  Or copy and paste this link in your browser:
                </Text>
                <Link href={invitationLink} style={linkStyle}>
                  {invitationLink}
                </Link>
              </Column>
            </Row>

            {/* Spacer */}
            <Row>
              <Column style={{ height: "32px" }} />
            </Row>

            {/* Help Section */}
            <Row>
              <Column style={{ ...columnStyle, backgroundColor: "#f9fafb", padding: "20px 24px", borderRadius: "8px", marginTop: "24px" }}>
                <Text style={helpHeading}>Need Help?</Text>
                <Text style={helpText}>
                  If you have questions or need assistance, contact {hotelName}&apos;s management team or email our support team at{" "}
                  <Link href="mailto:support@auratstay.com" style={linkStyle}>support@auratstay.com</Link>
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Row>
              <Column style={{ textAlign: "center", padding: "32px 24px" }}>
                <Text style={footerText}>
                  © {new Date().getFullYear()} AuraStay. All rights reserved.
                </Text>
                <Text style={footerSubtext}>
                  This invitation is private. Do not share this email or link with others.
                </Text>
                <Row style={{ marginTop: "16px" }}>
                  <Column align="center">
                    <Link href="https://auratstay.com" style={footerLink}>Visit AuraStay</Link>
                    <Text style={{ display: "inline", margin: "0 8px", color: "#d1d5db" }}>•</Text>
                    <Link href="https://auratstay.com/privacy" style={footerLink}>Privacy Policy</Link>
                    <Text style={{ display: "inline", margin: "0 8px", color: "#d1d5db" }}>•</Text>
                    <Link href="https://auratstay.com/terms" style={footerLink}>Terms</Link>
                  </Column>
                </Row>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Plain text version - complements HTML for maximum compatibility
export const StaffInvitationPlainText = ({
  staffName,
  hotelName,
  invitationLink,
  role,
}: StaffInvitationEmailProps): string => {
  const ROLE_LABELS: Record<string, string> = {
    admin: "Administrator",
    manager: "Manager",
    front_desk: "Front Desk Staff",
    housekeeping: "Housekeeping",
    maintenance: "Maintenance",
    revenue_manager: "Revenue Manager",
    accounting: "Accounting",
  }
  const roleLabel = ROLE_LABELS[role] ?? "Staff Member"
  
  return `
═══════════════════════════════════════════════════════════════
  AURATSTAY - PROPERTY MANAGEMENT PLATFORM
═══════════════════════════════════════════════════════════════

YOU'RE INVITED

Hi ${staffName},

${hotelName}'s management team has invited you to AuraStay, an advanced property management system designed for modern hospitality teams.

YOUR ROLE: ${roleLabel}
${role === "admin" 
  ? "You have full administrative access to all features including staff management, revenue analytics, and system settings."
  : "You have access to Front Desk operations including guest check-ins, reservations, and room status management."}

SET UP YOUR ACCOUNT:
${invitationLink}

WHAT YOU CAN DO ON AURATSTAY:

📅 Reservations
   Manage bookings and guest check-ins with ease

🧹 Housekeeping
   Track tasks and room status in real-time

💰 Billing
   Generate invoices and track payments

📊 Analytics
   View occupancy and revenue insights

═══════════════════════════════════════════════════════════════

NEED HELP?

If you have questions or need assistance, contact ${hotelName}'s management team or email our support team at support@auratstay.com

IMPORTANT: This invitation is private. Do not share this email or link with others.

---
© ${new Date().getFullYear()} AuraStay. All rights reserved.
Visit: https://auratstay.com
Privacy: https://auratstay.com/privacy
Terms: https://auratstay.com/terms
  `.trim()
}

// Premium B2B Styles
const main = {
  backgroundColor: "#f3f4f6",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  margin: "0",
  padding: "0",
  WebkitFontSmoothing: "antialiased" as const,
  MozOsxFontSmoothing: "grayscale" as const,
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  marginTop: "20px",
  marginBottom: "20px",
  maxWidth: "600px",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
}

const headerSection = {
  backgroundColor: "#ffffff",
  borderBottom: "1px solid #e5e7eb",
  padding: "40px 0",
}

const logoText = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#4f46e5",
  margin: "0",
  letterSpacing: "-1px",
}

const sectionSubtext = {
  fontSize: "12px",
  fontWeight: "500",
  color: "#9ca3af",
  margin: "4px 0 0 0",
  letterSpacing: "0.5px",
  textTransform: "uppercase" as const,
}

const heroBanner = {
  backgroundColor: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  padding: "48px 32px",
  textAlign: "center" as const,
}

const heroHeading = {
  fontSize: "36px",
  fontWeight: "700",
  color: "#ffffff",
  margin: "0 0 8px 0",
  lineHeight: "1.2",
}

const heroSubheading = {
  fontSize: "18px",
  fontWeight: "400",
  color: "rgba(255,255,255,0.9)",
  margin: "0",
  lineHeight: "1.4",
}

const contentSection = {
  padding: "48px 40px",
}

const columnStyle = {
  padding: "0",
}

const greeting = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 12px 0",
  lineHeight: "1.4",
}

const labelText = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#6b7280",
  margin: "0 0 8px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
}

const bodyText = {
  fontSize: "15px",
  fontWeight: "400",
  color: "#4b5563",
  margin: "0 0 14px 0",
  lineHeight: "1.6",
}

const featureHeading = {
  fontSize: "14px",
  fontWeight: "700",
  color: "#111827",
  margin: "0 0 24px 0",
  lineHeight: "1.4",
}

const featureCard = {
  backgroundColor: "#f9fafb",
  padding: "20px",
  borderRadius: "6px",
  marginRight: "12px",
  marginBottom: "12px",
  textAlign: "center" as const,
}

const featureIcon = {
  fontSize: "32px",
  margin: "0 0 8px 0",
  lineHeight: "1",
}

const featureTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 4px 0",
  lineHeight: "1.3",
}

const featureDescription = {
  fontSize: "12px",
  fontWeight: "400",
  color: "#6b7280",
  margin: "0",
  lineHeight: "1.4",
}

const button = {
  backgroundColor: "#4f46e5",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "600",
  paddingTop: "14px",
  paddingBottom: "14px",
  paddingLeft: "32px",
  paddingRight: "32px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  border: "none",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
}

const helpHeading = {
  fontSize: "14px",
  fontWeight: "700",
  color: "#111827",
  margin: "0 0 8px 0",
}

const helpText = {
  fontSize: "13px",
  fontWeight: "400",
  color: "#4b5563",
  margin: "0",
  lineHeight: "1.6",
}

const linkStyle = {
  color: "#4f46e5",
  textDecoration: "underline",
  fontSize: "13px",
}

const footerSection = {
  backgroundColor: "#f9fafb",
  borderTop: "1px solid #e5e7eb",
}

const footerText = {
  fontSize: "12px",
  fontWeight: "400",
  color: "#6b7280",
  margin: "0 0 4px 0",
  lineHeight: "1.5",
}

const footerSubtext = {
  fontSize: "11px",
  fontWeight: "400",
  color: "#9ca3af",
  margin: "0",
  lineHeight: "1.5",
}

const footerLink = {
  color: "#6b7280",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: "500",
}
