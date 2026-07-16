package com.feedback.controller;

import com.feedback.model.Feedback;
import com.feedback.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "*") // Allows cross-origin requests from the React dev server if running separately
public class FeedbackController {

    private final FeedbackService feedbackService;

    @Autowired
    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    // 1. Submit Feedback (User Module)
    @PostMapping
    public ResponseEntity<Map<String, Object>> submitFeedback(@Valid @RequestBody Feedback feedback) {
        Feedback savedFeedback = feedbackService.submitFeedback(feedback);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Feedback submitted successfully! Reference ID: " + savedFeedback.getId());
        response.put("data", savedFeedback);
        
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // 2. View Feedbacks with Optional Search & Filters (Admin Module)
    @GetMapping
    public ResponseEntity<List<Feedback>> getAllFeedbacks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status) {
        
        List<Feedback> feedbacks = feedbackService.getFeedbacks(search, category, status);
        return ResponseEntity.ok(feedbacks);
    }

    // 3. Update Status (Admin Module)
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> requestBody) {
        
        String newStatus = requestBody.get("status");
        if (newStatus == null || !List.of("Pending", "In Progress", "Resolved").contains(newStatus)) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid status value. Must be Pending, In Progress, or Resolved.");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        try {
            Feedback updatedFeedback = feedbackService.updateStatus(id, newStatus);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Status updated to '" + newStatus + "' successfully!");
            response.put("data", updatedFeedback);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
        }
    }

    // 4. Delete Feedback (Admin Module)
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteFeedback(@PathVariable String id) {
        try {
            feedbackService.deleteFeedback(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Feedback record deleted successfully!");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
        }
    }
}
