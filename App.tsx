import React, { useState, useEffect, useRef } from 'react';
import { UserData, Meal, DietPlan, MacroTargets, AiMealConfig, User, NotificationSettings, ProgressEntry } from './types';
import Step1UserInfo from './components/Step1_UserInfo';
import Step2MacroConfig, { defaultTargets } from './components/Step2_GoalSelection';
import Step3MealPlanner from './components/Step3_MealPlanner';
import Step4DietResult from './components/Step4_DietResult';
import SavedDiets from './components/SavedDiets';
import ChatBot from './components/ChatBot';
import Login from './components/Login';
import Register from './components/Register';
import UserProfile from './components/UserProfile';
import NotificationSettingsComponent from './components/NotificationSettings';
import UserFiles from './components/UserFiles';
import ProgressDiary from './components/ProgressDiary';
import AdminPanel from './components/admin/AdminPanel';

import { BrainCircuit } from './components/icons/BrainCircuit';
import { Archive } from './components/icons/Archive';
import { ProfileIcon, NotificationIcon, BookOpen, TrendingUpIcon, ShieldCheck } from './components/icons/AppBarIcons';

type AuthView = 'login' | 'register';
type AppView = 'dietCreator' | 'savedDiets' | 'progressDiary' | 'profile' | 'notificationSettings' | 'ebooks' | 'adminPanel';
type Goal = 'Emagrecer' | 'Manter Peso' | 'Ganhar Massa';
type PlannerMode = 'manual' | 'ai';

