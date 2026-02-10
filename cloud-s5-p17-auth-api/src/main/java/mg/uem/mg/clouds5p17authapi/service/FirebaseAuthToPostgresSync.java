package mg.uem.mg.clouds5p17authapi.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.ListUsersPage;
import com.google.firebase.auth.UserRecord;
import mg.uem.mg.clouds5p17authapi.entity.User;
import mg.uem.mg.clouds5p17authapi.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

/**
 * Importe automatiquement tous les utilisateurs de Firebase Authentication vers PostgreSQL au démarrage
 */
@Component
@Order(1) // S'exécute en premier
public class FirebaseAuthToPostgresSync implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(FirebaseAuthToPostgresSync.class);

    private final UserRepository userRepository;
    private final ConnectionDetectorService connectionDetector;
    private final BCryptPasswordEncoder passwordEncoder;

    public FirebaseAuthToPostgresSync(UserRepository userRepository, 
                                     ConnectionDetectorService connectionDetector) {
        this.userRepository = userRepository;
        this.connectionDetector = connectionDetector;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    public void run(String... args) {
        // Vérifier la connexion internet
        if (!connectionDetector.isOnline()) {
            log.warn("⚠️ Application en mode OFFLINE - Import utilisateurs Firebase ignoré");
            return;
        }

        try {
            log.info("📥 Import des utilisateurs depuis Firebase Authentication vers PostgreSQL...");
            
            int created = 0;
            int updated = 0;
            int skipped = 0;
            
            ListUsersPage page = FirebaseAuth.getInstance().listUsers(null);
            
            while (page != null) {
                for (UserRecord firebaseUser : page.getValues()) {
                    try {
                        // Vérifier si l'utilisateur existe déjà en local
                        User existingUser = userRepository.findByEmail(firebaseUser.getEmail()).orElse(null);
                        
                        if (existingUser != null) {
                            // Mettre à jour avec les infos Firebase
                            boolean needsUpdate = false;
                            
                            // Synchroniser l'UID Firebase
                            if (!Boolean.TRUE.equals(existingUser.getSyncedToFirebase())) {
                                existingUser.setFirebaseUid(firebaseUser.getUid());
                                existingUser.setSyncedToFirebase(true);
                                needsUpdate = true;
                            }
                            
                            // Synchroniser le statut disabled -> blockedUntil
                            if (firebaseUser.isDisabled()) {
                                // Si l'utilisateur est désactivé dans Firebase, le bloquer localement (pour 100 ans)
                                if (existingUser.getBlockedUntil() == null || existingUser.getBlockedUntil().isBefore(Instant.now())) {
                                    existingUser.setBlockedUntil(Instant.now().plusSeconds(100L * 365 * 24 * 3600)); // 100 ans
                                    needsUpdate = true;
                                }
                            } else {
                                // Si l'utilisateur n'est plus désactivé dans Firebase, le débloquer localement
                                if (existingUser.getBlockedUntil() != null && existingUser.getBlockedUntil().isAfter(Instant.now())) {
                                    existingUser.setBlockedUntil(null);
                                    existingUser.setLoginAttempts(0);
                                    needsUpdate = true;
                                }
                            }
                            
                            if (needsUpdate) {
                                userRepository.save(existingUser);
                                updated++;
                            } else {
                                skipped++;
                            }
                        } else {
                            // Créer un nouvel utilisateur en local depuis Firebase
                            User newUser = new User();
                            newUser.setUid("local-" + System.currentTimeMillis() + "-" + created);
                            newUser.setEmail(firebaseUser.getEmail());
                            
                            // Nom et prénom depuis displayName
                            if (firebaseUser.getDisplayName() != null && !firebaseUser.getDisplayName().isEmpty()) {
                                String[] nameParts = firebaseUser.getDisplayName().split(" ", 2);
                                newUser.setPrenom(nameParts[0]);
                                if (nameParts.length > 1) {
                                    newUser.setNom(nameParts[1]);
                                }
                            }
                            
                            // Récupérer le rôle depuis les custom claims
                            String role = "UTILISATEUR"; // Par défaut
                            try {
                                Map<String, Object> claims = firebaseUser.getCustomClaims();
                                if (claims != null && claims.containsKey("role")) {
                                    role = (String) claims.get("role");
                                }
                            } catch (Exception e) {
                                log.debug("Impossible de récupérer le rôle pour {}", firebaseUser.getEmail());
                            }
                            newUser.setRole(role);
                            
                            // Générer un mot de passe temporaire (l'utilisateur devra le réinitialiser)
                            String tempPassword = "firebase-import-" + System.currentTimeMillis();
                            newUser.setPasswordHash(passwordEncoder.encode(tempPassword));
                            
                            newUser.setFirebaseUid(firebaseUser.getUid());
                            newUser.setSyncedToFirebase(true);
                            newUser.setCreatedAt(Instant.now());
                            newUser.setUpdatedAt(Instant.now());
                            
                            // Si l'utilisateur est désactivé dans Firebase, le bloquer localement
                            if (firebaseUser.isDisabled()) {
                                newUser.setBlockedUntil(Instant.now().plusSeconds(100L * 365 * 24 * 3600)); // 100 ans
                            }
                            
                            userRepository.save(newUser);
                            created++;
                            
                            log.info("   ✅ Importé: {} ({})", firebaseUser.getEmail(), role);
                        }
                        
                    } catch (Exception e) {
                        log.error("   ❌ Erreur import user {}: {}", firebaseUser.getEmail(), e.getMessage());
                    }
                }
                
                page = page.getNextPage();
            }
            
            log.info("   ✅ Firebase Auth → PostgreSQL: {} créé(s), {} mis à jour, {} ignoré(s)", 
                    created, updated, skipped);
            
        } catch (FirebaseAuthException e) {
            log.error("❌ Erreur lors de l'import des utilisateurs Firebase: {}", e.getMessage());
        } catch (Exception e) {
            log.error("❌ Erreur inattendue: {}", e.getMessage());
        }
    }
}
