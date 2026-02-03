package mg.sig.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import mg.sig.dto.UtilisateurDTO;

/**
 * DTO pour la réponse de connexion.
 * Aligné sur la structure retournée par authentifier() du frontend.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Réponse d'authentification")
public class LoginResponse {

    @Schema(description = "Succès de l'authentification", example = "true")
    private Boolean success;

    @Schema(description = "Utilisateur connecté")
    private UserInfo user;

    @Schema(description = "Token JWT", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String token;

    @Schema(description = "Refresh token")
    private String refreshToken;

    @Schema(description = "Message d'erreur en cas d'échec")
    private String message;

    /**
     * Info utilisateur simplifiée pour la réponse de login.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserInfo {
        @Schema(description = "Email", example = "admin@manager.mg")
        private String email;
        
        @Schema(description = "Nom", example = "Admin")
        private String nom;
        
        @Schema(description = "Prénom", example = "Manager")
        private String prenom;
        
        @Schema(description = "Rôle", example = "manager")
        private String role;
    }

    /**
     * Factory pour une réponse de succès
     */
    public static LoginResponse success(String email, String nom, String prenom, String role, String token, String refreshToken) {
        return LoginResponse.builder()
                .success(true)
                .user(UserInfo.builder()
                        .email(email)
                        .nom(nom)
                        .prenom(prenom)
                        .role(role)
                        .build())
                .token(token)
                .refreshToken(refreshToken)
                .build();
    }

    /**
     * Factory pour une réponse d'échec
     */
    public static LoginResponse failure(String message) {
        return LoginResponse.builder()
                .success(false)
                .message(message)
                .build();
    }
}
