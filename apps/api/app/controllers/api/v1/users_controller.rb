module Api
  module V1
    class UsersController < ApplicationController
      before_action :require_authentication!, only: [:update]
      before_action :set_user

      def show
        preload = { discoverer: {}, visits: { photos_attachments: :blob } }
        discovered = @user.discovered_benches.recent.includes(preload)
        visited = @user.benches.distinct.recent.includes(preload)
        render json: {
          user: UserBlueprint.render_as_hash(@user, view: :normal),
          discovered: BenchBlueprint.render_as_hash(discovered),
          visited: BenchBlueprint.render_as_hash(visited)
        }
      end

      def update
        return render json: { error: "Forbidden" }, status: :forbidden unless @user.id == current_user.id

        if @user.update(user_params)
          @user.avatar.attach(params[:avatar]) if params[:avatar] && @user.respond_to?(:avatar)
          render json: { user: UserBlueprint.render_as_hash(@user, view: :normal) }
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_user
        @user = User.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "User not found" }, status: :not_found
      end

      def user_params
        params.permit(:username, :bio)
      end
    end
  end
end
