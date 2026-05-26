class VisitBlueprint < Blueprinter::Base
  identifier :id
  fields :note, :view_score, :comfort_score, :location_score, :overall_score,
         :user_id, :bench_id, :created_at

  field :photos_urls do |visit|
    visit.photos.map do |photo|
      Rails.application.routes.url_helpers.rails_blob_path(photo, only_path: true)
    end
  end

  association :user, blueprint: UserBlueprint, view: :brief

  # Used by the feed: enough bench context to render an activity card and link through.
  view :with_bench do
    field :bench do |visit|
      bench = visit.bench
      cover = bench.cover_photo
      {
        id: bench.id,
        title: bench.title,
        location_name: bench.location_name,
        latitude: bench.latitude,
        longitude: bench.longitude,
        cover_photo_url: cover && Rails.application.routes.url_helpers.rails_blob_path(cover, only_path: true)
      }
    end
  end
end
