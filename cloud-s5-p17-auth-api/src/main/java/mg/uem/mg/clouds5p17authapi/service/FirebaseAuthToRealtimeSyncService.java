package mg.uem.mg.clouds5p17authapi.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.ListUsersPage;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Synchronise tous les utilisateurs de Firebase Authentication vers Realtime Database.
 * Désactivé en mode local (auth.mode=local).
 */
@Component
public class FirebaseAuthToRealtimeSyncService implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(FirebaseAuthToRealtimeSyncService.class);
    private static final String DATABASE_URL = "https://clouds5-p17-antananarivo-default-rtdb.firebaseio.com";

    private final String authMode;

    public FirebaseAuthToRealtimeSyncService(
            @org.springframework.beans.factory.annotation.Value("${auth.mode:auto}") String authMode) {
        this.authMode = authMode;
    }

    @Override
    public void run(String... args) {
        if ("local".equalsIgnoreCase(authMode)) {
            log.info("Mode LOCAL — sync Firebase Auth → Realtime DB ignorée");
            return;
        }
        try {
            log.info("🔄 Synchronisation des users de Firebase Authentication → Realtime Database...");
            
            DatabaseReference database = FirebaseDatabase.getInstance(DATABASE_URL).getReference();
            DatabaseReference usersRef = database.child("users");
            
            int count = 0;
            ListUsersPage page = FirebaseAuth.getInstance().listUsers(null);
            
            while (page != null) {
                for (UserRecord user : page.getValues()) {
                    // Préparer les données user
                    Map<String, Object> userData = new HashMap<>();
                    userData.put("uid", user.getUid());
                    userData.put("email", user.getEmail());
                    userData.put("emailVerified", user.isEmailVerified());
                    
                    // Nom et prénom depuis displayName
                    if (user.getDisplayName() != null && !user.getDisplayName().isEmpty()) {
                        String[] nameParts = user.getDisplayName().split(" ", 2);
                        userData.put("nom", nameParts[0]);
                        if (nameParts.length > 1) {
                            userData.put("prenom", nameParts[1]);
                        }
                    }
                    
                    // Role depuis custom claims
                    String role = "UTILISATEUR";
                    if (user.getCustomClaims() != null && user.getCustomClaims().get("role") != null) {
                        role = user.getCustomClaims().get("role").toString();
                    }
                    userData.put("role", role);
                    
                    // NumEtu depuis custom claims
                    if (user.getCustomClaims() != null && user.getCustomClaims().get("numEtu") != null) {
                        userData.put("numEtu", user.getCustomClaims().get("numEtu").toString());
                    }
                    
                    userData.put("disabled", user.isDisabled());
                    userData.put("createdAt", user.getUserMetadata().getCreationTimestamp());
                    userData.put("firebaseUid", user.getUid());
                    
                    // Enregistrer dans Realtime Database avec UID comme clé
                    usersRef.child(user.getUid()).setValueAsync(userData);
                    count++;
                }
                
                page = page.getNextPage();
            }
            
            log.info("✅ {} users synchronisés de Firebase Auth → Realtime Database", count);
            
        } catch (FirebaseAuthException e) {
            log.error("❌ Erreur lors de la synchronisation Firebase Auth → Realtime DB: {}", e.getMessage());
        } catch (Exception e) {
            log.error("❌ Erreur inattendue: {}", e.getMessage(), e);
        }
    }
}
