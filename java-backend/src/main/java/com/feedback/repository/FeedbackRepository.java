package com.feedback.repository;

import com.feedback.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, String> {

    // Advanced search across multiple fields
    @Query("SELECT f FROM Feedback f WHERE " +
           "(LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(f.subject) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(f.message) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(f.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " f.mobile LIKE CONCAT('%', :search, '%') OR " +
           " LOWER(f.id) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Feedback> searchFeedback(@Param("search") String search);

    List<Feedback> findByCategory(String category);

    List<Feedback> findByStatus(String status);

    List<Feedback> findByCategoryAndStatus(String category, String status);
}
