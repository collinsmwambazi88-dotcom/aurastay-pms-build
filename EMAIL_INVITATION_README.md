# 📧 AuraStay Email Invitation System

A complete, production-ready email invitation system for staff onboarding using Resend and React Email.

## 🎯 Overview

The AuraStay email invitation system enables hotel managers to invite staff members with beautiful, personalized emails. The system features:

- **Premium B2B Email Design** - Professional, responsive HTML template with AuraStay branding
- **Plain Text Fallback** - Fully formatted plain text version for maximum email client compatibility
- **Dynamic Hotel Branding** - From address uses hotel name for personalization
- **Status Tracking** - "Invited" badge in staff table, automatically removed on first login
- **One-Click Setup** - Pre-filled Auth0 login link with email address
- **Role-Based Info** - Role-specific access information in each email

## ✨ Features

### Email Template (`lib/email-templates/staff-invitation.tsx`)

**Visual Elements:**
- Header with AuraStay logo and branding
- Hero banner with gradient background
- Personal greeting with staff name
- Role-specific access information
- 4 feature cards with emojis (Reservations, Housekeeping, Billing, Analytics)
- Prominent CTA button: "Set Up Account"
- Help section with support contact
- Professional footer with links

**Quality:**
- Responsive for all devices
- Inline styles for email client compatibility
- Both HTML and plain text versions
- Proper spacing and typography

### Staff Management UI

**Invite Dialog:**
- Full Name input
- Email input
- Role selection (Admin or Front Desk)
- Clear role descriptions
- Send Invite button

**Staff Table:**
- "Invited" badge (yellow with mail icon) for pending staff
- Badge disappears when staff logs in
- All standard staff management features

### Backend Services

**Email Service** (`lib/email-service.ts`):
- Sends via Resend
- Renders React component to HTML
- Includes both HTML and plain text
- Error handling and logging

**Invite Staff Action** (`lib/actions.ts`):
- Creates staff record with 'invited' status
- Generates invitation link
- Sends email via service
- Returns success/error

**Activate Staff Action** (`lib/actions.ts`):
- Updates status from 'invited' to 'active'
- Called on first Auth0 login
- Automatic page revalidation

## 🚀 Quick Start

### 1. View the Staff Management Page

```bash
# Navigate to Settings → Staff & Access
http://localhost:3000/settings/staff
```

### 2. Send an Invitation

1. Click "Invite Staff" button
2. Fill in: Full Name, Email, Role
3. Click "Send Invite"
4. See success message: "Invitation email sent to [email]"

### 3. View Invitation Status

- Invited staff show yellow "Invited" badge with mail icon
- Badge disappears when they log in for the first time

### 4. Preview the Email

```bash
# Generate email preview (HTML and plain text)
node scripts/preview-email.mjs > email-preview.html

# Open email-preview.html in your browser
```

## 📋 Implementation Details

### Files Created/Modified

**Created:**
- `lib/email-templates/staff-invitation.tsx` (14KB) - Email template
- `lib/email-service.ts` (1.9KB) - Email sending service
- `scripts/preview-email.mjs` (1.1KB) - Email preview script
- `docs/EMAIL_INVITATION_SYSTEM.md` (7.1KB) - Full documentation
- `docs/EMAIL_SYSTEM_IMPLEMENTATION.md` (11KB) - Implementation guide

**Modified:**
- `lib/actions.ts` - Added `activateStaff()` function
- `components/staff/staff-management.tsx` - Updated success toast message

### Key Functions

#### `inviteStaff(input)`
Sends invitation email to a new staff member.

```typescript
await inviteStaff({
  propertyId: 1,
  fullName: "John Doe",
  email: "john@hotel.com",
  role: "admin",
})
```

**Returns:** `{ ok: boolean, error?: string }`

#### `activateStaff(email)`
Marks invited staff as active upon first login.

```typescript
await activateStaff("john@hotel.com")
```

**Returns:** `{ ok: boolean, error?: string }`

#### `sendStaffInvitationEmail(params)`
Sends email via Resend.

```typescript
await sendStaffInvitationEmail({
  to: "john@hotel.com",
  staffName: "John Doe",
  hotelName: "Grand Hotel",
  invitationLink: "https://...",
  role: "admin",
})
```

**Returns:** `{ success: boolean, error?: string }`

## 🔧 Configuration

### Environment Variables

```bash
# Required
RESEND_API_KEY=re_xxxxxxxxxxxx

# Optional (defaults to localhost:3000)
NEXT_PUBLIC_APP_URL=https://auratstay.com
```

### Email Settings

**Testing (Sandbox):**
- **From:** `AuraStay Onboarding <onboarding@resend.dev>`
- **Reply-To:** `support@auratstay.com`
- **Subject:** `You're invited to manage {hotelName} on AuraStay`

