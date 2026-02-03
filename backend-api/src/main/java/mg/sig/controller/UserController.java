package mg.sig.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import mg.sig.dto.ApiResponse;
import mg.sig.dto.UtilisateurDTO;
import mg.sig.dto.request.CreateUserRequest;
import mg.sig.service.AuthService;
import mg.sig.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller des utilisateurs.
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Utilisateurs", description = "Gestion des utilisateurs")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    @GetMapping
    @Operation(summary = "Liste des utilisateurs", description = "Récupère tous les utilisateurs")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<UtilisateurDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'un utilisateur", description = "Récupère un utilisateur par son ID")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<UtilisateurDTO> getUserById(@PathVariable Integer id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/me")
    @Operation(summary = "Mon profil", description = "Récupère le profil de l'utilisateur connecté")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UtilisateurDTO> getMyProfile(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @GetMapping("/stats")
    @Operation(summary = "Statistiques utilisateurs", description = "Récupère les statistiques des utilisateurs")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<UserService.UserStats> getUserStats() {
        return ResponseEntity.ok(userService.getUserStats());
    }

    @PostMapping
    @Operation(summary = "Créer un utilisateur", description = "Crée un nouvel utilisateur avec un mot de passe temporaire")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<mg.sig.dto.response.CreateUserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        
        String adminEmail = authentication.getName();
        mg.sig.dto.response.CreateUserResponse created = userService.createUser(request, adminEmail, httpRequest);
        return ResponseEntity.status(201).body(created);
    }

    @PostMapping("/{id}/unblock")
    @Operation(summary = "Débloquer un utilisateur", description = "Débloque un compte utilisateur")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> unblockUser(
            @PathVariable Integer id,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        
        String adminEmail = authentication.getName();
        authService.unblockUser(id, adminEmail, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Utilisateur débloqué avec succès"));
    }

    @PostMapping("/{id}/reset-password")
    @Operation(summary = "Réinitialiser le mot de passe", description = "Génère un nouveau mot de passe temporaire pour l'utilisateur")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<mg.sig.dto.response.ResetPasswordResponse> resetPassword(
            @PathVariable Integer id,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        
        String adminEmail = authentication.getName();
        mg.sig.dto.response.ResetPasswordResponse response = userService.resetUserPassword(id, adminEmail, httpRequest);
        return ResponseEntity.ok(response);
    }
}
