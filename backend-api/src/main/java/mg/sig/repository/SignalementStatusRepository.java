package mg.sig.repository;

import mg.sig.entity.SignalementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SignalementStatusRepository extends JpaRepository<SignalementStatus, Integer> {
    
    Optional<SignalementStatus> findByCode(String code);
    
    Optional<SignalementStatus> findByCodeIgnoreCase(String code);
    
    boolean existsByCode(String code);
    
    List<SignalementStatus> findByActifTrueOrderByOrdreAsc();
}
