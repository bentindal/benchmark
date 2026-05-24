class Rating < ApplicationRecord
  belongs_to :user
  belongs_to :bench

  validates :user_id, uniqueness: { scope: :bench_id, message: "has already rated this bench" }
  validates :view_score, presence: true, inclusion: { in: 1..5 }
  validates :overall_score, presence: true, inclusion: { in: 1..5 }
  validates :comfort_score, inclusion: { in: 1..5 }, allow_nil: true
  validates :location_score, inclusion: { in: 1..5 }, allow_nil: true

  after_save { bench.touch }
end
