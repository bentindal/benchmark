class Bench < ApplicationRecord
  belongs_to :discoverer, class_name: "User", foreign_key: :discovered_by_id

  has_many :visits, dependent: :destroy
  has_many :comments, dependent: :destroy

  validates :title, presence: true
  validates :latitude, presence: true
  validates :longitude, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :top_rated, lambda {
    joins(:visits)
      .where.not(visits: { overall_score: nil })
      .group(:id)
      .order(Arel.sql("AVG(visits.overall_score) DESC"))
  }

  # A bench's rating aggregates one vote per user — each user's most recent *rated* visit.
  def latest_rated_visits
    Visit.from(
      visits.rated.select("DISTINCT ON (visits.user_id) visits.*")
            .order("visits.user_id, visits.created_at DESC"),
      :visits
    )
  end

  def average_rating
    scope = latest_rated_visits
    {
      view: scope.average(:view_score)&.to_f&.round(1),
      comfort: scope.average(:comfort_score)&.to_f&.round(1),
      location: scope.average(:location_score)&.to_f&.round(1),
      overall: scope.average(:overall_score)&.to_f&.round(1)
    }
  end

  # Number of users whose rating counts toward the aggregate.
  def ratings_count
    latest_rated_visits.count
  end

  def visits_count
    visits.count
  end

  def comments_count
    comments.count
  end

  # First photo of the earliest visit — used as the list/card thumbnail.
  def cover_photo
    earliest = visits.order(created_at: :asc).detect { |v| v.photos.attached? }
    earliest&.photos&.first
  end

  def gallery_photos
    visits.order(created_at: :asc).flat_map { |v| v.photos.to_a }
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
end
