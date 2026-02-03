package mg.sig.repository;

import mg.sig.entity.SignalementHistorique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SignalementHistoriqueRepository extends JpaRepository<SignalementHistorique, Integer> {
    
    List<SignalementHistorique> findBySignalementIdOrderByDateModificationAsc(Integer signalementId);
    
    List<SignalementHistorique> findBySignalementIdOrderByDateModificationDesc(Integer signalementId);
}
