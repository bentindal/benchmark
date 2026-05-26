module Api
  module V1
    class BenchesController < ApplicationController
      before_action :require_authentication!, only: [:create, :update, :destroy]
      before_action :set_bench, only: [:show, :update, :destroy]
      before_action :authorize_discoverer!, only: [:update, :destroy]

      def index
        benches = params[:sort] == "top_rated" ? Bench.top_rated : Bench.recent
        benches = paginate(benches).preload(:discoverer, visits: { photos_attachments: :blob })
        render json: BenchBlueprint.render_as_hash(benches)
      end

      def show
        comments = paginate(@bench.comments.includes(:user).order(created_at: :asc))
        visits = @bench.visits.includes(:user, photos_attachments: :blob).order(created_at: :desc).to_a
        response = {
          bench: BenchBlueprint.render_as_hash(@bench),
          visits: VisitBlueprint.render_as_hash(visits),
          comments: CommentBlueprint.render_as_hash(comments)
        }
        if current_user
          own = visits.select { |v| v.user_id == current_user.id }
          response[:current_user_visits] = VisitBlueprint.render_as_hash(own)
        end
        render json: response
      end

      # Creating a bench also records the discoverer's first visit (photos + optional
      # rating + note) from the same multipart payload — a bench is never photo-less.
      def create
        bench = current_user.discovered_benches.build(bench_params)
        visit = bench.visits.build(visit_params.merge(user: current_user))
        visit.photos.attach(params[:photos]) if params[:photos]

        Bench.transaction do
          bench.save!
          visit.save!
        end
        render json: BenchBlueprint.render_as_hash(bench), status: :created
      rescue ActiveRecord::RecordInvalid
        errors = (bench.errors.full_messages + visit.errors.full_messages).uniq
        render json: { errors: errors }, status: :unprocessable_entity
      end

      def update
        if @bench.update(bench_params)
          render json: BenchBlueprint.render_as_hash(@bench)
        else
          render json: { errors: @bench.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @bench.destroy
        render json: { message: "Bench deleted successfully" }
      end

      def nearby
        lat = params[:lat]
        lng = params[:lng]
        radius = params[:radius] || 10

        if lat.blank? || lng.blank?
          return render json: { error: "lat and lng are required" }, status: :bad_request
        end

        benches = paginate(Bench.near(lat, lng, radius).order("distance_km ASC"))
        render json: BenchBlueprint.render_as_hash(benches)
      end

      private

      def set_bench
        @bench = Bench.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Bench not found" }, status: :not_found
      end

      def authorize_discoverer!
        render json: { error: "Forbidden" }, status: :forbidden unless @bench.discovered_by_id == current_user.id
      end

      def bench_params
        params.permit(:title, :description, :latitude, :longitude, :location_name)
      end

      def visit_params
        params.permit(:note, :view_score, :comfort_score, :location_score, :overall_score)
      end
    end
  end
end
