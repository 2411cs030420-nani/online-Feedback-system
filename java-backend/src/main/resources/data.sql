-- Seed Feedbacks (Runs if table is empty or on startup depending on configurations)
INSERT INTO feedback (id, name, email, mobile, subject, category, message, status, created_at)
SELECT 'fb-1', 'Arjun Mehta', 'arjun.mehta@example.com', '9876543210', 'Slow loading speeds on dashboard', 'Technical Issue', 'The main analytical dashboard takes more than 10 seconds to render on mobile networks. Please look into optimizing the script loads.', 'Pending', '2026-07-12 10:30:00'
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE id = 'fb-1');

INSERT INTO feedback (id, name, email, mobile, subject, category, message, status, created_at)
SELECT 'fb-2', 'Priya Sharma', 'priya.sharma@example.com', '8765432109', 'Billing amount discrepancy in June receipt', 'Billing', 'My June subscription receipt shows a charge of $49 instead of the agreed $29 promotional rate. I would appreciate a correction and refund of the extra amount.', 'In Progress', '2026-07-13 14:15:00'
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE id = 'fb-2');

INSERT INTO feedback (id, name, email, mobile, subject, category, message, status, created_at)
SELECT 'fb-3', 'Rohan Das', 'rohan.das@example.com', '7654321098', 'Feature Request: Export reports to Excel/PDF', 'Feature Request', 'It would be extremely helpful if we could export the monthly complaint and feedback summaries to Excel or PDF files directly from the admin view.', 'Resolved', '2026-07-11 09:00:00'
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE id = 'fb-3');