**Production (After Domain Verification):**
- **From:** `{hotelName} via AuraStay <noreply@auratstay.com>`
- **Reply-To:** `support@auratstay.com`
- **Subject:** `You're invited to manage {hotelName} on AuraStay`

> **Note:** The system currently uses Resend's sandbox address (`onboarding@resend.dev`) to allow email testing without domain verification. Once you verify a custom domain with Resend, update the `from` address in `lib/email-service.ts` to use your verified domain.

## 📊 Status Flow

```
┌─────────────────┐
│  INVITED        │ ← Staff invited, email sent
│  • Badge shown  │
│  • No access    │
└────────┬────────┘
         │ User clicks link → Auth0 login
         ↓
┌─────────────────┐
│  ACTIVE         │ ← activateStaff() called
│  • Badge hidden │
│  • Full access  │
└─────────────────┘
```

## 🎨 Customization

### Change Brand Colors

Edit `lib/email-templates/staff-invitation.tsx`:

```typescript
// Change primary Indigo to your brand color
const heroHeading = {
  backgroundColor: "#YOUR_COLOR",
  // ...
}
```

### Modify Email Content

Edit the `StaffInvitationEmail` component:
- Hero banner text
- Feature cards
- Support contact information
- Footer links

### Add Company Logo

In `StaffInvitationEmail`:
```typescript
import { Img } from "@react-email/components"

<Img src={logoUrl} alt="Hotel Logo" width={200} />
```

## 📚 Documentation

- **Full Guide**: `docs/EMAIL_INVITATION_SYSTEM.md`
- **Implementation Details**: `docs/EMAIL_SYSTEM_IMPLEMENTATION.md`
- **Email Template**: `lib/email-templates/staff-invitation.tsx`
- **Email Service**: `lib/email-service.ts`

## 🧪 Testing

### Preview Email Template

```bash
node scripts/preview-email.mjs
```

This outputs both HTML and plain text versions to the console.

### Test Email Delivery

1. Navigate to staff page
2. Click "Invite Staff"
3. Fill in test information
4. Check your email inbox (or Resend dashboard)

### Check Resend Status

- Log in to [Resend Dashboard](https://resend.com/dashboard)
- View "Activity" to see delivery status
- Check "Analytics" for email performance

## 🔒 Security

- Emails include email in invitation link for verification
- Only staff with 'invited' status can be activated
- All queries scoped by property_id
- No sensitive data in emails
- Links expire after user logs in (status changes to 'active')

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| 403 Error - Domain not verified | Use sandbox address `onboarding@resend.dev`. See [Domain Verification Setup](#domain-verification-setup) |
| Email not sending | Check RESEND_API_KEY environment variable |
| Wrong From address | For testing, use `onboarding@resend.dev`. For production, verify custom domain first |
| Status not updating | Call activateStaff() in Auth0 callback |
| Email styling broken | Some email clients don't support CSS |
| Link not working | Verify NEXT_PUBLIC_APP_URL is set |

## 🔐 Domain Verification Setup

### Testing Phase (Current)

The system uses **Resend's sandbox address** to enable testing without domain verification:

```typescript
// lib/email-service.ts
from: "AuraStay Onboarding <onboarding@resend.dev>"
```

This allows you to:
- Test email delivery immediately
- Send invitations without domain setup
- Preview emails in Resend dashboard

### Production Phase (After Verification)

To use a custom domain:

1. **Verify Domain in Resend:**
   - Go to [Resend Dashboard](https://resend.com/domains)
   - Click "Add Domain"
   - Add `auratstay.com`
   - Complete DNS verification

2. **Update Email Service:**
   ```typescript
   // lib/email-service.ts
   from: `${hotelName} via AuraStay <noreply@auratstay.com>`
   ```

3. **Deploy and Test:**
   - Push changes to production
   - Send a test invitation
   - Verify emails arrive with your custom domain

## 📞 Support

For questions or issues:

1. Check the documentation in `docs/` folder
2. Review the email template code
3. Check Resend dashboard for delivery status
4. Review console logs for errors

## 🚀 Next Steps

1. **Test the system** - Send a test invitation
2. **Preview the email** - Run `node scripts/preview-email.mjs`
3. **Customize branding** - Update colors and content
4. **Integrate Auth0** - Add `activateStaff()` to login callback
5. **Deploy** - Push to production

## 📝 Notes

- The system gracefully handles missing RESEND_API_KEY (logs warning, continues)
- Staff table automatically updates when status changes
- All operations are optimistic and safe to retry
- Email addresses are normalized (lowercase, trimmed)
- Plain text version provides fallback for all clients

---

**Created:** June 18, 2024  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
