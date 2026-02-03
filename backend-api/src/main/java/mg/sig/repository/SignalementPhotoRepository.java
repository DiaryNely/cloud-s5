package mg.sig.repository;

import mg.sig.entity.SignalementPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SignalementPhotoRepository extends JpaRepository<SignalementPhoto, Integer> {
    
    List<SignalementPhoto> findBySignalementId(Integer signalementId);
    
    void deleteBySignalementId(Integer signalementId);
}
