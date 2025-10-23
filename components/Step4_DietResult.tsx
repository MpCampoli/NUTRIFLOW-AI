import React, { useEffect, useState, useRef } from 'react';
import { UserData, DietPlan, MacroTargets, DietMeal } from '../types';
import { generateDietPlan, PlannerConfig } from '../services/geminiService';
import { Zap, Activity, Flame, Drumstick } from './icons/Macros';
import { ArrowLeft } from './icons/ArrowLeft';
import { Droplets, BedDouble, Info } from './icons/Recommendations';
import { Save, FileDown, Mail, MessageSquareText } from './icons/Actions';
import { Pencil } from './icons/EditorIcons';
import EditMealModal from './EditMealModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface Props {
  userData: UserData;
  targetCalories: number;
  goal: string;
  macroTargets: MacroTargets;
  plannerConfig: PlannerConfig;
  dietPlan: DietPlan | null;
  setDietPlan: React.Dispatch<React.SetStateAction<DietPlan | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  onReset: () => void;
  onBack: () => void;
  onSaveDiet: (plan: DietPlan) => void;
  savedDietIds: string[];
}

const LoadingIndicator: React.FC<{isRecalculating?: boolean}> = ({isRecalculating = false}) => (
    <div className="text-center p-8">
        <div className="animate-pulse">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">{isRecalculating ? "A IA está recalculando..." : "A IA está pensando..."}</h2>
            <p className="text-slate-400">{isRecalculating ? "Estamos ajustando o restante da sua dieta para incorporar suas edições e manter suas metas. Só um momento." : "Estamos montando o plano de dieta perfeito para você, considerando suas escolhas e itens extras. Isso pode levar um momento."}</p>
            <div className="mt-6 space-y-4">
                <div className="h-24 bg-slate-700/50 rounded-lg"></div>
                <div className="h-24 bg-slate-700/50 rounded-lg"></div>
                <div className="h-24 bg-slate-700/50 rounded-lg"></div>
            </div>
        </div>
    </div>
);

