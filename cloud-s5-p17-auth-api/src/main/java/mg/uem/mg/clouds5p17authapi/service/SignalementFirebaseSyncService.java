package mg.uem.mg.clouds5p17authapi.service;

import mg.uem.mg.clouds5p17authapi.entity.Signalement;
import mg.uem.mg.clouds5p17authapi.repository.SignalementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Synchronise automatiquement les signalements depuis Firebase vers PostgreSQL au démarrage
 * ET synchronise les signalements locaux non synchronisés vers Firebase
 */
@Component
@Order(3) // S'exécute après les autres initialisations
public class SignalementFirebaseSyncService implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SignalementFirebaseSyncService.class);

    private final SignalementRepository signalementRepository;
    private final FirebaseService firebaseService;
    private final ConnectionDetectorService connectionDetector;

    public SignalementFirebaseSyncService(SignalementRepository signalementRepository, 
                                         FirebaseService firebaseService,
                                         ConnectionDetectorService connectionDetector) {
        this.signalementRepository = signalementRepository;
        this.firebaseService = firebaseService;
        this.connectionDetector = connectionDetector;
    }

    @Override
    public void run(String... args) {
        // Vérifier la connexion internet
        if (!connectionDetector.isOnline()) {
            log.warn("⚠️ Application en mode OFFLINE - Synchronisation Firebase ignorée");
            return;
        }

        try {
            log.info("🔄 Synchronisation bidirectionnelle des signalements...");
            
            // 1. D'abord, importer depuis Firebase vers Local
            syncFromFirebase();
            
            // 2. Ensuite, envoyer les signalements locaux non synchronisés vers Firebase
            syncToFirebase();
            
        } catch (Exception e) {
            log.error("❌ Erreur lors de la synchronisation des signalements: {}", e.getMessage());
        }
    }

    /**
     * Importe les signalements depuis Firebase vers PostgreSQL
     */
    private void syncFromFirebase() {
        try {
            log.info("📥 Import des signalements depuis Firebase...");
            
            List<Map<String, Object>> firebaseSignalements = firebaseService.fetchSignalementsFromFirebase();
            
            if (firebaseSignalements.isEmpty()) {
                log.info("   Aucun signalement dans Firebase.");
                return;
            }
            
            int created = 0;
            int updated = 0;
            int skipped = 0;

            for (Map<String, Object> fbData : firebaseSignalements) {
                try {
                    Long firebaseId = (Long) fbData.get("id");
                    String firebaseKey = (String) fbData.get("firebaseKey");
                    
                    // Vérifier si le signalement existe déjà en local
                    Signalement existing = null;
                    if (firebaseId != null) {
                        existing = signalementRepository.findById(firebaseId).orElse(null);
                    }
                    
                    // Si firebaseId est null, chercher par firebase_id
                    if (existing == null && firebaseKey != null) {
                        existing = signalementRepository.findAll().stream()
                            .filter(s -> firebaseKey.equals(s.getFirebaseId()))
                            .findFirst()
                            .orElse(null);
                    }
                    
                    if (existing != null) {
                        // Le signalement existe déjà
                        if (!Boolean.TRUE.equals(existing.getSyncedToFirebase())) {
                            existing.setSyncedToFirebase(true);
                            existing.setFirebaseId(firebaseKey);
                            signalementRepository.save(existing);
                            updated++;
                        } else {
                            skipped++;
                        }
                    } else {
                        // Créer un nouveau signalement en local
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
                        
                        signalementRepository.save(newSignalement);
                        created++;
                    }
                    
                } catch (Exception e) {
                    log.error("   Erreur signalement: {}", e.getMessage());
                }
            }

            log.info("   ✅ Firebase → Local: {} créé(s), {} mis à jour, {} ignoré(s)", 
                    created, updated, skipped);
            
        } catch (Exception e) {
            log.error("   ❌ Erreur import Firebase: {}", e.getMessage());
        }
    }

    /**
     * Envoie les signalements locaux non synchronisés vers Firebase
     */
    private void syncToFirebase() {
        try {
            log.info("📤 Envoi des signalements non synchronisés vers Firebase...");
            
            List<Signalement> unsyncedSignalements = signalementRepository.findBySyncedToFirebaseFalse();
            
            if (unsyncedSignalements.isEmpty()) {
                log.info("   Tous les signalements sont déjà synchronisés.");
                return;
            }
            
            int synced = 0;
            for (Signalement signalement : unsyncedSignalements) {
                try {
                    String firebaseId = firebaseService.saveSignalement(signalement);
                    signalement.setFirebaseId(firebaseId);
                    signalement.setSyncedToFirebase(true);
                    signalementRepository.save(signalement);
                    synced++;
                } catch (Exception e) {
                    log.error("   Erreur sync signalement #{}: {}", signalement.getId(), e.getMessage());
                }
            }
            
            log.info("   ✅ Local → Firebase: {} signalement(s) synchronisé(s)", synced);
            
        } catch (Exception e) {
            log.error("   ❌ Erreur export Firebase: {}", e.getMessage());
        }
    }
}
