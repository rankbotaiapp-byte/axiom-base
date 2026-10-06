import type { ShopNiche } from "./types";

function leadSlug(businessName: string, city: string): string {
  const raw = `${businessName} ${city}`
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
  return raw || "lead";
}

/**
 * Southern Oregon test roster for the master desk.
 * Names, owners, reviews, and 541-555 numbers are invented listing fields.
 * This stays out of migrations so it does not ship into the live database.
 */
export const HOME_REGION_LABEL = "Southern Oregon";

export const HOME_REGION_COUNTIES = ["Jackson County", "Josephine County", "Douglas County"] as const;

export type HomeCounty = (typeof HOME_REGION_COUNTIES)[number];

type RosterRow = {
  businessName: string;
  contactName: string;
  city: string;
  county: HomeCounty;
  tradeType: ShopNiche;
  reviewScore: number;
  reviewCount: number;
  hasWebsite: boolean;
  phoneLine: "mobile" | "landline";
};

const ROWS: RosterRow[] = [
  { businessName: "Bear Creek Drift", contactName: "Maren Holt", city: "Medford", county: "Jackson County", tradeType: "guide", reviewScore: 4.8, reviewCount: 74, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Table Rock Anglers", contactName: "Cole Brennan", city: "Shady Cove", county: "Jackson County", tradeType: "guide", reviewScore: 4.6, reviewCount: 39, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Rogue Iron", contactName: "Dana Okonkwo", city: "Medford", county: "Jackson County", tradeType: "fitness", reviewScore: 4.9, reviewCount: 128, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Lithia Strength", contactName: "Jonah Hale", city: "Ashland", county: "Jackson County", tradeType: "fitness", reviewScore: 4.7, reviewCount: 61, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Bear Creek Bodywork", contactName: "Elena Voss", city: "Medford", county: "Jackson County", tradeType: "wellness", reviewScore: 4.9, reviewCount: 83, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Grizzly Peak Stretch", contactName: "Priya Shah", city: "Ashland", county: "Jackson County", tradeType: "wellness", reviewScore: 4.5, reviewCount: 27, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Medford Desk Tutors", contactName: "Noah Feldman", city: "Medford", county: "Jackson County", tradeType: "lessons", reviewScore: 4.8, reviewCount: 54, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Ashland Lesson Room", contactName: "Leah Ortiz", city: "Ashland", county: "Jackson County", tradeType: "lessons", reviewScore: 4.4, reviewCount: 18, hasWebsite: false, phoneLine: "landline" },
  { businessName: "Main Street Shear", contactName: "Nina Brooks", city: "Medford", county: "Jackson County", tradeType: "salon", reviewScore: 4.7, reviewCount: 196, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Jacksonville Color", contactName: "Yesenia Cruz", city: "Jacksonville", county: "Jackson County", tradeType: "salon", reviewScore: 4.8, reviewCount: 88, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Pear Blossom Lash", contactName: "Mei Lin", city: "Medford", county: "Jackson County", tradeType: "beauty", reviewScore: 4.9, reviewCount: 141, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Talent Brow Room", contactName: "Sasha Quinn", city: "Talent", county: "Jackson County", tradeType: "beauty", reviewScore: 4.6, reviewCount: 34, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Riverside Needle", contactName: "Diego Marquez", city: "Medford", county: "Jackson County", tradeType: "tattoo", reviewScore: 4.8, reviewCount: 72, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Phoenix Linework", contactName: "Harper Quinn", city: "Phoenix", county: "Jackson County", tradeType: "tattoo", reviewScore: 4.7, reviewCount: 46, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Rogue Valley Frame", contactName: "Amira Cole", city: "Medford", county: "Jackson County", tradeType: "photo", reviewScore: 4.9, reviewCount: 58, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Oak Knoll Photo", contactName: "Benito Alvarez", city: "Ashland", county: "Jackson County", tradeType: "photo", reviewScore: 4.5, reviewCount: 21, hasWebsite: false, phoneLine: "landline" },
  { businessName: "Central Point Paws", contactName: "Claire Nguyen", city: "Central Point", county: "Jackson County", tradeType: "pets", reviewScore: 4.8, reviewCount: 109, hasWebsite: true, phoneLine: "landline" },
  { businessName: "White City Wash", contactName: "Rosa Delgado", city: "White City", county: "Jackson County", tradeType: "pets", reviewScore: 4.6, reviewCount: 43, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Railroad Sessions", contactName: "Malik Greene", city: "Medford", county: "Jackson County", tradeType: "music", reviewScore: 4.7, reviewCount: 29, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Ashland Vocal", contactName: "Imani Brooks", city: "Ashland", county: "Jackson County", tradeType: "music", reviewScore: 4.9, reviewCount: 16, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Medford Hosts", contactName: "Carmen Solis", city: "Medford", county: "Jackson County", tradeType: "events", reviewScore: 4.8, reviewCount: 37, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Jacksonville Gathering", contactName: "Owen Price", city: "Jacksonville", county: "Jackson County", tradeType: "events", reviewScore: 4.4, reviewCount: 11, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Table Rock Build", contactName: "Hector Ramos", city: "Eagle Point", county: "Jackson County", tradeType: "contractor", reviewScore: 4.6, reviewCount: 92, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Bear Creek Beam", contactName: "Tanya Brooks", city: "Medford", county: "Jackson County", tradeType: "contractor", reviewScore: 4.7, reviewCount: 41, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Rogue Valley Shine", contactName: "Lucia Fernandez", city: "Medford", county: "Jackson County", tradeType: "clean", reviewScore: 4.8, reviewCount: 97, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Ashland House Reset", contactName: "Erin Walsh", city: "Ashland", county: "Jackson County", tradeType: "clean", reviewScore: 4.5, reviewCount: 24, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Curb Call Rogue", contactName: "Victor Reyes", city: "Medford", county: "Jackson County", tradeType: "field", reviewScore: 4.7, reviewCount: 148, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Central Point Lift", contactName: "Andre Cole", city: "Central Point", county: "Jackson County", tradeType: "field", reviewScore: 4.4, reviewCount: 38, hasWebsite: false, phoneLine: "landline" },
  { businessName: "Medford Visit Room", contactName: "Helen Cho", city: "Medford", county: "Jackson County", tradeType: "practice", reviewScore: 4.9, reviewCount: 66, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Eagle Point Follow-Up", contactName: "Micah Berg", city: "Eagle Point", county: "Jackson County", tradeType: "practice", reviewScore: 4.6, reviewCount: 19, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Oak Street Hour", contactName: "Helen Park", city: "Medford", county: "Jackson County", tradeType: "counsel", reviewScore: 4.8, reviewCount: 17, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Ashland Consult", contactName: "Omar Aziz", city: "Ashland", county: "Jackson County", tradeType: "counsel", reviewScore: 4.7, reviewCount: 8, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Riverside Fades", contactName: "Luis Navarro", city: "Medford", county: "Jackson County", tradeType: "location", reviewScore: 4.9, reviewCount: 214, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Jacksonville Chair", contactName: "Mateo Diaz", city: "Jacksonville", county: "Jackson County", tradeType: "location", reviewScore: 4.6, reviewCount: 77, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Medford Daylight", contactName: "June Park", city: "Medford", county: "Jackson County", tradeType: "studio", reviewScore: 4.8, reviewCount: 49, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Ashland Recording", contactName: "Ellis Ward", city: "Ashland", county: "Jackson County", tradeType: "studio", reviewScore: 4.5, reviewCount: 22, hasWebsite: false, phoneLine: "landline" },
  { businessName: "Open Bench Medford", contactName: "Alex Morgan", city: "Medford", county: "Jackson County", tradeType: "trade", reviewScore: 4.3, reviewCount: 14, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Talent Odd Jobs", contactName: "Samira Holt", city: "Talent", county: "Jackson County", tradeType: "trade", reviewScore: 4.6, reviewCount: 19, hasWebsite: true, phoneLine: "mobile" },

  { businessName: "Rogue River Pushpole", contactName: "Wade Keller", city: "Grants Pass", county: "Josephine County", tradeType: "guide", reviewScore: 4.8, reviewCount: 81, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Illinois River Drift", contactName: "Lila Chen", city: "Cave Junction", county: "Josephine County", tradeType: "guide", reviewScore: 4.7, reviewCount: 36, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Grants Pass Iron", contactName: "Chris Adler", city: "Grants Pass", county: "Josephine County", tradeType: "fitness", reviewScore: 4.6, reviewCount: 94, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Merlin Conditioning", contactName: "Nora Blake", city: "Merlin", county: "Josephine County", tradeType: "fitness", reviewScore: 4.4, reviewCount: 23, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Applegate Bodywork", contactName: "Sofia Rahman", city: "Grants Pass", county: "Josephine County", tradeType: "wellness", reviewScore: 4.9, reviewCount: 71, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Cave Junction Stretch", contactName: "Evan Pike", city: "Cave Junction", county: "Josephine County", tradeType: "wellness", reviewScore: 4.5, reviewCount: 15, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Grants Pass Desk", contactName: "Hannah Berg", city: "Grants Pass", county: "Josephine County", tradeType: "lessons", reviewScore: 4.8, reviewCount: 42, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Illinois Valley Lessons", contactName: "Theo Marsh", city: "Cave Junction", county: "Josephine County", tradeType: "lessons", reviewScore: 4.3, reviewCount: 12, hasWebsite: false, phoneLine: "landline" },
  { businessName: "G Street Shear", contactName: "Paige Moreno", city: "Grants Pass", county: "Josephine County", tradeType: "salon", reviewScore: 4.8, reviewCount: 163, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Merlin Color Room", contactName: "Ruth Abebe", city: "Merlin", county: "Josephine County", tradeType: "salon", reviewScore: 4.6, reviewCount: 51, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Riverside Lash", contactName: "Kim Tran", city: "Grants Pass", county: "Josephine County", tradeType: "beauty", reviewScore: 4.9, reviewCount: 118, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Wilderville Brow", contactName: "Alicia Dunn", city: "Wilderville", county: "Josephine County", tradeType: "beauty", reviewScore: 4.5, reviewCount: 26, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Sixth Street Needle", contactName: "Jordan Hale", city: "Grants Pass", county: "Josephine County", tradeType: "tattoo", reviewScore: 4.7, reviewCount: 64, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Cave Junction Linework", contactName: "Skye Porter", city: "Cave Junction", county: "Josephine County", tradeType: "tattoo", reviewScore: 4.8, reviewCount: 33, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Rogue Frame House", contactName: "Nadia Petrova", city: "Grants Pass", county: "Josephine County", tradeType: "photo", reviewScore: 4.6, reviewCount: 47, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Merlin Golden Hour", contactName: "Chris Lang", city: "Merlin", county: "Josephine County", tradeType: "photo", reviewScore: 4.4, reviewCount: 13, hasWebsite: false, phoneLine: "landline" },
  { businessName: "Park Street Paws", contactName: "Gina Alvarez", city: "Grants Pass", county: "Josephine County", tradeType: "pets", reviewScore: 4.8, reviewCount: 102, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Cave Junction Wash", contactName: "Pete Nguyen", city: "Cave Junction", county: "Josephine County", tradeType: "pets", reviewScore: 4.5, reviewCount: 29, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Grants Pass Sessions", contactName: "Andre Miles", city: "Grants Pass", county: "Josephine County", tradeType: "music", reviewScore: 4.7, reviewCount: 21, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Illinois Valley Vocal", contactName: "Celeste Ward", city: "Cave Junction", county: "Josephine County", tradeType: "music", reviewScore: 4.9, reviewCount: 11, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Riverside Hosts", contactName: "Mara Ellison", city: "Grants Pass", county: "Josephine County", tradeType: "events", reviewScore: 4.6, reviewCount: 28, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Merlin Gathering", contactName: "Owen Clark", city: "Merlin", county: "Josephine County", tradeType: "events", reviewScore: 4.3, reviewCount: 9, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Rogue Beam", contactName: "Frank Doyle", city: "Grants Pass", county: "Josephine County", tradeType: "contractor", reviewScore: 4.7, reviewCount: 86, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Selma Rebuild", contactName: "Kayla Brooks", city: "Selma", county: "Josephine County", tradeType: "contractor", reviewScore: 4.5, reviewCount: 22, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Grants Pass Shine", contactName: "Rita Santos", city: "Grants Pass", county: "Josephine County", tradeType: "clean", reviewScore: 4.8, reviewCount: 77, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Cave Junction Reset", contactName: "Erin Walsh", city: "Cave Junction", county: "Josephine County", tradeType: "clean", reviewScore: 4.4, reviewCount: 16, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Curb Call Josephine", contactName: "Luis Ortega", city: "Grants Pass", county: "Josephine County", tradeType: "field", reviewScore: 4.6, reviewCount: 121, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Merlin Mobile Lift", contactName: "Samir Patel", city: "Merlin", county: "Josephine County", tradeType: "field", reviewScore: 4.5, reviewCount: 34, hasWebsite: false, phoneLine: "landline" },
  { businessName: "Grants Pass Visit Room", contactName: "Helen Cho", city: "Grants Pass", county: "Josephine County", tradeType: "practice", reviewScore: 4.8, reviewCount: 44, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Cave Junction Follow-Up", contactName: "Micah Berg", city: "Cave Junction", county: "Josephine County", tradeType: "practice", reviewScore: 4.6, reviewCount: 14, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Sixth Street Hour", contactName: "Rachel Kim", city: "Grants Pass", county: "Josephine County", tradeType: "counsel", reviewScore: 4.7, reviewCount: 19, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Merlin Consult", contactName: "Omar Aziz", city: "Merlin", county: "Josephine County", tradeType: "counsel", reviewScore: 4.5, reviewCount: 7, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "G Street Fades", contactName: "Mateo Diaz", city: "Grants Pass", county: "Josephine County", tradeType: "location", reviewScore: 4.9, reviewCount: 188, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Cave Junction Chair", contactName: "Luis Navarro", city: "Cave Junction", county: "Josephine County", tradeType: "location", reviewScore: 4.6, reviewCount: 52, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Grants Pass Daylight", contactName: "June Park", city: "Grants Pass", county: "Josephine County", tradeType: "studio", reviewScore: 4.7, reviewCount: 31, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Riverside Recording", contactName: "Ellis Ward", city: "Grants Pass", county: "Josephine County", tradeType: "studio", reviewScore: 4.4, reviewCount: 18, hasWebsite: false, phoneLine: "landline" },
  { businessName: "Open Bench Grants Pass", contactName: "Alex Morgan", city: "Grants Pass", county: "Josephine County", tradeType: "trade", reviewScore: 4.2, reviewCount: 10, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Merlin Odd Jobs", contactName: "Samira Holt", city: "Merlin", county: "Josephine County", tradeType: "trade", reviewScore: 4.6, reviewCount: 15, hasWebsite: true, phoneLine: "mobile" },

  { businessName: "North Umpqua Drift", contactName: "Cal Mercer", city: "Glide", county: "Douglas County", tradeType: "guide", reviewScore: 4.9, reviewCount: 96, hasWebsite: true, phoneLine: "landline" },
  { businessName: "South Umpqua Anglers", contactName: "Beth Harlow", city: "Roseburg", county: "Douglas County", tradeType: "guide", reviewScore: 4.6, reviewCount: 42, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Roseburg Iron", contactName: "Derek Sloan", city: "Roseburg", county: "Douglas County", tradeType: "fitness", reviewScore: 4.7, reviewCount: 111, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Sutherlin Conditioning", contactName: "Nina Brooks", city: "Sutherlin", county: "Douglas County", tradeType: "fitness", reviewScore: 4.4, reviewCount: 28, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Deer Creek Bodywork", contactName: "Elena Voss", city: "Roseburg", county: "Douglas County", tradeType: "wellness", reviewScore: 4.8, reviewCount: 63, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Winston Stretch", contactName: "Priya Shah", city: "Winston", county: "Douglas County", tradeType: "wellness", reviewScore: 4.5, reviewCount: 17, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Roseburg Desk Tutors", contactName: "Noah Feldman", city: "Roseburg", county: "Douglas County", tradeType: "lessons", reviewScore: 4.7, reviewCount: 38, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Myrtle Creek Lessons", contactName: "Leah Ortiz", city: "Myrtle Creek", county: "Douglas County", tradeType: "lessons", reviewScore: 4.3, reviewCount: 11, hasWebsite: false, phoneLine: "landline" },
  { businessName: "Jackson Street Shear", contactName: "Paige Moreno", city: "Roseburg", county: "Douglas County", tradeType: "salon", reviewScore: 4.8, reviewCount: 174, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Sutherlin Color Room", contactName: "Yesenia Cruz", city: "Sutherlin", county: "Douglas County", tradeType: "salon", reviewScore: 4.6, reviewCount: 59, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Umpqua Lash", contactName: "Mei Lin", city: "Roseburg", county: "Douglas County", tradeType: "beauty", reviewScore: 4.9, reviewCount: 132, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Winston Brow Room", contactName: "Sasha Quinn", city: "Winston", county: "Douglas County", tradeType: "beauty", reviewScore: 4.5, reviewCount: 22, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Deer Creek Needle", contactName: "Diego Marquez", city: "Roseburg", county: "Douglas County", tradeType: "tattoo", reviewScore: 4.7, reviewCount: 55, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Canyonville Linework", contactName: "Harper Quinn", city: "Canyonville", county: "Douglas County", tradeType: "tattoo", reviewScore: 4.6, reviewCount: 27, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Umpqua Frame", contactName: "Amira Cole", city: "Roseburg", county: "Douglas County", tradeType: "photo", reviewScore: 4.8, reviewCount: 41, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Glide Golden Hour", contactName: "Benito Alvarez", city: "Glide", county: "Douglas County", tradeType: "photo", reviewScore: 4.4, reviewCount: 12, hasWebsite: false, phoneLine: "landline" },
  { businessName: "Garden Valley Paws", contactName: "Claire Nguyen", city: "Roseburg", county: "Douglas County", tradeType: "pets", reviewScore: 4.8, reviewCount: 98, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Winston Wash", contactName: "Rosa Delgado", city: "Winston", county: "Douglas County", tradeType: "pets", reviewScore: 4.5, reviewCount: 31, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Roseburg Sessions", contactName: "Malik Greene", city: "Roseburg", county: "Douglas County", tradeType: "music", reviewScore: 4.6, reviewCount: 18, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Sutherlin Vocal", contactName: "Imani Brooks", city: "Sutherlin", county: "Douglas County", tradeType: "music", reviewScore: 4.8, reviewCount: 9, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Stewart Park Hosts", contactName: "Carmen Solis", city: "Roseburg", county: "Douglas County", tradeType: "events", reviewScore: 4.7, reviewCount: 26, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Myrtle Creek Gathering", contactName: "Owen Price", city: "Myrtle Creek", county: "Douglas County", tradeType: "events", reviewScore: 4.3, reviewCount: 8, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Umpqua Beam", contactName: "Hector Ramos", city: "Roseburg", county: "Douglas County", tradeType: "contractor", reviewScore: 4.6, reviewCount: 79, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Sutherlin Rebuild", contactName: "Tanya Brooks", city: "Sutherlin", county: "Douglas County", tradeType: "contractor", reviewScore: 4.5, reviewCount: 33, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Roseburg Shine", contactName: "Lucia Fernandez", city: "Roseburg", county: "Douglas County", tradeType: "clean", reviewScore: 4.8, reviewCount: 84, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Winston House Reset", contactName: "Erin Cole", city: "Winston", county: "Douglas County", tradeType: "clean", reviewScore: 4.4, reviewCount: 20, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Curb Call Umpqua", contactName: "Victor Reyes", city: "Roseburg", county: "Douglas County", tradeType: "field", reviewScore: 4.7, reviewCount: 136, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Myrtle Creek Lift", contactName: "Andre Cole", city: "Myrtle Creek", county: "Douglas County", tradeType: "field", reviewScore: 4.3, reviewCount: 25, hasWebsite: false, phoneLine: "landline" },
  { businessName: "Roseburg Visit Room", contactName: "Helen Cho", city: "Roseburg", county: "Douglas County", tradeType: "practice", reviewScore: 4.9, reviewCount: 51, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Sutherlin Follow-Up", contactName: "Micah Lane", city: "Sutherlin", county: "Douglas County", tradeType: "practice", reviewScore: 4.5, reviewCount: 13, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Oak Ave Hour", contactName: "Helen Park", city: "Roseburg", county: "Douglas County", tradeType: "counsel", reviewScore: 4.7, reviewCount: 16, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Glide Consult", contactName: "Omar Aziz", city: "Glide", county: "Douglas County", tradeType: "counsel", reviewScore: 4.6, reviewCount: 6, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Jackson Street Fades", contactName: "Luis Navarro", city: "Roseburg", county: "Douglas County", tradeType: "location", reviewScore: 4.8, reviewCount: 167, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Winston Chair", contactName: "Mateo Diaz", city: "Winston", county: "Douglas County", tradeType: "location", reviewScore: 4.6, reviewCount: 48, hasWebsite: true, phoneLine: "landline" },
  { businessName: "Roseburg Daylight", contactName: "June Park", city: "Roseburg", county: "Douglas County", tradeType: "studio", reviewScore: 4.7, reviewCount: 29, hasWebsite: true, phoneLine: "mobile" },
  { businessName: "Umpqua Recording", contactName: "Ellis Ward", city: "Roseburg", county: "Douglas County", tradeType: "studio", reviewScore: 4.4, reviewCount: 14, hasWebsite: false, phoneLine: "landline" },
  { businessName: "Open Bench Roseburg", contactName: "Alex Morgan", city: "Roseburg", county: "Douglas County", tradeType: "trade", reviewScore: 4.2, reviewCount: 9, hasWebsite: false, phoneLine: "mobile" },
  { businessName: "Canyonville Odd Jobs", contactName: "Samira Holt", city: "Canyonville", county: "Douglas County", tradeType: "trade", reviewScore: 4.5, reviewCount: 12, hasWebsite: true, phoneLine: "mobile" },
];

function mockEmail(businessName: string, city: string, hasWebsite: boolean): string {
  if (!hasWebsite) return "";
  const host = leadSlug(businessName, city).replace(/-/g, "");
  return `desk@${host}.example`;
}

export function homeRegionLeads() {
  return ROWS.map((row, index) => ({
    ...row,
    leadSlug: leadSlug(row.businessName, row.city),
    contactPhone: `541-555-${String(101 + index).padStart(4, "0")}`,
    contactEmail: mockEmail(row.businessName, row.city, row.hasWebsite),
  }));
}
