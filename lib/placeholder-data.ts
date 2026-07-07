// Placeholder content for every public page. Nothing here is real yet —
// it exists so the pages can be built and styled before Supabase is wired
// up. Swapping to live data later should mean replacing the contents of
// this file (and how it's loaded), not touching the page components.

export const WEDDING_DATE_LABEL = "Saturday, October 17, 2026";
export const VENUE_LINE = "University Place, Washington";

// Mirrors the site_settings key/value table. The home page doesn't read
// this yet (it's still hardcoded JSX), but seed.sql does, so the database
// starts out matching what the site currently shows.
export interface SiteSetting {
  key: string;
  value: string;
}

export const siteSettings: SiteSetting[] = [
  { key: "couple_name_one", value: "Janine" },
  { key: "couple_name_two", value: "Adam" },
  { key: "wedding_date_label", value: WEDDING_DATE_LABEL },
  { key: "wedding_datetime", value: "2026-10-17T18:00:00-07:00" },
  { key: "venue_line", value: VENUE_LINE },
  {
    key: "welcome_message",
    value:
      "We can't wait to celebrate this next chapter surrounded by the people we love most.",
  },
];

export interface ScheduleEvent {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  venueName: string;
  address: string;
  description: string;
  dressCode: string;
}

export const scheduleEvents: ScheduleEvent[] = [
  {
    id: "welcome-drinks",
    name: "Welcome Drinks",
    date: "Friday, October 16, 2026",
    startTime: "6:00 PM",
    endTime: "8:00 PM",
    venueName: "The Lodge at Chambers Bay",
    address: "6320 Grandview Dr W, University Place, WA 98467",
    description:
      "Come as you are and say hello before the big weekend begins. Light bites and a no-host bar, no toasts, no pressure.",
    dressCode: "Casual",
  },
  {
    id: "ceremony-reception",
    name: "Ceremony & Reception",
    date: "Saturday, October 17, 2026",
    startTime: "6:00 PM",
    endTime: "11:00 PM",
    venueName: "Chambers Bay Golf Course",
    address: "6320 Grandview Dr W, University Place, WA 98467",
    description:
      "We're tying the knot overlooking the Sound, followed by dinner, toasts, and dancing under the stars.",
    dressCode: "Formal / Black Tie Optional",
  },
  {
    id: "farewell-brunch",
    name: "Farewell Brunch",
    date: "Sunday, October 18, 2026",
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    venueName: "Anthem Coffee & Tea",
    address: "3502 Bridgeport Way W, University Place, WA 98466",
    description:
      "One last coffee and pastry with us before you hit the road. Drop in any time in the window — no RSVP needed.",
    dressCode: "Casual",
  },
];

export const travelIntro =
  "The closest major airport is Seattle-Tacoma International (SEA), about a 40-minute drive from University Place depending on traffic. We'd recommend renting a car or booking a rideshare in advance for the weekend, since venues are spread across town and rideshare availability can be spotty late at night.";

export interface Hotel {
  id: string;
  name: string;
  photoUrl?: string;
  description: string;
  address?: string;
  distance: string;
  priceRange: string;
  bookingUrl: string;
  roomBlockCode?: string;
  bookByDate?: string;
}

export const hotels: Hotel[] = [
  {
    id: "hotel-murano",
    name: "Hotel Murano",
    description:
      "A stylish downtown Tacoma hotel with an art-filled lobby and rooftop views. Our pick for anyone who wants to make a weekend of it.",
    distance: "15 minutes from the venue",
    priceRange: "$180–$230/night",
    bookingUrl: "https://example.com/book/hotel-murano",
    roomBlockCode: "JANINEADAM26",
    bookByDate: "September 17, 2026",
  },
  {
    id: "silver-cloud",
    name: "Silver Cloud Hotel – University Place",
    description:
      "Simple, comfortable, and the closest option to the ceremony — you could walk if the weather cooperates.",
    distance: "5 minutes from the venue",
    priceRange: "$140–$170/night",
    bookingUrl: "https://example.com/book/silver-cloud",
  },
  {
    id: "home2-suites",
    name: "Home2 Suites by Hilton Tacoma",
    description:
      "Budget-friendly suites with kitchenettes, good for families or anyone staying a few extra nights.",
    distance: "20 minutes from the venue",
    priceRange: "$120–$150/night",
    bookingUrl: "https://example.com/book/home2-suites",
  },
];

