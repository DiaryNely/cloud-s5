package mg.sig.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mg.sig.service.SyncService;
import mg.sig.service.ConnectivityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.HashMap;

/**
 * Contrôleur pour la synchronisation manuelle Firebase <-> PostgreSQL
 */
@Slf4j
@RestController
@RequestMapping("/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;
    private final ConnectivityService connectivityService;

    /**
     * Synchronise manuellement toutes les données vers Firebase
     * Réservé aux administrateurs
     */
    @PostMapping("/manual")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> syncToFirebase(Principal principal) {
        try {
            log.info("Début synchronisation manuelle par {}", principal.getName());
            
            // Vérifier si Firebase est disponible
            if (!connectivityService.isOnline()) {
                return ResponseEntity.status(503).body(Map.of(
                    "success", false,
                    "message", "Firebase n'est pas disponible. Vérifiez votre connexion internet."
                ));
            }
            
            SyncService.SyncResult result = syncService.syncToFirebase(principal.getName());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isSuccess());
            response.put("message", result.isSuccess() ? "Synchronisation réussie" : "Synchronisation échouée");
            response.put("usersSynced", result.getUsersSynced());
            response.put("signalementsSynced", result.getSignalementsSynced());
            response.put("duration", result.getDuration());
            response.put("startTime", result.getStartTime());
            
            log.info("Synchronisation terminée: {} users, {} signalements en {} ms", 
                result.getUsersSynced(), result.getSignalementsSynced(), result.getDuration());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Erreur lors de la synchronisation", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }

    /**
     * Obtient le statut de la synchronisation
     */
    @GetMapping("/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> getSyncStatus() {
        try {
            SyncService.SyncStatus status = syncService.getStatus();
            
            Map<String, Object> response = new HashMap<>();
            response.put("isSyncing", status.isSyncing());
            response.put("lastSyncDate", status.getLastSyncDate());
            response.put("isOnline", status.isOnline());
            response.put("message", status.isSyncing() ? "Synchronisation en cours..." : 
                (status.isOnline() ? "Firebase disponible" : "Mode offline"));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Erreur lors de la récupération du statut", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }

    /**
     * Force la vérification de la connectivité Firebase
     */
    @PostMapping("/check-connectivity")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> checkConnectivity() {
        try {
            boolean online = connectivityService.checkNow();
            
            return ResponseEntity.ok(Map.of(
                "online", online,
                "message", online ? "Firebase est accessible" : "Firebase n'est pas accessible"
            ));
            
        } catch (Exception e) {
            log.error("Erreur lors de la vérification de connectivité", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }
}
