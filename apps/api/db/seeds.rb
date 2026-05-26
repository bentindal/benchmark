require "open-uri"

puts "Creating users..."

users = []

user_data = [
  { first: "Ben", last: "Tindal", username: "bentindal", email: "ben@tindal.dev" },
  { first: "Rhys", last: "Morgan", username: "rhys_morgan", email: "rhys_morgan@example.com" },
  { first: "Sioned", last: "Williams", username: "sioned_w", email: "sioned_w@example.com" },
  { first: "Gethin", last: "Davies", username: "gethin_davies", email: "gethin_davies@example.com" },
  { first: "Nia", last: "Evans", username: "nia_evans", email: "nia_evans@example.com" },
  { first: "Owain", last: "Jones", username: "owain_jones", email: "owain_jones@example.com" },
  { first: "Catrin", last: "Hughes", username: "catrin_hughes", email: "catrin_hughes@example.com" },
  { first: "Iwan", last: "Roberts", username: "iwan_roberts", email: "iwan_roberts@example.com" },
]

user_data.each do |ud|
  user = User.find_or_initialize_by(username: ud[:username])
  if user.new_record?
    user.password = "password123"
    user.password_confirmation = "password123"
    user.bio = Faker::Quote.famous_last_words
  end
  # Keep the canonical seed email in sync (it's the login key) for existing users too.
  user.email = ud[:email]
  user.save!
  users << user
end

puts "Creating benches..."

locations = [
  { name: "Cardiff Bay",              lat: 51.461,  lng: -3.166 },
  { name: "Roath Park, Cardiff",      lat: 51.503,  lng: -3.170 },
  { name: "Brecon Beacons",           lat: 51.883,  lng: -3.433 },
  { name: "Pen y Fan",                lat: 51.883,  lng: -3.437 },
  { name: "Barry Island",             lat: 51.394,  lng: -3.289 },
  { name: "Tintern Abbey",            lat: 51.697,  lng: -2.676 },
  { name: "Rhossili Bay, Gower",      lat: 51.569,  lng: -4.293 },
  { name: "Snowdonia National Park",  lat: 53.068,  lng: -4.076 },
  { name: "Brighton Beach",           lat: 50.822,  lng: -0.137 },
  { name: "Hyde Park, London",        lat: 51.507,  lng: -0.166 },
  { name: "Richmond Park",            lat: 51.443,  lng: -0.286 },
  { name: "Lake Windermere",          lat: 54.362,  lng: -2.957 },
  { name: "Edinburgh Arthur's Seat",  lat: 55.944,  lng: -3.162 },
  { name: "Loch Lomond",              lat: 56.083,  lng: -4.577 },
  { name: "St Ives, Cornwall",        lat: 50.208,  lng: -5.480 },
  { name: "Mam Tor, Peak District",   lat: 53.350,  lng: -1.810 },
  { name: "Clifton Downs, Bristol",   lat: 51.460,  lng: -2.620 },
  { name: "South Bank, London",       lat: 51.506,  lng: -0.116 },
  { name: "Durdle Door, Dorset",      lat: 50.621,  lng: -2.277 },
  { name: "York Minster",             lat: 53.962,  lng: -1.082 },
]

bench_titles = [
  "The Waterfront Perch",
  "The Lake View Seat",
  "The Summit Rest",
  "The Windswept Throne",
  "The Islander's Bench",
  "The Abbey Contemplator",
  "The Cliff Edge Classic",
  "The Mountain Wanderer",
  "The Seaside Dreamer",
  "The Parkland Pew",
  "The Deer Watcher",
  "The Shoreline Sentinel",
  "The Volcanic Vigil",
  "The Lochside Lounger",
  "The Harbour Gazer",
  "The Ridge Runner",
  "The Gorge Observer",
  "The Riverside Rambler",
  "The Arch Admirer",
  "The Minster Muser",
]

bench_descriptions = [
  "A beautifully placed bench overlooking the shimmering bay, perfect for watching the boats drift by at golden hour.",
  "Nestled beside the lake's edge, this weathered teak bench has witnessed a thousand sunrises and still stands proud.",
  "Perched near the summit, wind-battered but resolute. Bring a flask — you'll want to linger here.",
  "Exposed to the four winds but rewarding on a clear day with views stretching across three counties.",
  "Salty air, distant waves, and the occasional ice cream van. An island bench doing island things.",
  "The ruins loom magnificently behind you. Sit here long enough and you'll hear the monks chanting.",
  "Teetering on the clifftop (not literally), this bench delivers arguably the finest coastal panorama in Wales.",
  "Deep in the national park, this bench marks the spot where sensible hikers stop, breathe, and reconsider their life choices.",
  "Brighton's best kept secret: a bench away from the arcade noise with a clean view of the channel.",
  "Tucked under a horse chestnut in the park. Ideal for people-watching, squirrel-judging, and quiet reflection.",
  "Red deer graze twenty metres away if you're quiet enough. Bring binoculars and patience.",
  "The lake stretches out endlessly from here. On still mornings the reflection is almost eerie.",
  "Ancient volcanic rock beneath your feet, Edinburgh spread below. Few benches have this much history.",
  "The loch shimmers in every light. Rob Roy almost certainly sat somewhere near here.",
  "Fishermen's cottages, lobster pots, the smell of pasties. Cornwall at its most unashamedly itself.",
  "A geological wonder visible from every angle. On clear days you can see the Hope Valley below.",
  "Clifton's famous gorge frames the view. The suspension bridge hangs in the background like a postcard.",
  "The Thames rolls past and the whole city hums. London benches don't get more iconic than this.",
  "The arch emerges from the sea below, white chalk cliffs gleaming. Arguably the most dramatic bench view in England.",
  "The Minster towers overhead, pigeons circle, tourists photograph everything. Find peace in the middle of it all.",
]

