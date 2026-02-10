package mg.uem.mg.clouds5p17authapi.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import mg.uem.mg.clouds5p17authapi.entity.Signalement;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Long> {
    List<Signalement> findByUserUid(String userUid);
    List<Signalement> findBySyncedToFirebaseFalse();
    List<Signalement> findBySyncedToFirebaseTrue();
}
