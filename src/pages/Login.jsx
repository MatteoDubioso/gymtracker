import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Lock, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (error) {
      alert("Errore: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100 text-base-content p-6">
      
      {/* Usiamo la Card di DaisyUI e lo sfondo base-200 per staccarlo dallo sfondo principale */}
      <div className="card w-full max-w-md bg-base-200 shadow-2xl border border-base-300 p-8">
        
        <div className="text-center mb-8">
          {/* L'icona usa il colore 'primary' in automatico */}
          <div className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <Dumbbell className="text-primary-content w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">GymTracker</h1>
          <p className="text-base-content/60 mt-2 font-medium">
            {isRegister ? 'Crea il tuo account' : 'Bentornato, atleta!'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-[1.1rem] text-base-content/50 w-5 h-5" />
            {/* Input di DaisyUI che si adatta al tema */}
            <input 
              type="email" 
              placeholder="Email"
              required
              className="input input-bordered input-primary w-full pl-12 bg-base-100 text-base-content"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-[1.1rem] text-base-content/50 w-5 h-5" />
            <input 
              type="password" 
              placeholder="Password"
              required
              className="input input-bordered input-primary w-full pl-12 bg-base-100 text-base-content"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {/* Pulsante Submit di DaisyUI */}
          <button className="btn btn-primary w-full btn-lg font-black tracking-widest mt-4 shadow-lg shadow-primary/20">
            {isRegister ? 'REGISTRATI' : 'ACCEDI'}
          </button>
        </form>

        {/* Pulsante 'Ghost' di DaisyUI per i link testuali */}
        <button 
          onClick={() => setIsRegister(!isRegister)}
          className="btn btn-ghost w-full mt-4 text-sm font-bold text-base-content/70 hover:text-primary"
        >
          {isRegister ? 'Hai già un account? Accedi' : 'Nuovo utente? Registrati ora'}
        </button>
      </div>
    </div>
  );
};

export default Login;