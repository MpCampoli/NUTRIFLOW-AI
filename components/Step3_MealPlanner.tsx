import React, { useState, useRef } from 'react';
import { Meal, AiMealConfig } from '../types';
import { foodOptions } from '../constants';
import { PlusCircle, Trash2 } from './icons/EditorIcons';
import { ArrowLeft } from './icons/ArrowLeft';
import { Send, X, Clock } from './icons/ChatIcons';
import { Bot, ListChecks } from './icons/Actions';


interface Props {
  onNext: (config: { mode: 'manual', data: Meal[] } | { mode: 'ai', data: AiMealConfig[] }) => void;
  onBack: () => void;
  initialMeals: Meal[];
  initialAiMeals: AiMealConfig[];
  initialMode: 'manual' | 'ai';
}

const defaultMeals: Meal[] = [
  { id: '1', name: 'Café da Manhã', time: '08:00', carbohydrates: [], proteins: [], fats: [], fruits: [], vegetables: [], supplements: [], customFoods: [] },
  { id: '2', name: 'Almoço', time: '12:30', carbohydrates: [], proteins: [], fats: [], fruits: [], vegetables: [], supplements: [], customFoods: [] },
  { id: '3', name: 'Jantar', time: '19:30', carbohydrates: [], proteins: [], fats: [], fruits: [], vegetables: [], supplements: [], customFoods: [] },
];

const defaultAiMeals: AiMealConfig[] = [
    { id: '1', name: 'Café da Manhã', time: '08:00' },
    { id: '2', name: 'Almoço', time: '12:30' },
    { id: '3', name: 'Lanche da Tarde', time: '16:00' },
    { id: '4', name: 'Jantar', time: '19:30' },
];

