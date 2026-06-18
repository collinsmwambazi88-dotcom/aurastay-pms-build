import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
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
  const roleLabel = role === "admin" ? "Administrator" : "Front Desk Staff"

  return (
    <Html>
      <Head />
      <Preview>You&apos;ve been invited to manage {hotelName} on AuraStay</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header Section */}
          <Section style={headerSection}>
            <Row>
              <Column style={logoColumn}>
                <Text style={logoText}>AuraStay</Text>
              </Column>
            </Row>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            {/* Welcome */}
            <Row>
              <Column style={columnStyle}>
                <Text style={heading}>Welcome to AuraStay, {staffName}!</Text>
                <Text style={subheading}>
                  You&apos;ve been invited to join {hotelName} as a {roleLabel}
                </Text>
              </Column>
            </Row>

            {/* Spacer */}
            <Row>
              <Column style={{ height: "16px" }} />
            </Row>

            {/* Message */}
            <Row>
              <Column style={columnStyle}>
                <Text style={bodyText}>
                  Your hotel management team has invited you to AuraStay, our premium property management system. 
                  You&apos;ll be able to manage reservations, staff schedules, room inventory, and more—all from one intuitive dashboard.
                </Text>
                <Text style={bodyText}>
                  As a <strong>{roleLabel}</strong>, you have {role === "admin" ? "full administrative access" : "curated access to Front Desk operations"} tailored to your role.
                </Text>
              </Column>
            </Row>

            {/* Spacer */}
            <Row>
              <Column style={{ height: "24px" }} />
            </Row>

            {/* CTA Button */}
            <Row>
              <Column align="center">
                <Button style={button} href={invitationLink}>
                  Set Up Account
                </Button>
              </Column>
            </Row>

            {/* Spacer */}
            <Row>
              <Column style={{ height: "32px" }} />
            </Row>

            {/* Features Section */}
            <Row>
              <Column style={columnStyle}>
                <Text style={featureHeading}>What you can do on AuraStay:</Text>
              </Column>
            </Row>

            <Row>
              <Column style={{ ...columnStyle, paddingLeft: "24px" }}>
                <Text style={featureBullet}>• Manage guest reservations and check-ins</Text>
                <Text style={featureBullet}>• Track housekeeping tasks and room status</Text>
                <Text style={featureBullet}>• Generate invoices and manage billing</Text>
                <Text style={featureBullet}>• Access real-time occupancy analytics</Text>
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

            {/* Support */}
            <Row>
              <Column style={columnStyle}>
                <Text style={supportText}>
                  Questions? Contact your hotel management team or reach out to our support team.
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Row>
              <Column align="center">
                <Text style={footerText}>
                  © {new Date().getFullYear()} AuraStay. All rights reserved.
                </Text>
                <Text style={footerSubtext}>
                  This is a private invitation. Do not share this email or link with others.
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Plain text version
export const StaffInvitationPlainText = ({
  staffName,
  hotelName,
  invitationLink,
  role,
}: StaffInvitationEmailProps): string => {
  const roleLabel = role === "admin" ? "Administrator" : "Front Desk Staff"
  
  return `
Welcome to AuraStay, ${staffName}!

You've been invited to join ${hotelName} as a ${roleLabel}.

Your hotel management team has invited you to AuraStay, our premium property management system. You'll be able to manage reservations, staff schedules, room inventory, and more—all from one intuitive dashboard.

As a ${roleLabel}, you have ${role === "admin" ? "full administrative access" : "curated access to Front Desk operations"} tailored to your role.

SET UP ACCOUNT:
${invitationLink}

WHAT YOU CAN DO ON AURASSTAY:
• Manage guest reservations and check-ins
• Track housekeeping tasks and room status
• Generate invoices and manage billing
• Access real-time occupancy analytics

Questions? Contact your hotel management team or reach out to our support team.

---
© ${new Date().getFullYear()} AuraStay. All rights reserved.
This is a private invitation. Do not share this email or link with others.
  `.trim()
}

// Styles
const main = {
  backgroundColor: "#f9fafb",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0",
  marginBottom: "64px",
}

const headerSection = {
  backgroundColor: "#f3f4f6",
  borderBottom: "1px solid #e5e7eb",
  padding: "32px 0",
}

const logoColumn = {
  padding: "0 24px",
}

const logoText = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#4f46e5",
  margin: "0",
  letterSpacing: "-0.5px",
}

const contentSection = {
  padding: "48px 24px",
}

const columnStyle = {
  padding: "0",
}

const heading = {
  fontSize: "28px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 8px 0",
  lineHeight: "1.3",
}

const subheading = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#6b7280",
  margin: "0",
  lineHeight: "1.5",
}

const bodyText = {
  fontSize: "14px",
  fontWeight: "400",
  color: "#374151",
  margin: "0 0 12px 0",
  lineHeight: "1.6",
}

const featureHeading = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 12px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
}

const featureBullet = {
  fontSize: "13px",
  fontWeight: "400",
  color: "#4b5563",
  margin: "4px 0",
  lineHeight: "1.6",
}

const button = {
  backgroundColor: "#4f46e5",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "600",
  paddingTop: "12px",
  paddingBottom: "12px",
  paddingLeft: "24px",
  paddingRight: "24px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  maxWidth: "200px",
}

const helpText = {
  fontSize: "12px",
  fontWeight: "400",
  color: "#6b7280",
  margin: "0 0 6px 0",
  lineHeight: "1.5",
}

const linkStyle = {
  color: "#4f46e5",
  textDecoration: "underline",
  fontSize: "12px",
  wordBreak: "break-all" as const,
}

const supportText = {
  fontSize: "12px",
  fontWeight: "400",
  color: "#9ca3af",
  margin: "0",
  lineHeight: "1.5",
  fontStyle: "italic" as const,
}

const footerSection = {
  backgroundColor: "#f3f4f6",
  borderTop: "1px solid #e5e7eb",
  padding: "32px 24px",
}

const footerText = {
  fontSize: "11px",
  fontWeight: "400",
  color: "#9ca3af",
  margin: "0 0 4px 0",
  textAlign: "center" as const,
}

const footerSubtext = {
  fontSize: "10px",
  fontWeight: "400",
  color: "#d1d5db",
  margin: "0",
  textAlign: "center" as const,
}
