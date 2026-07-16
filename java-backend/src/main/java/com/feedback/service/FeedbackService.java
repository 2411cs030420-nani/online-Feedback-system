package com.feedback.service;

import com.feedback.model.Feedback;
import com.feedback.repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;

    @Autowired
    public FeedbackService(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    // Submit a new complaint or feedback
    public Feedback submitFeedback(Feedback feedback) {
        // ID & status will auto-assign in PrePersist if null
        return feedbackRepository.save(feedback);
    }

    // Fetch feedbacks with optional filters and keyword searches
    public List<Feedback> getFeedbacks(String search, String category, String status) {
        List<Feedback> list = feedbackRepository.findAll();

        // Handle JPQL search if specified
        if (search != null && !search.trim().isEmpty()) {
            list = feedbackRepository.searchFeedback(search.trim());
        }

        // Apply category filter
        if (category != null && !category.trim().isEmpty()) {
            list = list.stream()
                    .filter(f -> f.getCategory().equalsIgnoreCase(category.trim()))
                    .collect(Collectors.toList());
        }

        // Apply status filter
        if (status != null && !status.trim().isEmpty()) {
            list = list.stream()
                    .filter(f -> f.getStatus().equalsIgnoreCase(status.trim()))
                    .collect(Collectors.toList());
        }

        // Sort by newest first
        list.sort((f1, f2) -> f2.getCreatedAt().compareTo(f1.getCreatedAt()));
        return list;
    }

    // Update the status of a complaint (Pending, In Progress, Resolved)
    public Feedback updateStatus(String id, String newStatus) {
        Optional<Feedback> optionalFeedback = feedbackRepository.findById(id);
        if (optionalFeedback.isPresent()) {
            Feedback feedback = optionalFeedback.get();
            feedback.setStatus(newStatus);
            return feedbackRepository.save(feedback);
        }
        throw new IllegalArgumentException("Feedback record with ID " + id + " not found.");
    }

    // Delete a feedback record
    public void deleteFeedback(String id) {
        if (feedbackRepository.existsById(id)) {
            feedbackRepository.deleteById(id);
        } else {
            throw new IllegalArgumentException("Feedback record with ID " + id + " not found.");
        }
    }
}
