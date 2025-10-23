import React, { useState, useRef } from 'react';
import { DietPlan, AiMealConfig, Meal } from '../types';
import { ArrowLeft } from './icons/ArrowLeft';
import { Trash2 } from './icons/EditorIcons';
import { Flame, Drumstick, Activity, Zap } from './icons/Macros';
import { FileDown, Mail, MessageSquareText } from './icons/Actions';
import { generateDietPlan } from '../services/geminiService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface AccordionItemProps {
  plan: DietPlan;
  onDelete: (id: string) => void;
  onUpdateDiet: (plan: DietPlan) => void;
  onAddDiet: (plan: DietPlan) => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ plan, onDelete, onUpdateDiet, onAddDiet }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [newCalories, setNewCalories] = useState(Math.round(plan.daily_totals.calories));
  const [recalculationStep, setRecalculationStep] = useState<'adjust' | 'confirm' | 'loading'>('adjust');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const dietDetailsRef = useRef<HTMLDivElement>(null);
  
  const createdAt = new Date(plan.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const performRecalculation = async (mode: 'substitute' | 'saveAsNew') => {
    if (!plan.userData || !plan.originalMeals || !plan.macroTargets || !plan.plannerMode) {
        alert("Esta dieta não contém os dados necessários para o recálculo. Por favor, crie uma nova dieta e salve-a novamente.");
        return;
    }
    setRecalculationStep('loading');
    try {
        const newPlanFromAI = await generateDietPlan(
            plan.userData,
            newCalories,
            plan.macroTargets,
            plan.goal,
            plan.plannerMode === 'manual' 
                ? { mode: 'manual', data: plan.originalMeals as Meal[] }
                : { mode: 'ai', data: plan.originalMeals as AiMealConfig[] }
        );
        
        const basePlanForStorage = {
            ...newPlanFromAI,
            userData: plan.userData,
            originalMeals: plan.originalMeals,
            macroTargets: plan.macroTargets,
            plannerMode: plan.plannerMode,
        };

        if (mode === 'saveAsNew') {
            onAddDiet(basePlanForStorage);
        } else { // substitute
            const updatedPlanForStorage: DietPlan = {
                ...basePlanForStorage,
                id: plan.id,
                createdAt: new Date().toISOString(), 
            };
            onUpdateDiet(updatedPlanForStorage);
        }

        setIsOpen(false);
        setIsAdjusting(false);

    } catch (error) {
        console.error("Failed to recalculate diet:", error);
        alert("Ocorreu um erro ao recalcular a dieta. Por favor, tente novamente.");
    } finally {
        setRecalculationStep('adjust');
    }
  };

  const handleGeneratePdf = () => {
    const input = dietDetailsRef.current;
    if (input) {
        setIsGeneratingPdf(true);
        html2canvas(input, {
            scale: 2,
            backgroundColor: '#1e293b', 
            useCORS: true,
        }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasHeight / canvasWidth;
            const imgHeight = pdfWidth * ratio;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
            
            pdf.save(`Plano-Dieta-${plan.userData.name.replace(/\s/g, '_')}.pdf`);
            setIsGeneratingPdf(false);
        }).catch(() => {
            setIsGeneratingPdf(false);
            alert("Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.");
        });
    }
  };

  const generateShareText = () => {
      const { daily_totals, meals, goal } = plan;
      
      let text = `*Meu Plano de Dieta - NUTRIFLOW IA*\n\n`;
      text += `*Objetivo:* ${goal}\n\n`;
      text += `*Resumo Diário:*\n`;
      text += `🔥 Calorias: ${Math.round(daily_totals.calories)} kcal\n`;
      text += `🍗 Proteínas: ${Math.round(daily_totals.protein_grams)}g\n`;
      text += `⚡ Carboidratos: ${Math.round(daily_totals.carbohydrates_grams)}g\n`;
      text += `🥑 Gorduras: ${Math.round(daily_totals.fat_grams)}g\n\n`;
      
      text += `*--- PLANO DE REFEIÇÕES ---*\n`;
      meals.forEach(meal => {
          text += `\n*_${meal.meal_name}_*\n`;
          meal.foods.forEach(food => {
              const isSupplement = food.quantity_grams === 0 && food.unit_description && food.unit_description !== 'À vontade';
              const isVegetable = food.quantity_grams === 0 && food.unit_description === 'À vontade';
              
              let quantityText = '';
              if (isVegetable) {
                  quantityText = 'À vontade';
              } else if (isSupplement) {
                  quantityText = food.unit_description!;
              } else {
                  quantityText = `${Math.round(food.quantity_grams)}g`;
              }

              text += `• ${food.name}: ${quantityText}`;
              if (!isSupplement && food.unit_description && food.unit_description !== 'À vontade') {
                  text += ` (${food.unit_description})`;
              }
              text += `\n`;
          });
      });
      return text;
  }

  const handleShareWhatsApp = () => {
      const text = encodeURIComponent(generateShareText());
      window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  const handleShareEmail = () => {
      const subject = encodeURIComponent(`Meu Plano de Dieta NUTRIFLOW IA`);
      const body = encodeURIComponent(generateShareText());
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }


  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-700">
      <button
        onClick={() => {
            setIsOpen(!isOpen);
            if(isOpen) setIsAdjusting(false); // Close adjuster when collapsing
        }}
        className="w-full p-4 text-left flex justify-between items-center"
      >
        <div className="flex-1">
            <p className="font-bold text-lg text-white">{plan.goal}</p>
            <p className="text-sm text-slate-400">
                Criado em: {createdAt} | {Math.round(plan.daily_totals.calories)} kcal
            </p>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={(e) => { e.stopPropagation(); setIsAdjusting(!isAdjusting); if (!isOpen) setIsOpen(true); }}
                className="p-2 text-slate-500 hover:text-orange-400 rounded-full hover:bg-orange-500/10 transition-colors"
                aria-label="Ajustar calorias"
                title="Ajustar calorias"
            >
                <Flame className="w-5 h-5" />
            </button>
             <button
                onClick={(e) => {
                    e.stopPropagation();
                    if(window.confirm("Tem certeza que deseja excluir esta dieta?")){
                        onDelete(plan.id);
                    }
                }}
                className="p-2 text-slate-500 hover:text-red-400 rounded-full hover:bg-red-500/10 transition-colors"
                aria-label="Excluir dieta"
                title="Excluir dieta"
            >
                <Trash2 className="w-5 h-5" />
            </button>
            <svg
            className={`w-6 h-6 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </div>
      </button>
      {isOpen && (
        <div className="p-6 border-t border-slate-700 animate-fade-in-up">
            {isAdjusting && (
                <div className="p-4 mb-6 bg-slate-800 rounded-lg border border-slate-600">
                    {recalculationStep === 'loading' && (
                        <div className="text-center p-4">
                            <p className="font-bold text-cyan-400 animate-pulse">Recalculando sua dieta...</p>
                        </div>
                    )}
                    {recalculationStep === 'adjust' && (
                        <>
                            <h4 className="font-bold text-cyan-400 text-lg mb-3">Ajustar Meta Calórica</h4>
                            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                                <input
                                    type="range"
                                    min={Math.round(plan.daily_totals.calories * 0.7)}
                                    max={Math.round(plan.daily_totals.calories * 1.3)}
                                    step="10"
                                    value={newCalories}
                                    onChange={(e) => setNewCalories(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                                <div className="flex items-center gap-2">
                                <input
                                        type="number"
                                        value={newCalories}
                                        onChange={(e) => setNewCalories(Number(e.target.value))}
                                        className="w-28 bg-slate-700 border border-slate-600 rounded-lg p-2 text-center font-bold"
                                    />
                                    <span className="text-slate-400">kcal</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setRecalculationStep('confirm')}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-all"
                            >
                                Recalcular Dieta
                            </button>
                        </>
                    )}
                    {recalculationStep === 'confirm' && (
                         <>
                            <h4 className="font-bold text-white text-lg mb-3 text-center">Como deseja salvar a dieta recalculada?</h4>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => performRecalculation('substitute')}
                                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-all"
                                >
                                    Substituir Dieta Atual
                                </button>
                                <button
                                    onClick={() => performRecalculation('saveAsNew')}
                                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-all"
                                >
                                    Salvar como Nova Dieta
                                </button>
                            </div>
                            <button onClick={() => setRecalculationStep('adjust')} className="w-full text-center text-slate-400 text-sm mt-4 hover:text-white">Cancelar</button>
                        </>
                    )}
                </div>
            )}
            
            <div ref={dietDetailsRef} className="bg-slate-900/50 p-4 rounded-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 bg-slate-800 rounded-lg text-center">
                        <Flame className="w-6 h-6 mx-auto text-orange-400 mb-1" />
                        <p className="text-sm text-slate-400">Calorias</p>
                        <p className="font-bold text-white">{Math.round(plan.daily_totals.calories)}</p>
                    </div>
                    <div className="p-3 bg-slate-800 rounded-lg text-center">
                        <Drumstick className="w-6 h-6 mx-auto text-red-400 mb-1" />
                        <p className="text-sm text-slate-400">Proteínas</p>
                        <p className="font-bold text-white">{Math.round(plan.daily_totals.protein_grams)}g</p>
                    </div>
                    <div className="p-3 bg-slate-800 rounded-lg text-center">
                        <Activity className="w-6 h-6 mx-auto text-cyan-400 mb-1" />
                        <p className="text-sm text-slate-400">Carbos</p>
                        <p className="font-bold text-white">{Math.round(plan.daily_totals.carbohydrates_grams)}g</p>
                    </div>
                    <div className="p-3 bg-slate-800 rounded-lg text-center">
                        <Zap className="w-6 h-6 mx-auto text-yellow-400 mb-1" />
                        <p className="text-sm text-slate-400">Gorduras</p>
                        <p className="font-bold text-white">{Math.round(plan.daily_totals.fat_grams)}g</p>
                    </div>
                </div>
                {plan.meals.map((meal, index) => (
                    <div key={index} className="mb-4">
                    <h4 className="font-bold text-cyan-400 text-lg mb-2">{meal.meal_name}</h4>
                    <ul className="divide-y divide-slate-800">
                        {meal.foods.map((food, foodIndex) => {
                            const isSupplement = food.quantity_grams === 0 && food.unit_description && food.unit_description !== 'À vontade';
                            const isVegetable = food.quantity_grams === 0 && food.unit_description === 'À vontade';

                            return (
                                <li key={foodIndex} className="flex justify-between items-center py-1.5">
                                    <span className="text-slate-300">{food.name}</span>
                                    <span className="font-semibold text-cyan-400 text-right">
                                        {isVegetable ? (
                                            'À vontade'
                                        ) : isSupplement ? (
                                            food.unit_description
                                        ) : (
                                            <>
                                                {Math.round(food.quantity_grams)}g
                                                {food.unit_description && <span className="block text-xs text-slate-400 font-normal">({food.unit_description})</span>}
                                            </>
                                        )}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700">
                <h3 className="text-xl font-semibold mb-4 text-white text-center">Ações</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <button onClick={handleGeneratePdf} disabled={isGeneratingPdf} className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <FileDown className="w-6 h-6 mb-2 text-cyan-400" />
                        <span className="text-sm font-semibold text-slate-300">{isGeneratingPdf ? 'Gerando...' : 'Salvar PDF'}</span>
                    </button>
                    <button onClick={handleShareWhatsApp} className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                        <MessageSquareText className="w-6 h-6 mb-2 text-cyan-400" />
                        <span className="text-sm font-semibold text-slate-300">WhatsApp</span>
                    </button>
                    <button onClick={handleShareEmail} className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                        <Mail className="w-6 h-6 mb-2 text-cyan-400" />
                        <span className="text-sm font-semibold text-slate-300">E-mail</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

interface SavedDietsProps {
  diets: DietPlan[];
  onDelete: (id: string) => void;
  onUpdateDiet: (plan: DietPlan) => void;
  onAddDiet: (plan: DietPlan) => void;
  onBack: () => void;
}

const SavedDiets: React.FC<SavedDietsProps> = ({ diets, onDelete, onUpdateDiet, onAddDiet, onBack }) => {
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
            <AccordionItem key={plan.id} plan={plan} onDelete={onDelete} onUpdateDiet={onUpdateDiet} onAddDiet={onAddDiet} />
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