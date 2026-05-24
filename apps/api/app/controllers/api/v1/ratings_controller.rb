module Api
  module V1
    class RatingsController < ApplicationController
      before_action :set_bench
      before_action :require_authentication!, only: [:create, :update]

      def index
        ratings = @bench.ratings.includes(:user)
        response_data = { ratings: RatingBlueprint.render_as_hash(ratings) }
        if current_user
          own = @bench.ratings.find_by(user: current_user)
          response_data[:current_user_rating] = own ? RatingBlueprint.render_as_hash(own) : nil
        end
        render json: response_data
      end

      def create
        upsert_rating
      end

      def update
        upsert_rating
      end

      private

      def upsert_rating
        rating = Rating.find_or_initialize_by(user: current_user, bench: @bench)
        rating.assign_attributes(rating_params)
        if rating.save
          render json: RatingBlueprint.render_as_hash(rating), status: :ok
        else
          render json: { errors: rating.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def set_bench
        @bench = Bench.find(params[:bench_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Bench not found" }, status: :not_found
      end

      def rating_params
        params.permit(:view_score, :comfort_score, :location_score, :overall_score)
      end
    end
  end
end
