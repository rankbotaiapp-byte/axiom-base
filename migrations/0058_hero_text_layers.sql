-- Hero text layers live in the storefront configuration document on shops.trade_profile.
-- The column stays text so existing readers can JSON.parse it. The layout object is hud.layers.
-- Keys: headline, subheadline, cta_button.
-- Each layer stores text, position {x,y} as percentages of the hero canvas, fontFamily,
-- colorMode (solid | gradient), solidColor, gradientCss, and effect (none | shimmer | pulsating | flicker).

comment on column shops.trade_profile is
  'Storefront configuration JSON. hud.layers holds headline, subheadline, and cta_button (text, percent position, font, color, gradient, effect).';
