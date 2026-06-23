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

interface GuestFarewellEmailProps {
  guestName: string
  hotelName: string
  checkOutDate: string
  ratingLink: string
}

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"

export const GuestFarewellEmail = ({
  guestName,
  hotelName,
  checkOutDate,
  ratingLink,
}: GuestFarewellEmailProps) => {
  return (
    <Html lang="en">
      <Head>
        <style>{`
          body { margin: 0; padding: 0; min-width: 100% !important; }
          img { height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
          table { border-collapse: collapse; width: 100%; }
        `}</style>
      </Head>
      <Preview>Thank you for staying at {hotelName}. We'd love your feedback!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Row>
              <Column style={{ padding: "32px 24px", textAlign: "center" }}>
                <Text style={logoText}>Innward</Text>
                <Text style={sectionSubtext}>Hotel Management</Text>
              </Column>
            </Row>
          </Section>

          {/* Hero */}
          <Section style={heroBanner}>
            <Row>
              <Column style={{ padding: "48px 32px", textAlign: "center" }}>
                <Text style={heroHeading}>Thank You, {guestName}!</Text>
                <Text style={heroSubheading}>We hope you enjoyed your stay at {hotelName}</Text>
              </Column>
            </Row>
          </Section>

          {/* Content */}
          <Section style={contentSection}>
            <Row>
              <Column style={columnStyle}>
                <Text style={greeting}>Safe travels!</Text>
                <Text style={bodyText}>
                  It was a pleasure having you at {hotelName}. We hope your stay was comfortable and that you'll consider visiting us again.
                </Text>
              </Column>
            </Row>

            <Row>
              <Column style={{ height: "24px" }} />
            </Row>

            {/* Rating CTA - Main Section */}
            <Row>
              <Column style={columnStyle}>
                <Text style={sectionHeading}>Share Your Experience</Text>
                <Text style={bodyText}>
                  Your feedback helps us continue to provide exceptional service. Please take a moment to share your thoughts about your stay. Our team truly values your input.
                </Text>
              </Column>
            </Row>

            <Row>
              <Column style={{ height: "20px" }} />
            </Row>

            <Row>
              <Column align="center">
                <Button style={button} href={ratingLink}>
                  Rate Your Stay
                </Button>
              </Column>
            </Row>

            <Row>
              <Column style={{ height: "32px" }} />
            </Row>

            {/* Benefits Section */}
            <Row>
              <Column style={benefitCard}>
                <Text style={benefitIcon}>⭐</Text>
                <Text style={benefitTitle}>Your Rating Matters</Text>
                <Text style={benefitText}>Help other guests find their perfect room</Text>
              </Column>
              <Column style={benefitCard}>
                <Text style={benefitIcon}>💝</Text>
                <Text style={benefitTitle}>We Listen</Text>
                <Text style={benefitText}>Your feedback drives our improvements</Text>
              </Column>
            </Row>

            <Row>
              <Column style={{ height: "24px" }} />
            </Row>

            {/* Coming Back Section */}
            <Row>
              <Column style={{ ...columnStyle, backgroundColor: "#f0f4ff", padding: "20px 24px", borderRadius: "8px", borderLeft: "4px solid #4f46e5" }}>
                <Text style={specialHeading}>Planning Your Next Visit?</Text>
                <Text style={helpText}>
                  We'd love to welcome you back! Check our website for special rates on your next stay.
                </Text>
              </Column>
            </Row>

            <Row>
              <Column style={{ height: "32px" }} />
            </Row>

            {/* Contact Section */}
            <Row>
              <Column style={{ ...columnStyle, backgroundColor: "#f9fafb", padding: "20px 24px", borderRadius: "8px" }}>
                <Text style={helpHeading}>Questions?</Text>
                <Text style={helpText}>
                  If you forgot something or have any questions, please reach out to us at{" "}
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
                  © {new Date().getFullYear()} Innward. All rights reserved.
                </Text>
                <Row style={{ marginTop: "16px" }}>
                  <Column align="center">
                    <Link href="https://auratstay.com" style={footerLink}>Visit Innward</Link>
                    <Text style={{ display: "inline", margin: "0 8px", color: "#d1d5db" }}>•</Text>
                    <Link href="https://auratstay.com/privacy" style={footerLink}>Privacy</Link>
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

// Plain text version
export const GuestFarewellPlainText = ({
  guestName,
  hotelName,
  checkOutDate,
  ratingLink,
}: GuestFarewellEmailProps): string => {
  return `
THANK YOU FOR STAYING AT ${hotelName}!

Hi ${guestName},

It was a pleasure having you at ${hotelName}. We hope your stay was comfortable and that you'll consider visiting us again.

SHARE YOUR EXPERIENCE

Your feedback helps us continue to provide exceptional service. Please take a moment to share your thoughts about your stay. Our team truly values your input.

Rate your stay: ${ratingLink}

WHY YOUR RATING MATTERS:
⭐ Your Rating Matters - Help other guests find their perfect room
💝 We Listen - Your feedback drives our improvements

PLANNING YOUR NEXT VISIT?

We'd love to welcome you back! Check our website for special rates on your next stay.

QUESTIONS?

If you forgot something or have any questions, please reach out to us at support@auratstay.com

---
© ${new Date().getFullYear()} Innward. All rights reserved.
Visit: https://auratstay.com
Privacy: https://auratstay.com/privacy
Terms: https://auratstay.com/terms
  `.trim()
}

// Styles
const main = {
  backgroundColor: "#f3f4f6",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  margin: "0",
  padding: "0",
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

const bodyText = {
  fontSize: "15px",
  fontWeight: "400",
  color: "#4b5563",
  margin: "0 0 14px 0",
  lineHeight: "1.6",
}

const sectionHeading = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#111827",
  margin: "0 0 12px 0",
  lineHeight: "1.3",
}

const benefitCard = {
  backgroundColor: "#f9fafb",
  padding: "16px",
  borderRadius: "6px",
  marginRight: "12px",
  marginBottom: "12px",
  textAlign: "center" as const,
}

const benefitIcon = {
  fontSize: "24px",
  margin: "0 0 8px 0",
  lineHeight: "1",
}

const benefitTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 4px 0",
  lineHeight: "1.3",
}

const benefitText = {
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
}

const specialHeading = {
  fontSize: "14px",
  fontWeight: "700",
  color: "#4f46e5",
  margin: "0 0 8px 0",
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

const footerLink = {
  color: "#6b7280",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: "500",
}
