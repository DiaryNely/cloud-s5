package mg.sig.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

/**
 * Réponse de réinitialisation de mot de passe
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Réponse de réinitialisation de mot de passe")
public class ResetPasswordResponse {

    @Schema(description = "Email de l'utilisateur")
    private String email;

    @Schema(description = "Nom complet")
    private String fullName;

    @Schema(description = "Nouveau mot de passe temporaire")
    private String temporaryPassword;

    @Schema(description = "Message")
    private String message;
}