export interface Activity {
  id: string;
  name: string;
  category: "activity" | "food_drink";
  photoUrl?: string;
  blurb: string;
  address?: string;
  neighborhood: string;
  linkUrl: string;
}

export const activities: Activity[] = [
  {
    id: "chambers-bay-boardwalk",
    name: "Chambers Bay Boardwalk",
    category: "activity",
    blurb:
      "Our favorite spot for a slow morning walk. Follow the water and you'll get views of the venue from the other side.",
    neighborhood: "University Place",
    linkUrl: "https://example.com/chambers-bay-boardwalk",
  },
  {
    id: "point-defiance",
    name: "Point Defiance Park & Zoo",
    category: "activity",
    blurb:
      "One of the largest urban parks in the country, and where we had our first picnic date. Bring good shoes.",
    neighborhood: "Tacoma",
    linkUrl: "https://example.com/point-defiance",
  },
  {
    id: "museum-of-glass",
    name: "Museum of Glass",
    category: "activity",
    blurb:
      "A rainy-day favorite of ours — watch live glassblowing demonstrations and wander the galleries after.",
    neighborhood: "Downtown Tacoma",
    linkUrl: "https://example.com/museum-of-glass",
  },
  {
    id: "el-gaucho",
    name: "El Gaucho Tacoma",
    category: "food_drink",
    blurb:
      "Our go-to for celebrating anything. Ask for a window table if you can and save room for dessert.",
    neighborhood: "Downtown Tacoma",
    linkUrl: "https://example.com/el-gaucho-tacoma",
  },
  {
    id: "anthem-coffee",
    name: "Anthem Coffee & Tea",
    category: "food_drink",
    blurb:
      "Where half our early relationship happened, one cortado at a time. Also hosting our farewell brunch.",
    neighborhood: "University Place",
    linkUrl: "https://example.com/anthem-coffee",
  },
  {
    id: "7-seas-brewing",
    name: "7 Seas Brewing",
    category: "food_drink",
    blurb:
      "A laid-back taproom with a great patio — perfect if you want to unwind after a day of wedding festivities.",
    neighborhood: "Tacoma",
    linkUrl: "https://example.com/7-seas-brewing",
  },
];

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export const faqs: Faq[] = [
  {
    id: "attire",
    question: "What should I wear?",
    answer:
      "Dress codes vary by event — casual for welcome drinks and brunch, formal (black tie optional) for the ceremony and reception. Details are on the Schedule page for each event.",
  },
  {
    id: "kids",
    question: "Are kids welcome?",
    answer:
      "We love your little ones, but we've decided to keep the wedding weekend adults-only so everyone (including parents!) can relax and celebrate.",
  },
  {
    id: "parking",
    question: "Where should I park?",
    answer:
      "Chambers Bay has a large complimentary guest lot right next to the clubhouse. We'll have signs up, and someone will be there to point you the right way.",
  },
  {
    id: "weather",
    question: "What's the weather like in October?",
    answer:
      "Expect crisp, cool Pacific Northwest fall weather — highs around 55–60°F. A light jacket or wrap is a good idea, especially once the sun goes down.",
  },
  {
    id: "plus-one",
    question: "Can I bring a plus-one?",
    answer:
      "We're so sorry we can't accommodate additional guests beyond who's named on your invitation. When RSVP opens, it will show exactly who we're able to welcome.",
  },
];
