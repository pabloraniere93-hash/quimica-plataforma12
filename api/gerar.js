export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    const { tema, turma } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ erro: 'Chave da API ausente no servidor.' });
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const instrucaoParaIA = `
      Atue como um especialista em currículo e professor de Química. Crie um plano de aula completo e viável sobre o tema "${tema}" para a turma de "${turma}". 
      Siga EXATAMENTE estas diretrizes:
      1. Alinhamento BNCC: Forneça o código alfanumérico oficial.
      2. Contextualização: Relacione os conceitos químicos com a realidade cotidiana.
      3. Abordagem: Se a turma for EJA, priorize metodologias ativas.
      4. Referências Bibliográficas: Liste fontes reais no padrão ABNT.
      5. Saída: Retorne a resposta APENAS em HTML.
    `;

    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: instrucaoParaIA }] }] })
    });

    // SE O GOOGLE RECUSAR, ESTE BLOCO CAPTURA O MOTIVO EXATO
    if (!resposta.ok) {
      const erroDoGoogle = await resposta.text();
      return res.status(500).json({ erro: `Bloqueio do Google: ${erroDoGoogle}` });
    }

    const dados = await resposta.json();
    let textoGerado = dados.candidates[0].content.parts[0].text;
    textoGerado = textoGerado.replace(/```html/g, '').replace(/```/g, '').trim();
    
    return res.status(200).json({ html: textoGerado });

  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro interno no servidor Vercel." });
  }
}
