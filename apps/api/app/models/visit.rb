class Visit < ApplicationRecord
  belongs_to :user
  belongs_to :bench

  has_many_attached :photos

  validates :view_score, inclusion: { in: 1..5 }, allow_nil: true
  validates :comfort_score, inclusion: { in: 1..5 }, allow_nil: true
  validates :location_score, inclusion: { in: 1..5 }, allow_nil: true
  validates :overall_score, inclusion: { in: 1..5 }, allow_nil: true

  validate :photos_count_limit
  validate :must_have_at_least_one_photo, on: :create

  scope :rated, -> { where.not(overall_score: nil) }

  after_save { bench.touch }
  after_destroy { bench.touch }

  private

  def photos_count_limit
    errors.add(:photos, "can't exceed 5") if photos.count > 5
  end

  def must_have_at_least_one_photo
    errors.add(:photos, "must have at least one photo") unless photos.attached?
  end
end
