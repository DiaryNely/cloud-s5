package mg.sig.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import mg.sig.dto.ApiResponse;
import mg.sig.dto.MapConfigDTO;
import mg.sig.service.FirebaseService;
import mg.sig.service.MapService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controller pour la configuration et les outils.
 */
@RestController
@RequestMapping("/config")
@RequiredArgsConstructor
@Tag(name = "Configuration", description = "Configuration et outils système")
public class ConfigController {

    private final MapService mapService;
    private final FirebaseService firebaseService;

    @GetMapping("/map")
    @Operation(summary = "Configuration carte", description = "Récupère la configuration de la carte")
    public ResponseEntity<MapConfigDTO> getMapConfig() {
        return ResponseEntity.ok(mapService.getMapConfig());
    }

    @PostMapping("/sync/firebase")
    @Operation(summary = "Synchroniser Firebase", description = "Force la synchronisation avec Firebase")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Integer>> syncFirebase(Authentication authentication) {
        String adminEmail = authentication.getName();
        int count = firebaseService.forceSync(adminEmail);
        return ResponseEntity.ok(ApiResponse.success("Synchronisation terminée", count));
    }
}
