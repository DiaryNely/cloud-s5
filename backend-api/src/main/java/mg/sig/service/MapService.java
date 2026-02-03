package mg.sig.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mg.sig.dto.MapConfigDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service de configuration de la carte.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MapService {

    private final ParametreService parametreService;

    @Value("${map.tiles.url}")
    private String tilesUrl;

    @Value("${map.tiles.min-zoom:10}")
    private Integer minZoom;

    @Value("${map.tiles.max-zoom:18}")
    private Integer maxZoom;

    /**
     * Récupère la configuration de la carte
     */
    public MapConfigDTO getMapConfig() {
        return MapConfigDTO.builder()
                .tilesUrl(tilesUrl)
                .centerLatitude(parametreService.getMapCenterLatitude())
                .centerLongitude(parametreService.getMapCenterLongitude())
                .defaultZoom(parametreService.getMapDefaultZoom())
                .minZoom(minZoom)
                .maxZoom(maxZoom)
                .attribution("© OpenStreetMap contributors")
                .build();
    }
}
