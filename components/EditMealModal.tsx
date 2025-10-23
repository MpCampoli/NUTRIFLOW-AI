import React, { useState, useEffect } from 'react';
import { DietMeal, FoodItem } from '../types';
import { X, Send } from './icons/ChatIcons';
import { Trash2 } from './icons/EditorIcons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  meal: DietMeal | null;
  onSave: (updatedMeal: DietMeal) => void;
}

const EditMealModal: React.FC<Props> = ({ isOpen, onClose, meal, onSave }) => {
  const [editedFoods, setEditedFoods] = useState<FoodItem[]>([]);
  const [newFoodName, setNewFoodName] = useState('');

  useEffect(() => {
    if (meal) {
      setEditedFoods(meal.foods);
    }
  }, [meal]);

  if (!isOpen || !meal) return null;

  const handleRemoveFood = (index: number) => {
    setEditedFoods(editedFoods.filter((_, i) => i !== index));
  };

  const handleAddFood = () => {
    if (newFoodName.trim()) {
      const newFood: FoodItem = {
        name: newFoodName.trim(),
        quantity_grams: 0,
        unit_description: 'Adicionado manualmente'
      };
      setEditedFoods([...editedFoods, newFood]);
      setNewFoodName('');
    }
  };

  const handleSave = () => {
    onSave({
      ...meal,
      foods: editedFoods,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-cyan-400">Editar {meal.meal_name}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700">
            <X className="w-6 h-6" />
          </button>
        </header>
        
        <main className="p-6 overflow-y-auto flex-1">
          <h3 className="font-semibold text-slate-300 mb-2">Alimentos Atuais</h3>
          {editedFoods.length > 0 ? (
            <ul className="space-y-2 mb-6">
              {editedFoods.map((food, index) => (
                <li key={index} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                  <span className="text-slate-200">{food.name}</span>
                  <div className="flex items-center gap-2">
                     <span className="text-sm text-slate-400">
                        {food.quantity_grams === 0 ? food.unit_description : `${Math.round(food.quantity_grams)}g`}
                     </span>
                    <button onClick={() => handleRemoveFood(index)} className="p-1 text-slate-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-center py-4">Nenhum alimento nesta refeição.</p>
          )}

          <div className="border-t border-slate-700 pt-4">
            <h3 className="font-semibold text-slate-300 mb-2">Adicionar Novo Alimento</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newFoodName}
                onChange={(e) => setNewFoodName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddFood()}
                placeholder="Ex: Maçã (1 unidade)"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
              />
              <button onClick={handleAddFood} className="p-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>

        <footer className="p-4 border-t border-slate-700">
          <button 
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
          >
            Salvar Alterações
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EditMealModal;