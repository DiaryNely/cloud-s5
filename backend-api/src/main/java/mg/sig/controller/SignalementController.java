package mg.sig.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import mg.sig.dto.*;
import mg.sig.dto.request.CreateSignalementRequest;
import mg.sig.dto.request.UpdateSignalementRequest;
import mg.sig.service.SignalementService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller des signalements.
 */
@RestController
@RequestMapping("/signalements")
@RequiredArgsConstructor
@Tag(name = "Signalements", description = "Gestion des signalements routiers")
public class SignalementController {

    private final SignalementService signalementService;

    @GetMapping
    @Operation(summary = "Liste des signalements", description = "Récupère tous les signalements")
    public ResponseEntity<List<SignalementDTO>> getAllSignalements() {
        return ResponseEntity.ok(signalementService.getAllSignalements());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'un signalement", description = "Récupère un signalement par son ID")
    public ResponseEntity<SignalementDTO> getSignalementById(@PathVariable Integer id) {
        return ResponseEntity.ok(signalementService.getSignalementById(id));
    }

    @GetMapping("/statistiques")
    @Operation(summary = "Statistiques", description = "Récupère les statistiques globales des signalements")
    public ResponseEntity<StatistiquesDTO> getStatistiques() {
        return ResponseEntity.ok(signalementService.getStatistiques());
    }

    @GetMapping("/mes-signalements")
    @Operation(summary = "Mes signalements", description = "Récupère les signalements de l'utilisateur connecté")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SignalementDTO>> getMesSignalements(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(signalementService.getSignalementsByUser(email));
    }

    @GetMapping("/statut/{statut}")
    @Operation(summary = "Par statut", description = "Récupère les signalements par statut")
    public ResponseEntity<List<SignalementDTO>> getSignalementsByStatus(@PathVariable String statut) {
        return ResponseEntity.ok(signalementService.getSignalementsByStatus(statut));
    }

    @GetMapping("/{id}/historique")
    @Operation(summary = "Historique", description = "Récupère l'historique des changements de statut d'un signalement")
    public ResponseEntity<Map<Integer, List<HistoriqueStatutDTO>>> getHistorique(@PathVariable Integer id) {
        List<HistoriqueStatutDTO> historique = signalementService.getHistorique(id);
        return ResponseEntity.ok(Map.of(id, historique));
    }

    @PostMapping
    @Operation(summary = "Créer un signalement", description = "Crée un nouveau signalement")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SignalementDTO> createSignalement(
            @Valid @RequestBody CreateSignalementRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        
        String email = authentication.getName();
        SignalementDTO created = signalementService.createSignalement(request, email, httpRequest);
        return ResponseEntity.status(201).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un signalement", description = "Met à jour un signalement existant")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<SignalementDTO> updateSignalement(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateSignalementRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        
        String email = authentication.getName();
        SignalementDTO updated = signalementService.updateSignalement(id, request, email, httpRequest);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/statut")
    @Operation(summary = "Changer le statut", description = "Change uniquement le statut d'un signalement")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<SignalementDTO> changeStatut(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        
        String email = authentication.getName();
        UpdateSignalementRequest request = UpdateSignalementRequest.builder()
                .statut(body.get("statut"))
                .commentaire(body.get("commentaire"))
                .build();
        
        SignalementDTO updated = signalementService.updateSignalement(id, request, email, httpRequest);
        return ResponseEntity.ok(updated);
    }
}
