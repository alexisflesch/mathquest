# MathQuest Email Templates (Plaintext - French)

This file contains plaintext (non-HTML) email templates you can paste into Brevo or any transactional email provider. Replace placeholders in double curly braces with actual values.

Placeholders:
- {{username}} — user's display name or username
- {{verificationUrl}} — full URL the user should click to verify their email
- {{resetUrl}} — full URL to reset password
- {{supportEmail}} — support contact email (e.g. support@mathquest.app)
- {{expiryHours}} — number of hours before the link expires

---

## 1) Email Verification (Plaintext - French)

Sujet: Vérifiez votre email - MathQuest

Bonjour {{username}},

Merci d'avoir créé un compte sur MathQuest.

Pour activer votre compte, veuillez cliquer sur le lien ci-dessous ou le copier/coller dans votre navigateur :

{{verificationUrl}}

Ce lien expirera dans {{expiryHours}} heures.

Si vous n'avez pas créé ce compte, vous pouvez ignorer cet email.

Cordialement,
L'équipe MathQuest
{{supportEmail}}

---

## 2) Password Reset (Plaintext - French)

Sujet: Réinitialisation de mot de passe - MathQuest

Bonjour {{username}},

Nous avons reçu une demande pour réinitialiser votre mot de passe MathQuest.

Pour réinitialiser votre mot de passe, cliquez sur le lien ci-dessous ou copiez/collez-le dans votre navigateur :

{{resetUrl}}

Ce lien est valable pendant {{expiryHours}} heure(s). Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.

Cordialement,
L'équipe MathQuest
{{supportEmail}}

---

## 3) Welcome After Verification (Plaintext - French)

Sujet: Bienvenue sur MathQuest !

Bonjour {{username}},

Bienvenue sur MathQuest. Votre adresse email a été vérifiée avec succès et votre compte est maintenant activé.

Vous pouvez maintenant vous connecter et commencer à créer ou participer à des tournois et à sauvegarder vos progrès.

Bon jeu et à bientôt,
L'équipe MathQuest
{{supportEmail}}

---

## Usage notes

- In Brevo, choose the "plain text" or "text" content option and paste the corresponding template body into the editor.
- Ensure your sending domain or from-address is configured in Brevo to avoid deliverability issues.
- Replace placeholder variables with the provider's templating syntax if different (e.g., Brevo supports {{ params.variable }} depending on how the SDK injects params).
- Set `expiryHours` consistently with the backend token expiry (e.g., 24 for verification, 1 for password reset).
