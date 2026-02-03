package mg.sig.repository;

import mg.sig.entity.Entreprise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EntrepriseRepository extends JpaRepository<Entreprise, Integer> {
    
    List<Entreprise> findByActifTrue();
    
    Optional<Entreprise> findByNom(String nom);
    
    Optional<Entreprise> findByNomIgnoreCase(String nom);
    
    boolean existsByNom(String nom);
}
