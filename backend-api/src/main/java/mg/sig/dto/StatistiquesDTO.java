package mg.sig.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO Statistiques aligné sur calculerStatistiques() du frontend.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Statistiques globales des signalements")
public class StatistiquesDTO {

    @Schema(description = "Nombre total de signalements", example = "8")
    private Long totalSignalements;
    
    @Schema(description = "Alias pour total (compatibilité mobile)", example = "8")
    private Long total;

    @Schema(description = "Surface totale concernée en m²", example = "1465")
    private BigDecimal surfaceTotale;

    @Schema(description = "Budget total estimé en MGA", example = "440000000")
    private BigDecimal budgetTotal;

    @Schema(description = "Nombre de signalements terminés", example = "2")
    private Long termines;
    
    @Schema(description = "Alias termine (compatibilité mobile)", example = "2")
    private Long termine;

    @Schema(description = "Nombre de signalements en cours", example = "3")
    private Long enCours;

    @Schema(description = "Nombre de nouveaux signalements", example = "3")
    private Long nouveaux;
    
    @Schema(description = "Nombre de signalements planifiés", example = "0")
    private Long planifie;

    @Schema(description = "Pourcentage d'avancement global", example = "25.0")
    private BigDecimal pourcentageAvancement;
}
