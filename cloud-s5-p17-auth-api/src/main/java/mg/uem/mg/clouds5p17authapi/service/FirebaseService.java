package mg.uem.mg.clouds5p17authapi.service;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import mg.uem.mg.clouds5p17authapi.entity.Signalement;
import mg.uem.mg.clouds5p17authapi.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
public class FirebaseService {

    private static final Logger log = LoggerFactory.getLogger(FirebaseService.class);
    private static final String DATABASE_URL = "https://clouds5-p17-antananarivo-default-rtdb.firebaseio.com";

    /**
     * Synchronise un signalement avec Firebase Realtime Database
     * @param signalement Le signalement à synchroniser
     * @return L'ID Firebase du signalement
     */
    public String saveSignalement(Signalement signalement) {
        try {
            // Obtenir une référence à la base de données
            DatabaseReference database = FirebaseDatabase.getInstance(DATABASE_URL).getReference();
            
            // Utiliser l'ID local comme clé Firebase
            String firebaseId = String.valueOf(signalement.getId());
            DatabaseReference signalementRef = database.child("signalements").child(firebaseId);

            // Créer un objet avec les données du signalement
            Map<String, Object> data = new HashMap<>();
            data.put("id", signalement.getId());
            data.put("title", signalement.getTitle());
            data.put("description", signalement.getDescription());
            data.put("latitude", signalement.getLatitude());
            data.put("longitude", signalement.getLongitude());
            data.put("status", signalement.getStatus());
            data.put("surfaceM2", signalement.getSurfaceM2());
            data.put("budgetAr", signalement.getBudgetAr());
            data.put("entreprise", signalement.getEntreprise());
            data.put("userUid", signalement.getUserUid());
            data.put("userEmail", signalement.getUserEmail());
            data.put("createdAt", signalement.getCreatedAt() != null ? signalement.getCreatedAt().toString() : null);
            data.put("updatedAt", signalement.getUpdatedAt() != null ? signalement.getUpdatedAt().toString() : null);
            data.put("dateNouveau", signalement.getDateNouveau() != null ? signalement.getDateNouveau().toString() : null);
            data.put("dateEnCours", signalement.getDateEnCours() != null ? signalement.getDateEnCours().toString() : null);
            data.put("dateTermine", signalement.getDateTermine() != null ? signalement.getDateTermine().toString() : null);
            data.put("photoUrl", signalement.getPhotoUrl());

            // Envoyer à Firebase de manière asynchrone
            signalementRef.setValueAsync(data);
            
            System.out.println("Signalement #" + signalement.getId() + " synchronisé avec Firebase (ID: " + firebaseId + ")");
            return firebaseId;
        } catch (Exception e) {
            System.err.println("Erreur lors de la synchronisation avec Firebase : " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to sync signalement to Firebase", e);
        }
    }

    /**
     * @deprecated Use saveSignalement instead
     */
    @Deprecated
    public void syncSignalement(Signalement signalement) {
        saveSignalement(signalement);
    }

    /**
     * Supprime un signalement de Firebase
     * @param id L'ID du signalement à supprimer
     */
    public void deleteSignalement(Long id) {
        try {
            DatabaseReference database = FirebaseDatabase.getInstance(DATABASE_URL).getReference();
            DatabaseReference signalementRef = database.child("signalements").child(String.valueOf(id));
            signalementRef.removeValueAsync();
            System.out.println("Signalement #" + id + " supprimé de Firebase");
        } catch (Exception e) {
            System.err.println("Erreur lors de la suppression Firebase : " + e.getMessage());
        }
    }

    /**
     * Synchronise un utilisateur avec Firebase Realtime Database
     * @param user L'utilisateur à synchroniser
     */
    public void syncUser(User user) {
        try {
            DatabaseReference database = FirebaseDatabase.getInstance(DATABASE_URL).getReference();
            // Utiliser l'UID comme clé pour respecter les règles Firebase
            String key = user.getFirebaseUid() != null ? user.getFirebaseUid() : user.getUid();
            DatabaseReference userRef = database.child("users").child(key);

            // Créer un objet avec les données publiques de l'utilisateur (pas de mot de passe!)
            Map<String, Object> data = new HashMap<>();
            data.put("uid", user.getUid());
            data.put("email", user.getEmail());
            data.put("nom", user.getNom());
            data.put("prenom", user.getPrenom());
            data.put("numEtu", user.getNumEtu());
            data.put("role", user.getRole());
            data.put("firebaseUid", user.getFirebaseUid());
            data.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
            data.put("blockedUntil", user.getBlockedUntil() != null ? user.getBlockedUntil().toString() : null);
            // Note: disabled vient de Firebase Authentication, on ne l'écrase pas ici
            // Il sera géré par FirebaseAuthToRealtimeSyncService

            // Envoyer à Firebase de manière asynchrone (updateChildren pour ne pas écraser disabled)
            userRef.updateChildrenAsync(data);
            
            System.out.println("User " + user.getEmail() + " synchronisé avec Firebase");
        } catch (Exception e) {
            System.err.println("Erreur lors de la synchronisation user avec Firebase : " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Supprime un utilisateur de Firebase
     * @param uid L'UID de l'utilisateur à supprimer
     */
    public void deleteUser(String uid) {
        try {
            DatabaseReference database = FirebaseDatabase.getInstance(DATABASE_URL).getReference();
            DatabaseReference userRef = database.child("users").child(uid);
            userRef.removeValueAsync();
            System.out.println("User " + uid + " supprimé de Firebase");
        } catch (Exception e) {
            System.err.println("Erreur lors de la suppression user Firebase : " + e.getMessage());
        }
    }

    /**
     * Récupère tous les signalements depuis Firebase Realtime Database
     * @return Liste des signalements depuis Firebase
     */
    public List<Map<String, Object>> fetchSignalementsFromFirebase() {
        List<Map<String, Object>> signalements = new ArrayList<>();
        CompletableFuture<List<Map<String, Object>>> future = new CompletableFuture<>();
        
        try {
            DatabaseReference database = FirebaseDatabase.getInstance(DATABASE_URL).getReference();
            DatabaseReference signalementsRef = database.child("signalements");
            
            signalementsRef.addListenerForSingleValueEvent(new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot snapshot) {
                    List<Map<String, Object>> data = new ArrayList<>();
                    for (DataSnapshot child : snapshot.getChildren()) {
                        Map<String, Object> signalement = new HashMap<>();
                        signalement.put("firebaseKey", child.getKey());
                        
                        // Récupérer tous les champs
                        if (child.child("id").exists()) {
                            Object idValue = child.child("id").getValue();
                            signalement.put("id", idValue instanceof Long ? (Long) idValue : 
                                                  idValue instanceof Integer ? ((Integer) idValue).longValue() : null);
                        }
                        signalement.put("title", child.child("title").getValue(String.class));
                        signalement.put("description", child.child("description").getValue(String.class));
                        signalement.put("latitude", child.child("latitude").getValue(Double.class));
                        signalement.put("longitude", child.child("longitude").getValue(Double.class));
                        signalement.put("status", child.child("status").getValue(String.class));
                        signalement.put("surfaceM2", child.child("surfaceM2").getValue(Double.class));
                        signalement.put("budgetAr", child.child("budgetAr").getValue(Double.class));
                        signalement.put("entreprise", child.child("entreprise").getValue(String.class));
                        signalement.put("userUid", child.child("userUid").getValue(String.class));
                        signalement.put("userEmail", child.child("userEmail").getValue(String.class));
                        signalement.put("createdAt", child.child("createdAt").getValue(String.class));
                        signalement.put("updatedAt", child.child("updatedAt").getValue(String.class));
                        
                        data.add(signalement);
                    }
                    future.complete(data);
                }
                
                @Override
                public void onCancelled(DatabaseError error) {
                    log.error("Erreur lors de la récupération depuis Firebase: {}", error.getMessage());
                    future.completeExceptionally(new RuntimeException(error.getMessage()));
                }
            });
            
            // Attendre la réponse (timeout de 10 secondes)
            signalements = future.get(10, TimeUnit.SECONDS);
            log.info("Récupéré {} signalements depuis Firebase", signalements.size());
            
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des signalements depuis Firebase: {}", e.getMessage());
        }
        
        return signalements;
    }

    /**
     * Parse une date ISO string en Instant
     */
    private Instant parseInstant(String dateString) {
        if (dateString == null || dateString.isEmpty()) {
            return Instant.now();
        }
        try {
            return Instant.parse(dateString);
        } catch (Exception e) {
            log.warn("Impossible de parser la date: {}", dateString);
            return Instant.now();
        }
    }
}
