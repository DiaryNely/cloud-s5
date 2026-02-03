package mg.sig.mapper;

import mg.sig.dto.EntrepriseDTO;
import mg.sig.entity.Entreprise;
import org.mapstruct.*;

/**
 * Mapper pour les entreprises.
 */
@Mapper(componentModel = "spring")
public interface EntrepriseMapper {

    EntrepriseDTO toDTO(Entreprise entity);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "dateCreation", ignore = true)
    @Mapping(target = "dateModification", ignore = true)
    Entreprise toEntity(EntrepriseDTO dto);
}
