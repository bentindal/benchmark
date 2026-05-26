FactoryBot.define do
  factory :bench do
    title { Faker::Lorem.sentence(word_count: 3).chomp(".") }
    description { Faker::Lorem.paragraph(sentence_count: 3) }
    latitude { Faker::Address.latitude }
    longitude { Faker::Address.longitude }
    location_name { "#{Faker::Address.street_name}, #{Faker::Address.city}" }
    association :discoverer, factory: :user

    # A bare bench has no visits/photos. Use :with_visit for a realistic, photo-backed bench.
    trait :with_visit do
      after(:create) do |bench|
        create(:visit, bench: bench, user: bench.discoverer)
      end
    end
  end
end
