package mg.sig.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

/**
 * DTO pour la configuration de la carte.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Configuration de la carte")
public class MapConfigDTO {

    @Schema(description = "URL des tuiles de carte", example = "http://localhost:8081/tile/{z}/{x}/{y}.png")
    private String tilesUrl;

    @Schema(description = "Latitude du centre", example = "-18.8792")
    private Double centerLatitude;

    @Schema(description = "Longitude du centre", example = "47.5079")
    private Double centerLongitude;

    @Schema(description = "Niveau de zoom par défaut", example = "13")
    private Integer defaultZoom;

    @Schema(description = "Zoom minimum", example = "10")
    private Integer minZoom;

    @Schema(description = "Zoom maximum", example = "18")
    private Integer maxZoom;

    @Schema(description = "Attribution de la carte", example = "© OpenStreetMap contributors")
    private String attribution;
}
