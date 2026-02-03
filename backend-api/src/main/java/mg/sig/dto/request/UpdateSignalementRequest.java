package mg.sig.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO pour la mise à jour d'un signalement par le manager.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Requête de mise à jour d'un signalement")
public class UpdateSignalementRequest {

    @Schema(description = "Nouveau code statut", example = "en_cours", 
            allowableValues = {"nouveau", "en_cours", "planifie", "en_attente", "termine"})
    private String statut;

    @DecimalMin(value = "0.0", message = "La surface doit être positive")
    @Schema(description = "Surface en m²", example = "150")
    private BigDecimal surface;

    @DecimalMin(value = "0.0", message = "Le budget doit être positif")
    @Schema(description = "Budget estimé en MGA", example = "45000000")
    private BigDecimal budgetEstime;

    @Schema(description = "ID de l'entreprise assignée", example = "1")
    private Integer entrepriseId;
    
    @Schema(description = "Nom de l'entreprise (alternatif)", example = "COLAS Madagascar")
    private String entreprise;

    @Schema(description = "Commentaire pour l'historique", example = "Travaux démarrés")
    private String commentaire;
}
