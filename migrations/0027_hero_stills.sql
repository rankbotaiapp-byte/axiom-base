-- Swap the last two placeholder heroes for the uploaded stills.
-- Only rows still pointing at those exact placeholders are updated.

update shops set hero_image_url = '/media/heroes/wellness.jpg' where hero_image_url = '/media/heroes/wellness.svg';
update shops set hero_image_url = '/media/heroes/trade.jpg' where hero_image_url = '/media/heroes/trade.svg';
