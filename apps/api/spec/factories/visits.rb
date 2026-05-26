FactoryBot.define do
  factory :visit do
    note { Faker::Lorem.sentence }
    view_score { rand(1..5) }
    comfort_score { rand(1..5) }
    location_score { rand(1..5) }
    overall_score { rand(1..5) }
    association :user
    association :bench

    after(:build) do |visit|
      visit.photos.attach(
        io: StringIO.new("fake image content"),
        filename: "photo.jpg",
        content_type: "image/jpeg"
      )
    end

    # A visit that records presence/photos only, no rating — excluded from aggregates.
    trait :unrated do
      view_score { nil }
      comfort_score { nil }
      location_score { nil }
      overall_score { nil }
    end
  end
end
