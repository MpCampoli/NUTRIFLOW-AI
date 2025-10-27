import { UserData, DietPlan, Meal, AiMealConfig, FoodItem, DietMeal, MacroTargets } from '../types';

type PlannerConfig = { mode: 'manual'; data: Meal[] } | { mode: 'ai'; data: AiMealConfig[] };

// Simplified macronutrient data per 100g for offline calculations.
// Values are approximate and serve to create a balanced plan.
const simpleFoodMacros: { [key: string]: { p: number; c: number; f: number; cal: number } } = {
    // Carbohydrates
    'Arroz Branco': { p: 2.7, c: 28.2, f: 0.3, cal: 130 },
    'Arroz Integral': { p: 2.6, c: 25.8, f: 1.0, cal: 124 },
    'Batata Doce': { p: 1.6, c: 20.1, f: 0.1, cal: 86 },
    'Batata Inglesa': { p: 2.0, c: 17.0, f: 0.1, cal: 77 },
    'Macarrão Integral': { p: 13.0, c: 75.0, f: 1.5, cal: 371 },
    'Pão de Forma Integral': { p: 9.0, c: 49.0, f: 3.2, cal: 265 },
    'Aveia em Flocos': { p: 16.9, c: 66.3, f: 6.9, cal: 389 },
    'Tapioca': { p: 0, c: 88.7, f: 0, cal: 355 },
    'Feijão Carioca': { p: 6.0, c: 14.0, f: 0.5, cal: 76 },
    'Cuscuz': { p: 3.8, c: 23.0, f: 0.2, cal: 112 },
    'Mandioquinha': { p: 1.0, c: 24.0, f: 0.2, cal: 101 },
    // Proteins
    'Ovos': { p: 13.0, c: 1.1, f: 11.0, cal: 155 },
    'Peito de Frango': { p: 31.0, c: 0, f: 3.6, cal: 165 },
    'Filé de Tilápia': { p: 26.0, c: 0, f: 2.0, cal: 128 },
    'Carne Moída (Patinho)': { p: 21.0, c: 0, f: 8.0, cal: 164 },
    'Queijo Cottage': { p: 11.0, c: 3.4, f: 4.3, cal: 98 },
    'Proteína de Whey Concentrada': { p: 80.0, c: 7.0, f: 6.0, cal: 402 },
    'Salmão': { p: 20.0, c: 0, f: 13.0, cal: 208 },
    'Atum em Lata (em água)': { p: 29.0, c: 0, f: 1.0, cal: 130 },
    'Tofu': { p: 8.0, c: 1.9, f: 4.8, cal: 76 },
    // Fats
    'Azeite de Oliva Extra Virgem': { p: 0, c: 0, f: 100, cal: 884 },
    'Abacate': { p: 2.0, c: 8.5, f: 15.0, cal: 160 },
    'Amêndoas': { p: 21.0, c: 22.0, f: 49.0, cal: 576 },
    'Pasta de Amendoim Integral': { p: 25.0, c: 20.0, f: 50.0, cal: 588 },
    'Castanha-do-Pará': { p: 14, c: 12, f: 66, cal: 656 },
    // Fruits
    'Maçã': { p: 0.3, c: 14.0, f: 0.2, cal: 52 },
    'Banana Nanica': { p: 1.1, c: 22.8, f: 0.3, cal: 89 },
    'Morango': { p: 0.7, c: 7.7, f: 0.3, cal: 32 },
    'Mamão Papaya': { p: 0.5, c: 10.8, f: 0.3, cal: 43 },
};

const getMealConfig = (config: PlannerConfig): (Meal | AiMealConfig)[] => config.data;

