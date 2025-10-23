
import React, { useState, useEffect } from 'react';
import { UserData, Meal, DietPlan, MacroTargets, User, AiMealConfig } from './types';
import Step1UserInfo from './components/Step1_UserInfo';
import Step2MacroConfig, { defaultTargets } from './components/Step2_GoalSelection';
import Step3MealPlanner from './components/Step3_MealPlanner';
import Step4DietResult from './components/Step4_DietResult';
import SavedDiets from './components/SavedDiets';
import UserProfile from './components/UserProfile';
import ChatBot from './components/ChatBot';
import { BrainCircuit } from './components/icons/BrainCircuit';
import { Archive } from './components/icons/Archive';
import { NotificationIcon, ProfileIcon } from './components/icons/AppBarIcons';
import Login from './components/Login';
import Register from './components/Register';
import PasswordRecovery from './components/PasswordRecovery';
import { FingerprintIcon } from './components/icons/AuthIcons';

const BiometricAuthScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
    <div className="animate-pulse">
      <FingerprintIcon className="w-20 h-20 text-cyan-400 mx-auto" />
      <p className="text-xl text-slate-300 mt-4">Autenticando...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  type Step = 'userInfo' | 'macroConfig' | 'planner' | 'result' | 'savedDietsView' | 'userProfile';
  type Goal = 'Emagrecer' | 'Manter Peso' | 'Ganhar Massa';
  type AuthView = 'login' | 'register' | 'recovery';
  type PlannerMode = 'manual' | 'ai';
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isAuthenticatingBiometric, setIsAuthenticatingBiometric] = useState(true);


  const [step, setStep] = useState<Step>('userInfo');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [targetCalories, setTargetCalories] = useState<number>(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [macroTargets, setMacroTargets] = useState<MacroTargets | null>(null);
  
  const [plannerMode, setPlannerMode] = useState<PlannerMode>('manual');
  const [meals, setMeals] = useState<Meal[]>([]); // For manual mode
  const [aiMealConfig, setAiMealConfig] = useState<AiMealConfig[]>([]); // For AI mode

  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [savedDiets, setSavedDiets] = useState<DietPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for active session or remembered user with biometrics
    try {
      const sessionEmail = localStorage.getItem('nutriflow_session');
      if (sessionEmail) {
        const users: User[] = JSON.parse(localStorage.getItem('nutriflow_users') || '[]');
        const user = users.find(u => u.email === sessionEmail);
        if (user) {
          setCurrentUser(user);
        }
        setIsAuthenticatingBiometric(false);
        return;
      }
      
      const rememberedEmail = localStorage.getItem('nutriflow_remembered_user');
      if (rememberedEmail) {
          const users: User[] = JSON.parse(localStorage.getItem('nutriflow_users') || '[]');
          const user = users.find(u => u.email === rememberedEmail);
          if (user?.biometricsEnabled) {
              // Start biometric simulation
              setTimeout(() => {
                  handleLogin(user); // Log the user in
                  setIsAuthenticatingBiometric(false);
              }, 1500); // Simulate 1.5s scan
              return; // Keep showing the auth screen
          }
      }
      // If no session and no biometric user, stop loading and show login page
      setIsAuthenticatingBiometric(false);

    } catch (err) {
      console.error("Failed to load session:", err);
      setCurrentUser(null);
      localStorage.removeItem('nutriflow_session');
      localStorage.removeItem('nutriflow_remembered_user');
      setIsAuthenticatingBiometric(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      try {
        const storedDiets = localStorage.getItem(`nutriflow_saved_diets_${currentUser.id}`);
        if (storedDiets) {
          setSavedDiets(JSON.parse(storedDiets));
        } else {
          setSavedDiets([]);
        }
      } catch (err) {
        console.error("Failed to load saved diets:", err);
        setSavedDiets([]);
      }
    }
  }, [currentUser]);

  // FIX: Define the handleReset function to clear diet-related state.
  const handleReset = () => {
    setStep('userInfo');
    setUserData(null);
    setTargetCalories(0);
    setGoal(null);
    setMacroTargets(null);
    setPlannerMode('manual');
    setMeals([]);
    setAiMealConfig([]);
    setDietPlan(null);
    setIsLoading(false);
    setError(null);
  };

  const persistSavedDiets = (diets: DietPlan[]) => {
    if (currentUser) {
      try {
        localStorage.setItem(`nutriflow_saved_diets_${currentUser.id}`, JSON.stringify(diets));
      } catch (err) {
        console.error("Failed to save diets:", err);
      }
    }
  }

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('nutriflow_session', user.email);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('nutriflow_session');
    // We don't remove `nutriflow_remembered_user` on logout
    setAuthView('login');
    handleReset(); // Clear diet-related state
  };

  const handleUpdateProfile = (updatedData: Partial<User>) => {
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...updatedData };
    setCurrentUser(updatedUser);

    try {
      const users: User[] = JSON.parse(localStorage.getItem('nutriflow_users') || '[]');
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      if (userIndex > -1) {
        users[userIndex] = updatedUser;
        localStorage.setItem('nutriflow_users', JSON.stringify(users));
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  const handleGoToMacroConfig = (data: UserData, calories: number, selectedGoal: Goal) => {
    setUserData(data);
    setTargetCalories(calories);
    setGoal(selectedGoal);
    setStep('macroConfig');
  };

  const handlePlanDietDirectly = (data: UserData, calories: number, selectedGoal: Goal) => {
    setUserData(data);
    setTargetCalories(calories);
    setGoal(selectedGoal);
    setMacroTargets(defaultTargets); // Use default targets
    setPlannerMode('ai'); // Default to AI mode for direct planning
    setAiMealConfig([]); // Reset AI meal config
    setMeals([]); // Reset manual meal config
    setDietPlan(null); // Clear any previous diet plan
    setStep('planner');
  };

  const handleGoToPlanner = (targets: MacroTargets) => {
    setMacroTargets(targets);
    setStep('planner');
  };

  const handleGenerateDiet = (plannerConfig: { mode: 'manual', data: Meal[] } | { mode: 'ai', data: AiMealConfig[] }) => {
    if (plannerConfig.mode === 'manual') {
      setPlannerMode('manual');
      setMeals(plannerConfig.data);
      setAiMealConfig([]);
    } else {
      setPlannerMode('ai');
      setAiMealConfig(plannerConfig.data);
      setMeals([]);
    }
    setDietPlan(null); // Clear previous plan to trigger regeneration
    setStep('result');
  };
  
  const handleSaveDiet = (plan: DietPlan) => {
    const isAlreadySaved = savedDiets.some(d => d.id === plan.id);
    let newDiets;
    if (isAlreadySaved) {
      // Update existing diet
      newDiets = savedDiets.map(d => d.id === plan.id ? plan : d);
    } else {
      // Add new diet
      newDiets = [...savedDiets, plan];
    }
    setSavedDiets(newDiets);
    persistSavedDiets(newDiets);
  };

  const handleDeleteDiet = (id: string) => {
    const newDiets = savedDiets.filter(d => d.id !== id);
    setSavedDiets(newDiets);
    persistSavedDiets(newDiets);
  };

  const handleUpdateDiet = (updatedPlan: DietPlan) => {
    const newDiets = savedDiets.map(d => d.id === updatedPlan.id ? updatedPlan : d);
    setSavedDiets(newDiets);
    persistSavedDiets(newDiets);
  }

  const handleAddDiet = (newPlan: DietPlan) => {
    const newDiets = [...savedDiets, newPlan];
    setSavedDiets(newDiets);
    persistSavedDiets(newDiets);
  }

  const renderAuth = () => {
    if(isAuthenticatingBiometric) return <BiometricAuthScreen />;

    switch (authView) {
      case 'register':
        return <Register onRegisterSuccess={() => setAuthView('login')} onNavigateToLogin={() => setAuthView('login')} />;
      case 'recovery':
        return <PasswordRecovery onNavigateToLogin={() => setAuthView('login')} />;
      case 'login':
      default:
        return <Login onLoginSuccess={handleLogin} onNavigateToRegister={() => setAuthView('register')} onNavigateToRecovery={() => setAuthView('recovery')} />;
    }
  };


  const renderContent = () => {
    switch (step) {
      case 'userInfo':
        return <Step1UserInfo currentUser={currentUser!} onGoToMacroConfig={handleGoToMacroConfig} onPlanDietDirectly={handlePlanDietDirectly}/>;
      case 'macroConfig':
        if (!userData || !goal) return null; // Should not happen
        return <Step2MacroConfig userData={userData} targetCalories={targetCalories} onNext={handleGoToPlanner} onBack={() => setStep('userInfo')} />;
      case 'planner':
        return <Step3MealPlanner 
                  onNext={handleGenerateDiet} 
                  onBack={() => setStep('macroConfig')} 
                  initialMeals={meals}
                  initialAiMeals={aiMealConfig}
                  initialMode={plannerMode}
                />;
      case 'result':
        if (!userData || !macroTargets || !goal) return null; // Should not happen
        return (
          <Step4DietResult
            userData={userData}
            targetCalories={targetCalories}
            goal={goal}
            macroTargets={macroTargets}
            plannerConfig={plannerMode === 'manual' ? { mode: 'manual', data: meals } : { mode: 'ai', data: aiMealConfig }}
            dietPlan={dietPlan}
            setDietPlan={setDietPlan}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            error={error}
            setError={setError}
            onReset={handleReset}
            onBack={() => {
                if(dietPlan?.plannerMode) { // If we have a plan, we can go back to the planner
                    setPlannerMode(dietPlan.plannerMode);
                    if(dietPlan.plannerMode === 'manual') setMeals(dietPlan.originalMeals as Meal[]);
                    else setAiMealConfig(dietPlan.originalMeals as AiMealConfig[]);
                }
                setStep('planner');
            }}
            onSaveDiet={handleSaveDiet}
            savedDietIds={savedDiets.map(d => d.id)}
          />
        );
      case 'savedDietsView':
        return <SavedDiets 
                  diets={savedDiets} 
                  onDelete={handleDeleteDiet}
                  onUpdateDiet={handleUpdateDiet}
                  onAddDiet={handleAddDiet} 
                  onBack={handleReset} 
                />;
      case 'userProfile':
        return <UserProfile 
                  user={currentUser!} 
                  onBack={handleReset} 
                  onSave={handleUpdateProfile} 
                  onLogout={handleLogout}
                />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      {currentUser ? (
        <>
          <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
              <button onClick={handleReset} className="flex items-center gap-2 text-xl font-bold text-cyan-400 hover:opacity-80 transition-opacity">
                <BrainCircuit className="w-7 h-7" />
                <span>NutriFlow AI</span>
              </button>
              <div className="flex items-center gap-4">
                <button onClick={() => setStep('savedDietsView')} className="text-slate-400 hover:text-cyan-400 transition-colors p-2 rounded-full hover:bg-slate-700" title="Dietas Salvas">
                  <Archive className="w-6 h-6" />
                </button>
                 <button className="text-slate-400 hover:text-cyan-400 transition-colors p-2 rounded-full hover:bg-slate-700" title="Notificações">
                   <div className="relative">
                    <NotificationIcon className="w-6 h-6" />
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-800"></span>
                   </div>
                </button>
                 <button onClick={() => setStep('userProfile')} className="p-1.5 rounded-full hover:bg-slate-700 transition-colors" title="Meu Perfil">
                  {currentUser.profilePicture ? (
                    <img src={currentUser.profilePicture} alt="Perfil" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                      <ProfileIcon className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                </button>
              </div>
            </nav>
          </header>
          <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-4xl">
              {renderContent()}
            </div>
          </main>
          <ChatBot />
        </>
      ) : (
         <main className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              {renderAuth()}
            </div>
          </main>
      )}
    </div>
  );
};

// FIX: Add default export for the App component.
export default App;