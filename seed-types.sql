-- Insert document types
INSERT INTO document_types (name) VALUES 
('export_permit'),
('appraisal_report'),
('authenticity_certificate'),
('sale_certificate'),
('item'),
('incident'),
('user'),
('person');

-- Insert image types  
INSERT INTO image_types (name) VALUES
('item'),
('incident'),
('profile'),
('document_preview'),
('user'),
('person');