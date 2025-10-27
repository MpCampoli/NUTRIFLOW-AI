import React, { useState, useRef, useEffect } from 'react';
import { DietPlan, AiMealConfig, Meal, DietMeal } from '../types';
import { ArrowLeft } from './icons/ArrowLeft';
import { Trash2, Pencil } from './icons/EditorIcons';
import { Flame, Drumstick, Activity, Zap } from './icons/Macros';
import { FileDown, Mail, MessageSquareText } from './icons/Actions';
import { generateDietPlan } from '../services/geminiService';
import EditMealModal from './EditMealModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface AccordionItemProps {
  plan: DietPlan;
  onDelete: (id: string) => void;
  onUpdateDiet: (plan: DietPlan) => void;
  onAddDiet: (plan: DietPlan) => void;
  bloodTestFile: { name: string; data: string; } | null;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ plan, onDelete, onUpdateDiet, onAddDiet, bloodTestFile }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdjustingCalories, setIsAdjustingCalories] = useState(false);
    const [newCalories, setNewCalories] = useState(Math.round(plan.daily_totals.calories));
    const [recalculationStep, setRecalculationStep] = useState<'adjust' | 'confirm' | 'loading'>('adjust');
    const [newDietName, setNewDietName] = useState(plan.goal);

    const [currentPlan, setCurrentPlan] = useState<DietPlan>(plan);
    const [editingMeal, setEditingMeal] = useState<DietMeal | null>(null);
    const [needsMacroAdjustment, setNeedsMacroAdjustment] = useState(false);
    const [isAdjustingMacros, setIsAdjustingMacros] = useState(false);

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const dietDetailsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCurrentPlan(plan);
        setNewDietName(plan.goal);
        setNewCalories(Math.round(plan.daily_totals.calories));
        setNeedsMacroAdjustment(false);
    }, [plan]);

    const createdAt = new Date(plan.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    const performCalorieRecalculation = async (mode: 'substitute' | 'saveAsNew') => {
        if (!plan.userData || !plan.originalMeals || !plan.macroTargets || !plan.plannerMode) {
            alert("Esta dieta não contém os dados necessários para o recálculo.");
            return;
        }
        setRecalculationStep('loading');
        try {
            const newPlanFromAI = await generateDietPlan(
                plan.userData, newCalories, plan.macroTargets, newDietName,
                plan.plannerMode === 'manual' 
                    ? { mode: 'manual', data: plan.originalMeals as Meal[] }
                    : { mode: 'ai', data: plan.originalMeals as AiMealConfig[] },
                bloodTestFile,
                plan.meals // Use the original meal's food list for recalculation
            );
            
            const basePlanForStorage = {
                ...newPlanFromAI, goal: newDietName, userData: plan.userData,
                originalMeals: plan.originalMeals, macroTargets: plan.macroTargets, plannerMode: plan.plannerMode,
            };

            if (mode === 'saveAsNew') {
                onAddDiet(basePlanForStorage);
            } else {
                onUpdateDiet({ ...basePlanForStorage, id: plan.id, createdAt: new Date().toISOString() });
            }
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to recalculate diet:", error);
            alert("Ocorreu um erro ao recalcular a dieta.");
        } finally {
            setIsAdjustingCalories(false);
            setRecalculationStep('adjust');
        }
    };

    const handleMealUpdate = (updatedMeal: DietMeal) => {
        setCurrentPlan(prev => ({...prev, meals: prev.meals.map(m => m.meal_name === updatedMeal.meal_name ? updatedMeal : m)}));
        setNeedsMacroAdjustment(true);
        setEditingMeal(null);
    };

    const handleMacroAdjustment = async () => {
        if (!plan.userData || !plan.originalMeals || !plan.macroTargets) return;
        setIsAdjustingMacros(true);
        try {
            const newPlan = await generateDietPlan(
                plan.userData, plan.daily_totals.calories, plan.macroTargets, plan.goal,
                plan.plannerMode === 'manual' 
                    ? { mode: 'manual', data: plan.originalMeals as Meal[] }
                    : { mode: 'ai', data: plan.originalMeals as AiMealConfig[] },
                bloodTestFile, currentPlan.meals
            );
            onUpdateDiet({
                ...newPlan, id: plan.id, goal: plan.goal, createdAt: new Date().toISOString(),
                userData: plan.userData, originalMeals: plan.originalMeals,
                macroTargets: plan.macroTargets, plannerMode: plan.plannerMode,
            });
            setNeedsMacroAdjustment(false);
        } catch (error) {
            alert("Ocorreu um erro ao ajustar a dieta. Por favor, tente novamente.");
        } finally {
            setIsAdjustingMacros(false);
        }
    };
    
    const handleGeneratePdf = () => {
        const input = dietDetailsRef.current;
        if (input) {
            setIsGeneratingPdf(true);
            html2canvas(input, { scale: 2, backgroundColor: '#1e2b3a', useCORS: true })
            .then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const canvasRatio = canvas.height / canvas.width;
                const imgHeight = pdfWidth * canvasRatio;
                let position = 0;
                let heightLeft = imgHeight;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();

                while (heightLeft > 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                    heightLeft -= pdf.internal.pageSize.getHeight();
                }
                pdf.save(`Plano-${plan.goal.replace(/\s/g, '_')}.pdf`);
            })
            .catch(err => alert("Erro ao gerar PDF: " + err))
            .finally(() => setIsGeneratingPdf(false));
        }
    };

    const generateShareText = () => {
        const { daily_totals, meals, goal } = currentPlan;
        let text = `*Meu Plano de Dieta - NUTRIFLOW IA*\n\n*Objetivo:* ${goal}\n\n*Resumo Diário:*\n🔥 Calorias: ${Math.round(daily_totals.calories)} kcal\n🍗 Proteínas: ${Math.round(daily_totals.protein_grams)}g\n⚡ Carboidratos: ${Math.round(daily_totals.carbohydrates_grams)}g\n🥑 Gorduras: ${Math.round(daily_totals.fat_grams)}g\n\n*--- PLANO DE REFEIÇÕES ---*\n`;
        meals.forEach(meal => {
            text += `\n*_${meal.meal_name}_*\n`;
            meal.foods.forEach(food => {
                const quantityText = food.unit_description === 'À vontade' ? 'À vontade' : food.unit_description && food.quantity_grams === 0 ? food.unit_description : `${Math.round(food.quantity_grams)}g`;
                text += `• ${food.name}: ${quantityText}${food.unit_description && food.unit_description !== 'À vontade' && food.quantity_grams > 0 ? ` (${food.unit_description})` : ''}\n`;
            });
        });
        return text;
    };
    const handleShareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(generateShareText())}`, '_blank');
    const handleShareEmail = () => window.location.href = `mailto:?subject=${encodeURIComponent(`Meu Plano de Dieta NUTRIFLOW IA`)}&body=${encodeURIComponent(generateShareText())}`;

    return (
        <>
            <div className="bg-slate-900/50 rounded-xl border border-slate-700">
                <button onClick={() => { setIsOpen(!isOpen); if (isOpen) setIsAdjustingCalories(false); }} className="w-full p-4 text-left flex justify-between items-center">
                    <div>
                        <p className="font-bold text-lg text-white">{currentPlan.goal}</p>
                        <p className="text-sm text-slate-400">Criado em: {createdAt} | {Math.round(currentPlan.daily_totals.calories)} kcal</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={e => { e.stopPropagation(); setIsAdjustingCalories(!isAdjustingCalories); if (!isOpen) setIsOpen(true); }} title="Ajustar calorias" className="p-2 text-slate-500 hover:text-orange-400 rounded-full hover:bg-orange-500/10 transition-colors"><Flame className="w-5 h-5" /></button>
                        <button onClick={e => { e.stopPropagation(); if (window.confirm("Tem certeza?")) onDelete(plan.id); }} title="Excluir dieta" className="p-2 text-slate-500 hover:text-red-400 rounded-full hover:bg-red-500/10 transition-colors"><Trash2 className="w-5 h-5" /></button>
                        <svg className={`w-6 h-6 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </button>
                {isOpen && (
                    <div className="p-6 border-t border-slate-700 animate-fade-in-up">
                        {isAdjustingCalories && (
                             <div className="p-4 mb-6 bg-slate-800 rounded-lg border border-slate-600">
                                {recalculationStep === 'loading' && <p className="font-bold text-cyan-400 animate-pulse text-center">Recalculando...</p>}
                                {recalculationStep === 'adjust' && <>
                                    <h4 className="font-bold text-cyan-400 text-lg mb-3">Ajustar Meta Calórica</h4>
                                    <input type="range" min={Math.round(plan.daily_totals.calories * 0.7)} max={Math.round(plan.daily_totals.calories * 1.3)} step="10" value={newCalories} onChange={e => setNewCalories(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 mb-2" />
                                    <input type="number" value={newCalories} onChange={e => setNewCalories(Number(e.target.value))} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-center font-bold mb-4" />
                                    <button onClick={() => setRecalculationStep('confirm')} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg">Recalcular Dieta</button>
                                </>}
                                {recalculationStep === 'confirm' && <>
                                    <h4 className="font-bold text-white text-lg mb-3">Salvar Dieta Recalculada</h4>
                                    <input type="text" value={newDietName} onChange={e => setNewDietName(e.target.value)} placeholder="Nome da nova dieta" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 mb-4" />
                                    <div className="flex gap-4">
                                        <button onClick={() => performCalorieRecalculation('substitute')} className="flex-1 bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg">Substituir</button>
                                        <button onClick={() => performCalorieRecalculation('saveAsNew')} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg">Salvar como Nova</button>
                                    </div>
                                    <button onClick={() => setRecalculationStep('adjust')} className="w-full text-center text-slate-400 text-sm mt-4 hover:text-white">Cancelar</button>
                                </>}
                            </div>
                        )}
                        {needsMacroAdjustment && (
                             <div className="p-4 mb-6 bg-yellow-900/50 rounded-lg border border-yellow-500/50 text-center">
                                <p className="text-yellow-300 mb-3">Você editou uma refeição. Recalcule para ajustar os macros nas outras refeições.</p>
                                <button onClick={handleMacroAdjustment} disabled={isAdjustingMacros} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isAdjustingMacros ? 'Ajustando...' : 'Recalcular para Ajustar Macros'}
                                </button>
                            </div>
                        )}
                        <div ref={dietDetailsRef} className="bg-slate-900/50 p-4 rounded-xl">
                            <div className="mb-4 flex flex-col md:flex-row gap-2">
                                <div className="flex-1 p-2 rounded-lg bg-slate-800 flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400"/> <span className="text-xs"><strong>{Math.round(currentPlan.daily_totals.calories)}</strong> kcal</span></div>
                                <div className="flex-1 p-2 rounded-lg bg-slate-800 flex items-center gap-2"><Drumstick className="w-4 h-4 text-red-400"/> <span className="text-xs"><strong>{Math.round(currentPlan.daily_totals.protein_grams)}g</strong> Prot.</span></div>
                                <div className="flex-1 p-2 rounded-lg bg-slate-800 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-400"/> <span className="text-xs"><strong>{Math.round(currentPlan.daily_totals.carbohydrates_grams)}g</strong> Carb.</span></div>
                                <div className="flex-1 p-2 rounded-lg bg-slate-800 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400"/> <span className="text-xs"><strong>{Math.round(currentPlan.daily_totals.fat_grams)}g</strong> Gord.</span></div>
                            </div>

                            {currentPlan.meals.map((meal, index) => (
                                <div key={index} className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-cyan-400 text-lg">{meal.meal_name}</h4>
                                        <button onClick={() => setEditingMeal(meal)} title="Editar Refeição" className="p-2 text-slate-500 hover:text-cyan-400 rounded-full hover:bg-cyan-500/10"><Pencil className="w-4 h-4" /></button>
                                    </div>
                                    <ul className="divide-y divide-slate-800">
                                        {meal.foods.map((food, foodIndex) => (
                                            <li key={foodIndex} className="flex justify-between items-center py-1.5">
                                                <span className="text-slate-300">{food.name}</span>
                                                <span className="font-semibold text-white text-right">
                                                    {food.unit_description === 'À vontade' ? <span className="text-cyan-400">À vontade</span> : `${Math.round(food.quantity_grams)}g`}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-700">
                            <h3 className="text-xl font-semibold mb-4 text-white text-center">Ações</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                <button onClick={handleGeneratePdf} disabled={isGeneratingPdf} className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-50"><FileDown className="w-6 h-6 mb-2 text-cyan-400" /><span className="text-sm font-semibold text-slate-300">{isGeneratingPdf ? 'Gerando...' : 'Salvar PDF'}</span></button>
                                <button onClick={handleShareWhatsApp} className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-lg hover:bg-slate-700"><MessageSquareText className="w-6 h-6 mb-2 text-cyan-400" /><span className="text-sm font-semibold text-slate-300">WhatsApp</span></button>
                                <button onClick={handleShareEmail} className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-lg hover:bg-slate-700"><Mail className="w-6 h-6 mb-2 text-cyan-400" /><span className="text-sm font-semibold text-slate-300">E-mail</span></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {editingMeal && <EditMealModal isOpen={!!editingMeal} onClose={() => setEditingMeal(null)} meal={editingMeal} onSave={handleMealUpdate} />}
        </>
    );
};

interface SavedDietsProps {
  diets: DietPlan[];
  onDelete: (id: string) => void;
  onUpdateDiet: (plan: DietPlan) => void;
  onAddDiet: (plan: DietPlan) => void;
  onBack: () => void;
  bloodTestFile: { name: string; data: string; } | null;
}

const SavedDiets: React.FC<SavedDietsProps> = ({ diets, onDelete, onUpdateDiet, onAddDiet, onBack, bloodTestFile }) => {
  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 animate-fade-in relative">
      <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2">
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>
      <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center pt-8">Minhas Dietas Salvas</h2>
      
      {diets.length > 0 ? (
        <div className="space-y-4">
          {diets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(plan => (
            <AccordionItem 
                key={plan.id} 
                plan={plan} 
                onDelete={onDelete} 
                onUpdateDiet={onUpdateDiet} 
                onAddDiet={onAddDiet}
                bloodTestFile={bloodTestFile}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400">Você ainda não salvou nenhuma dieta.</p>
          <p className="text-slate-500 text-sm mt-2">Crie um novo plano e clique em "Salvar Dieta" para vê-lo aqui.</p>
        </div>
      )}
    </div>
  );
};

export default SavedDiets;