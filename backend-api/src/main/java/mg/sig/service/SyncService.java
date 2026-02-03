package mg.sig.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mg.sig.entity.AuditLog;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service de synchronisation manuelle entre PostgreSQL et Firebase.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncService {

    private final ConnectivityService connectivityService;
    private final FirebaseService firebaseService;
    private final AuditService auditService;

    private boolean isSyncing = false;
    private LocalDateTime lastSyncDate = null;
    private SyncResult lastSyncResult = null;

    /**
     * Synchronise manuellement PostgreSQL → Firebase
     */
    @Transactional
    public SyncResult syncToFirebase(String adminEmail) {
        if (isSyncing) {
            throw new RuntimeException("Synchronisation déjà en cours");
        }

        if (!connectivityService.checkNow()) {
            throw new RuntimeException("Pas de connexion Internet. Synchronisation impossible.");
        }

        isSyncing = true;
        SyncResult result = new SyncResult();
        result.setStartTime(LocalDateTime.now());

        try {
            log.info("=== DÉBUT SYNCHRONISATION MANUELLE ===");

            // 1. Synchroniser les utilisateurs
            int usersCount = firebaseService.syncUsersToFirebase();
            result.setUsersSynced(usersCount);
            log.info("✓ {} utilisateurs synchronisés", usersCount);

            // 2. Synchroniser les signalements
            int signalementCount = firebaseService.syncSignalementsToFirebaseManual();
            result.setSignalementsSynced(signalementCount);
            log.info("✓ {} signalements synchronisés", signalementCount);

            result.setSuccess(true);
            result.setEndTime(LocalDateTime.now());
            result.setMessage("Synchronisation réussie");

            lastSyncDate = result.getEndTime();
            lastSyncResult = result;

            // Log audit
            auditService.logAction(
                AuditLog.ACTION_SYNCHRONISATION, "FIREBASE", null,
                adminEmail, 
                String.format("Sync manuelle: %d utilisateurs, %d signalements", usersCount, signalementCount),
                null
            );

            log.info("=== FIN SYNCHRONISATION MANUELLE ===");
            return result;

        } catch (Exception e) {
            log.error("Erreur synchronisation", e);
            result.setSuccess(false);
            result.setEndTime(LocalDateTime.now());
            result.setMessage("Erreur: " + e.getMessage());
            lastSyncResult = result;
            throw new RuntimeException("Erreur synchronisation: " + e.getMessage());
        } finally {
            isSyncing = false;
        }
    }

    /**
     * Récupère le statut de la dernière synchronisation
     */
    public SyncStatus getStatus() {
        return SyncStatus.builder()
                .isSyncing(isSyncing)
                .lastSyncDate(lastSyncDate)
                .lastResult(lastSyncResult)
                .isOnline(connectivityService.isOnline())
                .build();
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SyncStatus {
        private boolean isSyncing;
        private LocalDateTime lastSyncDate;
        private SyncResult lastResult;
        private boolean isOnline;
    }

    @lombok.Data
    public static class SyncResult {
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private int usersSynced;
        private int signalementsSynced;
        private boolean success;
        private String message;

        public long getDuration() {
            if (startTime != null && endTime != null) {
                return java.time.Duration.between(startTime, endTime).toMillis();
            }
            return 0;
        }

        public long getDurationSeconds() {
            if (startTime != null && endTime != null) {
                return java.time.Duration.between(startTime, endTime).getSeconds();
            }
            return 0;
        }
    }
}
