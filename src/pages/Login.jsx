import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, googleProvider } from '../firebase'; // Assicurati che il percorso sia corretto
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithRedirect,
    getRedirectResult,
    updateProfile 
} from 'firebase/auth';
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

    // 1. GESTISCE IL RITORNO DA GOOGLE (REDIRECT)
    useEffect(() => {
        const checkRedirect = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    toast.success("Accesso con Google eseguito! 💪");
                    navigate('/');
                }
            } catch (error) {
                console.error("Errore Google Redirect:", error);
                setErrore("Errore durante l'accesso: " + error.code);
            }
        };
        checkRedirect();
    }, [navigate]);

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
                toast.success("Account creato con successo! 🏋️‍♂️");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success("Bentornato! Pronto a spingere?");
            }
            navigate('/');
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

    const accediConGoogle = () => {
        setErrore('');
        setCaricamento(true);
        try {
            // Usa il redirect invece del popup per evitare blocchi del browser
            signInWithRedirect(auth, googleProvider);
        } catch (err) {
            console.error("Errore Google Login:", err);
            setErrore("Errore nell'iniziare il login con Google.");
            setCaricamento(false);
        }
    };

    return (
        <div className="min-h-[100svh] w-full flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans bg-slate-950 selection:bg-emerald-500/30 selection:text-emerald-200">
            
            <div className="absolute top-6 left-6 z-20">
                <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800 backdrop-blur-md hover:bg-slate-800">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Torna alla Home
                </Link>
            </div>

            {/* Sfondi Animati */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }}></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>

            <div className="relative z-10 bg-slate-900/70 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl shadow-black/50 border border-slate-800/60 w-full max-w-md animate-fade-in backdrop-blur-2xl">
                
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl border border-slate-700/50 flex items-center justify-center mx-auto mb-6 shadow-inner relative overflow-hidden">
                        {/* Icona sostituita per il tema Palestra */}
                        <span className="text-3xl relative z-10">🏋️‍♂️</span>
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                        {isRegistering ? 'Crea un account' : 'GymTracker'}
                    </h2>
                    <p className="text-emerald-400/80 text-[10px] font-bold uppercase tracking-widest">
                        {isRegistering ? 'Inizia ad allenarti oggi' : 'Il tuo diario di allenamento'}
                    </p>
                </div>
                
                {errore && (
                    <div className="mb-8 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-fade-in shadow-inner">
                        <span className="text-red-400 text-xl">⚠️</span>
                        <p className="text-red-400 text-sm font-medium leading-tight">{errore}</p>
                    </div>
                )}

                <form onSubmit={gestisciAccessoEmail} className="flex flex-col gap-4">
                    
                    {/* CAMPO NOME E COGNOME (Solo in registrazione) */}
                    {isRegistering && (
                        <div className="relative group animate-fade-in">
                            <input 
                                type="text" required value={nomeCognome} onChange={(e) => setNomeCognome(e.target.value)} 
                                className="w-full p-4 pl-12 rounded-2xl bg-slate-950/50 border border-slate-800 text-slate-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600" 
                                placeholder="Nome e Cognome"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500/70 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            </span>
                        </div>
                    )}

                    <div className="relative group">
                        <input 
                            type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                            className="w-full p-4 pl-12 rounded-2xl bg-slate-950/50 border border-slate-800 text-slate-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600" 
                            placeholder="Indirizzo Email"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500/70 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        </span>
                    </div>

                    <div className="relative group">
                        <input 
                            type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
                            className="w-full p-4 pl-12 rounded-2xl bg-slate-950/50 border border-slate-800 text-slate-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600" 
                            placeholder="Password"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500/70 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </span>
                    </div>

                    {/* CAMPO CONFERMA PASSWORD (Solo in registrazione) */}
                    {isRegistering && (
                        <div className="relative group animate-fade-in">
                            <input 
                                type="password" required value={confermaPassword} onChange={(e) => setConfermaPassword(e.target.value)} 
                                className="w-full p-4 pl-12 rounded-2xl bg-slate-950/50 border border-slate-800 text-slate-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600" 
                                placeholder="Conferma Password"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500/70 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
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
                    <button type="button" onClick={() => { setIsRegistering(!isRegistering); setErrore(''); }} className="text-emerald-400 ml-2 font-bold hover:text-emerald-300 transition-colors">
                        {isRegistering ? 'Accedi' : 'Registrati'}
                    </button>
                </p>

                <div className="flex items-center gap-4 my-8 opacity-70">
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                    <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Oppure</span>
                    <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-slate-600 to-transparent"></div>
                </div>

                <button 
                    type="button"
                    onClick={accediConGoogle}
                    disabled={caricamento}
                    className="w-full flex items-center justify-center gap-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 font-bold text-sm py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 shadow-inner"
                >
                    {/* SVG Google originale reinserito */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continua con Google
                </button>

            </div>
        </div>
    );
}

export default Login;