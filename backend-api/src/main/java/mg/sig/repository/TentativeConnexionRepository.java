package mg.sig.repository;

import mg.sig.entity.TentativeConnexion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TentativeConnexionRepository extends JpaRepository<TentativeConnexion, Integer> {
    
    @Query("SELECT COUNT(t) FROM TentativeConnexion t WHERE t.email = :email AND t.reussi = false AND t.dateTentative > :since")
    Long countFailedAttemptsSince(@Param("email") String email, @Param("since") LocalDateTime since);
    
    List<TentativeConnexion> findByEmailOrderByDateTentativeDesc(String email);
    
    @Query("SELECT t FROM TentativeConnexion t WHERE t.email = :email AND t.reussi = false ORDER BY t.dateTentative DESC")
    List<TentativeConnexion> findFailedAttemptsByEmail(@Param("email") String email);
}
