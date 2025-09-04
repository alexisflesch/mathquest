# Email Verification Feature - Testing Guide

## 📋 Overview

This guide covers how to test the new email verification feature that requires users to verify their email address after registration (both students and teachers).

## 🔧 Environment Setup

### Required Environment Variables

Add these variables to your `.env` files:

#### Backend `.env` file (`/backend/.env`):
```env
# Brevo (SendinBlue) Email Service Configuration
BREVO_API_KEY=your_brevo_api_key_here

# Email Templates (French)
BREVO_VERIFICATION_TEMPLATE_ID=1  # Your verification email template ID
BREVO_PASSWORD_RESET_TEMPLATE_ID=2  # Your password reset email template ID  
BREVO_WELCOME_TEMPLATE_ID=3  # Your welcome email template ID

# Application URLs
FRONTEND_URL=http://localhost:3000  # Used for verification links
```

#### Frontend `.env.local` file (`/frontend/.env.local`):
```env
# No additional variables needed for email verification
# The frontend uses the existing API endpoints
```

### Getting Brevo API Key

1. Go to [Brevo (SendinBlue)](https://www.brevo.com/)
2. Create an account or log in
3. Navigate to: Account → SMTP & API → API Keys
4. Generate a new API key
5. Copy the key to your `BREVO_API_KEY` environment variable

### Setting Up Email Templates

You need to create 3 email templates in Brevo:

#### 1. Email Verification Template
- **Subject**: `Vérifiez votre email - MathQuest`
- **Content**: 
```html
<h2>Vérification de votre compte MathQuest</h2>
<p>Bonjour {{params.username}},</p>
<p>Cliquez sur le lien ci-dessous pour vérifier votre compte :</p>
<a href="{{params.verificationUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Vérifier mon compte</a>
<p>Ce lien expire dans 24 heures.</p>
<p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
```

#### 2. Password Reset Template  
- **Subject**: `Réinitialisation de mot de passe - MathQuest`
- **Content**:
```html
<h2>Réinitialisation de votre mot de passe</h2>
<p>Bonjour {{params.username}},</p>
<p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
<a href="{{params.resetUrl}}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a>
<p>Ce lien expire dans 1 heure.</p>
<p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
```

#### 3. Welcome Template
- **Subject**: `Bienvenue sur MathQuest !`
- **Content**:
```html
<h2>Bienvenue sur MathQuest !</h2>
<p>Bonjour {{params.username}},</p>
<p>Votre compte a été vérifié avec succès ! Vous pouvez maintenant profiter de toutes les fonctionnalités de MathQuest.</p>
<p>Amusez-vous bien !</p>
```

## 🗄️ Database Setup

### Run Database Migration

The email verification feature requires additional database fields:

```bash
cd /home/aflesch/mathquest/app/backend
npx prisma migrate dev --name email-verification
```

### Grandfather Existing Users (Optional)

If you have existing users in your database, you can mark them as verified:

```bash
cd /home/aflesch/mathquest/app/backend
npx ts-node scripts/grandfather-email-verification.ts
```

## 🚀 Testing Steps

### 1. Start the Application

```bash
# Terminal 1 - Backend
cd /home/aflesch/mathquest/app/backend
npm run dev

# Terminal 2 - Frontend  
cd /home/aflesch/mathquest/app/frontend
npm run dev
```

### 2. Test Student Registration Flow

1. Navigate to: `http://localhost:3000/login`
2. Click the **"Compte"** tab
3. Switch to **"Créer un compte"** mode
4. Fill out the registration form:
   - **Email**: Use a real email address you can access
   - **Password**: At least 6 characters
   - **Pseudo**: Any username
   - **Avatar**: Select any avatar
   - **Leave "Compte enseignant" unchecked**
5. Click **"Créer le compte"**

**Expected Result**: 
- ✅ French email verification modal appears
- ✅ Modal shows: "Vérification de votre email"
- ✅ User's email address is displayed
- ✅ French instructions with emojis are shown

### 3. Test Teacher Registration Flow

1. Follow steps 1-4 above, but:
   - **Check "Compte enseignant"**
   - **Enter admin password** (if configured)
5. Click **"Créer le compte"**

**Expected Result**:
- ✅ Same email verification modal appears (no special treatment)

### 4. Test Modal Functionality

In the email verification modal:

1. **Test "Renvoyer l'email" button:**
   - Click the button
   - Should show "Envoi en cours..." loading state
   - Should show success message: "Email de vérification renvoyé avec succès !"
   - Check that a new email was sent

2. **Test "J'ai compris" button:**
   - Click the button
   - Modal should close
   - Should redirect to the intended page

### 5. Test Email Verification Process

1. **Check your email inbox** (including spam folder)
2. **Open the verification email**
3. **Click the verification link**

**Expected Result**:
- ✅ Redirects to login page
- ✅ Shows success message
- ✅ User can now log in normally

### 6. Test Login After Verification

1. Go to login page
2. Enter the verified user's credentials
3. Click "Se connecter"

**Expected Result**:
- ✅ Login succeeds
- ✅ User is redirected to dashboard/home

### 7. Test Login Before Verification

1. Try to login with unverified account credentials

**Expected Result**:
- ❌ Login fails with appropriate error message

## 🧪 Additional Tests

### Test Resend Email API Endpoint

```bash
curl -X POST http://localhost:8000/api/v1/auth/resend-email-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Test Email Verification API Endpoint

```bash
# This URL would come from the email link
curl "http://localhost:8000/api/v1/auth/verify-email?token=your_verification_token"
```

### Run Backend Tests

```bash
cd /home/aflesch/mathquest/app/backend
npm test -- --testNamePattern="email"
```

**Expected**: All email-related tests should pass (22 tests total)

## 🐛 Troubleshooting

### Common Issues

1. **"Brevo API Key not configured"**
   - Check that `BREVO_API_KEY` is set in backend `.env`
   - Verify the API key is valid

2. **"Template not found"**
   - Check that template IDs are correct in `.env`
   - Verify templates exist in your Brevo account

3. **Emails not sending**
   - Check Brevo account limits
   - Verify sender email is configured in Brevo
   - Check email logs in Brevo dashboard

4. **Verification link doesn't work**
   - Check that `FRONTEND_URL` is correct in backend `.env`
   - Verify the link format in email template

5. **Modal doesn't appear**
   - Check browser console for JavaScript errors
   - Verify frontend is running on correct port

### Debug Commands

```bash
# Check backend logs
cd /home/aflesch/mathquest/app/backend
npm run dev | grep -i email

# Test Brevo connection
cd /home/aflesch/mathquest/app/backend
npx ts-node -e "
import { EmailService } from './src/core/services/emailService';
const service = new EmailService();
console.log('Testing Brevo connection...');
"
```

## ✅ Success Criteria

The feature is working correctly when:

- ✅ Both student and teacher registrations show the French email verification modal
- ✅ Verification emails are sent and received
- ✅ Verification links work and redirect properly
- ✅ Users can resend verification emails
- ✅ Login is blocked until email is verified
- ✅ All French text displays correctly
- ✅ Modal shows proper loading/success/error states

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Review backend logs for detailed error messages
4. Ensure Brevo account is properly configured

The email verification system is now fully integrated and ready for production use! 🚀
