package mg.uem.mg.clouds5p17authapi.service;

import mg.uem.mg.clouds5p17authapi.entity.Signalement;
import mg.uem.mg.clouds5p17authapi.repository.SignalementRepository;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import mg.uem.mg.clouds5p17authapi.entity.User;
import mg.uem.mg.clouds5p17authapi.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for synchronizing offline users to Firebase when connection is
 * restored.
 */
@Service
public class SyncService {

    private static final Logger log = LoggerFactory.getLogger(SyncService.class);

    private final UserRepository userRepository;
    private final SignalementRepository signalementRepository;
    private final FirebaseService firebaseService;
    private final ConnectionDetectorService connectionDetector;

    public SyncService(UserRepository userRepository, SignalementRepository signalementRepository,
                      FirebaseService firebaseService, ConnectionDetectorService connectionDetector) {
        this.userRepository = userRepository;
        this.signalementRepository = signalementRepository;
        this.firebaseService = firebaseService;
        this.connectionDetector = connectionDetector;
    }

    /**
     * Sync all unsynced local users to Firebase.
     * Called periodically when online.
     */
    @Scheduled(fixedDelay = 60000) // Check every 60 seconds
    public void syncPendingUsers() {
        // Ne pas synchroniser automatiquement en mode local
        if (!connectionDetector.isOnline()) {
            log.debug("Offline - skipping sync");
            return;
        }

        List<User> unsyncedUsers = userRepository.findBySyncedToFirebaseFalse();

        if (unsyncedUsers.isEmpty()) {
            return;
        }

        log.info("Found {} users to sync to Firebase", unsyncedUsers.size());

        for (User user : unsyncedUsers) {
            try {
                syncUserToFirebase(user);
            } catch (Exception e) {
                log.error("Failed to sync user {}: {}", user.getEmail(), e.getMessage());
            }
        }
    }

    /**
     * Sync a single user to Firebase.
     */
    @Transactional
    public boolean syncUserToFirebase(User user) {
        if (user.getSyncedToFirebase()) {
            return true; // Already synced
        }

        try {
            // Check if user already exists on Firebase
            UserRecord existingUser = null;
            try {
                existingUser = FirebaseAuth.getInstance().getUserByEmail(user.getEmail());
            } catch (FirebaseAuthException e) {
                // User doesn't exist, will create
            }

            String firebaseUid;

            if (existingUser != null) {
                // User already exists on Firebase
                firebaseUid = existingUser.getUid();
                log.info("User {} already exists on Firebase (uid={}), linking...", user.getEmail(), firebaseUid);
            } else {
                // Create new user on Firebase
                // Note: We can't sync the password directly since we only have the hash
                // The user will need to reset their password or we create with a temp password
                UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                        .setEmail(user.getEmail())
                        .setDisplayName((user.getNom() != null ? user.getNom() : "") + " " +
                                (user.getPrenom() != null ? user.getPrenom() : ""))
                        .setEmailVerified(false);
                // We don't set password - user will need to use "forgot password" flow

                UserRecord newUser = FirebaseAuth.getInstance().createUser(createRequest);
                firebaseUid = newUser.getUid();
                log.info("Created user on Firebase: {} (uid={})", user.getEmail(), firebaseUid);
            }

            // Set custom claims
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", user.getRole());
            claims.put("numEtu", user.getNumEtu());
            claims.put("localUid", user.getUid()); // Keep reference to local UID
            FirebaseAuth.getInstance().setCustomUserClaims(firebaseUid, claims);

            // Update local user
            user.setFirebaseUid(firebaseUid);
            user.setSyncedToFirebase(true);
            userRepository.save(user);

            log.info("Successfully synced user {} to Firebase", user.getEmail());
            return true;

        } catch (FirebaseAuthException e) {
            log.error("Failed to sync user {} to Firebase: {}", user.getEmail(), e.getMessage());
            return false;
        }
    }

    /**
     * Get sync status.
     */
    public Map<String, Object> getSyncStatus() {
        List<User> unsynced = userRepository.findBySyncedToFirebaseFalse();
        long totalUsers = userRepository.count();

        Map<String, Object> status = new HashMap<>();
        status.put("totalLocalUsers", totalUsers);
        status.put("unsyncedCount", unsynced.size());
        status.put("syncedCount", totalUsers - unsynced.size());
        status.put("online", connectionDetector.isOnline());

        return status;
    }

    /**
     * Force sync all pending users now.
     */
    @Transactional
    public Map<String, Object> forceSyncAll() {
        if (!connectionDetector.isOnline()) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", "Cannot sync while offline");
            return result;
        }

        List<User> unsyncedUsers = userRepository.findBySyncedToFirebaseFalse();
        int success = 0;
        int failed = 0;

