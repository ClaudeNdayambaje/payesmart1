import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { HiOutlineUser, HiOutlineMail, HiOutlineBadgeCheck } from 'react-icons/hi';

interface UserProfileHeaderProps {
  className?: string;
}

const ADMIN_USERS_COLLECTION = 'adminUsers';

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ className = '' }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string;
    role?: string;
    lastLogin?: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer l'utilisateur actuellement connecté
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Récupérer les informations supplémentaires de l'utilisateur depuis Firestore
          const userDocRef = doc(db, ADMIN_USERS_COLLECTION, user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as any);
          } else {
            // Si l'utilisateur n'existe pas dans Firestore, utiliser les informations de base de Firebase Auth
            setUserProfile({
              email: user.email || '',
              firstName: user.displayName?.split(' ')[0] || '',
              lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
              avatarUrl: user.photoURL || '',
              lastLogin: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : undefined
            });
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du profil utilisateur:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="animate-pulse flex items-center">
          <div className="rounded-full bg-indigo-200 h-10 w-10"></div>
          <div className="ml-3 space-y-1">
            <div className="h-2 bg-indigo-200 rounded w-24"></div>
            <div className="h-2 bg-indigo-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || !userProfile) {
    return null;
  }

  const initials = userProfile.firstName && userProfile.lastName 
    ? `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}` 
    : userProfile.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {userProfile.avatarUrl ? (
            <img 
              src={`${userProfile.avatarUrl}${userProfile.avatarUrl.includes('?') ? '&' : '?'}refresh=${Date.now()}`}
              alt="Avatar" 
              className="h-12 w-12 rounded-full object-cover border border-indigo-700"
              onError={(e) => {
                // Remplacer par les initiales en cas d'erreur
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = `
                  <div class="h-12 w-12 rounded-full bg-indigo-700 flex items-center justify-center">
                    <span class="text-white font-medium">${initials}</span>
                  </div>
                `;
              }}
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-indigo-700 flex items-center justify-center">
              <span className="text-white font-medium">{initials}</span>
            </div>
          )}
        </div>
        <div className="ml-3 overflow-hidden">
          <div className="flex items-center text-sm font-medium text-white truncate">
            <HiOutlineUser className="mr-1 h-4 w-4 text-indigo-300" />
            {userProfile.firstName && userProfile.lastName 
              ? `${userProfile.firstName} ${userProfile.lastName}`
              : 'Utilisateur'}
          </div>
          <div className="flex items-center text-xs text-indigo-300 truncate">
            <HiOutlineMail className="mr-1 h-3 w-3 text-indigo-400" />
            {userProfile.email || currentUser.email || 'Aucun email'}
          </div>
        </div>
      </div>
      
      {userProfile.role && (
        <div className="mt-2 flex items-center text-xs text-indigo-300 bg-indigo-800/50 rounded-md px-2 py-1">
          <HiOutlineBadgeCheck className="mr-1 h-3 w-3 text-indigo-400" />
          <span className="truncate">Rôle: {userProfile.role}</span>
        </div>
      )}
      
      <div className="mt-2 text-xs text-indigo-400 flex justify-between items-center">
        <span>Connecté</span>
        <div className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
          <span>En ligne</span>
        </div>
      </div>
    </div>
  );
};

export default UserProfileHeader;
