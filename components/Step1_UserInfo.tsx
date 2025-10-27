import React, { useState, useEffect, useRef } from 'react';
import { UserData } from '../types';
import { activityLevels } from '../constants';
import { Paperclip, FileText, X } from './icons/FormIcons';

type Goal = 'Emagrecer' | 'Manter Peso' | 'Ganhar Massa';
type GoalKey = 'deficit' | 'maintain' | 'surplus';

const goalMap = new Map<GoalKey, Goal>([
    ['deficit', 'Emagrecer'],
    ['maintain', 'Manter Peso'],
    ['surplus', 'Ganhar Massa']
]);

interface Props {
  onGoToMacroConfig: (data: UserData, targetCalories: number, goal: Goal) => void;
  onPlanDietDirectly: (data: UserData, targetCalories: number, goal: Goal) => void;
  bloodTestFile: { name: string; data: string; } | null;
  onFileUpload: (file: { name: string; data: string; }) => void;
  onFileRemove: () => void;
}

const GoalCard: React.FC<{title: string; description: string; calories: number; onClick: () => void, selected: boolean}> = ({title, description, calories, onClick, selected}) => (
    <div onClick={onClick} className={`p-6 rounded-2xl border-2 cursor-pointer transition-all transform hover:-translate-y-1 ${selected ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-700 bg-slate-800 hover:border-cyan-600'}`}>
        <h3 className="text-xl font-bold text-cyan-400">{title}</h3>
        <p className="text-slate-400 mt-2 mb-4">{description}</p>
        <p className="text-3xl font-bold text-white">{Math.round(calories)} <span className="text-lg font-medium text-slate-400">kcal/dia</span></p>
    </div>
)

