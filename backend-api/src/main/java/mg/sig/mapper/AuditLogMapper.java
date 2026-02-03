package mg.sig.mapper;

import mg.sig.dto.AuditLogDTO;
import mg.sig.entity.AuditLog;
import org.mapstruct.*;

/**
 * Mapper pour les logs d'audit.
 */
@Mapper(componentModel = "spring")
public interface AuditLogMapper {

    @Mapping(target = "date", source = "dateAction")
    @Mapping(target = "utilisateur", source = "userEmail")
    AuditLogDTO toDTO(AuditLog entity);
}
