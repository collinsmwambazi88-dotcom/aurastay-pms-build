#!/usr/bin/env node

/**
 * Script to preview the staff invitation email template
 * Run with: node scripts/preview-email.mjs
 */

import { render } from '@react-email/render'
import React from 'react'

// Import the email template
import { StaffInvitationEmail, StaffInvitationPlainText } from '../lib/email-templates/staff-invitation.js'

const emailProps = {
  staffName: 'Sarah Johnson',
  hotelName: 'Grand Plaza Resort',
  invitationLink: 'https://auratstay.com/auth/login?email=sarah.johnson@grandplaza.com',
  role: 'admin',
}

console.log('\n=== PLAIN TEXT VERSION ===\n')
const plainText = StaffInvitationPlainText(emailProps)
console.log(plainText)

console.log('\n=== HTML VERSION ===\n')
const html = await render(React.createElement(StaffInvitationEmail, emailProps), { pretty: true })
console.log(html)

console.log('\n=== EMAIL PREVIEW COMPLETE ===\n')
console.log('To view the HTML email in a browser:')
console.log('1. Copy the HTML output above')
console.log('2. Save it as a .html file')
console.log('3. Open in your browser\n')
