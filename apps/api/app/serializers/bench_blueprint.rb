class BenchBlueprint < Blueprinter::Base
  identifier :id
  fields :title, :description, :latitude, :longitude, :location_name, :created_at

  # Imagery is derived from visits: a single cover for lists/cards, the full gallery for detail.
  field :cover_photo_url do |bench|
    cover = bench.cover_photo
    cover && Rails.application.routes.url_helpers.rails_blob_path(cover, only_path: true)
  end

  field :gallery_urls do |bench|
    bench.gallery_photos.map do |photo|
      Rails.application.routes.url_helpers.rails_blob_path(photo, only_path: true)
    end
  end

  field :average_rating do |bench|
    bench.average_rating
  end

  field :ratings_count do |bench|
    bench.ratings_count
  end

  field :visits_count do |bench|
    bench.visits_count
  end

  field :comments_count do |bench|
    bench.comments_count
  end

  association :discoverer, blueprint: UserBlueprint, view: :brief

  field :distance_km do |bench, _options|
    bench.respond_to?(:distance_km) ? bench.distance_km&.round(2) : nil
  end
end
