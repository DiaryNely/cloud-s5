package mg.sig.mapper;

import mg.sig.dto.*;
import mg.sig.entity.*;
import org.mapstruct.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Mapper pour les signalements.
 */
@Mapper(componentModel = "spring")
public interface SignalementMapper {

    @Mapping(target = "statut", source = "status.code", qualifiedByName = "statusCodeToLowerCase")
    @Mapping(target = "entreprise", source = "entreprise.nom")
    @Mapping(target = "creePar", source = "creePar", qualifiedByName = "userToNomComplet")
    SignalementDTO toDTO(Signalement entity);

    @Named("statusCodeToLowerCase")
    default String statusCodeToLowerCase(String code) {
        return code != null ? code.toLowerCase() : null;
    }

    @Named("userToNomComplet")
    default String userToNomComplet(User user) {
        return user != null ? user.getNomComplet() : null;
    }
}