benches = []

visit_notes = [
  "First time here — what a find.",
  "Came back again, still my favourite spot.",
  "Caught the sunset from here, unreal.",
  "Quieter than last time, lovely and peaceful.",
  "Brought friends along, they get it now.",
  nil,
  "Rainy day visit but worth it.",
  "Morning coffee with this view. Perfect.",
]

# Attach 1-3 photos to a visit; returns true if at least one attached.
attach_photos = lambda do |visit, bench_index, visit_index|
  count = rand(1..3)
  count.times do |p|
    url = "https://picsum.photos/seed/bench#{bench_index + 1}_#{visit_index + 1}_#{p + 1}/800/600"
    begin
      visit.photos.attach(
        io: URI.open(url),
        filename: "bench_#{bench_index + 1}_visit_#{visit_index + 1}_photo_#{p + 1}.jpg",
        content_type: "image/jpeg"
      )
    rescue => e
      puts "  Warning: could not attach photo for bench #{bench_index + 1}: #{e.message}"
    end
  end
  visit.photos.attached?
end

locations.each_with_index do |loc, i|
  bench = Bench.find_or_initialize_by(title: bench_titles[i])

  if bench.new_record?
    # The discoverer is the first user to visit; other users contribute their own visits.
    visitors = users.sample(rand(3..8))
    discoverer = visitors.first

    bench.description = bench_descriptions[i]
    bench.latitude = loc[:lat]
    bench.longitude = loc[:lng]
    bench.location_name = loc[:name]
    bench.discoverer = discoverer

    visitors.each_with_index do |visitor, vi|
      visit = bench.visits.build(
        user: visitor,
        note: visit_notes.sample,
        view_score: rand(1..5),
        comfort_score: rand(1..5),
        location_score: rand(1..5),
        overall_score: rand(2..5)
      )
      attach_photos.call(visit, i, vi)
    end

    bench.save!
  end

  benches << bench
end

puts "Creating comments..."

comment_pool = [
  "Stunning view of the valley — worth every step of the climb.",
  "A bit wobbly but the view more than makes up for it.",
  "Perfect spot for a brew and a biscuit after the walk.",
  "The wind was fierce but I stayed for twenty minutes anyway.",
  "Came here at sunset and it was absolutely magical.",
  "Surprisingly comfortable for such an old bench. Solid oak, I think.",
  "My dog refused to leave. Can't say I blamed her.",
  "Found this by accident and now it's my favourite bench in the country.",
  "The slats need some TLC but the location is unbeatable.",
  "Sat here for an hour watching the tide come in. Bliss.",
  "Good solid bench. Gets busy at weekends so arrive early.",
  "Brought a sandwich and a book. Left two hours later.",
  "Slightly overgrown path to reach it but completely worth the effort.",
  "The memorial plaque on the side made me stop and think.",
  "Ideal for birdwatching. Saw a peregrine circling overhead.",
  "Cold and exposed in winter, but magnificent. Dress accordingly.",
  "Kids loved it. There's a clear drop nearby so watch little ones.",
  "One of the armrests is missing but it's still a cracking spot.",
  "The view changes completely depending on the weather. Always worth revisiting.",
  "Best sunrise bench I've found in years of walking this area.",
  "Paint's peeling a bit but the bones of the bench are excellent.",
  "Locals clearly love this spot — there were fresh flowers on the nearby post.",
  "Peaceful even when the main path below is busy. Hidden gem.",
  "Arrived in fog, cleared after twenty minutes to reveal something extraordinary.",
  "The bench faces perfectly west. Sunset views are genuinely special here.",
  "Solid, well-maintained, good drainage underneath. Someone cares for this spot.",
  "A little exposed but a windbreak forms naturally from the hedge behind.",
  "First visited years ago and it hasn't changed. That's a compliment.",
  "Overheard the best conversation here between two strangers. This bench brings people together.",
  "Rained the whole time but I still didn't want to move.",
  "The view down to the coast is absolutely breathtaking.",
  "More comfortable than it looks. I've had worse seats in theatres.",
  "The engraved dedication on the backrest is quietly moving.",
  "There's a robin that lives nearby and visits regularly. Delightful.",
  "One of those benches you tell people about. They should thank whoever put it here.",
]

comments_created = 0

benches.each do |bench|
  next if bench.comments.any?

  comment_count = rand(3..10)
  comment_count.times do
    Comment.create!(
      user: users.sample,
      bench: bench,
      body: comment_pool.sample
    )
    comments_created += 1
  end
end

puts ""
puts "=" * 40
puts "Seed complete!"
puts "  Users:    #{User.count}"
puts "  Benches:  #{Bench.count}"
puts "  Visits:   #{Visit.count}"
puts "  Comments: #{Comment.count}"
puts "=" * 40
