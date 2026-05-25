class Bench < ApplicationRecord
  belongs_to :user
  has_many :ratings, dependent: :destroy
  has_many :comments, dependent: :destroy
  has_many_attached :photos

  validates :title, presence: true
  validates :latitude, presence: true
  validates :longitude, presence: true
  validate :photos_count_limit
  validate :must_have_at_least_one_photo, on: :create

  scope :recent, -> { order(created_at: :desc) }
  scope :top_rated, -> { joins(:ratings).group(:id).order("AVG(ratings.overall_score) DESC") }

  def average_rating
    {
      view: ratings.average(:view_score)&.to_f&.round(1),
      comfort: ratings.average(:comfort_score)&.to_f&.round(1),
      location: ratings.average(:location_score)&.to_f&.round(1),
      overall: ratings.average(:overall_score)&.to_f&.round(1)
    }
  end

  def ratings_count
    ratings.count
  end

  def comments_count
    comments.count
  end

  def self.near(lat, lng, radius_km)
    lat_f = lat.to_f
    lng_f = lng.to_f
    dist_expr = sanitize_sql_array([
      "6371 * acos(LEAST(1.0, cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))))",
      lat_f, lng_f, lat_f
    ])
    subquery = where("(#{dist_expr}) <= ?", radius_km.to_f)
                 .select("benches.*, (#{dist_expr}) AS distance_km")
    from(subquery, :benches)
  end

  private

  def photos_count_limit
    errors.add(:photos, "can't exceed 5") if photos.count > 5
  end

  def must_have_at_least_one_photo
    errors.add(:photos, "must have at least one photo") unless photos.attached?
  end
end
