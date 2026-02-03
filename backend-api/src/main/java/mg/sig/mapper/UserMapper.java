package mg.sig.mapper;

import mg.sig.dto.UtilisateurDTO;
import mg.sig.entity.User;
import org.mapstruct.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Mapper pour les utilisateurs.
 */
@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "role", source = "role.code", qualifiedByName = "roleCodeToLowerCase")
    @Mapping(target = "dateInscription", source = "dateCreation", qualifiedByName = "dateToString")
    @Mapping(target = "temporaryPassword", source = "temporaryPassword")
    UtilisateurDTO toDTO(User entity);

    @Named("roleCodeToLowerCase")
    default String roleCodeToLowerCase(String code) {
        return code != null ? code.toLowerCase() : null;
    }

    @Named("dateToString")
    default String dateToString(LocalDateTime date) {
        return date != null ? date.format(DateTimeFormatter.ISO_LOCAL_DATE) : null;
    }
}
