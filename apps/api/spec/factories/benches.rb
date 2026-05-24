FactoryBot.define do
  factory :bench do
    title { Faker::Lorem.sentence(word_count: 3).chomp(".") }
    description { Faker::Lorem.paragraph(sentence_count: 3) }
    latitude { Faker::Address.latitude }
    longitude { Faker::Address.longitude }
    location_name { "#{Faker::Address.street_name}, #{Faker::Address.city}" }
    association :user
  end
end
