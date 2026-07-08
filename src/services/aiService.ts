import { GoogleGenerativeAI } from '@google/generative-ai';

// Recomenda-se adicionar EXPO_PUBLIC_GEMINI_API_KEY no .env
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(API_KEY);

export interface AIProductSuggestion {
  name: string;
  category: string;
  quantity: number;
}

export async function generateShoppingList(prompt: string): Promise<AIProductSuggestion[]> {
  if (!API_KEY) {
    throw new Error('Chave de API do Gemini não configurada (EXPO_PUBLIC_GEMINI_API_KEY).');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

  const systemPrompt = `Você é um assistente especialista em supermercado. 
Aja como um gerador de listas de compras em formato JSON.
Dado o cenário do usuário, retorne uma lista de produtos recomendados.
O JSON deve ser um array contendo objetos estritamente com este formato:
[
  { "name": "Nome do Produto", "category": "Categoria (Hortifruti, Limpeza, Açougue, etc)", "quantity": 1 }
]
Retorne APENAS o JSON válido sem markdown \`\`\`json, não inclua mais nenhum texto ao redor.`;

  try {
    const result = await model.generateContent(`${systemPrompt}\n\nCenário: ${prompt}`);
    const text = result.response.text().trim();
    
    // Tenta remover crases de markdown caso o modelo teime em retornar
    const cleanedText = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
    
    return JSON.parse(cleanedText) as AIProductSuggestion[];
  } catch (err) {
    console.error('Erro na API da IA:', err);
    throw new Error('Não foi possível gerar a lista. Tente novamente mais tarde.');
  }
}
