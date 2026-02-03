package mg.sig.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * DTO pour la requête de connexion.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Requête d'authentification")
public class LoginRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format email invalide")
    @Schema(description = "Adresse email", example = "admin@manager.mg", required = true)
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Schema(description = "Mot de passe", example = "Manager2026!", required = true)
    private String password;

    @Schema(description = "Type de client", example = "web", allowableValues = {"web", "mobile"})
    private String clientType;
}
