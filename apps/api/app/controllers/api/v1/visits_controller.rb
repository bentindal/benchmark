module Api
  module V1
    class VisitsController < ApplicationController
      before_action :require_authentication!, only: [:create, :update, :destroy]
      before_action :set_bench, only: [:index, :create]
      before_action :set_visit, only: [:show, :update, :destroy]
      before_action :authorize_owner!, only: [:update, :destroy]

      def index
        visits = @bench.visits.includes(:user, photos_attachments: :blob).order(created_at: :desc)
        render json: VisitBlueprint.render_as_hash(visits)
      end

      # Check-in: add the current user's visit (photos + optional rating + note) to an existing bench.
      def create
        visit = @bench.visits.build(visit_params.merge(user: current_user))
        visit.photos.attach(params[:photos]) if params[:photos]
        if visit.save
          render json: VisitBlueprint.render_as_hash(visit), status: :created
        else
          render json: { errors: visit.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def show
        render json: VisitBlueprint.render_as_hash(@visit, view: :with_bench)
      end

      def update
        if @visit.update(visit_params)
          render json: VisitBlueprint.render_as_hash(@visit)
        else
          render json: { errors: @visit.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @visit.destroy
        render json: { message: "Visit deleted successfully" }
      end

      private

      def set_bench
        @bench = Bench.find(params[:bench_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Bench not found" }, status: :not_found
      end

      def set_visit
        @visit = Visit.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Visit not found" }, status: :not_found
      end

      def authorize_owner!
        render json: { error: "Forbidden" }, status: :forbidden unless @visit.user_id == current_user.id
      end

      def visit_params
        params.permit(:note, :view_score, :comfort_score, :location_score, :overall_score)
      end
    end
  end
end
