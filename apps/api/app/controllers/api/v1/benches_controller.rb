module Api
  module V1
    class BenchesController < ApplicationController
      before_action :require_authentication!, only: [:create, :update, :destroy]
      before_action :set_bench, only: [:show, :update, :destroy]
      before_action :authorize_owner!, only: [:update, :destroy]

      def index
        benches = params[:sort] == "top_rated" ? Bench.top_rated : Bench.recent
        benches = paginate(benches).preload(:user, :ratings, :comments, photos_attachments: :blob)
        render json: BenchBlueprint.render_as_hash(benches)
      end

      def show
        comments = paginate(@bench.comments.includes(:user).order(created_at: :asc))
        render json: {
          bench: BenchBlueprint.render_as_hash(@bench),
          ratings: RatingBlueprint.render_as_hash(@bench.ratings.includes(:user)),
          comments: CommentBlueprint.render_as_hash(comments)
        }
      end

      def create
        bench = current_user.benches.build(bench_params)
        if bench.save
          bench.photos.attach(params[:photos]) if params[:photos]
          render json: BenchBlueprint.render_as_hash(bench), status: :created
        else
          render json: { errors: bench.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @bench.update(bench_params)
          @bench.photos.attach(params[:photos]) if params[:photos]
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

      def authorize_owner!
        render json: { error: "Forbidden" }, status: :forbidden unless @bench.user_id == current_user.id
      end

      def bench_params
        params.permit(:title, :description, :latitude, :longitude, :location_name)
      end
    end
  end
end