const FoodSelector: React.FC<{ 
    category: keyof typeof foodOptions, 
    selected: string[], 
    onChange: (selected: string[]) => void,
    onAddCustomClick: () => void,
}> = ({ category, selected, onChange, onAddCustomClick }) => {
  const options = foodOptions[category];
  const categoryLabels = {
    carbohydrates: 'Carboidratos',
    proteins: 'Proteínas',
    fats: 'Gorduras',
    fruits: 'Frutas',
    vegetables: 'Vegetais e Verduras',
    supplements: 'Suplementos',
  };

  const handleSelect = (option: string) => {
    const newSelection = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option];
    onChange(newSelection);
  };
  
  return (
    <div>
      <h4 className="text-md font-semibold text-cyan-400 mb-2">{categoryLabels[category]}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => handleSelect(option)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-all ${selected.includes(option) ? 'bg-cyan-500 border-cyan-500 text-slate-900 font-semibold' : 'bg-slate-700 border-slate-600 hover:border-cyan-600'}`}
          >
            {option}
          </button>
        ))}
        <button
            type="button"
            onClick={onAddCustomClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border border-dashed border-slate-600 text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-all"
        >
            <PlusCircle className="w-4 h-4" />
            Adicionar
        </button>
      </div>
    </div>
  );
};


const Step3MealPlanner: React.FC<Props> = ({ onNext, onBack, initialMeals, initialAiMeals, initialMode }) => {
  const [mode, setMode] = useState<'manual' | 'ai'>(initialMode);
  
  // State for Manual Mode
  const [meals, setMeals] = useState<Meal[]>(initialMeals.length > 0 ? initialMeals : defaultMeals);
  const [customFoodInput, setCustomFoodInput] = useState<{ [key: string]: string }>({});
  const customInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // State for AI Mode
  const [aiMeals, setAiMeals] = useState<AiMealConfig[]>(initialAiMeals.length > 0 ? initialAiMeals : defaultAiMeals);


  // --- Manual Mode Functions ---
  const addMeal = () => {
    const newMeal: Meal = { id: Date.now().toString(), name: `Nova Refeição`, time: '21:00', carbohydrates: [], proteins: [], fats: [], fruits: [], vegetables: [], supplements:[], customFoods: [] };
    setMeals([...meals, newMeal]);
  };
  const removeMeal = (id: string) => setMeals(meals.filter(meal => meal.id !== id));
  const updateMeal = <K extends keyof Meal>(id: string, key: K, value: Meal[K]) => {
    setMeals(meals.map(meal => meal.id === id ? { ...meal, [key]: value } : meal));
  }
  const handleCustomInputChange = (mealId: string, value: string) => {
    setCustomFoodInput(prev => ({ ...prev, [mealId]: value }));
  };
  const addCustomFood = (mealId: string) => {
    const foodToAdd = customFoodInput[mealId];
    if (foodToAdd && foodToAdd.trim() !== '') {
      const meal = meals.find(m => m.id === mealId);
      if (meal) {
        const updatedCustomFoods = [...meal.customFoods, foodToAdd.trim()];
        updateMeal(mealId, 'customFoods', updatedCustomFoods);
        handleCustomInputChange(mealId, ''); // Clear input
      }
    }
  };
  const removeCustomFood = (mealId: string, foodToRemove: string) => {
    const meal = meals.find(m => m.id === mealId);
    if (meal) {
        const updatedCustomFoods = meal.customFoods.filter(food => food !== foodToRemove);
        updateMeal(mealId, 'customFoods', updatedCustomFoods);
    }
  };

  // --- AI Mode Functions ---
    const addAiMeal = () => {
        const newMeal: AiMealConfig = { id: Date.now().toString(), name: 'Nova Refeição', time: '21:00' };
        setAiMeals([...aiMeals, newMeal]);
    };
    const removeAiMeal = (id: string) => setAiMeals(aiMeals.filter(meal => meal.id !== id));
    const updateAiMeal = (id: string, field: 'name' | 'time', value: string) => {
        setAiMeals(aiMeals.map(meal => meal.id === id ? { ...meal, [field]: value } : meal));
    };

  const handleSubmit = () => {
    if (mode === 'manual') {
        onNext({ mode: 'manual', data: meals });
    } else {
        onNext({ mode: 'ai', data: aiMeals });
    }
  };

  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 animate-fade-in relative">
      <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Voltar
      </button>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6 pt-8">Planeje suas Refeições</h2>
        <div className="inline-flex bg-slate-700/50 p-1 rounded-lg">
            <button onClick={() => setMode('manual')} className={`px-4 py-2 rounded-md transition-colors font-semibold flex items-center gap-2 ${mode === 'manual' ? 'bg-cyan-500 text-slate-900' : 'text-slate-400 hover:bg-slate-700'}`}>
                <ListChecks className="w-5 h-5" />
                Selecionar Alimentos
            </button>
            <button onClick={() => setMode('ai')} className={`px-4 py-2 rounded-md transition-colors font-semibold flex items-center gap-2 ${mode === 'ai' ? 'bg-cyan-500 text-slate-900' : 'text-slate-400 hover:bg-slate-700'}`}>
                <Bot className="w-5 h-5" />
                Gerar com IA
            </button>
        </div>
      </div>
      
      {mode === 'manual' ? (
        // --- MANUAL MODE UI ---
        <div>
          <p className="text-center text-slate-400 mb-8 -mt-4">Defina suas refeições, horários e selecione os alimentos que você gosta.</p>
          <div className="space-y-4 mb-8">
            {meals.map((meal) => (
              <div key={meal.id} className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                      <input
                          type="text"
                          value={meal.name}
                          onChange={(e) => updateMeal(meal.id, 'name', e.target.value)}
                          className="flex-1 w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                          placeholder="Nome da Refeição"
                      />
                      <div className="relative w-full sm:w-auto">
                         <Clock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                          <input
                              type="time"
                              value={meal.time}
                              onChange={(e) => updateMeal(meal.id, 'time', e.target.value)}
                              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                          />
                      </div>
                      {meals.length > 1 && <button onClick={() => removeMeal(meal.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors self-end sm:self-center">
                          <Trash2 className="w-5 h-5" />
                      </button>}
                  </div>
                  <div className="space-y-4 border-t border-slate-700 pt-4">
                      <FoodSelector category="carbohydrates" selected={meal.carbohydrates} onChange={(s) => updateMeal(meal.id, 'carbohydrates', s)} onAddCustomClick={() => customInputRefs.current[meal.id]?.focus()} />
                      <FoodSelector category="proteins" selected={meal.proteins} onChange={(s) => updateMeal(meal.id, 'proteins', s)} onAddCustomClick={() => customInputRefs.current[meal.id]?.focus()}/>
                      <FoodSelector category="fats" selected={meal.fats} onChange={(s) => updateMeal(meal.id, 'fats', s)} onAddCustomClick={() => customInputRefs.current[meal.id]?.focus()}/>
                      <FoodSelector category="fruits" selected={meal.fruits} onChange={(s) => updateMeal(meal.id, 'fruits', s)} onAddCustomClick={() => customInputRefs.current[meal.id]?.focus()}/>
                      <FoodSelector category="vegetables" selected={meal.vegetables} onChange={(s) => updateMeal(meal.id, 'vegetables', s)} onAddCustomClick={() => customInputRefs.current[meal.id]?.focus()}/>
                      <FoodSelector category="supplements" selected={meal.supplements} onChange={(s) => updateMeal(meal.id, 'supplements', s)} onAddCustomClick={() => customInputRefs.current[meal.id]?.focus()}/>
                  </div>
                  <div className="mt-6 border-t border-slate-700 pt-4">
                      <h4 className="text-md font-semibold text-slate-300 mb-2">Adicionar Alimento Personalizado</h4>
                      <div className="flex items-center gap-2">
                          <input
                          type="text"
                          ref={el => { customInputRefs.current[meal.id] = el; }}
                          value={customFoodInput[meal.id] || ''}
                          onChange={(e) => handleCustomInputChange(meal.id, e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addCustomFood(meal.id)}
                          placeholder="Ex: 1 bombom, 1 fatia de bolo"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                          />
                          <button onClick={() => addCustomFood(meal.id)} className="p-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
                              <Send className="w-5 h-5" />
                          </button>
                      </div>
                      {meal.customFoods.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                              {meal.customFoods.map((food, index) => (
                              <span key={index} className="flex items-center gap-2 bg-yellow-400/20 text-yellow-300 text-sm font-medium px-2.5 py-1 rounded-full">
                                  {food}
                                  <button onClick={() => removeCustomFood(meal.id, food)} className="text-yellow-400 hover:text-white">
                                      <X className="w-4 h-4" />
                                  </button>
                              </span>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addMeal} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-600 hover:border-cyan-500 text-slate-400 hover:text-cyan-400 font-semibold py-3 px-4 rounded-lg transition-all mb-4">
            <PlusCircle className="w-5 h-5" /> Adicionar Refeição
          </button>
        </div>
      ) : (
        // --- AI MODE UI ---
        <div>
            <p className="text-center text-slate-400 mb-8 -mt-4">Defina os nomes e horários das suas refeições. A IA criará a dieta completa para você.</p>
            <div className="space-y-4 mb-6">
                {aiMeals.map(meal => (
                    <div key={meal.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center gap-4">
                        <input
                           type="text"
                           value={meal.name}
                           onChange={e => updateAiMeal(meal.id, 'name', e.target.value)}
                           placeholder="Nome da Refeição"
                           className="flex-1 w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                       />
                       <div className="relative w-full sm:w-auto">
                          <Clock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                           <input
                               type="time"
                               value={meal.time}
                               onChange={e => updateAiMeal(meal.id, 'time', e.target.value)}
                               className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                           />
                       </div>
                        {aiMeals.length > 1 && <button onClick={() => removeAiMeal(meal.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors self-end sm:self-center">
                            <Trash2 className="w-5 h-5" />
                        </button>}
                    </div>
                ))}
            </div>
            <button type="button" onClick={addAiMeal} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-600 hover:border-cyan-500 text-slate-400 hover:text-cyan-400 font-semibold py-3 px-4 rounded-lg transition-all mb-4">
                <PlusCircle className="w-5 h-5" /> Adicionar Refeição
            </button>
        </div>
      )}

        <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105"
        >
            Gerar Minha Dieta com IA
        </button>
    </div>
  );
};

export default Step3MealPlanner;