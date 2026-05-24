FactoryBot.define do
  factory :rating do
    view_score { rand(1..5) }
    comfort_score { rand(1..5) }
    location_score { rand(1..5) }
    overall_score { rand(1..5) }
    association :user
    association :bench
  end
end
