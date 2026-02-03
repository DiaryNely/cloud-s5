package mg.sig.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

/**
 * DTO pour les entreprises.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Entreprise de travaux")
public class EntrepriseDTO {

    @Schema(description = "Identifiant unique", example = "1")
    private Integer id;

    @Schema(description = "Nom de l'entreprise", example = "COLAS Madagascar")
    private String nom;

    @Schema(description = "Adresse", example = "Antananarivo, Madagascar")
    private String adresse;

    @Schema(description = "Numéro de téléphone", example = "+261 20 22 123 45")
    private String telephone;

    @Schema(description = "Email de contact", example = "contact@colas.mg")
    private String email;

    @Schema(description = "Nom du contact", example = "Directeur Technique")
    private String contactNom;

    @Schema(description = "Entreprise active", example = "true")
    private Boolean actif;
}