const MacroCard: React.FC<{ icon: React.ReactNode; label: string; value: number; unit: string; color: string }> = ({ icon, label, value, unit, color }) => (
    <div className={`flex-1 p-4 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-4`}>
        <div className={`p-2 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="text-xl font-bold text-white">{Math.round(value)} <span className="text-base font-normal">{unit}</span></p>
        </div>
    </div>
);

const Step4DietResult: React.FC<Props> = ({
  userData,
  targetCalories,
  goal,
  macroTargets,
  plannerConfig,
  dietPlan,
  setDietPlan,
  isLoading,
  setIsLoading,
  error,
  setError,
  onReset,
  onBack,
  onSaveDiet,
  savedDietIds,
}) => {
  const [displayedPlan, setDisplayedPlan] = useState<DietPlan | null>(null);
  const [isEdited, setIsEdited] = useState(false);
  const [editingMeal, setEditingMeal] = useState<DietMeal | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);


  const [isSaved, setIsSaved] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const dietPlanRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (dietPlan) {
      setDisplayedPlan(dietPlan);
      if (savedDietIds.includes(dietPlan.id)) {
        setIsSaved(true);
      }
    }
  }, [dietPlan, savedDietIds]);
  
  useEffect(() => {
    const fetchDietPlan = async () => {
      if (!macroTargets) {
          setError("As metas de macronutrientes não foram definidas.");
          return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const plan = await generateDietPlan(userData, targetCalories, macroTargets, goal, plannerConfig);
        setDietPlan(plan);
      } catch (e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('An unknown error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!dietPlan) {
      fetchDietPlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const waterIntake = ((userData.weight * 50) / 1000).toFixed(1);

  const handleSaveDiet = () => {
    if (displayedPlan) {
        const planToSave: DietPlan = {
            ...displayedPlan,
            userData,
            originalMeals: plannerConfig.data,
            macroTargets,
            plannerMode: plannerConfig.mode,
        };
        onSaveDiet(planToSave);
        setIsSaved(true);
        setIsEdited(false); // Mark as saved and not edited
    }
  }
  
  const handleRecalculateAfterEdit = async (updatedMeal: DietMeal) => {
    if (!displayedPlan) return;

    // Immediately close the modal
    setEditingMeal(null);
    setIsRecalculating(true);
    setError(null);

    // Create the full list of meals with the user's update
    const mealsForRecalculation = displayedPlan.meals.map(m =>
        m.meal_name === updatedMeal.meal_name ? updatedMeal : m
    );

    try {
        const newPlan = await generateDietPlan(
            userData,
            targetCalories,
            macroTargets,
            goal,
            plannerConfig,
            mealsForRecalculation // Pass the edited meals as a hard constraint
        );

        setDietPlan(newPlan);
        setIsEdited(true); // The new plan is now "edited" compared to what's saved
        setIsSaved(false); // It's a new plan, so it needs to be saved again

    } catch (e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('An unknown error occurred during recalculation.');
        }
    } finally {
        setIsRecalculating(false);
    }
  };
  
  const handleGeneratePdf = () => {
    const input = dietPlanRef.current;
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
            
            pdf.save(`Plano-Dieta-${userData.name.replace(/\s/g, '_')}.pdf`);
            setIsGeneratingPdf(false);
        }).catch(() => {
            setIsGeneratingPdf(false);
            alert("Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.");
        });
    }
  };

  const generateShareText = () => {
      if (!displayedPlan) return '';
      const { daily_totals, meals, recommendations } = displayedPlan;
      
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
      
      text += `\n*--- RECOMENDAÇÕES ---*\n`;
        recommendations.forEach(rec => {
          text += `• ${rec}\n`;
      });
      text += `• Beba pelo menos ${waterIntake} litros de água por dia.\n`;

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


  if (isLoading || isRecalculating) {
    return <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 animate-fade-in"><LoadingIndicator isRecalculating={isRecalculating} /></div>;
  }
  
  if (error) {
    return (
      <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 animate-fade-in text-center relative">
         <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Voltar
        </button>
        <h2 className="text-2xl font-bold text-red-400 mb-4 pt-8">Ocorreu um Erro</h2>
        <p className="text-slate-300 mb-6">{error}</p>
        <button onClick={onReset} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all">
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!displayedPlan || !displayedPlan.daily_totals || !displayedPlan.meals || displayedPlan.meals.some(m => !m.totals || !m.foods)) {
    return (
      <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 animate-fade-in text-center relative">
        <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Voltar
        </button>
        <h2 className="text-2xl font-bold text-red-400 mb-4 pt-8">Ocorreu um Erro de Formato</h2>
        <p className="text-slate-300 mb-6">A IA retornou um plano de dieta em um formato inesperado. Por favor, tente novamente.</p>
        <button onClick={onReset} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-4 sm:p-8 rounded-2xl shadow-lg border border-slate-700 animate-fade-in relative">
        <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Voltar
        </button>
        
        <div ref={dietPlanRef} className="p-4 bg-slate-800">
            <h2 className="text-3xl font-bold text-cyan-400 mb-4 text-center pt-8">Seu Plano de {goal}, {userData.name}!</h2>
            
            {isEdited && (
              <div className="my-4 p-4 bg-yellow-400/10 border border-yellow-500 rounded-lg text-center">
                  <p className="text-yellow-300 text-sm">
                      Você modificou este plano. Salve as alterações para mantê-las.
                  </p>
              </div>
            )}

            <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-700 mb-8">
                <h3 className="text-xl font-semibold mb-4 text-white text-center">Resumo Diário</h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <MacroCard icon={<Flame className="w-6 h-6 text-slate-900"/>} label="Calorias" value={displayedPlan.daily_totals.calories} unit="kcal" color="bg-orange-400" />
                    <MacroCard icon={<Drumstick className="w-6 h-6 text-slate-900"/>} label="Proteínas" value={displayedPlan.daily_totals.protein_grams} unit="g" color="bg-red-400" />
                    <MacroCard icon={<Activity className="w-6 h-6 text-slate-900"/>} label="Carboidratos" value={displayedPlan.daily_totals.carbohydrates_grams} unit="g" color="bg-cyan-400" />
                    <MacroCard icon={<Zap className="w-6 h-6 text-slate-900"/>} label="Gorduras" value={displayedPlan.daily_totals.fat_grams} unit="g" color="bg-yellow-400" />
                </div>
            </div>

            <div className="my-8 p-4 bg-slate-900/50 rounded-xl border border-cyan-500/20 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="p-3 bg-cyan-500/10 rounded-full">
                    <Droplets className="w-8 h-8 text-cyan-400"/>
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-lg text-white">Lembrete de Hidratação</h4>
                    <p className="text-slate-400">Para otimizar sua saúde e performance, sua meta diária de água é de <strong className="text-cyan-300 font-bold">{waterIntake} litros</strong>.</p>
                </div>
            </div>

            <div className="space-y-6">
                {displayedPlan.meals.map((meal, index) => (
                    <div key={index} className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">{meal.meal_name}</h3>
                            <button onClick={() => setEditingMeal(meal)} className="flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors py-1 px-3 rounded-lg hover:bg-cyan-500/10">
                                <Pencil className="w-4 h-4" />
                                Editar
                            </button>
                        </div>
                        <ul className="divide-y divide-slate-700">
                        {meal.foods.map((food, foodIndex) => {
                            const isSupplement = food.quantity_grams === 0 && food.unit_description && food.unit_description !== 'À vontade';
                            const isVegetable = food.quantity_grams === 0 && food.unit_description === 'À vontade';
                            
                            return (
                                <li key={foodIndex} className="flex justify-between items-center py-3">
                                    <span className="text-slate-300">{food.name}</span>
                                    <span className="font-semibold text-cyan-400 text-right">
                                        {isVegetable ? (
                                            'À vontade'
                                        ) : isSupplement ? (
                                            food.unit_description
                                        ) : (
                                            <>
                                                {Math.round(food.quantity_grams)}g
                                                {food.unit_description && food.unit_description !== 'Adicionado manualmente' && <span className="block text-xs text-slate-400 font-normal">({food.unit_description})</span>}
                                                {food.unit_description === 'Adicionado manualmente' && <span className="block text-xs text-yellow-400 font-normal">(Adicionado)</span>}

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

            <div className="mt-8 p-6 bg-slate-900/50 rounded-xl border border-slate-700">
                <h3 className="text-xl font-semibold mb-4 text-white text-center">Recomendações Importantes</h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-purple-500/20 rounded-full mt-1"><BedDouble className="w-5 h-5 text-purple-400"/></div>
                        <div>
                            <h4 className="font-semibold text-slate-200">Descanso Adequado</h4>
                            <p className="text-slate-400">Durma de 7 a 9 horas por noite. O sono é crucial para a recuperação muscular e equilíbrio hormonal.</p>
                        </div>
                    </div>
                    {displayedPlan.recommendations?.map((rec, index) => (
                        <div className="flex items-start gap-4" key={index}>
                            <div className="p-2 bg-green-500/20 rounded-full mt-1"><Info className="w-5 h-5 text-green-400"/></div>
                            <div>
                                <p className="text-slate-400">{rec}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        
        <div className="mt-8 p-6 bg-slate-900/50 rounded-xl border border-slate-700">
            <h3 className="text-xl font-semibold mb-4 text-white text-center">Ações</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <button onClick={handleSaveDiet} disabled={isSaved && !isEdited} className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <Save className={`w-6 h-6 mb-2 ${isSaved && !isEdited ? 'text-green-400' : 'text-cyan-400'}`} />
                    <span className="text-sm font-semibold text-slate-300">{isSaved && !isEdited ? 'Salvo!' : 'Salvar Dieta'}</span>
                </button>
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

        <button onClick={onReset} className="w-full mt-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all">
            Começar de Novo
        </button>

        <EditMealModal
            isOpen={!!editingMeal}
            onClose={() => setEditingMeal(null)}
            meal={editingMeal}
            onSave={handleRecalculateAfterEdit}
        />
    </div>
  );
};

export default Step4DietResult;