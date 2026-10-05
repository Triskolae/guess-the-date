const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envoie un code de vérification à 6 chiffres par e-mail
 * @param {string} to - Adresse e-mail du destinataire
 * @param {string} code - Code à 6 chiffres
 */
async function sendVerificationEmail(to, code) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Guess The Date <onboarding@resend.dev>",
      to: [to],
      subject: "🔑 Votre code de vérification - Guess The Date",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Bienvenue sur Guess The Date !</h2>
          <p>Merci de vous être inscrit. Voici votre code de vérification pour activer votre compte :</p>
          <div style="background-color: #f4f4f5; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px;">Ce code est valide pendant <strong>15 minutes</strong>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">Si vous n'avez pas demandé ce code, vous pouvez ignorer cet e-mail.</p>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Erreur d'envoi d'e-mail via Resend:", error);
      throw new Error("Impossible d'envoyer l'e-mail de vérification.");
    }

    return data;
  } catch (err) {
    console.error("❌ Erreur dans email.service:", err.message);
    throw err;
  }
}

module.exports = {
  sendVerificationEmail,
};
