import { GoogleGenAI, Type } from "@google/genai";
import { UserData, Meal, DietPlan, MacroTargets, AiMealConfig, DietMeal } from '../types';
import { foodOptions } from "../constants";

export type PlannerConfig = { mode: 'manual'; data: Meal[] } | { mode: 'ai'; data: AiMealConfig[] };

export const generateDietPlan = async (
    userData: UserData,
    targetCalories: number,
    macroTargets: MacroTargets,
    goal: string,
    plannerConfig: PlannerConfig,
    editedUserMeals: DietMeal[] | null = null
): Promise<DietPlan> => {
    if (!process.env.API_KEY) {
        throw new Error("Ocorreu um problema de configuração que impede a comunicação com a IA. Por favor, tente novamente mais tarde.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const model = 'gemini-2.5-flash';

    const proteinTarget = userData.weight * macroTargets.protein;
    const fatTarget = userData.weight * macroTargets.fat;
    const proteinCalories = proteinTarget * 4;
    const fatCalories = fatTarget * 9;
    const carbCalories = targetCalories - proteinCalories - fatCalories;
    const carbTarget = carbCalories / 4;

    let mealInstructions = '';
    let plannerPrompt = '';
    let recalculationPrompt = '';

    if (editedUserMeals) {
        recalculationPrompt = `
**PRIORIDADE MÁXIMA - RESTRIÇÕES DE RECÁLCULO DO USUÁRIO:**
O usuário editou manualmente uma ou mais refeições. Você DEVE usar os seguintes alimentos para estas refeições. Você SÓ PODE ajustar as quantidades dos alimentos nas *outras* refeições (as que não estão listadas abaixo como editadas) para atingir as metas nutricionais gerais. NÃO adicione, remova ou altere os itens alimentares nas refeições editadas abaixo. Para alimentos adicionados manualmente pelo usuário (com a descrição 'Adicionado manualmente'), estime suas informações nutricionais para incluí-los no cálculo total.

${editedUserMeals.map(meal => `
- **Refeição Editada: ${meal.meal_name}**
  - Alimentos a Incluir OBRIGATORIAMENTE: [${meal.foods.map(f => f.name).join(', ')}]
`).join('')}
`;
    }


    if (plannerConfig.mode === 'manual') {
        mealInstructions = plannerConfig.data.map(meal => {
            const customFoodsText = meal.customFoods.length > 0 ? `\n  - Alimentos Extras Adicionados pelo Usuário: [${meal.customFoods.join(', ')}] (Você DEVE incluir estes itens nesta refeição).` : '';
            return `
- **Refeição: ${meal.name}**
  - Carboidratos Selecionados: [${meal.carbohydrates.join(', ')}]
  - Proteínas Selecionadas: [${meal.proteins.join(', ')}]
  - Gorduras Selecionadas: [${meal.fats.join(', ')}]
  - Frutas Selecionadas: [${meal.fruits.join(', ')}]
  - Vegetais Selecionados: [${meal.vegetables.join(', ')}]
  - Suplementos Selecionados: [${meal.supplements.join(', ')}]
  (Se uma categoria de alimentos selecionados estiveria vazia, não inclua alimentos dela nesta refeição).
  Regra Especial para Vegetais: Para qualquer alimento listado em 'Vegetais Selecionados', você deve listá-lo na refeição com \`quantity_grams\` definido como 0 e \`unit_description\` como 'À vontade'. NÃO inclua os vegetais nos cálculos de calorias e macronutrientes totais. Eles são de consumo livre.${customFoodsText}
`}).join('');

        plannerPrompt = `
**Estrutura de Refeições e Escolhas Alimentares do Usuário:**
O usuário especificou as seguintes refeições e deseja incluir *apenas* os alimentos que selecionou, MAIS quaisquer alimentos extras personalizados que ele adicionou.

${mealInstructions}
`;
    } else { // AI mode
         mealInstructions = plannerConfig.data.map(meal => {
            const timeText = meal.time ? ` (Horário Sugerido: ${meal.time})` : '';
            return `- **Refeição: ${meal.name}**${timeText}`;
        }).join('\n');

        const foodOptionsText = `
**Listas de Alimentos Sugeridos (Priorize estes, mas sinta-se à vontade para adicionar outros alimentos saudáveis se necessário):**
- Carboidratos: [${foodOptions.carbohydrates.join(', ')}]
- Proteínas: [${foodOptions.proteins.join(', ')}]
- Gorduras: [${foodOptions.fats.join(', ')}]
- Frutas: [${foodOptions.fruits.join(', ')}]
- Vegetais e Verduras: [${foodOptions.vegetables.join(', ')}]
- Suplementos: [${foodOptions.supplements.join(', ')}]
`;

        plannerPrompt = `
**Estrutura de Refeições Definida pelo Usuário:**
O usuário definiu a seguinte estrutura de refeições. Sua tarefa é escolher os alimentos e as quantidades para cada uma.

${mealInstructions}

**Instruções de Geração Adicionais para Seleção de Alimentos:**
1.  **Seleção Inteligente de Alimentos:** Com base nos nomes e horários das refeições (ex: "Pré-treino", "Jantar"), selecione alimentos apropriados e saudáveis para cada uma, visando atingir as metas diárias. Para "Pré-treino", escolha alimentos de digestão mais rápida. Para "Pós-treino", foque em proteínas e carboidratos.
2.  **Variedade e Equilíbrio:** Crie uma dieta variada, saborosa e nutricionalmente equilibrada, utilizando principalmente os alimentos das listas sugeridas abaixo.

${foodOptionsText}
`;
    }


    const prompt = `
Você é uma IA nutricionista especialista. Sua tarefa é criar um plano de refeições diário detalhado, preciso e prático com base nos dados e preferências do usuário.

**Dados do Usuário:**
- Nome: ${userData.name}
- Gênero: ${userData.gender === 'male' ? 'Masculino' : 'Feminino'}
- Idade: ${userData.age} anos
- Peso: ${userData.weight} kg
- Meta de Calorias Diárias: ${Math.round(targetCalories)} kcal
- Objetivo Principal: ${goal}

**Metas de Macronutrientes (REGRAS NÃO NEGOCIÁVEIS - CÁLCULO PRECISO OBRIGATÓRIO):**
Você DEVE seguir estas metas de macronutrientes com precisão matemática. Os totais diários no seu plano final DEVEM corresponder exatamente a estes valores.
1.  **Proteína (Regra Estrita):** Gere a dieta para conter EXATAMENTE ${Math.round(proteinTarget)} gramas de proteína. Este valor é calculado a partir da regra de ${macroTargets.protein}g por kg de peso corporal do usuário e não pode ser alterado.
2.  **Gordura (Regra Estrita):** Gere a dieta para conter EXATAMENTE ${Math.round(fatTarget)} gramas de gordura. Este valor é calculado a partir da regra de ${macroTargets.fat}g por kg de peso corporal do usuário e não pode ser alterado.
3.  **Carboidratos (Cálculo de Preenchimento):** Calcule e use a quantidade EXATA de carboidratos (${Math.round(carbTarget)} gramas) necessária para atingir a meta calórica total de ${Math.round(targetCalories)} kcal, após as metas de proteína e gordura terem sido cumpridas.

${recalculationPrompt}

${plannerPrompt}

**Instruções Gerais de Geração:**
1.  **Alimentos Extras (se houver):** Se o usuário adicionou alimentos extras (como doces ou itens não listados), primeiro pesquise e determine suas informações nutricionais (calorias e macros). Subtraia esses valores das metas diárias totais antes de calcular o resto.
2.  **Cálculo da Dieta Principal:** Com as metas de macros e calorias restantes, calcule a quantidade precisa (em gramas) para *cada item alimentar* para atingir as novas metas. Distribua os macronutrientes de forma equilibrada entre as refeições.
3.  **Medidas Práticas:** Para alimentos contáveis (ex: ovos, fatias de pão, frutas pequenas, castanhas), forneça uma descrição de unidade prática no campo \`unit_description\` (ex: '2 ovos inteiros' ou '1 fatia média' ou '5 unidades'). Para outros alimentos, este campo pode ser nulo. A quantidade em \`quantity_grams\` deve ser sempre o peso total.
4.  **Cálculo Avançado de Suplementos:** Para qualquer item na categoria 'Suplementos', você DEVE pesquisar e determinar a dosagem clinicamente apropriada com base nos dados do usuário (peso, idade, sexo) e no objetivo da dieta. Use as seguintes diretrizes estritas:
    - **Regra Geral:** Para estes itens, defina \`quantity_grams\` como 0. A dosagem completa DEVE ser colocada no campo \`unit_description\`. Não use o símbolo "g" para suplementos.
    - **Multivitamínicos e Minerais:** A dosagem deve ser '1 cápsula' ou '2 cápsulas', com a concentração especificada se relevante (ex: '1 cápsula de 500mg'). Calcule com base nas Recomendações de Ingestão Diária (RDIs).
    - **Vitaminas (D, C, etc.):** A dosagem deve ser em Unidades Internacionais (UI) ou miligramas (mg). Ex: '2000 UI' ou '500 mg'.
    - **Ômega 3:** A dosagem deve ser em miligramas (mg). Ex: '1000 mg' ou '2000 mg'.
    - **Fitoterápicos e Suplementos Específicos (Nattokinase, Creatina, etc.):** A dosagem deve usar a unidade apropriada, como Unidades Fibrinolíticas (FU), gramas (g) ou miligramas (mg), mas apresentada de forma clara. Ex: '100 FU', '5g', '400 mg'. Para creatina, especifique '5g'.
    - **Suplementos de Proteína (Whey, Albumina):** Para estes, a quantidade em gramas é importante. Calcule o \`quantity_grams\` para atingir as metas de proteína e especifique a medida prática em \`unit_description\` (ex: '1 scoop de 30g').
5.  **Recomendações:** No final, forneça 2-3 recomendações curtas e úteis no campo \`recommendations\` sobre hidratação, sono, ou outras dicas de saúde relevantes para o objetivo do usuário.

**Formato de Saída:**
Forneça sua resposta *apenas* no formato JSON especificado pelo esquema a seguir. Não inclua texto introdutório, explicações ou formatação de markdown fora da estrutura JSON.
`;

    const dietPlanSchema = {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: "Gerar um ID único para este plano de dieta, como um UUID."},
            createdAt: { type: Type.STRING, description: "A data e hora atual no formato ISO 8601."},
            goal: { type: Type.STRING, description: "O objetivo principal do usuário, fornecido no prompt."},
            daily_totals: {
                type: Type.OBJECT,
                properties: {
                    calories: { type: Type.NUMBER },
                    protein_grams: { type: Type.NUMBER },
                    carbohydrates_grams: { type: Type.NUMBER },
                    fat_grams: { type: Type.NUMBER },
                },
                required: ['calories', 'protein_grams', 'carbohydrates_grams', 'fat_grams'],
            },
            meals: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        meal_name: { type: Type.STRING },
                        foods: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    quantity_grams: { type: Type.NUMBER },
                                    unit_description: { type: Type.STRING, description: "Descrição prática da unidade (ex: '2 ovos', '1 fatia', '1 cápsula de 500mg', '2000 UI', '1000 mg', 'À vontade'). Para suplementos sem peso, a dosagem completa vai aqui." },
                                },
                                required: ['name', 'quantity_grams'],
                            },
                        },
                        totals: {
                            type: Type.OBJECT,
                            properties: {
                                calories: { type: Type.NUMBER },
                                protein_grams: { type: Type.NUMBER },
                                carbohydrates_grams: { type: Type.NUMBER },
                                fat_grams: { type: Type.NUMBER },
                            },
                            required: ['calories', 'protein_grams', 'carbohydrates_grams', 'fat_grams'],
                        },
                    },
                    required: ['meal_name', 'foods', 'totals'],
                },
            },
            recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
            },
        },
        required: ['id', 'createdAt', 'goal', 'daily_totals', 'meals', 'recommendations'],
    };
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: dietPlanSchema,
                thinkingConfig: { thinkingBudget: 0 }
            },
        });

        const jsonText = response.text.trim();
        const dietPlanResponse: DietPlan = JSON.parse(jsonText);
        return dietPlanResponse;

    } catch (error) {
        console.error("Error generating diet plan:", error);
        throw new Error("Não foi possível gerar o plano de dieta. A IA pode não ter conseguido processar os alimentos extras ou as combinações selecionadas. Por favor, tente novamente com seleções diferentes.");
    }
};


export const getChatbotResponse = async (history: { role: string; parts: { text: string }[] }[], newMessage: string): Promise<string> => {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable is not set for chatbot.");
        return "O assistente de IA não está disponível no momento devido a um problema de configuração.";
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const model = 'gemini-2.5-flash';
    
    const chat = ai.chats.create({
        model: model,
        history: history,
        config: {
          systemInstruction: 'Você é um assistente de IA amigável e informativo, especializado em nutrição, fitness e saúde. Responda às perguntas do usuário de forma clara, concisa e encorajadora. Use linguagem acessível, evitando jargões técnicos sempre que possível.',
          thinkingConfig: { thinkingBudget: 0 }
        }
    });

    try {
        const response = await chat.sendMessage({ message: newMessage });
        return response.text;
    } catch (error) {
        console.error("Error getting chatbot response:", error);
        return "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.";
    }
};