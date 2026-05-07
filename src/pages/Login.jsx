import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  // Login Classico
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account creato!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Bentornato!");
      }
      navigate('/');
    } catch (error) {
      toast.error("Errore: " + error.message);
    }
  };

  // Login con Google
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Accesso con Google eseguito!");
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error("Errore nel login con Google");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100 text-base-content p-6">
      <div className="card w-full max-w-md bg-base-200 shadow-2xl border border-base-300 p-8">
        
        <div className="text-center mb-8">
          <div className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <Dumbbell className="text-primary-content w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">GymTracker</h1>
          <p className="text-base-content/60 mt-2 font-medium">
            {isRegister ? 'Crea il tuo account' : 'Inizia ad allenarti'}
          </p>
        </div>

        <div className="space-y-4">
          {/* Pulsante Google Social */}
          <button 
            onClick={handleGoogleLogin}
            className="btn btn-outline btn-block gap-2 normal-case font-bold"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Accedi con Google
          </button>

          <div className="divider text-xs opacity-30 font-bold uppercase tracking-widest">Oppure con Email</div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-[1.1rem] text-base-content/50 w-5 h-5" />
              <input 
                type="email" placeholder="Email" required
                className="input input-bordered input-primary w-full pl-12 bg-base-100"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-[1.1rem] text-base-content/50 w-5 h-5" />
              <input 
                type="password" placeholder="Password" required
                className="input input-bordered input-primary w-full pl-12 bg-base-100"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="btn btn-primary w-full btn-lg font-black tracking-widest mt-4">
              {isRegister ? 'REGISTRATI' : 'ACCEDI'}
            </button>
          </form>

          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="btn btn-ghost btn-sm w-full mt-4 opacity-70"
          >
            {isRegister ? 'Hai già un account? Accedi' : 'Nuovo utente? Registrati'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;