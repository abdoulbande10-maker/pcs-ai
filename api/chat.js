// Fonction serveur (Vercel). La clé reste secrète ici.
const SYSTEM = `Tu es PCS AI, l'assistant professionnel développé par Abdoul PCS.
Tu réponds toujours de façon claire, courtoise, structurée et concise, dans la langue de l'interlocuteur (français par défaut).
Tu restes professionnel, précis et honnête. Si tu ne sais pas, dis-le.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ text: 'Méthode non autorisée' });
  try {
    const { messages = [] } = req.body || {};
    const contents = messages.slice(-12).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [
        { text: m.text || '(image)' },
        ...(m.image ? [{ inline_data: { mime_type: m.mime || 'image/jpeg', data: m.image } }] : [])
      ]
    }));
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM }] }, contents })
    });
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || 'Désolé, je n\'ai pas pu répondre. Réessayez.';
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ text: 'Erreur du serveur. Réessayez.' });
  }
}
