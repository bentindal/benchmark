class BenchBlueprint < Blueprinter::Base
  identifier :id
  fields :title, :description, :latitude, :longitude, :location_name, :created_at

  field :photos_urls do |bench|
    bench.photos.map do |photo|
      Rails.application.routes.url_helpers.rails_blob_path(photo, only_path: true)
    end
  end

  field :average_rating do |bench|
    bench.average_rating
  end

  field :ratings_count do |bench|
    bench.ratings_count
  end

  field :comments_count do |bench|
    bench.comments_count
  end

  association :user, blueprint: UserBlueprint, view: :brief

  field :distance_km do |bench, options|
    bench.respond_to?(:distance_km) ? bench.distance_km&.round(2) : nil
  end
end
