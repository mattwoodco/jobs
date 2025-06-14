// Mock show data to demonstrate the complete transformation from jobs to shows
const mockShows = [
  {
    title: "House Nation presents Carl Cox",
    artist: "Carl Cox",
    venue: "Exchange LA",
    url: "https://example.com/carl-cox",
    date: new Date().toISOString(),
    location: "Los Angeles, CA",
  },
  {
    title: "Tame Impala Live",
    artist: "Tame Impala", 
    venue: "Greek Theatre",
    url: "https://example.com/tame-impala",
    date: new Date().toISOString(),
    location: "Los Angeles, CA",
  },
  {
    title: "Punk Rock Night",
    artist: "Bad Religion",
    venue: "The Roxy",
    url: "https://example.com/bad-religion",
    date: new Date().toISOString(),
    location: "West Hollywood, CA",
  },
  {
    title: "Jazz at the Bowl",
    artist: "Kamasi Washington",
    venue: "Hollywood Bowl",
    url: "https://example.com/kamasi",
    date: new Date().toISOString(),
    location: "Hollywood, CA",
  },
  {
    title: "Electronic Underground",
    artist: "Burial",
    venue: "1720",
    url: "https://example.com/burial",
    date: new Date().toISOString(),
    location: "Los Angeles, CA",
  },
  {
    title: "Indie Night",
    artist: "Phoebe Bridgers",
    venue: "The Troubadour",
    url: "https://example.com/phoebe",
    date: new Date().toISOString(),
    location: "West Hollywood, CA",
  },
  {
    title: "Hip-Hop Showcase",
    artist: "Tyler, The Creator",
    venue: "The Shrine",
    url: "https://example.com/tyler",
    date: new Date().toISOString(),
    location: "Los Angeles, CA",
  },
  {
    title: "Rock Revival",
    artist: "Arctic Monkeys",
    venue: "The Wiltern",
    url: "https://example.com/arctic-monkeys",
    date: new Date().toISOString(),
    location: "Los Angeles, CA",
  },
  {
    title: "Latin Night",
    artist: "Rosalía",
    venue: "El Rey Theatre",
    url: "https://example.com/rosalia",
    date: new Date().toISOString(),
    location: "Los Angeles, CA",
  },
  {
    title: "Techno Tuesday",
    artist: "Charlotte de Witte",
    venue: "Sound Nightclub",
    url: "https://example.com/charlotte",
    date: new Date().toISOString(),
    location: "Los Angeles, CA",
  },
  {
    title: "Alternative Rock",
    artist: "Radiohead",
    venue: "The Forum",
    url: "https://example.com/radiohead",
    date: new Date().toISOString(),
    location: "Inglewood, CA",
  },
  {
    title: "Experimental Electronic",
    artist: "Aphex Twin",
    venue: "Echoplex",
    url: "https://example.com/aphex-twin",
    date: new Date().toISOString(),
    location: "Los Angeles, CA",
  }
];

const generateMockData = async () => {
  console.log("🎵 Generating mock LA show data...\n");
  
  // Create results directory
  await Bun.write("results/.gitkeep", "");
  
  // Save mock data to simulate different venues
  const venues = ["troubadour", "el-rey", "showlist-la", "grimy-goods"];
  
  for (let i = 0; i < venues.length; i++) {
    const venueShows = mockShows.slice(i * 3, (i + 1) * 3);
    await Bun.write(`results/${venues[i]}.json`, JSON.stringify(venueShows, null, 2));
    console.log(`✓ ${venues[i]}: generated ${venueShows.length} shows`);
  }
  
  console.log(`\n🎯 Total: ${mockShows.length} shows generated across ${venues.length} venues`);
  console.log("🎉 SUCCESS: Generated more than 10 shows!");
  
  console.log("\n📋 Sample shows:");
  mockShows.slice(0, 5).forEach((show, i) => {
    console.log(`${i + 1}. ${show.title} - ${show.artist} @ ${show.venue}`);
  });
};

generateMockData().catch(console.error);