module Api
  module V1
    class FeedController < ApplicationController
      before_action :require_authentication!

      def index
        benches = paginate(
          Bench.recent.includes(:user, :ratings, :comments, photos_attachments: :blob)
        )
        render json: BenchBlueprint.render_as_hash(benches)
      end
    end
  end
end
