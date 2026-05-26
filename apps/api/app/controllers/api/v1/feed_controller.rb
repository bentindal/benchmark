module Api
  module V1
    class FeedController < ApplicationController
      before_action :require_authentication!

      # The feed is visit activity ("X visited <bench>"), newest first.
      def index
        visits = paginate(
          Visit.order(created_at: :desc)
               .includes(:user, bench: :discoverer, photos_attachments: :blob)
        )
        render json: VisitBlueprint.render_as_hash(visits, view: :with_bench)
      end
    end
  end
end
