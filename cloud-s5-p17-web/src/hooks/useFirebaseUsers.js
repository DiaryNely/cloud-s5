import { useEffect, useState } from "react";
import { database, auth } from "../../firebase-config.js";
import { ref, onValue, off } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

/**
 * Hook React pour écouter les utilisateurs en temps réel depuis Firebase
 * @returns {Object} { users, loading, error }
 */
export default function useFirebaseUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);

  // Écouter l'état d'authentification Firebase
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Attendre que l'utilisateur soit authentifié sur Firebase
    if (!firebaseUser) {
      console.log("⏳ useFirebaseUsers: Pas d'utilisateur Firebase authentifié");
      return;
    }

    console.log("🔥 useFirebaseUsers: Écoute des utilisateurs depuis Firebase...");
    const usersRef = ref(database, "users");

    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          console.log("📥 useFirebaseUsers: Données brutes Firebase:", data);
          
          if (data) {
            // Convertir l'objet Firebase en tableau
            const items = Object.entries(data).map(([uid, user]) => {
              // Un utilisateur est bloqué si :
              // 1. Il a un blockedUntil dans le futur OU
              // 2. Il est désactivé dans Firebase Authentication (disabled: true)
              const isBlocked = (user.blockedUntil && new Date(user.blockedUntil) > new Date()) || user.disabled === true;
              console.log(`👤 ${user.email}: blockedUntil=${user.blockedUntil}, disabled=${user.disabled}, isBlocked=${isBlocked}`);
              
              return {
                uid: uid,
                email: user.email,
                role: user.role || 'USER',
                nom: user.nom,
                prenom: user.prenom,
                numEtu: user.numEtu,
                blockedUntil: user.blockedUntil,
                disabled: user.disabled,
                isBlocked: isBlocked,
                syncedToFirebase: user.syncedToFirebase,
                createdAt: user.createdAt,
                firebaseUid: user.firebaseUid || uid
              };
            });
            
            console.log("✅ useFirebaseUsers: Utilisateurs traités:", items);
            setUsers(items);
          } else {
            console.log("⚠️ useFirebaseUsers: Aucune donnée Firebase");
            setUsers([]);
          }
          setError(null);
        } catch (err) {
          console.error("❌ useFirebaseUsers: Erreur traitement:", err);
          setError("Erreur lors du chargement des utilisateurs");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("❌ useFirebaseUsers: Erreur Firebase:", err);
        setError("Impossible de se connecter à Firebase");
        setLoading(false);
      }
    );

    // Cleanup: se désabonner lors du démontage
    return () => {
      off(usersRef);
      unsubscribe();
    };
  }, [firebaseUser]);

  return { users, loading, error };
}