export const generateOfflineDietPlan = (
    userData: UserData,
    targetCalories: number,
    macroTargets: MacroTargets,
    goal: string,
    plannerConfig: PlannerConfig
): DietPlan => {
    const mealConfigs = getMealConfig(plannerConfig);
    const numMeals = mealConfigs.length > 0 ? mealConfigs.length : 1;

    // Use user-defined macro targets for calculation
    const proteinTarget = userData.weight * macroTargets.protein;
    const fatTarget = userData.weight * macroTargets.fat;
    const carbTarget = (targetCalories - (proteinTarget * 4) - (fatTarget * 9)) / 4;

    const proteinPerMeal = proteinTarget / numMeals;
    const carbsPerMeal = carbTarget / numMeals;
    const fatPerMeal = fatTarget / numMeals;

    const generatedMeals: DietMeal[] = mealConfigs.map(mealConfig => {
        const mealFoods: FoodItem[] = [];
        let mealCalories = 0, mealProteins = 0, mealCarbs = 0, mealFats = 0;

        const processFoodCategory = (
            foods: string[],
            targetGrams: number,
            macro: 'p' | 'c' | 'f'
        ) => {
            if (foods.length === 0 || targetGrams <= 0) return;
            const targetPerFood = targetGrams / foods.length;

            foods.forEach(foodName => {
                const foodData = simpleFoodMacros[foodName];
                if (foodData && foodData[macro] > 0) {
                    const quantity = Math.round((targetPerFood / foodData[macro]) * 100);
                    if (quantity > 0) {
                        const foodItem: FoodItem = {
                            name: foodName,
                            quantity_grams: quantity,
                        };

                        // Add unit description for eggs
                        if (foodName.toLowerCase() === 'ovos') {
                             const numEggs = Math.round(quantity / 50); // Approx 50g per egg
                             foodItem.unit_description = `${numEggs} ovo(s)`;
                        }

                        mealFoods.push(foodItem);
                        mealCalories += (quantity / 100) * foodData.cal;
                        mealProteins += (quantity / 100) * foodData.p;
                        mealCarbs += (quantity / 100) * foodData.c;
                        mealFats += (quantity / 100) * foodData.f;
                    }
                } else { // Handle foods not in our simple DB
                    mealFoods.push({ name: foodName, quantity_grams: 0, unit_description: 'Calcular offline' });
                }
            });
        };
        
        const meal = mealConfig as Meal;
        // Prioritize calculating essential macros first
        processFoodCategory(meal.proteins, proteinPerMeal, 'p');
        processFoodCategory(meal.fats, fatPerMeal, 'f');
        
        // Combine carbs and fruits for carb target
        const carbFoods = [...meal.carbohydrates, ...meal.fruits];
        processFoodCategory(carbFoods, carbsPerMeal, 'c');
        
        // Handle non-calculated items
        meal.vegetables.forEach(veg => mealFoods.push({ name: veg, quantity_grams: 0, unit_description: 'À vontade' }));
        
        // Handle supplements with standard doses
        meal.supplements.forEach(sup => {
            let unit_description = '1 dose';
            if (/whey/i.test(sup)) unit_description = '1 scoop de 30g';
            if (/creatina/i.test(sup)) unit_description = '1 dose de 5g';
            mealFoods.push({ name: sup, quantity_grams: 0, unit_description });
        });
        
        meal.customFoods.forEach(cf => mealFoods.push({ name: cf, quantity_grams: 0, unit_description: 'Adicionado' }));

        
        return {
            meal_name: mealConfig.name,
            foods: mealFoods,
            totals: {
                calories: Math.round(mealCalories),
                protein_grams: Math.round(mealProteins),
                carbohydrates_grams: Math.round(mealCarbs),
                fat_grams: Math.round(mealFats),
            },
        };
    });
    
    const finalTotals = generatedMeals.reduce((acc, meal) => ({
        calories: acc.calories + meal.totals.calories,
        protein_grams: acc.protein_grams + meal.totals.protein_grams,
        carbohydrates_grams: acc.carbohydrates_grams + meal.totals.carbohydrates_grams,
        fat_grams: acc.fat_grams + meal.totals.fat_grams,
    }), { calories: 0, protein_grams: 0, carbohydrates_grams: 0, fat_grams: 0 });

    const plan: DietPlan = {
        id: `offline-${new Date().toISOString()}`,
        createdAt: new Date().toISOString(),
        goal: goal,
        daily_totals: {
            calories: Math.round(finalTotals.calories),
            protein_grams: Math.round(finalTotals.protein_grams),
            carbohydrates_grams: Math.round(finalTotals.carbohydrates_grams),
            fat_grams: Math.round(finalTotals.fat_grams),
        },
        meals: generatedMeals,
        recommendations: [
            "Este plano foi gerado offline com base nas suas seleções. As quantidades são calculadas para atingir suas metas.",
            "Para maior variedade e sugestões da IA, gere a dieta novamente com o 'Modo Inteligente (Online)' ativado.",
            "Consuma vegetais e verduras livremente para aumentar a saciedade e a ingestão de micronutrientes."
        ],
        userData: userData,
        originalMeals: plannerConfig.data,
        macroTargets: macroTargets, 
        plannerMode: plannerConfig.mode,
    };

    return plan;
};