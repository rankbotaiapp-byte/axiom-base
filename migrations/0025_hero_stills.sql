-- Swap the remaining placeholder heroes for the uploaded stills.
-- Only rows still pointing at those exact placeholders are updated.

update shops set hero_image_url = '/media/heroes/contractor.jpg' where hero_image_url = '/media/contractor-hero.jpg';
update shops set hero_image_url = '/media/heroes/landscaping.jpg' where hero_image_url = '/media/heroes/landscaping.svg';
