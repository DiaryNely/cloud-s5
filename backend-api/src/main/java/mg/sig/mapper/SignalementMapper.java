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
    @Mapping(target = "avancement", source = "status.code", qualifiedByName = "statusToAvancement")
    @Mapping(target = "photos", source = "photos", qualifiedByName = "photosToUrls")
    SignalementDTO toDTO(Signalement entity);

    @Named("statusCodeToLowerCase")
    default String statusCodeToLowerCase(String code) {
        return code != null ? code.toLowerCase() : null;
    }

    @Named("userToNomComplet")
    default String userToNomComplet(User user) {
        return user != null ? user.getNomComplet() : null;
    }

    @Named("statusToAvancement")
    default Integer statusToAvancement(String code) {
        if (code == null) return 0;
        return switch (code.toUpperCase()) {
            case "NOUVEAU" -> 0;
            case "EN_COURS" -> 50;
            case "TERMINE" -> 100;
            default -> 0;
        };
    }

    @Named("photosToUrls")
    default java.util.List<String> photosToUrls(java.util.List<SignalementPhoto> photos) {
        if (photos == null || photos.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return photos.stream()
                .map(photo -> photo.getPhotoBase64() != null ? photo.getPhotoBase64() : photo.getPhotoUrl())
                .collect(java.util.stream.Collectors.toList());
    }
}
