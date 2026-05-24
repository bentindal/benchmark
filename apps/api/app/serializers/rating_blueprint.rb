class RatingBlueprint < Blueprinter::Base
  identifier :id
  fields :view_score, :comfort_score, :location_score, :overall_score,
         :user_id, :bench_id, :created_at
end
