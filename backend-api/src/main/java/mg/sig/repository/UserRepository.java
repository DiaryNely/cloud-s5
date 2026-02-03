package mg.sig.repository;

import mg.sig.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByEmailIgnoreCase(String email);
    
    boolean existsByEmail(String email);
    
    Optional<User> findByFirebaseUid(String firebaseUid);
    
    List<User> findByActifTrue();
    
    List<User> findByBloqueTrue();
    
    @Query("SELECT u FROM User u WHERE u.role.code = :roleCode")
    List<User> findByRoleCode(@Param("roleCode") String roleCode);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.bloque = false")
    Long countActifs();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.bloque = true")
    Long countBloques();
}
