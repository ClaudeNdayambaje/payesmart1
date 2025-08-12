import React, { useState } from 'react';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

interface SaasAdminLoginProps {
  onLoginSuccess: () => void;
}

// Liste des emails autorisés à accéder à l'interface d'administration SaaS
const AUTHORIZED_ADMIN_EMAILS = [
  'admin@payesmart.com',
  // Ajoutez d'autres emails d'administrateurs système ici
];

const SaasAdminLogin: React.FC<SaasAdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Vérifier si l'email est autorisé
      if (!AUTHORIZED_ADMIN_EMAILS.includes(email.toLowerCase())) {
        throw new Error("Vous n'êtes pas autorisé à accéder à cette interface d'administration.");
      }

      // Tentative de connexion
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Vérifier à nouveau avec l'email réel de l'utilisateur connecté
      if (userCredential.user.email && !AUTHORIZED_ADMIN_EMAILS.includes(userCredential.user.email.toLowerCase())) {
        // Déconnexion si l'email n'est pas autorisé
        await auth.signOut();
        throw new Error("Vous n'êtes pas autorisé à accéder à cette interface d'administration.");
      }

      // Connexion réussie
      onLoginSuccess();
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      
      // Messages d'erreur personnalisés
      if (error.message.includes("user-not-found") || error.message.includes("wrong-password")) {
        setError("Email ou mot de passe incorrect.");
      } else if (error.message.includes("too-many-requests")) {
        setError("Trop de tentatives de connexion. Veuillez réessayer plus tard.");
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md bg-white text-gray-800 border border-gray-200 shadow-xl rounded-xl">
        <CardHeader className="space-y-2 text-center border-b border-gray-100 pb-6">
          <CardTitle className="text-2xl font-bold text-indigo-800">Administration SaaS</CardTitle>
          <CardDescription className="text-gray-500">
            Connectez-vous pour accéder à l'interface d'administration SaaS
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="admin@payesmart.com"
                required
                className="bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t border-gray-100 pt-4 text-center">
          <p className="text-sm text-gray-500">
            Cette interface est réservée aux administrateurs système.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SaasAdminLogin;