const Step1UserInfo: React.FC<Props> = ({ onGoToMacroConfig, onPlanDietDirectly, bloodTestFile, onFileUpload, onFileRemove }) => {
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    weight: '',
    height: '',
    age: '',
    activityLevel: activityLevels[0].value,
  });
  const [error, setError] = useState<string | null>(null);
  const [tdee, setTdee] = useState<number | null>(null);

  const [adjustment, setAdjustment] = useState<number>(300);
  const [goal, setGoal] = useState<GoalKey | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setTdee(null); // Reset TDEE if form data changes
    setGoal(null);
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        alert('Por favor, selecione um arquivo PDF.');
        return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('O arquivo é muito grande. O limite é de 10MB.');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        onFileUpload({ name: file.name, data: reader.result as string });
    };
    reader.readAsDataURL(file);
    
    // Reset file input to allow re-uploading the same file
    event.target.value = '';
  };

  const calculateTdee = () => {
    const { name, gender, weight, height, age, activityLevel } = formData;
     if (!weight || !height || !age || !name) {
        setError('Por favor, preencha todos os campos.');
        return;
    }
    setError(null);

    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    const ageNum = parseInt(age);
    const activityLevelNum = parseFloat(String(activityLevel));

    let bmr = 0;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weightNum) + (4.799 * heightNum) - (5.677 * ageNum);
    } else {
      bmr = 447.593 + (9.247 * weightNum) + (3.098 * heightNum) - (4.330 * ageNum);
    }
    const calculatedTdee = bmr * activityLevelNum;
    setTdee(calculatedTdee);
  }

  const proceed = (action: 'direct' | 'configure') => {
      if(goal && tdee) {
          let targetCalories = tdee;
          if (goal === 'deficit') targetCalories = tdee - adjustment;
          if (goal === 'surplus') targetCalories = tdee + adjustment;

          const { name, gender, weight, height, age, activityLevel } = formData;
          const userData: UserData = { 
              name,
              gender: gender as 'male' | 'female', 
              weight: parseFloat(weight), 
              height: parseFloat(height), 
              age: parseInt(age), 
              activityLevel: parseFloat(String(activityLevel))
            };

          const selectedGoal = goalMap.get(goal)!;

          if (action === 'direct') {
              onPlanDietDirectly(userData, targetCalories, selectedGoal);
          } else {
              onGoToMacroConfig(userData, targetCalories, selectedGoal);
          }
      }
  }

  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 animate-fade-in">
      <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">Vamos Começar!</h2>
      <div className="space-y-6">
        
        <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Seu Nome</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" placeholder="Como podemos te chamar?"/>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Sexo</label>
          <div className="flex gap-4">
            <label className="flex-1 p-4 bg-slate-700/50 rounded-lg cursor-pointer border-2 border-transparent has-[:checked]:border-cyan-500 has-[:checked]:bg-cyan-900/20 transition-all">
              <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleChange} className="sr-only"/>
              <span className="font-semibold text-slate-100">Masculino</span>
            </label>
            <label className="flex-1 p-4 bg-slate-700/50 rounded-lg cursor-pointer border-2 border-transparent has-[:checked]:border-cyan-500 has-[:checked]:bg-cyan-900/20 transition-all">
              <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleChange} className="sr-only"/>
              <span className="font-semibold text-slate-100">Feminino</span>
            </label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-slate-300 mb-2">Peso (kg)</label>
            <input type="number" name="weight" id="weight" value={formData.weight} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" placeholder="ex: 75"/>
          </div>
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-slate-300 mb-2">Altura (cm)</label>
            <input type="number" name="height" id="height" value={formData.height} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" placeholder="ex: 180"/>
          </div>
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-slate-300 mb-2">Idade</label>
            <input type="number" name="age" id="age" value={formData.age} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" placeholder="ex: 30"/>
          </div>
        </div>
        
        <div>
          <label htmlFor="activityLevel" className="block text-sm font-medium text-slate-300 mb-2">Frequência de Treino</label>
          <select name="activityLevel" id="activityLevel" value={formData.activityLevel} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition">
            {activityLevels.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>
        
        <div className="pt-4 border-t border-slate-700">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">Análise Inteligente (Opcional)</h3>
             <p className="text-sm text-slate-400 mb-4">Para uma dieta ainda mais personalizada, anexe seu último exame de sangue em PDF. A IA irá analisá-lo para otimizar suas recomendações.</p>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="application/pdf" />

            {bloodTestFile ? (
                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-green-400" />
                        <span className="text-sm font-medium text-slate-200 truncate">{bloodTestFile.name}</span>
                    </div>
                    <button onClick={onFileRemove} className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-600 hover:border-cyan-500 text-slate-400 hover:text-cyan-400 font-semibold py-3 px-4 rounded-lg transition-all"
                >
                    <Paperclip className="w-5 h-5" />
                    Anexar Exame de Sangue (PDF)
                </button>
            )}
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        
        {!tdee && (
            <button type="button" onClick={calculateTdee} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105">
              Calcular Gasto Calórico e Definir Meta
            </button>
        )}
      </div>
      
      {tdee && (
        <div className="mt-8 pt-6 border-t border-slate-700 animate-fade-in">
             <div className="text-center">
                <h2 className="text-2xl font-bold text-cyan-400 mb-2 pt-8">Seu Gasto Calórico Diário</h2>
                <p className="text-5xl font-bold text-white mb-1">{Math.round(tdee)} <span className="text-2xl font-medium text-slate-400">kcal</span></p>
                <p className="text-xs text-slate-500 mb-4">Cálculo baseado na fórmula de Harris-Benedict para máxima precisão.</p>
                <p className="text-slate-400 mb-8">Este é o número de calorias que seu corpo queima por dia. Agora, escolha seu objetivo.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <GoalCard 
                    title="Emagrecer"
                    description="Déficit calórico para perda de gordura."
                    calories={tdee - adjustment}
                    onClick={() => setGoal('deficit')}
                    selected={goal === 'deficit'}
                />
                 <GoalCard 
                    title="Manter Peso"
                    description="Manutenção das calorias atuais."
                    calories={tdee}
                    onClick={() => setGoal('maintain')}
                    selected={goal === 'maintain'}
                />
                <GoalCard 
                    title="Ganhar Massa"
                    description="Superávit calórico para ganho de músculo."
                    calories={tdee + adjustment}
                    onClick={() => setGoal('surplus')}
                    selected={goal === 'surplus'}
                />
            </div>
             <div className="mb-8">
                <label htmlFor="adjustment" className="block text-sm font-medium text-slate-300 mb-2">Ajuste de Calorias para Emagrecer/Ganhar ({adjustment} kcal)</label>
                <input 
                    type="range" 
                    id="adjustment"
                    min="100" 
                    max="1000" 
                    step="50" 
                    value={adjustment}
                    onChange={(e) => setAdjustment(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
            </div>
             <div className="space-y-4">
                 <button 
                    onClick={() => proceed('direct')} 
                    disabled={!goal}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 disabled:bg-slate-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed disabled:scale-100"
                >
                    Planejar Dieta
                </button>
                 <button 
                    onClick={() => proceed('configure')} 
                    disabled={!goal}
                    className="w-full text-center text-cyan-400 font-semibold py-2 px-4 rounded-lg transition-all hover:bg-cyan-500/10 disabled:text-slate-500 disabled:cursor-not-allowed disabled:bg-transparent"
                >
                    Configurar Macronutrientes
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Step1UserInfo;