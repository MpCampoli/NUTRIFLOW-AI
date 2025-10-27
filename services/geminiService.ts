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
    bloodTestFile: { name: string; data: string; } | null,
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
    let bloodTestPrompt = '';

    if (bloodTestFile) {
        bloodTestPrompt = `
**PRIORIDADE MÁXIMA - ANÁLISE DE EXAME E GERAÇÃO DA ANÁLISE CLÍNICA:**
O usuário enviou um arquivo de exame de sangue. Sua tarefa é analisá-lo e, com base nele, gerar o conteúdo para o campo \`clinical_analysis\` do JSON de saída principal. Você é um assistente nutricional/analítico responsável por analisar o conteúdo extraído de um exame de sangue e gerar o campo "Observações Clínicas" e sugestões de fitoterápicos. Siga as regras estritas abaixo.

**REGRAS GERAIS PARA ANÁLISE CLÍNICA**
1.  **Observações:** Produza observações curtas (1–2 linhas) para cada achado relevante no exame (ex: LDL alto, vitamina D baixa). Cada observação deve explicar brevemente o que foi feito na dieta e por qual motivo.
2.  **Fitoterápicos (Apenas como Sugestão):** Inclua fitoterápicos SOMENTE no campo \`suplementos\` dentro de \`clinical_analysis\` quando houver evidência científica razoável. Para cada item, retorne uma entrada estruturada com: nome, dose_sugerida (se houver suporte científico, senão \`null\`), unidade, objetivo, resumo da evidência, citação, e segurança: “Validar com médico antes do uso.” Para a Nattokinase, a \`dose_sugerida\` DEVE ser em 'UI' (Unidades Internacionais) e a \`unidade\` deve ser 'UI', baseada em dosagens estudadas (ex: 2000 UI).
3.  **Segurança:** Sempre inclua em \`metadados.requer_validacao_clinica = true\`.
4.  **Análise de Hematócrito:** Preste atenção especial ao valor do hematócrito no exame. Se estiver elevado, considere sugerir Nattokinase como um fitoterápico para auxiliar na saúde circulatória.
`;
    }

    if (editedUserMeals) {
        recalculationPrompt = `
**PRIORIDADE MÁXIMA - RESTRIÇÕES DE RECÁLCULO:**
Esta é uma solicitação de recálculo de uma dieta existente. O usuário pode ter ajustado o total de calorias ou editado uma refeição.
Sua tarefa é gerar um novo plano, mas com uma regra fundamental: você DEVE OBRIGATORIAMENTE usar a lista de alimentos fornecida abaixo para cada refeição.
NÃO adicione, remova ou substitua NENHUM alimento da lista a seguir. Sua única tarefa é AJUSTAR AS QUANTIDADES (em gramas) desses alimentos para atingir as novas metas nutricionais totais.

**Lista de Alimentos Fixa (NÃO ALTERAR):**
${editedUserMeals.map(meal => `
- **Refeição: ${meal.meal_name}**
  - Alimentos a serem usados OBRIGATORIAMENTE: [${meal.foods.map(f => f.name).join(', ')}]
`).join('')}

Para alimentos com a descrição 'Adicionado manualmente', estime suas informações nutricionais para incluí-los no cálculo total.
`;
    }


    if (plannerConfig.mode === 'manual') {
        mealInstructions = (plannerConfig.data as Meal[]).map(meal => {
            const timeText = meal.time ? ` (Horário: ${meal.time})` : '';
            const customFoodsText = meal.customFoods.length > 0 ? `\n  - Alimentos Extras Adicionados pelo Usuário: [${meal.customFoods.join(', ')}] (Você DEVE incluir estes itens nesta refeição).` : '';
            return `
- **Refeição: ${meal.name}${timeText}**
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
         mealInstructions = (plannerConfig.data as AiMealConfig[]).map(meal => {
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
- Objetivo Principal: ${goal}

**Metas de Calorias e Macronutrientes (REGRAS NÃO NEGOCIÁVEIS - CÁLCULO PRECISO OBRIGATÓRIO):**
Você DEVE seguir estas metas com precisão matemática. Os totais diários no seu plano final DEVEM corresponder exatamente a estes valores.
1.  **Meta Calórica Total (Regra Estrita):** Gere a dieta para conter EXATAMENTE ${Math.round(targetCalories)} kcal.
2.  **Proteína (Regra Estrita):** Gere a dieta para conter EXATAMENTE ${Math.round(proteinTarget)} gramas de proteína. Este valor é calculado a partir da regra de ${macroTargets.protein}g por kg de peso corporal do usuário e não pode ser alterado.
3.  **Gordura (Regra Estrita):** Gere a dieta para conter EXATAMENTE ${Math.round(fatTarget)} gramas de gordura. Este valor é calculado a partir da regra de ${macroTargets.fat}g por kg de peso corporal do usuário e não pode ser alterado.
4.  **Carboidratos (Cálculo de Preenchimento):** Calcule e use a quantidade EXATA de carboidratos (${Math.round(carbTarget)} gramas) necessária para atingir a meta calórica total, após as metas de proteína e gordura terem sido cumpridas.

${bloodTestPrompt}

${recalculationPrompt}

${plannerPrompt}

**Instruções Gerais de Geração:**
1.  **Suplementos:** Suplementos listados pelo usuário (como Whey Protein, Creatina) devem ser tratados como alimentos normais e integrados diretamente nas refeições, contribuindo para os totais de macros. Fitoterápicos, por outro lado, são sugestões baseadas em exames e devem ir apenas no campo \`clinical_analysis\`.
2.  **Medidas Práticas:** Para alimentos contáveis (ex: ovos, fatias de pão), forneça uma descrição de unidade prática no campo \`unit_description\` (ex: '2 ovos inteiros'). A quantidade em \`quantity_grams\` deve ser sempre o peso total.
3.  **Dosagem de Suplementos:** Para suplementos, defina \`quantity_grams\` como a dosagem em gramas (ex: 30 para whey, 5 para creatina). Em \`unit_description\`, coloque a medida prática (ex: '1 scoop de 30g', '1 dose de 5g').
4.  **Recomendações:** Forneça 3-4 recomendações úteis no campo \`recommendations\`. **Regra de Hidratação:** Calcule a ingestão hídrica ideal do usuário usando a regra de 50ml por kg de peso corporal e a ingestão mínima usando 30ml por kg. Inclua AMBOS os valores calculados em litros como recomendações separadas (ex: "Sua meta de hidratação ideal é de 3.5 litros..." e "Tente beber no mínimo 2.1 litros..."). **IMPORTANTE:** Se a dieta incluir suplementos, adicione uma recomendação explicando brevemente o motivo de sua inclusão (ex: "A Creatina foi adicionada para auxiliar na força e recuperação muscular.").
5.  **Bebidas Zero Caloria:** Se o usuário adicionar ou você sugerir bebidas com calorias insignificantes (ex: café preto sem açúcar, chás sem açúcar, água com limão), liste-as na refeição com \`quantity_grams\` definido como 0 e \`unit_description\` como 'À vontade', e não as inclua nos cálculos de totais.
6.  **Especificação sobre Ovos (REGRA CRÍTICA):** Quando usar "Ovos", sempre especifique a quantidade de "ovos inteiros" e/ou "claras". Por exemplo, em vez de apenas "Ovos - 150g", use uma descrição como "2 ovos inteiros e 3 claras". Isso é fundamental para o controle preciso de gordura e calorias, imitando a prática de um nutricionista.
7.  **Combinação de Aveia:** Ao incluir 'Aveia em Flocos', crie uma refeição coesa combinando-a com alimentos que harmonizam bem, como 'Proteína de Whey', iogurtes ou frutas.

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
                                    unit_description: { type: Type.STRING, description: "Descrição prática da unidade (ex: '2 ovos', '1 fatia', '1 scoop de 30g', 'À vontade')." },
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
            clinical_analysis: {
                type: Type.OBJECT,
                properties: {
                    observacoes: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    },
                    suplementos: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                nome: { type: Type.STRING },
                                dose_sugerida: {
                                    type: Type.NUMBER,
                                    description: "A dosagem numérica sugerida do fitoterápico. Se não houver evidência, este campo deve ser omitido ou nulo.",
                                    nullable: true,
                                },
                                unidade: { type: Type.STRING },
                                objetivo: { type: Type.STRING },
                                resumo_evidencia: { type: Type.STRING },
                                citacao: { type: Type.STRING },
                                evidence_available: { type: Type.BOOLEAN },
                                seguranca: { type: Type.STRING },
                            },
                            required: ['nome', 'unidade', 'objetivo', 'resumo_evidencia', 'citacao', 'evidence_available', 'seguranca']
                        }
                    },
                    metadados: {
                        type: Type.OBJECT,
                        properties: {
                            gerado_por: { type: Type.STRING },
                            versao_prompt: { type: Type.STRING },
                            requer_validacao_clinica: { type: Type.BOOLEAN },
                        },
                        required: ['gerado_por', 'versao_prompt', 'requer_validacao_clinica']
                    }
                },
                required: ['observacoes', 'suplementos', 'metadados'],
                description: "Análise clínica baseada no exame de sangue do usuário. Este campo deve conter apenas sugestões de FITOTERÁPICOS, não suplementos comuns como whey ou creatina."
            },
        },
        required: ['id', 'createdAt', 'goal', 'daily_totals', 'meals', 'recommendations'],
    };
    
    try {
        const contentParts: ( { text: string } | { inlineData: { data: string, mimeType: string } } )[] = [
            { text: prompt },
        ];

        if (bloodTestFile) {
            contentParts.push({
                inlineData: {
                    data: bloodTestFile.data.split(',')[1],
                    mimeType: 'application/pdf',
                },
            });
        }
        
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: contentParts },
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