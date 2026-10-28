import type { ShopNiche } from "@/lib/axiom/types";

/** One tap choice on an audit question. The value is what gets saved. */
export interface AuditChoice {
  value: string;
  label: string;
}

/** A question the storefront audit can ask without the owner writing it. */
export interface AuditQuestion {
  id: string;
  label: string;
  choices: readonly AuditChoice[];
}

/** A service line the owner can start from. Prices are already written. */
export interface PresetService {
  name: string;
  detail: string;
  priceLabel: string;
  durationMin: number;
}

/**
 * A finished starting page for one local trade.
 * Title, tagline, color, search words, audit questions, services, and the booking button are all filled in.
 */
export interface NichePreset {
  id: string;
  shopNiche: ShopNiche;
  label: string;
  title: string;
  tagline: string;
  accent: string;
  keywords: readonly string[];
  auditTitle: string;
  auditNote: string;
  auditQuestions: readonly AuditQuestion[];
  services: readonly PresetService[];
  bookingCta: string;
}

export const NICHE_PRESETS: readonly NichePreset[] = [
  {
    id: "barbershop",
    shopNiche: "location",
    label: "Barbershop",
    title: "The Chair",
    tagline: "Fades, hot towels, and a chair that starts on time.",
    accent: "#E7B48A",
    keywords: ["barber near me", "fade", "hot towel shave", "beard trim", "walk-in haircut"],
    auditTitle: "How soon do you need the chair?",
    auditNote: "A short check so the shop can hold the right block.",
    auditQuestions: [
      {
        id: "visit",
        label: "What do you need?",
        choices: [
          { value: "Cut", label: "A cut" },
          { value: "Fade", label: "A fade" },
          { value: "Beard", label: "Beard and lineup" },
        ],
      },
      {
        id: "lastVisit",
        label: "Last time in a chair",
        choices: [
          { value: "This month", label: "This month" },
          { value: "A few months", label: "A few months ago" },
          { value: "Not sure", label: "Not sure" },
        ],
      },
    ],
    services: [
      { name: "Signature cut", detail: "Consult, cut, and finish.", priceLabel: "$45", durationMin: 45 },
      { name: "Skin fade", detail: "Tight blend, razor line, hot towel.", priceLabel: "$52", durationMin: 50 },
      { name: "Beard sculpt", detail: "Shape, lineup, and oil.", priceLabel: "$28", durationMin: 25 },
    ],
    bookingCta: "Book a chair",
  },
  {
    id: "contractor",
    shopNiche: "contractor",
    label: "General contractor",
    title: "Hearth Line",
    tagline: "Walk the job site. Leave with a scope and a number.",
    accent: "#D7A15A",
    keywords: ["general contractor", "home repair", "remodel", "handyman", "home services"],
    auditTitle: "What should the estimate cover?",
    auditNote: "A plain description is enough to hold the visit.",
    auditQuestions: [
      {
        id: "job",
        label: "The job",
        choices: [
          { value: "Repair", label: "A repair" },
          { value: "Remodel", label: "A remodel" },
          { value: "Look", label: "Just come look" },
        ],
      },
      {
        id: "timing",
        label: "When?",
        choices: [
          { value: "This week", label: "This week" },
          { value: "This month", label: "This month" },
          { value: "Planning", label: "I'm still planning" },
        ],
      },
    ],
    services: [
      { name: "Site visit", detail: "A walk-through and a written range.", priceLabel: "$95", durationMin: 60 },
      { name: "Small repair", detail: "One problem, finished in a visit.", priceLabel: "$240", durationMin: 120 },
      { name: "Remodel consult", detail: "The plan before the work starts.", priceLabel: "$150", durationMin: 75 },
    ],
    bookingCta: "Book a site visit",
  },
  {
    id: "roofing",
    shopNiche: "contractor",
    label: "Roofing",
    title: "Ridge Roofing",
    tagline: "A look at the roof, then a price you can read.",
    accent: "#C4783A",
    keywords: ["roof repair", "roof leak", "shingle replacement", "roof inspection", "storm damage"],
    auditTitle: "What is the roof doing?",
    auditNote: "Tell the crew what you can see from the ground.",
    auditQuestions: [
      {
        id: "symptom",
        label: "What is happening?",
        choices: [
          { value: "Leak", label: "A leak" },
          { value: "Missing shingles", label: "Missing shingles" },
          { value: "Just a look", label: "I want it looked at" },
        ],
      },
      {
        id: "age",
        label: "How old is the roof?",
        choices: [
          { value: "Under 10 years", label: "Under 10 years" },
          { value: "10-20 years", label: "10–20 years" },
          { value: "Older or unknown", label: "Older, or I don't know" },
        ],
      },
    ],
    services: [
      { name: "Roof look", detail: "A walk of the roof and a plain report.", priceLabel: "$149", durationMin: 60 },
      { name: "Leak stop", detail: "Find the leak and close it.", priceLabel: "$350", durationMin: 120 },
      { name: "Shingle repair", detail: "Replace the damaged run.", priceLabel: "$680", durationMin: 180 },
    ],
    bookingCta: "Book a roof visit",
  },
  {
    id: "plumbing",
    shopNiche: "contractor",
    label: "Plumbing",
    title: "Clear Line Plumbing",
    tagline: "The leak, the drain, or the water heater. We come to the house.",
    accent: "#7EC8E3",
    keywords: ["plumber near me", "clogged drain", "water heater", "leaky faucet", "emergency plumber"],
    auditTitle: "Where is the water going?",
    auditNote: "A few taps so the plumber brings the right parts.",
    auditQuestions: [
      {
        id: "problem",
        label: "What is wrong?",
        choices: [
          { value: "Drain", label: "A drain won't clear" },
          { value: "Leak", label: "Something is leaking" },
          { value: "No hot water", label: "No hot water" },
        ],
      },
      {
        id: "urgency",
        label: "How soon?",
        choices: [
          { value: "Today", label: "Today" },
          { value: "This week", label: "This week" },
          { value: "Whenever", label: "Whenever you can" },
        ],
      },
    ],
    services: [
      { name: "Drain call", detail: "One drain, cleared and checked.", priceLabel: "$165", durationMin: 60 },
      { name: "Leak visit", detail: "Find the drip and stop it.", priceLabel: "$189", durationMin: 75 },
      { name: "Water heater check", detail: "Look at the tank and the lines.", priceLabel: "$129", durationMin: 45 },
    ],
    bookingCta: "Book a plumber",
  },
  {
    id: "hvac",
    shopNiche: "contractor",
    label: "HVAC",
    title: "North Cooling",
    tagline: "Heat, cool, and the filter that should have been changed.",
    accent: "#6FA8A0",
    keywords: ["ac repair", "furnace repair", "hvac tune up", "no heat", "air conditioning"],
    auditTitle: "Is the house too hot or too cold?",
    auditNote: "The tech uses this to know which unit to open.",
    auditQuestions: [
      {
        id: "system",
        label: "Which system?",
        choices: [
          { value: "Cooling", label: "Air conditioning" },
          { value: "Heat", label: "Furnace or heat" },
          { value: "Both", label: "Both" },
        ],
      },
      {
        id: "lastService",
        label: "Last tune-up",
        choices: [
          { value: "This year", label: "This year" },
          { value: "Over a year", label: "More than a year" },
          { value: "Never", label: "Never, or I don't know" },
        ],
      },
    ],
    services: [
      { name: "Tune-up", detail: "Filters, coils, and a run test.", priceLabel: "$129", durationMin: 60 },
      { name: "No-cool call", detail: "The unit that stopped cooling.", priceLabel: "$189", durationMin: 90 },
      { name: "No-heat call", detail: "The unit that stopped heating.", priceLabel: "$189", durationMin: 90 },
    ],
    bookingCta: "Book a tune-up",
  },
  {
    id: "content",
    shopNiche: "creator",
    label: "Cinematic Video and Content Creator",
    title: "Frame Desk",
    tagline: "Shot, cut, and ready to post when you book it.",
    accent: "#7C6BF2",
    keywords: ["video editor", "content creator", "social video", "youtube edit", "shoot and edit"],
    auditTitle: "What should the video do?",
    auditNote: "So the editor knows the length before the shoot.",
    auditQuestions: [
      {
        id: "job",
        label: "What do you need?",
        choices: [
          { value: "Shoot", label: "Someone to film" },
          { value: "Edit", label: "An edit of footage I have" },
          { value: "Both", label: "Film and edit" },
        ],
      },
      {
        id: "length",
        label: "How long is the piece?",
        choices: [
          { value: "Short", label: "Under a minute" },
          { value: "Standard", label: "A few minutes" },
          { value: "Long", label: "Longer than that" },
        ],
      },
    ],
    services: [
      { name: "Content day", detail: "A half day on camera.", priceLabel: "$450", durationMin: 180 },
      { name: "Video edit", detail: "One finished piece from your footage.", priceLabel: "$180", durationMin: 90 },
      { name: "Shoot and cut", detail: "The day plus the edit.", priceLabel: "$720", durationMin: 240 },
    ],
    bookingCta: "Book the edit",
  },
  {
    id: "prompt",
    shopNiche: "prompt",
    label: "AI prompt engineering and creation",
    title: "Prompt Desk",
    tagline: "The prompt is written before the piece is made.",
    accent: "#3D7EFF",
    keywords: ["prompt engineering", "ai prompt", "ai creation", "custom prompts"],
    auditTitle: "What should the prompt do?",
    auditNote: "So the desk knows the job before the session.",
    auditQuestions: [
      {
        id: "job",
        label: "What do you need?",
        choices: [
          { value: "Session", label: "A prompt session" },
          { value: "Pack", label: "A written prompt pack" },
          { value: "Build", label: "Prompts and the finished piece" },
        ],
      },
      {
        id: "use",
        label: "Where will it be used?",
        choices: [
          { value: "Image", label: "Images" },
          { value: "Video", label: "Video" },
          { value: "Copy", label: "Writing" },
        ],
      },
    ],
    services: [
      { name: "Prompt session", detail: "An hour on the brief.", priceLabel: "$150", durationMin: 60 },
      { name: "Prompt pack", detail: "A written set for the work you named.", priceLabel: "$280", durationMin: 90 },
      { name: "Creation block", detail: "The prompts plus the finished piece.", priceLabel: "$480", durationMin: 180 },
    ],
    bookingCta: "Book a session",
  },
  {
    id: "entertainer",
    shopNiche: "entertainer",
    label: "Entertainer",
    title: "House Act",
    tagline: "A set for the room, booked before the night starts.",
    accent: "#E23D8C",
    keywords: ["live entertainment", "event performer", "private show", "party act", "book a performer"],
    auditTitle: "What kind of night is it?",
    auditNote: "The act uses this to hold the right length.",
    auditQuestions: [
      {
        id: "room",
        label: "Where is it?",
        choices: [
          { value: "House", label: "A house party" },
          { value: "Venue", label: "A venue" },
          { value: "Not sure", label: "Still deciding" },
        ],
      },
      {
        id: "length",
        label: "How long?",
        choices: [
          { value: "Short set", label: "A short set" },
          { value: "Hour", label: "About an hour" },
          { value: "Night", label: "The whole night" },
        ],
      },
    ],
    services: [
      { name: "Short set", detail: "Twenty minutes. One room.", priceLabel: "$150", durationMin: 20 },
      { name: "Private show", detail: "A booked hour.", priceLabel: "$400", durationMin: 60 },
      { name: "Full night", detail: "Sets, breaks, and the close.", priceLabel: "$900", durationMin: 180 },
    ],
    bookingCta: "Book a set",
  },
  {
    id: "locksmith",
    shopNiche: "locksmith",
    label: "Mobile locksmith",
    title: "Night Key",
    tagline: "Lockout, rekey, or a new lock. The van comes to you.",
    accent: "#C6A15B",
    keywords: ["locksmith near me", "car lockout", "house lockout", "rekey", "emergency locksmith"],
    auditTitle: "Which lock is the problem?",
    auditNote: "So the van leaves with the right blanks.",
    auditQuestions: [
      {
        id: "lock",
        label: "Where is the lock?",
        choices: [
          { value: "House", label: "House" },
          { value: "Car", label: "Car" },
          { value: "Shop", label: "Shop or office" },
        ],
      },
      {
        id: "job",
        label: "What do you need?",
        choices: [
          { value: "Locked out", label: "I'm locked out" },
          { value: "Rekey", label: "New keys for the same lock" },
          { value: "New lock", label: "A new lock" },
        ],
      },
    ],
    services: [
      { name: "Lockout", detail: "Emergency open. House, car, or door.", priceLabel: "$125", durationMin: 45 },
      { name: "Rekey", detail: "Same lock, new keys.", priceLabel: "$95", durationMin: 60 },
      { name: "Lock install", detail: "A new deadbolt, fitted and tested.", priceLabel: "$180", durationMin: 75 },
    ],
    bookingCta: "Book a locksmith",
  },
  {
    id: "firewood",
    shopNiche: "firewood",
    label: "Firewood",
    title: "Cord Line",
    tagline: "Cut, split, and dropped where you want the pile.",
    accent: "#C4783A",
    keywords: ["firewood delivery", "cord of wood", "seasoned firewood", "firewood near me", "stack firewood"],
    auditTitle: "How much wood do you need?",
    auditNote: "The truck is loaded to the size you pick.",
    auditQuestions: [
      {
        id: "amount",
        label: "How much?",
        choices: [
          { value: "Face cord", label: "A face cord" },
          { value: "Half cord", label: "Half a cord" },
          { value: "Full cord", label: "A full cord" },
        ],
      },
      {
        id: "drop",
        label: "Where does it land?",
        choices: [
          { value: "Driveway", label: "The driveway" },
          { value: "Side yard", label: "The side yard" },
          { value: "Not sure", label: "I'll explain when you call" },
        ],
      },
    ],
    services: [
      { name: "Cut and split", detail: "One cord, cut and split.", priceLabel: "$280", durationMin: 180 },
      { name: "Cord delivery", detail: "A cord dropped at the house.", priceLabel: "$320", durationMin: 60 },
      { name: "Stack the cord", detail: "Stacked and covered.", priceLabel: "$80", durationMin: 90 },
    ],
    bookingCta: "Book a cord",
  },
  {
    id: "cleaning",
    shopNiche: "clean",
    label: "Home cleaning",
    title: "Bright House",
    tagline: "A standard clean, a deep clean, or the move-out.",
    accent: "#9FD3C7",
    keywords: ["house cleaning", "deep clean", "move out clean", "maid service", "recurring cleaning"],
    auditTitle: "What kind of clean?",
    auditNote: "The crew sizes the visit from the rooms, not a long form.",
    auditQuestions: [
      {
        id: "clean",
        label: "Which clean?",
        choices: [
          { value: "Standard", label: "The regular clean" },
          { value: "Deep", label: "A deep clean" },
          { value: "Move-out", label: "Moving out" },
        ],
      },
      {
        id: "size",
        label: "How big is the place?",
        choices: [
          { value: "Small", label: "1–2 bedrooms" },
          { value: "Medium", label: "3 bedrooms" },
          { value: "Large", label: "Bigger than that" },
        ],
      },
    ],
    services: [
      { name: "Standard clean", detail: "The rooms you live in.", priceLabel: "$140", durationMin: 120 },
      { name: "Deep clean", detail: "Inside the appliances and the baseboards.", priceLabel: "$240", durationMin: 180 },
      { name: "Move-out", detail: "Empty house, ready for the next keys.", priceLabel: "$320", durationMin: 240 },
    ],
    bookingCta: "Book a clean",
  },
  {
    id: "landscaper",
    shopNiche: "landscaper",
    label: "Landscaper",
    title: "Green Line",
    tagline: "The yard is booked before the truck leaves.",
    accent: "#6FA86A",
    keywords: ["landscaper near me", "lawn care", "yard cleanup", "mowing", "planting"],
    auditTitle: "What does the yard need?",
    auditNote: "A couple of taps so the crew brings the right tools.",
    auditQuestions: [
      {
        id: "job",
        label: "The visit",
        choices: [
          { value: "Mow", label: "A mow" },
          { value: "Cleanup", label: "A cleanup" },
          { value: "Planting", label: "Planting" },
        ],
      },
      {
        id: "size",
        label: "How big is the yard?",
        choices: [
          { value: "Small", label: "A small yard" },
          { value: "Medium", label: "A regular lot" },
          { value: "Large", label: "Bigger than that" },
        ],
      },
    ],
    services: [
      { name: "Mow and edge", detail: "The lawn, the edges, and the blow-off.", priceLabel: "$85", durationMin: 60 },
      { name: "Cleanup", detail: "Beds, leaves, and the haul-away.", priceLabel: "$180", durationMin: 120 },
      { name: "Planting visit", detail: "A bed or a row, planted and watered in.", priceLabel: "$240", durationMin: 150 },
    ],
    bookingCta: "Book the yard",
  },
  {
    id: "foodtruck",
    shopNiche: "foodtruck",
    label: "Mobile food truck",
    title: "Window Line",
    tagline: "The truck is booked before the window opens.",
    accent: "#E07A3D",
    keywords: ["food truck near me", "food truck catering", "mobile food", "lunch truck", "private event food"],
    auditTitle: "What should the truck do?",
    auditNote: "So the window is the right length.",
    auditQuestions: [
      {
        id: "stop",
        label: "The booking",
        choices: [
          { value: "Lunch", label: "A lunch stop" },
          { value: "Event", label: "A private event" },
          { value: "Tray", label: "A tray, no full stop" },
        ],
      },
      {
        id: "crowd",
        label: "How many people?",
        choices: [
          { value: "Small", label: "Under 30" },
          { value: "Medium", label: "30–80" },
          { value: "Large", label: "More than that" },
        ],
      },
    ],
    services: [
      { name: "Lunch stop", detail: "The truck on site for a lunch window.", priceLabel: "$450", durationMin: 120 },
      { name: "Private event", detail: "A booked window for a party or a crew.", priceLabel: "$750", durationMin: 180 },
      { name: "Catering tray", detail: "Food from the truck, dropped without the full stop.", priceLabel: "$180", durationMin: 45 },
    ],
    bookingCta: "Book the truck",
  },
  {
    id: "dogwalk",
    shopNiche: "dogwalk",
    label: "Dog walking",
    title: "Leash Line",
    tagline: "The walk is booked before the leash is clipped.",
    accent: "#C4A15A",
    keywords: ["dog walker near me", "dog walking", "midday dog walk", "pack walk", "puppy walk"],
    auditTitle: "What does the dog need?",
    auditNote: "So the walker brings the right leash.",
    auditQuestions: [
      {
        id: "walk",
        label: "The visit",
        choices: [
          { value: "Solo", label: "One dog" },
          { value: "Pack", label: "A few dogs" },
          { value: "Midday", label: "A short midday check" },
        ],
      },
      {
        id: "energy",
        label: "How is the dog on a leash?",
        choices: [
          { value: "Easy", label: "Easy" },
          { value: "Pulls", label: "Pulls a bit" },
          { value: "Strong", label: "Needs a strong walker" },
        ],
      },
    ],
    services: [
      { name: "Solo walk", detail: "One dog, one loop, back at the door.", priceLabel: "$25", durationMin: 30 },
      { name: "Pack walk", detail: "Two or three dogs from the same house.", priceLabel: "$40", durationMin: 45 },
      { name: "Midday visit", detail: "A short walk and a water check.", priceLabel: "$20", durationMin: 20 },
    ],
    bookingCta: "Book the walk",
  },
  {
    id: "detailer",
    shopNiche: "detailer",
    label: "Mobile detailer",
    title: "Curb Shine",
    tagline: "The van is booked before it leaves the curb.",
    accent: "#7EC8E3",
    keywords: ["mobile detailer", "auto detailing", "mobile car wash", "interior detail", "driveway detail"],
    auditTitle: "What does the car need?",
    auditNote: "So the van brings the right kit.",
    auditQuestions: [
      {
        id: "job",
        label: "The visit",
        choices: [
          { value: "Exterior", label: "An exterior wash" },
          { value: "Interior", label: "The interior" },
          { value: "Full", label: "A full detail" },
        ],
      },
      {
        id: "size",
        label: "What kind of vehicle?",
        choices: [
          { value: "Car", label: "A car" },
          { value: "Suv", label: "An SUV" },
          { value: "Truck", label: "A truck or van" },
        ],
      },
    ],
    services: [
      { name: "Exterior wash", detail: "Rinse, wash, and dry in the driveway.", priceLabel: "$80", durationMin: 60 },
      { name: "Interior reset", detail: "Vacuum, wipe-down, and the windows.", priceLabel: "$140", durationMin: 90 },
      { name: "Full detail", detail: "Outside and inside, including the wheels.", priceLabel: "$250", durationMin: 180 },
    ],
    bookingCta: "Book the detail",
  },
  {
    id: "hunting",
    shopNiche: "hunting",
    label: "Rugged Backcountry Services",
    title: "Ridge Line",
    tagline: "The hunt is booked before the gate opens.",
    accent: "#8B7355",
    keywords: ["private hunting guide", "guided hunt", "hunting guide near me", "half day hunt", "scouting"],
    auditTitle: "What kind of day?",
    auditNote: "So the guide holds the right block of ground.",
    auditQuestions: [
      {
        id: "day",
        label: "The booking",
        choices: [
          { value: "Half", label: "A half day" },
          { value: "Full", label: "A full day" },
          { value: "Scout", label: "A scouting walk" },
        ],
      },
      {
        id: "party",
        label: "How many hunters?",
        choices: [
          { value: "One", label: "Just me" },
          { value: "Two", label: "Two of us" },
          { value: "More", label: "A small group" },
        ],
      },
    ],
    services: [
      { name: "Half day", detail: "A morning or an evening on private ground.", priceLabel: "$350", durationMin: 240 },
      { name: "Full day", detail: "Dawn to dark with the guide.", priceLabel: "$650", durationMin: 600 },
      { name: "Scouting walk", detail: "A look at the ground before the hunt day.", priceLabel: "$180", durationMin: 120 },
    ],
    bookingCta: "Book the hunt",
  },
  {
    id: "therapy",
    shopNiche: "therapy",
    label: "Physical therapy",
    title: "Motion Room",
    tagline: "Eval, treatment, and the plan of care.",
    accent: "#6FA8C9",
    keywords: ["physical therapy", "physical therapist", "pt near me", "rehab session", "follow-up visit"],
    auditTitle: "What does the session need?",
    auditNote: "A couple of taps so the room is set up.",
    auditQuestions: [
      {
        id: "visit",
        label: "The visit",
        choices: [
          { value: "Evaluation", label: "A first evaluation" },
          { value: "Follow-up", label: "A follow-up" },
          { value: "Return", label: "A longer return visit" },
        ],
      },
      {
        id: "area",
        label: "Where is the work?",
        choices: [
          { value: "Back", label: "Back or neck" },
          { value: "Joint", label: "A joint" },
          { value: "Other", label: "Somewhere else" },
        ],
      },
    ],
    services: [
      { name: "Evaluation", detail: "Initial eval. Range, strength, and the plan of care.", priceLabel: "$150", durationMin: 60 },
      { name: "Follow-up", detail: "A treatment visit on the plan you already have.", priceLabel: "$95", durationMin: 45 },
      { name: "Return visit", detail: "A longer treatment block when the plan calls for it.", priceLabel: "$120", durationMin: 60 },
    ],
    bookingCta: "Book a treatment",
  },
  {
    id: "bowtech",
    shopNiche: "bowtech",
    label: "Custom bow technician",
    title: "String Bench",
    tagline: "The bow is booked before it hits the bench.",
    accent: "#C4A15A",
    keywords: ["custom bow technician", "bow tech", "bow tune", "bow setup", "archery repair"],
    auditTitle: "What does the bow need?",
    auditNote: "So the bench is set for the job.",
    auditQuestions: [
      {
        id: "job",
        label: "The job",
        choices: [
          { value: "Tune", label: "A tune" },
          { value: "Setup", label: "A new setup" },
          { value: "Repair", label: "A repair" },
        ],
      },
      {
        id: "when",
        label: "When do you need it?",
        choices: [
          { value: "This week", label: "This week" },
          { value: "Before season", label: "Before the season" },
          { value: "No rush", label: "No rush" },
        ],
      },
    ],
    services: [
      { name: "Tune", detail: "Paper tune and a walk-back.", priceLabel: "$75", durationMin: 60 },
      { name: "Setup", detail: "A new bow, built and set to you.", priceLabel: "$150", durationMin: 90 },
      { name: "Repair", detail: "Strings, cams, or the thing that let go.", priceLabel: "$60", durationMin: 45 },
    ],
    bookingCta: "Book the bench",
  },
  {
    id: "guide",
    shopNiche: "guide",
    label: "Guide services",
    title: "Glass Eddy",
    tagline: "The boat leaves when you do.",
    accent: "#7EC8E3",
    keywords: ["fishing guide", "river guide", "private boat", "rafting"],
    auditTitle: "How do you want to go out?",
    auditNote: "So the boat and the shuttle are held for that put-in.",
    auditQuestions: [
      { id: "trip", label: "The trip", choices: [{ value: "Shared", label: "A shared seat" }, { value: "Private", label: "A private boat" }, { value: "Not sure", label: "Not sure yet" }] },
      { id: "party", label: "How many people?", choices: [{ value: "One", label: "Just me" }, { value: "Pair", label: "Two of us" }, { value: "Group", label: "A small group" }] },
    ],
    services: [
      { name: "Morning half-day", detail: "Class II. Paddle, vest, and the shuttle back.", priceLabel: "$95", durationMin: 240 },
      { name: "Full-day canyon", detail: "The long line. Lunch on the gravel. Gear included.", priceLabel: "$165", durationMin: 480 },
      { name: "Private half-day", detail: "Your group only. Up to six. Same water, no other boat.", priceLabel: "$520", durationMin: 240 },
    ],
    bookingCta: "Book a trip",
  },
  {
    id: "fitness",
    shopNiche: "fitness",
    label: "Fitness coaching",
    title: "Form Room",
    tagline: "Show up. The coach counts the rest.",
    accent: "#E07A73",
    keywords: ["personal training", "fitness coach", "private session"],
    auditTitle: "What is the training for?",
    auditNote: "So the hour is programmed before you walk in.",
    auditQuestions: [
      { id: "goal", label: "The goal", choices: [{ value: "Strength", label: "Get stronger" }, { value: "Conditioning", label: "Conditioning" }, { value: "Return", label: "Coming back after time off" }] },
      { id: "format", label: "How do you want to train?", choices: [{ value: "Private", label: "One to one" }, { value: "Small", label: "A small group" }, { value: "Assess", label: "Start with an assessment" }] },
    ],
    services: [
      { name: "Intro assessment", detail: "How you move, what hurts, and the first block of work.", priceLabel: "$80", durationMin: 45 },
      { name: "Personal training", detail: "One coach, one hour, the program you are actually on.", priceLabel: "$120", durationMin: 60 },
      { name: "Small group", detail: "Four people. The same hour, a shared floor.", priceLabel: "$40", durationMin: 50 },
    ],
    bookingCta: "Book a training",
  },
  {
    id: "combat",
    shopNiche: "combat",
    label: "Combat sports",
    title: "Iron Round",
    tagline: "Gloves on when the round is booked.",
    accent: "#E25B3A",
    keywords: ["mma", "boxing", "private pad work", "fight camp"],
    auditTitle: "What round are you booking?",
    auditNote: "So the coach knows if this is an intro or camp work.",
    auditQuestions: [
      { id: "round", label: "The booking", choices: [{ value: "Intro", label: "A first class" }, { value: "Private", label: "Private pad work" }, { value: "Camp", label: "Camp before a fight" }] },
      { id: "experience", label: "Where are you?", choices: [{ value: "New", label: "New to this" }, { value: "Training", label: "Already training" }, { value: "Fighting", label: "I have a date" }] },
    ],
    services: [
      { name: "Intro class", detail: "One class. Gloves on, the basics, no sparring.", priceLabel: "$40", durationMin: 60 },
      { name: "Private hour", detail: "One coach and the thing you came to fix.", priceLabel: "$120", durationMin: 60 },
      { name: "Camp block", detail: "Four sessions in the weeks before a fight.", priceLabel: "$360", durationMin: 75 },
    ],
    bookingCta: "Book a round",
  },
  {
    id: "wellness",
    shopNiche: "wellness",
    label: "Massage and bodywork",
    title: "Still Water",
    tagline: "The table is held for the hour you booked.",
    accent: "#7EC8E3",
    keywords: ["massage", "bodywork", "deep tissue"],
    auditTitle: "What should the table feel like?",
    auditNote: "Pressure and focus, before the hour starts.",
    auditQuestions: [
      { id: "work", label: "The hour", choices: [{ value: "Relax", label: "Even pressure" }, { value: "Deep", label: "Deeper work" }, { value: "First", label: "A first session" }] },
      { id: "focus", label: "Where should the work go?", choices: [{ value: "Back", label: "Back and shoulders" }, { value: "Full", label: "The whole hour" }, { value: "Not sure", label: "I'll say when I arrive" }] },
    ],
    services: [
      { name: "Relaxation", detail: "Sixty minutes. Even pressure.", priceLabel: "$110", durationMin: 60 },
      { name: "Deep work", detail: "Ninety minutes on the places that hurt.", priceLabel: "$150", durationMin: 90 },
      { name: "First session", detail: "What hurts, what helps, and the first hour.", priceLabel: "$130", durationMin: 75 },
    ],
    bookingCta: "Book the table",
  },
  {
    id: "lessons",
    shopNiche: "lessons",
    label: "Lessons and tutoring",
    title: "Second Chair",
    tagline: "The same hour, every week, if you want it.",
    accent: "#C9A227",
    keywords: ["tutor", "private lesson", "after school"],
    auditTitle: "Who is the lesson for?",
    auditNote: "So the hour is planned for that student.",
    auditQuestions: [
      { id: "format", label: "The lesson", choices: [{ value: "Private", label: "One student" }, { value: "Placement", label: "A placement first" }, { value: "Group", label: "A small group" }] },
      { id: "subject", label: "What are you working on?", choices: [{ value: "School", label: "Schoolwork" }, { value: "Skill", label: "A skill" }, { value: "Test", label: "A test coming up" }] },
    ],
    services: [
      { name: "Private lesson", detail: "One student and the work they are actually on.", priceLabel: "$70", durationMin: 50 },
      { name: "Placement", detail: "Where they are, and the plan for the next month.", priceLabel: "$50", durationMin: 40 },
      { name: "Small group", detail: "Up to four, on the same lesson.", priceLabel: "$35", durationMin: 60 },
    ],
    bookingCta: "Book a lesson",
  },
  {
    id: "salon",
    shopNiche: "salon",
    label: "Hair salon",
    title: "Halo Room",
    tagline: "Color and the cut that holds it.",
    accent: "#E7B48A",
    keywords: ["hair salon", "color", "blowout", "haircut"],
    auditTitle: "What is the appointment?",
    auditNote: "Color needs a longer block than a cut.",
    auditQuestions: [
      { id: "service", label: "The appointment", choices: [{ value: "Cut", label: "A cut and style" }, { value: "Color", label: "Color" }, { value: "Gloss", label: "A gloss and style" }] },
      { id: "hair", label: "How much hair are we working with?", choices: [{ value: "Short", label: "Short" }, { value: "Medium", label: "Medium" }, { value: "Long", label: "Long or thick" }] },
    ],
    services: [
      { name: "Cut and style", detail: "Consultation, cut, and the finish.", priceLabel: "$85", durationMin: 60 },
      { name: "Color consult", detail: "The formula and a date for the work.", priceLabel: "$40", durationMin: 30 },
      { name: "Gloss and style", detail: "Tone and a blowout, one sitting.", priceLabel: "$160", durationMin: 90 },
    ],
    bookingCta: "Book a style",
  },
  {
    id: "beauty",
    shopNiche: "beauty",
    label: "Nails, lashes, makeup",
    title: "Set Apart",
    tagline: "The set is booked. The chair is held.",
    accent: "#E07A73",
    keywords: ["gel nails", "lash fill", "makeup artist"],
    auditTitle: "Which set are you booking?",
    auditNote: "A full set and a fill are different blocks.",
    auditQuestions: [
      { id: "set", label: "The appointment", choices: [{ value: "Nails", label: "A gel set" }, { value: "Lashes", label: "A lash fill" }, { value: "Face", label: "Makeup" }] },
      { id: "when", label: "When do you need it?", choices: [{ value: "This week", label: "This week" }, { value: "Event", label: "Before an event" }, { value: "Flexible", label: "Whenever the book is open" }] },
    ],
    services: [
      { name: "Gel set", detail: "Shape, color, and a finish that lasts.", priceLabel: "$65", durationMin: 75 },
      { name: "Lash fill", detail: "A fill on a set you already wear.", priceLabel: "$85", durationMin: 60 },
      { name: "Makeup", detail: "The face for the event.", priceLabel: "$95", durationMin: 50 },
    ],
    bookingCta: "Book a set",
  },
  {
    id: "tattoo",
    shopNiche: "tattoo",
    label: "Tattoo shop",
    title: "Iron Ledger",
    tagline: "Draw it. Then sit for it.",
    accent: "#E07A73",
    keywords: ["tattoo", "tattoo consult", "flash"],
    auditTitle: "What are you sitting for?",
    auditNote: "A consult and a session are different blocks on the book.",
    auditQuestions: [
      { id: "piece", label: "The booking", choices: [{ value: "Consult", label: "A drawing consult" }, { value: "Small", label: "A small piece" }, { value: "Session", label: "A longer session" }] },
      { id: "place", label: "Where does it go?", choices: [{ value: "Arm", label: "Arm or leg" }, { value: "Torso", label: "Torso" }, { value: "Other", label: "Somewhere else" }] },
    ],
    services: [
      { name: "Consult", detail: "Placement, size, and a date for the work.", priceLabel: "$40", durationMin: 30 },
      { name: "Small piece", detail: "One sitting. Flash or a simple custom.", priceLabel: "$180", durationMin: 90 },
      { name: "Session", detail: "A longer sitting on a piece already drawn.", priceLabel: "$450", durationMin: 180 },
    ],
    bookingCta: "Book the chair",
  },
  {
    id: "photo",
    shopNiche: "photo",
    label: "Photography",
    title: "North Light",
    tagline: "The hour is shot, then edited.",
    accent: "#B388FF",
    keywords: ["portrait photographer", "mini session", "event photos"],
    auditTitle: "What are we shooting?",
    auditNote: "So the light and the edit are planned for that hour.",
    auditQuestions: [
      { id: "shoot", label: "The session", choices: [{ value: "Portrait", label: "A portrait hour" }, { value: "Mini", label: "A mini" }, { value: "Event", label: "An event" }] },
      { id: "where", label: "Where?", choices: [{ value: "Studio", label: "In the studio" }, { value: "Outside", label: "On location" }, { value: "Not sure", label: "Not sure yet" }] },
    ],
    services: [
      { name: "Portrait hour", detail: "One hour. The edit is included.", priceLabel: "$250", durationMin: 60 },
      { name: "Mini", detail: "Twenty directed frames.", priceLabel: "$150", durationMin: 30 },
      { name: "Event consult", detail: "The timeline, the light, and the date.", priceLabel: "$100", durationMin: 45 },
    ],
    bookingCta: "Book a shoot",
  },
  {
    id: "pets",
    shopNiche: "pets",
    label: "Pet grooming",
    title: "Good Coat",
    tagline: "In clean. Out finished.",
    accent: "#E7B48A",
    keywords: ["dog grooming", "pet groomer", "nail trim"],
    auditTitle: "What does the coat need?",
    auditNote: "A full groom and a nail trim are different blocks.",
    auditQuestions: [
      { id: "groom", label: "The appointment", choices: [{ value: "Full", label: "A full groom" }, { value: "Bath", label: "Bath and brush" }, { value: "Nails", label: "Nails only" }] },
      { id: "coat", label: "How is the coat?", choices: [{ value: "Kept", label: "Kept up" }, { value: "Grown", label: "It has been a while" }, { value: "Matted", label: "Matted" }] },
    ],
    services: [
      { name: "Full groom", detail: "Bath, cut, ears, and nails.", priceLabel: "$85", durationMin: 90 },
      { name: "Bath and brush", detail: "A clean coat. No haircut.", priceLabel: "$45", durationMin: 45 },
      { name: "Nail trim", detail: "Nails only.", priceLabel: "$18", durationMin: 20 },
    ],
    bookingCta: "Book a groom",
  },
  {
    id: "music",
    shopNiche: "music",
    label: "Music artist",
    title: "Lowlight",
    tagline: "The booth, then the room.",
    accent: "#B388FF",
    keywords: ["recording session", "mix", "live set"],
    auditTitle: "What are you booking in the room?",
    auditNote: "A vocal session and a live set need different blocks.",
    auditQuestions: [
      { id: "room", label: "The booking", choices: [{ value: "Booth", label: "A recording session" }, { value: "Mix", label: "A mix" }, { value: "Show", label: "A live set" }] },
      { id: "ready", label: "How ready is the song?", choices: [{ value: "Idea", label: "Still an idea" }, { value: "Demo", label: "There is a demo" }, { value: "Done", label: "It is tracked" }] },
    ],
    services: [
      { name: "Studio session", detail: "Booth time with an engineer. Two songs, or one until it sits right.", priceLabel: "$400", durationMin: 120 },
      { name: "Mix + master", detail: "One song. Notes back in the same sitting.", priceLabel: "$280", durationMin: 90 },
      { name: "Live set", detail: "A room, a set length, and the night.", priceLabel: "$800", durationMin: 45 },
    ],
    bookingCta: "Book the room",
  },
  {
    id: "events",
    shopNiche: "events",
    label: "Events",
    title: "Hold the Date",
    tagline: "The date is held when the timeline is booked.",
    accent: "#B388FF",
    keywords: ["event planner", "day of coordination", "venue walkthrough"],
    auditTitle: "What part of the day do you need?",
    auditNote: "A walkthrough and day-of lead are different holds.",
    auditQuestions: [
      { id: "block", label: "The booking", choices: [{ value: "Walk", label: "A venue walkthrough" }, { value: "Lead", label: "Day-of lead" }, { value: "Reception", label: "The reception block" }] },
      { id: "size", label: "How big is the room?", choices: [{ value: "Small", label: "Under 50" }, { value: "Medium", label: "50–150" }, { value: "Large", label: "Bigger than that" }] },
    ],
    services: [
      { name: "Venue walkthrough", detail: "The room, the load-in, and whether the date is open.", priceLabel: "$0", durationMin: 45 },
      { name: "Day-of lead", detail: "The timeline in the room.", priceLabel: "$800", durationMin: 90 },
      { name: "Reception block", detail: "Room, vendors, and the close.", priceLabel: "$1,500", durationMin: 240 },
    ],
    bookingCta: "Book the date",
  },
  {
    id: "security",
    shopNiche: "security",
    label: "Private security",
    title: "Night Watch",
    tagline: "The post is covered when the shift is booked.",
    accent: "#7EC8E3",
    keywords: ["security guard", "event security", "standing post"],
    auditTitle: "What does the post need to cover?",
    auditNote: "So the officer knows the door, the lot, and the hours.",
    auditQuestions: [
      { id: "post", label: "The booking", choices: [{ value: "Consult", label: "A site walk" }, { value: "Shift", label: "A standing post" }, { value: "Event", label: "An event night" }] },
      { id: "site", label: "What kind of site?", choices: [{ value: "Door", label: "A door" }, { value: "Lot", label: "A lot or perimeter" }, { value: "Event", label: "An event floor" }] },
    ],
    services: [
      { name: "Site consult", detail: "Walk the door, the lot, and what the post needs.", priceLabel: "$0", durationMin: 45 },
      { name: "Standing post", detail: "One officer, one shift, the site you named.", priceLabel: "$320", durationMin: 240 },
      { name: "Event detail", detail: "Door, floor, and the close.", priceLabel: "$480", durationMin: 300 },
    ],
    bookingCta: "Book a post",
  },
  {
    id: "studio",
    shopNiche: "studio",
    label: "App studio",
    title: "Forge Studio",
    tagline: "Scope it, then launch the book.",
    accent: "#2EE6D6",
    keywords: ["app studio", "booking site", "operator desk"],
    auditTitle: "What should the build cover?",
    auditNote: "A scope call is shorter than a launch.",
    auditQuestions: [
      { id: "build", label: "The engagement", choices: [{ value: "Scope", label: "A scope call" }, { value: "Launch", label: "A site launch" }, { value: "Desk", label: "The operator desk" }] },
      { id: "stage", label: "Where is the shop today?", choices: [{ value: "Idea", label: "Still an idea" }, { value: "Named", label: "The services are named" }, { value: "Live", label: "Something is already live" }] },
    ],
    services: [
      { name: "Discovery call", detail: "What you run, and what the book should say.", priceLabel: "$150", durationMin: 45 },
      { name: "Site launch", detail: "A live booking page, services, and staff.", priceLabel: "$480", durationMin: 90 },
      { name: "Operator desk", detail: "Admin, the employee board, and the incoming book.", priceLabel: "$320", durationMin: 60 },
    ],
    bookingCta: "Book a scope",
  },
  {
    id: "retail",
    shopNiche: "retail",
    label: "Retail",
    title: "Counter Goods",
    tagline: "The item is yours when you order it.",
    accent: "#E7B48A",
    keywords: ["merch", "shop print", "counter goods"],
    auditTitle: "What are you ordering?",
    auditNote: "Counted stock. No appointment required.",
    auditQuestions: [
      { id: "item", label: "The order", choices: [{ value: "Cap", label: "A cap" }, { value: "Print", label: "A print" }, { value: "Bundle", label: "The bundle" }] },
      { id: "qty", label: "How many?", choices: [{ value: "One", label: "One" }, { value: "Few", label: "A few" }, { value: "More", label: "A larger order" }] },
    ],
    services: [
      { name: "House cap", detail: "Embroidered mark. One size.", priceLabel: "$32", durationMin: 0 },
      { name: "Shop print", detail: "An 18×24 poster.", priceLabel: "$24", durationMin: 0 },
      { name: "Counter bundle", detail: "The cap and the print together.", priceLabel: "$48", durationMin: 0 },
    ],
    bookingCta: "Order product",
  },
  {
    id: "field",
    shopNiche: "field",
    label: "Field service",
    title: "Northline Repair",
    tagline: "The van rolls when the call is booked.",
    accent: "#7EC8E3",
    keywords: ["mobile mechanic", "no start", "driveway diagnostic"],
    auditTitle: "What is the vehicle doing?",
    auditNote: "So the van leaves with the right scan tool.",
    auditQuestions: [
      { id: "symptom", label: "The call", choices: [{ value: "No start", label: "It will not start" }, { value: "Noise", label: "A noise or a light" }, { value: "Service", label: "Oil and an inspection" }] },
      { id: "where", label: "Where is the vehicle?", choices: [{ value: "Driveway", label: "The driveway" }, { value: "Lot", label: "A lot" }, { value: "Bay", label: "It can come to the bay" }] },
    ],
    services: [
      { name: "Driveway diagnostic", detail: "A scan and a plain-language report.", priceLabel: "$129", durationMin: 60 },
      { name: "Mobile rescue", detail: "Battery, jump, and no-start triage.", priceLabel: "$149", durationMin: 50 },
      { name: "Oil and filter", detail: "On the hoist, with the inspection.", priceLabel: "$89", durationMin: 45 },
    ],
    bookingCta: "Book a service call",
  },
];

