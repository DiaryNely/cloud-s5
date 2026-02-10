import { useEffect, useState } from "react";
import { database, auth } from "../../firebase-config.js";
import { ref, onValue, off } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

/**
 * Hook React pour écouter les signalements en temps réel depuis Firebase
 * @returns {Array} Liste des signalements avec mises à jour en temps réel
 */
export default function useFirebaseSignalements() {
  const [markers, setMarkers] = useState([]);
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
      return;
    }

    const signalementRef = ref(database, "signalements");

    const unsubscribe = onValue(
      signalementRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            // Convertir l'objet Firebase en tableau
            const items = Object.values(data);
            
            // Transformer en format attendu par MapView
            const transformed = items.map((item) => ({
              id: item.id,
              title: item.title,
              lat: item.latitude,
              lng: item.longitude,
              date: item.createdAt?.slice(0, 10),
              status: item.status,
              surface: item.surfaceM2,
              budget: item.budgetAr,
              company: item.entreprise,
              userEmail: item.userEmail,
              dateNouveau: item.dateNouveau,
              dateEnCours: item.dateEnCours,
              dateTermine: item.dateTermine,
              createdAt: item.createdAt,
              photoUrl: item.photoUrl
            }));
            
            setMarkers(transformed);
          } else {
            setMarkers([]);
          }
          setError(null);
        } catch (err) {
          console.error("Erreur lors du traitement des données Firebase:", err);
          setError("Erreur lors du chargement des données");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Erreur Firebase:", err);
        setError("Impossible de se connecter à Firebase");
        setLoading(false);
      }
    );

    // Cleanup: se désabonner lors du démontage
    return () => {
      off(signalementRef);
      unsubscribe();
    };
  }, [firebaseUser]);

  return { markers, loading, error };
}