        for (User user : unsyncedUsers) {
            if (syncUserToFirebase(user)) {
                success++;
            } else {
                failed++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("synced", success);
        result.put("failed", failed);
        return result;
    }

    /**
     * Force sync ALL signalements to Firebase (regardless of synced_to_firebase flag).
     * @return Map with sync results
     */
    @Transactional
    public Map<String, Object> syncAllSignalementsToFirebase() {
        if (!connectionDetector.isOnline()) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", "Cannot sync while offline");
            return result;
        }

        List<Signalement> allSignalements = signalementRepository.findAll();
        int success = 0;
        int failed = 0;

        for (Signalement signalement : allSignalements) {
            try {
                // Save to Firebase Realtime Database
                String firebaseId = firebaseService.saveSignalement(signalement);
                
                // Update local record
                signalement.setFirebaseId(firebaseId);
                signalement.setSyncedToFirebase(true);
                signalementRepository.save(signalement);
                
                success++;
                log.info("Synced signalement {} to Firebase ({})", signalement.getId(), firebaseId);
            } catch (Exception e) {
                failed++;
                log.error("Failed to sync signalement {}: {}", signalement.getId(), e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("syncedCount", success);
        result.put("failedCount", failed);
        result.put("totalSignalements", allSignalements.size());
        result.put("message", success + " signalement(s) synchronisé(s) avec succès");
        return result;
    }

    /**
     * Sync only unsynced signalements to Firebase.
     * @return Map with sync results
     */
    @Transactional
    public Map<String, Object> syncSignalementsToFirebase() {
        if (!connectionDetector.isOnline()) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", "Cannot sync while offline");
            return result;
        }

        List<Signalement> unsyncedSignalements = signalementRepository.findBySyncedToFirebaseFalse();
        int success = 0;
        int failed = 0;

        for (Signalement signalement : unsyncedSignalements) {
            try {
                // Save to Firebase
                String firebaseId = firebaseService.saveSignalement(signalement);
                
                // Update local record
                signalement.setFirebaseId(firebaseId);
                signalement.setSyncedToFirebase(true);
                signalementRepository.save(signalement);
                
                success++;
                log.info("Synced signalement {} to Firebase ({})", signalement.getId(), firebaseId);
            } catch (Exception e) {
                failed++;
                log.error("Failed to sync signalement {}: {}", signalement.getId(), e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("syncedCount", success);
        result.put("failedCount", failed);
        result.put("totalSignalements", unsyncedSignalements.size());
        result.put("message", success + " signalement(s) synchronisé(s) avec succès");
        return result;
    }

    /**
     * Get signalements sync status.
     */
    public Map<String, Object> getSignalementsSyncStatus() {
        List<Signalement> unsynced = signalementRepository.findBySyncedToFirebaseFalse();
        long totalSignalements = signalementRepository.count();

        Map<String, Object> status = new HashMap<>();
        status.put("totalLocalSignalements", totalSignalements);
        status.put("unsyncedCount", unsynced.size());
        status.put("syncedCount", totalSignalements - unsynced.size());
        status.put("online", connectionDetector.isOnline());

        return status;
    }

    /**
     * Synchronise les signalements depuis Firebase vers PostgreSQL (Local).
     * Récupère les signalements qui existent dans Firebase mais pas en local.
     * Gère les photos base64 en les sauvegardant comme fichiers.
     * @return Map avec les résultats de la synchronisation
     */
    @Transactional
    public Map<String, Object> syncSignalementsFromFirebase() {
        if (!connectionDetector.isOnline()) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", "Cannot sync while offline");
            return result;
        }

        try {
            // Récupérer tous les signalements depuis Firebase
            List<Map<String, Object>> firebaseSignalements = firebaseService.fetchSignalementsFromFirebase();
            
            int created = 0;
            int updated = 0;
            int skipped = 0;
            List<String> errors = new ArrayList<>();

            for (Map<String, Object> fbData : firebaseSignalements) {
                try {
                    Long firebaseId = (Long) fbData.get("id");
                    String firebaseKey = (String) fbData.get("firebaseKey");
                    
                    // Vérifier si le signalement existe déjà en local
                    Signalement existing = null;
                    
                    // 1. Chercher par firebase_id (clé Firebase)
                    if (firebaseKey != null) {
                        existing = signalementRepository.findByFirebaseId(firebaseKey);
                    }
                    
                    // 2. Si pas trouvé, chercher par ID numérique
                    if (existing == null && firebaseId != null) {
                        existing = signalementRepository.findById(firebaseId).orElse(null);
                    }
                    
                    if (existing != null) {
                        // Le signalement existe déjà, le marquer comme synchronisé
                        if (!Boolean.TRUE.equals(existing.getSyncedToFirebase())) {
                            existing.setSyncedToFirebase(true);
                            existing.setFirebaseId(firebaseKey);
                            signalementRepository.save(existing);
                            updated++;
                        } else {
                            skipped++;
                        }
                    } else {
                        // Créer un nouveau signalement en local depuis les données Firebase
                        Signalement newSignalement = new Signalement();
                        newSignalement.setTitle((String) fbData.get("title"));
                        newSignalement.setDescription((String) fbData.get("description"));
                        newSignalement.setLatitude((Double) fbData.get("latitude"));
                        newSignalement.setLongitude((Double) fbData.get("longitude"));
                        newSignalement.setStatus((String) fbData.getOrDefault("status", "NOUVEAU"));
                        newSignalement.setSurfaceM2((Double) fbData.get("surfaceM2"));
                        newSignalement.setBudgetAr((Double) fbData.get("budgetAr"));
                        newSignalement.setEntreprise((String) fbData.get("entreprise"));
                        newSignalement.setUserUid((String) fbData.get("userUid"));
                        newSignalement.setUserEmail((String) fbData.get("userEmail"));
                        newSignalement.setSyncedToFirebase(true);
                        newSignalement.setFirebaseId(firebaseKey);
                        
                        // Gérer les dates
                        String dateNouveau = (String) fbData.get("dateNouveau");
                        if (dateNouveau != null) {
                            newSignalement.setDateNouveau(parseInstant(dateNouveau));
                        }
                        String dateEnCours = (String) fbData.get("dateEnCours");
                        if (dateEnCours != null) {
                            newSignalement.setDateEnCours(parseInstant(dateEnCours));
                        }
                        String dateTermine = (String) fbData.get("dateTermine");
                        if (dateTermine != null) {
                            newSignalement.setDateTermine(parseInstant(dateTermine));
                        }
                        String createdAt = (String) fbData.get("createdAt");
                        if (createdAt != null) {
                            newSignalement.setCreatedAt(parseInstant(createdAt));
                        }
                        
                        // Sauvegarder d'abord pour avoir l'ID
                        newSignalement = signalementRepository.save(newSignalement);
                        
                        // Gérer les photos base64 depuis Firebase
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> photos = (List<Map<String, Object>>) fbData.get("photos");
                        if (photos != null && !photos.isEmpty()) {
                            try {
                                String photoUrl = saveBase64Photo(newSignalement.getId(), photos.get(0));
                                if (photoUrl != null) {
                                    newSignalement.setPhotoUrl(photoUrl);
                                    signalementRepository.save(newSignalement);
                                }
                            } catch (Exception e) {
                                log.warn("Impossible de sauvegarder la photo pour signalement {}: {}", 
                                    newSignalement.getId(), e.getMessage());
                            }
                        }
                        
                        created++;
                        log.info("Créé signalement local depuis Firebase: {} (firebaseKey={})", 
                            newSignalement.getTitle(), firebaseKey);
                    }
                    
                } catch (Exception e) {
                    errors.add("Erreur signalement Firebase: " + e.getMessage());
                    log.error("Erreur lors de la synchronisation d'un signalement: {}", e.getMessage());
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("createdCount", created);
            result.put("updatedCount", updated);
            result.put("skippedCount", skipped);
            result.put("totalProcessed", firebaseSignalements.size());
            result.put("message", String.format("%d créé(s), %d mis à jour, %d ignoré(s)", created, updated, skipped));
            
            if (!errors.isEmpty()) {
                result.put("errors", errors);
            }
            
            return result;
            
        } catch (Exception e) {
            log.error("Erreur lors de la synchronisation depuis Firebase: {}", e.getMessage());
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", "Erreur: " + e.getMessage());
            return result;
        }
    }

    /**
     * Sauvegarde une photo base64 depuis Firebase en fichier local.
     * @param signalementId L'ID du signalement
     * @param photoData Les données de la photo (pixelData, mimeType, etc.)
     * @return L'URL relative de la photo sauvegardée
     */
    private String saveBase64Photo(Long signalementId, Map<String, Object> photoData) {
        String pixelData = (String) photoData.get("pixelData");
        if (pixelData == null || pixelData.isEmpty()) {
            return null;
        }
        
        try {
            // Décoder le base64 en bytes
            byte[] imageBytes = Base64.getDecoder().decode(pixelData);
            
            // Déterminer l'extension
            String mimeType = (String) photoData.getOrDefault("mimeType", "image/jpeg");
            String extension = ".jpg";
            if ("image/png".equals(mimeType)) extension = ".png";
            
            // Créer le répertoire si nécessaire
            String uploadDir = "uploads/signalements/";
            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }
            
            // Générer le nom de fichier
            String filename = "sig_" + signalementId + "_firebase_" + UUID.randomUUID().toString() + extension;
            Path filePath = Paths.get(uploadDir + filename);
            
            // Écrire le fichier
            Files.write(filePath, imageBytes);
            
            String photoUrl = "/uploads/signalements/" + filename;
            log.info("Photo sauvegardée depuis Firebase: {} ({} bytes)", photoUrl, imageBytes.length);
            return photoUrl;
            
        } catch (Exception e) {
            log.error("Erreur lors de la sauvegarde de la photo base64: {}", e.getMessage());
            return null;
        }
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
