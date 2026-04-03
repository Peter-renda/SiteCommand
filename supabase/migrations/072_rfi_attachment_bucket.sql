-- Create storage bucket for RFI attachments (public so URLs are accessible)
INSERT INTO storage.buckets (id, name, public)
VALUES ('rfi-attachments', 'rfi-attachments', true)
ON CONFLICT (id) DO NOTHING;
