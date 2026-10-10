var e=`axiom.lead`,t=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;function n(e,t){return typeof e==`string`?e.trim().slice(0,t):``}function r(e){return t.test(e)}function i(e){let t=n(e.b,64).toLowerCase(),i=n(e.lead_slug,64).toLowerCase(),a=r(t)?t:r(i)?i:``,o=n(e.t,80).toLowerCase();return{leadSlug:a,utmSource:n(e.utm_source,80),county:n(e.county,80),stopToken:/^[a-f0-9]{32,80}$/.test(o)?o:``}}function a(e){let t=i(e);return{...t.leadSlug?{b:t.leadSlug,lead_slug:t.leadSlug}:{},...t.utmSource?{utm_source:t.utmSource}:{},...t.county?{county:t.county}:{},...t.stopToken?{t:t.stopToken}:{},...e.pitch===!0||e.pitch===`1`||e.pitch===`true`?{pitch:!0}:{},...e.greet===!0||e.greet===`1`||e.greet===`true`?{greet:!0}:{},...n(e.biz,80)?{biz:n(e.biz,80)}:{},...n(e.trade,80)?{trade:n(e.trade,80)}:{},...n(e.city,80)?{city:n(e.city,80)}:{},.../^cs_[A-Za-z0-9_]+$/.test(n(e.session_id,80))?{session_id:n(e.session_id,80)}:{}}}var o=[{id:`done-for-you`,label:`Done-For-You Hook`,line:`The booking page is already built. They only claim it.`,text:`{owner} — {business} has {website}. A {trade} booking page for {city} is already built. Claim it before another shop in {county} does.
{url}
Ask Eric greets {business} on that page.`,emailSubject:`{owner}, the {business} page is already live`,emailBody:`Hi {owner},

{business} has {website}. The {trade} page for {city} is built, ahead of the other shops in {county}. Reviews on file: {reviews}.

Claim it here:
{url}

Ask Eric greets {business} on that page.

Once you open it, the page is yours.`},{id:`missed-calls`,label:`Missed Calls Hook`,line:`A call they miss while with a client becomes a booking.`,text:`{owner}, calls to the {line} at {business} go quiet mid-appointment. Your {trade} page in {city} takes the request.
{url}
Ask Eric greets {business} on that page.`,emailSubject:`The {line} at {business} didn't pick up`,emailBody:`Hi {owner},

While you're with a client, the {line} at {business} goes to voicemail and that {trade} job walks to the next shop in {county}.

This page takes the booking instead:
{url}

Ask Eric greets {business} on that page.

They pick a time. You see it when you're free.`},{id:`competitor-edge`,label:`Competitor Edge Hook`,line:`Other shops in the county already take the online book.`,text:`{owner} — other {trade} shops in {county} are taking the online book. {business} is listed with {reviews} and {website}.
{url}
Ask Eric greets {business} on that page.`,emailSubject:`{county} shops are ahead of {business}`,emailBody:`Hi {owner},

People in {county} already book {trade} work without calling. {business} is listed with {reviews} and {website}.

Your page is ready:
{url}

Ask Eric greets {business} on that page.

Open it and the link is yours.`}];function s(e){return o.find(t=>t.id===e)??o[0]}function c(e,t){let n=e.reviewScore==null?``:e.reviewScore.toFixed(1),r=e.reviewScore==null?`no public reviews`:e.reviewCount==null?`${n} on public reviews`:`${n} from ${e.reviewCount} reviews`,i=e.hasWebsite==null?`no website listed`:e.hasWebsite?`a website already up`:`no website`,a=e.phoneLine===`mobile`?`mobile`:e.phoneLine===`landline`?`landline`:`listed number`;return{owner:e.contactName||t||`{owner}`,reviews:r,website:i,line:a}}var l=/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;function u(e){let t=e.trim().toLowerCase();return t.length<6||t.length>120?!1:l.test(t)}function d(e){return e===`mobile`}function f(e){let t=[];return d(e.phoneLine)&&t.push(`SMS-ready`),u(e.contactEmail)&&t.push(`Email-ready`),t.length===0&&t.push(`No channel`),t}function p(e){let t=e.reviewScore==null?``:e.reviewScore.toFixed(1),n=e.reviewScore==null?`No reviews`:e.reviewCount==null?t:`${t} · ${e.reviewCount}`;return[e.contactName||`No owner`,n,e.hasWebsite==null?`Website unknown`:e.hasWebsite?`Has website`:`No website`,e.phoneLine===`mobile`?`Mobile`:e.phoneLine===`landline`?`Landline`:`Line unknown`]}function m(e,t){return e.replaceAll(`{business}`,t.business).replaceAll(`{url}`,t.url).replaceAll(`{trade}`,t.trade??``).replaceAll(`{county}`,t.county??``).replaceAll(`{city}`,t.city??``).replaceAll(`{owner}`,t.owner??``).replaceAll(`{reviews}`,t.reviews??``).replaceAll(`{website}`,t.website??``).replaceAll(`{line}`,t.line??``)}export{f as a,s as c,d as i,a as l,o as n,p as o,u as r,c as s,e as t,m as u};