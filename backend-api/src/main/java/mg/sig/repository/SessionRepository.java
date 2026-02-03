package mg.sig.repository;

import mg.sig.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, Integer> {
    
    Optional<Session> findByToken(String token);
    
    Optional<Session> findByRefreshToken(String refreshToken);
    
    List<Session> findByUserIdAndActifTrue(Integer userId);
    
    @Modifying
    @Query("UPDATE Session s SET s.actif = false WHERE s.user.id = :userId")
    void deactivateAllByUserId(@Param("userId") Integer userId);
    
    @Modifying
    @Query("DELETE FROM Session s WHERE s.dateExpiration < :now OR s.actif = false")
    void deleteExpiredSessions(@Param("now") LocalDateTime now);
    
    @Query("SELECT s FROM Session s WHERE s.actif = true AND s.dateExpiration > :now")
    List<Session> findActiveSessions(@Param("now") LocalDateTime now);
}
