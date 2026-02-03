package mg.sig.repository;

import mg.sig.entity.Signalement;
import mg.sig.entity.SignalementStatus;
import mg.sig.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Integer> {
    
    List<Signalement> findByCreePar(User creePar);
    
    List<Signalement> findByCreeParEmail(String email);
    
    List<Signalement> findByStatus(SignalementStatus status);
    
    @Query("SELECT s FROM Signalement s WHERE s.status.code = :statusCode")
    List<Signalement> findByStatusCode(@Param("statusCode") String statusCode);
    
    Optional<Signalement> findByFirebaseId(String firebaseId);
    
    List<Signalement> findBySyncedWithFirebaseFalse();
    
    @Query("SELECT COUNT(s) FROM Signalement s")
    Long countTotal();
    
    @Query("SELECT COUNT(s) FROM Signalement s WHERE s.status.code = :statusCode")
    Long countByStatusCode(@Param("statusCode") String statusCode);
    
    @Query("SELECT COALESCE(SUM(s.surface), 0) FROM Signalement s")
    BigDecimal sumSurface();
    
    @Query("SELECT COALESCE(SUM(s.budgetEstime), 0) FROM Signalement s")
    BigDecimal sumBudget();
    
    @Query("SELECT s FROM Signalement s ORDER BY s.dateCreation DESC")
    List<Signalement> findAllOrderByDateCreationDesc();
    
    @Query("SELECT s FROM Signalement s WHERE s.creePar.id = :userId ORDER BY s.dateCreation DESC")
    List<Signalement> findByUserIdOrderByDateCreationDesc(@Param("userId") Integer userId);
}