const App: React.FC = () => {
    // AUTHENTICATION STATE (Local)
    const [authView, setAuthView] = useState<AuthView>('login');
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // APP VIEW STATE
    const [appView, setAppView] = useState<AppView>('dietCreator');

    // DIET CREATION STATE
    const [step, setStep] = useState<'userInfo' | 'macroConfig' | 'planner' | 'result'>('userInfo');
    const [userDataForm, setUserDataForm] = useState<UserData | null>(null);
    const [targetCalories, setTargetCalories] = useState<number>(0);
    const [goal, setGoal] = useState<Goal | null>(null);
    const [macroTargets, setMacroTargets] = useState<MacroTargets | null>(null);
    const [plannerMode, setPlannerMode] = useState<PlannerMode>('manual');
    const [meals, setMeals] = useState<Meal[]>([]);
    const [aiMealConfig, setAiMealConfig] = useState<AiMealConfig[]>([]);
    const [bloodTestFile, setBloodTestFile] = useState<{ name: string; data: string; } | null>(null);
    const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // LOCAL DATA STATE (from localStorage)
    const [savedDiets, setSavedDiets] = useState<DietPlan[]>([]);
    const [progressHistory, setProgressHistory] = useState<ProgressEntry[]>([]);
    
    // NOTIFICATION STATE
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        mealReminderSettings: {},
        hydrationReminders: false,
        hydrationFrequency: 60, // in minutes
    });
    // Fix: Replaced NodeJS.Timeout with number for browser compatibility.
    const mealTimeouts = useRef<number[]>([]);
    // Fix: Replaced NodeJS.Timeout with number for browser compatibility.
    const hydrationInterval = useRef<number | null>(null);

    // --- ENSURE ADMIN USER INTEGRITY ON EVERY LOAD ---
    useEffect(() => {
        try {
            const adminEmail = 'altamiro9@hotmail.com';
            const adminPassword = 'Miraum19'; // User-defined password
            const storedUsersRaw = localStorage.getItem('nutriflow_users');
            let users: User[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
            let needsUpdate = false;

            const adminIndex = users.findIndex(u => u.email.toLowerCase() === adminEmail.toLowerCase());

            if (adminIndex > -1) {
                // Admin exists, check and correct role and password
                const adminUser = users[adminIndex];
                if (adminUser.role !== 'admin' || adminUser.password !== adminPassword) {
                    users[adminIndex] = {
                        ...adminUser,
                        role: 'admin',
                        password: adminPassword,
                        status: 'active',
                        paymentStatus: 'paid',
                    };
                    needsUpdate = true;
                    console.log('Admin user account corrected (role/password).');
                }
            } else {
                // Admin does not exist, create it with the correct credentials
                const adminUser: User = {
                    id: 'admin_master_001',
                    fullName: 'Administrador Master',
                    email: adminEmail,
                    password: adminPassword,
                    role: 'admin',
                    status: 'active',
                    paymentStatus: 'paid',
                    purchasedFileIds: [],
                };
                users.push(adminUser);
                needsUpdate = true;
                console.log('Admin user created successfully.');
            }

            if (needsUpdate) {
                localStorage.setItem('nutriflow_users', JSON.stringify(users));
            }
        } catch (e) {
            console.error("Failed to ensure admin user integrity:", e);
        }
    }, []); // Runs only once on component mount

    // --- LOCAL AUTHENTICATION & USER DATA ---
    useEffect(() => {
        try {
            const loggedInUser = sessionStorage.getItem('nutriflow_currentUser');
            if (loggedInUser) {
                const user = JSON.parse(loggedInUser) as User;
                setCurrentUser(user);
                loadSavedDietsFromLocal(user.id);
                loadNotificationSettingsFromLocal(user.id);
                loadProgressHistoryFromLocal(user.id);
            }
        } catch (e) {
            console.error("Failed to load user from session storage", e);
        }
    }, []);

    const handleLogin = (email: string, password: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const storedUsers = JSON.parse(localStorage.getItem('nutriflow_users') || '[]') as User[];
            const foundUser = storedUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
            if (foundUser) {
                setCurrentUser(foundUser);
                loadSavedDietsFromLocal(foundUser.id);
                loadNotificationSettingsFromLocal(foundUser.id);
                loadProgressHistoryFromLocal(foundUser.id);
                sessionStorage.setItem('nutriflow_currentUser', JSON.stringify(foundUser));
                resolve();
            } else {
                reject(new Error('E-mail ou senha inválidos.'));
            }
        });
    };

    const handleRegister = (fullName: string, email: string, password: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const storedUsers = JSON.parse(localStorage.getItem('nutriflow_users') || '[]') as User[];
            if (storedUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                return reject(new Error('Este e-mail já está cadastrado.'));
            }
            const newUser: User = {
                id: Date.now().toString(),
                fullName,
                email,
                password,
            };
            const updatedUsers = [...storedUsers, newUser];
            localStorage.setItem('nutriflow_users', JSON.stringify(updatedUsers));
            resolve();
        });
    };

    const handleLogout = () => {
        clearAllNotifications();
        setCurrentUser(null);
        sessionStorage.removeItem('nutriflow_currentUser');
        setAppView('dietCreator');
        handleResetDietCreator();
    };

    const handleSaveProfile = (updatedData: Partial<User>) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...updatedData };
        setCurrentUser(updatedUser);
        sessionStorage.setItem('nutriflow_currentUser', JSON.stringify(updatedUser));
        const storedUsers = JSON.parse(localStorage.getItem('nutriflow_users') || '[]') as User[];
        const userIndex = storedUsers.findIndex(u => u.id === currentUser.id);
        if (userIndex > -1) {
            storedUsers[userIndex] = updatedUser;
            localStorage.setItem('nutriflow_users', JSON.stringify(storedUsers));
        }
    };
    
    // --- LOCALSTORAGE DATA PERSISTENCE ---
    const getStorageKey = (userId: string, type: 'diets' | 'notifications' | 'progress') => `nutriflow_${type}_${userId}`;

    const loadSavedDietsFromLocal = (userId: string) => {
        try {
            const localData = localStorage.getItem(getStorageKey(userId, 'diets'));
            setSavedDiets(localData ? JSON.parse(localData) : []);
        } catch (error) { console.error("Failed to load diets", error); setSavedDiets([]); }
    };
    
    const loadNotificationSettingsFromLocal = (userId: string) => {
        try {
            const localData = localStorage.getItem(getStorageKey(userId, 'notifications'));
            if (localData) {
                const settings = JSON.parse(localData);
                // Ensure new fields have default values
                const defaultSettings = {
                    mealReminderSettings: {},
                    hydrationReminders: false,
                    hydrationFrequency: 60,
                };
                setNotificationSettings(prev => ({...defaultSettings, ...prev, ...settings}));
            }
        } catch (error) { console.error("Failed to load notification settings", error); }
    };
    
    const loadProgressHistoryFromLocal = (userId: string) => {
        try {
            const localData = localStorage.getItem(getStorageKey(userId, 'progress'));
            setProgressHistory(localData ? JSON.parse(localData) : []);
        } catch (error) { console.error("Failed to load progress history", error); setProgressHistory([]); }
    };

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(getStorageKey(currentUser.id, 'diets'), JSON.stringify(savedDiets));
        }
    }, [savedDiets, currentUser]);
    
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(getStorageKey(currentUser.id, 'notifications'), JSON.stringify(notificationSettings));
            // Re-schedule notifications if settings change. This works because `dietPlan` state is now complete.
            scheduleNotifications(dietPlan);
        }
    }, [notificationSettings, currentUser, dietPlan]);

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(getStorageKey(currentUser.id, 'progress'), JSON.stringify(progressHistory));
        }
    }, [progressHistory, currentUser]);

    // --- NOTIFICATION LOGIC ---
    const showNotification = (title: string, body: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/logo.png' });
        }
    };

    const clearAllNotifications = () => {
        mealTimeouts.current.forEach(clearTimeout);
        mealTimeouts.current = [];
        if (hydrationInterval.current) {
            clearInterval(hydrationInterval.current);
            hydrationInterval.current = null;
        }
    };

    const scheduleNotifications = (plan: DietPlan | null) => {
        clearAllNotifications();
        if (!plan || !plan.meals || !plan.originalMeals || !notificationSettings.mealReminderSettings) return;
    
        // Unified logic for both manual and AI plans
        plan.meals.forEach(meal => {
            const mealName = meal.meal_name;
            const reminderSetting = notificationSettings.mealReminderSettings[mealName];
    
            if (reminderSetting && reminderSetting.enabled) {
                let mealTimeStr: string | undefined;
                if (plan.plannerMode === 'ai') {
                    mealTimeStr = (plan.originalMeals as AiMealConfig[]).find(m => m.name === mealName)?.time;
                } else { // 'manual'
                    mealTimeStr = (plan.originalMeals as Meal[]).find(m => m.name === mealName)?.time;
                }
                
                if (mealTimeStr) {
                    const [hours, minutes] = mealTimeStr.split(':').map(Number);
                    if (isNaN(hours) || isNaN(minutes)) return; // Invalid time format
    
                    const now = new Date();
                    const mealTime = new Date();
                    mealTime.setHours(hours, minutes, 0, 0);
    
                    // If meal time has already passed for today, schedule it for tomorrow
                    if (mealTime.getTime() < now.getTime()) {
                        mealTime.setDate(mealTime.getDate() + 1);
                    }
    
                    const offsetMillis = reminderSetting.offset * 60 * 1000;
                    const scheduledTime = mealTime.getTime() - offsetMillis;
                    const delay = scheduledTime - now.getTime();
    
                    if (delay > 0) {
                        const timeoutId = setTimeout(() => {
                            showNotification(`Hora da Refeição!`, `É hora de comer seu/sua ${meal.meal_name}.`);
                        }, delay);
                        mealTimeouts.current.push(timeoutId);
                    }
                }
            }
        });
    
        // Schedule Hydration Reminders
        if (notificationSettings.hydrationReminders && plan.userData) {
            const waterIntake = ((plan.userData.weight * 35) / 1000).toFixed(1);
            const hydrationMessage = `Lembrete de Hidratação: Não se esqueça de beber água para atingir sua meta de ${waterIntake} litros!`;
            
            hydrationInterval.current = setInterval(() => {
                showNotification('Mantenha-se Hidratado!', hydrationMessage);
            }, notificationSettings.hydrationFrequency * 60 * 1000);
        }
    };

    // --- NAVIGATION ---
    const handleNavigateToView = (view: AppView) => {
        setAppView(view);
        if (view === 'dietCreator') handleResetDietCreator(false);
    };
    
    // --- DIET CREATION LOGIC ---
    const handleGoToMacroConfig = (data: UserData, calories: number, selectedGoal: Goal) => {
        setUserDataForm(data);
        setTargetCalories(calories);
        setGoal(selectedGoal);
        setStep('macroConfig');
    };

    const handleGoToPlanner = (targets: MacroTargets) => {
        setMacroTargets(targets);
        setStep('planner');
    };

    const handleGenerateDiet = (plannerData: { mode: 'manual', data: Meal[] } | { mode: 'ai', data: AiMealConfig[] }) => {
        setPlannerMode(plannerData.mode);
        if (plannerData.mode === 'manual') {
            setMeals(plannerData.data);
        } else {
            setAiMealConfig(plannerData.data);
        }
        setStep('result');
    };
    
    const handlePlanDietDirectly = (data: UserData, calories: number, selectedGoal: Goal) => {
        setUserDataForm(data);
        setTargetCalories(calories);
        setGoal(selectedGoal);
        setMacroTargets(defaultTargets);
        // This is the correct flow: directly to the planner.
        setStep('planner');
    };
    
    const handleResetDietCreator = (fullReset = true) => {
        setStep('userInfo');
        if (fullReset) {
            setUserDataForm(null);
        }
        setDietPlan(null);
        setError(null);
        setIsLoading(false);
        setMeals([]);
        setAiMealConfig([]);
        setBloodTestFile(null);
        clearAllNotifications();
    };

    const handleSaveDiet = (plan: DietPlan) => {
        if (!savedDiets.some(d => d.id === plan.id)) {
            setSavedDiets(prev => [plan, ...prev]);
        }
    };
    
    const handleUpdateSavedDiet = (plan: DietPlan) => {
        setSavedDiets(prev => prev.map(d => d.id === plan.id ? plan : d));
    }
    
    const handleAddSavedDiet = (plan: DietPlan) => {
         setSavedDiets(prev => [plan, ...prev]);
    }

    const handleDeleteDiet = (id: string) => {
        setSavedDiets(prev => prev.filter(d => d.id !== id));
    };

    // --- PROGRESS DIARY LOGIC ---
    const handleAddProgressEntry = (entry: Omit<ProgressEntry, 'id'>) => {
        const newEntry: ProgressEntry = {
            id: Date.now().toString(),
            ...entry
        };
        setProgressHistory(prev => [...prev, newEntry]);
    };
    
    const handleDeleteProgressEntry = (id: string) => {
        setProgressHistory(prev => prev.filter(entry => entry.id !== id));
    };
    
     const handlePurchaseFile = (fileId: string) => {
        if (!currentUser) return;

        const updatedUser = {
            ...currentUser,
            purchasedFileIds: [...(currentUser.purchasedFileIds || []), fileId]
        };
        handleSaveProfile(updatedUser);
    };

    const renderDietCreator = () => {
        switch (step) {
            case 'userInfo':
                return <Step1UserInfo 
                    onGoToMacroConfig={handleGoToMacroConfig} 
                    onPlanDietDirectly={handlePlanDietDirectly}
                    bloodTestFile={bloodTestFile}
                    onFileUpload={setBloodTestFile}
                    onFileRemove={() => setBloodTestFile(null)}
                />;
            case 'macroConfig':
                if (!userDataForm || !goal) return null;
                return <Step2MacroConfig userData={userDataForm} targetCalories={targetCalories} onNext={handleGoToPlanner} onBack={() => setStep('userInfo')} />;
            case 'planner':
                return <Step3MealPlanner 
                    onNext={handleGenerateDiet} 
                    onBack={() => setStep('macroConfig')} 
                    initialMeals={meals}
                    initialAiMeals={aiMealConfig}
                    initialMode={plannerMode}
                />;
            case 'result':
                if (!userDataForm || !goal || !macroTargets) return null;
                return <Step4DietResult
                    userData={userDataForm}
                    targetCalories={targetCalories}
                    goal={goal}
                    macroTargets={macroTargets}
                    plannerConfig={plannerMode === 'manual' ? { mode: 'manual', data: meals } : { mode: 'ai', data: aiMealConfig }}
                    bloodTestFile={bloodTestFile}
                    dietPlan={dietPlan}
                    setDietPlan={setDietPlan}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    error={error}
                    setError={setError}
                    onReset={() => handleResetDietCreator(true)}
                    onBack={() => setStep('planner')}
                    onSaveDiet={handleSaveDiet}
                    savedDietIds={savedDiets.map(d => d.id)}
                />;
            default:
                return null;
        }
    };
    
    const renderMainView = () => {
        switch(appView) {
            case 'dietCreator':
                return renderDietCreator();
            case 'savedDiets':
                return <SavedDiets 
                    diets={savedDiets} 
                    onDelete={handleDeleteDiet} 
                    onUpdateDiet={handleUpdateSavedDiet}
                    onAddDiet={handleAddSavedDiet}
                    onBack={() => handleNavigateToView('dietCreator')}
                    bloodTestFile={bloodTestFile}
                 />;
            case 'progressDiary':
                return <ProgressDiary 
                    progressHistory={progressHistory} 
                    onAddEntry={handleAddProgressEntry}
                    onDeleteEntry={handleDeleteProgressEntry}
                />;
             case 'ebooks':
                if (!currentUser) return null;
                return <UserFiles
                    user={currentUser}
                    onPurchaseFile={handlePurchaseFile}
                    onBack={() => handleNavigateToView('dietCreator')}
                />;
            case 'profile':
                if (!currentUser) return null;
                return <UserProfile 
                    user={currentUser} 
                    onBack={() => handleNavigateToView('dietCreator')} 
                    onSave={handleSaveProfile}
                    onLogout={handleLogout}
                    onNavigateToNotificationSettings={() => handleNavigateToView('notificationSettings')}
                    onNavigateToUserFiles={() => handleNavigateToView('ebooks')}
                 />;
            case 'notificationSettings':
                return <NotificationSettingsComponent
                    settings={notificationSettings}
                    onSettingsChange={setNotificationSettings}
                    onBack={() => handleNavigateToView('profile')}
                />;
            case 'adminPanel':
                if (!currentUser || currentUser.role !== 'admin') {
                    handleNavigateToView('dietCreator');
                    return null;
                }
                return <AdminPanel onBack={() => handleNavigateToView('dietCreator')} adminUser={currentUser} />;
            default:
                return renderDietCreator();
        }
    };

    if (!currentUser) {
        return (
            <main className="container mx-auto p-4 md:p-8 max-w-xl">
                {authView === 'login' && (
                    <Login
                        onLogin={handleLogin}
                        onNavigateToRegister={() => setAuthView('register')}
                    />
                )}
                {authView === 'register' && (
                    <Register
                        onRegister={handleRegister}
                        onRegisterSuccess={() => setAuthView('login')}
                        onNavigateToLogin={() => setAuthView('login')}
                    />
                )}
            </main>
        );
    }
    
    const mainContainerClass = appView === 'adminPanel'
        ? 'container mx-auto p-4 md:p-8 flex-1 w-full max-w-screen-xl'
        : 'container mx-auto p-4 md:p-8 flex-1 w-full max-w-4xl';

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-700">
                <div className="container mx-auto p-4 flex justify-between items-center">
                    <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => handleNavigateToView('dietCreator')}
                    >
                        <BrainCircuit className="w-8 h-8 transition-colors text-cyan-400" />
                        <h1 className="text-2xl font-bold text-white tracking-tight">NUTRIFLOW <span className="text-cyan-400">IA</span></h1>
                    </div>
                    <nav className="flex items-center gap-1 md:gap-2">
                        {currentUser.role === 'admin' && (
                             <button
                                onClick={() => handleNavigateToView('adminPanel')}
                                className={`flex items-center gap-2 font-semibold p-2 rounded-lg transition-colors ${appView === 'adminPanel' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:bg-slate-700'}`}
                                title="Painel Admin"
                            >
                                <ShieldCheck className="w-6 h-6" />
                                <span className="hidden md:inline">Painel Admin</span>
                            </button>
                        )}
                        <button
                            onClick={() => handleNavigateToView('savedDiets')}
                            className={`flex items-center gap-2 font-semibold p-2 rounded-lg transition-colors ${appView === 'savedDiets' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:bg-slate-700'}`}
                            title="Dietas Salvas"
                        >
                            <Archive className="w-6 h-6" />
                            <span className="hidden md:inline">Minhas Dietas</span>
                        </button>
                         <button
                            onClick={() => handleNavigateToView('progressDiary')}
                            className={`flex items-center gap-2 font-semibold p-2 rounded-lg transition-colors ${appView === 'progressDiary' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:bg-slate-700'}`}
                            title="Diário de Progresso"
                        >
                            <TrendingUpIcon className="w-6 h-6" />
                            <span className="hidden md:inline">Progresso</span>
                        </button>
                        <button
                            onClick={() => handleNavigateToView('ebooks')}
                            className={`flex items-center gap-2 font-semibold p-2 rounded-lg transition-colors ${appView === 'ebooks' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:bg-slate-700'}`}
                            title="E-books & Arquivos"
                        >
                            <BookOpen className="w-6 h-6" />
                            <span className="hidden md:inline">E-books & Arquivos</span>
                        </button>
                         <button
                            onClick={() => handleNavigateToView('notificationSettings')}
                            className={`p-2 rounded-full transition-colors ${appView === 'notificationSettings' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:bg-slate-700'}`}
                            title="Notificações"
                        >
                            <NotificationIcon className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => handleNavigateToView('profile')}
                            className={`p-2 rounded-full transition-colors ${appView === 'profile' || appView === 'notificationSettings' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:bg-slate-700'}`}
                            title="Meu Perfil"
                        >
                            <ProfileIcon className="w-6 h-6" />
                        </button>
                    </nav>
                </div>
            </header>

            <main className={mainContainerClass}>
                {renderMainView()}
            </main>
            
            <ChatBot />

            <footer className="text-center p-4 text-slate-500 text-sm">
                <p>&copy; {new Date().getFullYear()} NUTRIFLOW IA. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

export default App;