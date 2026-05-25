FactoryBot.define do
  factory :bench do
    title { Faker::Lorem.sentence(word_count: 3).chomp(".") }
    description { Faker::Lorem.paragraph(sentence_count: 3) }
    latitude { Faker::Address.latitude }
    longitude { Faker::Address.longitude }
    location_name { "#{Faker::Address.street_name}, #{Faker::Address.city}" }
    association :user

    after(:build) do |bench|
      bench.photos.attach(
        io: StringIO.new("fake image content"),
        filename: "photo.jpg",
        content_type: "image/jpeg"
      )
    end
  end
end
