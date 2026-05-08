import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; 
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from 'firebase/auth';
import { Dumbbell, Mail, Lock, User, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function Login() {
    const navigate = useNavigate();
    const [errore, setErrore] = useState('');
    const [caricamento, setCaricamento] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confermaPassword, setConfermaPassword] = useState('');
    const [nomeCognome, setNomeCognome] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const gestisciAccessoEmail = async (e) => {
        e.preventDefault();
        setErrore(''); 
        
        // Validazioni extra per la registrazione
        if (isRegistering) {
            if (password !== confermaPassword) {
                setErrore('Le password non coincidono.');
                return;
            }
            if (password.length < 6) {
                setErrore('La password deve avere almeno 6 caratteri.');
                return;
            }
        }

        setCaricamento(true);
        try {
            if (isRegistering) {
                // 1. Crea l'utente
                const result = await createUserWithEmailAndPassword(auth, email, password);
                // 2. Aggiorna il profilo con Nome e Cognome
                await updateProfile(result.user, {
                    displayName: nomeCognome
                });
                toast.success("Account creato con successo! 💪");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success("Bentornato! Pronto ad allenarti? 🏋️‍♂️");
            }
            navigate('/'); // Reindirizza alla Dashboard
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setErrore('Email o password non corretti.');
            } else if (err.code === 'auth/email-already-in-use') {
                setErrore('Questa email è già registrata.');
            } else {
                setErrore("Errore durante l'operazione. Riprova.");
            }
        } finally {
            setCaricamento(false);
        }
    };

    const accediConGoogle = async () => {
        setErrore('');
        setCaricamento(true);
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            await signInWithPopup(auth, provider);
            toast.success("Accesso con Google eseguito! 🚀");
            navigate('/'); // Reindirizza alla Dashboard
        } catch (err) {
            if (err.code === 'auth/popup-closed-by-user') {
                setErrore("Accesso annullato.");
            } else {
                setErrore("Errore durante l'accesso con Google.");
            }
        } finally {
            setCaricamento(false);
        }
    };

    return (
        <div className="min-h-[100svh] w-full flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans bg-slate-950 selection:bg-emerald-500/30 selection:text-emerald-200">
            
            {/* Sfondi Animati (Mantenuti dal tuo design) */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }}></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>

            <div className="relative z-10 bg-slate-900/70 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl shadow-black/50 border border-slate-800/60 w-full max-w-md animate-fade-in backdrop-blur-2xl">
                
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl border border-slate-700/50 flex items-center justify-center mx-auto mb-6 shadow-inner relative overflow-hidden">
                        {/* Icona Palestra al posto del portafoglio */}
                        <Dumbbell className="w-8 h-8 text-emerald-400 relative z-10" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                        {isRegistering ? 'Crea un account' : 'GymTracker'}
                    </h2>
                    <p className="text-emerald-400/80 text-[10px] font-bold uppercase tracking-widest">
                        {isRegistering ? 'Inizia a spingere oggi' : 'Il tuo diario di allenamento'}
                    </p>
                </div>
                
                {errore && (
                    <div className="mb-8 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-fade-in shadow-inner">
                        <span className="text-red-400 text-xl">⚠️</span>
                        <p className="text-red-400 text-sm font-medium leading-tight">{errore}</p>
                    </div>
                )}

                <form onSubmit={gestisciAccessoEmail} className="flex flex-col gap-4">
                    
                    {/* CAMPO NOME E COGNOME */}
                    {isRegistering && (
                        <div className="relative group animate-fade-in">
                            <input 
                                type="text" required value={nomeCognome} onChange={(e) => setNomeCognome(e.target.value)} 
                                className="w-full p-4 pl-12 rounded-2xl bg-slate-950/50 border border-slate-800 text-slate-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600" 
                                placeholder="Nome e Cognome"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500/70 transition-colors">
                                <User className="w-5 h-5" />
                            </span>
                        </div>
                    )}

                    {/* CAMPO EMAIL */}
                    <div className="relative group">
                        <input 
                            type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                            className="w-full p-4 pl-12 rounded-2xl bg-slate-950/50 border border-slate-800 text-slate-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600" 
                            placeholder="Indirizzo Email"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500/70 transition-colors">
                            <Mail className="w-5 h-5" />
                        </span>
                    </div>

                    {/* CAMPO PASSWORD */}
                    <div className="relative group">
                        <input 
                            type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
                            className="w-full p-4 pl-12 rounded-2xl bg-slate-950/50 border border-slate-800 text-slate-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600" 
                            placeholder="Password"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500/70 transition-colors">
                            <Lock className="w-5 h-5" />
                        </span>
                    </div>

                    {/* CAMPO CONFERMA PASSWORD */}
                    {isRegistering && (
                        <div className="relative group animate-fade-in">
                            <input 
                                type="password" required value={confermaPassword} onChange={(e) => setConfermaPassword(e.target.value)} 
                                className="w-full p-4 pl-12 rounded-2xl bg-slate-950/50 border border-slate-800 text-slate-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600" 
                                placeholder="Conferma Password"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500/70 transition-colors">
                                <CheckCircle className="w-5 h-5" />
                            </span>
                        </div>
                    )}

                    <button 
                        type="submit" disabled={caricamento} 
                        className="mt-4 w-full bg-emerald-500 text-slate-950 font-black tracking-widest text-sm py-4 rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(52,211,153,0.2)] hover:shadow-[0_0_30px_rgba(52,211,153,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    >
                        {caricamento ? 'ELABORAZIONE...' : (isRegistering ? 'CREA ACCOUNT' : 'ACCEDI ORA')}
                    </button>
                </form>

                <p className="text-center text-slate-500 mt-6 text-sm font-medium">
                    {isRegistering ? 'Hai già un account?' : 'Nuovo utente?'}
                    <button type="button" onClick={() => { setIsRegistering(!isRegistering); setErrore(''); }} className="text-emerald-400 ml-2 font-bold hover:text-emerald-300 transition-colors outline-none">
                        {isRegistering ? 'Accedi' : 'Registrati'}
                    </button>
                </p>

                <div className="flex items-center gap-4 my-8 opacity-70">
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                    <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Oppure</span>
                    <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-slate-600 to-transparent"></div>
                </div>

                <button 
                    onClick={accediConGoogle}
                    disabled={caricamento}
                    className="w-full flex items-center justify-center gap-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 font-bold text-sm py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 shadow-inner"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    Continua con Google
                </button>

            </div>
        </div>
    );
}

export default Login;