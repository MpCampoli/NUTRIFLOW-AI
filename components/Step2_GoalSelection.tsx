import React, { useState, useEffect } from 'react';
import { ArrowLeft } from './icons/ArrowLeft';
import { UserData, MacroTargets } from '../types';
import { Drumstick, Zap, Activity } from './icons/Macros';

interface Props {
  userData: UserData;
  targetCalories: number;
  onNext: (targets: MacroTargets) => void;
  onBack: () => void;
}

export const defaultTargets: MacroTargets = {
    protein: 2.0,
    carbs: 0, 
    fat: 0.8,
};

const Step2_MacroConfig: React.FC<Props> = ({ userData, targetCalories, onNext, onBack }) => {
    const [proteinPerKg, setProteinPerKg] = useState(defaultTargets.protein);
    const [fatPerKg, setFatPerKg] = useState(defaultTargets.fat);
    const [carbsPerKg, setCarbsPerKg] = useState(0);

    const [totalProtein, setTotalProtein] = useState(0);
    const [totalFat, setTotalFat] = useState(0);
    const [totalCarbs, setTotalCarbs] = useState(0);
    
    useEffect(() => {
        const proteinGrams = proteinPerKg * userData.weight;
        const fatGrams = fatPerKg * userData.weight;

        const proteinCalories = proteinGrams * 4;
        const fatCalories = fatGrams * 9;
        
        const carbCalories = targetCalories - proteinCalories - fatCalories;
        const carbGrams = Math.max(0, carbCalories / 4);
        
        setTotalProtein(proteinGrams);
        setTotalFat(fatGrams);
        setTotalCarbs(carbGrams);
        setCarbsPerKg(carbGrams / userData.weight);

    }, [proteinPerKg, fatPerKg, userData, targetCalories]);

    const handleSubmit = () => {
        onNext({
            protein: proteinPerKg,
            fat: fatPerKg,
            carbs: carbsPerKg,
        });
    }

    const resetDefaults = () => {
        setProteinPerKg(defaultTargets.protein);
        setFatPerKg(defaultTargets.fat);
    }

  return (
    <div className="card-style p-8 rounded-2xl shadow-lg animate-fade-in text-center relative">
       <button onClick={onBack} className="absolute top-6 left-6 text-gray-500 hover:text-accent-green transition-colors flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Voltar
        </button>
      <h2 className="text-2xl font-bold text-accent-green mb-2 pt-8">Configure seus Macronutrientes</h2>
      <p className="text-gray-600 mb-8">Ajuste as metas de proteína e gordura. Os carboidratos serão calculados automaticamente para atingir sua meta calórica de <strong className="text-primary-dark">{Math.round(targetCalories)} kcal</strong>.</p>
      
      <div className="space-y-6 mb-8 text-left">
          <div>
              <label htmlFor="protein" className="block text-sm font-medium text-gray-700 mb-2">Proteína ({proteinPerKg.toFixed(1)} g/kg)</label>
              <input 
                type="range" 
                id="protein"
                min="1.2" 
                max="3.0" 
                step="0.1" 
                value={proteinPerKg}
                onChange={(e) => setProteinPerKg(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
          </div>
          <div>
              <label htmlFor="fat" className="block text-sm font-medium text-gray-700 mb-2">Gordura ({fatPerKg.toFixed(1)} g/kg)</label>
              <input 
                type="range" 
                id="fat"
                min="0.5" 
                max="1.5" 
                step="0.1" 
                value={fatPerKg}
                onChange={(e) => setFatPerKg(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
          </div>
      </div>

      <div className="p-6 bg-primary-light rounded-xl border border-ui-border mb-8">
            <h3 className="text-xl font-semibold mb-4 text-primary-dark text-center">Metas Diárias Totais</h3>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 p-4 rounded-xl bg-ui-bg-opaque flex items-center gap-4">
                    <div className="p-2 rounded-full bg-red-400"><Drumstick className="w-6 h-6 text-white"/></div>
                    <div><p className="text-sm text-gray-600">Proteínas</p><p className="text-xl font-bold text-primary-dark">{Math.round(totalProtein)} g</p></div>
                </div>
                 <div className="flex-1 p-4 rounded-xl bg-ui-bg-opaque flex items-center gap-4">
                    <div className="p-2 rounded-full bg-accent-green"><Activity className="w-6 h-6 text-white"/></div>
                    <div><p className="text-sm text-gray-600">Carboidratos</p><p className="text-xl font-bold text-primary-dark">{Math.round(totalCarbs)} g</p></div>
                </div>
                 <div className="flex-1 p-4 rounded-xl bg-ui-bg-opaque flex items-center gap-4">
                    <div className="p-2 rounded-full bg-yellow-400"><Zap className="w-6 h-6 text-white"/></div>
                    <div><p className="text-sm text-gray-600">Gorduras</p><p className="text-xl font-bold text-primary-dark">{Math.round(totalFat)} g</p></div>
                </div>
            </div>
      </div>
        <div className="flex flex-col md:flex-row gap-4">
            <button
                type="button"
                onClick={resetDefaults}
                className="w-full border-2 border-ui-border hover:border-accent-green text-gray-700 hover:text-accent-green font-semibold py-3 px-4 rounded-lg transition-all"
            >
                Usar Padrão
            </button>
            <button 
                onClick={handleSubmit} 
                className="w-full bg-accent-green hover:bg-accent-green-dark text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105"
            >
                Planejar Refeições
            </button>
        </div>
    </div>
  );
};

export default Step2_MacroConfig;
