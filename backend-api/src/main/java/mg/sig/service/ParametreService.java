package mg.sig.service;

import lombok.RequiredArgsConstructor;
import mg.sig.entity.Parametre;
import mg.sig.repository.ParametreRepository;
import org.springframework.stereotype.Service;

/**
 * Service de gestion des paramètres système.
 */
@Service
@RequiredArgsConstructor
public class ParametreService {

    private final ParametreRepository parametreRepository;

    public Integer getMaxTentativesConnexion() {
        return getIntValue(Parametre.MAX_TENTATIVES_CONNEXION, 3);
    }

    public Integer getDureeSessionHeures() {
        return getIntValue(Parametre.DUREE_SESSION_HEURES, 24);
    }

    public Integer getDureeBlocageMinutes() {
        return getIntValue(Parametre.DUREE_BLOCAGE_MINUTES, 30);
    }

    public Integer getSyncFirebaseIntervalMinutes() {
        return getIntValue(Parametre.SYNC_FIREBASE_INTERVAL_MINUTES, 5);
    }

    public Double getMapCenterLatitude() {
        return getDoubleValue(Parametre.MAP_CENTER_LATITUDE, -18.8792);
    }

    public Double getMapCenterLongitude() {
        return getDoubleValue(Parametre.MAP_CENTER_LONGITUDE, 47.5079);
    }

    public Integer getMapDefaultZoom() {
        return getIntValue(Parametre.MAP_DEFAULT_ZOOM, 13);
    }

    private Integer getIntValue(String cle, Integer defaultValue) {
        return parametreRepository.findByCle(cle)
                .map(Parametre::getValeurAsInteger)
                .orElse(defaultValue);
    }

    private Double getDoubleValue(String cle, Double defaultValue) {
        return parametreRepository.findByCle(cle)
                .map(Parametre::getValeurAsDouble)
                .orElse(defaultValue);
    }

    public void updateParametre(String cle, String valeur) {
        parametreRepository.findByCle(cle).ifPresent(p -> {
            p.setValeur(valeur);
            parametreRepository.save(p);
        });
    }
}