const BY_ID = new Map(NICHE_PRESETS.map((preset) => [preset.id, preset]));

/** Used when a trade has no ready page of its own. The questions stay tappable. */
const GENERAL_PRESET: NichePreset = {
  id: "general",
  shopNiche: "trade",
  label: "Local service",
  title: "The Shop",
  tagline: "Book a time. We'll take it from there.",
  accent: "#E7B48A",
  keywords: ["local service", "book online", "near me"],
  auditTitle: "What do you need?",
  auditNote: "A couple of taps is enough to hold a time.",
  auditQuestions: [
    {
      id: "job",
      label: "The visit",
      choices: [
        { value: "Standard", label: "The usual visit" },
        { value: "Larger", label: "Something larger" },
        { value: "Not sure", label: "Not sure yet" },
      ],
    },
    {
      id: "timing",
      label: "When?",
      choices: [
        { value: "Soon", label: "As soon as you can" },
        { value: "This month", label: "This month" },
        { value: "Planning", label: "I'm still planning" },
      ],
    },
  ],
  services: [
    { name: "First visit", detail: "The standard booking.", priceLabel: "$80", durationMin: 60 },
    { name: "Follow-up", detail: "A return visit.", priceLabel: "$60", durationMin: 45 },
  ],
  bookingCta: "Book a time",
};

export function nichePresetById(id: string): NichePreset | undefined {
  return BY_ID.get(id);
}

/** Ready pages an owner can tap. Contractor shops also see roofing, plumbing, and HVAC. */
export function presetsForShop(niche: string): readonly NichePreset[] {
  return NICHE_PRESETS.filter((preset) => preset.shopNiche === niche);
}

/** Audit questions and the booking button for the public page. */
export function presetForShopNiche(niche: string): NichePreset {
  return presetsForShop(niche)[0] ?? GENERAL_PRESET;
}
