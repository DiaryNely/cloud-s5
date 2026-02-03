package mg.sig.mapper;

import mg.sig.dto.HistoriqueStatutDTO;
import mg.sig.entity.SignalementHistorique;
import org.mapstruct.*;

/**
 * Mapper pour l'historique des signalements.
 */
@Mapper(componentModel = "spring")
public interface HistoriqueMapper {

    @Mapping(target = "date", source = "dateModification")
    @Mapping(target = "statut", source = "nouveauStatus.code", qualifiedByName = "statusCodeToLowerCase")
    @Mapping(target = "modifiePar", source = "modifiePar", qualifiedByName = "userToNomComplet")
    HistoriqueStatutDTO toDTO(SignalementHistorique entity);

    @Named("statusCodeToLowerCase")
    default String statusCodeToLowerCase(String code) {
        return code != null ? code.toLowerCase() : null;
    }

    @Named("userToNomComplet")
    default String userToNomComplet(mg.sig.entity.User user) {
        if (user != null) {
            return user.getNomComplet();
        }
        return "Système";
    }
}
