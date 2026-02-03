package mg.sig.repository;

import mg.sig.entity.Parametre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParametreRepository extends JpaRepository<Parametre, Integer> {
    
    Optional<Parametre> findByCle(String cle);
    
    boolean existsByCle(String cle);
}
